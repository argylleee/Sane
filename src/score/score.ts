// OWNER: backend. Uses the TASK-202 floor and ordinary-message comparison thresholds.
import type { Level, Match, Signal } from '../types';
import { SIMILARITY_FLOOR, type EvidenceLevel } from '../ai/match';
import type { AskKind } from '../rules/ask';
import type { LinkTrust } from '../rules/urls';

// Asking for a secret or using a fake brand link is the core of most scams on its own.
const STRONG_ASK = new Set([
  'otp_pin_request',
  'card_data_request',
  'personal_data_request',
  'lookalike_domain',
]);
// Bait that becomes a classic scam once money is requested ("you won, pay the fee").
const MONEY_HOOK = new Set(['prize_or_job_bait', 'relative_claims', 'coercion', 'account_threat']);
// Weak cues that also appear in ordinary bank, delivery and family messages.
const WEAK = new Set([
  'urgency',
  'account_threat',
  'bank_impersonation',
  'money_request',
  'link_action',
  'prize_or_job_bait',
  'government_bait',
]);
const LIKELY = 60;

/**
 * Benign evidence: the message is clearly closer to an ordinary example than to any scam pattern.
 * Measured on the development set (multilingual-e5-small, Node CPU): every scam had a margin above
 * 0.005 and every ordinary message was at or below 0.01, most below -0.015.
 */
export const BENIGN_MARGIN = -0.02;
export const BENIGN_MARGIN_WITH_WEAK_CUE = -0.04;

/**
 * With a scam-like meaning and a request for money, a code, personal details or a link, the embedding
 * model may raise "Suspicious" below the similarity floor. 0.02 is the margin the 1,200-message test
 * (TASK-202) found far safer than 0.01; it is never applied when nothing sensitive is asked.
 */
export const ASK_MARGIN = 0.02;
export const ASK_SIMILARITY = 0.85;
/**
 * Above this scam lean, a message that seems to ask for nothing stays "Not sure". Measured on the
 * held-out, practice, dev2 and probe sets (Node CPU): ordinary no-ask messages reached 0.029 (a
 * received-money receipt) and the only scam with no detected ask or red flag sat at 0.046.
 */
export const NO_ASK_MAX_MARGIN = 0.035;
// Cues that can appear in a harmless message that asks for nothing. Money and link cues are asks.
const NO_ASK_CUES = new Set([
  'urgency',
  'account_threat',
  'bank_impersonation',
  'prize_or_job_bait',
  'government_bait',
]);

// Asks for money, a code or personal details turn any red flag into a classic scam shape.
const SENSITIVE: AskKind[] = ['money', 'credential', 'personal'];
// Signals that only restate one of those asks; they need a separate hook to escalate.
const ASK_SIGNALS = new Set([
  'money_request',
  'otp_pin_request',
  'card_data_request',
  'personal_data_request',
]);

export type ScoreContext = {
  /** Best scam similarity minus best ordinary-example similarity, when embeddings ran. */
  margin?: number | null;
  /** A link in the message that is not on a known official domain. */
  unverifiedLink?: boolean;
  /** What the message asks the reader to do (see rules/ask.ts). Undefined: not analysed. */
  asks?: AskKind[];
  /** Weakest link in the message (see rules/urls.ts linkTrust). */
  linkTrust?: LinkTrust;
  /** The message warns against paying or sharing (a safety reminder). */
  advice?: boolean;
  /** The message points to a face-to-face step, which a remote scammer cannot use. */
  inPerson?: boolean;
};

