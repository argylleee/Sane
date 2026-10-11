// OWNER: model. Embeds the hand-written archetype phrases once and caches the vectors in IndexedDB.
import archetypeData from '../data/archetypes.json';
import { EMBEDDING_MODEL_ID } from './embedder';
import { embedTexts } from './embedClient';
import { BENIGN_ID, type IndexEntry } from './vector';

export type Archetype = {
  id: string;
  name: { en: string; fil: string; taglish: string };
  defaultWeight: number;
  phrases: string[];
};

export const archetypes: Archetype[] = archetypeData.archetypes;
const benignPhrases: string[] = archetypeData.benign;

const DB_NAME = 'sane-ai';
const STORE = 'archetype-vectors';

/** Cheap content hash so editing phrases invalidates the cache without bumping the version. */
export function archetypeCacheKey(items: Archetype[] = archetypes): string {
  let hash = 5381;
  for (const phrase of [...items.flatMap((item) => item.phrases), ...benignPhrases]) {
    for (let i = 0; i < phrase.length; i++) hash = ((hash << 5) + hash + phrase.charCodeAt(i)) | 0;
  }
  return `v${archetypeData.version}:${EMBEDDING_MODEL_ID}:${items.length}:${hash >>> 0}:single`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE);
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
}

async function readCache(key: string): Promise<IndexEntry[] | undefined> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const get = db.transaction(STORE).objectStore(STORE).get(key);
      get.onsuccess = () => resolve(get.result as IndexEntry[] | undefined);
      get.onerror = () => resolve(undefined);
    });
  } catch {
    return undefined; // no IndexedDB (private mode, tests): just re-embed
  }
}

async function writeCache(key: string, entries: IndexEntry[]): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.objectStore(STORE).put(entries, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Cache is an optimization only.
  }
}

let memo: { key: string; entries: IndexEntry[] } | undefined;

/** Requires the embedding model to be ready. Embeds the reference phrases once on a cache miss. */
export async function getArchetypeIndex(): Promise<IndexEntry[]> {
  const key = archetypeCacheKey();
  if (memo?.key === key) return memo.entries;
  const cached = await readCache(key);
  if (cached) {
    memo = { key, entries: cached };
    return cached;
  }
  const flat = [
    ...archetypes.flatMap((item) => item.phrases.map((phrase) => ({ id: item.id, phrase }))),
    ...benignPhrases.map((phrase) => ({ id: BENIGN_ID, phrase })),
  ];
  // One phrase per call, like the message itself: a shared batch pads every phrase to the longest
  // one, so adding a phrase would shift every other vector and move results near the floor.
  const vectors: Float32Array[] = [];
  for (const entry of flat) vectors.push((await embedTexts([entry.phrase], 'passage'))[0]);
  const entries = flat.map((entry, i) => ({ archetypeId: entry.id, vector: vectors[i] }));
  memo = { key, entries };
  await writeCache(key, entries);
  return entries;
}
