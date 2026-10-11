// OWNER: frontend. Language, family mode and high contrast. Kept on this device only.
import type { Prefs } from '../prefs';
import { withFamilyMode } from '../prefs';
import type { Lang } from '../types';
import { extraCopyFor } from './copyExtra';

const LANGS: readonly Lang[] = ['en', 'fil', 'taglish'];

export function SettingsPanel({
  prefs,
  onChange,
}: {
  prefs: Prefs;
  onChange: (prefs: Prefs) => void;
}) {
  const text = extraCopyFor(prefs.lang);
  return (
    <section className="clay-panel space-y-5 rounded-2xl p-6" aria-labelledby="settings-title">
      <h2 id="settings-title" className="text-xl font-bold tracking-tight text-text">
        {text.settingsTitle}
      </h2>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-bold text-text">{text.settingsLanguage}</legend>
        <div className="grid grid-cols-3 gap-2">
          {LANGS.map((lang) => (
            <button
              key={lang}
              type="button"
              aria-pressed={prefs.lang === lang}
              onClick={() => onChange({ ...prefs, lang })}
              className={`min-h-12 rounded-xl px-2 text-sm font-bold cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary ${prefs.lang === lang ? 'bg-primary text-on-primary' : 'bg-surface text-text'}`}
            >
              {text.langNames[lang]}
            </button>
          ))}
        </div>
      </fieldset>

      {(
        [
          ['family', text.settingsFamily, text.settingsFamilyHint],
          ['highContrast', text.settingsContrast, text.settingsContrastHint],
        ] as const
      ).map(([key, title, hint]) => (
        <label key={key} className="flex min-h-11 cursor-pointer items-start justify-between gap-4">
          <span className="space-y-1">
            <span className="block font-bold text-text">{title}</span>
            <span className="block text-sm text-secondary">{hint}</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            className="mt-1 h-6 w-6 shrink-0 accent-[var(--color-primary)]"
            checked={prefs[key]}
            onChange={(event) =>
              onChange(
                key === 'family'
                  ? withFamilyMode(prefs, event.currentTarget.checked)
                  : { ...prefs, highContrast: event.currentTarget.checked },
              )
            }
          />
        </label>
      ))}
    </section>
  );
}
