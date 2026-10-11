// OWNER: frontend. Read-aloud with voices that run on this device only.
// Some browsers ship voices that send the text to a server. Those are never used: a voice must
// report localService, otherwise the read-aloud button stays hidden.
import type { Lang } from '../types';

export type VoiceLike = { lang: string; localService: boolean; name: string };

const PREFIXES: Record<Lang, string[]> = {
  en: ['en-ph', 'en'],
  fil: ['fil', 'tl'],
  // Taglish is mostly English words with Filipino grammar. A Filipino voice reads it best.
  taglish: ['fil', 'tl', 'en-ph', 'en'],
};

export function pickLocalVoice<T extends VoiceLike>(voices: readonly T[], lang: Lang): T | null {
  const local = voices.filter((voice) => voice.localService);
  for (const prefix of PREFIXES[lang]) {
    const match = local.find((voice) =>
      voice.lang.toLowerCase().replace('_', '-').startsWith(prefix),
    );
    if (match) return match;
  }
  return null;
}

export function canReadAloud(lang: Lang): boolean {
  if (typeof speechSynthesis === 'undefined') return false;
  return pickLocalVoice(speechSynthesis.getVoices(), lang) !== null;
}

export function readAloud(text: string, lang: Lang): boolean {
  if (typeof speechSynthesis === 'undefined') return false;
  const voice = pickLocalVoice(speechSynthesis.getVoices(), lang);
  if (!voice) return false;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice as unknown as SpeechSynthesisVoice;
  utterance.lang = voice.lang;
  speechSynthesis.speak(utterance);
  return true;
}

export function stopReading(): void {
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}
