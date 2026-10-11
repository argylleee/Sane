// OWNER: backend. Signal spans refer to this normalized copy of the input.
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;
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
};

export function normalize(text: string): string {
  return text
    .normalize('NFKC')
    .replace(ZERO_WIDTH, '')
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[аеорсхуіӏАЕОРСХУІӀ]/g, (char) => CONFUSABLES[char])
    .trim();
}
