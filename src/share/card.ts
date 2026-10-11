// OWNER: frontend. A picture a reader can send to family: the verdict, the advice and nothing else.
// The card never contains the message, numbers, links or findings from it, so sharing it cannot
// leak what the scammer wrote. It is drawn in the browser; nothing is uploaded.
import type { Level } from '../types';

export type CardContent = {
  level: Level;
  label: string;
  headline: string;
  steps: string[];
  footer: string;
};

const WIDTH = 1080;
const PAD = 72;
const TONES: Record<Level, { bg: string; fg: string; accent: string }> = {
  likely_scam: { bg: '#f6dcdc', fg: '#6e2020', accent: '#a93f3f' },
  suspicious: { bg: '#f7ecc8', fg: '#5e4400', accent: '#9e7000' },
  probably_fine: { bg: '#d6ebdf', fg: '#1d4a33', accent: '#2e6b4b' },
  not_sure: { bg: '#e4e8e5', fg: '#2f3d36', accent: '#53685c' },
};

/** Splits text into lines that fit a width. `measure` returns the width of a string. */
export function wrapLines(
  text: string,
  maxWidth: number,
  measure: (s: string) => number,
): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderCard(content: CardContent): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const tone = TONES[content.level];
  const font = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available');
  const inner = WIDTH - PAD * 2;

  // First pass measures the height, second pass draws.
  const layout = (draw: boolean): number => {
    let y = PAD;
    const text = (value: string, size: number, weight: number, color: string, gap: number) => {
      ctx.font = `${weight} ${size}px ${font}`;
      ctx.fillStyle = color;
      for (const line of wrapLines(value, inner, (s) => ctx.measureText(s).width)) {
        y += size;
        if (draw) ctx.fillText(line, PAD, y);
        y += size * 0.25;
      }
      y += gap;
    };
    text('Sane', 40, 700, tone.accent, 40);
    text(content.label, 76, 800, tone.fg, 28);
    text(content.headline, 40, 500, tone.fg, 44);
    content.steps
      .slice(0, 3)
      .forEach((step, index) => text(`${index + 1}. ${step}`, 36, 500, tone.fg, 22));
    y += 22;
    text(content.footer, 28, 500, tone.accent, 0);
    return y + PAD;
  };

  canvas.width = WIDTH;
  canvas.height = 10;
  layout(false); // sets the font so measureText works
  canvas.height = Math.max(layout(false), 560);
  ctx.fillStyle = tone.bg;
  ctx.fillRect(0, 0, WIDTH, canvas.height);
  ctx.textBaseline = 'alphabetic';
  layout(true);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No image'))), 'image/png'),
  );
}

/** Shares the card with the system share sheet when it can, otherwise downloads it. */
export async function shareCard(
  blob: Blob,
  fileName: string,
  title: string,
): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], fileName, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') return 'shared'; // the reader closed the sheet
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}
