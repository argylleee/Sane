// OWNER: model. Context evaluation: legitimate notices, payment reminders, security alerts,
// scam-awareness messages, scams and ambiguous messages in English, Filipino and Taglish.
// The opt-in run never asserts an accuracy target. Usage (PowerShell):
//   $env:EVAL_CONTEXT = '1'; $env:EVAL_EMBEDDINGS = '1'; $env:CONTEXT_OUTPUT = 'eval/context/results.json'
//   npx vitest run eval/context/run.context.test.ts
// EVAL_EMBEDDINGS=1 rebuilds the shipped multilingual-e5-small model from public/models into the
// OS temp folder, checks its SHA-256 against the manifest and runs it on CPU. Nothing is downloaded.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';
import type { Embed } from '../../src/ai/embedder';
import { analyze } from '../../src/pipeline/analyze';
import type { Lang, Level } from '../../src/types';
import { summarize, type Row } from '../heldout/metrics';

const adapter = vi.hoisted(() => ({ embed: undefined as Embed | undefined }));
vi.mock('../../src/ai/embedClient', () => ({
  getEmbeddingsStatus: () => ({ state: adapter.embed ? 'ready' : 'idle', progress: 0 }),
  embedTexts: (texts: string[], kind: 'query' | 'passage') => {
    if (!adapter.embed) throw new Error('No real embedding model loaded.');
    return adapter.embed(texts, kind);
  },
}));

type Case = { id: string; lang: Lang; expected: Level; category?: string; text: string };

// Context sets first, then the earlier sets as regression checks. Only the context holdout is
// frozen for this work; the other files were available while rules were changed.
const SETS: Record<string, string> = {
  contextDev: 'eval/context/dev.json',
  contextHoldout: 'eval/context/holdout.json',
  testset: 'eval/testset.json',
  dev2: 'eval/dev2.json',
  heldout: 'eval/heldout/heldout.json',
  demo: 'eval/demo-cases.json',
  obfuscationDev: 'eval/obfuscation/dev.json',
  obfuscationHoldout: 'eval/obfuscation/holdout.json',
};

it('keeps the obfuscation holdout frozen and separate from reference phrases', () => {
  const bytes = readFileSync(SETS.obfuscationHoldout);
  const hash = readFileSync('eval/obfuscation/README.md', 'utf8').match(
    /SHA-256: `([a-f0-9]{64})`/,
  )?.[1];
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(hash);
  const key = (text: string) => text.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
  const reference = JSON.parse(readFileSync('src/data/archetypes.json', 'utf8'));
  const phrases = new Set(
    [
      ...reference.archetypes.flatMap((a: { phrases: string[] }) => a.phrases),
      ...reference.benign,
    ].map(key),
  );
  const dev = JSON.parse(readFileSync(SETS.obfuscationDev, 'utf8')) as Case[];
  const holdout = JSON.parse(bytes.toString('utf8')) as Case[];
  const devTexts = new Set(dev.map(({ text }) => key(text)));
  for (const c of holdout) {
    expect(phrases.has(key(c.text)), c.id).toBe(false);
    expect(devTexts.has(key(c.text)), c.id).toBe(false);
  }
});

export function readHoldout(): Case[] {
  const bytes = readFileSync(SETS.contextHoldout);
  const hash = readFileSync('eval/context/README.md', 'utf8').match(
    /SHA-256: `([a-f0-9]{64})`/,
  )?.[1];
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(hash);
  return JSON.parse(bytes.toString('utf8')) as Case[];
}

it('keeps the context holdout frozen, balanced and separate from reference phrases', () => {
  const holdout = readHoldout();
  const dev = JSON.parse(readFileSync(SETS.contextDev, 'utf8')) as Case[];
  for (const set of [dev, holdout]) {
    expect(new Set(set.map(({ id }) => id)).size).toBe(set.length);
    for (const lang of ['en', 'fil', 'taglish'] as const) {
      const rows = set.filter((c) => c.lang === lang);
      expect(rows.filter((c) => c.expected === 'probably_fine').length).toBeGreaterThan(0);
      expect(rows.filter((c) => c.expected === 'likely_scam').length).toBeGreaterThan(0);
      expect(rows.filter((c) => c.expected === 'not_sure').length).toBeGreaterThan(0);
    }
  }
  const key = (text: string) => text.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
  const reference = JSON.parse(readFileSync('src/data/archetypes.json', 'utf8'));
  const phrases = new Set(
    [
      ...reference.archetypes.flatMap((a: { phrases: string[] }) => a.phrases),
      ...reference.benign,
    ].map(key),
  );
  for (const c of [...dev, ...holdout]) expect(phrases.has(key(c.text)), c.id).toBe(false);
});

