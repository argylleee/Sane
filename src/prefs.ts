// OWNER: frontend. Reader preferences, kept on this device only.
import type { Lang } from './types';
import type { KeyValueStorage } from './history/store';

export type Prefs = {
  lang: Lang;
  /** Larger text and a simpler result screen for readers who want less on screen. */
  family: boolean;
  highContrast: boolean;
};

const KEY = 'sane.prefs.v1';
const LANGS: readonly Lang[] = ['en', 'fil', 'taglish'];

export const DEFAULT_PREFS: Prefs = { lang: 'en', family: false, highContrast: false };

export function loadPrefs(storage: KeyValueStorage | null): Prefs {
  try {
    const raw: unknown = JSON.parse(storage?.getItem(KEY) ?? 'null');
    if (typeof raw !== 'object' || raw === null) return DEFAULT_PREFS;
    const value = raw as Record<string, unknown>;
    return {
      lang: LANGS.includes(value.lang as Lang) ? (value.lang as Lang) : DEFAULT_PREFS.lang,
      family: value.family === true,
      highContrast: value.highContrast === true,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(storage: KeyValueStorage | null, prefs: Prefs): void {
  try {
    storage?.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // The choice still applies for this visit.
  }
}

/** Turning family mode on suggests Filipino once; the reader can still pick another language. */
export function withFamilyMode(prefs: Prefs, family: boolean): Prefs {
  return { ...prefs, family, lang: family && prefs.lang === 'en' ? 'fil' : prefs.lang };
}
