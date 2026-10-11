// OWNER: backend. All matching is local and never opens a message link.
import keywords from '../data/keywords.json';
import type { Signal } from '../types';
import { hasUrl, urlSignals } from './urls';

const WORD = /[\p{L}\p{N}]/u;
const SAFE_CREDENTIAL =
  /(?:do not|don't|never|huwag|wag)\s+(?:(?:ask\s+(?:you\s+)?to)\s+)?(?:share|send|give|provide|enter|submit|reply|ibigay|i-send|sabihin|ipasa|ibahagi|i-share|ibabahagi)[^.!?;]{0,35}\b(?:otp|pin|mpin|code|password)\b/giu;
const SAFE_PRONOUN =
  /(?:do not|don't|never|huwag|wag)\s+(?:share|send|give|ibigay|i-send|i-share)[^.!?;]{0,20}\b(?:it|ito|yan)\b/giu;
const CREDENTIAL_REQUEST =
  /\b(?:send|share|give|provide|enter|submit|reply|confirm|verify|forward|i-forward|ibigay|ipadala|ipasa|ibahagi|isend|i-send|paki-send|pakisend|pakisabi|sabihin|ilagay|i-share|pa-send)\b[^.!?;]{0,35}\b(?:otp|pin|mpin|password|code)\b/giu;
const CARD_DATA_REQUEST =
  /\b(?:send|share|give|provide|enter|submit|reply|confirm|verify|ibigay|isend|i-send|pakisend|sabihin|ilagay|i-share|pa-send)\b[^.!?;]{0,45}\b(?:card number|card no\.?|cvv|cvc|security code|expiry|expiration|valid thru|numero ng card|likod ng card)\b/giu;
const FOLLOWUP_CODE_REQUEST =
  /\b(?:send|share|give|ibigay|i-send|i-share)\b[^.!?;]{0,18}\b(?:it|ito|yan)\b/giu;
const READ_BACK_CODE =
  /\b(?:read back|tell us|tell me|pakisabi)\b.{0,35}\b(?:six|6|anim)\s*[- ]?\s*(?:digit|digits|number|numero)\b/giu;
const PERSONAL_DATA_REQUEST =
  /\b(?:ibigay|send|share|provide|ilagay|submit|provide us)\b[^.!?;]{0,60}\b(?:buong pangalan|full name|bank account|account number|numero ng bank account|card number|home address|address|birthday|date of birth|government id|id number|sss number|philhealth number|selfie)\b/giu;
const SAFE_PERSONAL_DATA =
  /(?:do not|don't|never|huwag|wag)\s+(?:(?:ask\s+(?:you\s+)?to)\s+)?(?:ibigay|send|share|provide|ilagay|submit)[^.!?;]{0,60}\b(?:buong pangalan|full name|bank account|account number|numero ng bank account|card number|home address|address|birthday|date of birth|government id|id number|sss number|philhealth number|selfie)\b/giu;
const SAFE_CARD_DATA =
  /(?:do not|don't|never|huwag|wag)\s+(?:(?:ask\s+(?:you\s+)?to)\s+)?(?:send|share|give|provide|enter|submit|ibigay|ilagay|i-share)[^.!?;]{0,45}\b(?:card number|card no\.?|cvv|cvc|security code|expiry|expiration|valid thru|numero ng card|likod ng card)\b/giu;
const SAFE_FINANCE_REQUEST =
  /(?:do not|don't|never|huwag|wag)\s+(?:ask|request|require|humingi|hihingi)[^.!?;]{0,50}\b(?:otp|pin|mpin|password|code|card|bank account|account number|cvv)\b/iu;
const LINK_ACTION =
  /\b(?:pindutin|i-click|click|tap|buksan|open|visit|bisitahin|go to|punta sa|at|sa)\b.{0,20}\blink\b/giu;
const COERCION =
  /\b(?:i-text|isasabi|sabihin|expose|report|i-send|send|ipakita|ikakalat|ikalat|i-post|post|leak)\b.{0,60}\b(?:family|friends|pamilya|kamag-anak|kaibigan|contacts)\b/giu;

const DELIVERY_CONTEXT =
  /\b(?:parcel|package|delivery|rider|courier|warehouse|shipment|order|padala|package)\b/iu;
const DELIVERY_ACTION =
  /\b(?:fee|pay|payment|magbayad|mag-pay|bayaran|link|click|pindutin|address is incomplete|kulang ang address|customs)\b/iu;
const FINANCE_CONTEXT =
  /\b(?:gcash|maya|bdo|bpi|unionbank|metrobank|security bank|rcbc|landbank|pnb|gotyme|coins\.ph|bank|bangko|e-wallet|wallet|card)\b/iu;
const FINANCE_IMPERSONATION =
  /\b(?:security desk|security team|support team|customer service|helpdesk|bank staff|wallet team|account department|card security|empleyado ng bangko|customer service)\b/iu;
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
  /\b(?:pay|send|transfer|magbayad|bayaran|magpadala|magdeposito)\b(?=[^.!?;]{0,70}\b(?:fee|charge|bayad|singil|deposit|collect|receive|release|matanggap|makuha)\b)[^.!?;]{0,55}\b(?:first|before|advance|upfront|muna|bago|paunang)\b|\b(?:top[ -]up|mag-top[ -]up|dagdagan)\b[^.!?;]{0,25}\b(?:working balance|balanse)\b|\b(?:fee|charge|bayad|singil)\b[^.!?;]{0,30}\b(?:paid|settled)\b[^.!?;]{0,20}\b(?:first|before|upfront|in advance)\b/iu;
const MARKETPLACE_CONTEXT = /\b(?:marketplace|item|seller|binebenta\w*|gamit)\b/iu;
const BEFORE_INSPECTION =
  /\b(?:send|pay|transfer|magdeposito|mag-deposit|magbayad)\b[^.!?;]{0,30}\b(?:deposit|reservation|bago)\b[^.!?;]{0,35}\b(?:before|bago)\b[^.!?;]{0,25}\b(?:inspect\w*|makita|ma-inspect|masuri)\b|\bmagdeposito\b[^.!?;]{0,25}\bbago\b[^.!?;]{0,25}\b(?:makita|masuri)\b/iu;
const RELATIVE_CONTEXT =
  /\b(?:sister|brother|daughter|son|mother|father|mom|dad|mama|papa|cousin|anak|kapatid|pinsan|nanay|tatay|lola|lolo|tita|tito)\b/iu;
const EMERGENCY_CONTEXT =
  /\b(?:clinic|hospital|emergency|treatment|ospital|pagpapagamot|aksidente)\b/iu;
const MONEY_TRANSFER =
  /\b(?:send (?:money|funds)|transfer (?:money|funds)|ipadala (?:ang )?pera|magpadala|magbayad|pay|cover (?:the |my )?(?:\w+ )?(?:bill|fee))\b/iu;

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

/** Blanks "no payment needed" notices so their payment words do not read as a demand. */
export function maskNoPayment(text: string): string {
  return text.replace(NO_PAYMENT, (notice) => ' '.repeat(notice.length));
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
  return /\b(?:do not|don't|does not|cannot|never|huwag|wag|hindi|walang|no|no need)(?:\s+[\w-]+){0,6}\s*$/iu.test(
    clause,
  );
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
  text = maskDisclaimedPayments(maskNoPayment(text));
  const signals = urlSignals(text);
  const hasCredential = /\b(?:otp|pin|mpin|code|password|one-time password)\b/iu.test(text);
  const safe = [
    ...text.matchAll(SAFE_CREDENTIAL),
    ...(hasCredential ? [...text.matchAll(SAFE_PRONOUN)] : []),
  ];
  const request = [
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
    if (span) signals.push({ id, label, weight, span });
  }
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
  return signals;
}
