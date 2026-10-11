import { describe, expect, it } from 'vitest';
import { buildBreakdown } from './breakdown';
import type { Verdict } from '../types';

const base: Verdict = {
  level: 'likely_scam',
  score: 80,
  signals: [
    { id: 'urgency', label: 'Pressure to act fast', weight: 15 },
    { id: 'otp_pin_request', label: 'Asks for a one-time code', weight: 35 },
    { id: 'safe_credential_notice', label: 'Says not to share a code', weight: 0 },
  ],
  matches: [
    { archetypeId: 'otp_request', similarity: 0.874 },
    { archetypeId: 'gcash_lockout', similarity: 0.8 },
  ],
  lang: 'en',
  explanation: { headline: '', steps: [] },
  usedModels: { ocr: false, embeddings: true, llm: false },
};

describe('buildBreakdown', () => {
  it('orders code flags by weight and separates calming cues', () => {
    const result = buildBreakdown(base);
    expect(result.flags.map(({ weight }) => weight)).toEqual([35, 15]);
    expect(result.calming).toEqual(['Says not to share a code']);
  });

  it('shows the meaning match only when the model ran', () => {
    expect(buildBreakdown(base).meaning).toEqual([
      { archetypeId: 'otp_request', percent: 87 },
      { archetypeId: 'gcash_lockout', percent: 80 },
    ]);
    const without = buildBreakdown({
      ...base,
      usedModels: { ocr: false, embeddings: false, llm: false },
    });
    expect(without.meaning).toEqual([]);
    expect(without.usedMeaning).toBe(false);
  });

  it('says whether the writer ran', () => {
    expect(
      buildBreakdown({ ...base, usedModels: { ...base.usedModels, llm: true } }).usedWriter,
    ).toBe(true);
  });
});
