import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const preference = vi.hoisted(() => ({ reduced: false }));
vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  useReducedMotion: () => preference.reduced,
}));
import { HomeMascot, nextGuardianStep } from './HomeMascot';

describe('homepage companion accessibility', () => {
  beforeEach(() => {
    preference.reduced = false;
  });

  it('keeps the decorative companion out of keyboard and screen-reader navigation', () => {
    const markup = renderToStaticMarkup(createElement(HomeMascot, { attention: false }));
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toContain('tabindex');
    expect(markup).not.toContain('<button');
    expect(markup).toContain('width="1431" height="1100"');
  });

  it('disables idle and blink animation when reduced motion is requested, including CTA feedback', () => {
    preference.reduced = true;
    const markup = renderToStaticMarkup(createElement(HomeMascot, { attention: true }));
    expect(markup).toContain('data-playing="false"');
    expect(markup).toContain('data-reacting="true"');
    expect(markup).not.toMatch(/translate[XY]\(-[1-9]|rotate\(-[1-9]/);
  });
});

describe('guardian interaction timing', () => {
  it('starts on intent and remains idle without intent', () => {
    expect(nextGuardianStep('idle', false, 0, true)).toBeUndefined();
    expect(nextGuardianStep('idle', true, 0, true)).toEqual({ phase: 'notice', delay: 0 });
  });

  it('finishes the short shield gesture when the pointer leaves early', () => {
    expect(nextGuardianStep('notice', false, 40, true)).toEqual({ phase: 'raise', delay: 110 });
    expect(nextGuardianStep('raise', false, 100, true)).toEqual({ phase: 'hold', delay: 240 });
    expect(nextGuardianStep('hold', false, 100, true)).toEqual({ phase: 'release', delay: 450 });
  });

  it('holds while engaged and releases promptly after a long hover', () => {
    expect(nextGuardianStep('hold', true, 2_000, true)).toBeUndefined();
    expect(nextGuardianStep('hold', false, 2_000, true)).toEqual({ phase: 'release', delay: 0 });
  });

  it('does not restart a phase deadline when engagement changes', () => {
    expect(nextGuardianStep('notice', false, 120, true)).toEqual({ phase: 'raise', delay: 30 });
    expect(nextGuardianStep('notice', true, 120, true)).toEqual({ phase: 'raise', delay: 30 });
  });

  it('finishes contracting before responding to renewed intent', () => {
    expect(nextGuardianStep('release', true, 160, true)).toEqual({ phase: 'idle', delay: 120 });
    expect(nextGuardianStep('idle', true, 0, true)).toEqual({ phase: 'notice', delay: 0 });
  });

  it('stops every phase when hidden or reduced motion is requested', () => {
    for (const phase of ['notice', 'raise', 'hold', 'release'] as const) {
      expect(nextGuardianStep(phase, true, 100, false)).toEqual({ phase: 'idle', delay: 0 });
    }
    expect(nextGuardianStep('idle', true, 100, false)).toBeUndefined();
  });
});
