// OWNER: frontend. Tells an open or installed Sane that a new deployment has downloaded, and swaps
// to it only when the reader agrees, so a check in progress is never interrupted.
import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { browserStorage } from '../history/store';
import { loadPrefs } from '../prefs';
import { copyFor } from './copy';

const CHECK_EVERY_MS = 30 * 60 * 1000;

export function UpdatePrompt() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [applying, setApplying] = useState(false);
  const userAsked = useRef(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const sw = navigator.serviceWorker;
    let registration: ServiceWorkerRegistration | undefined;

    // A new version counts once it has finished downloading while an older one runs this page.
    const watch = (worker: ServiceWorker | null) => {
      if (!worker) return;
      const check = () => {
        if (worker.state === 'installed' && sw.controller) setWaiting(worker);
      };
      check();
      worker.addEventListener('statechange', check);
    };
    const checkForUpdate = () => {
      if (navigator.onLine && document.visibilityState === 'visible') {
        void registration?.update().catch(() => undefined);
      }
    };
    // Reload only after the reader chose to update; the first install also changes the controller.
    const onControllerChange = () => {
      if (userAsked.current) window.location.reload();
    };

    void sw.ready.then((ready) => {
      registration = ready;
      watch(ready.waiting);
      ready.addEventListener('updatefound', () => watch(ready.installing));
      checkForUpdate();
    });
    sw.addEventListener('controllerchange', onControllerChange);
    document.addEventListener('visibilitychange', checkForUpdate);
    window.addEventListener('online', checkForUpdate);
    const timer = window.setInterval(checkForUpdate, CHECK_EVERY_MS);
    return () => {
      sw.removeEventListener('controllerchange', onControllerChange);
      document.removeEventListener('visibilitychange', checkForUpdate);
      window.removeEventListener('online', checkForUpdate);
      window.clearInterval(timer);
    };
  }, []);

  if (!waiting || dismissed) return null;
  const copy = copyFor(loadPrefs(browserStorage()).lang);

  function applyUpdate() {
    if (!waiting) return;
    userAsked.current = true;
    setApplying(true);
    waiting.postMessage({ type: 'skip-waiting' });
  }

  return (
    <section
      className="update-prompt clay-panel fixed inset-x-4 z-[60] space-y-3 rounded-2xl p-4 sm:inset-x-auto sm:right-6 sm:w-96"
      role="status"
      aria-live="polite"
      aria-labelledby="update-title"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-tonal text-primary"
          aria-hidden="true"
        >
          <RefreshCw size={18} strokeWidth={2.5} />
        </span>
        <div className="space-y-1">
          <h2 id="update-title" className="text-base text-text">
            {copy.updateTitle}
          </h2>
          <p className="text-sm text-secondary">{copy.updateNote}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="min-h-11 rounded-xl bg-surface px-4 text-sm font-bold text-text cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => setDismissed(true)}
          disabled={applying}
        >
          {copy.updateLater}
        </button>
        <button
          type="button"
          className="min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={applyUpdate}
          disabled={applying}
        >
          {applying ? copy.updateApplying : copy.updateAction}
        </button>
      </div>
    </section>
  );
}
