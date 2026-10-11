import type { Lang, Level } from '../types';

type AssessmentCopy = {
  label: string;
  summary: string;
  nextTitle: string;
  nextStep: string;
};

type GuideCopy = {
  title: string;
  body: string;
};

type Copy = {
  languageName: string;
  openNavigation: string;
  closeNavigation: string;
  mainNavigationLabel: string;
  navigationScan: string;
  navigationLearn: string;
  footerSlogan: string;
  footerDevelopedBy: string;
  themeLabel: string;
  themeSystem: string;
  themeLight: string;
  themeDark: string;
  welcomeTitle: string;
  welcomeDescription: string;
  languageLabel: string;
  manualLabel: string;
  manualTitle: string;
  manualDescription: string;
  localLabel: string;
  localTitle: string;
  localDescription: string;
  privacyFootnote: string;
  start: string;
  backToScan: string;
  useText: string;
  scanTitle: string;
  scanDescription: string;
  messageLabel: string;
  extractedMessageLabel: string;
  messagePlaceholder: string;
  paste: string;
  upload: string;
  analyze: string;
  checking: string;
  characterCount: (count: number, max: number) => string;
  overLimit: string;
  clipboardUnavailable: string;
  clipboardError: string;
  screenshotSelected: (name: string) => string;
  screenshotTypeError: string;
  screenshotLimitError: string;
  screenshotLoading: string;
  screenshotReady: string;
  screenshotFailed: string;
  readyTitle: string;
  readyDescription: string;
  howTitle: string;
  howSteps: readonly [string, string, string];
  pasteOnlyNotice: string;
  sharedLimitError: string;
  shareEmpty: string;
  iosInstallHint: string;
  installApp: string;
  installOffline: string;
  installManual: string;
  installPending: string;
  updateTitle: string;
  updateNote: string;
  updateAction: string;
  updateLater: string;
  updateApplying: string;
  analysisError: string;
  resultTitle: string;
  resultSubtitle: string;
  coverageText: string;
  coverageImage: string;
  coverageOcr: string;
  ocrUsed: string;
  nextPrefix: string;
  originalTitle: string;
  imageOriginal: string;
  originalNote: string;
  another: string;
  modelTitle: string;
  modelRan: string;
  noModel: string;
  modelPreparing: (percent: number) => string;
  modelDownloadTitle: string;
  modelDownloadNote: string;
  modelReadyStatus: string;
  modelReadyNote: string;
  notificationLabel: string;
  dismissNotification: string;
  modelFailedStatus: string;
  modelPausedStatus: string;
  modelRetry: string;
  modelPrepare: string;
  modelDetails: string;
  modelNotReadyAtScan: string;
  modelFailedAtScan: string;
  modelSkippedAtScan: string;
  llmPaused: (size: number) => string;
  llmChecking: string;
  llmUnavailable: string;
  llmDownloadAction: string;
  llmDownloadTitle: string;
  llmProgress: (downloadedMb: number, totalMb: number) => string;
  llmReady: string;
  llmError: string;
  llmRetry: string;
  llmWriting: string;
  llmExplanationTitle: string;
  llmDisclaimer: string;
  llmModelRan: string;
  llmModelNotRun: string;
  rulesTitle: string;
  noSignals: string;
  signalNote: string;
  learnTitle: string;
  learnDescription: string;
  learnLanguages: string;
  guides: readonly GuideCopy[];
  learnDisclaimerTitle: string;
  learnDisclaimer: string;
  learnAction: string;
  assessment: Record<Level, AssessmentCopy>;
};

