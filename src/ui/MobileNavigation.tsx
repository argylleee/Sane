import { History, Info, Scan } from 'lucide-react';
import type { copyFor } from './copy';

type Destination = 'scan' | 'learn' | 'history';
const ICONS = { scan: Scan, learn: Info, history: History } as const;

export function MobileNavigation({
  screen,
  onNavigate,
  copy,
  historyLabel,
}: {
  screen: string;
  onNavigate: (screen: Destination) => void;
  copy: ReturnType<typeof copyFor>;
  historyLabel: string;
}) {
  const labels: Record<Destination, string> = {
    scan: copy.navigationScan,
    learn: copy.navigationLearn,
    history: historyLabel,
  };
  return (
    <div
      className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-4 pt-2"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
    >
      <nav
        className="mx-auto flex w-full max-w-sm items-center justify-center gap-1 bg-highlight border border-border/80 p-1 rounded-full shadow-xs"
        aria-label={copy.mainNavigationLabel}
      >
        {(['learn', 'scan', 'history'] as const).map((destination) => {
          const isSelected =
            screen === destination || (destination === 'scan' && screen === 'result');
          const Icon = ICONS[destination];
          return (
            <button
              key={destination}
              type="button"
              aria-current={isSelected ? 'page' : undefined}
              onClick={() => onNavigate(destination)}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-xs font-semibold transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary ${isSelected ? 'bg-primary-tonal text-primary' : 'text-secondary hover:text-text hover:bg-neutral/40'}`}
            >
              <Icon size={20} strokeWidth={isSelected ? 2.5 : 2} aria-hidden="true" />
              <span>{labels[destination]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
