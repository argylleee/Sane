// OWNER: frontend. Copy for the trust, help, history and comfort features, in all three languages.
// Plain, short, no em dashes (RULES 16). Filipino and Taglish are awaiting native-speaker review
// (docs/planning/filipino-review-*.md).
import type { Lang } from '../types';

type ExtraCopy = {
  navigationHistory: string;
  moreDetails: string;

  whyTitle: string;
  whyIntro: string;
  whyCode: string;
  whyNoFlags: string;
  whyCalming: string;
  whyMeaning: string;
  whyMeaningNone: string;
  whyWriter: string;
  whyNoWriter: string;

  detailsTitle: string;
  detailPhone: string;
  detailForeign: string;
  detailPayment: (channel?: string) => string;
  detailAskedToPay: string;
  detailPayHint: string;
  detailForeignHint: string;
  detailNote: string;

  scamTypeTitle: string;
  scamTypeTell: string;
  scamTypeDo: string;

  helpTitle: string;
  helpReport: string;
  helpPaid: string;
  helpCall: string;
  helpEmail: string;
  helpSite: string;
  helpChecked: (date: string) => string;
  helpNever: string;

  actionsTitle: string;
  shareCard: string;
  shareCardHint: string;
  shareReady: string;
  shareSaved: string;
  shareFailed: string;
  copyReport: string;
  copyReportDone: string;
  copyReportFailed: string;
  readAloud: string;
  stopReading: string;
  cardFooter: string;
  reportTitle: string;
  reportChecked: (date: string) => string;
  reportResult: (label: string) => string;
  reportFlags: string;
  reportMessage: string;
  reportDetails: string;
  reportFooter: string;

  wrongTitle: string;
  wrongScam: string;
  wrongFine: string;
  wrongSaved: string;
  wrongFailed: string;

  proofTitle: string;
  proofNone: string;
  proofSome: (count: number, external: number) => string;
  proofOwnSite: string;
  proofNote: string;

  historyTitle: string;
  historyDescription: string;
  historyToggle: string;
  historyPrivacy: string;
  historyEmpty: string;
  historyEmptyOff: string;
  historyScreenshot: string;
  historyDelete: string;
  historyDeleteAll: string;
  historyDeleteAllConfirm: string;
  notesTitle: string;
  notesDescription: string;
  notesEmpty: string;
  notesExport: string;
  noteScam: string;
  noteFine: string;
  noteShownAs: (label: string) => string;

  settingsTitle: string;
  settingsLanguage: string;
  settingsFamily: string;
  settingsFamilyHint: string;
  settingsContrast: string;
  settingsContrastHint: string;
  langNames: Record<Lang, string>;

  scamTypesTitle: string;
  scamTypesIntro: string;
};

