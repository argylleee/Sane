// OWNER: frontend. Learn-page list of common Philippine scams, one short card each.
// An accordion (not native details) so each card opens and closes with a smooth height and fade.
import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import archetypeData from '../data/archetypes.json';
import { SCAM_TYPES } from '../data/scamTypes';
import type { Lang } from '../types';
import { extraCopyFor } from './copyExtra';

const types = archetypeData.archetypes as { id: string; name: Record<Lang, string> }[];

export function ScamTypesList({ lang }: { lang: Lang }) {
  const text = extraCopyFor(lang);
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const duration = reducedMotion ? 0 : 0.28;

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
          const isOpen = open.has(id);
          return (
            <div key={id} className="clay-panel rounded-2xl p-4">
              <button
                type="button"
                id={`scamtype-${id}-button`}
                aria-expanded={isOpen}
                aria-controls={`scamtype-${id}-panel`}
                onClick={() => toggle(id)}
                className="display-text flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg py-2 text-left text-text outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {name[lang]}
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-tonal text-primary-ink"
                  aria-hidden="true"
                >
                  <ChevronDown
                    size={18}
                    strokeWidth={2.5}
                    className={`transition-transform duration-300 ease-out motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
                  />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="panel"
                    id={`scamtype-${id}-panel`}
                    role="region"
                    aria-labelledby={`scamtype-${id}-button`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
