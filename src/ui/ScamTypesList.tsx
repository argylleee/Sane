// OWNER: frontend. Learn-page list of common Philippine scams, one short card each.
import { ChevronDown } from 'lucide-react';
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
              <summary className="display-text flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-2 text-text outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
                {name[lang]}
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-tonal text-primary"
                  aria-hidden="true"
                >
                  <ChevronDown
                    size={18}
                    strokeWidth={2.5}
                    className="transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                  />
                </span>
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
