import { Info, Scan } from 'lucide-react';
import type { copyFor } from './copy';

export function MobileNavigation({
  screen,
  onNavigate,
  copy,
}: {
  screen: string;
  onNavigate: (screen: 'scan' | 'learn') => void;
  copy: ReturnType<typeof copyFor>;
}) {
  return (
    <div
      className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-4 pt-2"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
    >
      <nav
        className="mx-auto flex w-full max-w-sm items-center justify-center gap-1 bg-highlight border border-border/80 p-1 rounded-full shadow-xs"
        aria-label={copy.mainNavigationLabel}
      >
        {(['scan', 'learn'] as const).map((destination) => {
          const isSelected =
            screen === destination || (destination === 'scan' && screen === 'result');
          const Icon = destination === 'scan' ? Scan : Info;
          const label = destination === 'scan' ? copy.navigationScan : copy.navigationLearn;
          return (
            <button
              key={destination}
              type="button"
              aria-current={isSelected ? 'page' : undefined}
              onClick={() => onNavigate(destination)}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-xs font-semibold transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary ${isSelected ? 'bg-primary-tonal text-primary' : 'text-secondary hover:text-text hover:bg-neutral/40'}`}
            >
              <Icon size={20} strokeWidth={isSelected ? 2.5 : 2} aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
