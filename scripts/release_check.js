const assert = require("assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");
const http = require("http");
const { chromium } = require("playwright");
const { buildRelease, files, normalize, rewriteResources } = require("./build_release");
const root = path.resolve(__dirname, "..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "malti-release-"));
async function browserCheck(release) {
  const prefix = "/malti-notes/";
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://local").pathname);
    if (!pathname.startsWith(prefix)) { response.writeHead(404).end(); return; }
    const relative = pathname.slice(prefix.length) || "index.html";
    const file = path.resolve(release.output, relative);
    if (!file.startsWith(release.output + path.sep)) { response.writeHead(403).end(); return; }
    fs.readFile(file, (error, data) => {
      response.writeHead(error ? 404 : 200, { "Content-Type": ({ ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".wasm": "application/wasm" })[path.extname(file)] || "application/octet-stream" });
      response.end(error ? "Not found" : data);
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [], failed = [], requested = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => { if (response.status() >= 400) failed.push(response.url()); });
    page.on("request", (request) => { if (request.url().includes(prefix + "assets/")) requested.push(request.url()); });
    const base = `http://127.0.0.1:${server.address().port}${prefix}`;
    await page.goto(base + "greetings.html", { waitUntil: "networkidle" });
    await page.locator(".lp-phrase.study-card").first().waitFor();
    await page.evaluate(async () => {
      await Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(new Error("Offline worker installation timed out")), 15000))]);
    });
    await page.reload({ waitUntil: "networkidle" });
    assert.ok(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), "Offline worker did not control release");
    await page.goto(base + "particles_prepositions.html", { waitUntil: "networkidle" });
    await page.locator(".review-table-action button").first().waitFor();
    await context.setOffline(true);
    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".review-table-action button").first().waitFor();
    assert.ok(requested.length > 10, "Release did not exercise asset loading");
    assert.ok(requested.every((url) => url.includes(`/assets/${release.revision}/`)), "Unversioned browser request");
    assert.deepEqual(errors, []);
    assert.deepEqual(failed, []);
    console.log("ok deployed subpath: CSS imports, dynamic speaking/data, table renderer and offline reload");
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
async function main() {
try {
  assert.equal(rewriteResources('"https://cdn.example/assets/a.css?v=3"', "test"), '"https://cdn.example/assets/a.css?v=3"');
  assert.equal(rewriteResources('"./assets/a.css?v=3"', "test"), '"./assets/test/a.css"');
  assert.equal(rewriteResources('url("./site/a.css?v=3")', "test"), 'url("./site/a.css")');
  const first = buildRelease(path.join(temp, "first"));
  const second = buildRelease(path.join(temp, "second"));
  assert.equal(first.revision, second.revision);
  for (const file of files(first.output)) assert.deepEqual(fs.readFileSync(path.join(first.output, file)), fs.readFileSync(path.join(second.output, file)), file);
  assert.equal(normalize("a.css", Buffer.from("a\r\nb")), normalize("a.css", Buffer.from("a\nb")));
  assert.throws(() => buildRelease(first.output), /already exists/);
  const worker = fs.readFileSync(path.join(first.output, "service-worker.js"), "utf8");
  const assets = vm.runInNewContext(worker.slice(0, worker.indexOf("const LAZY_ASSET_URLS")) + "; [...CORE_ASSETS, ...LAZY_ASSETS]");
  for (const url of assets.filter((url) => url !== "./")) {
    assert.ok(fs.existsSync(path.join(first.output, url.split("?")[0])), `Missing offline asset ${url}`);
    if (url.includes("assets/")) assert.ok(url.includes(`assets/${first.revision}/`), url);
  }
  for (const file of files(first.output).filter((file) => /\.(html|css|js|json|webmanifest)$/.test(file))) {
    const text = fs.readFileSync(path.join(first.output, file), "utf8");
    assert.ok(!/\bassets\/(?![a-f0-9]{16}\/)/.test(text), `Unversioned asset path: ${file}`);
    assert.ok(!/\.(css|js)\?v=/.test(text), `Manual version survived: ${file}`);
  }
  // A transitive stylesheet change must invalidate the complete resource namespace.
  const source = path.join(temp, "source");
  fs.mkdirSync(source);
  for (const file of [...fs.readdirSync(root).filter((file) => file.endsWith(".html")), "manifest.webmanifest"]) fs.copyFileSync(path.join(root, file), path.join(source, file));
  fs.cpSync(path.join(root, "assets"), path.join(source, "assets"), { recursive: true });
  fs.appendFileSync(path.join(source, "assets/css/site/review-inline.css"), "\n/* release invalidation test */\n");
  const changed = buildRelease(path.join(temp, "changed"), source);
  assert.notEqual(first.revision, changed.revision);
  await browserCheck(first);
  console.log(`ok reproducible release ${first.revision}; transitive invalidation, offline inventory, no manual versions`);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
