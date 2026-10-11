import { describe, expect, it } from 'vitest';
import { analyze } from './analyze';

// Real-format bank and wallet code notices: they describe the reader's own transaction and warn
// against sharing the code. They must not be flagged, and nothing in them may be highlighted.
const notices = [
  "Did you request to SEND MONEY to NI**L TE**Y V.'s GCash number, 09948098835 with amount of PHP 300.00? If not, DON'T ENTER YOUR OTP ON ANY SITE OR SEND IT TO ANYONE because IT'S A SCAM!\n\nIf you requested, your OTP is 482072.",
  'Did you request to SEND MONEY to NI**L TE**Y V.’s GCash number, 09948098835 with amount of PHP 300.00? If not, DON’T ENTER YOUR OTP ON ANY SITE OR SEND IT TO ANYONE because IT’S A SCAM! If you requested, your OTP is 482072.',
  "Did you try to LOG IN to your GCash account on a new device? If not, DON'T ENTER YOUR OTP ON ANY SITE OR SEND IT TO ANYONE because IT'S A SCAM! If yes, your OTP is 551203.",
  "Did you request to CASH IN PHP 1,000.00 to your GCash via 7-Eleven? If not, DON'T ENTER YOUR OTP ON ANY SITE OR SEND IT TO ANYONE because IT'S A SCAM! If you requested, your OTP is 918273.",
  "Did you request to PAY PHP 1,250.00 to MERALCO? If not, don't enter your OTP on any site or send it to anyone because it's a scam! If you requested, your OTP is 300912.",
  "Did you request to TRANSFER PHP 5,000.00 to BPI account ending 4421? If not, DON'T SHARE YOUR OTP OR GIVE IT TO ANYONE. Your OTP is 774410.",
  'Your Maya one-time PIN is 662190. Never share your OTP with anyone, including Maya employees. Maya will never call or text you to ask for your OTP.',
  'BPI: Your One-Time PIN is 120934 for your transfer of PHP 1,000.00 to account ending 1234. Do not share this with anyone. BPI will never ask for your OTP.',
  'BDO: Your OTP is 448812 for your transaction of PHP 5,000.00 at SHOPEE. It is valid for 5 minutes. Never share your OTP with anyone, even with BDO personnel.',
  'Your OTP is 309112. DO NOT share it with anyone, even with UnionBank personnel.',
  '[Shopee] Your verification code is 552901. Do not share it with anyone. Valid for 15 minutes.',
  'Was this you? A transfer of PHP 2,000.00 to account ****1234 was requested. If not, do not share your OTP. Your OTP is 445566.',
  'Ikaw ba ay nag-request na magpadala ng PHP 300.00 sa 09171234567? Kung hindi, HUWAG IBIGAY ANG OTP KAHIT KANINO dahil SCAM ITO! Kung ikaw, ang OTP mo ay 482072.',
  'Nag-request ka ba to send PHP 300 to 09171234567? Kung hindi, wag i-enter ang OTP sa kahit anong site o i-send ito kahit kanino. Kung oo, ang OTP mo ay 123456.',
  'Did you log in on a new device? If not, never share your OTP, and change your password in the app.',
  'We will never ask you to send your PIN.',
  'BDO will never ask you to share your MPIN or OTP.',
];

// Scams that copy the notice format or twist the warning. They must stay flagged.
const scams = [
  'Your OTP is 123456. Please send it to our agent at 09171234567 to verify your account.',
  'GCash: Did you request to send money? If not, click https://gcash-cancel.xyz to cancel the transaction.',
  'Did you request to SEND MONEY of PHP 5,000? If not, reply with the OTP we sent to cancel the transaction.',
  "We sent you an OTP by mistake. Don't worry, just send it back to me.",
  'Hi, this is GCash. Did you request a refund? Kindly send the 6-digit code to confirm.',
  "Don't share your OTP with others, but please send it to me so I can verify your payment.",
  'Did you request to send money? If not, call our hotline 09171234567 immediately to cancel.',
  'Kung hindi ikaw ang nag-request, i-send mo ang OTP sa amin para ma-cancel.',
  "Did you request to SEND MONEY to 09171234567? If not, don't enter your OTP on any site. Send it to our agent instead to cancel.",
  "Don't enter your OTP on any site, just send it to me directly so I can cancel the transfer.",
  'Did you request to send money? Send PHP 500 to 09171234567 to reverse the transaction.',
  'Did you request to SEND MONEY? If not, verify your account at https://gcash-help.com to stop it.',
  "Did you request to SEND MONEY of PHP 5,000? If not, don't share your OTP. Call our hotline 09171234567 immediately to cancel.",
  'Your OTP is 123456. Never share it. To cancel, pay PHP 500 to 09171234567.',
  'Did you request a loan of PHP 20,000? Never share your OTP. To release it, pay the processing fee first.',
  'Never share your OTP or send it to anyone except our verified agent at 09171234567.',
  'Do not share your OTP with anyone but our GCash agent. Reply with it now.',
  'Huwag ibigay ang OTP kahit kanino maliban sa aming agent.',
  "Did you request to send money? If not, don't enter your OTP. Kindly reply with your MPIN to cancel.",
];

const opts = { lang: 'en' as const, useLLM: false };

describe('bank and wallet code notices', () => {
  it.each(notices)('is probably fine with nothing highlighted: %s', async (text) => {
    const verdict = await analyze({ text }, opts);
    expect(verdict.level).toBe('probably_fine');
    expect(verdict.signals.filter(({ weight }) => weight > 0)).toEqual([]);
  });

  it.each(scams)('still flags a scam that copies the format: %s', async (text) => {
    const verdict = await analyze({ text }, opts);
    expect(['likely_scam', 'suspicious']).toContain(verdict.level);
  });

  it('does not call a notice with a mobile number to call reassuring', async () => {
    const verdict = await analyze(
      {
        text: 'Was this you? If not, never share your OTP and call 09171234567 to block your account.',
      },
      opts,
    );
    expect(verdict.level).not.toBe('probably_fine');
  });
});
