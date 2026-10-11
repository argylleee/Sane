import { describe, expect, it } from 'vitest';
import { buildReportText, type ReportParts } from './report';

const parts: ReportParts = {
  title: 'Sane scam check',
  checkedOn: 'Checked on 2026-10-11',
  result: 'Result: Likely a scam',
  flagsTitle: 'Red flags',
  flags: ['Asks for a one-time code'],
  messageTitle: 'Message',
  message: '  Send your OTP now  ',
  detailsTitle: 'Numbers and accounts',
  details: ['GCash 0917 123 4567'],
  footer: 'Checked on this device.',
};

describe('buildReportText', () => {
  it('lists the result, flags, details and the message', () => {
    expect(buildReportText(parts)).toBe(
      [
        'Sane scam check',
        'Checked on 2026-10-11',
        '',
        'Result: Likely a scam',
        '',
        'Red flags:',
        '- Asks for a one-time code',
        '',
        'Numbers and accounts:',
        '- GCash 0917 123 4567',
        '',
        'Message:',
        'Send your OTP now',
        '',
        'Checked on this device.',
      ].join('\n'),
    );
  });

  it('leaves out empty sections', () => {
    const text = buildReportText({ ...parts, flags: [], details: [], message: '' });
    expect(text).not.toContain('Red flags');
    expect(text).not.toContain('Numbers and accounts');
    expect(text).not.toContain('Message:');
  });
});
