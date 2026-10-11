import { beforeEach, describe, expect, it, vi } from 'vitest';
import { matchWithEvidence, type MatchWithEvidence } from '../ai/match';
import developmentSet from '../../eval/testset.json';
import type { Lang } from '../types';
import { analyze } from './analyze';
import { normalize } from './normalize';

vi.mock('../ai/match', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../ai/match')>()),
  matchWithEvidence: vi.fn(),
}));

const match = vi.mocked(matchWithEvidence);
// Harmless, but asks the reader to call, so the no-request rule does not decide it.
const CONTACT = 'Call me at 09171234567 tomorrow.';
const opts = { lang: 'en' as const, useLLM: false };
const evidence = (
  similarity = 0.94,
  margin: number | null = 0.03,
  level: MatchWithEvidence['level'] = 'strong',
): MatchWithEvidence => ({
  matches: [{ archetypeId: 'relative_emergency', similarity }],
  benign: margin === null ? null : similarity - margin,
  margin,
  level,
});

beforeEach(() => {
  match.mockReset();
  match.mockResolvedValue(null);
});

describe('embedding evidence in analyze()', () => {
  it.each(['en', 'fil', 'taglish'] as const)(
    'raises a rules-only abstention to suspicious with a %s pattern match',
    async (lang) => {
      match.mockResolvedValue(evidence());
      const verdict = await analyze({ text: 'Can you help me out?' }, { ...opts, lang });
      expect(verdict.level).toBe('suspicious');
      expect(verdict.score).toBeGreaterThanOrEqual(30);
      expect(verdict.score).toBeLessThan(60);
      expect(verdict.archetypeId).toBe('relative_emergency');
      expect(verdict.explanation.extra).toBeUndefined();
      expect(verdict.signals).toEqual([]);
      expect(verdict.usedModels).toEqual({ ocr: false, embeddings: true, llm: false });
      expect(match).toHaveBeenCalledExactlyOnceWith('Can you help me out?');
    },
  );

  it.each([
    [0.899, 0.03, 'strong'],
    [0.94, -0.01, 'none'],
    [0.94, 0.005, 'none'],
    [0.94, null, 'none'],
    [Number.NaN, 0.03, 'strong'],
    [Number.POSITIVE_INFINITY, 0.03, 'strong'],
    [1.1, 0.03, 'strong'],
  ] as const)('abstains on similarity %s, margin %s, evidence %s', async (sim, margin, level) => {
    const result = evidence(sim, margin, level);
    match.mockResolvedValue(result);
    const verdict = await analyze({ text: CONTACT }, opts);
    expect(verdict.level).toBe('not_sure');
    expect(verdict.score).toBe(0);
    expect(verdict.matches).toEqual(result.matches);
    expect(verdict.usedModels.embeddings).toBe(true);
    expect(verdict.archetypeId).toBeUndefined();
    expect(verdict.explanation.extra).toBeUndefined();
  });

  it('accepts the similarity floor with moderate ordinary-message comparison evidence', async () => {
    match.mockResolvedValue(evidence(0.9, 0.015, 'moderate'));
    const verdict = await analyze({ text: 'Can you help me out?' }, opts);
    expect(verdict.level).toBe('suspicious');
    expect(verdict.score).toBe(30);
  });

  it('keeps model execution true even when inference returns no archetype matches', async () => {
    match.mockResolvedValue({ matches: [], benign: 0.9, margin: null, level: 'none' });
    const verdict = await analyze({ text: CONTACT }, opts);
    expect(verdict.level).toBe('not_sure');
    expect(verdict.usedModels.embeddings).toBe(true);
    expect(verdict.matches).toEqual([]);
  });

  it('never promotes a sub-60 rule score to likely_scam with embedding help', async () => {
    match.mockResolvedValue(evidence());
    const verdict = await analyze({ text: 'Please send your OTP to me.' }, opts);
    expect(verdict.level).toBe('suspicious');
    expect(verdict.score).toBe(59);
  });

  it('retains likely_scam from rules even when embeddings favor an ordinary message', async () => {
    match.mockResolvedValue(evidence(0.94, -0.01, 'none'));
    const verdict = await analyze({ text: 'GCash: send OTP now at gcash-login.top' }, opts);
    expect(verdict.level).toBe('likely_scam');
    expect(verdict.archetypeId).toBeUndefined();
  });

  it('keeps the established no-share notice guardrail', async () => {
    match.mockResolvedValue(evidence());
    const verdict = await analyze({ text: 'Your OTP is 123456. Do not share this code.' }, opts);
    expect(verdict.level).toBe('probably_fine');
    expect(verdict.score).toBe(0);
    expect(verdict.archetypeId).toBeUndefined();
    expect(verdict.explanation.extra).toBeUndefined();
  });

  it('uses normalized input and preserves normalized signal offsets with model evidence', async () => {
    match.mockResolvedValue(evidence());
    const text = '  GCаsh: pa-send mo ang O\u200BTP sa gcash-login.top ngayon na.  ';
    const verdict = await analyze({ text }, { ...opts, lang: 'taglish' });
    const normalized = normalize(text);
    expect(match).toHaveBeenCalledExactlyOnceWith(normalized);
    const otp = verdict.signals.find(({ id }) => id === 'otp_pin_request')!;
    expect(otp.span).toBeDefined();
    expect(normalized.slice(...otp.span!)).toMatch(/OTP/i);
    expect(otp.label).toMatch(/Humihingi/);
  });

  it('says probably fine only with clear ordinary-message evidence and no risk signal', async () => {
    match.mockResolvedValue(evidence(0.86, -0.03, 'none'));
    expect((await analyze({ text: CONTACT }, opts)).level).toBe('probably_fine');
    match.mockResolvedValue(evidence(0.86, -0.015, 'none'));
    expect((await analyze({ text: CONTACT }, opts)).level).toBe('not_sure');
  });

  it('never says probably fine for an unknown link or a credential request', async () => {
    match.mockResolvedValue(evidence(0.86, -0.09, 'none'));
    const link = await analyze({ text: 'Photos from the party: myalbum-share.net/p/1' }, opts);
    expect(link.level).toBe('not_sure');
    const otp = await analyze({ text: 'Please send your OTP to me.' }, opts);
    expect(otp.level).toBe('suspicious');
    const official = await analyze(
      { text: 'Your bill is ready. See gcash.com for details.' },
      opts,
    );
    expect(official.level).toBe('probably_fine');
  });

  it('allows one weak cue only with much stronger ordinary-message evidence', async () => {
    const text = 'Paalala: sale ends today only, call me at 09171234567.';
    match.mockResolvedValue(evidence(0.86, -0.03, 'none'));
    expect((await analyze({ text }, opts)).level).toBe('not_sure');
    match.mockResolvedValue(evidence(0.86, -0.05, 'none'));
    expect((await analyze({ text }, opts)).level).toBe('probably_fine');
  });

  it('does not look up the model for empty input', async () => {
    const verdict = await analyze({ text: '  ' }, opts);
    expect(verdict.level).toBe('not_sure');
    expect(verdict.usedModels.embeddings).toBe(false);
    expect(match).not.toHaveBeenCalled();
  });
});

