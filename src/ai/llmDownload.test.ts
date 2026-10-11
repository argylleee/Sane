import { afterEach, describe, expect, it, vi } from 'vitest';
import { LLM_DOWNLOAD_MB, llmProgress, trackModelDownload } from './llm';

const MB = 1024 * 1024;
const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('explanation model download progress', () => {
  it('moves with streamed bytes before WebLLM reports a finished shard', () => {
    expect(llmProgress(0, 0, undefined)).toBe(0);
    expect(llmProgress(0, (LLM_DOWNLOAD_MB * MB) / 2, undefined)).toBe(45);
    expect(llmProgress(0, 10 * MB, { progress: 0, text: 'Fetching param cache[0/8]' })).toBe(3);
  });

  it('never goes backwards when WebLLM restarts at 0% to load onto the GPU', () => {
    const loading = llmProgress(90, LLM_DOWNLOAD_MB * MB, {
      progress: 0,
      text: 'Loading model from cache[1/8]: 0MB loaded.',
    });
    expect(loading).toBe(90);
    expect(llmProgress(loading, 0, { progress: 0.5, text: 'Loading model from cache[4/8]' })).toBe(
      95,
    );
    expect(llmProgress(0, 0, { progress: 1, text: 'Loading model from cache[8/8]' })).toBe(99);
  });

  it('counts only model-host bytes and restores fetch afterwards', async () => {
    const body = () => new Response(new Uint8Array(1000));
    const fake = vi.fn(async () => body());
    globalThis.fetch = fake as typeof fetch;
    const seen: number[] = [];
    const stop = trackModelDownload((bytes) => seen.push(bytes));
    await (await fetch('https://huggingface.co/mlc-ai/model/resolve/main/shard.bin')).arrayBuffer();
    await (await fetch(new Request('https://example.com/other'))).arrayBuffer();
    stop();
    expect(seen.reduce((a, b) => a + b, 0)).toBe(1000);
    expect(globalThis.fetch).toBe(fake);
  });
});
