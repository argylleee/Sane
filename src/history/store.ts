// OWNER: frontend. Opt-in, local-only history and "this verdict looks wrong" notes.
// Nothing here is sent anywhere. The history keeps a masked preview, never the full message.
// A wrong-verdict note keeps the full text because the reader chose to save it, and it can be
// exported as a file or deleted at any time.
import type { Lang, Level } from '../types';

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type HistoryEntry = {
  id: string;
  at: number;
  level: Level;
  score: number;
  lang: Lang;
  source: 'text' | 'image';
  preview: string;
  signalIds: string[];
  archetypeId?: string;
};

export type FeedbackNote = {
  id: string;
  at: number;
  level: Level;
  userSays: 'scam' | 'fine';
  text: string;
};

const ENABLED_KEY = 'sane.history.enabled.v1';
const ENTRIES_KEY = 'sane.history.entries.v1';
const FEEDBACK_KEY = 'sane.feedback.notes.v1';
export const MAX_ENTRIES = 100;
export const MAX_NOTES = 50;
const PREVIEW_LENGTH = 100;
const LEVELS: readonly Level[] = ['likely_scam', 'suspicious', 'probably_fine', 'not_sure'];

/** A short preview that hides numbers and link addresses, so a stored entry is not a copy of the message. */
export function maskPreview(text: string, max = PREVIEW_LENGTH): string {
  const masked = text
    .replace(/https?:\/\/[^\s<>"']+|(?:[\p{L}\p{N}-]+\.)+[\p{L}]{2,}(?:\/[^\s<>"']*)?/giu, '[link]')
    .replace(/\+?\d[\d\s().-]{2,}\d/g, (run) => (run.replace(/\D/g, '').length >= 4 ? '••••' : run))
    .replace(/\s+/g, ' ')
    .trim();
  return masked.length > max ? `${masked.slice(0, max - 1).trimEnd()}…` : masked;
}

function newId(at: number): string {
  return `${at.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readList<T>(
  storage: KeyValueStorage | null,
  key: string,
  valid: (value: unknown) => boolean,
): T[] {
  if (!storage) return [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? (parsed.filter(valid) as T[]) : [];
  } catch {
    return [];
  }
}

function writeList(storage: KeyValueStorage | null, key: string, list: unknown[]): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(list));
    return true;
  } catch {
    return false; // Private mode or a full disk: the check still works, it just is not saved.
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const isEntry = (value: unknown) =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.at === 'number' &&
  LEVELS.includes(value.level as Level) &&
  typeof value.preview === 'string' &&
  Array.isArray(value.signalIds);
const isNote = (value: unknown) =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.text === 'string' &&
  (value.userSays === 'scam' || value.userSays === 'fine');

export function createHistoryStore(storage: KeyValueStorage | null, now: () => number = Date.now) {
  return {
    isEnabled(): boolean {
      try {
        return storage?.getItem(ENABLED_KEY) === '1';
      } catch {
        return false;
      }
    },
    setEnabled(enabled: boolean): void {
      try {
        if (enabled) storage?.setItem(ENABLED_KEY, '1');
        else storage?.removeItem(ENABLED_KEY);
      } catch {
        // Not available: history stays off.
      }
    },
    list(): HistoryEntry[] {
      return readList<HistoryEntry>(storage, ENTRIES_KEY, isEntry).sort((a, b) => b.at - a.at);
    },
    /** Saves a check when history is on. Returns the saved entry, or null when nothing was saved. */
    add(entry: Omit<HistoryEntry, 'id' | 'at'>): HistoryEntry | null {
      if (!this.isEnabled()) return null;
      const at = now();
      const saved: HistoryEntry = { ...entry, id: newId(at), at };
      const next = [saved, ...this.list()].slice(0, MAX_ENTRIES);
      return writeList(storage, ENTRIES_KEY, next) ? saved : null;
    },
    remove(id: string): void {
      writeList(
        storage,
        ENTRIES_KEY,
        this.list().filter((entry) => entry.id !== id),
      );
    },
    clearHistory(): void {
      try {
        storage?.removeItem(ENTRIES_KEY);
      } catch {
        // Nothing to clear.
      }
    },
    notes(): FeedbackNote[] {
      return readList<FeedbackNote>(storage, FEEDBACK_KEY, isNote).sort((a, b) => b.at - a.at);
    },
    addNote(note: Omit<FeedbackNote, 'id' | 'at'>): boolean {
      const at = now();
      const next = [{ ...note, id: newId(at), at }, ...this.notes()].slice(0, MAX_NOTES);
      return writeList(storage, FEEDBACK_KEY, next);
    },
    removeNote(id: string): void {
      writeList(
        storage,
        FEEDBACK_KEY,
        this.notes().filter((note) => note.id !== id),
      );
    },
    exportNotes(): string {
      return JSON.stringify(
        this.notes().map(({ at, level, userSays, text }) => ({
          savedAt: new Date(at).toISOString(),
          shownAs: level,
          readerSays: userSays,
          text,
        })),
        null,
        2,
      );
    },
    /** "Delete everything": the history, the notes and the on/off choice. */
    clearAll(): void {
      try {
        storage?.removeItem(ENTRIES_KEY);
        storage?.removeItem(FEEDBACK_KEY);
        storage?.removeItem(ENABLED_KEY);
      } catch {
        // Nothing to clear.
      }
    },
  };
}

export type HistoryStore = ReturnType<typeof createHistoryStore>;

export function browserStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
