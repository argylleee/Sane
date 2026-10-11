// Shared contract from .agents/skills/architecture. Integration owns this file.
// Change it only through a serialized shared change; all three streams build against it.
export type Lang = 'en' | 'fil' | 'taglish';

export type Level = 'likely_scam' | 'suspicious' | 'probably_fine' | 'not_sure';

export type Signal = { id: string; label: string; weight: number; span?: [number, number] };

export type Match = { archetypeId: string; similarity: number };

/**
 * Facts code finds in the message that are shown to the reader as details. They never change the
 * level: the scoring thresholds were measured without them (see src/rules/details.ts).
 */
export type Finding = {
  kind: 'phone_ph' | 'phone_foreign' | 'payment_account';
  value: string;
  /** Wallet or bank named next to a payment account, such as "GCash". */
  channel?: string;
  /** The message tells the reader to send money to this number or account. */
  askedToPay: boolean;
};

export type Verdict = {
  level: Level;
  score: number; // 0..100
  signals: Signal[];
  matches: Match[]; // top 3
  archetypeId?: string;
  lang: Lang;
  explanation: { headline: string; steps: string[]; extra?: string };
  usedModels: { ocr: boolean; embeddings: boolean; llm: boolean };
  /** Numbers and payment accounts found in the message. Informational only. */
  findings?: Finding[];
};

export type AnalyzeInput = { text: string } | { image: File };

export type AnalyzeOptions = { lang: Lang; useLLM: boolean };
