import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { CONTENT_SECURITY_POLICY } from './src/security/csp';

// Serve and bundle the onnxruntime-web WASM files ourselves so no check or model load fetches a
// public CDN (zero-network and offline requirement). The embedding code loads them from ort/.
const ORT_FILES = [
  'ort-wasm-simd-threaded.asyncify.mjs',
  'ort-wasm-simd-threaded.asyncify.wasm',
  'ort-wasm-simd-threaded.mjs',
  'ort-wasm-simd-threaded.wasm',
];

function onnxRuntimeAssets(): Plugin {
  const dist = dirname(createRequire(import.meta.url).resolve('onnxruntime-web'));
  const types: Record<string, string> = { '.wasm': 'application/wasm', '.mjs': 'text/javascript' };
  return {
    name: 'sane-onnx-runtime-assets',
    configureServer(server) {
      server.middlewares.use('/ort/', (req, res, next) => {
        const name = (req.url ?? '').split('?')[0].replace(/^\//, '');
        if (!ORT_FILES.includes(name)) return next();
        res.setHeader('Content-Type', types[name.slice(name.lastIndexOf('.'))]);
        res.end(readFileSync(join(dist, name)));
      });
    },
    generateBundle() {
      for (const name of ORT_FILES) {
        this.emitFile({
          type: 'asset',
          fileName: `ort/${name}`,
          source: readFileSync(join(dist, name)),
        });
      }
    },
  };
}

// Tesseract's worker and LSTM WASM cores, served from our origin instead of jsDelivr so screenshot
// reading works offline after first use. The browser picks one core variant at runtime.
const TESSERACT_FILES: Record<string, string> = {
  'worker.min.js': 'tesseract.js/dist/worker.min.js',
  'tesseract-core-lstm.wasm.js': 'tesseract.js-core/tesseract-core-lstm.wasm.js',
  'tesseract-core-simd-lstm.wasm.js': 'tesseract.js-core/tesseract-core-simd-lstm.wasm.js',
  'tesseract-core-relaxedsimd-lstm.wasm.js':
    'tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js',
  // English and Filipino language data, from pinned MIT packages, so the first screenshot read
  // does not fetch anything from a public CDN and works offline from the first use.
  'lang/eng.traineddata.gz': '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz',
  'lang/fil.traineddata.gz': '@tesseract.js-data/fil/4.0.0_best_int/fil.traineddata.gz',
};

function tesseractAssets(): Plugin {
  const require = createRequire(import.meta.url);
  const resolve = (name: string) => require.resolve(TESSERACT_FILES[name]);
  return {
    name: 'sane-tesseract-assets',
    configureServer(server) {
      server.middlewares.use('/tesseract/', (req, res, next) => {
        const name = (req.url ?? '').split('?')[0].replace(/^\//, '');
        if (!TESSERACT_FILES[name]) return next();
        res.setHeader(
          'Content-Type',
          name.endsWith('.gz') ? 'application/gzip' : 'text/javascript',
        );
        res.end(readFileSync(resolve(name)));
      });
    },
    generateBundle() {
      for (const name of Object.keys(TESSERACT_FILES)) {
        this.emitFile({
          type: 'asset',
          fileName: `tesseract/${name}`,
          source: readFileSync(resolve(name)),
        });
      }
    },
  };
}

// Stamps a per-build ID into the copied service worker. A changed sw.js is how an installed app
// learns that a new deployment exists, and the ID also names that version's offline cache.
function serviceWorkerBuildId(): Plugin {
  return {
    name: 'sane-service-worker-build-id',
    apply: 'build',
    writeBundle({ dir }) {
      const file = join(dir ?? 'dist', 'sw.js');
      const source = readFileSync(file, 'utf8');
      writeFileSync(file, source.replace('__SANE_BUILD_ID__', Date.now().toString(36)));
    },
  };
}

// Adds the Content Security Policy to the built page only; the dev server needs inline scripts.
function contentSecurityPolicy(): Plugin {
  return {
    name: 'sane-content-security-policy',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}

// base './' keeps the build portable across GitHub Pages, Netlify, and Cloudflare Pages.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    onnxRuntimeAssets(),
    tesseractAssets(),
    serviceWorkerBuildId(),
    contentSecurityPolicy(),
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts', 'eval/**/*.test.ts'] },
});
