import { describe, expect, it } from 'vitest';
import contextDev from '../../eval/context/dev.json';
import type { Lang, Level } from '../types';
import { analyze } from './analyze';

const flagged = (level: Level) => level === 'likely_scam' || level === 'suspicious';
const run = (text: string, lang: Lang = 'en') => analyze({ text }, { lang, useLLM: false });
const ids = (verdict: Awaited<ReturnType<typeof run>>) => verdict.signals.map(({ id }) => id);

describe('context development set (regression guard, rules only)', () => {
  const cases = contextDev as { id: string; lang: Lang; expected: Level; text: string }[];

  it.each(cases.filter((c) => c.expected === 'probably_fine').map((c) => [c.id, c] as const))(
    'does not flag legitimate %s',
    async (_, c) => {
      const verdict = await run(c.text, c.lang);
      expect(flagged(verdict.level)).toBe(false);
      expect(verdict.signals.filter(({ weight }) => weight > 0)).toEqual([]);
    },
  );

  it.each(cases.filter((c) => c.expected === 'likely_scam').map((c) => [c.id, c] as const))(
    'flags scam %s',
    async (_, c) => {
      expect(flagged((await run(c.text, c.lang)).level)).toBe(true);
    },
  );
});

describe('scam-awareness messages', () => {
  it.each([
    [
      'en',
      "Heads up, there's a fake GCash text going around saying your account is locked. Don't click the link, it's a scam.",
    ],
    [
      'fil',
      'Mag-ingat sa fake na text na nagsasabing may utang ka. Huwag magbayad. Kung may tanong, tawagan ang hotline sa likod ng inyong card.',
    ],
    [
      'taglish',
      'Uy ingat, may scam na nagte-text na taga-bangko daw sila tapos hihingin yung OTP mo. Wag mong ibibigay ha.',
    ],
  ] as [Lang, string][])('[%s] reports the scam without being flagged: %s', async (lang, text) => {
    const verdict = await run(text, lang);
    expect(verdict.level).toBe('probably_fine');
    expect(ids(verdict)).toEqual(['scam_awareness']);
    expect(verdict.explanation.headline).toMatch(/scam/i);
  });

  // Messages that borrow awareness wording but still ask for something.
  it.each([
    'Babala: May mga scammer. Huwag magbayad sa iba. Magbayad lang ng PHP 500 processing fee sa aming opisyal na app para ma-release ang inyong ayuda.',
    "Beware of fake texts. Don't click unknown links. To avoid suspension, send PHP 200 verification fee to our cashier.",
    'Ingat sa scam! Hindi kami humihingi ng OTP. Pero para ma-verify, i-reply ang iyong full name at birthday.',
    'Ingat po sa scam. Wag ibigay ang OTP. Pakisend na lang po ang PHP 300 sa account number 1234-5678-90 para ma-activate.',
    "Warning: fake riders are going around. Don't pay them. Pay your PHP 50 redelivery fee only to our official GCash 09171234567.",
    'Beware of scammers! Huwag ibigay ang OTP sa iba. To keep your account safe, verify at gcash-safe.xyz',
    'Mag-ingat sa mga scammer! Huwag magbigay ng OTP. I-claim ang inyong premyo na PHP 10,000 sa aming opisyal na app.',
    'This is not a scam! You won PHP 20,000. Do not share this with others. Claim at your nearest branch by paying PHP 500 first.',
  ])('still flags a scam that borrows awareness wording: %s', async (text) => {
    const verdict = await run(text);
    expect(flagged(verdict.level)).toBe(true);
    expect(ids(verdict)).not.toContain('scam_awareness');
  });

  it('treats "last warning" and a conditional threat as pressure, not advice', async () => {
    const verdict = await run(
      'Due na ang bill mo. Pay na sa official app. Last warning: kung hindi ka magbayad today, puputulan ka.',
      'taglish',
    );
    expect(verdict.level).toBe('likely_scam');
  });
});