export const COPY: Record<Lang, Copy> = {
  en: {
    languageName: 'English',
    openNavigation: 'Open navigation',
    closeNavigation: 'Close navigation',
    mainNavigationLabel: 'Main navigation',
    navigationScan: 'Scan',
    navigationLearn: 'Learn',
    footerSlogan: 'When in doubt, sane it out.',
    footerDevelopedBy: 'Developed by',
    themeLabel: 'Theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    welcomeTitle: 'May duda? I-check muna.',
    welcomeDescription: 'Sane spots scam signs in suspicious messages, right in your browser.',
    languageLabel: 'Language',
    manualLabel: 'Manual',
    manualTitle: 'Paste to scan',
    manualDescription: 'You choose what to paste. Sane does not automatically read your clipboard.',
    localLabel: 'On device',
    localTitle: 'Local phone analysis',
    localDescription: 'The baseline may miss or incorrectly flag messages.',
    privacyFootnote: 'No account needed. Messages are checked on your device.',
    start: 'Check a message',
    backToScan: 'Back to scan',
    useText: 'Use text instead',
    scanTitle: 'Scan a message',
    scanDescription:
      'Paste a message or upload a screenshot to check for possible scam indicators.',
    messageLabel: 'Original message',
    extractedMessageLabel: 'Extracted message',
    messagePlaceholder: 'Paste or type the complete message here.',
    paste: 'Paste',
    upload: 'Choose screenshot',
    analyze: 'Analyze',
    checking: 'Checking on this device…',
    characterCount: (count, max) => `${count.toLocaleString('en')} / ${max.toLocaleString('en')}`,
    overLimit: 'This message is over the 2,000 character limit. Shorten it to continue.',
    clipboardUnavailable: 'Clipboard access is unavailable. Paste directly into the message box.',
    clipboardError: 'Could not read the clipboard. Check browser permission or paste directly.',
    screenshotSelected: (name) => `Selected screenshot: ${name}`,
    screenshotTypeError: 'Choose an image file to continue.',
    screenshotLimitError: 'This image is too large. Choose an image smaller than 10 MB.',
    screenshotLoading: 'Reading text from this screenshot on your device…',
    screenshotReady: 'Review and edit the extracted text before checking.',
    screenshotFailed: 'We could not read this screenshot. Paste or type the message instead.',
    readyTitle: 'Ready to check',
    readyDescription: 'Sane highlights warning signs and gives you practical next steps.',
    howTitle: 'How to check',
    howSteps: [
      'Paste a message or choose a screenshot.',
      'Review the message, then select Analyze.',
      'Read the possible signs and next step.',
    ],
    pasteOnlyNotice: 'Clipboard is read only when you choose Paste. Links are never opened.',
    sharedLimitError:
      'This shared message is over the 2,000 character limit. Paste a shorter part to check.',
    shareEmpty: 'No message or screenshot came through. Paste or choose one to check.',
    iosInstallHint:
      'On iPhone or iPad, open Sane in Safari, tap Share, then Add to Home Screen. If you see a switch called Open as Web App, keep it on. Then open Sane from its new icon, not from Safari.',
    installApp: 'Install Sane',
    installOffline: 'You are offline. Sane still works; connect to the internet to install it.',
    installManual:
      'No install prompt? Open your browser menu and choose Install app or Add to Home screen.',
    installPending:
      "On Android: if Sane isn't in your apps a minute after installing, open the Play Store once, then reload this page and tap Install again.",
    updateTitle: 'A new version of Sane is ready',
    updateNote:
      'It has already downloaded. Your settings and history stay on this device after updating.',
    updateAction: 'Update now',
    updateLater: 'Later',
    updateApplying: 'Updating…',
    analysisError: 'The check could not finish. Try again or paste the message into the box.',
    resultTitle: 'Message assessment',
    resultSubtitle: 'A clear, reliable check to help you decide what to do next.',
    coverageText: 'Coverage: complete message · entered manually',
    coverageImage: 'Coverage: screenshot text unavailable',
    coverageOcr: 'Coverage: text read from screenshot and reviewed',
    ocrUsed: 'Screenshot text was read on this device.',
    nextPrefix: 'Next step',
    originalTitle: 'Original message',
    imageOriginal: 'No text was extracted from this screenshot.',
    originalNote:
      'Message text is not opened. Link schemes are broken to prevent accidental visits.',
    another: 'Check another message',
    modelTitle: 'Model assessment',
    modelRan: 'An on-device model ran for this check.',
    noModel: 'No AI model ran for this check.',
    modelPreparing: (percent) =>
      `Preparing the AI check: ${percent}%. You can still check a message; it will use rules only until this is ready.`,
    modelDownloadTitle: 'Preparing the AI check',
    modelDownloadNote:
      'Downloading and setting up the model. You can keep checking messages with rules while it prepares.',
    modelReadyStatus: 'AI check ready',
    modelReadyNote: 'The model is ready to help check your next message on this device.',
    notificationLabel: 'AI model notifications',
    dismissNotification: 'Dismiss notification',
    modelFailedStatus: 'The AI check could not be prepared. Checks use rules only.',
    modelPausedStatus: 'The AI check is paused to save data. Checks use rules only.',
    modelRetry: 'Try again',
    modelPrepare: 'Prepare the AI check',
    modelDetails: 'Details for troubleshooting',
    modelNotReadyAtScan:
      'The AI check was not ready yet, so this used rules only. Check again once it is ready.',
    modelFailedAtScan:
      'The AI check could not run, so this used rules only. You can try preparing it again.',
    modelSkippedAtScan: 'The AI check is paused to save data, so this used rules only.',
    llmPaused: (size) =>
      `Optional: add an AI-written explanation to each result (about ${size} MB, downloaded once, Wi-Fi recommended).`,
    llmChecking: 'Checking device support for AI explanations…',
    llmUnavailable:
      'AI explanations need a supported browser and graphics processor. Message checks still work without them.',
    llmDownloadAction: 'Download AI explanation',
    llmDownloadTitle: 'Preparing the AI explanation',
    llmProgress: (mb, total) =>
      `${mb} of about ${total} MB downloaded. You can keep checking messages while it loads.`,
    llmReady: 'AI explanation ready.',
    llmError: 'The AI explanation could not load. Results still include fixed advice.',
    llmRetry: 'Try the AI explanation again',
    llmWriting: 'Writing a short explanation on this device…',
    llmExplanationTitle: 'AI explanation',
    llmDisclaimer: 'AI-written, may be wrong. It cannot change the risk level.',
    llmModelRan: 'The AI explanation model ran for this check.',
    llmModelNotRun: 'The AI explanation model did not run for this check.',
    rulesTitle: 'Observed message details',
    noSignals: 'No specific warning signs were identified in the available text.',
    signalNote: 'A single word or link does not prove that a message is a scam.',
    learnTitle: 'How to use Sane',
    learnDescription: 'Follow these steps to check a message and understand what to do next.',
    learnLanguages: 'Works with messages in English, Filipino, or Taglish',
    guides: [
      {
        title: 'Add a message',
        body: 'Paste or type a message, or choose a screenshot to read its text.',
      },
      {
        title: 'Review the text',
        body: 'Check the extracted screenshot text, edit it if needed, then select Analyze.',
      },
      {
        title: 'Read the result',
        body: 'Review the risk level, warning signs, and suggested next step.',
      },
      {
        title: 'Verify independently',
        body: 'No warning signs do not prove a message is safe. Check with an official source.',
      },
    ],
    learnDisclaimerTitle: 'A check, not a verdict',
    learnDisclaimer:
      'The local baseline can make mistakes. Independent verification still matters.',
    learnAction: 'Check a message',
    assessment: {
      likely_scam: {
        label: 'High concern',
        summary: 'This message has signs that could put your money or account at risk.',
        nextTitle: 'Verify independently',
        nextStep:
          'Do not use the message link. Open the official app or use a contact route you already trust.',
      },
      suspicious: {
        label: 'Use caution',
        summary: 'This request is unclear. The sender cannot be confirmed from the message alone.',
        nextTitle: 'Verify independently',
        nextStep:
          'Confirm through a contact route you already trust. Do not rely only on the sender name.',
      },
      probably_fine: {
        label: 'No obvious warning signs',
        summary:
          'No obvious warning signs are visible in this text. That does not prove the sender is legitimate.',
        nextTitle: 'Still verify',
        nextStep:
          'If anything feels unexpected, open the official app yourself. Never share a verification code.',
      },
      not_sure: {
        label: 'Unable to assess',
        summary: 'There is not enough readable information to assess this message.',
        nextTitle: 'Check the original',
        nextStep:
          'Review the complete message or paste its text here. Verify unexpected requests independently.',
      },
    },
  },
  fil: {
    languageName: 'Filipino',
    openNavigation: 'Buksan ang nabigasyon',
    closeNavigation: 'Isara ang nabigasyon',
    mainNavigationLabel: 'Pangunahing nabigasyon',
    navigationScan: 'Suriin',
    navigationLearn: 'Alamin',
    footerSlogan: 'When in doubt, sane it out.',
    footerDevelopedBy: 'Binuo ng',
    themeLabel: 'Tema',
    themeSystem: 'System',
    themeLight: 'Maliwanag',
    themeDark: 'Madilim',
    welcomeTitle: 'May duda? I-check muna.',
    welcomeDescription:
      'Kakaibang mensahe? I-paste dito para makita ang posibleng senyales ng scam.',
    languageLabel: 'Wika',
    manualLabel: 'Manu-mano',
    manualTitle: 'I-paste para suriin',
    manualDescription:
      'Ikaw ang pipili at magpa-paste ng mensahe. Hindi awtomatikong binabasa ang clipboard.',
    localLabel: 'Sa device',
    localTitle: 'Pagsusuri sa telepono',
    localDescription: 'Maaaring may hindi makita o maling ma-flag ang baseline.',
    privacyFootnote: 'Walang account na kailangan. Sa iyong device lang sinusuri ang mensahe.',
    start: 'Suriin ang Mensahe',
    backToScan: 'Bumalik sa pagsusuri',
    useText: 'Gamitin ang text',
    scanTitle: 'Suriin ang mensahe',
    scanDescription:
      'I-paste ang mensahe o pumili ng screenshot para tingnan kung may senyales ng scam.',
    messageLabel: 'Orihinal na mensahe',
    extractedMessageLabel: 'Nakuha na mensahe',
    messagePlaceholder: 'I-paste o i-type rito ang buong mensahe.',
    paste: 'I-paste',
    upload: 'Pumili ng screenshot',
    analyze: 'Suriin',
    checking: 'Sinusuri sa device na ito…',
    characterCount: (count, max) => `${count.toLocaleString('fil')} / ${max.toLocaleString('fil')}`,
    overLimit: 'Lampas ito sa 2,000 character. Paikliin ang mensahe para magpatuloy.',
    clipboardUnavailable: 'Hindi mabuksan ang clipboard. I-paste ang mensahe sa kahon.',
    clipboardError: 'Hindi mabasa ang clipboard. Tingnan ang pahintulot o mag-paste sa kahon.',
    screenshotSelected: (name) => `Napiling screenshot: ${name}`,
    screenshotTypeError: 'Pumili ng image file para magpatuloy.',
    screenshotLimitError: 'Masyadong malaki ang image. Pumili ng mas maliit sa 10 MB.',
    screenshotLoading: 'Binabasa sa device mo ang text mula sa screenshot…',
    screenshotReady: 'Basahin at i-edit muna ang nakuha na text bago magsuri.',
    screenshotFailed: 'Hindi mabasa ang screenshot. I-paste o i-type na lang ang mensahe.',
    readyTitle: 'Handa nang magsuri',
    readyDescription:
      'Ipinapakita ng Sane ang mga babalang senyales at nagbibigay ng praktikal na susunod na hakbang.',
    howTitle: 'Paano magsuri',
    howSteps: [
      'I-paste ang mensahe o pumili ng screenshot.',
      'Basahin muna ito, saka piliin ang Suriin.',
      'Tingnan ang mga posibleng senyales at susunod na hakbang.',
    ],
    pasteOnlyNotice:
      'Binabasa lang ang clipboard kapag pinili mo ang I-paste. Hindi binubuksan ang mga link.',
    sharedLimitError:
      'Lampas sa 2,000 character ang mensaheng ipinasa. Mag-paste ng mas maikling bahagi para masuri.',
    shareEmpty: 'Walang dumating na mensahe o screenshot. Mag-paste o pumili ng susuriin.',
    iosInstallHint:
      'Sa iPhone o iPad, buksan ang Sane sa Safari, i-tap ang Share, saka Add to Home Screen. Kung may switch na Open as Web App, iwanang naka-on. Pagkatapos, buksan ang Sane mula sa bagong icon, hindi sa Safari.',
    installApp: 'I-install ang Sane',
    installOffline:
      'Offline ka. Gumagana pa rin ang Sane; kumonekta sa internet para ma-install ito.',
    installManual:
      'Walang lumabas na prompt? Buksan ang menu ng browser at piliin ang Install app o Add to Home screen.',
    installPending:
      'Sa Android: kung wala pa ang Sane sa iyong apps isang minuto matapos i-install, buksan muna ang Play Store, i-reload ang page na ito, saka i-tap ulit ang I-install.',
    updateTitle: 'May bagong bersyon ng Sane',
    updateNote:
      'Na-download na ito. Mananatili sa device na ito ang iyong settings at history pagkatapos mag-update.',
    updateAction: 'I-update ngayon',
    updateLater: 'Mamaya',
    updateApplying: 'Ina-update…',
    analysisError: 'Hindi natapos ang pagsusuri. Subukan ulit o i-paste ang mensahe sa kahon.',
    resultTitle: 'Resulta ng pagsusuri',
    resultSubtitle:
      'Malinaw at maaasahang pagsusuri para matulungan kang magpasya sa susunod na gagawin.',
    coverageText: 'Saklaw: buong mensahe · ikaw ang naglagay',
    coverageImage: 'Saklaw: hindi mabasa ang text sa screenshot',
    coverageOcr: 'Saklaw: binasa at nirepaso ang text mula sa screenshot',
    ocrUsed: 'Binasa sa device na ito ang text mula sa screenshot.',
    nextPrefix: 'Susunod',
    originalTitle: 'Orihinal na mensahe',
    imageOriginal: 'Walang text na nakuha mula sa screenshot na ito.',
    originalNote:
      'Hindi binubuksan ang text. Binabago ang simula ng link para maiwasan ang aksidenteng pagbisita.',
    another: 'Suriin ang ibang mensahe',
    modelTitle: 'Pagtatasa ng modelo',
    modelRan: 'May on-device model na tumakbo sa pagsusuring ito.',
    noModel: 'Walang AI model na ginamit.',
    modelPreparing: (percent) =>
      `Inihahanda ang AI check: ${percent}%. Maaari ka pa ring mag-check ng mensahe; rules lang ang gagamitin hanggang handa na ito.`,
    modelDownloadTitle: 'Inihahanda ang AI check',
    modelDownloadNote:
      'Dina-download at inihahanda ang modelo. Maaari ka pa ring magsuri ng mensahe gamit ang rules.',
    modelReadyStatus: 'Handa na ang AI check',
    modelReadyNote: 'Handa na ang modelo para tumulong sa susunod na pagsusuri sa device na ito.',
    notificationLabel: 'Mga abiso ng AI model',
    dismissNotification: 'Isara ang abiso',
    modelFailedStatus: 'Hindi nahanda ang AI check. Rules lang ang gamit ng mga check.',
    modelPausedStatus:
      'Naka-pause ang AI check para makatipid ng data. Rules lang ang gamit ng mga check.',
    modelRetry: 'Subukan muli',
    modelPrepare: 'Ihanda ang AI check',
    modelDetails: 'Detalye para sa pag-aayos',
    modelNotReadyAtScan:
      'Hindi pa handa ang AI check, kaya rules lang ang ginamit dito. Mag-check muli kapag handa na ito.',
    modelFailedAtScan:
      'Hindi tumakbo ang AI check, kaya rules lang ang ginamit dito. Maaari mong subukang ihanda itong muli.',
    modelSkippedAtScan:
      'Naka-pause ang AI check para makatipid ng data, kaya rules lang ang ginamit dito.',
    llmPaused: (size) =>
      `Opsyonal: magdagdag ng AI na paliwanag sa bawat resulta (mga ${size} MB, isang beses lang i-download, mas mainam sa Wi-Fi).`,
    llmChecking: 'Sinusuri kung suportado ng device na ito ang AI na paliwanag…',
    llmUnavailable:
      'Kailangan ng sinusuportahang browser at graphics processor para sa AI na paliwanag. Gumagana pa rin ang message check nang wala ito.',
    llmDownloadAction: 'I-download ang AI na paliwanag',
    llmDownloadTitle: 'Inihahanda ang AI na paliwanag',
    llmProgress: (mb, total) =>
      `${mb} sa humigit-kumulang ${total} MB ang na-download na. Puwede ka pa ring magsuri habang naglo-load ito.`,
    llmReady: 'Handa na ang AI na paliwanag.',
    llmError: 'Hindi ma-load ang AI na paliwanag. May payo pa rin sa bawat resulta.',
    llmRetry: 'Subukan ulit ang AI na paliwanag',
    llmWriting: 'Isinusulat ang maikling paliwanag sa device na ito…',
    llmExplanationTitle: 'AI na paliwanag',
    llmDisclaimer: 'AI ang sumulat nito at puwedeng magkamali. Hindi nito mababago ang risk level.',
    llmModelRan: 'Tumakbo ang AI explanation model para sa check na ito.',
    llmModelNotRun: 'Hindi tumakbo ang AI explanation model para sa check na ito.',
    rulesTitle: 'Mga nakitang detalye',
    noSignals: 'Walang tiyak na babala na nakita sa nababasang text.',
    signalNote: 'Hindi sapat ang iisang salita o link para sabihing scam ang mensahe.',
    learnTitle: 'Paano gamitin ang Sane',
    learnDescription:
      'Sundin ang mga hakbang para suriin ang mensahe at malaman ang susunod na gagawin.',
    learnLanguages: 'Nasusuri ang mensaheng nasa English, Filipino, o Taglish',
    guides: [
      {
        title: 'Maglagay ng mensahe',
        body: 'I-paste o i-type ang mensahe, o pumili ng screenshot para basahin ang text.',
      },
      {
        title: 'Suriin ang text',
        body: 'Suriin at i-edit kung kailangan ang text mula sa screenshot, saka piliin ang Suriin.',
      },
      {
        title: 'Basahin ang resulta',
        body: 'Tingnan ang risk level, mga babala, at mungkahing susunod na hakbang.',
      },
      {
        title: 'Mag-verify nang hiwalay',
        body: 'Hindi patunay na ligtas ang mensahe kapag walang babala. Magtanong sa opisyal na source.',
      },
    ],
    learnDisclaimerTitle: 'Pagsusuri lang, hindi hatol',
    learnDisclaimer:
      'Maaaring magkamali ang lokal na baseline. Mahalaga pa rin ang sariling beripikasyon.',
    learnAction: 'Suriin ang mensahe',
    assessment: {
      likely_scam: {
        label: 'Matinding babala',
        summary: 'May mga senyales na maaaring maglagay sa pera o account mo sa panganib.',
        nextTitle: 'Mag-verify nang hiwalay',
        nextStep:
          'Huwag gamitin ang link sa mensahe. Buksan ang opisyal na app o gumamit ng kilalang contact route.',
      },
      suspicious: {
        label: 'Mag-ingat',
        summary: 'Hindi malinaw ang hiling. Hindi mapapatunayan ang sender mula sa mensahe lang.',
        nextTitle: 'Mag-verify nang hiwalay',
        nextStep:
          'Kumpirmahin gamit ang contact na pinagkakatiwalaan mo. Huwag umasa sa pangalan lang ng sender.',
      },
      probably_fine: {
        label: 'Walang nakitang malinaw na babala',
        summary: 'Walang malinaw na babala sa text. Hindi nito pinatutunayang lehitimo ang sender.',
        nextTitle: 'Mag-verify pa rin',
        nextStep:
          'Kung hindi inaasahan ang mensahe, buksan mismo ang opisyal na app. Huwag ibigay ang code.',
      },
      not_sure: {
        label: 'Hindi masuri',
        summary: 'Kulang ang nababasang impormasyon para masuri ang mensaheng ito.',
        nextTitle: 'Tingnan ang orihinal',
        nextStep:
          'Basahin ang buong mensahe o i-paste rito ang text. Mag-verify ng hindi inaasahang hiling.',
      },
    },
  },
  taglish: {
    languageName: 'Taglish',
    openNavigation: 'Buksan ang navigation',
    closeNavigation: 'Isara ang navigation',
    mainNavigationLabel: 'Main navigation',
    navigationScan: 'Scan',
    navigationLearn: 'Learn',
    footerSlogan: 'When in doubt, sane it out.',
    footerDevelopedBy: 'Developed by',
    themeLabel: 'Theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    welcomeTitle: 'May duda? I-check muna.',
    welcomeDescription:
      'Kakaibang message? I-paste dito para makita ang posibleng senyales ng scam.',
    languageLabel: 'Language',
    manualLabel: 'Manual check',
    manualTitle: 'Ikaw ang pipili ng ipa-paste',
    manualDescription: 'Hindi automatic na binabasa ng Sane ang clipboard mo.',
    localLabel: 'Sa device',
    localTitle: 'Local na message check',
    localDescription: 'Puwedeng magkamali ang result.',
    privacyFootnote: 'Walang account na kailangan. Sa device mo lang sinusuri ang message.',
    start: 'I-check ang Message',
    backToScan: 'Bumalik sa pag-check',
    useText: 'Gamitin ang text',
    scanTitle: 'I-check ang message',
    scanDescription:
      'I-paste ang message o pumili ng screenshot para tingnan ang possible scam signs.',
    messageLabel: 'Original na message',
    extractedMessageLabel: 'Extracted na message',
    messagePlaceholder: 'I-paste o i-type dito ang buong message.',
    paste: 'I-paste',
    upload: 'Pumili ng screenshot',
    analyze: 'I-check',
    checking: 'Chine-check sa device na ito…',
    characterCount: (count, max) => `${count.toLocaleString('en')} / ${max.toLocaleString('en')}`,
    overLimit: 'Lampas ito sa 2,000 characters. Paikliin ang message para magpatuloy.',
    clipboardUnavailable: 'Hindi available ang clipboard. I-paste ang message sa text box.',
    clipboardError: 'Hindi mabasa ang clipboard. Check ang permission o mag-paste sa text box.',
    screenshotSelected: (name) => `Selected screenshot: ${name}`,
    screenshotTypeError: 'Pumili ng image file para magpatuloy.',
    screenshotLimitError: 'Masyadong malaking image. Pumili ng mas maliit sa 10 MB.',
    screenshotLoading: 'Binabasa sa device mo ang text mula sa screenshot…',
    screenshotReady: 'I-review at i-edit muna ang extracted text bago mag-check.',
    screenshotFailed: 'Hindi mabasa ang screenshot. I-paste o i-type na lang ang message.',
    readyTitle: 'Ready nang mag-check',
    readyDescription:
      'Ipinapakita ng Sane ang mga warning sign at nagbibigay ng praktikal na susunod na hakbang.',
    howTitle: 'Paano mag-check',
    howSteps: [
      'I-paste ang message o pumili ng screenshot.',
      'I-review ang message, saka piliin ang I-check.',
      'Basahin ang possible signs at next step.',
    ],
    pasteOnlyNotice:
      'Clipboard lang ang binabasa kapag pinili mo ang I-paste. Hindi ino-open ang links.',
    sharedLimitError:
      'Lampas 2,000 characters ang shared message. I-paste ang mas maikling part para ma-check.',
    shareEmpty: 'Walang dumating na message o screenshot. Mag-paste o pumili ng iche-check.',
    iosInstallHint:
      'Sa iPhone o iPad, buksan ang Sane sa Safari, tap Share, tapos Add to Home Screen. Kung may switch na Open as Web App, iwanang naka-on. Pagkatapos, i-open ang Sane mula sa bagong icon, hindi sa Safari.',
    installApp: 'I-install ang Sane',
    installOffline:
      'Offline ka. Gumagana pa rin ang Sane; mag-connect sa internet para ma-install.',
    installManual:
      'Walang lumabas na prompt? Buksan ang browser menu at piliin ang Install app o Add to Home screen.',
    installPending:
      'Sa Android: kung wala pa ang Sane sa apps mo one minute after mag-install, buksan muna ang Play Store, i-reload ang page, tapos i-tap ulit ang I-install.',
    updateTitle: 'May bagong version ng Sane',
    updateNote:
      'Na-download na ito. Naka-save pa rin sa device mo ang settings at history pagka-update.',
    updateAction: 'I-update ngayon',
    updateLater: 'Mamaya na',
    updateApplying: 'Ina-update…',
    analysisError: 'Hindi natapos ang check. Try ulit o i-paste ang message sa box.',
    resultTitle: 'Message assessment',
    resultSubtitle:
      'Malinaw at maaasahang check para matulungan kang magpasya sa susunod na gagawin.',
    coverageText: 'Coverage: buong message · ikaw ang nag-enter',
    coverageImage: 'Coverage: hindi available ang screenshot text',
    coverageOcr: 'Coverage: na-read at na-review ang text mula sa screenshot',
    ocrUsed: 'Na-read sa device na ito ang screenshot text.',
    nextPrefix: 'Next step',
    originalTitle: 'Original na message',
    imageOriginal: 'Walang text na na-extract mula sa screenshot.',
    originalNote:
      'Hindi ino-open ang text. Binabago ang simula ng link para maiwasan ang accidental na pagbisita.',
    another: 'Mag-check ng ibang message',
    modelTitle: 'Model assessment',
    modelRan: 'May on-device model na tumakbo sa check na ito.',
    noModel: 'Walang AI model na tumakbo.',
    modelPreparing: (percent) =>
      `Inihahanda ang AI check: ${percent}%. Pwede ka pa ring mag-check ng message; rules lang ang gagamitin hangga't hindi pa ready.`,
    modelDownloadTitle: 'Inihahanda ang AI check',
    modelDownloadNote:
      'Dina-download at sine-set up ang model. Pwede ka pa ring mag-check ng messages gamit ang rules.',
    modelReadyStatus: 'Ready na ang AI check',
    modelReadyNote: 'Ready na ang model para tumulong sa next message check sa device na ito.',
    notificationLabel: 'AI model notifications',
    dismissNotification: 'Isara ang notification',
    modelFailedStatus: 'Hindi na-prepare ang AI check. Rules lang ang gamit ng mga check.',
    modelPausedStatus:
      'Naka-pause ang AI check para makatipid ng data. Rules lang ang gamit ng mga check.',
    modelRetry: 'Subukan ulit',
    modelPrepare: 'I-prepare ang AI check',
    modelDetails: 'Details para sa troubleshooting',
    modelNotReadyAtScan:
      'Hindi pa ready ang AI check, kaya rules lang ang ginamit dito. I-check ulit kapag ready na.',
    modelFailedAtScan:
      'Hindi tumakbo ang AI check, kaya rules lang ang ginamit dito. Pwede mong subukang i-prepare ulit.',
    modelSkippedAtScan:
      'Naka-pause ang AI check para makatipid ng data, kaya rules lang ang ginamit dito.',
    llmPaused: (size) =>
      `Optional: mag-add ng AI explanation sa bawat result (mga ${size} MB, one-time download, mas okay sa Wi-Fi).`,
    llmChecking: 'Tinitingnan kung supported ng device na ito ang AI explanation…',
    llmUnavailable:
      'Kailangan ng supported browser at graphics processor para sa AI explanation. Gumagana pa rin ang message check kahit wala ito.',
    llmDownloadAction: 'I-download ang AI explanation',
    llmDownloadTitle: 'Inihahanda ang AI explanation',
    llmProgress: (mb, total) =>
      `${mb} of about ${total} MB na ang na-download. Puwede ka pa ring mag-check habang nagloload.`,
    llmReady: 'Ready na ang AI explanation.',
    llmError: 'Hindi ma-load ang AI explanation. May advice pa rin sa bawat result.',
    llmRetry: 'I-try ulit ang AI explanation',
    llmWriting: 'Sinusulat ang maikling explanation sa device na ito…',
    llmExplanationTitle: 'AI explanation',
    llmDisclaimer: 'AI-written ito at puwedeng magkamali. Hindi nito mababago ang risk level.',
    llmModelRan: 'Tumakbo ang AI explanation model para sa check na ito.',
    llmModelNotRun: 'Hindi tumakbo ang AI explanation model para sa check na ito.',
    rulesTitle: 'Mga napansing detalye',
    noSignals: 'Walang partikular na warning signs sa nababasang text.',
    signalNote: 'Hindi proof ng scam ang isang word o link lang.',
    learnTitle: 'Paano gamitin ang Sane',
    learnDescription:
      'Sundin ang steps para i-check ang message at malaman ang susunod na gagawin.',
    learnLanguages: 'Pwedeng i-check ang messages na English, Filipino, o Taglish',
    guides: [
      {
        title: 'Add a message',
        body: 'I-paste o i-type ang message, o pumili ng screenshot para basahin ang text.',
      },
      {
        title: 'Review the text',
        body: 'I-check at i-edit kung kailangan ang text mula sa screenshot, saka piliin ang Analyze.',
      },
      {
        title: 'Read the result',
        body: 'Tingnan ang risk level, warning signs, at suggested next step.',
      },
      {
        title: 'Verify independently',
        body: 'Hindi ibig sabihin na safe ang message kapag walang warning signs. Mag-check sa official source.',
      },
    ],
    learnDisclaimerTitle: 'Check lang, hindi verdict',
    learnDisclaimer:
      'Puwedeng magkamali ang local baseline. Importante pa rin ang sariling verification.',
    learnAction: 'Mag-check ng message',
    assessment: {
      likely_scam: {
        label: 'Matinding babala',
        summary: 'May signs na puwedeng maglagay sa pera o account mo sa risk.',
        nextTitle: 'Mag-verify nang hiwalay',
        nextStep:
          'Huwag gamitin ang link sa message. Buksan ang official app o gumamit ng contact na trusted mo.',
      },
      suspicious: {
        label: 'Mag-ingat',
        summary: 'Hindi malinaw ang request. Hindi mako-confirm ang sender mula sa message lang.',
        nextTitle: 'Mag-verify nang hiwalay',
        nextStep: 'I-confirm gamit ang contact na trusted mo. Huwag umasa sa sender name lang.',
      },
      probably_fine: {
        label: 'Walang obvious na warning signs',
        summary:
          'Walang obvious na warning signs sa text. Hindi nito pinapatunayang legit ang sender.',
        nextTitle: 'Mag-verify pa rin',
        nextStep:
          'Kung unexpected ito, buksan mismo ang official app. Huwag i-share ang verification code.',
      },
      not_sure: {
        label: 'Hindi masuri',
        summary: 'Kulang ang nababasang info para ma-assess ang message na ito.',
        nextTitle: 'Check ang original',
        nextStep:
          'Basahin ang buong message o i-paste dito ang text. Mag-verify ng unexpected na request.',
      },
    },
  },
};

export function copyFor(lang: Lang): Copy {
  return COPY[lang];
}

export const VERDICT_LEVELS: readonly Level[] = [
  'likely_scam',
  'suspicious',
  'probably_fine',
  'not_sure',
];
