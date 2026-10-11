// OWNER: frontend. Plain text a reader can paste into a report to the CICC, a bank or a wallet.
// The reader asks for it, so the original message is included here. The share card is different
// and never carries the message.

export type ReportParts = {
  title: string;
  checkedOn: string;
  result: string;
  flagsTitle: string;
  flags: string[];
  messageTitle: string;
  message: string;
  detailsTitle: string;
  details: string[];
  footer: string;
};

export function buildReportText(parts: ReportParts): string {
  const lines = [parts.title, `${parts.checkedOn}`, '', parts.result];
  if (parts.flags.length)
    lines.push('', `${parts.flagsTitle}:`, ...parts.flags.map((f) => `- ${f}`));
  if (parts.details.length)
    lines.push('', `${parts.detailsTitle}:`, ...parts.details.map((d) => `- ${d}`));
  if (parts.message.trim()) lines.push('', `${parts.messageTitle}:`, parts.message.trim());
  lines.push('', parts.footer);
  return lines.join('\n');
}
