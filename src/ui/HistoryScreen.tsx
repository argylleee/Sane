// OWNER: frontend. The History page: opt-in, local only, with a clear "Delete everything".
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { localizeSignals } from '../explain/templates';
import type { HistoryEntry, HistoryStore } from '../history/store';
import type { Lang } from '../types';
import { copyFor } from './copy';
import { extraCopyFor } from './copyExtra';

const PANEL = 'clay-panel rounded-2xl p-6 space-y-4';
const LEVEL_TONE = {
  likely_scam: 'bg-high-surface text-high',
  suspicious: 'bg-caution-surface text-caution',
  probably_fine: 'bg-good-surface text-good',
  not_sure: 'bg-surface text-secondary',
} as const;

function downloadFile(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function HistoryScreen({
  store,
  lang,
  onEnabledChange,
}: {
  store: HistoryStore;
  lang: Lang;
  onEnabledChange?: (enabled: boolean) => void;
}) {
  const text = extraCopyFor(lang);
  const base = copyFor(lang);
  const [enabled, setEnabled] = useState(() => store.isEnabled());
  const [entries, setEntries] = useState<HistoryEntry[]>(() => store.list());
  const [notes, setNotes] = useState(() => store.notes());
  const [confirmAll, setConfirmAll] = useState(false);
  const when = new Intl.DateTimeFormat(lang === 'en' ? 'en-PH' : 'fil-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  function refresh() {
    setEntries(store.list());
    setNotes(store.notes());
  }

  function toggle(next: boolean) {
    store.setEnabled(next);
    setEnabled(next);
    onEnabledChange?.(next);
  }

  function deleteAll() {
    if (!confirmAll) {
      setConfirmAll(true);
      return;
    }
    store.clearAll();
    setEnabled(false);
    setConfirmAll(false);
    onEnabledChange?.(false);
    refresh();
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div className="space-y-3 text-center">
        <h1 className="page-heading mx-auto">{text.historyTitle}</h1>
        <p className="mx-auto max-w-[55ch] text-lg text-secondary">{text.historyDescription}</p>
      </div>

      <section className={PANEL}>
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
          <span className="display-text text-lg text-text">{text.historyToggle}</span>
          <input
            type="checkbox"
            role="switch"
            className="clay-switch"
            checked={enabled}
            onChange={(event) => toggle(event.currentTarget.checked)}
          />
        </label>
        <p className="text-sm text-secondary">{text.historyPrivacy}</p>
      </section>

      <section className="space-y-3" aria-live="polite">
        {entries.length === 0 ? (
          <p className="rounded-2xl bg-neutral p-6 text-center text-secondary">
            {enabled ? text.historyEmpty : text.historyEmptyOff}
          </p>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => {
              const flags = localizeSignals(
                entry.signalIds.map((id) => ({ id, label: id, weight: 1 })),
                lang,
              ).map(({ label }) => label);
              return (
                <li key={entry.id} className="clay-panel space-y-2 rounded-2xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-bold ${LEVEL_TONE[entry.level]}`}
                    >
                      {base.assessment[entry.level].label}
                    </span>
                    <time
                      className="text-xs text-secondary"
                      dateTime={new Date(entry.at).toISOString()}
                    >
                      {when.format(entry.at)}
                    </time>
                  </div>
                  <p className="break-words font-mono text-sm text-text/90">
                    {entry.preview || text.historyScreenshot}
                  </p>
                  {flags.length > 0 && (
                    <p className="text-xs text-secondary">{flags.join(' · ')}</p>
                  )}
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-secondary hover:text-high cursor-pointer"
                    onClick={() => {
                      store.remove(entry.id);
                      refresh();
                    }}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    {text.historyDelete}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={PANEL} aria-labelledby="notes-title">
        <h2 id="notes-title" className="text-lg font-bold text-text">
          {text.notesTitle}
        </h2>
        <p className="text-sm text-secondary">{text.notesDescription}</p>
        {notes.length === 0 ? (
          <p className="text-sm text-text/80">{text.notesEmpty}</p>
        ) : (
          <>
            <ul className="space-y-3">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="space-y-2 rounded-lg border border-border bg-surface p-3"
                >
                  <p className="text-sm font-semibold text-text">
                    {note.userSays === 'scam' ? text.noteScam : text.noteFine}
                  </p>
                  <p className="text-xs text-secondary">
                    {text.noteShownAs(base.assessment[note.level].label)}
                  </p>
                  <p className="line-clamp-3 break-words font-mono text-xs text-text/80">
                    {note.text}
                  </p>
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-secondary hover:text-high cursor-pointer"
                    onClick={() => {
                      store.removeNote(note.id);
                      refresh();
                    }}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    {text.historyDelete}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-surface px-4 text-sm font-bold text-text cursor-pointer"
              onClick={() => downloadFile('sane-notes.json', store.exportNotes())}
            >
              {text.notesExport}
            </button>
          </>
        )}
      </section>

      <button
        type="button"
        className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold cursor-pointer ${confirmAll ? 'border-high bg-high text-white' : 'border-high/40 text-high'}`}
        onClick={deleteAll}
      >
        <Trash2 size={18} aria-hidden="true" />
        {confirmAll ? text.historyDeleteAllConfirm : text.historyDeleteAll}
      </button>
    </div>
  );
}