const EXTRA: Record<Lang, ExtraCopy> = {
  en: {
    navigationHistory: 'History',
    moreDetails: 'More details',

    whyTitle: 'Why this result',
    whyIntro:
      'Code finds the facts. The meaning check only adds support. Neither one needs the internet.',
    whyCode: 'Found by code',
    whyNoFlags: 'Code found no red flags in this message.',
    whyCalming: 'Eased worry',
    whyMeaning: 'Closest known scam patterns (by meaning)',
    whyMeaningNone: 'The meaning check did not run, so this result comes from code alone.',
    whyWriter: 'The on-device writer only wrote the explanation. It did not choose the result.',
    whyNoWriter: 'No language model wrote any of this result.',

    detailsTitle: 'Numbers and accounts in the message',
    detailPhone: 'Mobile number',
    detailForeign: 'Overseas number',
    detailPayment: (channel) => (channel ? `${channel} payment account` : 'Bank or wallet account'),
    detailAskedToPay: 'The message asks you to send money here.',
    detailPayHint:
      'Banks and wallets do not ask you to send money to a personal number or account.',
    detailForeignHint: 'A Philippine bank or agency rarely texts from an overseas number.',
    detailNote: 'Shown for your information. These details do not change the result.',

    scamTypeTitle: 'About this kind of scam',
    scamTypeTell: 'How it looks',
    scamTypeDo: 'What to do',

    helpTitle: 'Who to contact',
    helpReport: 'Report it',
    helpPaid: 'If you already paid or shared a code',
    helpCall: 'Call',
    helpEmail: 'Email',
    helpSite: 'Website',
    helpChecked: (date) =>
      `Contact details checked ${date}. They can change, so confirm on the official site.`,
    helpNever: 'Never use a phone number or link from the suspicious message.',

    actionsTitle: 'Share or save',
    shareCard: 'Share a warning picture',
    shareCardHint: 'The picture shows the result and advice only. It never includes the message.',
    shareReady: 'Warning picture shared.',
    shareSaved: 'Warning picture saved to your downloads.',
    shareFailed: 'Could not make the picture on this device.',
    copyReport: 'Copy a report',
    copyReportDone: 'Report copied. Paste it into your complaint.',
    copyReportFailed: 'Could not copy. Select and copy the message yourself.',
    readAloud: 'Read aloud',
    stopReading: 'Stop reading',
    cardFooter: 'Checked privately on my own device with Sane',
    reportTitle: 'Sane scam check',
    reportChecked: (date) => `Checked on ${date}`,
    reportResult: (label) => `Result: ${label}`,
    reportFlags: 'Red flags',
    reportMessage: 'Message',
    reportDetails: 'Numbers and accounts',
    reportFooter: 'Checked on the reader’s own device. This is a warning, not proof of fraud.',

    wrongTitle: 'Does this result look wrong?',
    wrongScam: 'It is a scam',
    wrongFine: 'It is fine',
    wrongSaved: 'Saved on this device only. Export or delete it on the History page.',
    wrongFailed: 'Could not save on this device.',

    proofTitle: 'Privacy proof',
    proofNone: 'Your browser made 0 requests during this check.',
    proofSome: (count, external) =>
      external === 0
        ? `Your browser made ${count} request${count === 1 ? '' : 's'} to this app only (for example, saved model files). None went to another site.`
        : `Your browser made ${count} request${count === 1 ? '' : 's'}, ${external} to another site. Tell the team.`,
    proofOwnSite: 'this app',
    proofNote:
      'This list comes from your browser. For full proof, open the Network tab in DevTools and check again in airplane mode.',

    historyTitle: 'History',
    historyDescription:
      'Keep a private list of your past checks. It stays on this device and is off until you turn it on.',
    historyToggle: 'Save my checks on this device',
    historyPrivacy:
      'Only a short preview is saved, with numbers and links hidden. The full message is never kept here.',
    historyEmpty: 'No saved checks yet. Run a check and it will appear here.',
    historyEmptyOff: 'History is off. Turn it on to keep a private list of your checks.',
    historyScreenshot: 'Screenshot',
    historyDelete: 'Delete',
    historyDeleteAll: 'Delete everything',
    historyDeleteAllConfirm: 'Tap again to delete all checks and notes',
    notesTitle: 'Wrong-result notes',
    notesDescription:
      'When you say a result looks wrong, the full message is saved here so you can export it. Nothing is sent anywhere.',
    notesEmpty: 'No notes saved.',
    notesExport: 'Export notes as a file',
    noteScam: 'You said: it is a scam',
    noteFine: 'You said: it is fine',
    noteShownAs: (label) => `Shown as: ${label}`,

    settingsTitle: 'Comfort and language',
    settingsLanguage: 'Language',
    settingsFamily: 'Family mode',
    settingsFamilyHint:
      'Larger text and a simpler result screen. Switches to Filipino the first time you turn it on.',
    settingsContrast: 'High contrast',
    settingsContrastHint: 'Stronger colors and borders, easier in bright light.',
    langNames: { en: 'English', fil: 'Filipino', taglish: 'Taglish' },

    scamTypesTitle: 'Common scams in the Philippines',
    scamTypesIntro: 'Tap a scam to see how it looks and what to do.',
  },
  fil: {
    navigationHistory: 'Kasaysayan',
    moreDetails: 'Higit pang detalye',

    whyTitle: 'Bakit ito ang resulta',
    whyIntro:
      'Ang code ang nakakahanap ng mga katotohanan. Taga-suporta lang ang pagsusuri ng kahulugan. Walang kailangang internet sa dalawa.',
    whyCode: 'Nakita ng code',
    whyNoFlags: 'Walang nakitang red flag ang code sa mensaheng ito.',
    whyCalming: 'Nakakabawas ng pag-aalala',
    whyMeaning: 'Pinakamalapit na kilalang scam (ayon sa kahulugan)',
    whyMeaningNone:
      'Hindi tumakbo ang pagsusuri ng kahulugan, kaya code lang ang batayan ng resulta.',
    whyWriter:
      'Ang writer sa device mo ang sumulat lang ng paliwanag. Hindi siya ang pumili ng resulta.',
    whyNoWriter: 'Walang language model na sumulat ng alinman sa resultang ito.',

    detailsTitle: 'Mga numero at account sa mensahe',
    detailPhone: 'Mobile number',
    detailForeign: 'Numero mula sa ibang bansa',
    detailPayment: (channel) =>
      channel ? `Payment account sa ${channel}` : 'Account sa bangko o wallet',
    detailAskedToPay: 'Pinapadalhan ka ng pera sa numerong ito ayon sa mensahe.',
    detailPayHint:
      'Hindi humihingi ang bangko at wallet na magpadala ka ng pera sa personal na numero o account.',
    detailForeignHint:
      'Bihirang mag-text ang bangko o ahensya sa Pilipinas mula sa numerong galing ibang bansa.',
    detailNote: 'Ipinapakita para sa kaalaman mo. Hindi nito binabago ang resulta.',

    scamTypeTitle: 'Tungkol sa ganitong scam',
    scamTypeTell: 'Ganito ang itsura',
    scamTypeDo: 'Ano ang gagawin',

    helpTitle: 'Sino ang kokontakin',
    helpReport: 'I-report ito',
    helpPaid: 'Kung nagbayad ka na o nagbigay ng code',
    helpCall: 'Tumawag',
    helpEmail: 'Email',
    helpSite: 'Website',
    helpChecked: (date) =>
      `Sinuri ang contact details noong ${date}. Maaari itong magbago, kaya kumpirmahin sa opisyal na site.`,
    helpNever: 'Huwag gumamit ng numero o link na galing sa kahina-hinalang mensahe.',

    actionsTitle: 'I-share o i-save',
    shareCard: 'Mag-share ng larawang babala',
    shareCardHint: 'Resulta at payo lang ang nasa larawan. Hindi kasama ang mensahe.',
    shareReady: 'Naibahagi ang larawang babala.',
    shareSaved: 'Na-save ang larawang babala sa downloads mo.',
    shareFailed: 'Hindi magawa ang larawan sa device na ito.',
    copyReport: 'Kopyahin ang report',
    copyReportDone: 'Nakopya ang report. I-paste ito sa reklamo mo.',
    copyReportFailed: 'Hindi nakopya. Piliin at kopyahin mo na lang ang mensahe.',
    readAloud: 'Basahin nang malakas',
    stopReading: 'Itigil ang pagbabasa',
    cardFooter: 'Sinuri nang pribado sa sarili kong device gamit ang Sane',
    reportTitle: 'Sane scam check',
    reportChecked: (date) => `Sinuri noong ${date}`,
    reportResult: (label) => `Resulta: ${label}`,
    reportFlags: 'Mga red flag',
    reportMessage: 'Mensahe',
    reportDetails: 'Mga numero at account',
    reportFooter: 'Sinuri sa sariling device ng nagbasa. Babala ito, hindi patunay ng panloloko.',

    wrongTitle: 'Mali ba ang resultang ito?',
    wrongScam: 'Scam ito',
    wrongFine: 'Okay lang ito',
    wrongSaved: 'Na-save sa device na ito lang. I-export o burahin sa pahina ng Kasaysayan.',
    wrongFailed: 'Hindi ma-save sa device na ito.',

    proofTitle: 'Patunay ng privacy',
    proofNone: '0 request ang ginawa ng browser mo sa pag-check na ito.',
    proofSome: (count, external) =>
      external === 0
        ? `${count} request ang ginawa ng browser mo, sa app na ito lang (halimbawa, mga naka-save na model file). Wala sa ibang site.`
        : `${count} request ang ginawa ng browser mo, ${external} dito ay sa ibang site. Sabihin sa team.`,
    proofOwnSite: 'app na ito',
    proofNote:
      'Galing sa browser mo ang listahang ito. Para sa buong patunay, buksan ang Network tab sa DevTools at ulitin sa airplane mode.',

    historyTitle: 'Kasaysayan',
    historyDescription:
      'Magtago ng pribadong listahan ng mga na-check mo na. Nasa device mo lang ito at patay hangga’t hindi mo binubuksan.',
    historyToggle: 'I-save ang mga check ko sa device na ito',
    historyPrivacy:
      'Maikling preview lang ang sine-save, nakatago ang mga numero at link. Hindi itinatago rito ang buong mensahe.',
    historyEmpty: 'Wala pang naka-save. Mag-check ng mensahe at lalabas ito rito.',
    historyEmptyOff: 'Patay ang kasaysayan. Buksan ito para magtago ng pribadong listahan.',
    historyScreenshot: 'Screenshot',
    historyDelete: 'Burahin',
    historyDeleteAll: 'Burahin lahat',
    historyDeleteAllConfirm: 'Pindutin ulit para burahin ang lahat ng check at tala',
    notesTitle: 'Mga tala ng maling resulta',
    notesDescription:
      'Kapag sinabi mong mali ang resulta, nase-save rito ang buong mensahe para ma-export mo. Walang ipinapadala kahit saan.',
    notesEmpty: 'Walang naka-save na tala.',
    notesExport: 'I-export ang mga tala bilang file',
    noteScam: 'Sabi mo: scam ito',
    noteFine: 'Sabi mo: okay lang ito',
    noteShownAs: (label) => `Ipinakita bilang: ${label}`,

    settingsTitle: 'Ginhawa at wika',
    settingsLanguage: 'Wika',
    settingsFamily: 'Family mode',
    settingsFamilyHint:
      'Mas malaking text at mas simpleng resulta. Lilipat sa Filipino sa unang beses na buksan mo ito.',
    settingsContrast: 'Mataas na contrast',
    settingsContrastHint: 'Mas matingkad na kulay at gilid, mas madaling basahin sa maliwanag.',
    langNames: { en: 'English', fil: 'Filipino', taglish: 'Taglish' },

    scamTypesTitle: 'Mga karaniwang scam sa Pilipinas',
    scamTypesIntro: 'Pindutin ang scam para makita ang itsura nito at ang gagawin.',
  },
  taglish: {
    navigationHistory: 'History',
    moreDetails: 'More details',

    whyTitle: 'Bakit ito ang result',
    whyIntro:
      'Ang code ang nakakahanap ng facts. Support lang ang meaning check. Walang kailangang internet sa dalawa.',
    whyCode: 'Nakita ng code',
    whyNoFlags: 'Walang nakitang red flag ang code sa message na ito.',
    whyCalming: 'Nakakabawas ng worry',
    whyMeaning: 'Pinakamalapit na known scam patterns (by meaning)',
    whyMeaningNone: 'Hindi tumakbo ang meaning check, kaya code lang ang basis ng result.',
    whyWriter:
      'Ang on-device writer ang sumulat lang ng explanation. Hindi siya ang pumili ng result.',
    whyNoWriter: 'Walang language model na sumulat ng kahit anong part ng result na ito.',

    detailsTitle: 'Numbers at accounts sa message',
    detailPhone: 'Mobile number',
    detailForeign: 'Overseas number',
    detailPayment: (channel) =>
      channel ? `Payment account sa ${channel}` : 'Bank o wallet account',
    detailAskedToPay: 'Pinapa-send ka ng pera sa number na ito ayon sa message.',
    detailPayHint:
      'Hindi humihingi ang banks at wallets na mag-send ka ng pera sa personal na number o account.',
    detailForeignHint: 'Bihirang mag-text ang Philippine bank o agency mula sa overseas number.',
    detailNote: 'Ipinapakita for your info. Hindi nito binabago ang result.',

    scamTypeTitle: 'Tungkol sa ganitong scam',
    scamTypeTell: 'Ganito ang itsura',
    scamTypeDo: 'Ano ang gagawin',

    helpTitle: 'Sino ang kokontakin',
    helpReport: 'I-report ito',
    helpPaid: 'Kung nag-pay ka na o nag-share ng code',
    helpCall: 'Tumawag',
    helpEmail: 'Email',
    helpSite: 'Website',
    helpChecked: (date) =>
      `Na-check ang contact details noong ${date}. Pwedeng magbago, kaya i-confirm sa official site.`,
    helpNever: 'Huwag gumamit ng number o link na galing sa suspicious na message.',

    actionsTitle: 'I-share o i-save',
    shareCard: 'Mag-share ng warning picture',
    shareCardHint: 'Result at advice lang ang nasa picture. Hindi kasama ang message.',
    shareReady: 'Na-share na ang warning picture.',
    shareSaved: 'Na-save ang warning picture sa downloads mo.',
    shareFailed: 'Hindi magawa ang picture sa device na ito.',
    copyReport: 'I-copy ang report',
    copyReportDone: 'Na-copy ang report. I-paste sa complaint mo.',
    copyReportFailed: 'Hindi na-copy. Piliin at i-copy mo na lang ang message.',
    readAloud: 'Basahin nang malakas',
    stopReading: 'Itigil ang pagbabasa',
    cardFooter: 'Na-check nang private sa sarili kong device gamit ang Sane',
    reportTitle: 'Sane scam check',
    reportChecked: (date) => `Na-check noong ${date}`,
    reportResult: (label) => `Result: ${label}`,
    reportFlags: 'Mga red flag',
    reportMessage: 'Message',
    reportDetails: 'Numbers at accounts',
    reportFooter: 'Na-check sa sariling device ng nagbasa. Warning ito, hindi proof ng fraud.',

    wrongTitle: 'Mali ba ang result na ito?',
    wrongScam: 'Scam ito',
    wrongFine: 'Okay lang ito',
    wrongSaved: 'Na-save sa device na ito lang. I-export o i-delete sa History page.',
    wrongFailed: 'Hindi ma-save sa device na ito.',

    proofTitle: 'Privacy proof',
    proofNone: '0 requests ang ginawa ng browser mo sa check na ito.',
    proofSome: (count, external) =>
      external === 0
        ? `${count} request${count === 1 ? '' : 's'} ang ginawa ng browser mo, sa app na ito lang (halimbawa, saved model files). Wala sa ibang site.`
        : `${count} request${count === 1 ? '' : 's'} ang ginawa ng browser mo, ${external} dito ay sa ibang site. Sabihin sa team.`,
    proofOwnSite: 'app na ito',
    proofNote:
      'Galing sa browser mo ang list na ito. Para sa full proof, buksan ang Network tab sa DevTools at ulitin sa airplane mode.',

    historyTitle: 'History',
    historyDescription:
      'Magtago ng private list ng mga na-check mo na. Nasa device mo lang ito at off hangga’t hindi mo binubuksan.',
    historyToggle: 'I-save ang checks ko sa device na ito',
    historyPrivacy:
      'Short preview lang ang sine-save, nakatago ang numbers at links. Hindi itinatago rito ang buong message.',
    historyEmpty: 'Wala pang naka-save. Mag-check ng message at lalabas ito rito.',
    historyEmptyOff: 'Off ang history. I-on ito para magtago ng private list.',
    historyScreenshot: 'Screenshot',
    historyDelete: 'I-delete',
    historyDeleteAll: 'I-delete lahat',
    historyDeleteAllConfirm: 'Pindutin ulit para i-delete lahat ng checks at notes',
    notesTitle: 'Notes ng maling result',
    notesDescription:
      'Kapag sinabi mong mali ang result, nase-save rito ang buong message para ma-export mo. Walang ipinapadala kahit saan.',
    notesEmpty: 'Walang naka-save na notes.',
    notesExport: 'I-export ang notes bilang file',
    noteScam: 'Sabi mo: scam ito',
    noteFine: 'Sabi mo: okay lang ito',
    noteShownAs: (label) => `Ipinakita bilang: ${label}`,

    settingsTitle: 'Comfort at language',
    settingsLanguage: 'Language',
    settingsFamily: 'Family mode',
    settingsFamilyHint:
      'Mas malaking text at mas simpleng result screen. Lilipat sa Filipino sa unang beses na i-on mo ito.',
    settingsContrast: 'High contrast',
    settingsContrastHint: 'Mas matingkad na colors at borders, mas madaling basahin sa maliwanag.',
    langNames: { en: 'English', fil: 'Filipino', taglish: 'Taglish' },

    scamTypesTitle: 'Common scams sa Pilipinas',
    scamTypesIntro: 'Pindutin ang scam para makita ang itsura nito at ang gagawin.',
  },
};

export function extraCopyFor(lang: Lang): ExtraCopy {
  return EXTRA[lang];
}
