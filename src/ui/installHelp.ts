// OWNER: frontend. Which install advice to show when the browser offers no install prompt.
// Chrome and Edge stop offering the prompt once Sane is installed, and for a while after someone
// closes it, so "nothing happened" needs a reason and a next step rather than a generic line.

export type InstallHelp = 'already' | 'offline' | 'ios' | 'manual' | 'desktop';

export type InstallContext = {
  /** The browser reports Sane as installed on this device (getInstalledRelatedApps). */
  installed: boolean;
  online: boolean;
  appleMobile: boolean;
  android: boolean;
};

export function installHelpFor({
  installed,
  online,
  appleMobile,
  android,
}: InstallContext): InstallHelp {
  if (installed) return 'already';
  if (!online) return 'offline';
  if (appleMobile) return 'ios';
  if (android) return 'manual';
  return 'desktop';
}

type RelatedApp = { platform: string; url?: string; id?: string };

/**
 * True when this browser says Sane is already installed. Chrome and Edge answer through the
 * manifest's related_applications entry; other browsers do not support the check and get false.
 */
export async function installedOnThisDevice(): Promise<boolean> {
  const nav = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<RelatedApp[]> };
  if (typeof nav.getInstalledRelatedApps !== 'function') return false;
  try {
    const apps = await nav.getInstalledRelatedApps();
    return apps.some(({ platform }) => platform === 'webapp');
  } catch {
    return false;
  }
}
