// OWNER: backend. What a message asks the reader to do. A message can only cause harm by itself if
// it asks for something: open a link, call or text a number, send money, give a code or personal
// details, or log in, sign up, claim or install. Code decides this, never a model.
import { maskNoPayment } from './index';
import { hasUrl, stripUrls } from './urls';

/** 'secret' is a request for a password or PIN, which no legitimate service asks for by message. */
export type AskKind =
  'link' | 'contact' | 'money' | 'credential' | 'secret' | 'personal' | 'account_action';

// Payment settled face to face ("pay your share when we meet") cannot be stolen by a message.
// Not a bare "personal": "transfer to the personal wallet of the dispatcher" is a scam.
const IN_PERSON =
  /\b(?:in person|face[- ]to[- ]face|when we meet|pagkita natin|pagkikita natin|nang personal|personal na pumunta|visit (?:the|our|your) (?:[\p{L}-]+ ){0,2}(?:office|branch|registrar|counter|store))\b/iu;

const MONEY_WORD = String.raw`(?:money|pera|cash|pesos?|piso|php|₱|p\s?\d|\d[\d,.]*\s?k\b|\d{1,3},\d{3}|gcash|maya|fee|bayad|payment|load|amount|halaga|deposit|balance)`;

// Verbs that hand something over. Negated uses ("huwag i-share", "never send") are removed first.
const REQUEST = String.raw`(?:send|share|give|provide|enter|submit|reply|forward|confirm|update|type|tell|ibigay|ipadala|i-?send|pa-?send|paki-?send|pakisabi|sabihin|ilagay|i-?share|ibahagi|ipasa|i-?forward|i-?type|i-?confirm|i-?update|copy of)`;
const PAY = String.raw`(?:pay|magbayad|mag-?pay|bayaran|send money|transfer money|magpadala)`;
const NEGATED_REQUEST = new RegExp(
  // A conditional threat ("kung hindi ka magbayad", "if you don't pay") still demands payment.
  String.raw`(?<!\b(?:kung|kapag|pag|if you|unless you)\s+)\b(?:do not|don't|never|huwag(?: mong| niyong)?|wag(?: mong)?|hindi)\s+(?:\S+\s+){0,2}(?:${REQUEST}|${PAY})\b[^.!?\n]*`,
  'giu',
);

const ASKS: [AskKind, RegExp][] = [
  [
    'contact',
    /(?:\+?63|\b0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}\b|\b(?:call|text|tawagan|i-?text|contact)\s+(?:us|me|this number|ang numerong ito|sa numerong ito|kami|ako)\b|\b(?:sa numerong ito|this number|numero na ito|number na ito)\b|\b(?:telegram|whatsapp|viber)\b|\b(?:message|dm|chat|pm)\s+(?:me|mo ako|niyo ako|us)\b/iu,
  ],
  [
    'money',
    new RegExp(
      String.raw`\b(?:pay|magbayad|mag-?pay|bayaran|babayaran|i-?pay|settle|deposit|mag-?deposit|magdeposito|pahiram|hiram|pautang|pakibalik|ibalik|i-?refund|top[ -]?up|mag-?top[ -]?up|mag-?load|pa-?load|pa-?gcash|padalhan|pambayad|pang-?bayad|abono|i-?abono|pakisend|paki-?send)\b|\b(?:send|i-?send|mag-?send|ipadala|magpadala|transfer|i-?transfer)\b[^.!?\n]{0,30}${MONEY_WORD}|\b(?:need|kailangan|kulang)\b[^.!?\n]{0,25}${MONEY_WORD}|\b(?:hospital|ospital|clinic|klinika|medical|tuition|matrikula)\s+(?:bill|fee|bayarin)s?\b|\b(?:help|tulungan|tulong)\b[^.!?\n]{0,25}\b(?:pay|bill|bayad|bayarin|gastos|pera|money)\b|\b(?:fee|charge|bayad|singil)\b[^.!?\n]{0,25}\b(?:be paid|paid first|paid before|settled)\b|\bcover (?:the |my |our )?(?:[\p{L}-]+ )?(?:bill|fee|gastos)\b`,
      'iu',
    ),
  ],
  [
    'credential',
    new RegExp(
      String.raw`\b${REQUEST}\b[^.!?\n]{0,40}\b(?:otp|pin|mpin|password|passcode|one[- ]time (?:password|code|pin)|verification code|login code|security code|code|6[- ]digit)\b`,
      'iu',
    ),
  ],
  [
    'secret',
    new RegExp(
      String.raw`\b${REQUEST}\b[^.!?\n]{0,40}\b(?:pin|mpin|password|passcode)\b(?! (?:reset|change))`,
      'iu',
    ),
  ],
  [
    'personal',
    new RegExp(
      String.raw`\b${REQUEST}\b[^.!?\n]{0,50}\b(?:valid id|government id|id|selfie|full name|buong pangalan|home address|address|birthday|date of birth|account number|card number|cvv|mother'?s maiden name|sss number|tin number|details|detalye)\b`,
      'iu',
    ),
  ],
  [
    'account_action',
    /\b(?:log ?in|mag-?log ?in|i-?log ?in|sign ?up|mag-?sign ?up|register|mag-?register|i-?register|verify|i-?verify|update (?:your|ang|mo ang) (?:details|account|info)|claim|i-?claim|click|i-?click|tap (?:here|the)|pindutin|download|i-?download|install|i-?install|reply with)\b/iu,
  ],
];

/** Every kind of request found in the text. An empty list means the message asks for nothing risky. */
export function findAsks(text: string): AskKind[] {
  // Words inside a link are not requests, "no payment needed" is not a demand, and "never share
  // this code" asks for nothing.
  const asked = maskNoPayment(stripUrls(text)).replace(NEGATED_REQUEST, ' ');
  const sentences = asked.match(/[^.!?\n]+[.!?\n]?/gu) ?? [];
  const kinds = ASKS.filter(([kind, pattern]) =>
    sentences.some(
      (sentence) => pattern.test(sentence) && !(kind === 'money' && goesInPerson(sentence)),
    ),
  ).map(([kind]) => kind);
  if (hasUrl(text)) kinds.unshift('link');
  return kinds;
}

/** The message warns against paying or sharing ("never pay a recruitment fee", "huwag i-share"). */
export function givesSafetyAdvice(text: string): boolean {
  return text.search(new RegExp(NEGATED_REQUEST.source, 'iu')) >= 0;
}

/** The message points to a face-to-face step (pay when we meet, visit the office in person). */
export function goesInPerson(text: string): boolean {
  return IN_PERSON.test(text);
}
