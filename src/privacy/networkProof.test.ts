import { describe, expect, it } from 'vitest';
import { summarizeRequests } from './networkProof';

const origin = 'https://sane.example';

describe('summarizeRequests', () => {
  it('reports zero when nothing was requested during the check', () => {
    const before = [{ name: `${origin}/assets/app.js`, initiatorType: 'script', startTime: 10 }];
    expect(summarizeRequests(before, 100, 200, origin)).toEqual({
      count: 0,
      external: 0,
      items: [],
    });
  });

  it('counts only requests inside the window and tells own-site from other sites', () => {
    const records = [
      { name: `${origin}/models/e5.onnx`, initiatorType: 'fetch', startTime: 120 },
      { name: 'https://tracker.example/p.gif', initiatorType: 'img', startTime: 150 },
      { name: `${origin}/late.js`, initiatorType: 'script', startTime: 999 },
    ];
    const summary = summarizeRequests(records, 100, 200, origin);
    expect(summary.count).toBe(2);
    expect(summary.external).toBe(1);
    expect(summary.items[1]).toEqual({ host: 'tracker.example', type: 'img', sameOrigin: false });
  });

  it('does not throw on an odd address', () => {
    const odd = [{ name: 'http://[bad', initiatorType: 'fetch', startTime: 1 }];
    expect(summarizeRequests(odd, 0, 5, origin).items[0].host).toBe('unknown');
  });
});
