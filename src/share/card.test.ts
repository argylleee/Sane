import { describe, expect, it } from 'vitest';
import { wrapLines } from './card';

const measure = (s: string) => s.length * 10;

describe('wrapLines', () => {
  it('wraps words to the width', () => {
    expect(wrapLines('one two three four', 90, measure)).toEqual(['one two', 'three', 'four']);
  });

  it('keeps a word that is longer than the width on its own line', () => {
    expect(wrapLines('a verylongwordhere b', 50, measure)).toEqual(['a', 'verylongwordhere', 'b']);
  });

  it('returns no lines for empty text', () => {
    expect(wrapLines('   ', 100, measure)).toEqual([]);
  });
});
