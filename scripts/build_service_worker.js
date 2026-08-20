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

const assets = [
  "./",
  ...fs.readdirSync(root).filter((file) => file.endsWith(".html")).sort().map((file) => `./${file}`),
  "./manifest.webmanifest",
  ...walk("assets/css", ".css").sort().map((file) => `./${file}`),
  ...walk("assets/js", ".js").sort().map((file) => `./${file}`),
  "./assets/data/site-map.json",
  "./assets/data/search-index.json",
  "./assets/data/course_path.json",
  "./assets/data/course_exercises.json",
  "./assets/data/course_milestone_assessments.json",
  "./assets/data/course/manifest.json",
  "./assets/data/course_verb_paradigms.json",
  "./assets/data/comprehensive_test_bank.json",
  "./assets/data/grammar_targets.json",
  "./assets/img/favicon-option-speech.svg",
];
const uniqueAssets = [...new Set(assets)];
const revision = crypto.createHash("sha256");
uniqueAssets.filter((asset) => asset !== "./").forEach((asset) => {
  const file = path.join(root, asset.slice(2));
  revision.update(asset);
  revision.update(fs.readFileSync(file));
});
const version = revision.digest("hex").slice(0, 12);
const serializedAssets = JSON.stringify(uniqueAssets, null, 2).replace(/^/gm, "  ");
const output = `const CACHE_PREFIX = "malti-notes-";
const CACHE_NAME = \`\${CACHE_PREFIX}${version}\`;
const CORE_ASSETS = ${serializedAssets.trimStart()};

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

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith(request.mode === "navigate" ? navigationResponse(request) : assetResponse(request));
});
`;

if (checkOnly) {
  const normalizeRevision = (value) => value.replace(/const CACHE_NAME = `\$\{CACHE_PREFIX\}[a-f0-9]{12}`;/, "const CACHE_NAME = `${CACHE_PREFIX}<revision>`;");
  const current = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, "utf8") : "";
  if (normalizeRevision(current) !== normalizeRevision(output)) {
    console.error("fail service-worker.js is stale; run npm run pwa:build");
    process.exit(1);
  }
  console.log(`ok service worker revision ${version} precaches ${uniqueAssets.length} assets`);
} else {
  fs.writeFileSync(outputFile, output, "utf8");
  console.log(`wrote service-worker.js revision ${version} with ${uniqueAssets.length} precache assets`);
}
