import brands from '../data/brands.json';
import keywords from '../data/keywords.json';
import type { Signal } from '../types';

const URL_TEXT = /https?:\/\/[^\s<>"']+|(?:[\p{L}\p{N}-]+\.)+[\p{L}]{2,}(?:\/[^\s<>"']*)?/giu;

export function hasUrl(text: string): boolean {
  return text.search(URL_TEXT) >= 0;
}

/** The text with every link replaced by spaces, so words inside a link are not read as requests. */
export function stripUrls(text: string): string {
  return text.replace(URL_TEXT, (link) => ' '.repeat(link.length));
}

// Official public-sector domains (any subdomain), on top of the brand domains in brands.json.
const OFFICIAL_SUFFIXES = ['gov.ph'];
// Group invites and meeting links of major chat apps. They open a chat, not a login or payment page.
const PLATFORM_HOSTS = ['chat.whatsapp.com', 'meet.google.com', 'zoom.us', 'teams.microsoft.com'];

export type LinkTrust = 'none' | 'official' | 'platform' | 'unverified';

function hostOf(value: string): string | null {
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : 'https://' + value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

const onDomain = (host: string, domain: string) => host === domain || host.endsWith('.' + domain);

/**
 * The weakest link in the text: 'official' when every link is on a known brand or government domain,
 * 'platform' when some are chat-app invites or meeting links, 'unverified' when any other host appears.
 */
export function linkTrust(text: string): LinkTrust {
  let trust: LinkTrust = 'none';
  for (const match of text.matchAll(URL_TEXT)) {
    const host = hostOf(match[0].replace(/[),.!?;:]+$/, ''));
    if (!host || !host.includes('.')) continue;
    if (
      brands.brands.some(({ domains }) => domains.some((domain) => onDomain(host, domain))) ||
      OFFICIAL_SUFFIXES.some((domain) => onDomain(host, domain))
    ) {
      if (trust === 'none') trust = 'official';
    } else if (PLATFORM_HOSTS.some((domain) => onDomain(host, domain))) trust = 'platform';
    else return 'unverified';
  }
  return trust;
}

/** True when the text has a link whose host is not on a known official domain. */
export function hasUnverifiedUrl(text: string): boolean {
  const trust = linkTrust(text);
  return trust === 'unverified' || trust === 'platform';
}

export function urlSignals(text: string): Signal[] {
  const signals: Signal[] = [];
  for (const match of text.matchAll(URL_TEXT)) {
    const value = match[0].replace(/[),.!?;:]+$/, '');
    if (!value) continue;
    let host: string;
    try {
      host = new URL(
        /^https?:\/\//i.test(value) ? value : 'https://' + value,
      ).hostname.toLowerCase();
    } catch {
      continue;
    }
    const rawHost = value
      .replace(/^https?:\/\//i, '')
      .split(/[/?#]/, 1)[0]
      .toLowerCase();
    const compactHost = rawHost
      .replace(/0/g, 'o')
      .replace(/5/g, 's')
      .replace(/[^a-z0-9]/g, '');
    const span: [number, number] = [match.index, match.index + value.length];
    if (
      brands.brands.some(
        ({ name, domains }) =>
          compactHost.includes(name) &&
          !domains.some((domain) => host === domain || host.endsWith('.' + domain)),
      ) &&
      !signals.some((signal) => signal.id === 'lookalike_domain')
    ) {
      signals.push({
        id: 'lookalike_domain',
        label: 'Brand-like link outside its known domain',
        weight: 35,
        span,
      });
    }
    if (
      (keywords.shorteners.includes(host) ||
        keywords.suspicious_tlds.some((tld) => host.endsWith('.' + tld))) &&
      !signals.some((signal) => signal.id === 'suspicious_link')
    ) {
      signals.push({
        id: 'suspicious_link',
        label: 'Shortened link or unusual domain ending',
        weight: 15,
        span,
      });
    }
  }
  return signals;
}
