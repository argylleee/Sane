// OWNER: backend. Facts found by code. These are shown as details and never change the level,
// because the scoring thresholds were measured on the development and held-out sets without them.
import type { Finding } from '../types';

const PH_MOBILE = /(?<![\d+])(?:\+?63[\s.-]?|0)9\d{2}[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/gu;
const FOREIGN_NUMBER = /(?<![\w+])\+(?!63)[1-9]\d{0,2}[\s.-]?\d[\d\s.-]{6,11}\d(?!\d)/gu;
const BANK_ACCOUNT =
  /\b(?:acct|acc|account)\.?\s*(?:no\.?|number|num\.?|#)?\s*[:=-]?\s*(\d[\d\s-]{7,17}\d)(?!\d)/giu;
const CHANNELS: [RegExp, string][] = [
  [/\bg-?cash\b/iu, 'GCash'],
  [/\b(?:maya|paymaya)\b/iu, 'Maya'],
  [/\bcoins\.?ph\b/iu, 'Coins.ph'],
  [/\bgotyme\b/iu, 'GoTyme'],
  [/\bseabank\b/iu, 'SeaBank'],
  [/\bbdo\b/iu, 'BDO'],
  [/\bbpi\b/iu, 'BPI'],
  [/\bmetrobank\b/iu, 'Metrobank'],
  [/\blandbank\b/iu, 'Landbank'],
  [/\bunionbank\b/iu, 'UnionBank'],
  [/\bsecurity bank\b/iu, 'Security Bank'],
  [/\bpnb\b/iu, 'PNB'],
  [/\brcbc\b/iu, 'RCBC'],
  [/\bchinabank\b/iu, 'Chinabank'],
];
const WALLET_CHANNELS = new Set(['GCash', 'Maya', 'Coins.ph', 'GoTyme', 'SeaBank']);
const PAY_VERB =
  /\b(?:send|sent|padala|pa-?send|i-?send|ipadala|magpadala|transfer|deposit|bayad|bayaran|magbayad|pay|i-?pay|pa-?gcash|i-?gcash|cash ?in|pa-?load|remit)\b/iu;

const MAX_FINDINGS = 5;
const NEARBY = 80;

function formatMobile(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const local = digits.startsWith('63') ? `0${digits.slice(2)}` : digits;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

function channelNear(text: string, at: number, length: number): string | undefined {
  const around = text.slice(Math.max(0, at - NEARBY), at + length + NEARBY);
  return CHANNELS.find(([pattern]) => pattern.test(around))?.[1];
}

function askedToPay(text: string, at: number, length: number): boolean {
  const before = text.slice(Math.max(0, at - NEARBY), at);
  const after = text.slice(at + length, at + length + 40);
  return PAY_VERB.test(before) || PAY_VERB.test(after);
}

export function findDetails(text: string): Finding[] {
  const found: Finding[] = [];
  const seen = new Set<string>();
  const add = (finding: Finding) => {
    const key = `${finding.kind}:${finding.value}`;
    if (seen.has(key) || found.length >= MAX_FINDINGS) return;
    seen.add(key);
    found.push(finding);
  };
  const accountRanges: [number, number][] = [];

  for (const match of text.matchAll(BANK_ACCOUNT)) {
    const digits = match[1].replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 16) continue;
    accountRanges.push([match.index, match.index + match[0].length]);
    add({
      kind: 'payment_account',
      value: match[1].trim(),
      channel: channelNear(text, match.index, match[0].length),
      askedToPay: askedToPay(text, match.index, match[0].length),
    });
  }

  for (const match of text.matchAll(PH_MOBILE)) {
    const end = match.index + match[0].length;
    if (accountRanges.some(([from, to]) => match.index >= from && end <= to)) continue;
    const channel = channelNear(text, match.index, match[0].length);
    const pays = askedToPay(text, match.index, match[0].length);
    const wallet = channel !== undefined && WALLET_CHANNELS.has(channel);
    // A mobile number next to a wallet name and a payment verb is a payment account.
    add(
      wallet && pays
        ? { kind: 'payment_account', value: formatMobile(match[0]), channel, askedToPay: true }
        : { kind: 'phone_ph', value: formatMobile(match[0]), askedToPay: pays },
    );
  }

  for (const match of text.matchAll(FOREIGN_NUMBER)) {
    const digits = match[0].replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) continue;
    add({
      kind: 'phone_foreign',
      value: match[0].trim(),
      askedToPay: askedToPay(text, match.index, match[0].length),
    });
  }
  return found;
}
