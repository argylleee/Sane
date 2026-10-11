// OWNER: frontend. Share, copy, read-aloud and "this looks wrong" controls for a finished result.
import { useEffect, useState } from 'react';
import { Copy, Share2, Square, ThumbsDown, Volume2 } from 'lucide-react';
import { canReadAloud, readAloud, stopReading } from '../a11y/speech';
import type { HistoryStore } from '../history/store';
import { buildReportText } from '../share/report';
import { renderCard, shareCard } from '../share/card';
import type { Lang, Verdict } from '../types';
import { copyFor } from './copy';
import { extraCopyFor } from './copyExtra';

const PANEL = 'clay-panel rounded-2xl p-6 space-y-4';
const ACTION =
  'w-full flex min-h-12 items-center justify-center gap-2 rounded-xl bg-surface px-4 py-3 text-sm font-bold text-text cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary';

export function ResultActions({
  verdict,
  message,
  lang,
}: {
  verdict: Verdict;
  message: string;
  lang: Lang;
}) {
  const text = extraCopyFor(lang);
  const base = copyFor(lang);
  const [status, setStatus] = useState<string | null>(null);
  const [speakable, setSpeakable] = useState(false);
  const [reading, setReading] = useState(false);
  const label = base.assessment[verdict.level].label;

  useEffect(() => {
    const update = () => setSpeakable(canReadAloud(lang));
    update();
    if (typeof speechSynthesis === 'undefined') return;
    speechSynthesis.addEventListener('voiceschanged', update);
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', update);
      stopReading();
    };
  }, [lang]);

  async function share() {
    setStatus(null);
    try {
      const blob = await renderCard({
        level: verdict.level,
        label,
        headline: base.assessment[verdict.level].summary,
        steps: verdict.explanation.steps,
        footer: text.cardFooter,
      });
      const result = await shareCard(blob, 'sane-check.png', 'Sane');
      setStatus(result === 'shared' ? text.shareReady : text.shareSaved);
    } catch {
      setStatus(text.shareFailed);
    }
  }

  async function copyReport() {
    setStatus(null);
    const report = buildReportText({
      title: text.reportTitle,
      checkedOn: text.reportChecked(new Date().toISOString().slice(0, 10)),
      result: text.reportResult(label),
      flagsTitle: text.reportFlags,
      flags: verdict.signals.filter(({ weight }) => weight > 0).map(({ label: flag }) => flag),
      messageTitle: text.reportMessage,
      message,
      detailsTitle: text.reportDetails,
      details: (verdict.findings ?? []).map(({ value, channel }) =>
        channel ? `${channel} ${value}` : value,
      ),
      footer: text.reportFooter,
    });
    try {
      await navigator.clipboard.writeText(report);
      setStatus(text.copyReportDone);
    } catch {
      setStatus(text.copyReportFailed);
    }
  }

  function toggleReading() {
    if (reading) {
      stopReading();
      setReading(false);
      return;
    }
    const steps = verdict.explanation.steps.join(' ');
    const assessment = base.assessment[verdict.level];
    const spoke = readAloud(`${label}. ${assessment.summary} ${steps}`, lang);
    setReading(spoke);
  }

  return (
    <section className={PANEL} aria-labelledby="actions-title">
      <h3 id="actions-title" className="font-bold text-text">
        {text.actionsTitle}
      </h3>
      <div className="grid gap-3">
        <button type="button" className={ACTION} onClick={share}>
          <Share2 size={18} aria-hidden="true" />
          {text.shareCard}
        </button>
        <p className="-mt-1 text-xs text-secondary">{text.shareCardHint}</p>
        <button type="button" className={ACTION} onClick={copyReport}>
          <Copy size={18} aria-hidden="true" />
          {text.copyReport}
        </button>
        {speakable && (
          <button type="button" className={ACTION} onClick={toggleReading} aria-pressed={reading}>
            {reading ? (
              <Square size={18} aria-hidden="true" />
            ) : (
              <Volume2 size={18} aria-hidden="true" />
            )}
            {reading ? text.stopReading : text.readAloud}
          </button>
        )}
      </div>
      <p className={status ? 'text-sm text-text' : 'sr-only'} role="status">
        {status}
      </p>
    </section>
  );
}

export function WrongVerdictCard({
  verdict,
  message,
  lang,
  store,
}: {
  verdict: Verdict;
  message: string;
  lang: Lang;
  store: HistoryStore;
}) {
  const text = extraCopyFor(lang);
  const [status, setStatus] = useState<string | null>(null);
  if (!message.trim()) return null; // A screenshot has no text to save.

  function save(userSays: 'scam' | 'fine') {
    const saved = store.addNote({ level: verdict.level, userSays, text: message });
    setStatus(saved ? text.wrongSaved : text.wrongFailed);
  }

  return (
    <section className={PANEL} aria-labelledby="wrong-title">
      <h3 id="wrong-title" className="flex items-center gap-2 font-bold text-text">
        <ThumbsDown size={18} aria-hidden="true" />
        {text.wrongTitle}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className={ACTION} onClick={() => save('scam')}>
          {text.wrongScam}
        </button>
        <button type="button" className={ACTION} onClick={() => save('fine')}>
          {text.wrongFine}
        </button>
      </div>
      <p className={status ? 'text-sm text-text' : 'sr-only'} role="status">
        {status}
      </p>
    </section>
  );
}
