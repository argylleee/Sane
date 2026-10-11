// OWNER: frontend. Shows what the browser itself recorded during a check.
// It reads the browser's resource timing list, which covers fetch, XHR, images, scripts and
// workers. It does not cover WebSocket traffic, so the DevTools Network tab stays the full proof.

export type RequestRecord = { name: string; initiatorType: string; startTime: number };

export type RequestSummary = {
  count: number;
  /** Requests to another site than this one. */
  external: number;
  items: { host: string; type: string; sameOrigin: boolean }[];
};

export function summarizeRequests(
  records: readonly RequestRecord[],
  from: number,
  to: number,
  origin: string,
): RequestSummary {
  const items = records
    .filter(({ startTime }) => startTime >= from && startTime <= to)
    .map(({ name, initiatorType }) => {
      try {
        const url = new URL(name, origin);
        return { host: url.host, type: initiatorType, sameOrigin: url.origin === origin };
      } catch {
        return { host: 'unknown', type: initiatorType, sameOrigin: false };
      }
    });
  return { count: items.length, external: items.filter((item) => !item.sameOrigin).length, items };
}

/** Starts watching. Call the result when the check is done to get what the browser recorded. */
export function watchRequests(): () => RequestSummary | null {
  if (typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function')
    return () => null;
  try {
    performance.setResourceTimingBufferSize?.(1000);
  } catch {
    // Keep the default buffer.
  }
  const from = performance.now();
  return () => {
    const records = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return summarizeRequests(records, from, performance.now(), location.origin);
  };
}
