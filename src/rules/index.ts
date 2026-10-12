// OWNER: backend. All matching is local and never opens a message link.
import keywords from '../data/keywords.json';
import type { Signal } from '../types';
import {
  CARD_BUY,
  CODE_HANDOVER,
  FAN_PERK,
  GIFT_CARD,
  OFFICIAL_TICKETING,
  PAYMENT_REQUEST,
  PRIZE_CUT,
  SENDER_CLAIM,
  WIN_FOR_READER,
} from './money';
import { hasUnverifiedUrl, hasUrl, urlSignals } from './urls';

const WORD = /[\p{L}\p{N}]/u;
const SAFE_CREDENTIAL =
  /(?:do not|don't|never|huwag|wag)\s+(?:(?:ask\s+(?:you\s+)?to)\s+)?(?:share|send|give|provide|enter|i-enter|submit|reply|ibigay|i-send|sabihin|ipasa|ibahagi|i-share|ibabahagi)[^.!?;]{0,35}\b(?:otp|pin|mpin|code|password)\b/giu;
const SAFE_PRONOUN =
  /(?:huwag|wag)\s+(?:itong|ito|iyan|yan)\s+(?:ibigay|ibahagi|i-?share|i-?send|ipadala|sabihin)\b|(?:do not|don't|never|huwag|wag)\s+(?:share|send|give|enter|i-enter|ibigay|i-send|i-share)[^.!?;]{0,20}\b(?:it|ito|yan|this|them)\b/giu;
const CREDENTIAL_REQUEST =
  /\b(?:send|share|give|provide|enter|submit|reply|confirm|verify|forward|i-forward|ibigay|ipadala|ipasa|ibahagi|isend|i-send|paki-send|pakisend|pakisabi|sabihin|ilagay|i-share|pa-send)\b[^.!?;]{0,35}\b(?:otp|pin|mpin|password|code)\b/giu;
const CARD_DATA_REQUEST =
  /\b(?:send|share|give|provide|enter|submit|reply|confirm|verify|ibigay|isend|i-send|pakisend|sabihin|ilagay|i-share|pa-send)\b[^.!?;]{0,45}\b(?:card number|card no\.?|cvv|cvc|security code|expiry|expiration|valid thru|numero ng card|likod ng card)\b/giu;
const FOLLOWUP_CODE_REQUEST =
  /\b(?:send|share|give|ibigay|i-send|i-share)\b[^.!?;]{0,18}\b(?:it|ito|yan)\b/giu;
const READ_BACK_CODE =
  /\b(?:read back|tell us|tell me|pakisabi)\b.{0,35}\b(?:six|6|anim)\s*[- ]?\s*(?:digit|digits|number|numero)\b/giu;
const PERSONAL_DATA_REQUEST =
  /\b(?:ibigay|send|share|provide|ilagay|submit|provide us|reply|i-?reply|i-?type)\b[^.!?;]{0,60}\b(?:buong pangalan|full name|bank account|account number|numero ng bank account|card number|home address|address|birthday|date of birth|government id|id number|sss number|philhealth number|selfie)\b/giu;
const SAFE_PERSONAL_DATA =
  /(?:do not|don't|never|huwag|wag)\s+(?:(?:ask\s+(?:you\s+)?to)\s+)?(?:ibigay|send|share|provide|ilagay|submit)[^.!?;]{0,60}\b(?:buong pangalan|full name|bank account|account number|numero ng bank account|card number|home address|address|birthday|date of birth|government id|id number|sss number|philhealth number|selfie)\b/giu;
const SAFE_CARD_DATA =
  /(?:do not|don't|never|huwag|wag)\s+(?:(?:ask\s+(?:you\s+)?to)\s+)?(?:send|share|give|provide|enter|submit|ibigay|ilagay|i-share)[^.!?;]{0,45}\b(?:card number|card no\.?|cvv|cvc|security code|expiry|expiration|valid thru|numero ng card|likod ng card)\b/giu;
const SAFE_FINANCE_REQUEST =
  /(?:do not|don't|never|huwag|wag)\s+(?:ask|request|require|humingi|hihingi)[^.!?;]{0,50}\b(?:otp|pin|mpin|password|code|card|bank account|account number|cvv)\b/iu;
const LINK_ACTION =
  /\b(?:pindutin|i-click|click|tap|buksan|open|visit|bisitahin|go to|punta sa|at|sa)\b.{0,20}\blink\b/giu;
const COERCION =
  /\b(?:i-text|ite-?text|isasabi|sabihin|expose|report|i-send|send|ipakita|ikakalat|ikalat|ipapakalat|ipagkakalat|i-post|ipo-?post|post|leak|contact|message|i-?message|tawagan)\b.{0,60}\b(?:family|friends|pamilya|kamag-anak|kaibigan|contacts|contact list|kakilala)\b|\b(?:post|i-?post|ipo-?post|ipopost|ipapakalat|ikakalat|ipagkakalat|expose|leak)\b[^.!?\n]{0,25}\b(?:photos?|pictures?|pics?|litrato|larawan|selfie|videos?)\b/giu;

const DELIVERY_CONTEXT =
  /\b(?:parcel|package|delivery|rider|courier|warehouse|shipment|order|padala|package)\b/iu;
const DELIVERY_ACTION =
  /\b(?:fee|pay|payment|magbayad|mag-pay|bayaran|link|click|pindutin|address is incomplete|kulang ang address|customs)\b/iu;
const FINANCE_CONTEXT =
  /\b(?:gcash|maya|bdo|bpi|unionbank|metrobank|security bank|rcbc|landbank|pnb|gotyme|coins\.ph|bank|bangko|e-wallet|wallet|card)\b/iu;
const FINANCE_IMPERSONATION =
  /\b(?:security desk|security team|support team|customer service|helpdesk|bank staff|wallet team|account department|card security|empleyado ng bangko|customer service|fraud (?:team|department|unit)|anti-?fraud|taga-?(?:bdo|bpi|gcash|maya|bangko|bank|landbank|metrobank|unionbank))\b/iu;
const FINANCE_ACTION =
  /\b(?:read back|tell us|send|share|verify|confirm|update|unlock|reactivate|click|pindutin|link|otp|pin|password|code)\b/iu;
const JOB_CONTEXT =
  /\b(?:job|hiring|recruit|work from home|part-time|part time|reviewer|trabaho|empleo|kita|income|salary|sweldo|tasks?|cash out|screening|onboarding)\b/iu;
const JOB_RISK =
  /\b(?:registration fee|training fee|deposit|pay|send money|guaranteed|personal information|telegram|bayad|mag-deposit|magpadala|top[ -]?up|working balance|valid id|selfie)\b/iu;
const INVESTMENT_CONTEXT =
  /\b(?:invest|investment|crypto|trading|profit|returns|tubo|puhunan|mag-invest|pag-iinvest)\b/iu;
const INVESTMENT_RISK =
  /\b(?:guaranteed|guarantees?|garantisado|garantisadong|siguradong|sure profit|double|doble|dodoble|limited slots|kaunti na lang|quick return|sure win)\b/iu;
const GUARANTEED_RETURN =
  /\b(?:guaranteed|guarantees?|garantisado|garantisadong|siguradong|sure profit|double|doble|dodoble)\b/iu;
const GOVERNMENT_CONTEXT =
  /\b(?:government|gobyerno|ayuda|benefit|subsidy|grant|relief|dswd|sss|philhealth|pag-ibig|bir)\b/iu;
const GOVERNMENT_ACTION =
  /\b(?:claim|release|register|verify|confirm|link|click|pindutin|ibigay|send|share|account number|bank account|magpadala)\b/iu;
// Online casino and betting spam: free spins or bonus money plus a push to log in, sign up or claim.
const GAMBLING_CONTEXT =
  /\b(?:free\s*spins?|libreng\s+spin|spin\s+the\s+wheel|jackpot|casino|slot\s+(?:machines?|games?)|e-?sabong|online\s+sabong|betting|welcome\s+bonus|free\s+(?:bonus|credits?)|free\s+\d{2,4}\b(?!\s*(?:texts?|sms|mb|gb|mins?|minutes|calls?|load))|bonus\s+credits?|susunod\s+na\s+maswerte|lucky\s+(?:player|spin))\b/iu;
const GAMBLING_ACTION =
  /\b(?:log\s?in|mag-?login|i-?login|sign\s?up|mag-?sign\s?up|register|mag-?register|join|sumali|maglaro|play|claim|i-?claim|withdraw|i-?withdraw|deposit|mag-?deposit|nakakuha|makukuha|makakuha|nanalo|panalo|manalo|won|win|ikaw na ang susunod|you(?:'re| are| could be) next)\b/iu;
// A prize someone has supposedly won ("your number won PHP 50,000", "nanalo ng bagong cellphone").
const PRIZE_WIN =
  /\b(?:won|wins|nanalo|winner|panalo)\b[^.!?\n]{0,30}(?:₱|php|p\s?\d|\d{1,3},\d{3}|prize|premyo|iphone|cellphone|raffle)/iu;
// An amount someone can supposedly earn ("earn 800 daily", "kumita ng P2,000").
const EARN_PROMISE =
  /\b(?:earn|earning|kumita|kikita|kita ka|income of)\b[^.!?\n]{0,25}(?:₱|php|p\s?\d|\d)/iu;
const ROMANCE_CONTEXT =
  /\b(?:sweetheart|honey|darling|love|romance|dating|relationship|mahal|sinta|nakilala|girlfriend|boyfriend)\b/iu;
const ROMANCE_ACTION =
  /\b(?:send money|send funds|transfer funds|ipadala ang pera|ipadala mo|padala|loan|pautang|invest|deposit|fee|magpadala|mag-invest|kailangan ko ng pera|need money)\b/iu;

// Match combinations rather than treating an ordinary payment alone as a scam.
const BENEFIT_CONTEXT =
  /\b(?:prize|raffle|reward|premyo|loan|pautang|utang|ayuda|aid|grant|tulong pinansyal|job|trabaho|tasks?|part-time|work)\b/iu;
const ADVANCE_PAYMENT =
  /\b(?:pay|paying|send|transfer|magbayad|bayaran|magpadala|magdeposito)\b(?=[^.!?;]{0,70}\b(?:fee|charge|bayad|singil|deposit|collect|receive|release|matanggap|makuha)\b)[^.!?;]{0,55}\b(?:first|before|advance|upfront|muna|bago|paunang)\b|\b(?:top[ -]up|mag-top[ -]up|dagdagan)\b[^.!?;]{0,25}\b(?:working balance|balanse)\b|\b(?:fee|charge|bayad|singil)\b[^.!?;]{0,30}\b(?:paid|settled)\b[^.!?;]{0,20}\b(?:first|before|upfront|in advance)\b/iu;
const MARKETPLACE_CONTEXT = /\b(?:marketplace|item|seller|binebenta\w*|gamit)\b/iu;
const BEFORE_INSPECTION =
  /\b(?:send|pay|transfer|magdeposito|mag-deposit|magbayad)\b[^.!?;]{0,30}\b(?:deposit|reservation|reserve|bago)\b[^.!?;]{0,35}\b(?:before|bago)\b[^.!?;]{0,25}\b(?:inspect\w*|see|view|makita|ma-inspect|masuri|tingnan)\b|\bmagdeposito\b[^.!?;]{0,25}\bbago\b[^.!?;]{0,25}\b(?:makita|masuri)\b/iu;
const RELATIVE_CONTEXT =
  /\b(?:sister|brother|daughter|son|mother|father|mom|dad|mama|papa|cousin|anak|kapatid|pinsan|nanay|tatay|lola|lolo|tita|tito)\b/iu;
const EMERGENCY_CONTEXT =
  /\b(?:clinic|hospital|emergency|treatment|ospital|pagpapagamot|aksidente)\b/iu;
const MONEY_TRANSFER =
  /\b(?:send (?:money|funds)|transfer (?:money|funds)|ipadala (?:ang )?pera|magpadala|magbayad|pay|cover (?:the |my )?(?:\w+ )?(?:bill|fee))\b/iu;

// Someone writing as a public figure or their team (SENDER_CLAIM) who offers fan access (FAN_PERK)
// and asks the reader to pay for it. Real performers and their teams do not sell fan access by
// message; tickets are sold through official sellers. No names are listed: the shape decides.
const FAN_PERK_CONTEXT = new RegExp(FAN_PERK, 'giu');
const FAN_PAYMENT = new RegExp(PAYMENT_REQUEST, 'giu');
// An offer to rig a raffle or giveaway for the reader in exchange for part of the prize.
const RIGGED_WIN = new RegExp(WIN_FOR_READER, 'giu');
const PRIZE_SHARE = new RegExp(PRIZE_CUT, 'giu');
// Gift card codes are a payment that cannot be traced or reversed; no employer or agency asks for them.
const GIFT_CARD_CONTEXT = new RegExp(String.raw`\b${GIFT_CARD}`, 'giu');
const GIFT_CARD_HANDOVER = new RegExp(CODE_HANDOVER, 'giu');
const GIFT_CARD_BUY = new RegExp(CARD_BUY, 'iu');

// Mask only payment disclaimers and keep offsets for highlighting the original text.
const NO_PAYMENT =
  /\b(?:no\s+(?:payment|fee|deposit)(?:\s+is)?\s+(?:required|needed|due)|(?:do not|don't)\s+need\s+to\s+pay(?:\s+(?:a|the|handling|processing|delivery|fee)){0,4}|no need\s+(?:to\s+)?(?:pay|magbayad)(?:\s+(?:a|the|ng|ang|handling|processing|delivery|fee)){0,4}|wala(?:ng|\s+(?:kang|kayong|po\s+kayong|pong))\s+(?:kailangang\s+)?(?:bayaran|bayad|paunang bayad)|hindi\s+(?:kailangan|required)\s+(?:ang\s+)?(?:bayad|payment|magbayad)|(?:hindi|di)\s+(?:(?:mo|ka|po|na)\s+){0,3}kailangang?\s+(?:ng\s+)?(?:magbayad|mag-bayad|bayaran|bayad|payment)|(?:there\s+is\s+)?nothing\s+to\s+pay|(?:do not|don't)\s+have\s+to\s+pay(?:\s+(?:anything|a\s+thing))?|without\s+(?:any\s+)?(?:fees?|charges?|payments?))\b/giu;

// A sentence that only says nothing is owed ("walang bayad", "no fee", "libre") is a disclaimer, not a
// payment demand. Mask its payment words, but only when the sentence has no demand marker, so a
// conditional threat, an instruction to send or click, or a credential request still counts.
const DISCLAIMER_CUE =
  /\b(?:hindi|di|wala|walang|no|not|nothing|without|free|libre|exempt|zero)\b/iu;
const PAYMENT_WORDS =
  /\b(?:bayad|bayaran|babayaran|magbayad|mag-bayad|payment|pay|fees?|charges?|singil|cost)\b/giu;
const DEMAND_MARKER =
  /\b(?:kung hindi|kapag hindi|pag hindi|if you|unless|otherwise|or else|bago|before|muna|first|link|click|tap|pindutin|i-click|otp|pin|mpin|code|password|send|ipadala|i-send|magpadala|deposit|magdeposito|verify|i-verify|confirm|i-confirm)\b/iu;

// A promise to pay the reader back ("bayaran kita bukas", "I'll pay you back") is not a demand.
// "Babayaran kita ng 800 per task" promises earnings and keeps its payment words.
const REPAY_PROMISE =
  /\b(?:ba)?bayaran\s+(?:na\s+lang\s+)?kita\b(?!\s+(?:ng|nang|per)\b|\s+sa\s+bawat\b)|\b(?:i'?ll|i\s+will|will)\s+pay\s+(?:you\s+)?back\b/giu;

/** Blanks "no payment needed" notices so their payment words do not read as a demand. */
export function maskNoPayment(text: string): string {
  return blank(
    text.replace(NO_PAYMENT, (notice) => ' '.repeat(notice.length)),
    REPAY_PROMISE,
  );
}

function maskDisclaimedPayments(text: string): string {
  return text.replace(/[^.!?;\n]+[.!?;]?/gu, (sentence) =>
    DISCLAIMER_CUE.test(sentence) && !DEMAND_MARKER.test(sentence)
      ? sentence.replace(PAYMENT_WORDS, (word) => ' '.repeat(word.length))
      : sentence,
  );
}

function isNegated(text: string, at: number): boolean {
  const clause =
    text
      .slice(Math.max(0, at - 35), at)
      .split(/[.!?;,]|\b(?:but|pero|subalit|however)\b/iu)
      .at(-1) ?? '';
  // A conditional threat ("kung hindi mo bayaran") demands payment.
  if (/\b(?:kung hindi|if you (?:do not|don't))(?:\s+[\w-]+){0,4}\s*$/iu.test(clause)) return false;
  if (
    /\b(?:do not|don't|does not|cannot|never|huwag|wag|hindi|walang|no|no need)(?:\s+[\w-]+){0,6}\s*$/iu.test(
      clause,
    )
  )
    return true;
  // A verb joined by "or" to a prohibition is prohibited too: "don't enter your OTP on any site or
  // send it to anyone", "wag i-enter ang OTP o i-send ito".
  const longer =
    text
      .slice(Math.max(0, at - 90), at)
      .split(/[.!?;,]|\b(?:but|pero|subalit|however|instead|just|only|lang)\b/iu)
      .at(-1) ?? '';
  return /\b(?:do not|don't|never|huwag|wag)(?:\s+[\w'-]+){1,10}\s+(?:or|nor|o|ni)\s*$/iu.test(
    longer,
  );
}

// "Did you request to SEND MONEY to ...? If not, don't share your OTP." Real wallets and banks ask
// the reader to confirm their own transaction before showing the code. The question describes the
// transaction; it does not ask the reader to pay, call the number in it, or log in.
const OWN_TRANSACTION_QUESTION =
  /(?<=^|[.!?\n]\s*)(?:did you|have you|were you|are you trying to|was (?:this|that|it) you|is (?:this|that|it) you|ikaw ba|nag-?[\p{L}-]+ ka ba|ikaw ba ito)\b[^?\n]{0,220}\?/giu;
// "for your transfer of PHP 1,000.00 to account ending 1234" describes what the code is for.
const OWN_TRANSACTION_DETAIL =
  /\b(?:for|of|sa|a|an)\s+(?:your|the|iyong|ang|inyong)?\s*(?:transfer|transaction|payment|purchase|cash[- ]?in|cash[- ]?out|withdrawal|remittance|send money|padala)\b[^!?\n]{0,120}?(?=[.!?](?:\s|$)|\n|$)/giu;
// The message delivers a code ("your OTP is 482072", "ang OTP mo ay 482072").
const CODE_DELIVERY =
  /\b(?:otp|one[- ]time (?:pin|password|code)|verification code|authentication code|code|pin)\b[^.!?\n\d]{0,25}\b\d{4,8}\b/iu;

// Outside the masked description, a mobile number or a payment request keeps the full check:
// banks and wallets do not ask you to call a mobile number or pay to cancel a transaction.
const UNMASKABLE =
  /(?:\+?63|\b0)9\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b|\b(?:pay|magbayad|mag-?pay|bayaran|send money|transfer|magpadala|ipadala|deposit|mag-?deposit|top[ -]?up|fees?|bayad|singil)\b/iu;
// "Never share your OTP except with our agent" still asks for the code.
const CREDENTIAL_EXCEPTION =
  /\b(?:do not|don't|never|huwag|wag)\b[^.!?\n]{0,80}\b(?:otp|pin|mpin|code|password|it|ito)\b[^.!?\n]{0,40}?\b(?:except|other than|apart from|maliban|bukod|(?:anyone|anybody|no one|nobody|kahit kanino) but)\b[^.!?\n]*/giu;

function blank(text: string, pattern: RegExp): string {
  return text.replace(pattern, (part) => ' '.repeat(part.length));
}

function safeNotices(text: string): RegExpExecArray[] {
  const hasCredential = /\b(?:otp|pin|mpin|code|password|one-time password)\b/iu.test(text);
  return [
    ...text.matchAll(SAFE_CREDENTIAL),
    ...(hasCredential ? [...text.matchAll(SAFE_PRONOUN)] : []),
  ];
}

function credentialRequest(text: string): RegExpExecArray | undefined {
  const hasCredential = /\b(?:otp|pin|mpin|code|password|one-time password)\b/iu.test(text);
  const safe = safeNotices(text);
  const exception = hasCredential ? text.matchAll(CREDENTIAL_EXCEPTION).next().value : undefined;
  if (exception) return exception;
  return [
    ...text.matchAll(CREDENTIAL_REQUEST),
    ...text.matchAll(READ_BACK_CODE),
    ...(hasCredential ? [...text.matchAll(FOLLOWUP_CODE_REQUEST)] : []),
  ].find(
    (match) =>
      !isNegated(text, match.index) &&
      !safe.some(
        (notice) =>
          match.index >= notice.index &&
          match.index + match[0].length <= notice.index + notice[0].length,
      ),
  );
}

/**
 * Blanks the description of the reader's own transaction in a code notice from a bank or wallet.
 * Only when the message delivers a code or says not to share it, has no link, and asks for no code;
 * otherwise the text is returned unchanged, so a scam copying the format is still checked in full.
 */
export function maskOwnTransaction(text: string): string {
  const masked = blank(blank(text, OWN_TRANSACTION_QUESTION), OWN_TRANSACTION_DETAIL);
  if (masked === text || hasUrl(text) || UNMASKABLE.test(masked)) return text;
  if (!safeNotices(masked).length && !CODE_DELIVERY.test(masked)) return text;
  return credentialRequest(masked) ? text : masked;
}

// Cash on delivery: the reader pays the rider when the parcel is in their hands, so a COD amount is
// not a remote money request. Delivery scams instead ask for a fee by link, number or transfer first.
const COD_CONTEXT =
  /\b(?:cod|c\.o\.d|cash[- ]on[- ]delivery|(?:upon|on) (?:delivery|receipt|arrival)|pagdating ng (?:rider|parcel|package|order|item)|pag-?deliver|(?:sa|to (?:the|our|your)) rider)\b/iu;
// A sentence that sends money somewhere, pays in advance or names a scam-style fee stays a request.
const REMOTE_PAYMENT =
  /(?:\+?63|\b0)9\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b|\b(?:send|i-?send|mag-?send|ipadala|magpadala|padalhan|transfer|i-?transfer|deposit|mag-?deposit|magdeposito|advance|first|muna|before|bago|link|click|tap|pindutin|i-?click|account (?:number|no)|acct|(?:this|my|our|personal) (?:number|gcash|maya|account|e-?wallet)|numerong ito|number na ito|(?:gcash|maya|account|number) ko|personal|customs|redelivery|re-delivery|storage|handling|release|clearance|processing|insurance|penalty|unpaid|outstanding|overdue)\b/iu;
// Any delivery problem, deadline or threat means the whole message gets the full check.
const DELIVERY_PROBLEM =
  /\b(?:on hold|held|naka-?hold|cannot be delivered|could not be delivered|can't be delivered|failed (?:delivery|attempt)|hindi (?:ma-?deliver|na-?deliver|maide-?deliver)|ibabalik|return(?:ed)? to sender|be returned|disposed|forfeit\w*|incomplete address|kulang ang address|invalid address|update (?:your )?address|to avoid|para hindi|or else|otherwise|kung hindi)\b/iu;
const COD_PAYMENT_WORDS =
  /\b(?:bayad|bayaran|babayaran|magbayad|magbabayad|mag-?bayad|payment|pay|mag-?pay|i-?pay|fees?|charges?|singil|cost)\b/giu;
const COD_PAYMENT_WORD = new RegExp(COD_PAYMENT_WORDS.source, 'iu');
const RIDER = /\b(?:rider|courier|driver|delivery (?:agent|personnel|staff))\b/iu;
const PH_MOBILE = /(?:\+?63|\b0)9\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b/gu;
// Sentences end at punctuation followed by a space, so "PHP 1,250.00" stays one sentence.
const SENTENCE = /(?:[^.!?;\n]|[.!?;](?!\s|$))+[.!?;]?/gu;

// A delivery notice with no link outside known domains, deadline, threat, delivery problem or code
// request. Only such notices get the cash-on-delivery and rider-number masking below.
function isOrdinaryDelivery(text: string): boolean {
  return (
    (COD_CONTEXT.test(text) || DELIVERY_CONTEXT.test(text)) &&
    !hasUnverifiedUrl(text) &&
    !DELIVERY_PROBLEM.test(text) &&
    !phraseSpan(text, [...keywords.urgency, ...keywords.account_threat]) &&
    !credentialRequest(text)
  );
}

/**
 * In an ordinary delivery notice, blanks the payment words of sentences that pay on delivery (cash
 * on delivery) and the rider's number when the sentence only names who will deliver. Returns the
 * text unchanged otherwise, so a scam using delivery or COD wording gets the full check.
 */
export function maskDeliveryNotice(text: string): string {
  if (!isOrdinaryDelivery(text)) return text;
  const cod = COD_CONTEXT.test(text);
  return text.replace(SENTENCE, (sentence) => {
    if (cod && !REMOTE_PAYMENT.test(sentence)) return blank(sentence, COD_PAYMENT_WORDS);
    // "Rider: Mark 0917..." names who will deliver; it asks for nothing.
    const rest = blank(sentence, PH_MOBILE);
    return RIDER.test(sentence) &&
      rest !== sentence &&
      !REMOTE_PAYMENT.test(rest) &&
      !COD_PAYMENT_WORD.test(rest)
      ? rest
      : sentence;
  });
}

// A bill, statement or installment reminder that says to pay through the provider's app, online
// banking or accredited partners. Paying there cannot hand money to whoever sent the text.
const PAYMENT_CONTEXT =
  /\b(?:bill|billing|due|statement|installment|amortization|hulog|bayarin|amount due|minimum amount|subscription|renewal)\b/iu;
const OFFICIAL_CHANNEL =
  /\b(?:(?:the|our|your|aming|sa)\s+(?:official\s+|opisyal na\s+)?[\p{L}-]+\s+(?:app|mobile app)|official app|opisyal na app|online banking|mobile banking|accredited (?:payment )?(?:centers?|partners?|outlets?)|payment (?:centers?|partners?)|partner outlets?|(?:any|mga) (?:authorized|accredited|partner)|bayad center|over[- ]the[- ]counter)\b/iu;
// What turns a payment reminder into a request: a number, link, transfer, personal account or a
// scam-style fee. Unlike delivery notices, "before" is fine here: bills are due before a date.
const PAYMENT_REMOTE =
  /(?:\+?63|\b0)9\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b|\b(?:send|i-?send|mag-?send|ipadala|magpadala|padalhan|transfer|i-?transfer|deposit|mag-?deposit|magdeposito|advance|first|muna|link|click|tap|pindutin|i-?click|to (?:account|acct)|account (?:number|no)|(?:this|my|our|personal) (?:number|gcash|maya|account|e-?wallet)|numerong ito|number na ito|(?:gcash|maya|account|number) ko|personal|processing|release|clearance|penalty)\b/iu;

function isOfficialPaymentNotice(text: string): boolean {
  return (
    PAYMENT_CONTEXT.test(text) &&
    OFFICIAL_CHANNEL.test(text) &&
    !PAYMENT_REMOTE.test(text) &&
    !hasUnverifiedUrl(text) &&
    !DELIVERY_PROBLEM.test(text) &&
    !phraseSpan(text, [...keywords.urgency, ...keywords.account_threat]) &&
    !credentialRequest(text)
  );
}

/** Blanks the payment words of a payment reminder that points only to official channels. */
export function maskOfficialPayment(text: string): string {
  return isOfficialPaymentNotice(text) ? blank(text, COD_PAYMENT_WORDS) : text;
}

function officialPaymentSpan(text: string): [number, number] | undefined {
  const channel = OFFICIAL_CHANNEL.exec(text);
  return channel && isOfficialPaymentNotice(text)
    ? [channel.index, channel.index + channel[0].length]
    : undefined;
}

// A message that warns about a scam ("there's a fake GCash text going around", "may kumakalat na
// text") and tells the reader not to act describes the scam; its words are reported, not demanded.
const AWARENESS_CUE =
  /\b(?:scams?|scammers?|fake|peke|modus|manloloko|nagpapanggap|nagpapakilala\w*|posing as|pretending|beware|mag-?ingat|ingat|heads up|be careful|kumakalat|going around|circulating)\b/iu;
const NOT_A_SCAM =
  /\b(?:not a scam|no scam|hindi (?:ito |po )?scam|legit (?:ito|po|kami)|this is legit|we are legit)\b/iu;
const PROTECTIVE_ADVICE =
  /(?<!\b(?:kung|kapag|pag|if you|unless you)\s+)\b(?:do not|don't|never|huwag|wag|hindi)\b(?:\s+[\w'-]+){0,4}\s+(?:click|open|pay|send|share|give|reply|enter|tap|transfer|believe|pindutin|buksan|magbayad|magbabayad|ibigay|ibibigay|i-?send|i-?share|i-?click|ipadala|magpadala|sagutin|mag-?reply|maniwala|hihingi|hingin|humingi)\b/iu;
// Instructions that hand over money, details or access. In an awareness message they may only
// appear negated ("huwag magbayad") or inside a report of the scam ("a text saying you must pay").
const AWARENESS_ACTION =
  /\b(?:pay|paying|magbayad|mag-?pay|bayaran|send|i-?send|pakisend|paki-?send|ipadala|magpadala|transfer|i-?transfer|deposit|mag-?deposit|claim|i-?claim|verify|i-?verify|register|mag-?register|reply|i-?reply|update|i-?update|log ?in|mag-?log ?in|click|i-?click|tap|pindutin|install|download|confirm|i-?confirm|activate|i-?activate|redeem|i-?redeem|avail|i-?avail|visit|bisitahin)\b/giu;
const REPORTING_CUE =
  /\b(?:saying|says|claiming|claims? that|telling you|asking you|nagsasabing|nagsasabi|daw|raw|kumakalat|going around|circulating|posing|nagpapanggap|pretending|fake|peke|scammers?|manloloko)\b/iu;

function givesOwnInstruction(text: string): boolean {
  for (const sentence of text.matchAll(SENTENCE)) {
    if (REPORTING_CUE.test(sentence[0])) continue;
    for (const action of sentence[0].matchAll(AWARENESS_ACTION))
      if (!isNegated(text, sentence.index + action.index)) return true;
  }
  return false;
}

// "Will reflect within 24 hours" or "umuwi ka agad" sets a time but asks for nothing risky.
function demandsAction(text: string): boolean {
  const verbs = new RegExp(AWARENESS_ACTION.source, 'giu');
  return (
    hasUrl(text) ||
    new RegExp(PH_MOBILE.source, 'u').test(text) ||
    [...text.matchAll(verbs)].some((match) => !isNegated(text, match.index)) ||
    !!phraseSpan(text, keywords.account_threat, true)
  );
}

// Warning words the message reports about the scam rather than uses on the reader.
const REPORTED = new Set([
  'urgency',
  'account_threat',
  'money_request',
  'prize_or_job_bait',
  'relative_claims',
  'link_action',
  'bank_impersonation',
  'delivery_scam',
  'job_bait',
  'investment_bait',
  'government_bait',
  'advance_fee',
  'performer_claim',
  'prize_fix',
  'gift_card_request',
]);

function hasPersonalDataRequest(text: string): boolean {
  const safe = [...text.matchAll(SAFE_PERSONAL_DATA)];
  return [...text.matchAll(PERSONAL_DATA_REQUEST)].some(
    (match) =>
      !safe.some(
        (notice) =>
          match.index >= notice.index &&
          match.index + match[0].length <= notice.index + notice[0].length,
      ),
  );
}

/** Where a scam-awareness message names the scam, when nothing in it can be acted on. */
export function scamAwarenessSpan(text: string): [number, number] | undefined {
  const cue = AWARENESS_CUE.exec(text);
  return cue && isScamAwareness(text) ? [cue.index, cue.index + cue[0].length] : undefined;
}

function isScamAwareness(text: string): boolean {
  return (
    AWARENESS_CUE.test(text) &&
    !NOT_A_SCAM.test(text) &&
    PROTECTIVE_ADVICE.test(text) &&
    !givesOwnInstruction(text) &&
    !new RegExp(PH_MOBILE.source, 'u').test(text) &&
    !/\b(?:account (?:number|no)|acct)\b/iu.test(text) &&
    !hasUnverifiedUrl(text) &&
    !credentialRequest(text) &&
    !hasPersonalDataRequest(text)
  );
}

/** Where the message says payment is due on delivery, in an ordinary delivery notice. */
function codNoticeSpan(text: string): [number, number] | undefined {
  const cod = COD_CONTEXT.exec(text);
  return cod && isOrdinaryDelivery(text) ? [cod.index, cod.index + cod[0].length] : undefined;
}

// With cash on delivery the reader pays when the parcel arrives. Asking to pay first, or to a
// personal number or account, is the unusual instruction delivery scammers use.
const COD_MONEY_VERB =
  /\b(?:pay|i-?pay|mag-?pay|magbayad|bayaran|send|i-?send|mag-?send|ipadala|magpadala|transfer|i-?transfer|deposit|mag-?deposit|magdeposito)\b/giu;
const COD_UNUSUAL =
  /\b(?:to|sa|via|thru|through|into)\s+(?:(?:the|my|our|his|her|aming|aking)\s+)?(?:(?:gcash|maya|e-?wallet|number|account)\s*(?:number|no\.?|#)?\s*:?\s*)?(?:\+?63|0)9\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b|\b(?:first|muna|before (?:delivery|(?:the |your )?(?:rider|parcel|package|order) (?:arrives|comes|is delivered))|bago (?:i-?deliver|ma-?deliver|dumating|ihatid)|in advance|advance|(?:this|my|our|personal) (?:number|gcash|maya|account|e-?wallet)|numerong ito|number na ito|(?:gcash|maya|account|number) ko)\b/iu;

function codUnusualPayment(text: string): [number, number] | undefined {
  if (!COD_CONTEXT.test(text)) return undefined;
  for (const sentence of text.matchAll(SENTENCE)) {
    if (!COD_UNUSUAL.test(sentence[0])) continue;
    for (const verb of sentence[0].matchAll(COD_MONEY_VERB)) {
      const at = sentence.index + verb.index;
      if (!isNegated(text, at)) return [at, at + verb[0].length];
    }
  }
}

function phraseSpan(
  text: string,
  phrases: string[],
  skipNegated = false,
): [number, number] | undefined {
  const lower = text.toLocaleLowerCase();
  for (const phrase of phrases) {
    let at = lower.indexOf(phrase);
    while (at >= 0) {
      const end = at + phrase.length;
      if (
        !WORD.test(lower[at - 1] ?? '') &&
        !WORD.test(lower[end] ?? '') &&
        !(skipNegated && isNegated(text, at))
      )
        return [at, end];
      at = lower.indexOf(phrase, at + 1);
    }
  }
}

function contextualSpan(
  text: string,
  context: RegExp,
  action: RegExp,
): [number, number] | undefined {
  const global = (pattern: RegExp) =>
    new RegExp(pattern.source, pattern.flags.replace('g', '') + 'g');
  const contexts = [...text.matchAll(global(context))];
  const actions = [...text.matchAll(global(action))];
  for (const contextMatch of contexts) {
    const contextAt = contextMatch.index;
    const actionMatch = actions.find(
      (candidate) =>
        Math.abs(candidate.index - contextAt) <= 140 && !isNegated(text, candidate.index),
    );
    if (!actionMatch) continue;
    return [actionMatch.index, actionMatch.index + actionMatch[0].length];
  }
}

function pushSignal(
  signals: Signal[],
  id: string,
  label: string,
  weight: number,
  span: [number, number] | undefined,
): void {
  if (span && !signals.some((signal) => signal.id === id))
    signals.push({ id, label, weight, span });
}

export function runRules(text: string): Signal[] {
  text = maskOwnTransaction(maskDisclaimedPayments(maskNoPayment(text)));
  const codSpan = codNoticeSpan(text);
  const paymentSpan = officialPaymentSpan(text);
  text = maskOfficialPayment(maskDeliveryNotice(text));
  const signals = urlSignals(text);
  const safe = safeNotices(text);
  const request = credentialRequest(text);
  if (request) {
    signals.push({
      id: 'otp_pin_request',
      label: 'Asks for a one-time code or password',
      weight: 35,
      span: [request.index, request.index + request[0].length],
    });
  } else if (safe.length && !hasUrl(text)) {
    const notice = safe[0];
    signals.push({
      id: 'safe_credential_notice',
      label: 'Says not to share a code',
      weight: 0,
      span: [notice.index, notice.index + notice[0].length],
    });
  }
  const safeCardData = [...text.matchAll(SAFE_CARD_DATA)];
  const cardData = [...text.matchAll(CARD_DATA_REQUEST)].find(
    (match) =>
      !safeCardData.some(
        (notice) =>
          match.index >= notice.index &&
          match.index + match[0].length <= notice.index + notice[0].length,
      ),
  );
  if (cardData) {
    signals.push({
      id: 'card_data_request',
      label: 'Asks for card details or security code',
      weight: 35,
      span: [cardData.index, cardData.index + cardData[0].length],
    });
  }
  const safePersonalData = [...text.matchAll(SAFE_PERSONAL_DATA)];
  const personalData = [...text.matchAll(PERSONAL_DATA_REQUEST)].find(
    (match) =>
      !safePersonalData.some(
        (notice) =>
          match.index >= notice.index &&
          match.index + match[0].length <= notice.index + notice[0].length,
      ),
  );
  if (personalData) {
    signals.push({
      id: 'personal_data_request',
      label: 'Asks for sensitive personal information',
      weight: 35,
      span: [personalData.index, personalData.index + personalData[0].length],
    });
  }
  const linkAction = [...text.matchAll(LINK_ACTION)].find((match) => !isNegated(text, match.index));
  if (linkAction) {
    const at = linkAction.index;
    signals.push({
      id: 'link_action',
      label: 'Directs you to a link',
      weight: 15,
      span: [at, at + linkAction[0].length],
    });
  }
  const coercion = text.match(COERCION);
  if (coercion?.length) {
    const at = text.indexOf(coercion[0]);
    signals.push({
      id: 'coercion',
      label: 'Threatens to contact your family or friends',
      weight: 20,
      span: [at, at + coercion[0].length],
    });
  }
  const groups = [
    ['urgency', 'Pressures you to act quickly', 12],
    ['account_threat', 'Threatens account access', 15],
    ['money_request', 'Asks for money or a fee', 15],
    ['prize_or_job_bait', 'Promises a prize or easy income', 15],
    ['relative_claims', 'Claims a relative has a new number', 20],
  ] as const;
  for (const [id, label, weight] of groups) {
    const span = phraseSpan(text, keywords[id], true);
    if (span && (id !== 'urgency' || demandsAction(text)))
      signals.push({ id, label, weight, span });
  }
  const prize = PRIZE_WIN.exec(text);
  if (prize && !isNegated(text, prize.index))
    pushSignal(signals, 'prize_or_job_bait', 'Promises a prize or easy income', 15, [
      prize.index,
      prize.index + prize[0].length,
    ]);
  const earn = EARN_PROMISE.exec(text);
  if (earn && !isNegated(text, earn.index))
    pushSignal(signals, 'prize_or_job_bait', 'Promises a prize or easy income', 15, [
      earn.index,
      earn.index + earn[0].length,
    ]);

  const safeNotice =
    (safe.length > 0 || SAFE_FINANCE_REQUEST.test(text)) && !request && !hasUrl(text);
  const financeSpan = contextualSpan(text, FINANCE_CONTEXT, FINANCE_IMPERSONATION);
  const financeActionSpan = contextualSpan(text, FINANCE_CONTEXT, FINANCE_ACTION);
  if (
    !safeNotice &&
    financeSpan &&
    financeActionSpan &&
    Math.abs(financeSpan[0] - financeActionSpan[0]) <= 140
  ) {
    pushSignal(
      signals,
      'bank_impersonation',
      'Claims to be a bank or wallet while requesting action',
      15,
      financeSpan,
    );
  }
  pushSignal(
    signals,
    'delivery_scam',
    'Uses a delivery problem to ask for a fee or link visit',
    20,
    contextualSpan(text, DELIVERY_CONTEXT, DELIVERY_ACTION),
  );
  pushSignal(
    signals,
    'job_bait',
    'Offers work while asking for payment or sensitive details',
    15,
    contextualSpan(text, JOB_CONTEXT, JOB_RISK),
  );
  pushSignal(
    signals,
    'investment_bait',
    'Promises unusually quick or guaranteed investment returns',
    contextualSpan(text, INVESTMENT_CONTEXT, GUARANTEED_RETURN) ? 30 : 15,
    contextualSpan(text, INVESTMENT_CONTEXT, INVESTMENT_RISK),
  );
  pushSignal(
    signals,
    'government_bait',
    'Uses a government benefit to request details or payment',
    15,
    contextualSpan(text, GOVERNMENT_CONTEXT, GOVERNMENT_ACTION),
  );
  pushSignal(
    signals,
    'gambling_bait',
    'Promotes online gambling with free spins or bonus money',
    30,
    contextualSpan(text, GAMBLING_CONTEXT, GAMBLING_ACTION),
  );
  pushSignal(
    signals,
    'romance_bait',
    'Uses a personal relationship to ask for money',
    30,
    contextualSpan(text, ROMANCE_CONTEXT, ROMANCE_ACTION),
  );
  pushSignal(
    signals,
    'advance_fee',
    'Requires payment before a promised benefit',
    30,
    contextualSpan(text, BENEFIT_CONTEXT, ADVANCE_PAYMENT),
  );
  pushSignal(
    signals,
    'marketplace_deposit',
    'Asks for a deposit before you can inspect an item',
    30,
    contextualSpan(text, MARKETPLACE_CONTEXT, BEFORE_INSPECTION),
  );
  if (SENDER_CLAIM.test(text) && !OFFICIAL_TICKETING.test(text))
    pushSignal(
      signals,
      'performer_claim',
      'Claims to be a celebrity or their team and asks you to pay for fan access',
      30,
      contextualSpan(text, FAN_PERK_CONTEXT, FAN_PAYMENT),
    );
  pushSignal(
    signals,
    'prize_fix',
    'Offers to rig a raffle or giveaway for you in exchange for part of the prize',
    30,
    contextualSpan(text, RIGGED_WIN, PRIZE_SHARE),
  );
  if (GIFT_CARD_BUY.test(text))
    pushSignal(
      signals,
      'gift_card_request',
      'Asks you to buy gift cards and send their codes',
      35,
      contextualSpan(text, GIFT_CARD_CONTEXT, GIFT_CARD_HANDOVER),
    );
  const emergency = contextualSpan(text, RELATIVE_CONTEXT, EMERGENCY_CONTEXT);
  if (emergency) {
    pushSignal(
      signals,
      'relative_emergency',
      'Uses a family emergency to request money',
      30,
      contextualSpan(text, RELATIVE_CONTEXT, MONEY_TRANSFER),
    );
  }
  pushSignal(
    signals,
    'cod_unusual_payment',
    'Asks you to pay in advance or to a personal account for a cash-on-delivery parcel',
    30,
    codUnusualPayment(text),
  );
  const awareness = scamAwarenessSpan(text);
  if (awareness) {
    const kept = signals.filter(({ id }) => !REPORTED.has(id));
    signals.splice(0, signals.length, ...kept);
    if (kept.every(({ weight }) => weight === 0))
      signals.push({
        id: 'scam_awareness',
        label: 'Warns about a scam and advises not to act on it',
        weight: 0,
        span: awareness,
      });
  }
  if (paymentSpan && signals.every(({ weight }) => weight === 0))
    signals.push({
      id: 'official_payment_notice',
      label: 'Says to pay only through official apps or accredited partners',
      weight: 0,
      span: paymentSpan,
    });
  if (codSpan && signals.every(({ weight }) => weight === 0))
    signals.push({
      id: 'cod_notice',
      label: 'Payment is only due when the parcel is delivered',
      weight: 0,
      span: codSpan,
    });
  return signals;
}
