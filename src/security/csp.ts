// OWNER: backend. The Content Security Policy for the production build (see skills/security-privacy).
// It is added to index.html by the build only, so the dev server's hot reload keeps working.
//
// What the app needs, and why nothing wider is allowed:
// - Scripts, workers, the embedding model, OCR worker and WASM all come from our own origin.
//   'wasm-unsafe-eval' lets WebAssembly compile (onnxruntime, tesseract); plain eval stays blocked.
// - Inline styles are allowed because React and the UI library set style attributes. Scripts are not.
// - connect-src adds only the hosts the optional explanation model (WebLLM) downloads from. The
//   embedding model and OCR data are self-hosted, so a scan or screenshot read contacts nobody else.
const POLICY: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'wasm-unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': [
    "'self'",
    'blob:',
    'https://huggingface.co',
    'https://*.huggingface.co',
    'https://*.hf.co',
    'https://raw.githubusercontent.com',
  ],
  'worker-src': ["'self'", 'blob:'],
  'manifest-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

export const CONTENT_SECURITY_POLICY = Object.entries(POLICY)
  .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
  .join('; ');
