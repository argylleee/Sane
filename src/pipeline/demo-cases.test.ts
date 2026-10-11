import { describe, expect, it } from 'vitest';
import demo from '../../eval/demo-cases.json';
import type { Lang, Level } from '../types';
import { analyze } from './analyze';

// Demo script messages (eval/demo-cases.json), one group per result card. Rules only, so the demo
// gives the same verdict before the embedding model has downloaded. Also checked with the real model
// in Node on October 10, 2026.
describe('demo cases', () => {
  it.each(demo.map((item) => [item.id, item.expected, item.lang, item.text] as const))(
    '%s shows %s',
    async (_id, expected, lang, text) => {
      const verdict = await analyze({ text }, { lang: lang as Lang, useLLM: false });
      expect(verdict.level).toBe(expected as Level);
    },
  );
});
