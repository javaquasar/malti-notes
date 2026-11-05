const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const base = process.env.TOPICS_TEST_URL || 'http://127.0.0.1:4190';
const read = file => JSON.parse(fs.readFileSync(path.join(root, 'assets/data', file), 'utf8'));
const scenarios = read('everyday_scenarios_exercises.json').sets;
const recall = read('three_words_examples.json').groups[0].items;
const allSets = ['gender_agreement_exercises.json', 'food_cafe_exercises.json', 'everyday_scenarios_exercises.json'].flatMap(file => read(file).sets);
const output = process.env.TOPICS_TEST_OUTPUT || path.join(root, 'artifacts/gender-food-cafe');
const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const key = 'malti_topic_practice_v1';
const tonina = read('tonina_listening_examples.json').groups;
const toninaText = tonina.find(group => group.id === 'tonina-reading-text').items;
const toninaQuestions = tonina.find(group => group.id === 'tonina-listening-questions').items;
const legacyTonina = { notes: '1. fil-ġirien\n2. għajjat', speed: '0.75', position: 109 };
assert.equal(fs.existsSync(path.join(root, 'assets/audio/tonina.m4a')), false, 'Removed recording must not remain in published assets');
const worker = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
const workerAssets = ['CORE_ASSETS', 'LAZY_ASSETS'].flatMap(name => {
  const assignment = worker.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\]);`));
  assert(assignment, `Missing generated ${name} manifest`);
  return JSON.parse(assignment[1]);
});
assert.equal(workerAssets.some(asset => /\/audio\/tonina\.m4a(?:[?#]|$)/i.test(asset)), false, 'Removed recording must not remain in offline asset manifests');
assert.equal(toninaText.length, 15);
assert.equal(toninaQuestions.length, 10);
assert.equal(recall.length, 10);
assert.equal(scenarios.reduce((sum, set) => sum + set.items.length, 0), 14);

async function answer(page, container, item) {
  if (item.type === 'fill-blank') await container.getByLabel('Your answer', { exact: true }).fill(item.answer);
  else if (item.type === 'multiple-choice') await container.getByRole('radio', { name: item.answer, exact: true }).check();
  else if (item.type === 'matching') {
    for (const [i, pair] of item.pairs.entries()) await container.locator('select').nth(i).selectOption(pair.right);
  } else if (item.type === 'order-words') {
    for (const token of item.tokens) await container.locator('.exercise-order-bank').getByRole('button', { name: token, exact: true }).first().click();
  } else throw new Error(`Unsupported test item: ${item.type}`);
}

async function assertToninaReading(page) {
  const section = page.locator('[data-tonina-reading]');
  const paragraphs = section.locator('[data-tonina-bank="tonina-reading-text"] article');
  const questions = section.locator('[data-tonina-bank="tonina-listening-questions"] article');
  await paragraphs.first().waitFor();
  assert.equal(await paragraphs.count(), 15, 'Complete bilingual story must have fifteen paragraphs');
  assert.equal(await questions.count(), 10, 'Reading must end with ten bilingual questions');
  for (const [items, cards] of [[toninaText, paragraphs], [toninaQuestions, questions]]) {
    for (const [i, item] of items.entries()) {
      assert.equal(await cards.nth(i).locator('[lang="mt"]').textContent(), item.maltese);
      assert.equal(await cards.nth(i).locator('[lang="en"]').textContent(), item.english);
    }
  }
  assert(await paragraphs.last().evaluate((last, firstQuestion) => Boolean(last.compareDocumentPosition(firstQuestion) & Node.DOCUMENT_POSITION_FOLLOWING), await questions.first().elementHandle()), 'All story paragraphs must precede the questions');
  assert.equal(await section.locator('audio, video, source, [data-listening-speed], [data-listening-seek], [data-listening-notes]').count(), 0, 'Reading must not expose media or former player controls');
  assert.equal(await section.locator('.exercise-set, .review-add-button, [data-sentence-review-row]').count(), 0, 'Reading is unscored and has no Review controls');
  assert.equal(await section.locator('a[href*="tonina.m4a"]').count(), 0, 'Removed recording must not be linked');
  return section;
}

async function assertRemovedMedia(page, urls) {
  const results = await page.evaluate(async urls => {
    const cases = urls.flatMap(url => [
      { url }, { url: url + '?old-recording=1' },
      { url, range: 'bytes=0-63' }, { url, range: 'bytes=99999999-' }, { url, range: 'invalid-range' }
    ]);
    return Promise.all(cases.map(async item => {
      const response = await fetch(item.url, item.range ? { headers: { Range: item.range } } : {});
      return { ...item, status: response.status, type: response.headers.get('Content-Type'), range: response.headers.get('Content-Range') };
    }));
  }, urls);
  for (const result of results) {
    assert.equal(result.status, 410, `Removed recording must return Gone: ${JSON.stringify(result)}`);
    assert.equal(/^audio\//i.test(result.type || ''), false, 'Removed response must not be playable audio');
    assert.equal(result.range, null, 'Removed audio must not return a media range');
  }
  const cachedMedia = await page.evaluate(async () => {
    const found = [];
    for (const name of await caches.keys()) for (const request of await (await caches.open(name)).keys()) {
      if (/\/audio\/tonina\.m4a$/i.test(decodeURIComponent(new URL(request.url).pathname))) found.push({ name, url: request.url });
    }
    return found;
  });
  assert.deepEqual(cachedMedia, [], 'Removed recording must not enter any offline cache');
}

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await chromium.launch(fs.existsSync(chrome) ? { executablePath: chrome } : {});
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  const unexpectedMedia = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/\/audio\/tonina\.m4a(?:[?#]|$)/i.test(request.url())) unexpectedMedia.push(request.url()); });
  page.on('dialog', dialog => dialog.accept());
  try {
    await page.goto(`${base}/gender_agreement.html`, { waitUntil: 'networkidle' });
    await page.evaluate(({ key, legacyTonina }) => {
      localStorage.setItem('malti_exercise_progress_v1', JSON.stringify({ unrelated: { bestScore: 9, total: 10 } }));
      localStorage.setItem('malti_numbers_extended_v1', JSON.stringify({ keep: true }));
      localStorage.setItem(key, JSON.stringify({ tonina: legacyTonina }));
    }, { key, legacyTonina });
    for (const scenario of scenarios) {
      await page.goto(`${base}/${scenario.sourcePage.split('#')[0]}`, { waitUntil: 'networkidle' });
      const section = page.locator(`[data-guided-scenario="${scenario.id}"]`);
      const panel = section.locator('[data-scenario-exercise]');
      for (const [i, item] of scenario.items.entries()) {
        await panel.locator('form').waitFor();
        assert.equal(await section.locator('[data-scenario-maltese]').textContent(), item.cue.maltese);
        if (i === 0) {
          assert(await section.locator('[data-scenario-next]').isDisabled());
          await panel.getByRole('button', { name: 'Check answers', exact: true }).click();
          assert(await section.locator('[data-scenario-next]').isDisabled());
          await panel.getByRole('button', { name: 'Try again', exact: true }).click();
        }
        await answer(page, panel, item);
        if (i === 1) {
          const input = await panel.getByLabel('Your answer', { exact: true }).inputValue();
          await page.reload({ waitUntil: 'networkidle' });
          assert.equal(await panel.getByLabel('Your answer', { exact: true }).inputValue(), input);
          assert.match(await section.locator('[data-scenario-status]').textContent(), /Turn 2 of 7/);
        }
        await panel.getByRole('button', { name: 'Check answers', exact: true }).click();
        assert.match(await panel.locator('.exercise-result').textContent(), /^1\/1/);
        await section.locator('[data-scenario-next]').click();
      }
      assert.equal(await section.locator('[data-scenario-status]').textContent(), 'Conversation complete.');
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await section.locator('[data-scenario-status]').textContent(), 'Conversation complete.');
    }

    await page.goto(`${base}/school_classroom.html`, { waitUntil: 'networkidle' });
    const game = page.locator('[data-open-recall]');
    await game.locator('[data-bank-item]').first().waitFor();
    for (const item of recall) {
      const card = game.locator(`[data-bank-item="${item.slug}"]`);
      await card.locator('summary').focus();
      await page.keyboard.press('Enter');
      assert(await card.getByRole('button', { name: 'Confident', exact: true }).isDisabled());
      await card.getByLabel('Your answer', { exact: true }).fill(item.answer.maltese);
      await card.getByRole('button', { name: 'Show model answer', exact: true }).click();
      await card.getByRole('button', { name: 'Confident', exact: true }).click();
    }
    assert.match(await game.locator('[data-recall-progress]').textContent(), /10 \/ 10 answered · 10 confident/);
    const ending = game.locator('[data-bank-item="ends-sa"]');
    await ending.locator('.review-add-button').click();
    await ending.getByLabel('Your answer', { exact: true }).fill('borża; libsa; qattusa');
    assert.match(await game.locator('[data-recall-status]').textContent(), /Check the requested/);
    await ending.getByLabel('Your answer', { exact: true }).fill('libsa; libsa; qattusa');
    assert.match(await game.locator('[data-recall-status]').textContent(), /3 entries; 2 distinct/);
    assert.equal(await ending.locator('.review-add-button').getAttribute('aria-pressed'), 'true');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await ending.getByLabel('Your answer', { exact: true }).inputValue(), 'libsa; libsa; qattusa');
    await ending.locator('summary').click();
    assert.equal(await ending.getByRole('button', { name: 'Confident', exact: true }).getAttribute('aria-pressed'), 'false');

    await page.goto(`${base}/daily_problems.html`, { waitUntil: 'networkidle' });
    await assertToninaReading(page);
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).tonina, key), legacyTonina, 'Removing the player must preserve previous private notes');
    await page.reload({ waitUntil: 'networkidle' });
    await assertToninaReading(page);
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).tonina, key), legacyTonina);

    await page.goto(`${base}/gender_agreement.html#mixed-review`, { waitUntil: 'networkidle' });
    const mixed = page.locator('[data-mixed-practice]');
    await mixed.locator('[data-mixed-start]').waitFor({ state: 'visible' });
    await page.evaluate(() => window.MaltiMistakeStore.recordAttempt({
      id: 'exercise::food-supermarket-check::food-counter-follow-up', setId: 'food-supermarket-check', itemId: 'food-counter-follow-up',
      prompt: 'Existing shopping mistake', correctAnswer: 'Dak kollox. Grazzi.', explanation: 'Close the order.'
    }, false));
    for (const mode of ['recognition', 'production']) {
      await mixed.locator('[data-mixed-mode]').selectOption(mode);
      await mixed.locator('[data-mixed-start]').click();
      const session = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).mixedSession, key);
      assert.equal(session.ids.length, 6);
      if (mode === 'recognition') assert(session.ids.includes('food-supermarket-check--food-counter-follow-up'));
      for (const id of session.ids) {
        const set = allSets.find(set => id.startsWith(`${set.id}--`));
        const item = set.items.find(item => id === `${set.id}--${item.id}`);
        await answer(page, mixed.locator(`[data-exercise-item="${id}"]`), item);
      }
      await mixed.locator('form').getByRole('button', { name: 'Check answers', exact: true }).click();
      assert.match(await mixed.locator('.exercise-result').textContent(), /^6\/6/);
      assert.match(await mixed.locator(`[data-mixed-${mode}]`).textContent(), /6 \/ 6 correct/);
    }
    assert.match(await mixed.locator('[data-mixed-due]').textContent(), /^0 items/);
    await page.evaluate(key => {
      const data = JSON.parse(localStorage.getItem(key));
      for (const item of Object.values(data.mixedHistory)) item.dueAt = '2020-01-01T00:00:00.000Z';
      localStorage.setItem(key, JSON.stringify(data));
    }, key);
    await page.reload({ waitUntil: 'networkidle' });
    assert.match(await mixed.locator('[data-mixed-due]').textContent(), /^12 items/);
    assert.match(await mixed.locator('[data-mixed-production]').textContent(), /6 \/ 6 correct/);
    await page.addScriptTag({ path: path.join(root, 'assets/js/progress-backup.js') });
    assert(await page.evaluate(key => window.MaltiProgressBackup.keys.includes(key), key));
    assert.deepEqual(await page.evaluate(() => window.MaltiExerciseRunner.getProgress().unrelated), { bestScore: 9, total: 10 });
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('malti_numbers_extended_v1'))), { keep: true });

    const surfaces = [
      ['food_preferences.html', '#shopping-conversation'], ['restaurant_ordering.html', '#coffee-conversation'],
      ['gender_agreement.html', '#whole-sentences'], ['gender_agreement.html', '#mixed-review'],
      ['school_classroom.html', '#three-word-challenge'], ['daily_problems.html', '#tonina-listening']
    ];
    for (const [file, selector] of surfaces) for (const width of [320, 1440]) for (const theme of ['classic', 'forest', 'contrast']) {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
      await page.evaluate(theme => localStorage.setItem('malti_site_theme', theme), theme);
      await page.goto(`${base}/${file}`, { waitUntil: 'networkidle' });
      const section = page.locator(selector);
      if (selector.includes('conversation')) await section.locator('[data-scenario-restart]').click();
      if (selector === '#mixed-review') await section.locator('[data-mixed-start]').click();
      if (selector === '#three-word-challenge') await section.locator('[data-bank-item] summary').first().click();
      await section.evaluate(node => node.scrollIntoView({ block: 'start' }));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${file} ${width} overflow`);
      await page.addScriptTag({ content: axe });
      const violations = await section.evaluate(async node => (await axe.run(node, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }
      })).violations.filter(item => ['serious', 'critical'].includes(item.impact)).map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })));
      assert.deepEqual(violations, [], `${file} ${selector} ${width} ${theme}`);
      await page.screenshot({ path: path.join(output, `practice-${selector.slice(1)}-${width}-${theme}.png`) });
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(unexpectedMedia, [], 'Reading and other practice surfaces must not request the removed recording');
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).tonina, key), legacyTonina);

    const offline = await browser.newContext({ viewport: { width: 390, height: 844 } });
    let offlinePage = await offline.newPage();
    await offlinePage.goto(`${base}/daily_problems.html`, { waitUntil: 'networkidle' });
    await offlinePage.evaluate(async () => { await navigator.serviceWorker.ready; });
    await offlinePage.close();
    offlinePage = await offline.newPage();
    await offlinePage.goto(`${base}/daily_problems.html`, { waitUntil: 'networkidle' });
    assert(await offlinePage.evaluate(() => Boolean(navigator.serviceWorker.controller)));
    await assertToninaReading(offlinePage);
    const mediaUrls = [`${base}/assets/audio/tonina.m4a`, `${base}/assets/0123456789abcdef/audio/tonina.m4a`, `${base}/assets/audio/%74onina%2Em4a`];
    await assertRemovedMedia(offlinePage, mediaUrls);
    await offline.setOffline(true);
    await offlinePage.reload({ waitUntil: 'networkidle' });
    await assertToninaReading(offlinePage);
    await assertRemovedMedia(offlinePage, mediaUrls);
    await offline.close();
    console.log('PASS: 14 guided turns, wrong/retry and resume, 10 open recall drafts/ratings, complete bilingual Tonina reading and ten ordered questions, preserved former private notes, no recording/player/requests, balanced adaptive modes and due dates, preserved/backup state, 36 responsive/theme/a11y cases, offline reading and Gone responses for removed audio.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
