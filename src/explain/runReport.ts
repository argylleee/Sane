// OWNER: frontend. Says, part by part, what ran for one check and why a part did not run.
// The card shows this instead of one general sentence, because "a model ran" and "the explanation
// model did not run" are about different parts and read as a contradiction when merged.
import type { Verdict } from '../types';

export type RunPart = 'meaning' | 'screenshot' | 'writer';

export type RunReason =
  | 'ran'
  | 'writing'
  | 'not_ready'
  | 'failed'
  | 'paused'
  | 'not_run'
  | 'not_downloaded'
  | 'no_output';

export type RunRow = { part: RunPart; ran: boolean; reason: RunReason };

type ModelState = 'idle' | 'loading' | 'ready' | 'error';

export type RunInput = {
  usedModels: Verdict['usedModels'];
  /** The text came from a screenshot that was read on this device. */
  screenshotRead: boolean;
  /** State of the meaning model when the check started, not now. */
  meaningAtScan: ModelState;
  /** The meaning model starts by itself on this device (not paused to save data). */
  autoPreload: boolean;
  /** State of the explanation writer when the check started, not now. */
  writerAtScan: ModelState;
  /** The writer is working on this result right now. */
  writerWriting: boolean;
};

export function describeRun(input: RunInput): RunRow[] {
  const rows: RunRow[] = [];

  if (input.usedModels.embeddings) {
    rows.push({ part: 'meaning', ran: true, reason: 'ran' });
  } else {
    const reason: RunReason =
      input.meaningAtScan === 'loading'
        ? 'not_ready'
        : input.meaningAtScan === 'error'
          ? 'failed'
          : input.meaningAtScan === 'idle'
            ? input.autoPreload
              ? 'not_ready'
              : 'paused'
            : 'not_run'; // It was ready but gave no result for this message.
    rows.push({ part: 'meaning', ran: false, reason });
  }

  if (input.screenshotRead || input.usedModels.ocr) {
    rows.push({ part: 'screenshot', ran: true, reason: 'ran' });
  }

  if (input.usedModels.llm) {
    rows.push({ part: 'writer', ran: true, reason: 'ran' });
  } else if (input.writerWriting) {
    rows.push({ part: 'writer', ran: false, reason: 'writing' });
  } else {
    const reason: RunReason =
      input.writerAtScan === 'idle'
        ? 'not_downloaded'
        : input.writerAtScan === 'loading'
          ? 'not_ready'
          : input.writerAtScan === 'error'
            ? 'failed'
            : 'no_output'; // Ready, but it was too slow, failed or wrote something unsafe.
    rows.push({ part: 'writer', ran: false, reason });
  }
  return rows;
}
