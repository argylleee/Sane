import { describe, expect, it } from 'vitest';
import { runRules } from '../rules';
import { findAsks } from '../rules/ask';
import type { Lang } from '../types';
import { analyze } from './analyze';
import { normalize } from './normalize';

// Obfuscated text, Filipino/Taglish money requests, impersonation with a payment and the benign
// controls around them. Rules only, no model. The three reported messages are kept verbatim; the
// other cases are fresh wording, separate from eval/obfuscation (dev and frozen holdout).
const run = (text: string, lang: Lang = 'taglish') => analyze({ text }, { lang, useLLM: false });
const level = async (text: string, lang?: Lang) => (await run(text, lang)).level;
const ids = (text: string) => runRules(normalize(text)).map(({ id }) => id);
const flagged = ['suspicious', 'likely_scam'];

describe('reported messages', () => {
  it('flags the small-caps prize split offer as suspicious', async () => {
    const verdict = await run(
      'ᴏᴋ ʟᴀɴɢ ʙᴀ ᴍᴀᴋɪᴘᴀɢ ᴅᴇᴀʟ ᴀᴋᴏ ꜱᴀʏᴏ ɪᴘᴀɴᴀʟᴏ ᴋɪᴛᴀ ɴɢ 20ᴋ ʙᴀꜱᴛᴀ ʜᴀᴛɪ ᴛᴀʏᴏ 5ᴋ ꜱᴀᴋᴇɴ 15ᴋ ꜱᴀʏᴏ ʀᴇᴘʟʏ ʏᴇꜱ ᴋᴜɴɢ ᴅᴇᴀʟ ᴋᴀ ᴀᴅᴅ ᴍᴇ ᴏ ᴍᴇꜱꜱᴀɢᴇ ᴍᴇ : 𝕄𝕖𝕤𝕤𝕒𝕘𝕖 𝕞𝕖 ℕ𝕆𝕎 𝔽𝔹 > Ari Arciaga ( yung naka sando po na black and may necklace tapos na ka smile po.',
    );
    expect(verdict.level).toBe('suspicious');
    expect(verdict.signals.map(({ id }) => id)).toContain('prize_fix');
  });

  it.each([
    [
      'fil',
      'hi si bruno mars to, sendan mo ako ng 10,000 pesos para makapunta ka sa concert ko sa May 2027',
    ],
    [
      'taglish',
      "Hi! It's me, Bruno Mars. Send ka ng ₱10,000 para ma-reserve ko yung special seat mo sa concert ko sa May 2027.",
    ],
  ] as const)(
    'rates a celebrity asking a fan for money as a likely scam (%s)',
    async (lang, text) => {
      const verdict = await run(text, lang);
      expect(verdict.level).toBe('likely_scam');
      expect(verdict.signals.map(({ id }) => id)).toEqual(['performer_claim']);
      expect(findAsks(normalize(text))).toContain('money');
      // The advice names the red flag that was actually found.
      expect(verdict.explanation.steps[0]).toMatch(/artista|celebrities/i);
    },
  );
});

describe('normalization', () => {
  it('reads small capitals as Latin letters and keeps every offset', () => {
    const text = 'ꜱᴇɴᴅ ᴍᴏ ᴀɴɢ ᴏᴛᴘ';
    expect(normalize(text)).toBe('send mo ang otp');
    expect(normalize(text)).toHaveLength(text.length);
  });

  it('removes invisible characters and reads Greek look-alike capitals', () => {
    expect(normalize('O\u2060T\u00adP\u200b')).toBe('OTP');
    expect(normalize('ΟΤΡ')).toBe('OTP');
  });

  it('joins a line that is wrapped mid-sentence without moving offsets', () => {
    const text = 'Padalhan mo ako\nng ₱2,000\npara sa ticket.\nSalamat';
    expect(normalize(text)).toBe('Padalhan mo ako ng ₱2,000 para sa ticket.\nSalamat');
    expect(normalize(text)).toHaveLength(text.length);
  });

  it.each([
    ['fil', 'ɪ-ꜱᴇɴᴅ ᴍᴏ ᴀɴɢ ᴍᴘɪɴ ᴍᴏ ᴘᴀʀᴀ ᴍᴀ-ᴜɴʟᴏᴄᴋ ᴀɴɢ ᴀᴄᴄᴏᴜɴᴛ'],
    ['en', 'Reply with your P\u200bI\u200bN to keep your account active.'],
    ['taglish', 'Paki-send ang\nOTP mo agad para ma-verify'],
  ] as const)('still catches a hidden code request (%s)', async (lang, text) => {
    expect(await level(text, lang)).toBe('likely_scam');
  });
});

