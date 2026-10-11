import { afterEach, describe, expect, it, vi } from 'vitest';
import { installedOnThisDevice, installHelpFor } from './installHelp';

const base = { installed: false, online: true, appleMobile: false, android: false };

describe('installHelpFor', () => {
  it('says Sane is already installed before anything else', () => {
    expect(installHelpFor({ ...base, installed: true, online: false, appleMobile: true })).toBe(
      'already',
    );
  });

  it('explains offline, iPhone, Android and desktop routes', () => {
    expect(installHelpFor({ ...base, online: false })).toBe('offline');
    expect(installHelpFor({ ...base, appleMobile: true })).toBe('ios');
    expect(installHelpFor({ ...base, android: true })).toBe('manual');
    expect(installHelpFor(base)).toBe('desktop');
  });
});

describe('installedOnThisDevice', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is false when the browser cannot check', async () => {
    vi.stubGlobal('navigator', {});
    await expect(installedOnThisDevice()).resolves.toBe(false);
  });

  it('is true when the browser lists the installed web app', async () => {
    vi.stubGlobal('navigator', {
      getInstalledRelatedApps: async () => [{ platform: 'webapp', url: '/manifest.webmanifest' }],
    });
    await expect(installedOnThisDevice()).resolves.toBe(true);
  });

  it('is false when the check fails', async () => {
    vi.stubGlobal('navigator', {
      getInstalledRelatedApps: async () => {
        throw new Error('not allowed');
      },
    });
    await expect(installedOnThisDevice()).resolves.toBe(false);
  });
});
