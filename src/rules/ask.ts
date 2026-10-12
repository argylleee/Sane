// OWNER: backend. What a message asks the reader to do. A message can only cause harm by itself if
// it asks for something: open a link, call or text a number, send money, give a code or personal
// details, or log in, sign up, claim or install. Code decides this, never a model.
import {
  maskDeliveryNotice,
  maskNoPayment,
  maskOfficialPayment,
  maskOwnTransaction,
  scamAwarenessSpan,
} from './index';
import { CARD_BUY, GAP, GIFT_CARD, MONEY_WORD, NOT_DONE, PAYMENT_REQUEST } from './money';
import { hasUrl, stripUrls } from './urls';

/** 'secret' is a request for a password or PIN, which no legitimate service asks for by message. */
export type AskKind =
  'link' | 'contact' | 'money' | 'credential' | 'secret' | 'personal' | 'account_action';

// Payment settled face to face ("pay your share when we meet") cannot be stolen by a message.
// Not a bare "personal": "transfer to the personal wallet of the dispatcher" is a scam.
const IN_PERSON =
  /\b(?:in person|face[- ]to[- ]face|when we meet|pagkita natin|pagkikita natin|nang personal|personal na pumunta|visit (?:the|our|your) (?:[\p{L}-]+ ){0,2}(?:office|branch|registrar|counter|store))\b/iu;

// Verbs that hand something over. Negated uses ("huwag i-share", "never send") are removed first.
const REQUEST = String.raw`(?:send|share|give|provide|enter|i-?enter|submit|reply|forward|confirm|update|type|tell|ibigay|ipadala|i-?send|pa-?send|paki-?send|pakisabi|sabihin|ilagay|i-?share|ibahagi|ipasa|i-?forward|i-?type|i-?confirm|i-?update|copy of)`;
const PAY = String.raw`(?:pay|magbayad|mag-?pay|bayaran|send money|transfer money|magpadala)`;
// Link and login actions a safety reminder tells the reader not to take.
const LINK_ACTION = String.raw`(?:click|i-?click|tap|pindutin|open|buksan|i-?open|log ?in|mag-?log ?in|download|i-?download|install|i-?install)`;
const NEGATED_REQUEST = new RegExp(
  // A conditional threat ("kung hindi ka magbayad", "if you don't pay") still demands payment.
  String.raw`(?<!\b(?:kung|kapag|pag|if you|unless you)\s+)\b(?:do not|don't|never|huwag(?: mong| niyong)?|wag(?: mong)?|hindi)\s+(?:[^\s.!?]+\s+){0,3}(?:${REQUEST}|${PAY}|${LINK_ACTION})\b(?:(?!\b(?:and|then|at|tapos|pero|but|instead|just|lang)\b)[^.!?\n])*`,
  'giu',
);

const ASKS: [AskKind, RegExp][] = [
  [
    'contact',
    /(?:\+?63|\b0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}\b|\b(?:call|text|tawagan|i-?text|contact|pa-?call|pakitawagan)(?:\s+(?:po|ninyo|niyo|nyo|mo|naman|lang|na))*\s+(?:us|me|this number|ang numerong ito|sa numerong ito|kami|ako|back)\b|\b(?:pa-?call back|call ?back|callback|pakitawagan)\b|\b(?:sa numerong ito|this number|numero na ito|number na ito)\b|\b(?:telegram|whatsapp|viber)\b|\b(?:message|i-?message|msg|dm|i-?dm|chat|pm|i-?pm|add|i-?add)\s+(?:(?:mo|niyo|nyo|ninyo|lang|na|po|naman)\s+){0,3}(?:me|ako|us|kami)\b|\b(?:message|i-?message|msg|dm|i-?dm|chat|pm|i-?pm)\s+mo\s+(?:(?:lang|na|naman)\s+)?ko\b/iu,
  ],
  [
    'money',
    new RegExp(
      String.raw`${NOT_DONE}\b(?:pay|paying|magbayad|mag-?pay|bayaran|babayaran|i-?pay|settle|deposit|mag-?deposit|magdeposito|pahiram|hiram|pautang|pakibalik|ibalik|i-?refund|top[ -]?up|mag-?top[ -]?up|mag-?load|pa-?load|pa-?gcash|padalhan|pambayad|pang-?bayad|abono|i-?abono)\b|${NOT_DONE}\b(?:send|sendan|i-?send|mag-?send|pakisend|paki-?send|pa-?send|pa-?sendan|ipadala|pakipadala|magpadala|transfer|i-?transfer|mag-?gcash|i-?gcash|gcash-?an|mag-?maya|i-?maya)\b${GAP}{0,30}${MONEY_WORD}|${PAYMENT_REQUEST}|${CARD_BUY}${GAP}{0,40}${GIFT_CARD}|\b(?:need|kailangan|kulang)\b${GAP}{0,25}${MONEY_WORD}|\b(?:hospital|ospital|clinic|klinika|medical|tuition|matrikula)\s+(?:bill|fee|bayarin)s?\b|\b(?:help|tulungan|tulong)\b[^.!?\n]{0,25}\b(?:pay|bill|bayad|bayarin|gastos|pera|money)\b|\b(?:fee|charge|bayad|singil)\b[^.!?\n]{0,25}\b(?:be paid|paid first|paid before|settled)\b|\bcover (?:the |my |our )?(?:[\p{L}-]+ )?(?:bill|fee|gastos)\b`,
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
    /(?<!\b(?:new|bagong|pag|recent|unusual|suspicious|unauthorized|failed|another|may)[\s-])\b(?:log ?in(?!\s+(?:attempt|alert|activity|from|detected|notification))|mag-?log ?in|i-?log ?in|sign ?up|mag-?sign ?up|register|mag-?register|i-?register|verify|i-?verify|update (?:your|ang|mo ang) (?:details|account|info)|claim|i-?claim|click|i-?click|tap (?:here|the)|pindutin|download|i-?download|install|i-?install|reply with)\b/iu,
  ],
];

/** Every kind of request found in the text. An empty list means the message asks for nothing risky. */
export function findAsks(text: string): AskKind[] {
  // A scam-awareness message with no number, unverified link or request for a code or details
  // reports what scammers ask; it asks the reader for nothing.
  if (scamAwarenessSpan(text)) return hasUrl(text) ? ['link'] : [];
  // Words inside a link are not requests, "no payment needed" is not a demand, and "never share
  // this code" asks for nothing.
  const asked = stripUrls(
    maskOfficialPayment(maskDeliveryNotice(maskOwnTransaction(maskNoPayment(text)))),
  ).replace(NEGATED_REQUEST, ' ');
  const sentences = asked.match(new RegExp(String.raw`${GAP}+[.!?\n]?`, 'gu')) ?? [];
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