describe('Filipino and Taglish money requests', () => {
  it.each([
    'sendan mo ako ng 2k pang-gas',
    'Mag-GCash ka ng ₱500 sa akin mamaya',
    'I-GCash mo na lang yung 1,500',
    'Send mo ng limang libo bukas',
    'Send me $50 tonight',
  ])('reads a money request in: %s', (text) => {
    expect(findAsks(normalize(text))).toContain('money');
  });

  it.each([
    'Na-sendan na kita ng 2k kanina.',
    'Nag-send na ako ng ₱500 kahapon.',
    'Na-GCash ko na yung 1,500, salamat!',
  ])('does not read a completed transfer as a request: %s', (text) => {
    expect(findAsks(normalize(text))).not.toContain('money');
  });

  it.each([
    'sendan mo ako ng 2k pang-gas',
    'Pa-send ng ₱300 pang-load, bayaran kita bukas.',
    'Mag-GCash ka ng ₱500 para sa share mo sa regalo ni Mama.',
  ])('does not flag a plain money request with no red flag: %s', async (text) => {
    expect(flagged).not.toContain(await level(text));
  });
});

describe('impersonation with a payment', () => {
  it.each([
    ['fil', 'Ako si Regine Velasquez. Padalhan mo ako ng ₱2,000 para sa VIP seat sa concert ko.'],
    ['en', 'Hi, this is Lady Gaga. Pay ₱4,000 via GCash for a meet and greet at my tour stop.'],
    [
      'taglish',
      'Hello, si Alden Richards po ito. Pa-send ng 3k para ma-reserve ko slot mo sa fan meet ko.',
    ],
  ] as const)('rates a performer asking for money as a likely scam (%s)', async (lang, text) => {
    expect(await level(text, lang)).toBe('likely_scam');
  });

  it.each([
    ['en', 'Hi, this is your supervisor. Buy four iTunes gift cards and text me the codes.'],
    ['fil', 'Ako ang manager mo. Bumili ka ng 3 Google Play card at ipadala sa akin ang mga code.'],
  ] as const)('rates a gift card code request as a likely scam (%s)', async (lang, text) => {
    expect(await level(text, lang)).toBe('likely_scam');
  });

  it.each([
    ['en', 'I can make you win the raffle. We split the 40k prize, PM me.'],
    ['fil', 'Ipapanalo kita sa giveaway ng 30,000 basta hatian tayo. I-message mo ako.'],
  ] as const)('flags an offer to rig a prize for a cut (%s)', async (lang, text) => {
    expect(flagged).toContain(await level(text, lang));
  });
});

describe('controls that ask the reader to do nothing risky', () => {
  it.each([
    ['en', "Hi, it's me, Regine! See you at my concert on Saturday."],
    ['fil', 'Ang ganda ng concert ni Regine Velasquez, ₱2,000 lang ang ticket.'],
    [
      'taglish',
      'Ingat, may nagpapanggap na si Alden Richards na nagpapa-send ng 3k para sa fan meet. Wag kayong mag-send.',
    ],
    ['taglish', 'Nanalo ako ng 10k sa raffle! Hati tayo sa merienda bukas, libre ko.'],
    ['en', 'Give the gift of play: Google Play gift cards are now available at 7-Eleven.'],
    ['fil', 'Nabayaran ko na ang ₱2,000 para sa ticket natin sa concert.'],
  ] as const)('does not flag: %s', async (lang, text) => {
    expect(flagged).not.toContain(await level(text, lang));
  });

  it.each([
    "Hi, it's me, Regine! See you at my concert on Saturday.",
    'Nanalo ako ng 10k sa raffle! Hati tayo sa merienda bukas, libre ko.',
  ])('raises no new signal for: %s', (text) => {
    expect(ids(text)).not.toContain('performer_claim');
    expect(ids(text)).not.toContain('prize_fix');
  });
});
