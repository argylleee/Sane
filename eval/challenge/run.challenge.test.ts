// OWNER: model. Generalization challenge: independent messages per failure pattern (unseen
// payment-request forms, amount formats, Unicode obfuscation, scam contexts and benign lookalikes)
// plus harmless rewrites of every message (eval/challenge/transforms.ts). The opt-in run reports
// results and never asserts an accuracy target. Usage (PowerShell):
//   $env:EVAL_CHALLENGE = '1'; $env:EVAL_EMBEDDINGS = '1'; $env:CHALLENGE_OUTPUT = 'out.json'
//   npx vitest run eval/challenge/run.challenge.test.ts
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
import { variants } from './transforms';

const adapter = vi.hoisted(() => ({ embed: undefined as Embed | undefined }));
vi.mock('../../src/ai/embedClient', () => ({
  getEmbeddingsStatus: () => ({ state: adapter.embed ? 'ready' : 'idle', progress: 0 }),
  embedTexts: (texts: string[], kind: 'query' | 'passage') => {
    if (!adapter.embed) throw new Error('No real embedding model loaded.');
    return adapter.embed(texts, kind);
  },
}));

type Case = { id: string; lang: Lang; expected: Level; category: string; text: string };
const SETS = { dev: 'eval/challenge/dev.json', holdout: 'eval/challenge/holdout.json' };
const RANK: Record<Level, number> = {
  probably_fine: 0,
  not_sure: 1,
  suspicious: 2,
  likely_scam: 3,
};
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const key = (text: string) => text.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();

it('keeps the challenge holdout frozen and independent of other sets and reference phrases', () => {
  const hash = readFileSync('eval/challenge/README.md', 'utf8').match(
    /holdout\.json`[\s\S]*?SHA-256: `([a-f0-9]{64})`/,
  )?.[1];
  expect(sha256(readFileSync(SETS.holdout))).toBe(hash);
  const reference = JSON.parse(readFileSync('src/data/archetypes.json', 'utf8'));
  const seen = new Set(
    [
      ...reference.archetypes.flatMap((a: { phrases: string[] }) => a.phrases),
      ...reference.benign,
      ...(JSON.parse(readFileSync(SETS.dev, 'utf8')) as Case[]).map(({ text }) => text),
      ...['eval/obfuscation/dev.json', 'eval/obfuscation/holdout.json'].flatMap((path) =>
        (JSON.parse(readFileSync(path, 'utf8')) as Case[]).map(({ text }) => text),
      ),
    ].map(key),
  );
  for (const c of JSON.parse(readFileSync(SETS.holdout, 'utf8')) as Case[])
    expect(seen.has(key(c.text)), c.id).toBe(false);
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
  if (!existsSync(onnx) || sha256(readFileSync(onnx)) !== entry.sha256)
    writeFileSync(
      onnx,
      Buffer.concat(entry.parts.map(({ name }) => readFileSync(join(source, name)))),
    );
  if (sha256(readFileSync(onnx)) !== entry.sha256) throw new Error('Model hash mismatch.');
  return root;
}

it.skipIf(process.env.EVAL_CHALLENGE !== '1')(
  'reports challenge results and consistency under harmless rewrites',
  async () => {
    const level = async (c: Case, text: string) =>
      (await analyze({ text }, { lang: c.lang, useLLM: false })).level;
    async function run() {
      const results: Record<string, unknown> = {};
      for (const [name, path] of Object.entries(SETS)) {
        const cases = JSON.parse(readFileSync(path, 'utf8')) as Case[];
        const rows: (Row & { category: string })[] = [];
        const changes: { id: string; variant: string; base: Level; actual: Level }[] = [];
        const perVariant: Record<string, { total: number; same: number }> = {};
        let total = 0;
        let same = 0;
        let benignVariants = 0;
        let benignEscalated = 0;
        let scamVariants = 0;
        let scamDropped = 0;
        for (const c of cases) {
          const base = await level(c, c.text);
          rows.push({
            id: c.id,
            lang: c.lang,
            expected: c.expected,
            actual: base,
            category: c.category,
          });
          const benign = c.expected === 'probably_fine' || c.expected === 'not_sure';
          for (const [variant, text] of Object.entries(variants(c.text))) {
            const actual = await level(c, text);
            const stats = (perVariant[variant] ??= { total: 0, same: 0 });
            stats.total++;
            total++;
            if (actual === base) {
              stats.same++;
              same++;
            } else changes.push({ id: c.id, variant, base, actual });
            if (benign) {
              benignVariants++;
              if (RANK[actual] > RANK[base]) benignEscalated++;
            } else {
              scamVariants++;
              if (RANK[actual] < RANK[base]) scamDropped++;
            }
          }
        }
        results[name] = {
          overall: summarize(rows),
          perLanguage: Object.fromEntries(
            ['en', 'fil', 'taglish'].map((lang) => [
              lang,
              summarize(rows.filter((r) => r.lang === lang)),
            ]),
          ),
          consistency: {
            total,
            same,
            rate: same / total,
            benignVariants,
            benignEscalated,
            scamVariants,
            scamDropped,
          },
          perVariant,
          changes,
          rows,
        };
      }
      return results;
    }

    adapter.embed = undefined;
    const rulesOnly = await run();
    let embeddings: unknown = { status: 'unmeasured', reason: 'EVAL_EMBEDDINGS=1 not set.' };
    if (process.env.EVAL_EMBEDDINGS === '1') {
      const { env } = await import('@huggingface/transformers');
      env.allowRemoteModels = false;
      env.localModelPath = modelFolder();
      const { createEmbedder } = await import('../../src/ai/embedder');
      adapter.embed = await createEmbedder(undefined, 'cpu');
      embeddings = { status: 'measured-node-cpu', results: await run() };
    }
    const report = {
      detectorRevision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      dirtyWorktree: execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }) !== '',
      rulesOnly,
      embeddings,
    };
    if (process.env.CHALLENGE_OUTPUT)
      writeFileSync(process.env.CHALLENGE_OUTPUT, `${JSON.stringify(report, null, 2)}\n`);
  },
  900000,
);
