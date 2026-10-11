// OWNER: frontend. Learn-page list of common Philippine scams, one short card each.
import archetypeData from '../data/archetypes.json';
import { SCAM_TYPES } from '../data/scamTypes';
import type { Lang } from '../types';
import { extraCopyFor } from './copyExtra';

const types = archetypeData.archetypes as { id: string; name: Record<Lang, string> }[];

export function ScamTypesList({ lang }: { lang: Lang }) {
  const text = extraCopyFor(lang);
  return (
    <section className="space-y-4" aria-labelledby="scamtypes-title">
      <div className="space-y-1">
        <h2 id="scamtypes-title" className="text-xl font-bold tracking-tight text-text">
          {text.scamTypesTitle}
        </h2>
        <p className="text-sm text-secondary">{text.scamTypesIntro}</p>
      </div>
      <div className="grid gap-3">
        {types.map(({ id, name }) => {
          const type = SCAM_TYPES[id];
          if (!type) return null;
          return (
            <details key={id} className="clay-panel group rounded-2xl p-4">
              <summary className="min-h-11 cursor-pointer list-none py-2 font-bold text-text outline-none focus-visible:ring-2 focus-visible:ring-primary">
                {name[lang]}
              </summary>
              <div className="space-y-3 pt-2 text-sm leading-relaxed text-text/90">
                <p>
                  <span className="font-bold text-text">{text.scamTypeTell}: </span>
                  {type.tell[lang]}
                </p>
                <p>
                  <span className="font-bold text-text">{text.scamTypeDo}: </span>
                  {type.doThis[lang]}
                </p>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