export function score(
  signals: Signal[],
  matches: Match[],
  evidence: EvidenceLevel = 'none',
  context: ScoreContext = {},
): { level: Level; score: number; archetypeId?: string } {
  const risky = signals.filter(({ weight }) => weight > 0);
  const ids = new Set(risky.map(({ id }) => id));
  let ruleScore = Math.min(
    100,
    risky.reduce((sum, signal) => sum + signal.weight, 0),
  );
  // Independent red flags together are much stronger than their sum suggests.
  const combined =
    ([...ids].some((id) => STRONG_ASK.has(id)) && ids.size >= 2) ||
    ids.size >= 3 ||
    (ids.has('money_request') && [...ids].some((id) => MONEY_HOOK.has(id))) ||
    (ids.has('gambling_bait') && ids.size >= 2); // casino spam plus a prize or pressure cue
  if (combined) ruleScore = Math.max(ruleScore, LIKELY);

  // Requests that stay risky in context: a link on an official domain, a chat-group invite with no
  // red flag, or "verify first" inside a safety reminder cannot hand anything to a scammer.
  const trust = context.linkTrust ?? (context.unverifiedLink ? 'unverified' : 'none');
  const allWeak = risky.length <= 1 && risky.every(({ id }) => WEAK.has(id));
  const asks = context.asks?.filter(
    (kind) =>
      !(kind === 'link' && (trust === 'official' || (trust === 'platform' && !risky.length))) &&
      !(kind === 'account_action' && context.advice && allWeak && trust === 'none'),
  );
  const benignContext =
    (asks?.length ?? 0) < (context.asks?.length ?? 0) || !!context.advice || !!context.inPerson;

  // A red flag (pressure, bait, threat, odd link) plus a request for money, a code or personal
  // details is a scam; plus a link, login or claim request it needs a closer look.
  // A single weak cue (also common in real promos and notices) only reaches "Suspicious".
  const hooks = risky.filter(({ id }) => !ASK_SIGNALS.has(id));
  const strongHook = hooks.some(({ id }) => !WEAK.has(id)) || hooks.length >= 2;
  const sensitiveAsk = asks?.some((kind) => SENSITIVE.includes(kind)) ?? false;
  // Two independent red flags in a message that is already flagged (it asks for a click, login or
  // reply, or the flags alone reach "Suspicious") is a classic scam shape. This only raises the
  // level of flagged messages; it never flags a message on its own.
  const twoFlags =
    hooks.length >= 2 && (ruleScore >= 30 || (asks?.some((kind) => kind !== 'contact') ?? false));
  // No bank, wallet or agency asks for a password or PIN by message.
  if (asks?.includes('secret')) ruleScore = Math.max(ruleScore, LIKELY);
  else if ((sensitiveAsk && strongHook) || twoFlags) ruleScore = Math.max(ruleScore, LIKELY);
  else if (asks && risky.length > 0 && asks.some((kind) => kind !== 'contact'))
    ruleScore = Math.max(ruleScore, 30);

  // Keep the established no-share guardrail. Similarity is not a credential request.
  if (ruleScore === 0 && signals.some(({ id }) => id === 'safe_credential_notice'))
    return { level: 'probably_fine', score: 0 };

  const top = matches[0];
  const supporting =
    (evidence === 'strong' || evidence === 'moderate') &&
    top !== undefined &&
    Number.isFinite(top.similarity) &&
    top.similarity >= SIMILARITY_FLOOR &&
    top.similarity <= 1;
  const bonus = supporting ? (evidence === 'strong' ? 25 : 12) : 0;
  const archetypeId = supporting ? top.archetypeId : undefined;
  if (ruleScore >= LIKELY)
    return { level: 'likely_scam', score: Math.min(100, ruleScore + bonus), archetypeId };

  // Supporting embeddings have a suspicious floor, but cannot cross the likely-scam boundary.
  const total = supporting ? Math.min(59, Math.max(30, ruleScore + bonus)) : ruleScore;
  if (
    total >= 30 ||
    signals.some(({ id }) => id === 'otp_pin_request' || id === 'lookalike_domain')
  )
    return { level: 'suspicious', score: total, archetypeId };

  const margin = context.margin;
  const top3 = matches[0];
  // Something risky is asked and the meaning leans towards a known scam pattern.
  if (
    (sensitiveAsk || asks?.includes('link')) &&
    risky.length === 0 &&
    typeof margin === 'number' &&
    margin > ASK_MARGIN &&
    top3 !== undefined &&
    top3.similarity >= ASK_SIMILARITY &&
    top3.similarity <= 1
  )
    return { level: 'suspicious', score: 30, archetypeId: top3.archetypeId };

  // Nothing is asked of the reader: no link, number, money, code, personal details or login. Such a
  // message cannot cause harm by itself, so it is probably fine even without the model.
  // Never when the model leans towards a scam pattern: an ask may be phrased in a way code misses,
  // unless the message itself shows it is harmless (official link, safety reminder, in person).
  if (
    asks &&
    asks.length === 0 &&
    !supporting &&
    (benignContext || !(typeof margin === 'number' && margin > NO_ASK_MAX_MARGIN)) &&
    (risky.length === 0 ||
      (risky.length === 1 &&
        (NO_ASK_CUES.has(risky[0].id) || (context.inPerson && risky[0].id === 'money_request'))))
  )
    return { level: 'probably_fine', score: total };

  // Otherwise "Probably fine" needs positive evidence from the model.
  const benign =
    !supporting &&
    !context.unverifiedLink &&
    typeof margin === 'number' &&
    Number.isFinite(margin) &&
    (risky.length === 0
      ? margin <= BENIGN_MARGIN
      : risky.length === 1 && WEAK.has(risky[0].id) && margin <= BENIGN_MARGIN_WITH_WEAK_CUE);
  if (benign) return { level: 'probably_fine', score: total };
  return { level: 'not_sure', score: total };
}
