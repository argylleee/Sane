import { describe, expect, it } from 'vitest';
import { pickLocalVoice } from './speech';

const voices = [
  { name: 'Cloud English', lang: 'en-US', localService: false },
  { name: 'Local English', lang: 'en_US', localService: true },
  { name: 'Cloud Filipino', lang: 'fil-PH', localService: false },
];

describe('pickLocalVoice', () => {
  it('never picks a voice that is not on this device', () => {
    expect(pickLocalVoice(voices, 'fil')).toBeNull();
    expect(pickLocalVoice([voices[2]], 'taglish')).toBeNull();
  });

  it('picks a local voice for the language, or the closest fallback for Taglish', () => {
    expect(pickLocalVoice(voices, 'en')?.name).toBe('Local English');
    expect(pickLocalVoice(voices, 'taglish')?.name).toBe('Local English');
    const withFilipino = [
      ...voices,
      { name: 'Local Filipino', lang: 'fil-PH', localService: true },
    ];
    expect(pickLocalVoice(withFilipino, 'taglish')?.name).toBe('Local Filipino');
    expect(pickLocalVoice(withFilipino, 'fil')?.name).toBe('Local Filipino');
  });
});
