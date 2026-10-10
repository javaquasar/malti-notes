const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputFile = path.join(root, "service-worker.js");
const checkOnly = process.argv.includes("--check");

function walk(directory, extension) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.posix.join(directory.replaceAll("\\", "/"), entry.name);
    return entry.isDirectory() ? walk(relative, extension) : (relative.endsWith(extension) ? [relative] : []);
  });
}

const coreAssets = [
  "./",
  ...fs.readdirSync(root).filter((file) => file.endsWith(".html")).sort().map((file) => `./${file}`),
  "./manifest.webmanifest",
  ...walk("assets/css", ".css").sort().map((file) => `./${file}`),
  ...walk("assets/js", ".js").sort().map((file) => `./${file}`),
  "./assets/data/site-map.json",
  "./assets/data/firebase-config.json",
  "./assets/data/search-index.json",
  "./assets/data/course_path.json",
  "./assets/data/course_exercises.json",
  "./assets/data/course/manifest.json",
  "./assets/data/teaching_depth_report.json",
  "./assets/data/course_verb_paradigms.json",
  "./assets/data/grammar_targets.json",
  "./assets/data/about_me_examples.json",
  "./assets/data/about_me_options.json",
  "./assets/data/lesson01_exercises.json",
  "./assets/data/lesson01_practice.json",
  ...fs.readdirSync(path.join(root, "assets/data")).filter((file) => file.endsWith("_lesson01_examples.json")).sort().map((file) => "./assets/data/" + file),
  "./assets/img/favicon-option-speech.svg",
];

const lazyAssets = [
  ...[...require('./vocabulary_image_inventory').vocabularyFiles().keys()].map((file) => './assets/data/' + file),
  './assets/data/year4_revision_vocabulary.json',
  ...walk('assets/img/openmoji', '.svg').sort().map((file) => './' + file),
  ...walk('assets/img/game-icons', '.svg').sort().map((file) => './' + file),
  "./assets/data/course_milestone_assessments.json",
  "./assets/data/comprehensive_test_bank.json",
];

const uniqueCoreAssets = [...new Set(coreAssets)];
const uniqueLazyAssets = [...new Set(lazyAssets)];
const overlappingAssets = uniqueLazyAssets.filter((asset) => uniqueCoreAssets.includes(asset));
if (overlappingAssets.length) {
  throw new Error(`Assets cannot be both core and lazy: ${overlappingAssets.join(", ")}`);
}

const versionedAssets = [...uniqueCoreAssets, ...uniqueLazyAssets];
const revision = crypto.createHash("sha256");
versionedAssets.filter((asset) => asset !== "./").forEach((asset) => {
  const file = path.join(root, asset.slice(2));
  if (!fs.existsSync(file)) throw new Error(`Service worker asset is missing: ${asset}`);
  revision.update(asset);
  revision.update(fs.readFileSync(file));
});
const version = revision.digest("hex").slice(0, 12);
const assetBytes = (asset) => asset === "./" ? 0 : fs.statSync(path.join(root, asset.slice(2))).size;
const coreBytes = uniqueCoreAssets.reduce((total, asset) => total + assetBytes(asset), 0);
const lazyBytes = uniqueLazyAssets.reduce((total, asset) => total + assetBytes(asset), 0);
const serializedCoreAssets = JSON.stringify(uniqueCoreAssets, null, 2).replace(/^/gm, "  ");
const serializedLazyAssets = JSON.stringify(uniqueLazyAssets, null, 2).replace(/^/gm, "  ");
const output = `const CACHE_PREFIX = "malti-notes-";
const CACHE_NAME = \`\${CACHE_PREFIX}${version}\`;
const CORE_ASSETS = ${serializedCoreAssets.trimStart()};
const LAZY_ASSETS = ${serializedLazyAssets.trimStart()};
const LAZY_ASSET_URLS = new Set(LAZY_ASSETS.map((asset) => new URL(asset, self.registration.scope).href));

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
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
    return (await caches.match(request)) || (await caches.match(new URL("index.html", self.registration.scope).href));
  }
}

async function assetResponse(request) {
  const cached = await caches.match(request);
  const network = fetch(request).then((response) => cacheResponse(request, response)).catch(() => cached);
  return cached || network;
}

async function lazyAssetResponse(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  return cacheResponse(request, await fetch(request));
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(navigationResponse(request));
  } else if (LAZY_ASSET_URLS.has(url.href)) {
    event.respondWith(lazyAssetResponse(request));
  } else {
    event.respondWith(assetResponse(request));
  }
});
`;

if (checkOnly) {
  const normalizeRevision = (value) => value.replace(/const CACHE_NAME = `\$\{CACHE_PREFIX\}[a-f0-9]{12}`;/, "const CACHE_NAME = `${CACHE_PREFIX}<revision>`;");
  const current = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, "utf8") : "";
  if (normalizeRevision(current) !== normalizeRevision(output)) {
    console.error("fail service-worker.js is stale; run npm run pwa:build");
    process.exit(1);
  }
  console.log(`ok service worker revision ${version} precaches ${uniqueCoreAssets.length} core assets (${coreBytes} bytes) and defers ${uniqueLazyAssets.length} assets (${lazyBytes} bytes)`);
} else {
  fs.writeFileSync(outputFile, output, "utf8");
  console.log(`wrote service-worker.js revision ${version} with ${uniqueCoreAssets.length} core assets (${coreBytes} bytes) and ${uniqueLazyAssets.length} lazy assets (${lazyBytes} bytes)`);
}
