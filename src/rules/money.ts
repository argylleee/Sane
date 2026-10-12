// OWNER: backend. Shared pieces of payment, amount and sender-claim patterns, used by ask.ts and
// index.ts. Built from Filipino/Taglish word parts rather than fixed sentences, so new spellings of
// the same request ("pakihulugan", "gcash-an", "pa-cash in") are read the same way.

/** Text inside one sentence. A dot between digits ("2.5k", "4,999.00") does not end a sentence. */
export const GAP = String.raw`(?:[^.!?\n]|(?<=\d)\.(?=\d))`;

const NUMBER_WORD = String.raw`(?:isang|dalawang|tatlong|apat\s+na|limang|anim\s+na|pitong|walong|siyam\s+na|sampung|one|two|three|four|five|six|seven|eight|nine|ten|\d+)`;
/** An amount of money: ₱500, PHP 4,999.00, P2500, 2.5k, 1,500, 450 pesos, limang libo. */
export const AMOUNT = String.raw`(?:(?:₱|\bphp|\bp(?=\d)|\$)\s?\d[\d,]*(?:\.\d+)?|\b\d+(?:\.\d+)?\s?k\b|\b\d{1,3}(?:,\d{3})+(?:\.\d+)?|\b\d{3,5}(?:\.\d{2})?\b(?!\d|,\d)|\b\d[\d,.]*[\s-]*(?:pesos?|piso|php)\b|\b${NUMBER_WORD}\s+(?:libo\w*|hundred|thousand)\b)`;

/** Words that make a request about money: an amount, a wallet, pesos, a fee. */
export const MONEY_WORD = String.raw`(?:${AMOUNT}|money|pera|cash|pesos?|piso|gcash|maya|fee|bayad|payment|load|amount|halaga|deposit|balance)`;

// Payment roots and the Tagalog affixes that turn them into a request ("pa-send", "pakihulog",
// "i-GCash", "sendan", "gcash-an", "padalhan"). Completed forms ("na-send", "nagpadala",
// "naipadala") carry no request affix and are excluded by NOT_DONE. Wallet and installment nouns
// ("GCash", "Maya", "hulog", "load") only read as a request with an affix: "your Maya PIN" asks nothing.
const VERB_ROOT = String.raw`(?:send|transfer|remit|deposit|deposito)`;
const NOUN_ROOT = String.raw`(?:padal|padala|g-?cash|maya|cash[- ]?in|hulog|hulug|load)`;
const REQUEST_AFFIX = String.raw`(?:pa-?|paki-?|i-?|mag-?|ipa-?|pakipa-?)`;
const SUFFIX = String.raw`(?:-?(?:an|han|in|hin))`;
export const NOT_DONE = String.raw`(?<!\p{L}-)`;
export const PAY_VERB = String.raw`${NOT_DONE}\b(?:${REQUEST_AFFIX}?${VERB_ROOT}${SUFFIX}?|${REQUEST_AFFIX}${NOUN_ROOT}${SUFFIX}?|${NOUN_ROOT}${SUFFIX}|pay|magbayad|mag-?pay|bayaran|pakibayaran|bayad\s+(?:ka|kayo|po\s+kayo)|settle|pahiram)\b`;

/** A request to send or pay money with an amount or money word close by, or an amount named as a fee. */
export const PAYMENT_REQUEST = String.raw`${PAY_VERB}${GAP}{0,30}?${MONEY_WORD}|${AMOUNT}${GAP}{0,12}?\b(?:[\p{L}-]+\s+){0,2}?fee\b|\bfee\s+(?:of\s+)?${AMOUNT}`;

