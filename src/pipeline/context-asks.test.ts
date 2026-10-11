import { describe, expect, it } from 'vitest';
import { analyze } from './analyze';

// Context that makes a request harmless (official link, chat invite, safety reminder, in person) and
// requests no legitimate service makes (password, PIN). Rules only, no model. Fresh wording, written
// separately from the frozen held-out set and the development sets.
const opts = { lang: 'en' as const, useLLM: false };
const level = async (text: string) => (await analyze({ text }, opts)).level;
const flagged = ['suspicious', 'likely_scam'];

describe('context-aware requests', () => {
  it.each([
    'Paalala mula sa BPI: may system upgrade sa Lunes. Detalye sa https://www.bpi.com.ph/advisories.',
    'Join our Saturday book club chat: https://chat.whatsapp.com/BOOKCLUB',
    'Kuya, bayaran mo na lang yung share mo sa kuryente pagkita natin sa Linggo.',
    'Mag-ingat: huwag magbayad ng fee sa sinumang nag-aalok ng trabaho online.',
    'Your parcel is on the way. There is nothing to pay the rider.',
    'Your portal account was locked. Please visit the school office in person to reset it.',
  ])('says probably fine for: %s', async (text) => {
    expect(await level(text)).toBe('probably_fine');
  });

  it.each([
    'Earn 800 daily from home! Join here: https://chat.whatsapp.com/EARNFAST',
    'We never ask for your OTP. Claim your bonus at bit.ly/claim-now',
    "If you don't pay the remaining balance today, your account will be blocked.",
    'Tito, nasira phone ko, replacement number ko ito. Pa-cover naman ng hospital bill ni Lola.',
  ])('never says probably fine for: %s', async (text) => {
    expect(await level(text)).not.toBe('probably_fine');
  });

  it.each([
    'GCash Support: i-send ang iyong MPIN para ma-verify ang account.',
    'Bank security: reply with your password so we can stop the unauthorized transfer.',
  ])('treats a password or PIN request as a likely scam: %s', async (text) => {
    expect(await level(text)).toBe('likely_scam');
  });

  it.each([
    "If you don't pay the remaining balance today, your account will be blocked.",
    'Tito, nasira phone ko, replacement number ko ito. Pa-cover naman ng hospital bill ni Lola.',
    'A release fee must be paid first before we ship your prize.',
    'Kailangan ng customs fee bago i-release; ipadala sa personal wallet ng rider.',
  ])('flags: %s', async (text) => {
    expect(flagged).toContain(await level(text));
  });
});
