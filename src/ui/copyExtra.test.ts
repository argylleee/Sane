import { describe, expect, it } from 'vitest';
import { extraCopyFor } from './copyExtra';
import type { Lang } from '../types';

const languages: readonly Lang[] = ['en', 'fil', 'taglish'];

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (typeof value === 'function') return [];
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('extra interface copy', () => {
  it.each(languages)('is complete and follows the copy rules for %s', (lang) => {
    const copy = extraCopyFor(lang);
    const all = [
      ...strings(copy),
      copy.detailPayment(),
      copy.detailPayment('GCash'),
      copy.helpChecked('2026-10-11'),
      copy.reportChecked('2026-10-11'),
      copy.reportResult('Likely a scam'),
      copy.proofSome(2, 0),
      copy.proofSome(2, 1),
      copy.noteShownAs('Not sure'),
    ];
    for (const text of all) {
      expect(text.trim()).not.toBe('');
      expect(text).not.toContain('—'); // RULES 16: no em dashes
    }
    expect(copy.proofSome(3, 1)).toContain('3');
    expect(copy.detailPayment('GCash')).toContain('GCash');
  });

  it('has the same keys in every language', () => {
    const keys = (lang: Lang) => Object.keys(extraCopyFor(lang)).sort();
    expect(keys('fil')).toEqual(keys('en'));
    expect(keys('taglish')).toEqual(keys('en'));
  });
});
