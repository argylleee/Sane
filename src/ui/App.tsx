import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  extractText,
  getEmbeddingsStatus,
  getLlmStatus,
  LLM_DOWNLOAD_MB,
  loadEmbeddings,
  loadLlm,
  refineCapabilities,
  shouldAutoPreload,
  startEmbeddingsPreload,
  startLlmPreload,
  subscribeEmbeddings,
  subscribeLlm,
} from '../ai';
import type { EmbeddingsStatus, LlmStatus, Tier } from '../ai';
import { addLlmExplanation, analyze } from '../pipeline/analyze';
import { explain, localizeSignals } from '../explain/templates';
import { browserStorage, createHistoryStore, maskPreview } from '../history/store';
import { normalize } from '../pipeline/normalize';
import { loadPrefs, savePrefs } from '../prefs';
import type { Prefs } from '../prefs';
import { watchRequests } from '../privacy/networkProof';
import type { RequestSummary } from '../privacy/networkProof';
import type { Level, Signal, Verdict } from '../types';
import { copyFor } from './copy';
import { extraCopyFor } from './copyExtra';
import { HistoryScreen } from './HistoryScreen';
import { ResultActions, WrongVerdictCard } from './ResultActions';
import {
  DetailsCard,
  HelpCard,
  PrivacyProofCard,
  RunCard,
  ScamTypeCard,
  WhyCard,
} from './ResultInsights';
import { ScamTypesList } from './ScamTypesList';
import { SettingsPanel } from './SettingsPanel';
import { Button } from '@heroui/react';
import { ModelDownloadProgress } from './ModelDownloadProgress';
import { ModelReadyNotification } from './ModelReadyNotification';
import { MobileNavigation } from './MobileNavigation';
import { HomeMascot } from './HomeMascot';
import { initButtonAnimations } from './buttonAnimations';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  TriangleAlert as Warning,
  CircleAlert as WarningCircle,
  ShieldCheck,
  Search as MagnifyingGlass,
  ChevronLeft as CaretLeft,
  Upload as UploadSimple,
  ClipboardPaste as ClipboardText,
  Scan,
  Info,
  Sun,
  Moon,
  CircleCheck,
  Download,
  RotateCcw,
  Languages,
  History as HistoryIcon,
} from 'lucide-react';

const MAX_MESSAGE_LENGTH = 2_000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const SECONDARY_ACTION_CLASS =
  'w-full flex items-center justify-center gap-2 py-3.5 bg-surface transition-all duration-150 rounded-xl font-bold text-sm text-text cursor-pointer';
type Screen = 'welcome' | 'scan' | 'result' | 'learn' | 'history';
type Theme = 'system' | 'light' | 'dark';

type OcrState = 'idle' | 'loading' | 'ready' | 'error';
type FeedbackKey =
  | 'clipboardUnavailable'
  | 'clipboardError'
  | 'screenshotTypeError'
  | 'screenshotLimitError'
  | 'analysisError'
  | 'sharedLimitError'
  | 'shareEmpty';

type SharedPayload = {
  text?: unknown;
  textTooLong?: unknown;
  image?: unknown;
  imageRejected?: unknown;
};

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

// Chrome can fire this before React mounts; catch it at module load so the Install button can use it.
let earlyInstallPrompt: InstallPromptEvent | null = null;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  earlyInstallPrompt = event as InstallPromptEvent;
});

function StatusMark({
  level,
  size = 24,
  className = '',
}: {
  level: Level;
  size?: number;
  className?: string;
}) {
  if (level === 'likely_scam')
    return <Warning size={size} strokeWidth={2.25} className={`text-high ${className}`} />;
  if (level === 'suspicious')
    return <WarningCircle size={size} strokeWidth={2.25} className={`text-caution ${className}`} />;
  if (level === 'probably_fine')
    return <ShieldCheck size={size} strokeWidth={2.25} className={`text-good ${className}`} />;
  return (
    <MagnifyingGlass size={size} strokeWidth={2.25} className={`text-secondary ${className}`} />
  );
}

