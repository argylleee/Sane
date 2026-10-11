import { describe, expect, it } from 'vitest';
import { createHistoryStore, maskPreview, MAX_ENTRIES, type KeyValueStorage } from './store';

function memory(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const entry = {
  level: 'likely_scam' as const,
  score: 80,
  lang: 'en' as const,
  source: 'text' as const,
  preview: 'GCash locked',
  signalIds: ['otp_pin_request'],
};

describe('maskPreview', () => {
  it('hides links and long numbers and shortens the text', () => {
    expect(maskPreview('Send to 0917 123 4567 or visit https://gcash-verify.xyz/login now')).toBe(
      'Send to •••• or visit [link] now',
    );
    expect(maskPreview('Pay 500 pesos by 12/25')).toBe('Pay 500 pesos by 12/25');
    const long = maskPreview('word '.repeat(60));
    expect(long.length).toBeLessThanOrEqual(100);
    expect(long.endsWith('…')).toBe(true);
  });
});

describe('history store', () => {
  it('saves nothing until the reader turns history on', () => {
    const store = createHistoryStore(memory());
    expect(store.add(entry)).toBeNull();
    expect(store.list()).toEqual([]);
    store.setEnabled(true);
    expect(store.add(entry)).not.toBeNull();
    expect(store.list()).toHaveLength(1);
  });

  it('lists newest first, removes one, and keeps at most the cap', () => {
    let clock = 1;
    const store = createHistoryStore(memory(), () => clock++);
    store.setEnabled(true);
    for (let i = 0; i < MAX_ENTRIES + 5; i++) store.add({ ...entry, preview: `m${i}` });
    const list = store.list();
    expect(list).toHaveLength(MAX_ENTRIES);
    expect(list[0].preview).toBe(`m${MAX_ENTRIES + 4}`);
    store.remove(list[0].id);
    expect(store.list()).toHaveLength(MAX_ENTRIES - 1);
  });

  it('ignores corrupt storage and works without storage', () => {
    const kv = memory();
    kv.setItem('sane.history.entries.v1', '{not json');
    expect(createHistoryStore(kv).list()).toEqual([]);
    kv.setItem('sane.history.entries.v1', JSON.stringify([{ id: 1 }, 'x']));
    expect(createHistoryStore(kv).list()).toEqual([]);
    const none = createHistoryStore(null);
    none.setEnabled(true);
    expect(none.isEnabled()).toBe(false);
    expect(none.add(entry)).toBeNull();
    expect(none.addNote({ level: 'not_sure', userSays: 'scam', text: 'x' })).toBe(false);
  });

  it('survives a storage that throws on write', () => {
    const kv = memory();
    const store = createHistoryStore({
      ...kv,
      setItem: (key, value) => {
        if (key.includes('entries')) throw new Error('quota');
        kv.setItem(key, value);
      },
    });
    store.setEnabled(true);
    expect(store.add(entry)).toBeNull();
  });

  it('keeps wrong-verdict notes, exports them, and clears everything', () => {
    const kv = memory();
    const store = createHistoryStore(kv, () => Date.UTC(2026, 9, 11));
    store.setEnabled(true);
    store.add(entry);
    expect(store.addNote({ level: 'probably_fine', userSays: 'scam', text: 'full message' })).toBe(
      true,
    );
    expect(JSON.parse(store.exportNotes())).toEqual([
      {
        savedAt: '2026-10-11T00:00:00.000Z',
        shownAs: 'probably_fine',
        readerSays: 'scam',
        text: 'full message',
      },
    ]);
    store.clearAll();
    expect(kv.data.size).toBe(0);
    expect(store.isEnabled()).toBe(false);
  });
});
