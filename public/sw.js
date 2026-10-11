// The build replaces this stamp, so every deployment changes this file and browsers see an update.
const BUILD_ID = '__SANE_BUILD_ID__';
const CACHE_NAME = `sane-shell-${BUILD_ID}`;
const MAX_SHARED_TEXT = 5000;
const MAX_SHARED_IMAGE_BYTES = 8 * 1024 * 1024;

let pendingShare = null;

// Downloads the new version's page and the scripts and styles it names, so "Update now" switches
// instantly and the updated app still opens offline. A failed download never blocks the install.
async function precacheShell() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const scope = self.registration.scope;
    const response = await fetch(scope, { cache: 'no-cache' });
    if (!response.ok) return;
    const html = await response.clone().text();
    await cache.put(scope, response);
    const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:m?js|css|webmanifest|png|svg))"/g)]
      .map(([, path]) => new URL(path, scope))
      .filter((url) => url.origin === self.location.origin);
    await Promise.all(
      assets.map((url) =>
        cache.add(new Request(url.href, { cache: 'no-cache' })).catch(() => undefined),
      ),
    );
  } catch {
    // Offline or blocked: the page and assets are fetched normally after the update instead.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      await precacheShell();
      // A first install has nothing to replace, so it takes over at once. A new version waits until
      // the reader chooses "Update now" (or closes every Sane window), so a check is never cut off.
      if (!self.registration.active) await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith('sane-shell-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'skip-waiting') {
    event.waitUntil(self.skipWaiting());
    return;
  }

  if (event.data?.type === 'cache-shell') {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const scopeUrl = new URL(self.registration.scope);
        const resources = [
          scopeUrl.href,
          ...(Array.isArray(event.data.resources) ? event.data.resources : []),
        ];
        const appAssets = resources.filter((resource) => /\.(?:js|css)(?:\?|$)/i.test(resource));
        await Promise.all(
          [...new Set(resources)].map(async (resource) => {
            try {
              const url = new URL(resource, scopeUrl);
              if (url.origin === scopeUrl.origin) await cache.add(url.href);
            } catch {
              // A single optional resource must not prevent the app shell from caching.
            }
          }),
        );
        event.source?.postMessage({
          type: 'offline-ready',
          ready:
            Boolean(await cache.match(scopeUrl.href)) &&
            (await Promise.all(appAssets.map((resource) => cache.match(resource)))).every(Boolean),
        });
      })(),
    );
  }

  if (event.data?.type === 'get-shared') {
    event.source?.postMessage({
      type: 'shared',
      payload: pendingShare,
    });
    pendingShare = null;
  }
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (event.request.method === 'POST' && /\/share\/?$/.test(requestUrl.pathname)) {
    event.respondWith(
      (async () => {
        const form = await event.request.formData();
        const fields = ['title', 'text', 'url']
          .map((name) => form.get(name))
          .filter((value) => typeof value === 'string' && value.trim())
          .map(String);
        const joinedText = fields.join('\n');
        const file = form.get('image');
        const image =
          typeof File !== 'undefined' &&
          file instanceof File &&
          file.type.startsWith('image/') &&
          file.size <= MAX_SHARED_IMAGE_BYTES
            ? file
            : null;

        pendingShare = {
          text: joinedText.slice(0, MAX_SHARED_TEXT + 1),
          textTooLong: joinedText.length > MAX_SHARED_TEXT,
          image,
          imageRejected: Boolean(file && !image),
        };

        const redirectUrl = new URL('../?shared=1', event.request.url);
        return Response.redirect(redirectUrl.href, 303);
      })(),
    );
    return;
  }

  if (event.request.method !== 'GET') return;

  // The hosted model (and its parts) are stored by the model cache itself, one verified part at a time.
  if (requestUrl.pathname.includes('/models/')) return;

  const isNavigation = event.request.mode === 'navigate';
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isStaticAsset =
    isSameOrigin &&
    /\.(?:m?js|css|html|json|wasm|onnx|bin|data|svg|png|webp|woff2?|traineddata(?:\.gz)?)$/i.test(
      requestUrl.pathname,
    );
  // The embedding model on huggingface.co is deliberately not handled here: transformers.js keeps
  // its own cache, and a second 118 MB copy can exceed the phone's storage quota and fail the download.
  const isModelAsset =
    (requestUrl.hostname === 'tessdata.projectnaptha.com' &&
      /\.traineddata(?:\.gz)?$/i.test(requestUrl.pathname)) ||
    (requestUrl.hostname === 'cdn.jsdelivr.net' &&
      (/\/npm\/(?:onnxruntime-web|tesseract\.js-core|tesseract\.js)@[^/]+\/.*\.(?:js|mjs|wasm)$/i.test(
        requestUrl.pathname,
      ) ||
        /\/npm\/@tesseract\.js-data\/[a-z_]+\/[^/]+\/[a-z_]+\.traineddata(?:\.gz)?$/i.test(
          requestUrl.pathname,
        )));
  if (!isNavigation && !isStaticAsset && !isModelAsset) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request, { ignoreSearch: isNavigation });
      if (cached && !isNavigation) return cached;

      try {
        const response = await fetch(event.request);
        if (response.ok && (isNavigation || isStaticAsset || isModelAsset)) {
          // A failed cache write (storage quota, low-end phone) must never fail or delay the
          // request itself: store a copy in the background and ignore any error.
          const copy = response.clone();
          event.waitUntil(cache.put(event.request, copy).catch(() => undefined));
        }
        return response;
      } catch (error) {
        if (cached) return cached;
        throw error;
      }
    })(),
  );
});