function modelFolder(): string {
  const source = 'public/models/Xenova/multilingual-e5-small';
  const manifest = JSON.parse(readFileSync('public/models/manifest.json', 'utf8'));
  const entry = manifest.files['onnx/model_quantized.onnx'] as {
    sha256: string;
    parts: { name: string }[];
  };
  const root = join(tmpdir(), 'sane-eval-models');
  const target = join(root, 'Xenova', 'multilingual-e5-small');
  const onnx = join(target, 'onnx', 'model_quantized.onnx');
  mkdirSync(join(target, 'onnx'), { recursive: true });
  for (const file of ['config.json', 'tokenizer.json', 'tokenizer_config.json'])
    copyFileSync(join(source, file), join(target, file));
  if (!existsSync(onnx) || sha256(readFileSync(onnx)) !== entry.sha256) {
    writeFileSync(
      onnx,
      Buffer.concat(entry.parts.map(({ name }) => readFileSync(join(source, name)))),
    );
  }
  if (sha256(readFileSync(onnx)) !== entry.sha256) throw new Error('Model hash mismatch.');
  return root;
}

const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

it.skipIf(process.env.EVAL_CONTEXT !== '1')(
  'reports context and regression results without an accuracy gate',
  async () => {
    readHoldout();
    async function run(embeddings: boolean) {
      const results: Record<string, unknown> = {};
      for (const [name, path] of Object.entries(SETS)) {
        const cases = JSON.parse(readFileSync(path, 'utf8')) as Case[];
        const rows: (Row & { category?: string; signals: string[]; score: number })[] = [];
        for (const c of cases) {
          const verdict = await analyze({ text: c.text }, { lang: c.lang, useLLM: false });
          expect(verdict.usedModels.embeddings, c.id).toBe(embeddings);
          rows.push({
            id: c.id,
            lang: c.lang,
            expected: c.expected,
            actual: verdict.level,
            category: c.category,
            score: verdict.score,
            signals: verdict.signals.map(({ id }) => id),
          });
        }
        const ambiguous = rows.filter((r) => r.expected === 'not_sure');
        results[name] = {
          overall: summarize(rows),
          perLanguage: Object.fromEntries(
            ['en', 'fil', 'taglish'].map((lang) => [
              lang,
              summarize(rows.filter((r) => r.lang === lang)),
            ]),
          ),
          ambiguousOutcomes: Object.fromEntries(
            ['likely_scam', 'suspicious', 'probably_fine', 'not_sure'].map((level) => [
              level,
              ambiguous.filter((r) => r.actual === level).length,
            ]),
          ),
          rows,
        };
      }
      return results;
    }

    adapter.embed = undefined;
    const rulesOnly = await run(false);
    let embeddings: unknown = { status: 'unmeasured', reason: 'EVAL_EMBEDDINGS=1 not set.' };
    if (process.env.EVAL_EMBEDDINGS === '1') {
      const { env } = await import('@huggingface/transformers');
      env.allowRemoteModels = false;
      env.localModelPath = modelFolder();
      const { createEmbedder } = await import('../../src/ai/embedder');
      adapter.embed = await createEmbedder(undefined, 'cpu');
      embeddings = { status: 'measured-node-cpu', results: await run(true) };
    }
    const report = {
      detectorRevision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      dirtyWorktree: execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }) !== '',
      rulesOnly,
      embeddings,
    };
    if (process.env.CONTEXT_OUTPUT)
      writeFileSync(process.env.CONTEXT_OUTPUT, `${JSON.stringify(report, null, 2)}\n`);
    const line = (name: string, value: unknown) => {
      const { overall } = value as { overall: ReturnType<typeof summarize> };
      const pct = (x: number | null) => (x === null ? '-' : `${Math.round(x * 100)}%`);
      return `${name.padEnd(15)} scams ${overall.caught}/${overall.scams} recall ${pct(overall.recall)} | false alarms ${overall.falseAlarms}/${overall.legit} FPR ${pct(overall.falsePositiveRate)} | precision ${pct(overall.precision)} | abstain ${overall.abstained}/${overall.total} ${name.endsWith('Holdout') ? '' : ` | missed ${overall.missedScams.join(',') || '-'} | FA ${overall.falseAlarmIds.join(',') || '-'}`}`;
    };
    const summary = [
      'RULES ONLY',
      ...Object.entries(rulesOnly).map(([name, value]) => line(name, value)),
      ...(process.env.EVAL_EMBEDDINGS === '1'
        ? [
            'WITH EMBEDDINGS',
            ...Object.entries((embeddings as { results: Record<string, unknown> }).results).map(
              ([name, value]) => line(name, value),
            ),
          ]
        : []),
    ];
    process.stderr.write(`\n${summary.join('\n')}\n`);
  },
  600000,
);