function InertMessage({ text }: { text: string }) {
  const urlPattern = /(https?:\/\/[^\s<>]+|www\.[^\s<>]+)/gi;
  const parts = text.split(urlPattern);

  return (
    <>
      {parts.map((part, index) =>
        /^https?:\/\//i.test(part) || /^www\./i.test(part) ? (
          <code
            className="text-primary-ink font-semibold break-all"
            aria-label={part}
            key={`${part}-${index}`}
          >
            {part.replace(/^https:\/\//i, 'hxxps://').replace(/^http:\/\//i, 'hxxp://')}
          </code>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}

function HighlightedMessage({ text, signals }: { text: string; signals: Signal[] }) {
  const normalized = normalize(text);
  const spans = signals
    .flatMap((signal) => (signal.weight > 0 && signal.span ? [signal.span] : []))
    .map(([start, end]) => [Math.max(0, start), Math.min(normalized.length, end)] as const)
    .filter(([start, end]) => end > start)
    .sort(([left], [right]) => left - right);
  const merged: [number, number][] = [];

  for (const [start, end] of spans) {
    const previous = merged.at(-1);
    if (previous && start <= previous[1]) previous[1] = Math.max(previous[1], end);
    else merged.push([start, end]);
  }

  if (merged.length === 0) return <InertMessage text={normalized} />;

  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) {
      parts.push(<InertMessage key={`text-${cursor}`} text={normalized.slice(cursor, start)} />);
    }
    parts.push(
      <mark
        className="bg-caution-surface text-text rounded px-1 -mx-1"
        key={`signal-${start}-${end}`}
      >
        <InertMessage text={normalized.slice(start, end)} />
      </mark>,
    );
    cursor = end;
  }
  if (cursor < normalized.length) {
    parts.push(<InertMessage key={`text-${cursor}`} text={normalized.slice(cursor)} />);
  }
  return <>{parts}</>;
}

function ThemeToggle({
  theme,
  onChange,
  copy,
}: {
  theme: Theme;
  onChange: (theme: Theme) => void;
  copy: ReturnType<typeof copyFor>;
}) {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    onChange(isDark ? 'light' : 'dark');
  };

  return (
    <Button
      isIconOnly
      variant="ghost"
      size="sm"
      aria-label={isDark ? copy.themeLight : copy.themeDark}
      className="theme-toggle h-11 w-11 rounded-full bg-surface/80 border border-border hover:bg-neutral text-text transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
      onPress={toggleTheme}
    >
      <motion.div
        key={isDark ? 'dark' : 'light'}
        initial={{ rotate: -90, scale: 0.8, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center"
      >
        {isDark ? (
          <Sun
            size={20}
            strokeWidth={2.25}
            className="text-primary-ink hover:scale-110 transition-transform"
          />
        ) : (
          <Moon
            size={20}
            strokeWidth={2.25}
            className="text-secondary hover:text-text transition-colors"
          />
        )}
      </motion.div>
    </Button>
  );
}

/* A callout, not a card: tinted, outlined and icon-led so it never reads as another numbered step. */
function CheckNotice({
  copy,
  headingLevel = 2,
}: {
  copy: ReturnType<typeof copyFor>;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  return (
    <aside className="flex items-start gap-4 rounded-2xl border border-dashed border-primary/40 bg-primary-tonal/40 p-5 md:p-6 text-left">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary"
        aria-hidden="true"
      >
        <Info size={18} strokeWidth={2.5} />
      </span>
      <div className="space-y-1">
        <Heading className="text-base font-bold tracking-tight text-primary-ink">
          {copy.learnDisclaimerTitle}
        </Heading>
        <p className="text-sm text-text/80 leading-relaxed">{copy.learnDisclaimer}</p>
      </div>
    </aside>
  );
}

function MainNavigation({
  screen,
  onNavigate,
  labels,
  navigationLabel,
}: {
  screen: Screen;
  onNavigate: (screen: 'scan' | 'learn' | 'history') => void;
  labels: Record<'scan' | 'learn' | 'history', string>;
  navigationLabel: string;
}) {
  return (
    <nav
      className="clay-navigation inline-flex items-center bg-highlight border border-border/80 backdrop-blur-xl p-1 rounded-full shadow-xs"
      aria-label={navigationLabel}
    >
      {(['learn', 'scan', 'history'] as const).map((navScreen) => {
        const isSelected = screen === navScreen || (navScreen === 'scan' && screen === 'result');
        return (
          <button
            key={navScreen}
            type="button"
            aria-current={isSelected ? 'page' : undefined}
            onClick={() => onNavigate(navScreen)}
            className={`flex items-center justify-center gap-2 px-3 md:px-5 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isSelected
                ? 'bg-primary text-on-primary shadow-sm font-bold'
                : 'text-secondary hover:text-text hover:bg-neutral/40'
            }`}
          >
            {navScreen === 'scan' ? (
              <Scan size={18} strokeWidth={isSelected ? 2.5 : 2} />
            ) : navScreen === 'history' ? (
              <HistoryIcon size={18} strokeWidth={isSelected ? 2.5 : 2} />
            ) : (
              <Info size={18} strokeWidth={isSelected ? 2.5 : 2} />
            )}
            <span>{labels[navScreen]}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function App() {
  const reducedMotion = useReducedMotion();
  const [mascotAttention, setMascotAttention] = useState(false);
  const [screen, setScreen] = useState<Screen>('welcome');
  const mainContent = useRef<HTMLElement>(null);
  const focusedScreen = useRef<Screen>('welcome');
  function focusPage() {
    if (focusedScreen.current === screen) return;
    focusedScreen.current = screen;
    window.scrollTo({ top: 0, behavior: 'instant' });
    mainContent.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }
  const [theme, setTheme] = useState<Theme>('system');
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs(browserStorage()));
  const historyStore = useMemo(() => createHistoryStore(browserStorage()), []);
  const [proof, setProof] = useState<RequestSummary | null>(null);

  const [message, setMessage] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [ocrState, setOcrState] = useState<OcrState>('idle');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [resultMessage, setResultMessage] = useState('');
  const [resultIsImage, setResultIsImage] = useState(false);
  const [resultUsedOcr, setResultUsedOcr] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackKey | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  // True only when Sane is open as the installed app (no browser bar).
  const [isInstalled] = useState(
    () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  );
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const installPrompt = useRef<InstallPromptEvent | null>(null);
  const ocrRequestId = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const messageInput = useRef<HTMLTextAreaElement>(null);
  const [embeddingStatus, setEmbeddingStatus] = useState<EmbeddingsStatus>(getEmbeddingsStatus);
  const [modelAtScan, setModelAtScan] = useState<EmbeddingsStatus['state']>('idle');
  const [writerAtScan, setWriterAtScan] = useState<LlmStatus['state']>('idle');
  const [llmStatus, setLlmStatus] = useState<LlmStatus>(getLlmStatus);
  const [llmWriting, setLlmWriting] = useState(false);
  const [llmTier, setLlmTier] = useState<Tier | null>(null);
  const downloadLlm = () => {
    if (llmTier === null || llmTier === 'C') return;
    void loadLlm(llmTier).catch(() => undefined);
  };
  const lang = prefs.lang;
  const copy = copyFor(lang);
  const extra = extraCopyFor(lang);
  // The result is re-written in the chosen language, so changing language updates it in place.
  const shown = useMemo<Verdict | null>(
    () =>
      verdict && {
        ...verdict,
        lang,
        signals: localizeSignals(verdict.signals, lang),
        explanation: {
          ...verdict.explanation,
          ...explain(verdict.level, lang, verdict.signals),
        },
      },
    [verdict, lang],
  );
  // Calming cues (weight 0) are listed in the "Why this result" card, never as warnings.
  const redFlags = shown?.signals.filter(({ weight }) => weight > 0) ?? [];

  const overLimit = message.length > MAX_MESSAGE_LENGTH;
  // Optional explanation model: downloaded only on request, then loads from cache.
  const showLlmOffer =
    llmTier !== null &&
    llmTier !== 'C' &&
    llmStatus.state === 'idle' &&
    embeddingStatus.state !== 'loading';
  const isAppleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const showIosInstallHint = isAppleMobile && !isInstalled;

  useEffect(() => {
    let active = true;
    void refineCapabilities()
      .then(({ tier }) => {
        if (active) setLlmTier(tier);
      })
      .catch(() => {
        if (active) setLlmTier('C');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // The explanation model follows the embedding model so the two downloads do not compete.
    void (startEmbeddingsPreload() ?? Promise.resolve()).finally(() => void startLlmPreload());
    return initButtonAnimations();
  }, []);

  useEffect(() => subscribeEmbeddings(setEmbeddingStatus), []);
  useEffect(() => subscribeLlm(setLlmStatus), []);

  const clearScreenshot = useCallback(() => {
    ocrRequestId.current += 1;
    setImage(null);
    setOcrState('idle');
  }, []);

  const selectScreenshot = useCallback(
    (file: File | undefined) => {
      setFeedback(null);
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        clearScreenshot();
        setFeedback('screenshotTypeError');
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        clearScreenshot();
        setFeedback('screenshotLimitError');
        return;
      }
      setImage(file);
      setMessage('');
      setScreen('scan');
      setOcrState('loading');
      const requestId = ++ocrRequestId.current;
      void extractText(file)
        .then((text) => {
          if (requestId !== ocrRequestId.current) return;
          setMessage(text);
          setOcrState('ready');
        })
        .catch(() => {
          if (requestId !== ocrRequestId.current) return;
          setOcrState('error');
        });
    },
    [clearScreenshot],
  );

  useEffect(() => {
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      installPrompt.current = event as InstallPromptEvent;
      setShowInstallHelp(false);
    };
    // Android can report "installed" while the Play Store still holds the install, so the button and
    // its hint stay in the browser; only the installed app itself hides them.
    const onInstalled = () => {
      installPrompt.current = null;
    };
    const onConnectionChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('beforeinstallprompt', onInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('online', onConnectionChange);
    window.addEventListener('offline', onConnectionChange);
    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('online', onConnectionChange);
      window.removeEventListener('offline', onConnectionChange);
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const appRoot = new URL('./', document.baseURI);
    const onWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'shared') return;

      const payload = event.data.payload as SharedPayload | null;
      setScreen('scan');
      setFeedback(null);
      if (!payload) {
        setFeedback('shareEmpty');
        return;
      }

      const hasText = typeof payload.text === 'string' && payload.text.length > 0;
      const hasImage = payload.image instanceof File;
      if (!hasText && !hasImage && payload.imageRejected !== true) {
        setFeedback('shareEmpty');
        return;
      }

      if (
        payload.textTooLong === true ||
        (typeof payload.text === 'string' && payload.text.length > MAX_MESSAGE_LENGTH)
      ) {
        setMessage('');
        setFeedback('sharedLimitError');
      } else if (typeof payload.text === 'string') {
        clearScreenshot();
        setMessage(payload.text);
      }

      if (payload.image instanceof File) {
        selectScreenshot(payload.image);
      } else if (payload.imageRejected === true) {
        setFeedback('screenshotLimitError');
      }
    };

    navigator.serviceWorker.addEventListener('message', onWorkerMessage);
    void navigator.serviceWorker
      .register(new URL('sw.js', appRoot), { scope: appRoot.pathname, updateViaCache: 'none' })
      .then(async (registration) => {
        const ready = await navigator.serviceWorker.ready;
        const worker = registration.active ?? ready.active;
        if (!worker) return;
        const resources = performance
          .getEntriesByType('resource')
          .map((entry) => entry.name)
          .filter((name) => {
            try {
              return new URL(name).origin === appRoot.origin;
            } catch {
              return false;
            }
          });
        worker.postMessage({ type: 'cache-shell', resources });

        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.has('shared')) {
          window.history.replaceState({}, '', appRoot.pathname);
          worker.postMessage({ type: 'get-shared' });
        }
      })
      .catch((error: unknown) => console.error('Service worker registration failed', error));

    return () => navigator.serviceWorker.removeEventListener('message', onWorkerMessage);
  }, [clearScreenshot, selectScreenshot]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [screen]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang === 'fil' ? 'fil' : 'en';
    root.dataset.family = String(prefs.family);
    root.dataset.contrast = prefs.highContrast ? 'high' : 'normal';
    savePrefs(browserStorage(), prefs);
  }, [lang, prefs]);

  useEffect(() => {
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const resolved = theme === 'system' ? (colorScheme.matches ? 'dark' : 'light') : theme;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    };

    applyTheme();
    if (theme !== 'system') return;

    colorScheme.addEventListener('change', applyTheme);
    return () => colorScheme.removeEventListener('change', applyTheme);
  }, [theme]);

  async function pasteFromClipboard() {
    setFeedback(null);
    if (!navigator.clipboard?.readText) {
      setFeedback('clipboardUnavailable');
      return;
    }

    try {
      const clipboardText = await navigator.clipboard.readText();
      clearScreenshot();
      setMessage(clipboardText);
    } catch {
      setFeedback('clipboardError');
    }
  }

  async function runAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      isAnalyzing ||
      ocrState === 'loading' ||
      (!image && !message.trim()) ||
      (!message.trim() && !image) ||
      overLimit
    )
      return;

    setFeedback(null);
    setIsAnalyzing(true);
    const stopWatching = watchRequests();
    const sourceImage = image && !message.trim() ? image : null;
    const sourceMessage = message;
    const modelStateAtScan = getEmbeddingsStatus().state;
    const writerStateAtScan = getLlmStatus().state;

    try {
      const result = await analyze(sourceImage ? { image: sourceImage } : { text: sourceMessage }, {
        lang,
        useLLM: false,
      });
      setProof(stopWatching());
      setVerdict(result);
      // Saved only when the reader turned history on; the store keeps a masked preview.
      historyStore.add({
        level: result.level,
        score: result.score,
        lang,
        source: sourceImage ? 'image' : 'text',
        preview: sourceImage ? '' : maskPreview(sourceMessage),
        signalIds: result.signals.filter(({ weight }) => weight > 0).map(({ id }) => id),
        archetypeId: result.archetypeId,
      });
      if (getLlmStatus().state === 'ready' && sourceMessage.trim()) {
        // Show the verdict now; the on-device explanation fills in when it is written.
        setLlmWriting(true);
        void addLlmExplanation(result, normalize(sourceMessage))
          .then((explained) => setVerdict((current) => (current === result ? explained : current)))
          .finally(() => setLlmWriting(false));
      }
      setModelAtScan(modelStateAtScan);
      setWriterAtScan(writerStateAtScan);
      setResultMessage(sourceMessage);
      setResultIsImage(Boolean(image));
      setResultUsedOcr(Boolean(image && sourceMessage.trim() && ocrState === 'ready'));
      setScreen('result');
    } catch {
      setFeedback('analysisError');
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function promptInstall() {
    const prompt = installPrompt.current ?? earlyInstallPrompt;
    if (!prompt) {
      // No browser prompt (iOS, already dismissed, or not offered yet): explain the manual route.
      setShowInstallHelp(true);
      return;
    }
    // A prompt can be shown only once; clear it before awaiting so a second tap shows the help.
    installPrompt.current = null;
    earlyInstallPrompt = null;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome !== 'accepted') setShowInstallHelp(true);
  }

  function startAnotherCheck() {
    setMessage('');
    clearScreenshot();
    setVerdict(null);
    setProof(null);
    setResultMessage('');
    setResultIsImage(false);
    setResultUsedOcr(false);
    setFeedback(null);
    setScreen('scan');
    window.requestAnimationFrame(() => messageInput.current?.focus());
  }

  const feedbackText = feedback ? copy[feedback] : null;

  return (
    <div
      className={`min-h-[100dvh] flex flex-col selection:bg-primary selection:text-on-primary ${screen === 'welcome' ? 'home-shell' : ''}`}
    >
      <a href="#main-content" className="skip-link">
        {copy.skipToContent}
      </a>
      <ModelReadyNotification state={embeddingStatus.state} copy={copy} />
      <header
        className={`sticky top-0 z-50 flex h-16 items-center px-4 md:px-8 gap-2 md:gap-4 bg-background/90 backdrop-blur-md border-b border-border transition-colors ${screen === 'result' ? 'bg-surface/90' : ''}`}
      >
        {screen === 'result' ? (
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface border border-transparent hover:bg-highlight active:scale-[0.98] transition-all text-text cursor-pointer"
            aria-label={copy.backToScan}
            onPress={() => setScreen('scan')}
          >
            <CaretLeft size={20} strokeWidth={2.25} />
          </Button>
        ) : null}
        <button
          className="brand-action flex items-center shrink-0 hover:opacity-85 transition-opacity cursor-pointer"
          type="button"
          aria-label={copy.homeLabel}
          onClick={() => setScreen('welcome')}
        >
          <img
            src={`${import.meta.env.BASE_URL}icons/sane-logo.png`}
            alt="Sane"
            className="h-8 sm:h-9 w-auto object-contain"
          />
        </button>
        <div className="flex-1 flex justify-center hidden sm:flex">
          <MainNavigation
            navigationLabel={copy.mainNavigationLabel}
            screen={screen}
            onNavigate={setScreen}
            labels={{
              scan: copy.navigationScan,
              learn: copy.navigationLearn,
              history: extra.navigationHistory,
            }}
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <ThemeToggle theme={theme} onChange={setTheme} copy={copy} />
        </div>
      </header>

      <main
        id="main-content"
        ref={mainContent}
        tabIndex={-1}
        className={`flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-16 flex flex-col relative ${screen === 'welcome' ? 'home-main' : ''}`}
      >
        <AnimatePresence mode="wait">
          {screen === 'welcome' && (
            <motion.section
              key="welcome"
              onAnimationComplete={focusPage}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
              className="home-hero"
              aria-labelledby="welcome-title"
            >
              <div className="home-copy">
                <div className="space-y-4">
                  <motion.h1
                    id="welcome-title"
                    tabIndex={-1}
                    className="home-headline text-text mx-auto lg:mx-0"
                    lang="fil"
                    initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {copy.welcomeTitle.split('? ').map((line, index) => (
                      <span className="block whitespace-nowrap" key={line}>
                        {line}
                        {index === 0 ? '? ' : ''}
                      </span>
                    ))}
                  </motion.h1>
                  <motion.p
                    className="home-description text-secondary"
                    initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.38,
                      delay: reducedMotion ? 0 : 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    {copy.welcomeDescription}
                  </motion.p>
                </div>

                <div className="home-actions">
                  <motion.div
                    initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.38,
                      delay: reducedMotion ? 0 : 0.16,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <Button
                      size="lg"
                      variant="primary"
                      className="home-start px-8 py-4 bg-primary text-on-primary rounded-full font-semibold text-lg hover:opacity-95 active:scale-95 transition-all duration-150 shadow-lg shadow-primary/20 cursor-pointer"
                      onPress={() => setScreen('scan')}
                      onPointerEnter={(event) => {
                        if (event.pointerType !== 'touch') setMascotAttention(true);
                      }}
                      onPointerLeave={() => setMascotAttention(false)}
                      onFocus={() => setMascotAttention(true)}
                      onBlur={() => setMascotAttention(false)}
                    >
                      {copy.start}
                    </Button>
                  </motion.div>
                </div>
              </div>

              <HomeMascot attention={mascotAttention} />
            </motion.section>
          )}

          {screen === 'scan' && (
            <motion.div
              key="scan"
              onAnimationComplete={focusPage}
              initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
              className="grid lg:grid-cols-[1fr_360px] gap-12 lg:gap-24"
            >
              <div className="space-y-8">
                <div className="space-y-3">
                  <h1 id="page-title" tabIndex={-1} className="page-heading">
                    {copy.scanTitle}
                  </h1>
                  <p className="text-lg text-secondary max-w-[45ch]">{copy.scanDescription}</p>
                </div>

                <form className="space-y-6" onSubmit={runAnalysis}>
                  {image && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="clay-panel rounded-2xl p-4 flex items-center justify-between gap-4"
                      aria-live="polite"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-12 w-12 rounded-lg bg-neutral flex items-center justify-center shrink-0">
                          <UploadSimple size={24} className="text-secondary" />
                        </div>
                        <p className="text-sm font-medium truncate text-text">
                          {copy.screenshotSelected(image.name)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm font-bold text-primary-ink hover:text-text transition-colors px-3 py-1.5 rounded-full hover:bg-neutral shrink-0 cursor-pointer"
                        onPress={clearScreenshot}
                      >
                        {copy.useText}
                      </Button>
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <label
                      className="text-sm font-bold text-text tracking-tight flex"
                      htmlFor="message-input"
                    >
                      {image ? copy.extractedMessageLabel : copy.messageLabel}
                    </label>
                    <div className="relative">
                      <textarea
                        ref={messageInput}
                        id="message-input"
                        rows={6}
                        value={message}
                        placeholder={copy.messagePlaceholder}
                        aria-describedby={
                          overLimit ? 'message-count message-limit-error' : 'message-count'
                        }
                        aria-invalid={overLimit}
                        disabled={ocrState === 'loading'}
                        onChange={(event) => {
                          setMessage(event.currentTarget.value);
                          setFeedback(null);
                        }}
                        className="w-full clay-inset p-5 pb-10 text-base text-text placeholder:text-secondary focus:outline-none focus:ring-0 transition-all resize-y min-h-[180px]"
                      />
                      <div
                        id="message-count"
                        className={`absolute bottom-4 right-4 text-xs font-mono font-medium ${overLimit ? 'text-high' : 'text-secondary/60'}`}
                        aria-live="polite"
                      >
                        {copy.characterCount(message.length, MAX_MESSAGE_LENGTH)}
                      </div>
                    </div>
                    {overLimit && (
                      <p
                        id="message-limit-error"
                        role="alert"
                        className="text-sm text-high font-medium flex items-center gap-1.5 mt-2"
                      >
                        <WarningCircle size={16} />
                        {copy.overLimit}
                      </p>
                    )}
                    {showLlmOffer && (
                      <p className="text-xs text-secondary">{copy.llmPaused(LLM_DOWNLOAD_MB)}</p>
                    )}
                  </div>

                  <div
                    className="space-y-2 text-sm text-secondary"
                    role="status"
                    aria-live="polite"
                  >
                    {embeddingStatus.state === 'loading' && (
                      <ModelDownloadProgress progress={embeddingStatus.progress} copy={copy} />
                    )}
                    {embeddingStatus.state === 'idle' && !shouldAutoPreload() && (
                      <>
                        <p>{copy.modelPausedStatus}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="md"
                          fullWidth
                          className={SECONDARY_ACTION_CLASS}
                          onPress={() => void loadEmbeddings().catch(() => undefined)}
                        >
                          <Download size={18} /> {copy.modelPrepare}
                        </Button>
                      </>
                    )}
                    {embeddingStatus.state === 'error' && (
                      <>
                        <p>{copy.modelFailedStatus}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="md"
                          fullWidth
                          className={SECONDARY_ACTION_CLASS}
                          onPress={() => void loadEmbeddings().catch(() => undefined)}
                        >
                          <RotateCcw size={18} /> {copy.modelRetry}
                        </Button>
                        {embeddingStatus.message && (
                          <details>
                            <summary>{copy.modelDetails}</summary>
                            <p>{embeddingStatus.message}</p>
                          </details>
                        )}
                      </>
                    )}
                    {llmTier === null && <p role="status">{copy.llmChecking}</p>}
                    {llmTier === 'C' && <p>{copy.llmUnavailable}</p>}
                    {showLlmOffer && (
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        fullWidth
                        className={SECONDARY_ACTION_CLASS}
                        onPress={downloadLlm}
                      >
                        <Download size={18} aria-hidden="true" /> {copy.llmDownloadAction}
                      </Button>
                    )}
                    {llmStatus.state === 'loading' && (
                      <ModelDownloadProgress
                        id="llm-download"
                        progress={llmStatus.progress}
                        title={copy.llmDownloadTitle}
                        note={copy.llmProgress(llmStatus.downloadedMb ?? 0, LLM_DOWNLOAD_MB)}
                        copy={copy}
                      />
                    )}
                    {llmStatus.state === 'ready' && <p>{copy.llmReady}</p>}
                    {llmStatus.state === 'error' && llmTier !== null && llmTier !== 'C' && (
                      <>
                        <p>{copy.llmError}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="md"
                          fullWidth
                          className={SECONDARY_ACTION_CLASS}
                          onPress={downloadLlm}
                        >
                          <RotateCcw size={18} aria-hidden="true" /> {copy.llmRetry}
                        </Button>
                        {llmStatus.message && (
                          <details>
                            <summary>{copy.modelDetails}</summary>
                            <p>{llmStatus.message}</p>
                          </details>
                        )}
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      size="md"
                      fullWidth
                      className={SECONDARY_ACTION_CLASS}
                      onPress={pasteFromClipboard}
                    >
                      <ClipboardText size={18} /> {copy.paste}
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      fullWidth
                      className={SECONDARY_ACTION_CLASS}
                      onPress={() => fileInput.current?.click()}
                    >
                      <UploadSimple size={18} /> {copy.upload}
                    </Button>
                    <input
                      ref={fileInput}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(event) => {
                        selectScreenshot(event.currentTarget.files?.[0]);
                        event.currentTarget.value = '';
                      }}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="w-full py-4.5 bg-primary text-on-primary rounded-xl font-bold text-lg hover:opacity-95 active:scale-[0.97] transition-all duration-150 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:bg-surface/60 disabled:border disabled:border-border disabled:text-secondary/50 disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100"
                    isDisabled={
                      isAnalyzing ||
                      ocrState === 'loading' ||
                      (!image && !message.trim()) ||
                      overLimit
                    }
                  >
                    {isAnalyzing ? (
                      <>
                        <motion.div
                          animate={reducedMotion ? undefined : { rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        >
                          <MagnifyingGlass size={20} />
                        </motion.div>{' '}
                        {copy.checking}
                      </>
                    ) : (
                      <>
                        <MagnifyingGlass size={20} /> {copy.analyze}
                      </>
                    )}
                  </Button>

                  <div className="space-y-2 mt-4">
                    {feedbackText && (
                      <p
                        className="text-sm text-high font-medium flex items-center gap-1.5"
                        role="alert"
                      >
                        <WarningCircle size={16} />
                        {feedbackText}
                      </p>
                    )}
                    {ocrState === 'loading' && (
                      <p className="text-sm text-secondary font-medium" role="status">
                        {copy.screenshotLoading}
                      </p>
                    )}
                    {ocrState === 'ready' && (
                      <p className="text-sm text-good font-medium flex items-center gap-1.5">
                        <ShieldCheck size={16} />
                        {copy.screenshotReady}
                      </p>
                    )}
                    {ocrState === 'error' && (
                      <p
                        className="text-sm text-high font-medium flex items-center gap-1.5"
                        role="status"
                      >
                        <WarningCircle size={16} />
                        {copy.screenshotFailed}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-secondary italic text-center mt-6">
                    {copy.pasteOnlyNotice}
                  </p>
                </form>
              </div>

              <aside className="space-y-6 lg:pt-16">
                <div className="clay-panel rounded-2xl p-6">
                  <h2 className="text-base font-bold text-text tracking-tight mb-2 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-good" /> {copy.readyTitle}
                  </h2>
                  <p className="text-sm text-secondary leading-relaxed">{copy.readyDescription}</p>
                  {embeddingStatus.state === 'ready' && (
                    <p className="display-text mt-3 flex items-center gap-2 text-base text-text">
                      <CircleCheck size={18} className="text-good" />
                      {copy.modelReadyStatus}
                    </p>
                  )}
                </div>
                <section className="px-2">
                  <h2 className="text-base font-bold text-text mb-4">{copy.howTitle}</h2>
                  <ol className="space-y-4">
                    {copy.howSteps.map((step, i) => (
                      <li key={step} className="flex gap-4 text-sm text-text leading-relaxed">
                        <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary-tonal text-primary-ink font-bold text-xs">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </section>
                {showIosInstallHint && (
                  <p className="text-xs text-secondary px-2">{copy.iosInstallHint}</p>
                )}
              </aside>
            </motion.div>
          )}

          {screen === 'result' && verdict && shown && (
            <motion.div
              key="result"
              onAnimationComplete={focusPage}
              initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
              className="max-w-4xl mx-auto w-full space-y-8"
            >
              <div className="text-center space-y-3 mb-8">
                <h1 id="page-title" tabIndex={-1} className="page-heading mx-auto">
                  {copy.resultTitle}
                </h1>
                <p className="text-lg text-secondary">{copy.resultSubtitle}</p>
              </div>

              <div className="grid md:grid-cols-[2fr_1fr] gap-6" aria-live="polite">
                <div className="space-y-6">
                  {/* Verdict Badge */}
                  <div
                    className={`p-6 rounded-2xl flex items-center gap-4 ${verdict.level === 'likely_scam' ? 'bg-high-surface text-high' : verdict.level === 'suspicious' ? 'bg-caution-surface text-caution' : verdict.level === 'probably_fine' ? 'bg-good-surface text-good' : 'bg-surface text-secondary'}`}
                    role="status"
                  >
                    <StatusMark level={verdict.level} size={32} />
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">
                        {copy.assessment[verdict.level].label}
                      </h2>
                      <p className="text-sm opacity-90 mt-1">
                        {resultUsedOcr
                          ? copy.coverageOcr
                          : resultIsImage
                            ? copy.coverageImage
                            : copy.coverageText}
                      </p>
                    </div>
                  </div>

                  {/* Summary & Next Step */}
                  <div className="clay-panel rounded-2xl p-6 space-y-6">
                    <p className="text-lg leading-relaxed text-text font-medium">
                      {copy.assessment[verdict.level].summary}
                    </p>

                    <div
                      className={`p-5 rounded-xl border ${verdict.level === 'likely_scam' ? 'bg-high-surface/50 border-high/20' : verdict.level === 'suspicious' ? 'bg-caution-surface/50 border-caution/20' : 'bg-neutral border-border'}`}
                    >
                      <h3 className="font-bold text-text flex items-center gap-2 mb-2">
                        <StatusMark level="suspicious" size={18} />
                        {copy.nextPrefix}: {copy.assessment[verdict.level].nextTitle}
                      </h3>
                      <p className="text-sm text-text/80 leading-relaxed">
                        {copy.assessment[verdict.level].nextStep}
                      </p>
                      {(verdict.level === 'likely_scam' || verdict.level === 'suspicious') &&
                        shown.explanation.steps.length > 0 && (
                          <ul className="mt-3 space-y-2 list-disc pl-5 text-sm text-text/90 leading-relaxed">
                            {shown.explanation.steps.map((step) => (
                              <li key={step}>{step}</li>
                            ))}
                          </ul>
                        )}
                    </div>
                  </div>

                  {/* LLM Explanation */}
                  {llmWriting && !verdict.explanation.extra && (
                    <p className="clay-panel rounded-2xl p-6 text-sm text-secondary" role="status">
                      {copy.llmWriting}
                    </p>
                  )}
                  {verdict.explanation.extra && (
                    <div className="clay-panel rounded-2xl p-6 space-y-3">
                      <h3 className="font-bold text-text">{copy.llmExplanationTitle}</h3>
                      <p className="text-sm text-text whitespace-pre-wrap leading-relaxed">
                        {verdict.explanation.extra}
                      </p>
                      <p className="text-xs text-secondary italic mt-4">{copy.llmDisclaimer}</p>
                    </div>
                  )}

                  {/* Evidence / Signals. For "No obvious warning signs" with nothing found, the
                    summary and the "Why this result" card already say so; skip the empty card. */}
                  {(verdict.level !== 'probably_fine' || redFlags.length > 0) && (
                    <div className="clay-panel rounded-2xl p-6 space-y-4">
                      <h3 className="font-bold text-text">{copy.rulesTitle}</h3>
                      {redFlags.length > 0 ? (
                        <ul className="space-y-3">
                          {redFlags.map((signal, index) => (
                            <li
                              key={`${signal.id}-${index}`}
                              className="flex gap-3 text-sm text-text leading-relaxed bg-surface border border-border p-3 rounded-lg"
                            >
                              <WarningCircle size={18} className="shrink-0 text-caution mt-0.5" />
                              {signal.label}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-secondary bg-neutral p-4 rounded-lg">
                          {copy.noSignals}
                        </p>
                      )}
                      <p className="text-xs text-secondary italic mt-2">{copy.signalNote}</p>
                    </div>
                  )}

                  <DetailsCard verdict={shown} lang={lang} />
                  <ScamTypeCard verdict={shown} lang={lang} />
                  {verdict.level !== 'probably_fine' && <HelpCard verdict={shown} lang={lang} />}
                  {prefs.family ? (
                    <details className="clay-panel rounded-2xl p-4">
                      <summary className="display-text min-h-11 cursor-pointer py-2 text-text">
                        {extra.moreDetails}
                      </summary>
                      <div className="space-y-6 pt-4">
                        <WhyCard
                          verdict={shown}
                          lang={lang}
                          writing={llmWriting && !verdict.explanation.extra}
                        />
                        <PrivacyProofCard proof={proof} lang={lang} />
                      </div>
                    </details>
                  ) : (
                    <>
                      <WhyCard
                        verdict={shown}
                        lang={lang}
                        writing={llmWriting && !verdict.explanation.extra}
                      />
                      <PrivacyProofCard proof={proof} lang={lang} />
                    </>
                  )}

                  <CheckNotice copy={copy} headingLevel={3} />
                  {resultIsImage && !resultMessage && (
                    <p
                      className="text-sm text-high font-medium flex items-center gap-1.5"
                      role="status"
                    >
                      <WarningCircle size={16} />
                      {copy.screenshotFailed}
                    </p>
                  )}
                </div>

                <aside className="space-y-6">
                  {/* Original Message */}
                  <div className="clay-panel rounded-2xl p-6 space-y-4">
                    <h3 className="font-bold text-text">{copy.originalTitle}</h3>
                    <div className="message-scroll bg-surface border border-border rounded-xl p-4 text-sm text-text/90 leading-relaxed font-mono whitespace-pre-wrap max-h-64 overflow-y-auto shadow-inner">
                      {resultMessage ? (
                        <HighlightedMessage text={resultMessage} signals={verdict.signals} />
                      ) : (
                        copy.imageOriginal
                      )}
                    </div>
                    <p className="text-xs text-secondary italic">{copy.originalNote}</p>
                  </div>

                  {/* What ran on this device, part by part */}
                  <RunCard
                    lang={lang}
                    input={{
                      usedModels: verdict.usedModels,
                      screenshotRead: resultUsedOcr,
                      meaningAtScan: modelAtScan,
                      autoPreload: shouldAutoPreload(),
                      writerAtScan,
                      writerWriting: llmWriting && !verdict.explanation.extra,
                    }}
                  />

                  <ResultActions verdict={shown} message={resultMessage} lang={lang} />
                  <WrongVerdictCard
                    verdict={shown}
                    message={resultMessage}
                    lang={lang}
                    store={historyStore}
                  />

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold text-base hover:opacity-95 active:scale-95 transition-all duration-150 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
                    onPress={startAnotherCheck}
                  >
                    {copy.another}
                  </Button>
                </aside>
              </div>
            </motion.div>
          )}

          {screen === 'learn' && (
            <motion.div
              key="learn"
              onAnimationComplete={focusPage}
              initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
              className="max-w-3xl mx-auto w-full space-y-12"
            >
              <div className="text-center space-y-4 mb-12">
                <h1 id="page-title" tabIndex={-1} className="page-heading mx-auto">
                  {copy.learnTitle}
                </h1>
                <p className="text-lg text-secondary max-w-[50ch] mx-auto">
                  {copy.learnDescription}
                </p>
                <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-semibold text-text">
                  <Languages
                    size={16}
                    strokeWidth={2.25}
                    className="text-primary-ink"
                    aria-hidden="true"
                  />
                  {copy.learnLanguages}
                </p>
              </div>

              <div className="grid gap-6">
                {copy.guides.map((guide, index) => (
                  <div className="clay-panel rounded-2xl p-6 md:p-8 space-y-3" key={guide.title}>
                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-3">
                      <span
                        className="h-8 w-8 rounded-full bg-primary-tonal text-primary-ink flex items-center justify-center shrink-0 text-base"
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      {guide.title}
                    </h2>
                    <p className="text-text/80 leading-relaxed pl-11">{guide.body}</p>
                  </div>
                ))}
              </div>

              <ScamTypesList lang={lang} />

              <SettingsPanel prefs={prefs} onChange={setPrefs} />

              <CheckNotice copy={copy} />

              <div className="flex flex-col items-center gap-3 pt-8">
                <div className="flex w-full flex-col sm:flex-row sm:justify-center gap-3">
                  <Button
                    size="lg"
                    variant="primary"
                    className="w-full sm:w-auto px-8 py-4 bg-primary text-on-primary rounded-full font-bold text-lg hover:opacity-95 active:scale-95 transition-all duration-150 shadow-lg shadow-primary/20 cursor-pointer"
                    onPress={() => setScreen('scan')}
                  >
                    {copy.learnAction}
                  </Button>
                  {!isInstalled && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto px-8 py-4 bg-surface text-primary-ink rounded-full font-bold text-lg active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                      onPress={promptInstall}
                    >
                      <Download size={20} /> {copy.installApp}
                    </Button>
                  )}
                </div>
                {!isInstalled && (!isOnline || showInstallHelp) && (
                  <p className="text-xs text-secondary text-center max-w-[45ch]" role="status">
                    {!isOnline
                      ? copy.installOffline
                      : isAppleMobile
                        ? copy.iosInstallHint
                        : copy.installManual}
                  </p>
                )}
                {!isInstalled && (
                  <p className="text-xs text-secondary text-center max-w-[45ch]">
                    {copy.installPending}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {screen === 'history' && (
            <motion.div
              key="history"
              onAnimationComplete={focusPage}
              initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
            >
              <HistoryScreen store={historyStore} lang={lang} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <MobileNavigation
        screen={screen}
        onNavigate={setScreen}
        copy={copy}
        historyLabel={extra.navigationHistory}
      />
      <footer className="site-footer w-full mt-auto">
        <div className="footer-inner mx-auto max-w-6xl px-4 sm:px-6 md:px-8 text-secondary">
          <div className="footer-brand">
            <button
              type="button"
              onClick={() => setScreen('welcome')}
              className="brand-action flex items-center hover:opacity-85 transition-opacity cursor-pointer"
              aria-label={copy.homeLabel}
            >
              <img src={`${import.meta.env.BASE_URL}icons/sane-logo.png`} alt="Sane" />
            </button>
            <p>{copy.footerSlogan}</p>
          </div>
          <div className="footer-credit">
            <p>
              {copy.footerDevelopedBy} <span className="footer-team">What if I Call</span>
            </p>
            <span className="footer-separator" aria-hidden="true">
              &middot;
            </span>
            <p>&copy; {new Date().getFullYear()} Sane</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
