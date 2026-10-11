// OWNER: model. Optional WebLLM explanation layer, lazy-loaded and fully skippable.
// Verdicts never depend on it: any failure returns null and the template explanation is used.
import { refineCapabilities, type Tier } from './capabilities';
import { buildMessages, validateLlmOutput, type LlmFacts } from './llmPrompt';

// Ids verified against WebLLM's prebuilt model list (@mlc-ai/web-llm 0.2.85). One small model for
// every WebGPU device: Qwen2.5-0.5B 4-bit is 276 MB in 8 cached shards, against 840 MB for the 1.5B.
// The explanation is grounded in fixed advice and validated, so the smaller model is enough.
export const LLM_MODEL_BY_TIER: Record<Tier, string | null> = {
  A: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
  B: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
  C: null, // no usable WebGPU: template explanations only
};

/** Download size in MB, measured from the Hugging Face repository file list. */
export const LLM_DOWNLOAD_MB = 276;

const LLM_TIMEOUT_MS = 15000;

type Engine = {
  chat: {
    completions: {
      create: (request: {
        messages: { role: 'system' | 'user'; content: string }[];
        temperature: number;
        max_tokens: number;
      }) => Promise<{ choices: { message: { content: string | null } }[] }>;
    };
  };
};

export type LlmStatus = {
  state: 'idle' | 'loading' | 'ready' | 'error';
  progress: number;
  /** Megabytes downloaded so far in this session (loading only). */
  downloadedMb?: number;
  /** Why loading failed (error only). */
  message?: string;
};

// WebLLM reports progress only after each ~35 MB weight shard finishes, four in parallel, and restarts
// from 0% when it copies the cached weights to the GPU. Counting the bytes as they arrive gives a bar
// that moves from the first second: downloading fills 0-90%, loading onto the GPU fills 90-100%.
const MODEL_HOSTS = /^https:\/\/(?:[\w-]+\.)*(?:huggingface\.co|hf\.co|githubusercontent\.com)\//;
const DOWNLOAD_SHARE = 90;

type Fetch = typeof globalThis.fetch;

/**
 * Wraps `fetch` while the model loads so every model-file response reports its bytes as they stream.
 * Other requests pass through untouched. Returns a function that restores the original `fetch`.
 */
export function trackModelDownload(onBytes: (bytes: number) => void): () => void {
  const original: Fetch = globalThis.fetch;
  const tracked: Fetch = async (input, init) => {
    const response = await original(input, init);
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!response.ok || !response.body || !MODEL_HOSTS.test(url)) return response;
    const counter = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        onBytes(chunk.byteLength);
        controller.enqueue(chunk);
      },
    });
    return new Response(response.body.pipeThrough(counter), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  };
  globalThis.fetch = tracked;
  return () => {
    if (globalThis.fetch === tracked) globalThis.fetch = original;
  };
}

/** Overall percentage from streamed bytes and WebLLM's own report. Never goes backwards. */
export function llmProgress(
  previous: number,
  downloadedBytes: number,
  report: { progress: number; text: string } | undefined,
): number {
  const byBytes = Math.min(1, downloadedBytes / (LLM_DOWNLOAD_MB * 1024 * 1024));
  let next = byBytes * DOWNLOAD_SHARE;
  if (report?.text.startsWith('Fetching')) next = Math.max(next, report.progress * DOWNLOAD_SHARE);
  if (report?.text.startsWith('Loading model from cache'))
    next = DOWNLOAD_SHARE + report.progress * (100 - DOWNLOAD_SHARE);
  return Math.min(99, Math.max(previous, Math.round(next)));
}

let status: LlmStatus = { state: 'idle', progress: 0 };
const listeners = new Set<(status: LlmStatus) => void>();
let enginePromise: Promise<Engine> | undefined;

function setStatus(next: LlmStatus) {
  status = next;
  listeners.forEach((listener) => listener(status));
}

export function getLlmStatus(): LlmStatus {
  return status;
}

export function subscribeLlm(listener: (status: LlmStatus) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Same models without 16-bit shader math, for GPUs that lack `shader-f16` (many phones). */
export const LLM_MODEL_F32_BY_TIER: Record<Tier, string | null> = {
  A: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC',
  B: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC',
  C: null,
};

/** Picks the model id for a tier, or null when this device cannot run one. */
export function pickLlmModel(tier: Tier, shaderF16: boolean | null): string | null {
  return (shaderF16 === true ? LLM_MODEL_BY_TIER : LLM_MODEL_F32_BY_TIER)[tier];
}

/** True when this device's model is already in the browser cache, so loading needs no download. */
export async function isLlmCached(tier: Tier): Promise<boolean> {
  try {
    const capabilities = await refineCapabilities();
    const modelId = pickLlmModel(tier, capabilities.shaderF16);
    if (!modelId) return false;
    const { hasModelInCache } = await import('@mlc-ai/web-llm');
    return await hasModelInCache(modelId);
  } catch {
    return false;
  }
}

/** Downloads (first time) and loads the model. Throws if the device cannot run a model. */
export function loadLlm(requestedTier: Tier): Promise<void> {
  if (!LLM_MODEL_BY_TIER[requestedTier])
    return Promise.reject(new Error('This device cannot run the language model.'));
  enginePromise ??= (async () => {
    setStatus({ state: 'loading', progress: 0, downloadedMb: 0 });
    let bytes = 0;
    let report: { progress: number; text: string } | undefined;
    const update = () =>
      setStatus({
        state: 'loading',
        progress: llmProgress(status.progress, bytes, report),
        downloadedMb: Math.round(bytes / (1024 * 1024)),
      });
    const stopTracking = trackModelDownload((chunk) => {
      bytes += chunk;
      update();
    });
    try {
      // Inspect the real GPU adapter: a phone can expose WebGPU yet have no usable adapter or no f16.
      const capabilities = await refineCapabilities();
      const modelId = pickLlmModel(
        capabilities.tier === 'C' ? 'C' : requestedTier,
        capabilities.shaderF16,
      );
      if (!modelId) throw new Error('This device cannot run the language model.');
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
      const engine = (await CreateMLCEngine(modelId, {
        initProgressCallback: (next) => {
          report = next;
          update();
        },
      })) as unknown as Engine;
      setStatus({ state: 'ready', progress: 100 });
      return engine;
    } catch (error) {
      enginePromise = undefined;
      setStatus({
        state: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      stopTracking();
    }
  })();
  return enginePromise.then(() => undefined);
}

/** One to three sentences of context, or null (not loaded, too slow, empty, or unsafe output). */
export async function explainWithLlm(facts: LlmFacts): Promise<string | null> {
  if (status.state !== 'ready' || !enginePromise) return null;
  try {
    const engine = await enginePromise;
    const reply = await Promise.race([
      engine.chat.completions.create({
        messages: buildMessages(facts),
        temperature: 0.2,
        max_tokens: 160,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('LLM timed out.')), LLM_TIMEOUT_MS),
      ),
    ]);
    return validateLlmOutput(reply.choices[0]?.message.content, {
      level: facts.level,
      lang: facts.lang,
    });
  } catch {
    return null;
  }
}
