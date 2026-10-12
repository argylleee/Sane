// OWNER: backend. Signal spans refer to this normalized copy of the input.
// Invisible characters: zero-width and joiner marks, soft hyphen, direction marks, variation
// selectors and Hangul fillers that scammers insert inside words ("O\u00adTP").
const INVISIBLE =
  /[\u00AD\u061C\u115F\u1160\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\u3164\uFEFF\uFFA0]|\u034F|\u17B4|\u17B5|\uFE0E|\uFE0F/g;
const CONFUSABLES: Record<string, string> = {
  а: 'a',
  А: 'A',
  е: 'e',
  Е: 'E',
  о: 'o',
  О: 'O',
  р: 'p',
  Р: 'P',
  с: 'c',
  С: 'C',
  х: 'x',
  Х: 'X',
  у: 'y',
  У: 'Y',
  і: 'i',
  І: 'I',
  ӏ: 'l',
  Ӏ: 'I',
  // Greek capitals and omicron drawn like Latin letters.
  Α: 'A',
  Β: 'B',
  Ε: 'E',
  Ζ: 'Z',
  Η: 'H',
  Ι: 'I',
  Κ: 'K',
  Μ: 'M',
  Ν: 'N',
  Ο: 'O',
  ο: 'o',
  Ρ: 'P',
  Τ: 'T',
  Υ: 'Y',
  Χ: 'X',
  // Small capitals from "fancy text" generators. NFKC leaves them unchanged.
  ᴀ: 'a',
  ʙ: 'b',
  ᴄ: 'c',
  ᴅ: 'd',
  ᴇ: 'e',
  ꜰ: 'f',
  ɢ: 'g',
  ʜ: 'h',
  ɪ: 'i',
  ᴊ: 'j',
  ᴋ: 'k',
  ʟ: 'l',
  ᴍ: 'm',
  ɴ: 'n',
  ᴏ: 'o',
  ᴘ: 'p',
  ǫ: 'q',
  ʀ: 'r',
  ꜱ: 's',
  ᴛ: 't',
  ᴜ: 'u',
  ᴠ: 'v',
  ᴡ: 'w',
  ʏ: 'y',
  ᴢ: 'z',
  // Upper-case forms of the small capitals that have one ("ɪ" becomes "Ɪ").
  Ɪ: 'I',
  Ǫ: 'Q',
  Ʀ: 'R',
};
const CONFUSABLE = new RegExp(`[${Object.keys(CONFUSABLES).join('')}]`, 'gu');
// A line break inside a sentence (no closing punctuation before it, a word or an amount after it)
// is wrapping, not a new message part. It becomes a space. A list item ("- ", "• ") stays a line.
const WRAPPED_LINE = /(?<=[^\s.!?;:])[ \t]*\r?\n(?=[ \t]*[\p{L}\p{N}₱$])/gu;
// Runs of spaces or tabs read as one space ("send  mo").
const SPACE_RUN = /[ \t]{2,}/g;

export function normalize(text: string): string {
  return text
    .normalize('NFKC')
    .replace(INVISIBLE, '')
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(CONFUSABLE, (char) => CONFUSABLES[char])
    .replace(WRAPPED_LINE, ' ')
    .replace(SPACE_RUN, ' ')
    .trim();
}
