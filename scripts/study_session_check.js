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
const lesson05 = read('assets/data/lesson05_exercises.json').sets.find(set => set.id === 'lesson05-mixed');
const chapterFiles = course.levels.flatMap(level => level.chapters.map(chapter => ({ ...chapter, levelId: level.id, data: read('assets/data/course/chapters/' + chapter.id + '.json') })));
const originalSets = chapterFiles.flatMap(chapter => chapter.data.assessmentSets);
const items = new Map(originalSets.flatMap(set => set.items).map(item => [item.id, item]));
bank.chapters.forEach(chapter => chapter.patterns.forEach(pattern => [...pattern.variants, pattern.transfer].filter(Boolean).forEach(item => items.set(item.id, item))));
lesson05.items.forEach(item => items.set(item.id, item));
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
async function fixture(label, { width = 1280, theme = 'classic', serviceWorkers = false, topic = null, hasTouch = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 }, serviceWorkers: serviceWorkers ? 'allow' : 'block', hasTouch });
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
  await page.waitForFunction(() => document.querySelector('[data-study-topic]').value && !document.querySelector('[data-study-start]')?.disabled);
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
async function start(page, size = 6) {
  await page.locator('[data-study-start]').click();
  await page.locator('[data-study-session]').waitFor({ state: 'visible' });
  await page.locator('[data-study-exercise] .exercise-item').waitFor({ state: 'visible' });
  const { session } = await current(page);
  assert.equal(session.entries.length, size); assert.equal(new Set(session.entries.map(entry => entry.item.id)).size, size);
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
async function submit(page, correct = true, sentence) {
  const before = await current(page);
  if (sentence === undefined) await answer(page, items.get(before.entry.item.id), correct);
  else await page.locator('[data-study-exercise] [data-exercise-answer]').fill(sentence);
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
      const f = await fixture('six-step-session', { width: 390 });
      try {
        const page = f.page; await open(page); await level(page, 'b1', 'b1-colours');
        assert.match(await page.locator('[data-study-goal]').innerText(), /colour of clothes/);
        assert.equal(await page.locator('[data-study-warmup]').evaluate(node => node.open), true);
        assert.equal(await page.locator('[data-study-phrase]:visible').count(), 4);
        assert.match(await page.locator('[data-study-warmup-tip]').innerText(), /feminine/);
        await page.evaluate(() => window.scrollTo(0, 0));
        await capture(page, 'study-colours-warmup.png');
        const initial = await start(page);
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
        const beforeHint = await jsonStorage(page, 'malti_course_target_progress_v1');
        const solution = items.get(draftId).answer;
        assert.equal(await page.locator('[data-study-model]').isHidden(), true);
        await page.locator('[data-study-hint]').click();
        assert.match(await page.locator('[data-study-help]').innerText(), /Kaxxa|kaxxa/);
        assert(!((await page.locator('[data-study-help]').innerText()).includes(solution)), 'The first clue does not reveal the answer');
        assert.equal(await page.locator('[data-study-help-mt]').isHidden(), true);
        assert.equal(await page.locator('[data-study-solution]').isHidden(), true);
        await page.locator('[data-study-model]').click();
        assert.match(await page.locator('[data-study-help-mt]').innerText(), /flokk.*libsa/);
        assert(!((await page.locator('[data-study-help]').innerText()).includes(solution)), 'The worked contrast uses a different colour');
        assert.equal(await page.locator('[data-study-help-answer]').isHidden(), true);
        await reload(page, true);
        assert.equal(await page.locator('[data-study-model]').getAttribute('aria-expanded'), 'true');
        await page.locator('[data-study-help]').evaluate(node => node.scrollIntoView({ block: 'center' }));
        await capture(page, 'study-colours-staged-hint.png');
        await page.locator('[data-study-solution]').click();
        assert((await page.locator('[data-study-help-answer]').innerText()).includes(solution));
        await submit(page);
        const hinted = (await current(page)).session.results[draftId]; assert.equal(hinted.assisted, true);
        for (const target of items.get(draftId).targetIds || []) assert.deepEqual((await jsonStorage(page, 'malti_course_target_progress_v1'))[target], beforeHint[target]);
        assert.match(await page.locator('[data-study-transfer-prompt]').innerText(), /Il-qmis hija ___/);
        assert.equal(await page.locator('[data-study-transfer-mt]').isHidden(), true);
        await page.locator('[data-study-transfer-model] > summary').click();
        assert.equal(await page.locator('[data-study-transfer-mt]').innerText(), `Il-qmis hija ${solution}.`);
        assert.deepEqual(await jsonStorage(page, 'malti_course_target_progress_v1'), beforeHint);
        await next(page);
        const skipped = (await current(page)).entry; const beforeAsk = await jsonStorage(page, 'malti_course_target_progress_v1'); await page.locator('[data-study-ask]').click();
        const afterAsk = await current(page); assert.equal(afterAsk.session.index, 3); assert.equal(afterAsk.session.results[skipped.item.id].deferred, true); assert.equal(afterAsk.session.results[skipped.item.id].correct, null); assert.deepEqual(await jsonStorage(page, 'malti_course_target_progress_v1'), beforeAsk);
        for (let step = 3; step < 6; step++) { const entry = await submit(page); const attempt = (await current(page)).session.results[entry.item.id].attempts; const targets = await jsonStorage(page, 'malti_course_target_progress_v1'); await page.locator('[data-study-exercise] form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))); assert.equal((await current(page)).session.results[entry.item.id].attempts, attempt, 'Duplicate native submit does not double count'); assert.deepEqual(await jsonStorage(page, 'malti_course_target_progress_v1'), targets); await next(page); }
        await page.locator('[data-study-finish]').waitFor({ state: 'visible' }); const complete = (await current(page)).session;
        assert.equal(complete.index, 6); assert(complete.completedAt); const results = Object.values(complete.results);
        assert.equal(results.filter(result => result.checked && result.correct && !result.assisted).length, 3); assert.equal(results.filter(result => result.checked && result.correct).length, 5); assert.equal(results.filter(result => result.deferred).length, 1);
        assert.equal(await page.locator('[data-study-result]').innerText(), '5 answers checked out of 6: 3 correct on your own and 2 correct with help.'); assert.match(await page.locator('[data-study-result-help]').innerText(), /1 question(?:s)? left for a parent/); await preserved(page); assert.deepEqual(await axe(page), []);
        await capture(page, 'study-finish-honest.png');
        const beforeReload = (await stored(page)).studySession.completedSessions; await reload(page); assert.deepEqual((await stored(page)).studySession.completedSessions, beforeReload, 'Reload does not duplicate completed sessions');
        assert.equal(await page.locator('[data-study-warmup]').evaluate(node => node.open), false, 'Review can start without redoing the mini-lesson');
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

    await check('Lesson 05 grades 12 whole sentences and repeats only missed, assisted or deferred answers', async () => {
      const f = await fixture('lesson05-mixed', { width: 390 });
      try {
        const page = f.page;
        await page.goto(base + '/noun_plurals.html#practice');
        await page.getByRole('link', { name: 'Start Lesson 05 mixed practice' }).click();
        await ready(page);
        const initial = await start(page, 12);
        const [missed, assisted, skipped] = lesson05.items;
        const reading = page.getByRole('link', { name: 'Read Il-Festi (new tab)' });
        const model = page.locator('[data-study-checked-answer]');
        async function expectModel(item) {
          assert(await model.isVisible());
          assert.equal(await model.locator('[lang="mt"]').innerText(), item.answer + '.');
          assert(item.answerTranslation);
          assert.equal(await model.locator('[lang="en"]').innerText(), item.answerTranslation);
        }
        assert.equal(await reading.count(), 0);
        assert.equal(await model.isVisible(), false);
        await submit(page, false, 'Boċċi ħodor');
        const feedback = page.locator('[data-study-exercise] .exercise-feedback');
        await expectModel(missed);
        assert((await feedback.innerText()).includes(missed.explanation));
        await reload(page);
        const resumed = await start(page, 12);
        assert.equal(resumed.id, initial.id);
        await expectModel(missed);
        assert((await feedback.innerText()).includes(missed.explanation));
        await next(page);

        await page.locator('[data-study-hint]').click();
        assert.equal(await model.isVisible(), false);
        assert.equal(await page.locator('[data-study-help-explanation]').innerText(), assisted.hint);
        await submit(page);
        await expectModel(assisted);
        await next(page);
        await page.getByRole('button', { name: 'Save for later' }).click();
        for (const item of lesson05.items.slice(3)) {
          assert.equal((await current(page)).entry.item.id, item.id);
          if (item.sourcePage.endsWith('#lesson05-il-festi')) assert.equal(await reading.isVisible(), true);
          await submit(page);
          await expectModel(item);
          await next(page);
        }
        assert.equal(await page.locator('[data-study-new]').innerText(), 'Repeat 3 questions');
        await reload(page);
        assert.equal(await page.locator('[data-study-start]').innerText(), 'Repeat 3 questions');
        const repeats = await start(page, 3);
        assert.deepEqual(repeats.entries.map(entry => entry.item.id), [missed.id, assisted.id, skipped.id]);
        assert.equal(await model.isVisible(), false);
        await submit(page, true, missed.accepted[1] + '.');
        await expectModel(missed);
        await next(page);
        for (const item of [assisted, skipped]) {
          assert.equal((await current(page)).entry.item.id, item.id);
          await submit(page);
          await expectModel(item);
          await next(page);
        }
        assert.equal(await page.locator('[data-study-new]').innerText(), 'Start full practice again');
        assert.deepEqual((await stored(page)).studySession.helpQueue, []);
        await preserved(page);
        await page.locator('[data-study-new]').click();
        await page.locator('[data-study-session]').waitFor({ state: 'visible' });
        assert.equal(await page.locator('[data-study-step-status]').innerText(), 'Question 1 of 12');
        assert.deepEqual(await axe(page), []);
        return { initial: 12, repeated: 3, cleared: true };
      } finally { await f.close(); }
    });

    await check('Route game checks written directions and updates live directions with every move', async () => {
      const f = await fixture('route-game', { width: 390 });
      try {
        const page = f.page;
        await page.addInitScript(() => { if (location.pathname.endsWith('/route_game.html')) Math.random = () => 0; });
        await page.goto(base + '/directions_town.html#lesson05-routes');
        await page.getByRole('link', { name: 'Play the Maltese Route Game' }).click();
        await page.waitForFunction(() => Boolean(document.querySelector('[data-route-start-name]')?.textContent));
        const position = page.locator('[data-route-position]');
        const feedback = page.locator('[data-route-feedback]');
        const model = page.locator('[data-route-model]');
        const write = page.getByRole('textbox', { name: 'Your directions' });
        const straight = page.getByRole('button', { name: 'Go straight' });
        const left = page.getByRole('button', { name: 'Turn left' });
        const right = page.getByRole('button', { name: 'Turn right' });
        const undo = page.getByRole('button', { name: 'Undo last move' });
        const verify = page.getByRole('button', { name: 'Check route' });
        const newRoute = page.getByRole('button', { name: 'New route' });
        assert.equal(await page.locator('[data-route-start-name]').innerText(), 'Il-posta');
        assert.equal(await page.locator('[data-route-goal-name]').innerText(), 'L-iskola');
        assert.equal(await page.locator('[data-route-start-heading]').innerText(), 'Start facing east');
        await verify.click();
        assert.match(await feedback.innerText(), /Keep going/);
        assert.equal(await model.isVisible(), false);
        await left.click();
        assert.match(await position.innerText(), /no road/);
        await straight.focus(); await straight.press('Enter');
        assert.match(await position.innerText(), /Il-knisja.*1 block/);
        await undo.click();
        assert.match(await position.innerText(), /Il-posta.*0 blocks/);
        await straight.click(); await straight.click(); await right.click();
        assert.equal(await page.locator('[data-route-trail]').evaluate(line => line.points.numberOfItems), 4);
        await verify.click();
        assert.equal(await write.evaluate(node => node === document.activeElement), true);
        assert.equal(await model.isVisible(), false);
        await write.fill("Ibqa' sejjer dritt. Dur fuq il-lemin.");
        await verify.click();
        assert.match(await feedback.innerText(), /reaches the goal/);
        assert.match(await model.locator('[lang="mt"]').innerText(), /aqsam triq waħda.*ħdejn il-knisja.*il-lemin.*ħdejn l-iskola/i);
        assert.match(await model.locator('[lang="en"]').innerText(), /one side street.*the church.*right at the corner by the bakery.*the school/);
        await undo.click(); await undo.click(); await right.click(); await left.click();
        await write.fill('Dur fuq il-lemin ħdejn il-knisja u mbagħad dur fuq ix-xellug ħdejn il-pjazza.');
        await verify.click();
        assert.match(await model.locator('[lang="en"]').innerText(), /right at the corner by the church.*left at the corner by the square.*the school/);
        await newRoute.click();
        assert.equal(await page.locator('[data-route-goal-name]').innerText(), 'Il-klinika');
        assert.equal(await write.inputValue(), '');
        assert.equal(await model.isVisible(), false);
        await straight.click(); await straight.click(); await straight.click(); await right.click();
        await write.fill('Aqsam żewġ toroq. Dur fuq il-lemin.');
        await verify.click();
        assert.match(await model.locator('[lang="en"]').innerText(), /two side streets.*the church.*the bakery.*the clinic/);

        await newRoute.click();
        const liveMode = page.getByRole('button', { name: 'Live directions', exact: true });
        const writeMode = page.getByRole('button', { name: 'Write your own', exact: true });
        const english = model.locator('[lang="en"]');
        await write.fill('Draft to keep');
        await liveMode.focus(); await liveMode.press('Enter');
        assert.equal(await liveMode.getAttribute('aria-pressed'), 'true');
        assert.equal(await write.isVisible(), false);
        assert.equal(await verify.isVisible(), false);
        assert.equal(await model.isVisible(), false);
        await straight.click();
        assert.equal(await model.isVisible(), true);
        assert.match(await model.locator('[lang="mt"]').innerText(), /tasal ħdejn il-knisja/);
        assert.match(await english.innerText(), /reach the church/);
        const firstStep = await english.innerText();
        await left.click();
        assert.equal(await english.innerText(), firstStep);
        await straight.click();
        assert.match(await english.innerText(), /reach the bakery.*one side street.*go past the church/i);
        await undo.click();
        assert.equal(await english.innerText(), firstStep);
        await writeMode.click();
        assert.equal(await write.inputValue(), 'Draft to keep');
        assert.equal(await model.isVisible(), false);
        await liveMode.click();
        assert.equal(await english.innerText(), firstStep);
        await straight.click(); await right.click();
        assert.match(await english.innerText(), /right at the corner by the bakery.*the school/);
        assert.equal(await feedback.innerText(), 'You reached the goal.');
        await newRoute.click();
        assert.equal(await liveMode.getAttribute('aria-pressed'), 'true');
        assert.equal(await model.isVisible(), false);
        assert.equal(await page.locator('[data-route-live-empty]').isVisible(), true);
        return { keyboard: true, alternatePath: true, oneAndTwoCrossings: true, reroll: true, liveUpdates: true };
      } finally { await f.close(); }
    });

    await check('Map taps, mobile directions and route challenges share the same route state', async () => {
      const f = await fixture('route-challenges', { width: 390, hasTouch: true });
      try {
        const page = f.page;
        await page.addInitScript(() => { Math.random = () => 0; });
        await page.goto(base + '/route_game.html', { waitUntil: 'networkidle' });
        const button = name => page.getByRole('button', { name, exact: true });
        const node = id => page.locator('[data-route-node="' + id + '"]');
        const position = page.locator('[data-route-position]');
        const model = page.locator('[data-route-model-en]');
        const feedback = page.locator('[data-route-feedback]');
        const challenge = page.locator('[data-route-challenge]');
        const requirement = challenge.locator('[data-route-challenge-en]');
        const progress = challenge.locator('[data-route-challenge-status]');
        await button('Live directions').tap();
        assert(await model.evaluate(element => element.closest('[data-route-inline]')?.previousElementSibling.matches('[aria-label="Route controls"]')));
        await node(6).tap();
        assert.match(await position.innerText(), /one block away.*0 blocks/);
        assert.equal(await page.locator('[data-route-dot="1"]').evaluate(dot => dot.r.baseVal.value), 8);
        await node(1).tap();
        assert.match(await model.innerText(), /reach the church/);
        assert.equal(await page.locator('[data-route-start-ring]').evaluate(ring => ring.r.baseVal.value), 18);
        await button('Turn back').focus(); await button('Turn back').press('Enter');
        assert.match(await model.innerText(), /Turn back by the church.*reach the post office/);
        await button('Undo last move').tap();
        assert.match(await position.innerText(), /Il-knisja.*1 block/);
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.waitForFunction(() => document.querySelector('[data-route-side] [data-route-model-en]'));
        assert.match(await model.innerText(), /reach the church/);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForFunction(() => document.querySelector('[data-route-inline] [data-route-model-en]'));

        await button('New challenge').tap();
        assert.match(await requirement.innerText(), /church.*turn right at the third street/);
        await node(1).tap(); await node(5).tap(); await node(6).tap(); await node(7).tap();
        assert.match(await progress.innerText(), /turned too early/);
        assert.match(await feedback.innerText(), /reached the goal.*Undo/);
        await button('Write your own').tap();
        const write = page.getByRole('textbox', { name: 'Your directions' });
        await write.fill('Għaddi minn ħdejn il-knisja.');
        await button('Check route').tap();
        assert.equal(await model.isVisible(), false);
        assert.match(await feedback.innerText(), /reached the goal.*Undo/);
        await button('Live directions').tap();
        for (let index = 0; index < 3; index++) await button('Undo last move').tap();
        assert.equal(await progress.innerText(), '');
        await node(2).tap(); await node(3).tap();
        assert.equal(await page.locator('[data-route-goal-ring]').evaluate(ring => ring.r.baseVal.value), 18);
        await node(7).tap();
        assert.match(await progress.innerText(), /landmark.*required turn/);
        assert.equal(await feedback.innerText(), 'Challenge complete. You reached the goal.');
        assert.match(await model.innerText(), /two side streets.*right at the corner by the bank.*the clinic/);

        await button('New challenge').tap();
        assert.match(await requirement.innerText(), /church.*turn right at the second street/);
        assert.match(await challenge.locator('[data-route-challenge-mt]').innerText(), /il-knisja.*fit-tieni triq/);
        await button('Write your own').tap();
        await node(1).tap(); await node(2).tap(); await node(6).tap();
        await write.fill('Għaddi minn ħdejn il-knisja u dur fuq il-lemin fit-tieni triq.');
        await button('Check route').tap();
        assert(await model.isVisible());
        assert.equal(await feedback.innerText(), 'Challenge complete. You reached the goal.');
        await button('New route').tap();
        assert.equal(await challenge.isVisible(), false);
        return { taps: true, keyboardBacktrack: true, responsivePlacement: true, challengeTurns: [2, 3] };
      } finally { await f.close(); }
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
