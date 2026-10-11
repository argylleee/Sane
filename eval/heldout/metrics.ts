import type { Lang, Level } from '../../src/types';

export const levels: Level[] = ['likely_scam', 'suspicious', 'probably_fine', 'not_sure'];
export type Case = {
  id: string;
  lang: Lang;
  expected: Exclude<Level, 'not_sure'>;
  text: string;
  pattern: string;
  provenance: string;
};
// Expected 'not_sure' marks an ambiguous case: neither a scam nor a legitimate message in the counts.
export type Row = Pick<Case, 'id' | 'lang'> & { expected: Level; actual: Level };
const flagged = (level: Level) => level === 'likely_scam' || level === 'suspicious';
const ratio = (n: number, d: number) => (d === 0 ? null : n / d);

export function summarize(rows: Row[]) {
  const scams = rows.filter((r) => flagged(r.expected));
  const legit = rows.filter((r) => r.expected === 'probably_fine');
  const caught = scams.filter((r) => flagged(r.actual)).length;
  const falseAlarms = legit.filter((r) => flagged(r.actual)).length;
  const abstained = rows.filter((r) => r.actual === 'not_sure').length;
  const confusion = Object.fromEntries(
    levels.map((expected) => [
      expected,
      Object.fromEntries(
        levels.map((actual) => [
          actual,
          rows.filter((r) => r.expected === expected && r.actual === actual).length,
        ]),
      ),
    ]),
  );
  const perLabel = Object.fromEntries(
    levels.map((label) => {
      const expected = rows.filter((r) => r.expected === label);
      const predicted = rows.filter((r) => r.actual === label);
      const tp = expected.filter((r) => r.actual === label).length;
      const fp = predicted.length - tp;
      return [
        label,
        {
          expected: expected.length,
          predicted: predicted.length,
          tp,
          fp,
          precision: ratio(tp, predicted.length),
          recall: ratio(tp, expected.length),
          falsePositiveRate: ratio(fp, rows.length - expected.length),
          abstentionRate: ratio(
            expected.filter((r) => r.actual === 'not_sure').length,
            expected.length,
          ),
        },
      ];
    }),
  );
  return {
    total: rows.length,
    scams: scams.length,
    legit: legit.length,
    caught,
    falseAlarms,
    abstained,
    precision: ratio(caught, caught + falseAlarms),
    recall: ratio(caught, scams.length),
    falsePositiveRate: ratio(falseAlarms, legit.length),
    abstentionRate: ratio(abstained, rows.length),
    levelAgreement: ratio(rows.filter((r) => r.actual === r.expected).length, rows.length),
    confusion,
    perLabel,
    missedScams: scams.filter((r) => !flagged(r.actual)).map((r) => r.id),
    falseAlarmIds: legit.filter((r) => flagged(r.actual)).map((r) => r.id),
    abstentionIds: rows.filter((r) => r.actual === 'not_sure').map((r) => r.id),
    mismatchIds: rows.filter((r) => r.actual !== r.expected).map((r) => r.id),
  };
}
