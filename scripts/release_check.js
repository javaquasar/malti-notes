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
async function checkWithdrawnMediaWorker(worker, revision) {
  const scope = 'https://release.invalid/malti-notes/';
  const currentCache = vm.runInNewContext(worker.slice(0, worker.indexOf('const LAZY_ASSET_URLS')) + '; CACHE_NAME');
  const events = {}, lifecycle = [], deleted = [], retiredEntries = [];
  let networkCalls = 0, cacheReads = 0, failInstall = false;
  const context = {
    URL, Response,
    self: { registration: { scope }, location: { origin: new URL(scope).origin },
      addEventListener: (name, handler) => { events[name] = handler; },
      skipWaiting: async () => { lifecycle.push('skipWaiting'); },
      clients: { claim: async () => { lifecycle.push('claim'); } } },
    caches: {
      open: async () => ({
        addAll: async () => { if (failInstall) throw new Error('Core install failed'); lifecycle.push('core'); },
        match: async () => { cacheReads += 1; return new Response('stale recording'); },
        put: async () => { throw new Error('Retired media must not be cached'); },
        keys: async () => ['assets/audio/tonina.m4a', `assets/${revision}/audio/tonina.m4a?old=1`, 'assets/audio/another.m4a']
          .map((resource) => new Request(new URL(resource, scope))),
        delete: async (request) => { retiredEntries.push(request.url); return true; }
      }),
      keys: async () => [currentCache, 'malti-notes-old-raw', 'malti-notes-old-release', 'another-app'],
      delete: async (name) => { deleted.push(name); lifecycle.push('delete'); return true; },
      match: async () => { cacheReads += 1; return new Response('stale recording'); }
    },
    fetch: async () => { networkCalls += 1; throw new Error('Retired media must not reach the network'); }
  };
  vm.runInNewContext(worker, context);
  let pending;
  events.install({ waitUntil: (value) => { pending = value; } });
  await pending;
  assert.deepEqual(lifecycle, ['core', 'skipWaiting'], 'Immediate takeover must follow a complete core install');
  failInstall = true;
  events.install({ waitUntil: (value) => { pending = value; } });
  await assert.rejects(pending, /Core install failed/);
  assert.deepEqual(lifecycle, ['core', 'skipWaiting'], 'Failed install must not replace the active worker');
  events.activate({ waitUntil: (value) => { pending = value; } });
  await pending;
  assert.deepEqual(deleted.sort(), ['malti-notes-old-raw', 'malti-notes-old-release'], 'Activation must purge old site caches and preserve other apps');
  assert.deepEqual(retiredEntries.sort(), [new URL('assets/audio/tonina.m4a', scope).href,
    new URL(`assets/${revision}/audio/tonina.m4a?old=1`, scope).href].sort(), 'Current cache must remove only retired recording entries');
  assert.equal(lifecycle.at(-1), 'claim', 'Clients must be claimed after the recording cache purge');
  for (const [resource, mode] of [
    ['assets/audio/tonina.m4a', 'cors'],
    [`assets/${revision}/audio/tonina.m4a?download=1`, 'cors'],
    ['assets/0123456789abcdef/audio/tonina.m4a', 'navigate'],
    ['assets/audio/%74onina%2Em4a?legacy=1', 'cors']
  ]) {
    let response;
    events.fetch({ request: { url: new URL(resource, scope).href, method: 'GET', mode,
      headers: new Headers({ Range: 'bytes=0-63' }) }, respondWith: (value) => { response = value; } });
    const retired = await response;
    assert.equal(retired?.status, 410, `Retired recording was not blocked: ${resource}`);
    assert.equal(retired.headers.get('Cache-Control'), 'no-store', 'Retired response must not be cached');
  }
  assert.equal(networkCalls, 0, 'Retired requests reached the network');
  assert.equal(cacheReads, 0, 'Retired requests read cached recording bytes');
  assert.equal(context.isRetiredMedia(new URL('assets/audio/another.m4a', scope)), false, 'Other audio must keep its existing behavior');
}
async function browserCheck(release) {
  const prefix = "/malti-notes/";
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://local").pathname);
    if (!pathname.startsWith(prefix)) { response.writeHead(404).end(); return; }
    const relative = pathname.slice(prefix.length) || "index.html";
    const file = path.resolve(release.output, relative);
    if (!file.startsWith(release.output + path.sep)) { response.writeHead(403).end(); return; }
    fs.readFile(file, (error, data) => {
      response.writeHead(error ? 404 : 200, { "Content-Type": ({ ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".wasm": "application/wasm", ".wav": "audio/wav" })[path.extname(file)] || "application/octet-stream" });
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
    const studyKey = "malti_topic_practice_v1";
    const calendarAudio = async () => {
      await page.locator('#b3-calendar-audio > summary').click();
      const audio = page.locator('#b3-calendar-audio audio');
      assert.equal(await audio.getAttribute('src'), `./assets/${release.revision}/audio/b3-calendar-weekday.wav`);
      const play = page.getByRole('button', { name: 'Play phrase', exact: true });
      const bounds = await play.boundingBox();
      assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= page.viewportSize().width, 'Weekday playback control must fit the viewport');
      await play.focus();
      await play.press('Enter');
      await page.waitForFunction(() => document.querySelector('#b3-calendar-audio audio').ended);
      const duration = await audio.evaluate(clip => clip.duration);
      assert.ok(duration > 0.6 && duration < 2, `Unexpected duration for the weekday phrase: ${duration}`);
      const answer = page.locator('#b3-calendar-audio details');
      assert.equal(await answer.evaluate(details => details.open), false);
      await answer.locator('summary').click();
      assert.match(await answer.innerText(), /Nhar it-Tlieta.*Tuesday/s);
    };
    const studyState = () => page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key)).studySession;
      return { levelId: state.levelId, chapterId: state.chapterId, session: state.sessions[state.chapterId] };
    }, studyKey);
    const studyReady = async (level) => {
      await page.waitForFunction((id) => document.querySelector(`[data-study-level="${id}"]`)?.ariaPressed === "true"
        && document.querySelector("[data-study-start]")?.disabled === false, level);
      assert.ok(await page.locator("[data-study-start]").isVisible(), "Released practice start is hidden");
    };
    const studyAnswer = () => page.locator("[data-study-exercise]").evaluate((panel) => {
      const text = panel.querySelector("[data-exercise-answer]");
      if (text) return text.value;
      const selects = [...panel.querySelectorAll("select[data-match-index]")];
      if (selects.length) return selects.map((select) => select.value);
      if (panel.querySelector(".exercise-order-bank")) return [...panel.querySelectorAll(".exercise-order-answer .exercise-token")].map((token) => token.textContent);
      return panel.querySelector('input[type="radio"]:checked')?.value || "";
    });
    const startStudy = async (level, saved) => {
      await studyReady(level);
      await page.locator("[data-study-start]").click();
      await page.locator("[data-study-session]").waitFor({ state: "visible" });
      assert.equal(await page.locator("[data-study-exercise] .exercise-item:visible").count(), 1, "Released practice must show one question at a time");
      const current = await studyState();
      assert.equal(current.levelId, level);
      assert.equal(current.session.routeId, level);
      assert.equal(current.session.entries.length, 6, "Released practice did not create six questions");
      assert.equal(new Set(current.session.entries.map((entry) => entry.item.id)).size, 6, "Released practice repeats a question");
      assert.match(await page.locator("[data-study-session-title]").textContent(), new RegExp("^" + level.toUpperCase() + " · "));
      if (saved) {
        assert.equal(current.chapterId, saved.chapterId, "Released practice resumed a different topic");
        assert.equal(current.session.id, saved.session.id, "Released practice lost its saved session");
        assert.equal(current.session.index, saved.session.index, "Released practice lost its place");
        const itemId = saved.session.entries[saved.session.index].item.id;
        assert.equal(current.session.entries[current.session.index].item.id, itemId, "Released practice changed the current question");
        assert.deepEqual(await studyAnswer(), saved.session.drafts[itemId], "Released practice lost its visible draft");
      }
      return current;
    };
    const saveStudyDraft = async () => {
      const panel = page.locator("[data-study-exercise]");
      if (await panel.locator("[data-exercise-answer]").count()) await panel.locator("[data-exercise-answer]").fill("A saved release-check draft");
      else if (await panel.locator('input[type="radio"]').count()) await panel.locator('input[type="radio"]').first().check();
      else if (await panel.locator("select[data-match-index]").count()) {
        for (const select of await panel.locator("select[data-match-index]").all()) {
          const value = await select.locator("option").evaluateAll((options) => options.find((option) => option.value)?.value);
          await select.selectOption(value);
        }
      } else await panel.locator(".exercise-order-bank .exercise-token").first().click();
      const expected = await studyAnswer();
      await page.waitForFunction(({ key, expected }) => {
        const state = JSON.parse(localStorage.getItem(key)).studySession, session = state.sessions[state.chapterId];
        return JSON.stringify(session.drafts[session.entries[session.index].item.id]) === JSON.stringify(expected);
      }, { key: studyKey, expected });
      return studyState();
    };
    await page.goto(base + "greetings.html", { waitUntil: "networkidle" });
    await page.locator(".lp-phrase.study-card").first().waitFor();
    await page.evaluate(async () => {
      await Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(new Error("Offline worker installation timed out")), 15000))]);
    });
    await page.reload({ waitUntil: "networkidle" });
    assert.ok(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), "Offline worker did not control release");
    await page.goto(base + "particles_prepositions.html", { waitUntil: "networkidle" });
    await page.locator(".review-table-action button").first().waitFor();
    await page.goto(base + "gender_agreement.html", { waitUntil: "networkidle" });
    await page.locator("[data-mixed-start]").click();
    assert.equal(await page.locator("[data-mixed-exercise] .exercise-item").count(), 6, "Released mixed bank did not load");
    await page.goto(base + "school_classroom.html", { waitUntil: "networkidle" });
    assert.equal(await page.locator("[data-recall-bank] [data-bank-item]").count(), 10, "Released recall bank did not load");
    await page.goto(base + "daily_problems.html", { waitUntil: "networkidle" });
    const readingText = page.locator('[data-tonina-bank="tonina-reading-text"] [data-bank-item]');
    const readingQuestions = page.locator('[data-tonina-bank="tonina-listening-questions"] [data-bank-item]');
    await page.waitForFunction(() => document.querySelectorAll('[data-tonina-bank="tonina-reading-text"] [data-bank-item]').length === 15
      && document.querySelectorAll('[data-tonina-bank="tonina-listening-questions"] [data-bank-item]').length === 10);
    assert.equal(await readingText.count(), 15, "Released reading text did not load all 15 fragments");
    assert.equal(await readingQuestions.count(), 10, "Released reading questions did not load");
    assert.equal(await page.locator('[data-tonina-reading] audio').count(), 0, "The withdrawn recording still has a player");
    const completeText = await readingText.allTextContents();
    const completeQuestions = await readingQuestions.allTextContents();
    for (const resource of ['assets/audio/tonina.m4a', `assets/${release.revision}/audio/tonina.m4a`]) {
      const missing = await context.request.get(base + resource);
      assert.equal(missing.status(), 404, `Withdrawn audio is still published: ${resource}`);
    }
    await page.goto(base + 'today.html?level=b3&topic=b3-calendar', { waitUntil: 'networkidle' });
    await studyReady('b3');
    await page.getByRole('link', { name: 'Make a plan with Nina', exact: true }).click();
    await page.waitForURL(/b3_revision\.html#b3-calendar-plan$/);
    await page.setViewportSize({ width: 320, height: 844 });
    await calendarAudio();
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(base + "today.html?level=b3", { waitUntil: "networkidle" });
    await studyReady("b3");
    for (const script of ["study-session-core.js", "study-session.js", "study-entry.js"]) {
      const resource = `/assets/${release.revision}/js/${script}`;
      assert.equal(await page.locator(`script[src=".${resource}"]`).count(), 1, `Released practice script is not versioned: ${script}`);
      assert.ok(requested.some((url) => new URL(url).pathname.endsWith(resource)), `Released practice script did not load: ${script}`);
    }
    await startStudy("b3");
    const savedB3 = await saveStudyDraft(), b3Address = page.url();
    await page.locator("[data-study-back]").click();
    await page.locator('[data-study-level="b1"]').click();
    await studyReady("b1");
    assert.equal(await page.locator("[data-study-topic]").inputValue(), "b1-introductions", "Released B1 default topic is incorrect");
    assert.ok(requested.some((url) => new URL(url).pathname.endsWith("/data/course/chapters/b1-introductions.json")), "Released B1 lazy chapter payload did not load");
    await startStudy("b1");
    const savedB1 = await saveStudyDraft(), b1Address = page.url();
    await page.locator("[data-study-back]").click();
    await page.locator('[data-study-level="b3"]').click();
    await startStudy("b3", savedB3);
    await page.locator("[data-study-back]").click();
    await page.goto(base + "particles_prepositions.html", { waitUntil: "networkidle" });
    await context.setOffline(true);
    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".review-table-action button").first().waitFor();
    await page.goto(base + "daily_problems.html", { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.querySelectorAll('[data-tonina-bank="tonina-reading-text"] [data-bank-item]').length === 15
      && document.querySelectorAll('[data-tonina-bank="tonina-listening-questions"] [data-bank-item]').length === 10);
    assert.deepEqual(await readingText.allTextContents(), completeText, "Offline reading text differs from the complete online text");
    assert.deepEqual(await readingQuestions.allTextContents(), completeQuestions, "Offline reading questions differ");
    assert.equal(await page.locator('[data-tonina-reading] audio').count(), 0, "Offline page restored the withdrawn player");
    await page.goto(base + 'b3_revision.html#b3-calendar-plan', { waitUntil: 'networkidle' });
    await calendarAudio();
    for (const [level, address, saved] of [["b1", b1Address, savedB1], ["b3", b3Address, savedB3]]) {
      await page.goto(address, { waitUntil: "networkidle" });
      await studyReady(level);
      assert.equal(await page.locator("[data-study-start]").textContent(), "Continue practice", "Offline practice did not offer the saved session");
      await startStudy(level, saved);
      await page.reload({ waitUntil: "networkidle" });
      await startStudy(level, saved);
      await page.locator("[data-study-back]").click();
    }
    assert.ok(!requested.some((url) => url.includes('/audio/tonina.m4a')), "Reading page requested the withdrawn recording");
    assert.ok(requested.length > 10, "Release did not exercise asset loading");
    assert.ok(requested.every((url) => url.includes(`/assets/${release.revision}/`)), "Unversioned browser request");
    assert.deepEqual(errors, []);
    assert.deepEqual(failed, []);
    console.log("ok deployed subpath: CSS imports, speaking/data, table renderer, mixed/recall/reading banks, complete offline text, B1/B3 one-question sessions and drafts under subpath, licensed B3 weekday audio online and offline, withdrawn audio absence");
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
  assert.ok(!assets.some((url) => url.endsWith('/audio/tonina.m4a')), "Offline inventory still lists the withdrawn recording");
  assert.ok(!files(first.output).some((file) => file.endsWith('/audio/tonina.m4a')), "Release still includes the withdrawn recording");
  const manifest = JSON.parse(fs.readFileSync(path.join(first.output, 'release.json'), 'utf8'));
  assert.ok(!Object.keys(manifest.integrity).some((file) => file.endsWith('/audio/tonina.m4a')), "Release integrity still publishes the withdrawn recording");
  await checkWithdrawnMediaWorker(worker, first.revision);
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
