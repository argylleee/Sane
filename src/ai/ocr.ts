// OWNER: model. Screenshot to text with Tesseract.js (eng + fil), loaded lazily on first use.
// Tesseract manages its own Web Worker. analyze() treats any throw here as "ask the user to paste".
import { cleanOcrText, preprocessImage } from './ocrPreprocess';

const OCR_TIMEOUT_MS = 30000; // preprocessing plus up to two reads on a slow phone
const MIN_TEXT_LENGTH = 10;
const GOOD_CONFIDENCE = 60; // below this the plain image is also tried and the better read is kept

type TesseractWorker = {
  recognize: (image: File | Blob) => Promise<{ data: { text: string; confidence?: number } }>;
  setParameters?: (params: Record<string, string>) => Promise<unknown>;
  terminate: () => Promise<unknown>;
};

let workerPromise: Promise<TesseractWorker> | undefined;

function getWorker(): Promise<TesseractWorker> {
  workerPromise ??= import('tesseract.js')
    .then(async ({ createWorker }) => {
      // Worker and WASM core come from our own origin (see vite.config.ts), so OCR keeps working
      // offline. The English and Filipino language data are ours too (see vite.config.ts), so reading
      // a screenshot never contacts a public CDN. Tesseract and the service worker cache them.
      const base = new URL('tesseract/', document.baseURI).href;
      const worker = (await createWorker(['eng', 'fil'], 1, {
        workerPath: `${base}worker.min.js`,
        corePath: base,
        langPath: `${base}lang`,
        workerBlobURL: false,
      })) as TesseractWorker;
      // PSM 4: a single column of text with lines of different sizes, which suits chat bubbles.
      // Keep word spacing so URLs and amounts are not run together. Failure keeps the defaults.
      await worker
        .setParameters?.({ tessedit_pageseg_mode: '4', preserve_interword_spaces: '1' })
        .catch(() => undefined);
      return worker;
    })
    .catch((error) => {
      workerPromise = undefined; // allow a later retry
      throw error;
    });
  return workerPromise;
}

async function read(worker: TesseractWorker, image: File | Blob) {
  const { data } = await worker.recognize(image);
  return { text: cleanOcrText(data.text), confidence: data.confidence ?? 0 };
}

export async function extractText(image: File): Promise<string> {
  if (typeof Worker === 'undefined') throw new Error('OCR needs a browser environment.');
  const worker = await getWorker();
  const attempt = (async () => {
    const prepared = await read(worker, await preprocessImage(image));
    if (prepared.confidence >= GOOD_CONFIDENCE && prepared.text.length >= MIN_TEXT_LENGTH)
      return prepared.text;
    const plain = await read(worker, image);
    const better = plain.confidence > prepared.confidence ? plain : prepared;
    return (better.text.length >= prepared.text.length * 0.6 ? better : prepared).text;
  })();
  const text = await Promise.race([
    attempt,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('OCR timed out.')), OCR_TIMEOUT_MS),
    ),
  ]);
  if (text.trim().length < MIN_TEXT_LENGTH) throw new Error('Not enough text found in the image.');
  return text.trim();
}
