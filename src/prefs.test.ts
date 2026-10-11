import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFS, loadPrefs, savePrefs, withFamilyMode } from './prefs';
import type { KeyValueStorage } from './history/store';

function memory(): KeyValueStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

describe('prefs', () => {
  it('round-trips and rejects bad values', () => {
    const kv = memory();
    expect(loadPrefs(kv)).toEqual(DEFAULT_PREFS);
    savePrefs(kv, { lang: 'taglish', family: true, highContrast: true });
    expect(loadPrefs(kv)).toEqual({ lang: 'taglish', family: true, highContrast: true });
    kv.setItem('sane.prefs.v1', JSON.stringify({ lang: 'xx', family: 'yes' }));
    expect(loadPrefs(kv)).toEqual(DEFAULT_PREFS);
    kv.setItem('sane.prefs.v1', '{oops');
    expect(loadPrefs(kv)).toEqual(DEFAULT_PREFS);
    expect(loadPrefs(null)).toEqual(DEFAULT_PREFS);
  });

  it('suggests Filipino with family mode only when the language is still English', () => {
    expect(withFamilyMode(DEFAULT_PREFS, true).lang).toBe('fil');
    expect(withFamilyMode({ ...DEFAULT_PREFS, lang: 'taglish' }, true).lang).toBe('taglish');
    expect(withFamilyMode({ ...DEFAULT_PREFS, lang: 'fil', family: true }, false).lang).toBe('fil');
  });
});
