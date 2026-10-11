// OWNER: frontend. Splits a finished verdict into who decided what, for the "Why this verdict"
// card. Code finds the facts, the meaning match is supporting evidence, and the language model
// only writes the optional explanation (RULES 11). This reads the verdict; it never changes it.
import type { Verdict } from '../types';

export type Breakdown = {
  /** Red flags found by code, strongest first. */
  flags: { label: string; weight: number }[];
  /** Cues that lower worry, such as a "never share your code" reminder. */
  calming: string[];
  /** Closest scam patterns by meaning. Empty when the meaning model did not run. */
  meaning: { archetypeId: string; percent: number }[];
  usedMeaning: boolean;
  usedWriter: boolean;
};

export function buildBreakdown(verdict: Verdict): Breakdown {
  const flags = verdict.signals
    .filter(({ weight }) => weight > 0)
    .map(({ label, weight }) => ({ label, weight }))
    .sort((a, b) => b.weight - a.weight);
  const calming = verdict.signals.filter(({ weight }) => weight === 0).map(({ label }) => label);
  const meaning = verdict.usedModels.embeddings
    ? verdict.matches
        .filter(({ similarity }) => Number.isFinite(similarity))
        .slice(0, 3)
        .map(({ archetypeId, similarity }) => ({
          archetypeId,
          percent: Math.max(0, Math.min(100, Math.round(similarity * 100))),
        }))
    : [];
  return {
    flags,
    calming,
    meaning,
    usedMeaning: verdict.usedModels.embeddings,
    usedWriter: verdict.usedModels.llm,
  };
}
