import { describe, expect, it } from 'vitest';
import { describeRun, type RunInput } from './runReport';

const none = { ocr: false, embeddings: false, llm: false };
const base: RunInput = {
  usedModels: none,
  screenshotRead: false,
  meaningAtScan: 'ready',
  autoPreload: true,
  writerAtScan: 'idle',
  writerWriting: false,
};
const find = (rows: ReturnType<typeof describeRun>, part: string) =>
  rows.find((row) => row.part === part);

describe('describeRun', () => {
  it('reports each part on its own, so one part running never hides another that did not', () => {
    const rows = describeRun({ ...base, usedModels: { ...none, embeddings: true } });
    expect(find(rows, 'meaning')).toEqual({ part: 'meaning', ran: true, reason: 'ran' });
    expect(find(rows, 'writer')).toEqual({ part: 'writer', ran: false, reason: 'not_downloaded' });
  });

  it('explains why the meaning check did not run', () => {
    const reason = (input: Partial<RunInput>) =>
      find(describeRun({ ...base, ...input }), 'meaning')?.reason;
    expect(reason({ meaningAtScan: 'loading' })).toBe('not_ready');
    expect(reason({ meaningAtScan: 'idle', autoPreload: true })).toBe('not_ready');
    expect(reason({ meaningAtScan: 'idle', autoPreload: false })).toBe('paused');
    expect(reason({ meaningAtScan: 'error' })).toBe('failed');
    // Ready at the start but no result: it must not claim "paused" or "not downloaded".
    expect(reason({ meaningAtScan: 'ready' })).toBe('not_run');
  });

  it('uses the writer state from the time of the check and its live writing state', () => {
    const reason = (input: Partial<RunInput>) =>
      find(describeRun({ ...base, ...input }), 'writer')?.reason;
    expect(reason({ writerAtScan: 'loading' })).toBe('not_ready');
    expect(reason({ writerAtScan: 'error' })).toBe('failed');
    expect(reason({ writerAtScan: 'ready' })).toBe('no_output');
    expect(reason({ writerAtScan: 'ready', writerWriting: true })).toBe('writing');
    expect(reason({ usedModels: { ...none, llm: true }, writerWriting: true })).toBe('ran');
  });

  it('lists screenshot reading only when it happened', () => {
    expect(find(describeRun(base), 'screenshot')).toBeUndefined();
    expect(find(describeRun({ ...base, screenshotRead: true }), 'screenshot')?.ran).toBe(true);
    expect(
      find(describeRun({ ...base, usedModels: { ...none, ocr: true } }), 'screenshot')?.ran,
    ).toBe(true);
  });

  it('always lists the meaning check and the writer', () => {
    expect(describeRun(base).map(({ part }) => part)).toEqual(['meaning', 'writer']);
  });
});
