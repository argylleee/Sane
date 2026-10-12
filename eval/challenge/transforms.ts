// OWNER: model. Harmless rewrites of a message that a reader would see as the same text: fancy
// Unicode letters, invisible characters, look-alike letters, spacing, line wrapping, letter case and
// equivalent amount formats. Used to check that the detector treats equivalent text the same way.

const SMALL_CAPS = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ';
const mapLetters = (text: string, upper: number, lower: number, digit?: number) =>
  [...text]
    .map((char) => {
      const code = char.charCodeAt(0);
      if (char.length > 1) return char;
      if (code >= 65 && code <= 90) return String.fromCodePoint(upper + code - 65);
      if (code >= 97 && code <= 122) return String.fromCodePoint(lower + code - 97);
      if (digit !== undefined && code >= 48 && code <= 57)
        return String.fromCodePoint(digit + code - 48);
      return char;
    })
    .join('');
const insideWords = (text: string, every: number, mark: string) =>
  text.replace(/\p{L}{3,}/gu, (word) =>
    [...word].map((char, i) => (i > 0 && i % every === 0 ? mark + char : char)).join(''),
  );
const CYRILLIC: Record<string, string> = { a: 'а', e: 'е', o: 'о', p: 'р', c: 'с' };

export const TEXT_TRANSFORMS: Record<string, (text: string) => string> = {
  smallCaps: (text) =>
    [...text]
      .map((char) =>
        /[a-z]/i.test(char) ? SMALL_CAPS[char.toLowerCase().charCodeAt(0) - 97] : char,
      )
      .join(''),
  mathBold: (text) => mapLetters(text, 0x1d400, 0x1d41a, 0x1d7ce),
  mathSans: (text) => mapLetters(text, 0x1d5a0, 0x1d5ba, 0x1d7e2),
  fullWidth: (text) =>
    [...text]
      .map((char) => {
        const code = char.charCodeAt(0);
        if (char === ' ') return '\u3000';
        return char.length === 1 && code >= 0x21 && code <= 0x7e
          ? String.fromCharCode(code + 0xfee0)
          : char;
      })
      .join(''),
  zeroWidth: (text) => insideWords(text, 2, '\u200b'),
  softHyphen: (text) => insideWords(text, 3, '\u00ad'),
  nbsp: (text) => text.replace(/ /g, '\u00a0'),
  doubleSpace: (text) => text.replace(/ /g, '  '),
  wrapLines: (text) => {
    let n = 0;
    return text.replace(/ /g, () => (++n % 4 === 0 ? '\n' : ' '));
  },
  upperCase: (text) => text.toUpperCase(),
  lowerCase: (text) => text.toLowerCase(),
  cyrillic: (text) => text.replace(/[aeopc]/g, (char) => CYRILLIC[char]),
  emoji: (text) => `🙏 ${text.replace(/([.!?])(\s|$)/u, '$1 😊$2')}`,
};

// Amounts written as ₱4,500, PHP 4,500, P4500, 4,500 pesos or 4.5k all mean the same thing.
const AMOUNT =
  /(?:₱\s?|php\s?|(?<![\p{L}])p(?=\d))?(\d{1,3}(?:,\d{3})+(?:\.\d{2})?|\d+(?:\.\d)?\s?k\b|\d{3,})(?:\s?(?:pesos?|php)\b)?/iu;

function amountValue(raw: string): number {
  const k = /k$/i.test(raw.trim());
  const value = Number(raw.replace(/[,\sk]/gi, ''));
  return k ? value * 1000 : value;
}

const withCommas = (value: number) => value.toLocaleString('en-US');
export const AMOUNT_FORMATS: Record<string, (value: number) => string> = {
  peso: (value) => `₱${withCommas(value)}`,
  php: (value) => `PHP ${withCommas(value)}.00`,
  pPlain: (value) => `P${value}`,
  pesosWord: (value) => `${withCommas(value)} pesos`,
  kShort: (value) => (value % 100 === 0 && value >= 1000 ? `${value / 1000}k` : `₱${value}`),
};

/** The message with its first amount rewritten in `format`, or undefined when it has no amount. */
export function reformatAmount(
  text: string,
  format: keyof typeof AMOUNT_FORMATS,
): string | undefined {
  const match = AMOUNT.exec(text);
  if (!match) return undefined;
  const value = amountValue(match[1]);
  if (!Number.isFinite(value) || value < 100 || value > 1_000_000) return undefined;
  return (
    text.slice(0, match.index) +
    AMOUNT_FORMATS[format](value) +
    text.slice(match.index + match[0].length)
  );
}

/** Every harmless variant of a message: text transforms, amount formats and a few combinations. */
export function variants(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, transform] of Object.entries(TEXT_TRANSFORMS)) out[name] = transform(text);
  for (const format of Object.keys(AMOUNT_FORMATS)) {
    const changed = reformatAmount(text, format);
    if (changed !== undefined && changed !== text) out[`amount:${format}`] = changed;
  }
  const php = reformatAmount(text, 'php') ?? text;
  const k = reformatAmount(text, 'kShort') ?? text;
  out['smallCaps+amount:php'] = TEXT_TRANSFORMS.smallCaps(php);
  out['zeroWidth+wrapLines'] = TEXT_TRANSFORMS.wrapLines(TEXT_TRANSFORMS.zeroWidth(text));
  out['mathBold+amount:kShort'] = TEXT_TRANSFORMS.mathBold(k);
  out['cyrillic+nbsp'] = TEXT_TRANSFORMS.nbsp(TEXT_TRANSFORMS.cyrillic(text));
  return out;
}
