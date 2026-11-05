'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { createHash } = require('node:crypto');
const root = process.env.STUDY_SITE_ROOT || path.resolve(__dirname, '..');
const { chromium } = require(path.join(root, 'node_modules/playwright'));
const output = process.env.STUDY_TEST_OUTPUT || path.join(root, 'artifacts/study-session');
fs.mkdirSync(output, { recursive: true });
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const course = read('assets/data/course_path.json');
const bank = read('assets/data/b3_practice_bank.json');
const chapterFiles = course.levels.flatMap(level => level.chapters.map(chapter => ({ ...chapter, levelId: level.id, data: read('assets/data/course/chapters/' + chapter.id + '.json') })));
const originalSets = chapterFiles.flatMap(chapter => chapter.data.assessmentSets);
const items = new Map(originalSets.flatMap(set => set.items).map(item => [item.id, item]));
bank.chapters.forEach(chapter => chapter.patterns.forEach(pattern => [...pattern.variants, pattern.transfer].filter(Boolean).forEach(item => items.set(item.id, item))));
const wholeCheckIds = new Set([...originalSets.map(set => set.id), ...bank.chapters.map(chapter => chapter.id + '-check'), 'b3-mixed-check', bank.finalSet.id]);
const key = 'malti_topic_practice_v1';
const record = { attempts: 5, correct: 4, streak: 2, lastAt: '2026-10-01T12:00:00.000Z', dueAt: '2099-01-01T00:00:00.000Z', lastItemId: 'preserved-item', lastCorrect: true, spacedSuccesses: 2, lastSpacedSuccessAt: '2026-10-01T12:00:00.000Z' };
const legacyTopic = { tonina: { notes: 'Keep my earlier notes', position: 109, speed: '0.75' }, threeWords: { answers: { preserved: 'dar; kelb; ktieb' } }, mixedHistory: { preserved: { attempts: 7 } }, b3Revision: { drafts: { preserved: 'Personal B3 answer' }, futureMetadata: { keep: true }, core: { schemaVersion: 1, patterns: { 'preserved-pattern': { recognition: record, production: record } } } } };
const legacyExercises = { [originalSets.find(set => set.kind === 'checkpoint' && set.chapterId.startsWith('b2-')).id]: { attempts: 3, bestScore: 7, lastScore: 5, total: 13, passed: false, updatedAt: '2026-10-01T12:00:00.000Z' } };
const legacyCourse = { objectives: { 'b2-hobbies::future': true }, futureMetadata: { keep: true } };
const legacyTargets = { 'preserved-target': { attempts: 9, correct: 7, state: 'review', dueAt: '2099-01-01T00:00:00.000Z', modeStats: { recognition: { attempts: 5, correct: 4 }, production: { attempts: 4, correct: 3 } } } };
const legacyCards = { 'word::custom::study-sentinel': { id: 'word::custom::study-sentinel', type: 'word-card', maltese: 'ktieb', english: 'book', sourcePage: 'manual', topic: 'Personal', box: 4, reviewCount: 23, addedAt: '2020-01-01T00:00:00.000Z', lastReviewedAt: '2026-10-01T07:30:00.000Z', nextReviewAt: '2099-01-01T00:00:00.000Z', personalNote: 'Keep exactly' } };
const seeds = { [key]: legacyTopic, malti_exercise_progress_v1: legacyExercises, malti_course_progress_v1: legacyCourse, malti_course_target_progress_v1: legacyTargets, malti_review_cards_v2: legacyCards, malti_numbers_extended_v1: { keep: true } };
const report = { startedAt: new Date().toISOString(), checks: [], responsive: [], screenshots: [], runtimeErrors: [], httpErrors: [], requestFailures: [], auditRequests: [], auditConsoleErrors: [], navigationAborts: [] };
let browser, base;
async function check(name, action) {
  const started = Date.now();
  try { const detail = await action(); report.checks.push({ name, status: 'pass', elapsedMs: Date.now() - started, detail }); console.log('PASS ' + name); }
  catch (error) { report.checks.push({ name, status: 'fail', error: error.stack }); console.error('FAIL ' + name + ': ' + error.message); }
}
function track(page, label) {
  page.on('pageerror', error => report.runtimeErrors.push({ label, message: error.message }));
  page.on('response', response => {
    if (response.status() < 400) return;
    const item = { label, status: response.status(), url: response.url() };
    const clonedImport = page.__phase === 'audit' && /^\/(?:site|themes)\/[^/]+\.css$/.test(new URL(response.url()).pathname);
    (clonedImport ? report.auditRequests : report.httpErrors).push(item);
  });
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const item = { label, message: message.text(), location: message.location() };
    (page.__phase === 'audit' && message.text().includes('status of 404') ? report.auditConsoleErrors : report.runtimeErrors).push(item);
  });
  page.on('requestfailed', request => {
    const item = { label, phase: page.__phase, url: request.url(), error: request.failure() };
    const cancelled = request.failure()?.errorText === 'net::ERR_ABORTED' && ['navigation', 'closing', 'offline-transition'].includes(page.__phase);
    (cancelled ? report.navigationAborts : report.requestFailures).push(item);
  });
}
async function startServer() {
  const actualRoot = fs.realpathSync.native(root);
  const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.wasm': 'application/wasm', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
      if (pathname === '/__study-seed.html') { response.writeHead(200, { 'Content-Type': 'text/html' }); response.end('<!doctype html><html lang="en"><title>Study cache fixture</title><link rel="icon" href="/assets/img/favicon-option-speech.svg"><body>Test setup</body></html>'); return; }
      const file = path.resolve(actualRoot, pathname === '/' ? 'index.html' : '.' + pathname), relative = path.relative(actualRoot, file);
      if (relative.startsWith('..') || path.isAbsolute(relative)) { response.writeHead(403); response.end(); return; }
      const actual = await fs.promises.realpath(file), actualRelative = path.relative(actualRoot, actual);
      if (actualRelative.startsWith('..') || path.isAbsolute(actualRelative)) { response.writeHead(403); response.end(); return; }
      const data = await fs.promises.readFile(actual); response.writeHead(200, { 'Content-Type': mime[path.extname(actual)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); response.end(data);
    } catch (error) { response.writeHead(error.code === 'ENOENT' ? 404 : 500); response.end('Missing'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return server;
}
async function fixture(label, { width = 1280, theme = 'classic', serviceWorkers = false, topic = null } = {}) {
  const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 }, serviceWorkers: serviceWorkers ? 'allow' : 'block' });
  await context.addInitScript(({ seeds, theme, topic, key }) => {
    localStorage.setItem('malti_site_theme', theme);
    if (localStorage.getItem('__study_check_seeded')) return;
    for (const [name, data] of Object.entries(seeds)) localStorage.setItem(name, JSON.stringify(data));
    if (topic) localStorage.setItem(key, JSON.stringify({ ...seeds[key], studySession: topic }));
    localStorage.setItem('__study_check_seeded', 'true');
  }, { seeds, theme, topic, key });
  const page = await context.newPage(); track(page, label);
  return { context, page, close: async () => { page.__phase = 'closing'; await context.close(); } };
}
async function ready(page) {
  assert.equal(await page.locator('[data-study-root]').count(), 1, 'The study HTML must be returned at ' + page.url() + ' (received title: ' + await page.title() + ')');
  await page.locator('[data-study-root]').waitFor();
  await page.waitForFunction(() => document.querySelectorAll('[data-study-topic] option').length === 21 && !document.querySelector('[data-study-start]')?.disabled);
  await page.evaluate(async () => { await document.fonts.ready; });
}
async function open(page, suffix = '') { page.__phase = 'navigation'; await page.goto(base + '/today.html' + suffix, { waitUntil: 'networkidle' }); await ready(page); page.__phase = 'online'; }
const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const current = async page => { const state = (await stored(page)).studySession; const session = state.sessions?.[state.chapterId]; return { state, session, entry: session?.entries[session.index] }; };
async function reload(page, resume = false) { page.__phase = 'navigation'; await page.reload({ waitUntil: 'networkidle' }); await ready(page); page.__phase = 'online'; if (resume) { assert.match(await page.locator('[data-study-start]').innerText(), /Continue practice/); await start(page); } }
async function level(page, id, chapterId) {
  await page.locator('[data-study-level="' + id + '"]').click();
  await page.waitForFunction(id => document.querySelector('[data-study-level="' + id + '"]').ariaPressed === 'true' && !document.querySelector('[data-study-start]').disabled, id);
  if (chapterId) {
    const disclosure = page.locator('[data-study-topics]'); if (!await disclosure.evaluate(node => node.open)) await disclosure.locator(':scope > summary').click();
    await page.locator('[data-study-topic]').selectOption(chapterId);
    await page.waitForFunction(({ key, chapterId }) => JSON.parse(localStorage.getItem(key)).studySession.chapterId === chapterId && !document.querySelector('[data-study-start]').disabled, { key, chapterId });
  }
}
async function start(page) {
  await page.locator('[data-study-start]').click();
  await page.locator('[data-study-session]').waitFor({ state: 'visible' });
  await page.locator('[data-study-exercise] .exercise-item').waitFor({ state: 'visible' });
  const { session } = await current(page);
  assert.equal(session.entries.length, 6); assert.equal(new Set(session.entries.map(entry => entry.item.id)).size, 6);
  assert.equal(await page.locator('[data-study-exercise] .exercise-item:visible').count(), 1);
  session.entries.forEach(entry => assert(items.has(entry.item.id), 'Authored item identity ' + entry.item.id));
  return session;
}
async function answer(page, item, correct = true) {
  const container = page.locator('[data-study-exercise] [data-exercise-item="' + item.id + '"]');
  if (item.type === 'fill-blank') await container.locator('[data-exercise-answer]').fill(correct ? item.answer : 'definitely incorrect response');
  else if (item.type === 'multiple-choice' || item.type === 'true-false') {
    const choices = container.locator('input[type="radio"]'), values = await choices.evaluateAll(nodes => nodes.map(node => node.value));
    const index = values.findIndex(value => correct ? value.toLocaleLowerCase() === String(item.answer).toLocaleLowerCase() : value.toLocaleLowerCase() !== String(item.answer).toLocaleLowerCase());
    assert(index >= 0, 'A suitable authored choice exists'); await choices.nth(index).check();
  } else if (item.type === 'order-words') for (const token of item.tokens) await container.locator('.exercise-order-bank').getByRole('button', { name: token, exact: true }).first().click();
  else if (item.type === 'matching') for (const [index, pair] of item.pairs.entries()) await container.locator('select').nth(index).selectOption(pair.right);
  else throw Error('Unsupported authored task: ' + item.type);
}
async function submit(page, correct = true) {
  const before = await current(page); await answer(page, items.get(before.entry.item.id), correct);
  await page.locator('[data-study-exercise]').getByRole('button', { name: 'Check answers', exact: true }).click();
  await page.waitForFunction(({ key, id }) => { const state = JSON.parse(localStorage.getItem(key)).studySession; return state.sessions[state.chapterId].results[id]?.checked; }, { key, id: before.entry.item.id });
  assert.match(await page.locator('[data-study-exercise] .exercise-result').innerText(), correct ? /^1\/1/ : /^0\/1/);
  return before.entry;
}
async function next(page) { await page.locator('[data-study-next]').click(); }
async function jsonStorage(page, name) { return page.evaluate(name => JSON.parse(localStorage.getItem(name)), name); }
async function preserved(page) {
  assert.deepEqual(await jsonStorage(page, 'malti_review_cards_v2'), legacyCards, 'A mini-session must preserve original SRS cards');
  assert.deepEqual(await jsonStorage(page, 'malti_course_progress_v1'), legacyCourse, 'A mini-session must not tick whole chapter objectives');
  assert.deepEqual(await jsonStorage(page, 'malti_numbers_extended_v1'), { keep: true });
  const exercises = await jsonStorage(page, 'malti_exercise_progress_v1');
  for (const id of wholeCheckIds) assert.deepEqual(exercises[id], legacyExercises[id], 'A single step must not pass whole checkpoint ' + id);
  const state = await stored(page);
  for (const name of ['tonina', 'threeWords', 'mixedHistory']) assert.deepEqual(state[name], legacyTopic[name], 'Unrelated topic data preserved: ' + name);
  for (const name of ['drafts', 'futureMetadata']) assert.deepEqual(state.b3Revision[name], legacyTopic.b3Revision[name]);
  assert.deepEqual(state.b3Revision.core.patterns['preserved-pattern'], legacyTopic.b3Revision.core.patterns['preserved-pattern']);
  assert.deepEqual((await jsonStorage(page, 'malti_course_target_progress_v1'))['preserved-target'], legacyTargets['preserved-target']);
}
async function capture(page, name) { await page.screenshot({ path: path.join(output, name), animations: 'disabled' }); report.screenshots.push(name); }
async function axe(page) {
  page.__phase = 'audit';
  try {
    await page.addScriptTag({ path: path.join(root, 'node_modules/axe-core/axe.min.js') });
    return await page.evaluate(async () => (await window.axe.run({ include: ['[data-study-root]'] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations.map(issue => ({ id: issue.id, impact: issue.impact, nodes: issue.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })));
  } finally { await page.waitForLoadState('networkidle'); page.__phase = 'online'; }
}
async function main() {
  const server = process.env.STUDY_TEST_URL ? null : await startServer();
  base = process.env.STUDY_TEST_URL || 'http://127.0.0.1:' + server.address().port; report.base = base;
  const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  browser = await chromium.launch(process.env.PLAYWRIGHT_USE_BUNDLED === '1' || !fs.existsSync(chrome) ? {} : { executablePath: chrome });
  try {
    for (const width of [320, 390, 1280]) for (const theme of ['classic', 'forest', 'contrast']) await check('First-screen Continue, keyboard and accessibility ' + width + ' ' + theme, async () => {
      const f = await fixture('home-' + width + '-' + theme, { width, theme });
      try {
        await open(f.page);
        assert.equal(await f.page.locator('[data-study-start]:visible').count(), 1);
        const bounds = await f.page.locator('[data-study-start]').evaluate(button => { const r = button.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, height: r.height, width: innerWidth, viewportHeight: innerHeight, topmost: button.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) }; });
        assert(bounds.y >= 0 && bounds.bottom <= bounds.viewportHeight && bounds.x >= 0 && bounds.right <= bounds.width && bounds.topmost, 'Continue is visible and unobstructed: ' + JSON.stringify(bounds));
        if (width < 600) assert(bounds.height >= 44, 'Shared mobile target is at least44px');
        assert.equal(await f.page.evaluate(() => document.documentElement.dataset.theme), theme);
        assert.equal(await f.page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
        assert.equal(await f.page.locator('[data-study-parent]').evaluate(node => node.open), false);
        assert.equal(await f.page.locator('[data-study-level][aria-pressed="true"]').count(), 1);
        assert.equal(await f.page.locator('[data-study-topic] option').evaluateAll(options => options.filter(option => !option.hidden && !option.disabled).length), 7);
        await f.page.locator('[data-study-start]').focus(); assert.equal(await f.page.locator('[data-study-start]').evaluate(node => node === document.activeElement), true);
        await capture(f.page, 'study-home-' + width + '-' + theme + '.png');
        const violations = await axe(f.page); assert.deepEqual(violations, []);
        report.responsive.push({ width, theme, bounds, axeViolations: 0 }); return bounds;
      } finally { await f.close(); }
    });

    await check('Wrong/retry, hint and ask-parent remain honest; six steps finish without legacy checkpoint or SRS changes', async () => {
      const f = await fixture('six-step-session');
      try {
        const page = f.page; await open(page); await level(page, 'b1', 'b1-colours'); const initial = await start(page);
        assert.equal(await page.locator('[data-study-next]').isDisabled(), true);
        const beforeEmpty = await jsonStorage(page, 'malti_course_target_progress_v1'); await page.locator('[data-study-exercise]').getByRole('button', { name: 'Check answers', exact: true }).click(); assert.match(await page.locator('[data-study-feedback]').innerText(), /Choose or write an answer first/); assert.equal((await current(page)).session.index, 0); assert.equal((await current(page)).session.results[initial.entries[0].item.id], undefined); assert.deepEqual(await jsonStorage(page, 'malti_course_target_progress_v1'), beforeEmpty);
        const wrong = await submit(page, false), wrongProgress = await jsonStorage(page, 'malti_course_target_progress_v1');
        assert.equal((await current(page)).session.index, 0, 'Feedback does not silently advance');
        await page.locator('[data-study-exercise]').getByRole('button', { name: 'Try again', exact: true }).click(); await submit(page);
        const retried = (await current(page)).session.results[wrong.item.id]; assert.equal(retried.assisted, true); assert.equal(retried.attempts, 2);
        for (const target of wrong.item.targetIds || []) assert.deepEqual((await jsonStorage(page, 'malti_course_target_progress_v1'))[target], wrongProgress[target], 'Seeing the model must not earn extra independent target credit');
        const checkedFeedback = await page.locator('[data-study-exercise] .exercise-feedback').innerText();
        await reload(page, true); assert.equal(await page.locator('[data-study-exercise] .exercise-feedback').innerText(), checkedFeedback); assert.equal((await current(page)).session.results[wrong.item.id].attempts, 2);
        await next(page);
        const draftId = (await current(page)).entry.item.id; assert.equal(items.get(draftId).type, 'fill-blank');
        await page.locator('[data-study-exercise] [data-exercise-answer]').fill('unfinished personal answer');
        await page.waitForFunction(({ key, draftId }) => { const state = JSON.parse(localStorage.getItem(key)).studySession; return state.sessions[state.chapterId].drafts[draftId] === 'unfinished personal answer'; }, { key, draftId });
        await reload(page, true);
        assert.equal((await current(page)).entry.item.id, draftId); assert.equal(await page.locator('[data-study-exercise] [data-exercise-answer]').inputValue(), 'unfinished personal answer');
        await page.locator('[data-study-back]').click();
        const b2 = course.levels.find(level => level.id === 'b2').chapters[1].id;
        await level(page, 'b2', b2); await start(page); const parkedB2 = (await current(page)).entry.item.id; await answer(page, items.get(parkedB2), false); const parkedB2Answer = await page.locator('[data-study-exercise] input[type="radio"]:checked').inputValue(); await page.locator('[data-study-back]').click();
        await level(page, 'b3', bank.chapters[1].id); await start(page); await page.locator('[data-study-back]').click();
        await level(page, 'b1'); assert.equal(await page.locator('[data-study-topic]').inputValue(), 'b1-colours'); await start(page); assert.equal((await current(page)).entry.item.id, draftId); assert.equal(await page.locator('[data-study-exercise] [data-exercise-answer]').inputValue(), 'unfinished personal answer');
        const beforeHint = await jsonStorage(page, 'malti_course_target_progress_v1'); await page.locator('[data-study-hint]').click(); assert.equal(await page.locator('[data-study-help]').isVisible(), true); assert.equal(await page.locator('[data-study-help-mt]').isHidden(), true); await page.locator('[data-study-model]').click(); assert.equal(await page.locator('[data-study-help-mt]').isVisible(), true); assert.equal(await page.locator('[data-study-help-en]').isVisible(), true); assert((await page.locator('[data-study-help-mt]').innerText()).trim()); assert((await page.locator('[data-study-help-en]').innerText()).trim()); await submit(page);
        const hinted = (await current(page)).session.results[draftId]; assert.equal(hinted.assisted, true); for (const target of items.get(draftId).targetIds || []) assert.deepEqual((await jsonStorage(page, 'malti_course_target_progress_v1'))[target], beforeHint[target]); await next(page);
        const skipped = (await current(page)).entry; const beforeAsk = await jsonStorage(page, 'malti_course_target_progress_v1'); await page.locator('[data-study-ask]').click();
        const afterAsk = await current(page); assert.equal(afterAsk.session.index, 3); assert.equal(afterAsk.session.results[skipped.item.id].deferred, true); assert.equal(afterAsk.session.results[skipped.item.id].correct, null); assert.deepEqual(await jsonStorage(page, 'malti_course_target_progress_v1'), beforeAsk);
        for (let step = 3; step < 6; step++) { const entry = await submit(page); const attempt = (await current(page)).session.results[entry.item.id].attempts; const targets = await jsonStorage(page, 'malti_course_target_progress_v1'); await page.locator('[data-study-exercise] form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))); assert.equal((await current(page)).session.results[entry.item.id].attempts, attempt, 'Duplicate native submit does not double count'); assert.deepEqual(await jsonStorage(page, 'malti_course_target_progress_v1'), targets); await next(page); }
        await page.locator('[data-study-finish]').waitFor({ state: 'visible' }); const complete = (await current(page)).session;
        assert.equal(complete.index, 6); assert(complete.completedAt); const results = Object.values(complete.results);
        assert.equal(results.filter(result => result.checked && result.correct && !result.assisted).length, 3); assert.equal(results.filter(result => result.checked && result.correct).length, 5); assert.equal(results.filter(result => result.deferred).length, 1);
        assert.equal(await page.locator('[data-study-result]').innerText(), '5 answers checked out of 6: 3 correct on your own and 2 correct with help.'); assert.match(await page.locator('[data-study-result-help]').innerText(), /1 question(?:s)? left for a parent/); await preserved(page); assert.deepEqual(await axe(page), []);
        await capture(page, 'study-finish-honest.png');
        const beforeReload = (await stored(page)).studySession.completedSessions; await reload(page); assert.deepEqual((await stored(page)).studySession.completedSessions, beforeReload, 'Reload does not duplicate completed sessions');
        await page.locator('[data-study-parent] > summary').click(); const resolvedKey = await page.locator('[data-study-help-slot]:visible').first().getAttribute('data-help-key'); await page.locator('[data-study-help-slot]:visible [data-help-resolve]').first().click(); await level(page, 'b2'); assert.equal(await page.locator('[data-study-topic]').inputValue(), b2); await start(page); assert.equal((await current(page)).entry.item.id, parkedB2); assert.equal(await page.locator('[data-study-exercise] input[type="radio"]:checked').inputValue(), parkedB2Answer); assert(!(await stored(page)).studySession.helpQueue.some(entry => [entry.routeId, entry.chapterId, entry.skillId || entry.itemId, entry.mode].join('::') === resolvedKey), 'A parked session must not resurrect a resolved parent request');
        await page.addScriptTag({ url: base + '/assets/js/progress-backup.js' }); const exported = await page.evaluate(key => JSON.parse(window.MaltiProgressBackup.exportBackup().data[key]), key); assert.deepEqual(exported.studySession, (await stored(page)).studySession); assert.deepEqual(exported.tonina, legacyTopic.tonina); await preserved(page);
        return { tasks: 6, independentCorrect: 3, correctWithHelp: 2, deferred: 1, parkedTopics: ['b1-colours', b2, bank.chapters[1].id], ids: initial.entries.map(entry => entry.item.id) };
      } finally { await f.close(); }
    });

    await check('All six B2 steps independently grade while original full checkpoints remain untouched', async () => {
      const f = await fixture('b2-independent');
      try { const page = f.page; await open(page); await level(page, 'b2', course.levels.find(level => level.id === 'b2').chapters[0].id); await start(page); for (let step = 0; step < 6; step++) { await submit(page); await next(page); } await page.locator('[data-study-finish]').waitFor({ state: 'visible' }); const session = (await current(page)).session; assert.equal(Object.values(session.results).filter(result => result.correct && !result.assisted).length, 6); await preserved(page); return { independentlyCorrect: 6 }; } finally { await f.close(); }
    });

    await check('Explicit entry level, changed topic, reload and legacy chapter URLs preserve the selected parked draft', async () => {
      const f = await fixture('canonical-entry-url');
      try {
        const page = f.page; await open(page, '?level=b3'); assert.equal((await stored(page)).studySession.levelId, 'b3');
        await level(page, 'b1', 'b1-colours');
        let url = new URL(page.url()); assert.equal(url.searchParams.get('level'), 'b1'); assert.equal(url.searchParams.get('topic'), 'b1-colours'); assert.equal(url.searchParams.has('chapter'), false);
        const session = await start(page), itemId = session.entries[0].item.id; await answer(page, items.get(itemId), false); const draft = await page.locator('[data-study-exercise] input[type="radio"]:checked').inputValue();
        await reload(page); assert.equal((await stored(page)).studySession.levelId, 'b1'); assert.equal(await page.locator('[data-study-topic]').inputValue(), 'b1-colours'); assert.match(await page.locator('[data-study-start]').innerText(), /Continue practice/); await start(page); assert.equal((await current(page)).session.id, session.id); assert.equal((await current(page)).entry.item.id, itemId); assert.equal(await page.locator('[data-study-exercise] input[type="radio"]:checked').inputValue(), draft);
        await open(page, '?level=b3&chapter=' + bank.chapters[1].id); url = new URL(page.url()); assert.equal(url.searchParams.get('level'), 'b3'); assert.equal(url.searchParams.get('topic'), bank.chapters[1].id); assert.equal(url.searchParams.has('chapter'), false);
        await level(page, 'b1'); assert.equal(await page.locator('[data-study-topic]').inputValue(), 'b1-colours'); await reload(page); assert.equal((await stored(page)).studySession.levelId, 'b1'); await start(page); assert.equal((await current(page)).session.id, session.id); assert.equal(await page.locator('[data-study-exercise] input[type="radio"]:checked').inputValue(), draft);
        await preserved(page); return { entryLevel: 'b3', switchedLevel: 'b1', topic: 'b1-colours', restoredSession: session.id, draftPreserved: true, legacyChapterCanonicalized: true };
      } finally { await f.close(); }
    });

    await check('B3 writes only independent pattern results and preserves previous B3 drafts, metadata and SRS', async () => {
      const f = await fixture('b3-pattern-progress');
      try { const page = f.page; await open(page); await level(page, 'b3', bank.chapters[0].id); await start(page); const independent = await submit(page); const state = await stored(page), result = state.b3Revision.core.patterns[independent.skillId][independent.mode]; assert.equal(result.attempts, 1); assert.equal(result.correct, 1); assert.equal(result.spacedSuccesses, 1); await next(page); const beforeHelp = (await stored(page)).b3Revision.core; await page.locator('[data-study-hint]').click(); await submit(page); assert.deepEqual((await stored(page)).b3Revision.core, beforeHelp, 'Helped B3 answers must not earn independent credit'); assert.deepEqual(await axe(page), []); await next(page); await page.locator('[data-study-ask]').click(); assert.deepEqual((await stored(page)).b3Revision.core, beforeHelp); await preserved(page); await capture(page, 'study-b3-task.png'); return { pattern: independent.skillId, mode: independent.mode, independentAttempts: 1, independentSpacedSuccesses: 1 }; } finally { await f.close(); }
    });

    await check('Parent assignment, manual help pagination and resolution persist without grading', async () => {
      const chapter = chapterFiles[0], authored = chapter.data.assessmentSets.filter(set => set.kind === 'checkpoint').flatMap(set => set.items), seen = new Set();
      const queue = authored.filter(item => { const id = item.targetIds?.[0] + '::' + item.assessmentMode; if (item.type === 'matching' || !item.targetIds?.length || seen.has(id)) return false; seen.add(id); return true; }).slice(0, 7).map(item => ({ routeId: chapter.levelId, chapterId: chapter.id, itemId: item.id, skillId: item.targetIds[0], mode: item.assessmentMode, prompt: item.prompt, reason: 'help', addedAt: '2026-11-01T12:00:00.000Z' }));
      assert.equal(queue.length, 7);
      const topic = { schemaVersion: 1, levelId: 'b1', chapterId: chapter.id, topicsByLevel: { b1: chapter.id }, assignment: null, sessions: {}, helpQueue: queue, completedSessions: [] };
      const f = await fixture('parent-queue', { topic });
      try { const page = f.page; await open(page); await page.locator('[data-study-parent] > summary').click(); assert.equal(await page.locator('[data-study-help-slot]:visible').count(), 6); assert.equal(await page.locator('[data-help-prev]').isDisabled(), true); await page.locator('[data-study-parent] > summary').evaluate(node => node.scrollIntoView({ block: 'start' })); await capture(page, 'study-parent-queue.png'); await page.locator('[data-help-next]').click(); assert.equal(await page.locator('[data-study-help-slot]:visible').count(), 1); const progressBefore = await jsonStorage(page, 'malti_course_target_progress_v1'); await page.locator('[data-study-help-slot]:visible [data-help-resolve]').click(); assert.equal((await stored(page)).studySession.helpQueue.length, 6); assert.deepEqual(await jsonStorage(page, 'malti_course_target_progress_v1'), progressBefore, 'Parent resolution is not a scored answer'); const assignment = bank.chapters[1].id; await page.locator('[data-study-assignment]').selectOption(assignment); await page.locator('[data-study-assign]').click(); await reload(page); assert.equal((await stored(page)).studySession.assignment.chapterId || (await stored(page)).studySession.assignment, assignment); await start(page); const session = (await current(page)).session; assert.equal(session.routeId, 'b3'); assert.equal(session.chapterId, assignment); await preserved(page); await capture(page, 'study-parent-assigned.png'); return { queued: 7, displayedPerPage: 6, afterResolve: 6, assignedChapter: assignment }; } finally { await f.close(); }
    });

    await check('Actual service worker resumes a draft and completes the current six-step session offline', async () => {
      const f = await fixture('offline', { serviceWorkers: true, width: 390 });
      try {
        const page = f.page; await page.goto(base + '/__study-seed.html'); const workerResponse = await f.context.request.get(base + '/service-worker.js'), workerText = await workerResponse.text(); assert.equal(workerResponse.status(), 200); assert.equal(workerText, fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8')); const workerSha256 = createHash('sha256').update(workerText).digest('hex'); await page.evaluate(async () => { await navigator.serviceWorker.register('./service-worker.js'); await navigator.serviceWorker.ready; }); await page.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated');
        await open(page); await level(page, 'b1', 'b1-colours'); await start(page); await submit(page); await next(page); const draftId = (await current(page)).entry.item.id; await page.locator('[data-study-exercise] [data-exercise-answer]').fill('offline draft');
        await page.waitForLoadState('networkidle'); page.__phase = 'offline-transition'; await f.context.setOffline(true); await reload(page, true); assert.equal((await current(page)).entry.item.id, draftId); assert.equal(await page.locator('[data-study-exercise] [data-exercise-answer]').inputValue(), 'offline draft'); await capture(page, 'study-offline-draft-390.png'); for (let step = 1; step < 6; step++) { await submit(page); await next(page); } await page.locator('[data-study-finish]').waitFor({ state: 'visible' }); await preserved(page); await capture(page, 'study-offline-finish.png'); return { controlled: true, workerSha256, workerRevision: workerText.match(/const CACHE_NAME = `\$\{CACHE_PREFIX\}([a-f0-9]+)`;/)?.[1], resumedDraft: true, finishedOffline: true, tasks: 6 };
      } finally { await f.close(); }
    });

    await check('No unexpected runtime or resource failures', () => { assert.deepEqual(report.runtimeErrors, []); assert.deepEqual(report.httpErrors, []); assert.deepEqual(report.requestFailures, []); return { runtime: 0, http: 0, failedRequests: 0 }; });
  } finally {
    await browser.close(); if (server) await new Promise(resolve => server.close(resolve)); report.completedAt = new Date().toISOString(); report.status = report.checks.some(result => result.status === 'fail') ? 'FAIL' : 'PASS'; fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n'); console.log(report.status + ': ' + report.checks.length + ' checks; ' + report.responsive.length + ' responsive/theme/a11y cases');
  }
  if (report.status !== 'PASS') process.exitCode = 1;
}
main().catch(error => { report.fatal = error.stack; report.status = 'FAIL'; fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n'); console.error(error); process.exitCode = 1; });
