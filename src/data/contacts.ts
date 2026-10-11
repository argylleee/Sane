// OWNER: model (reference data). Where to report a scam or get help. Static text, no network.
// Disclose as hand-written reference data. Numbers change, so this file records where each came
// from and when it was last checked. Re-check before each release.
//
// Checked October 11, 2026 against public pages and news reports (sources below). The PNP-ACG and
// NBI-CCD pages are listed without phone numbers or emails because third-party guides disagree on
// them; the reader is sent to the official website instead.
import type { Lang } from '../types';

export const CONTACTS_CHECKED = '2026-10-11';

type Localized = Record<Lang, string>;

export type Contact = {
  id: 'cicc' | 'gcash' | 'maya' | 'bsp' | 'pnp_acg' | 'nbi_ccd' | 'your_bank';
  name: string;
  /** When to use this contact. */
  when: Localized;
  /** Phone number to dial, digits only, for a tel: link. */
  tel?: string;
  /** Phone number as it is written. */
  telText?: string;
  email?: string;
  /** Official website to open or type. Shown as text, never fetched by the app. */
  site?: string;
  /** Short note on how sure we are about the details. */
  note?: Localized;
  group: 'report' | 'paid';
  /** Wallet or bank name that makes this contact more relevant (matches Finding.channel). */
  channel?: string;
  source: string;
};

export const CONTACTS: Contact[] = [
  {
    id: 'cicc',
    name: 'CICC Hotline 1326',
    group: 'report',
    when: {
      en: 'Government hotline for online scams, phishing and text scams. Free, open 24/7.',
      fil: 'Hotline ng gobyerno para sa online scam, phishing at text scam. Libre at bukas 24/7.',
      taglish: 'Government hotline para sa online scams, phishing at text scams. Free at 24/7.',
    },
    tel: '1326',
    telText: '1326',
    source: 'https://alpha.pna.gov.ph/articles/1207775',
  },
  {
    id: 'pnp_acg',
    name: 'PNP Anti-Cybercrime Group',
    group: 'report',
    when: {
      en: 'File a police complaint for a cybercrime. Bring screenshots and payment receipts.',
      fil: 'Magsampa ng reklamo sa pulis para sa cybercrime. Dalhin ang screenshots at resibo.',
      taglish:
        'Mag-file ng police complaint para sa cybercrime. Dalhin ang screenshots at receipts.',
    },
    site: 'pnp.gov.ph',
    note: {
      en: 'Check the website for the current contact details.',
      fil: 'Tingnan ang website para sa kasalukuyang contact details.',
      taglish: 'Check ang website para sa current contact details.',
    },
    source:
      'https://www.respicio.ph/commentaries/how-to-report-an-online-scam-in-the-philippines-nbi-pnp-and-cybercrime-hotlines',
  },
  {
    id: 'nbi_ccd',
    name: 'NBI Cybercrime Division',
    group: 'report',
    when: {
      en: 'File a complaint with the NBI for online fraud, especially if money was lost.',
      fil: 'Magsampa ng reklamo sa NBI para sa online fraud, lalo na kung nawalan ng pera.',
      taglish: 'Mag-file ng complaint sa NBI para sa online fraud, lalo na kung may nawalang pera.',
    },
    site: 'nbi.gov.ph',
    note: {
      en: 'Check the website for the current contact details.',
      fil: 'Tingnan ang website para sa kasalukuyang contact details.',
      taglish: 'Check ang website para sa current contact details.',
    },
    source:
      'https://www.respicio.ph/commentaries/how-to-report-an-online-scam-in-the-philippines-nbi-pnp-and-cybercrime-hotlines',
  },
  {
    id: 'gcash',
    name: 'GCash',
    group: 'paid',
    channel: 'GCash',
    when: {
      en: 'Paid or shared a code on GCash? Call right away to report it and ask to block the account.',
      fil: 'Nagbayad o nagbigay ng code sa GCash? Tumawag agad para i-report at ipa-block ang account.',
      taglish:
        'Nag-pay o nag-share ng code sa GCash? Tumawag agad para i-report at ipa-block ang account.',
    },
    tel: '2882',
    telText: '2882',
    site: 'help.gcash.com',
    source:
      'https://www.sunstar.com.ph/davao/gcash-strengthens-user-support-through-official-help-channels-security-features',
  },
  {
    id: 'maya',
    name: 'Maya',
    group: 'paid',
    channel: 'Maya',
    when: {
      en: 'Paid or shared a code on Maya? Call to report it. Use the in-app Help Center if the line is busy.',
      fil: 'Nagbayad o nagbigay ng code sa Maya? Tumawag para i-report. Gamitin ang Help Center sa app kung busy ang linya.',
      taglish:
        'Nag-pay o nag-share ng code sa Maya? Tumawag para i-report. Gamitin ang Help Center sa app kung busy ang line.',
    },
    tel: '+63288457788',
    telText: '(02) 8845-7788',
    site: 'mayabank.ph/contact-us',
    source: 'https://www.mayabank.ph/contact-us/',
  },
  {
    id: 'your_bank',
    name: 'Your bank',
    group: 'paid',
    when: {
      en: 'Call the number on the back of your card, or open your bank app yourself. Never use a number from the message.',
      fil: 'Tawagan ang numero sa likod ng card mo, o buksan mo mismo ang bank app. Huwag gamitin ang numero sa mensahe.',
      taglish:
        'Tawagan ang number sa likod ng card mo, o i-open mo mismo ang bank app. Huwag gamitin ang number sa message.',
    },
    source: 'Standard consumer advice',
  },
  {
    id: 'bsp',
    name: 'BSP Consumer Assistance',
    group: 'paid',
    when: {
      en: 'If your bank or wallet does not help, the central bank takes complaints about banks and e-wallets.',
      fil: 'Kung hindi ka natulungan ng bank o wallet mo, tumatanggap ng reklamo ang BSP tungkol sa bangko at e-wallet.',
      taglish:
        'Kung hindi ka natulungan ng bank o wallet mo, tumatanggap ng complaints ang BSP tungkol sa banks at e-wallets.',
    },
    tel: '+63287087087',
    telText: '(02) 8708-7087',
    email: 'consumeraffairs@bsp.gov.ph',
    site: 'bsp.gov.ph',
    note: {
      en: 'Taken from bank disclosures. Confirm on bsp.gov.ph before you rely on it.',
      fil: 'Galing sa mga disclosure ng bangko. Kumpirmahin sa bsp.gov.ph bago umasa.',
      taglish: 'Galing sa bank disclosures. I-confirm sa bsp.gov.ph bago umasa.',
    },
    source: 'https://www.maybank.com.ph/en/customer-service/contact-us.page',
  },
];

/** Contacts to show for a result: money-related ones first when a wallet or bank was involved. */
export function rankContacts(channels: readonly string[], paidMoney: boolean): Contact[] {
  const named = new Set(channels);
  const score = (contact: Contact): number => {
    if (contact.channel && named.has(contact.channel)) return 0;
    if (paidMoney) return contact.group === 'paid' ? 1 : 2;
    return contact.group === 'report' ? 1 : 2;
  };
  return [...CONTACTS].sort((a, b) => score(a) - score(b));
}
