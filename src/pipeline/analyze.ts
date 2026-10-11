// OWNER: backend (orchestration and fallbacks). Contract: src/types.ts.
import type { AnalyzeInput, AnalyzeOptions, Verdict } from '../types';
import { extractText } from '../ai/ocr';
import { matchWithEvidence, type MatchWithEvidence } from '../ai/match';
import { explain, localizeSignals } from '../explain/templates';
import { runRules } from '../rules';
import { findAsks, givesSafetyAdvice, goesInPerson } from '../rules/ask';
import { findDetails } from '../rules/details';
import { hasUnverifiedUrl, hasUrl, linkTrust } from '../rules/urls';
import { BENIGN_NOTICES, NOTICE_BREAKING, score } from '../score/score';
import { normalize } from './normalize';

function fallback(opts: AnalyzeOptions, ocrFailed = false): Verdict {
  const explanation = explain('not_sure', opts.lang);
  return {
    level: 'not_sure',
    score: 0,
    signals: [],
    matches: [],
    lang: opts.lang,
    explanation: ocrFailed
      ? {
          ...explanation,
          steps: [
            {
              en: 'Could not read the image. Paste the message text instead.',
              fil: 'Hindi mabasa ang larawan. I-paste na lang ang mensahe.',
              taglish: 'Hindi mabasa ang image. I-paste na lang ang message.',
            }[opts.lang],
            ...explanation.steps,
          ],
        }
      : explanation,
    usedModels: { ocr: false, embeddings: false, llm: false },
  };
}

export async function analyze(input: AnalyzeInput, opts: AnalyzeOptions): Promise<Verdict> {
  try {
    let ocr = false;
    let raw: string;
    if ('text' in input) {
      raw = input.text;
    } else {
      raw = await extractText(input.image); // throws -> not_sure; the UI asks the user to paste
      ocr = true;
    }
    const text = normalize(raw);
    if (!text) return fallback(opts);

    const signals = runRules(text);
    let evidence: MatchWithEvidence | null = null;
    try {
      evidence = await matchWithEvidence(text);
    } catch {
      // Fallback 1: embeddings failed, so score from rules only.
    }

    const matches = evidence?.matches ?? [];
    const asks = findAsks(text);
    const trust = linkTrust(text);
    const {
      level,
      score: total,
      archetypeId,
    } = score(signals, matches, evidence?.level, {
      margin: evidence?.margin,
      unverifiedLink: hasUnverifiedUrl(text),
      asks,
      linkTrust: trust,
      advice: givesSafetyAdvice(text),
      inPerson: goesInPerson(text),
    });
    // A reassurance such as "paid only on delivery" is not shown for a message that also asks for
    // money, details, a call or a link visit: that claim would not hold for the message as a whole.
    const shown = asks.some(
      (kind) => NOTICE_BREAKING.includes(kind) && !(kind === 'link' && trust === 'official'),
    )
      ? signals.filter(({ id }) => id === 'safe_credential_notice' || !BENIGN_NOTICES.has(id))
      : signals;
    const verdict: Verdict = {
      level,
      score: total,
      signals: localizeSignals(shown, opts.lang),
      matches,
      archetypeId,
      lang: opts.lang,
      explanation: explain(level, opts.lang, shown),
      usedModels: { ocr, embeddings: evidence !== null, llm: false },
      findings: findDetails(text),
    };
    return opts.useLLM ? await addLlmExplanation(verdict, text) : verdict;
  } catch {
    return fallback(opts, 'image' in input); // Fallback 4: never show a blank screen.
  }
}

/**
 * Adds the on-device LLM explanation to a finished verdict. The UI calls this after showing the
 * verdict so the result never waits for the model. Returns the same verdict when the model is not
 * ready, too slow, fails, or writes something unsafe; the level and steps never change.
 */
export async function addLlmExplanation(verdict: Verdict, text: string): Promise<Verdict> {
  if (!text) return verdict;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const extra = await Promise.race([
      (async () => {
        const { explainWithLlm, archetypes } = await import('../ai');
        return explainWithLlm({
          level: verdict.level,
          lang: verdict.lang,
          archetypeName: archetypes.find(({ id }) => id === verdict.archetypeId)?.name[
            verdict.lang
          ],
          signals: verdict.signals.filter(({ weight }) => weight > 0).map(({ label }) => label),
          advice: verdict.explanation.steps,
          text,
          evidence: { signalIds: verdict.signals.map(({ id }) => id), hasLink: hasUrl(text) },
        });
      })(),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), 15000);
      }),
    ]);
    if (extra === null) return verdict;
    return {
      ...verdict,
      explanation: { ...verdict.explanation, extra },
      usedModels: { ...verdict.usedModels, llm: true },
    };
  } catch {
    return verdict; // The explanation must never replace the computed verdict.
  } finally {
    clearTimeout(timer);
  }
}
