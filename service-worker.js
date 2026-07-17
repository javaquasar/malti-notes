const CACHE_PREFIX = "malti-notes-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./all_pages.html",
  "./manifest.webmanifest",
  "./assets/data/site-map.json",
  "./assets/img/favicon-option-speech.svg",
  "./assets/css/theme.css",
  "./assets/css/themes/forest.css",
  "./assets/css/themes/contrast.css",
  "./assets/css/site.css",
  "./assets/css/site/base.css",
  "./assets/css/site/review.css",
  "./assets/css/site/layout.css",
  "./assets/css/site/components.css",
  "./assets/css/site/verbs.css",
  "./assets/css/site/imperative.css",
  "./assets/css/site/games.css",
  "./assets/css/site/navigation.css",
  "./assets/css/site/responsive.css",
  "./assets/css/site/print.css",
  "./assets/css/pages.css",
  "./assets/js/storage.js",
  "./assets/js/site-header.js",
  "./assets/js/site-map-pages.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function cacheResponse(request, response) {
  if (response && response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

async function navigationResponse(request) {
  try {
    return await cacheResponse(request, await fetch(request));
  } catch (error) {
    return (await caches.match(request))
      || (await caches.match(new URL("index.html", self.registration.scope).href));
  }
}

async function assetResponse(request) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then((response) => cacheResponse(request, response))
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith(request.mode === "navigate" ? navigationResponse(request) : assetResponse(request));
});