describe('30-message development-set regression gate', () => {
  it.each(['unavailable', 'failed', 'ordinary'] as const)(
    'preserves recall and false alarms when embeddings are %s',
    async (mode) => {
      if (mode === 'failed') match.mockRejectedValue(new Error('Embedding request timed out.'));
      if (mode === 'ordinary') match.mockResolvedValue(evidence(0.94, -0.01, 'none'));
      const counts = { caught: 0, scams: 0, falseAlarms: 0, legit: 0, abstained: 0 };
      for (const item of developmentSet) {
        const verdict = await analyze({ text: item.text }, { ...opts, lang: item.lang as Lang });
        const flagged = verdict.level === 'suspicious' || verdict.level === 'likely_scam';
        if (item.expected === 'probably_fine') {
          counts.legit++;
          if (flagged) counts.falseAlarms++;
        } else {
          counts.scams++;
          if (flagged) counts.caught++;
        }
        if (verdict.level === 'not_sure') counts.abstained++;
        expect(verdict.usedModels.embeddings).toBe(mode === 'ordinary');
      }
      expect(counts.scams).toBe(15);
      expect(counts.legit).toBe(15);
      expect(counts.caught).toBe(15);
      expect(counts.falseAlarms).toBe(0);
      // Was 14 before the no-request rule: ordinary messages that ask for nothing are now fine.
      expect(counts.abstained).toBeLessThanOrEqual(3);
    },
  );
});