// Someone writing as a public figure or for one: a self-introduction ("si X 'to", "ako si X",
// "it's me X", "X here") or a representative ("manager ni X", "X's team", "management team of").
const NAME = String.raw`\p{L}[\p{L}.'-]*`;
export const SENDER_CLAIM = new RegExp(
  [
    String.raw`\bsi\s+(?:${NAME}\s+){0,2}${NAME}\s+(?:po\s+)?(?:'?to|ito)\b`,
    String.raw`\b(?:ako|ito)\s+(?:po\s+)?(?:'?to\s+)?si\s+\p{L}`,
    String.raw`\b(?:it'?s\s+me|this\s+is|i\s+am|i'm)[\s,!-]+(?!(?:a|an|the|to|not|just|so|in|at|on|for|about|going|sorry|here|your|ur|my)\b)\p{L}`,
    String.raw`(?:^|[.!?]\s+|\b(?:hi|hello|hey|yo)\b[\s,!]*)(?:${NAME}\s+){0,3}?${NAME}\s+here\b`,
    String.raw`\b(?:manager|management|team|staff|admin)(?:\s+team)?\s+(?:po\s+)?(?:ni|ng|of|from)\b`,
    String.raw`\b\p{L}+'s\s+(?:official\s+)?(?:team|management|manager|staff)\b`,
    String.raw`\bofficial\s+team\b`,
  ].join('|'),
  'iu',
);

/** Fan access a celebrity or their team supposedly offers: backstage, VIP passes, meet-and-greets. */
export const FAN_PERK = String.raw`(?:backstage|meet[- ]?(?:and|n|&)?[- ]?greet|meet[- ]?up|fan ?meet(?:ing)?|fan ?sign(?:ing)?|vip\s+(?:seats?|pass(?:es)?|slots?|access|tickets?)|(?:concert|show|tour|gig)\s+(?:ko|namin)|(?:my|our)\s+(?:[\p{L}-]+\s+){0,2}(?:concert|show|tour|gig))`;
/** Payment through the venue or official ticketing is not money sent to whoever wrote the message. */
export const OFFICIAL_TICKETING =
  /\b(?:box office|takilya|official (?:ticketing|site|website|app))\b/iu;

// A raffle or giveaway win promised to the reader, and a cut of it for the sender.
export const WIN_FOR_READER = String.raw`(?:\b(?:ipanalo|ipapanalo|i-?panalo|papanalunin|panalunin|mapanalo)\b${GAP}{0,25}?\b(?:kita|ka|kayo|ikaw|mo|you|your)\b|\b(?:kita|kitang)\b${GAP}{0,10}?\b(?:papanalunin|ipapanalo|ipanalo)\b|\b(?:i|we)(?:\s+(?:can|will|could)|'ll)\s+(?:make\s+sure\s+|help\s+)?(?:make\s+)?(?:you|u|your\s+\p{L}+)\s+wins?\b)`;
// "sa akin" alone is not a cut ("kunin mo sa akin"); with an amount it is ("5k saken").
export const PRIZE_CUT = String.raw`(?:\bhati(?:an)?\s+(?:tayo|kami)\b|\bshare\s+(?:tayo|it|the)\b|\bpartihan\b|\bkalahati\b|\bhalf\b|\bsplit\b|\bcut\b|\b\d{1,3}\s?%|\b50\s?\/\s?50\b|\bparte\s+ko\b|\bgive\s+me\b|\d[\d,.]*\s?k?\s+(?:for\s+me|sa(?:kin|akin|ken))\b)`;

// Buying store cards and handing over their codes is a payment that cannot be traced or reversed.
export const GIFT_CARD = String.raw`(?:gift\s?cards?|(?:google\s?play|itunes|apple|steam(?:\s+wallet)?|razer(?:\s+gold)?|amazon)(?:\s+gift)?(?:\s+cards?|\s+codes?)?)\b`;
export const CARD_BUY = String.raw`\b(?:buy|bili|bumili|bilhan|pakibili|paki-?bili|purchase)\b`;
export const CODE_HANDOVER = String.raw`\b(?:send|i-?send|ipadala|ibigay|give|share|reply|text|i-?text|forward|picture|pics?|litrato)\b${GAP}{0,40}?\b(?:codes?|pins?|numbers?|numero|serial|likod)\b`;
