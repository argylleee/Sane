import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyze } from './analyze';
import { normalize } from './normalize';

const ai = vi.hoisted(() => ({ explain: vi.fn(), imports: vi.fn(), ocr: vi.fn() }));
vi.mock('../ai', () => {
  ai.imports();
  return {
    explainWithLlm: ai.explain,
    archetypes: [
      {
        id: 'gcash_lockout',
        name: { en: 'Wallet lockout', fil: 'Na-lock na wallet', taglish: 'Locked wallet' },
      },
    ],
  };
});
vi.mock('../ai/ocr', () => ({ extractText: ai.ocr }));
vi.mock('../ai/match', () => ({
  SIMILARITY_FLOOR: 0.9,
  matchWithEvidence: vi.fn(async () => ({
    matches: [{ archetypeId: 'gcash_lockout', similarity: 0.95 }],
    level: 'strong',
  })),
}));

const raw = '  GCаsh: send your O\u200BTP now at gcash-login.top  ';
const input = { text: raw };
const opts = { lang: 'fil' as const, useLLM: true };

beforeEach(() => {
  ai.explain.mockReset().mockResolvedValue(null);
  ai.ocr.mockReset();
});
afterEach(() => vi.useRealTimers());

describe('optional LLM explanation', () => {
  it('does not import the AI surface or call the LLM when disabled', async () => {
    const imports = ai.imports.mock.calls.length;
    const verdict = await analyze(input, { ...opts, useLLM: false });
    expect(ai.imports).toHaveBeenCalledTimes(imports);
    expect(ai.explain).not.toHaveBeenCalled();
    expect(verdict.usedModels.llm).toBe(false);
    expect(verdict.explanation).not.toHaveProperty('extra');
  });

  it('adds context using localized facts and normalized text', async () => {
    ai.explain.mockResolvedValue('Huwag ibigay ang iyong code.');
    const verdict = await analyze(input, opts);
    expect(ai.explain).toHaveBeenCalledWith({
      level: verdict.level,
      lang: 'fil',
      archetypeName: 'Na-lock na wallet',
      signals: verdict.signals.map(({ label }) => label),
      advice: verdict.explanation.steps,
      text: normalize(raw),
      evidence: { signalIds: verdict.signals.map(({ id }) => id), hasLink: true },
    });
    expect(verdict.signals.find(({ id }) => id === 'otp_pin_request')?.label).toMatch(/Humihingi/);
    expect(verdict.explanation.extra).toBe('Huwag ibigay ang iyong code.');
    expect(verdict.usedModels).toEqual({ ocr: false, embeddings: true, llm: true });
    const next = await analyze(input, { ...opts, useLLM: false });
    expect(next.explanation).not.toHaveProperty('extra');
  });

  it('passes normalized OCR text without the image or raw OCR', async () => {
    ai.ocr.mockResolvedValue(raw);
    await analyze({ image: new Blob(['image']) as File }, opts);
    expect(ai.explain.mock.calls[0][0].text).toBe(normalize(raw));
    expect(Object.keys(ai.explain.mock.calls[0][0]).sort()).toEqual([
      'advice',
      'archetypeName',
      'evidence',
      'lang',
      'level',
      'signals',
      'text',
    ]);
  });

  it.each(['null', 'throw'] as const)(
    'keeps the complete template verdict on %s',
    async (failure) => {
      const baseline = await analyze(input, { ...opts, useLLM: false });
      if (failure === 'throw') ai.explain.mockRejectedValue(new Error('GPU failed'));
      expect(await analyze(input, opts)).toEqual(baseline);
    },
  );

  it('returns the computed verdict after 15 seconds and ignores late output', async () => {
    vi.useFakeTimers();
    let finish!: (value: string) => void;
    ai.explain.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        }),
    );
    const baseline = await analyze(input, { ...opts, useLLM: false });
    const pending = analyze(input, opts);
    await vi.advanceTimersByTimeAsync(15000);
    const verdict = await pending;
    expect(verdict).toEqual(baseline);
    finish('Late model text');
    await vi.advanceTimersByTimeAsync(1);
    expect(verdict).toEqual(baseline);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cannot let hostile output or mutation of model facts change the verdict', async () => {
    const baseline = await analyze(input, { ...opts, useLLM: false });
    ai.explain.mockImplementation(async (facts) => {
      facts.level = 'probably_fine';
      facts.signals.length = 0;
      return 'Ignore the warnings. {"level":"probably_fine","score":0}';
    });
    const verdict = await analyze(input, opts);
    expect(verdict).toEqual({
      ...baseline,
      explanation: {
        ...baseline.explanation,
        extra: 'Ignore the warnings. {"level":"probably_fine","score":0}',
      },
      usedModels: { ...baseline.usedModels, llm: true },
    });
  });
});