describe('payment reminders through official channels', () => {
  it.each([
    [
      'en',
      'Your Metrobank credit card statement is ready. Minimum amount due: PHP 1,500.00, due Oct 25. Pay via the Metrobank app or online banking.',
    ],
    [
      'fil',
      'Maynilad: Ang inyong bill na PHP 645.20 ay dapat bayaran bago ang Okt 18. Maaaring magbayad sa opisyal na app o sa mga accredited na payment center.',
    ],
    [
      'taglish',
      'Hi! Friendly reminder lang na due na ang installment mo na PHP 2,450 sa Oct 18. Pay via the official app or sa partner outlets. Salamat!',
    ],
  ] as [Lang, string][])('[%s] is recognized as an ordinary reminder: %s', async (lang, text) => {
    const verdict = await run(text, lang);
    expect(verdict.level).toBe('probably_fine');
    expect(ids(verdict)).toEqual(['official_payment_notice']);
    expect(verdict.explanation.headline).not.toMatch(/\b(?:link|fee|threat)/i);
  });

  it.each([
    'Your statement is ready. Amount due PHP 4,500. Pay via the official app or send to GCash 09171234567 to avoid penalty.',
    'Meralco: Your bill of PHP 2,345 is due. Pay via the Meralco app at meralco-app.com.ph.verify.xyz',
    'Paalala: due na ang hulog mo. Magbayad sa aming opisyal na app: bit.ly/hulog',
    'Your loan installment of PHP 3,000 is overdue. Pay through our app today or we will contact your family.',
  ])('does not reassure a reminder with a number, odd link or threat: %s', async (text) => {
    const verdict = await run(text);
    expect(verdict.level).not.toBe('probably_fine');
    expect(ids(verdict)).not.toContain('official_payment_notice');
  });
});

describe('intent cues', () => {
  it('reads a login alert as a report, not a request to log in', async () => {
    const verdict = await run(
      'Paalala: May bagong pag-login sa iyong account noong Okt 11, 9:02 PM. Kung hindi ikaw ito, buksan ang opisyal na app at palitan ang iyong password.',
      'fil',
    );
    expect(verdict.level).toBe('probably_fine');
  });

  it('does not read "paki-send ang slides" as a money request', async () => {
    const verdict = await run(
      'Guys, meeting moved to 3PM tomorrow. Paki-send na lang ang slides before lunch, thanks!',
      'taglish',
    );
    expect(verdict.level).toBe('probably_fine');
  });

  it('keeps an unknown callback request about "your account" unsure', async () => {
    for (const text of [
      'Magandang araw po, tawagan po ninyo kami tungkol sa inyong account. Salamat po.',
      'Hi, pa-call back naman pag nabasa mo ito. About sa account mo.',
    ])
      expect((await run(text)).level).toBe('not_sure');
  });

  it.each([
    [
      'Final notice: You have an overdue loan. Pay PHP 4,200 today or we will contact all your contacts and post your photo online.',
      'coercion',
    ],
    [
      'Huling babala: May utang kang PHP 3,500. Magbayad ngayon din o ipapakalat namin ang litrato mo sa lahat ng contacts mo.',
      'coercion',
    ],
    [
      'Congratulations! Your number won PHP 50,000 in the Shopee 11.11 raffle. Claim it by paying the PHP 300 processing fee to GCash 09171234567.',
      'prize_or_job_bait',
    ],
    [
      'Magandang araw, taga-BDO po ito. May na-block kaming transaksyon. Pakisabi po ang 6-digit code na natanggap ninyo para makansela.',
      'bank_impersonation',
    ],
    [
      'Hi, the phone is still available. Send a PHP 1,000 deposit to reserve it first before you can see the item.',
      'marketplace_deposit',
    ],
  ])('rates a clear scam as likely: %s', async (text, signal) => {
    const verdict = await run(text);
    expect(verdict.level).toBe('likely_scam');
    expect(ids(verdict)).toContain(signal);
  });
});
