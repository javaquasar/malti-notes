const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const base = process.env.TOPICS_TEST_URL || 'http://127.0.0.1:4190';
const read = file => JSON.parse(fs.readFileSync(path.join(root, 'assets/data', file), 'utf8'));
const scenarios = read('everyday_scenarios_exercises.json').sets;
const recall = read('three_words_examples.json').groups[0].items;
const allSets = ['gender_agreement_exercises.json', 'food_cafe_exercises.json', 'everyday_scenarios_exercises.json'].flatMap(file => read(file).sets);
const output = path.join(root, 'artifacts/gender-food-cafe');
const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const key = 'malti_topic_practice_v1';
const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'assets/audio/tonina.m4a'))).digest('hex');
assert.equal(hash, '469c34bf19baf1e1de43b53e33b36a234aa274fcbd5478a79c9e45e9c2406c79');
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

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await chromium.launch(fs.existsSync(chrome) ? { executablePath: chrome } : {});
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  try {
    await page.goto(`${base}/gender_agreement.html`, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('malti_exercise_progress_v1', JSON.stringify({ unrelated: { bestScore: 9, total: 10 } }));
      localStorage.setItem('malti_numbers_extended_v1', JSON.stringify({ keep: true }));
    });
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
    const listening = page.locator('[data-tonina-listening]');
    await page.waitForFunction(() => document.querySelector('[data-tonina-listening] audio').duration > 210);
    const duration = await listening.locator('audio').evaluate(audio => audio.duration);
    assert(duration > 212 && duration < 213);
    await listening.locator('audio').evaluate(async audio => {
      audio.muted = true;
      await audio.play();
    });
    await page.waitForFunction(() => document.querySelector('[data-tonina-listening] audio').currentTime > 0.1);
    await listening.locator('audio').evaluate(audio => audio.pause());
    await listening.locator('[data-listening-notes]').fill('1. fil-ġirien\n2. għajjat');
    await listening.locator('[data-listening-speed]').selectOption('0.75');
    await listening.locator('[data-listening-seek="109"]').click();
    await page.waitForFunction(() => document.querySelector('[data-tonina-listening] audio').currentTime === 109);
    assert.equal(await listening.locator('audio').evaluate(audio => audio.currentTime), 109);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await listening.locator('[data-listening-notes]').inputValue(), '1. fil-ġirien\n2. għajjat');
    assert.equal(await listening.locator('audio').evaluate(audio => audio.playbackRate), 0.75);
    assert.equal(await listening.locator('.exercise-set').count(), 0);
    assert.equal(await listening.locator('[data-listening-bank] article').count(), 10);
    assert.equal(await listening.locator('.review-add-button').count(), 0);

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
      if (selector === '#tonina-listening') await section.locator('summary').click();
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

    const offline = await browser.newContext({ viewport: { width: 390, height: 844 } });
    let offlinePage = await offline.newPage();
    await offlinePage.goto(`${base}/daily_problems.html`, { waitUntil: 'networkidle' });
    await offlinePage.evaluate(async () => { await navigator.serviceWorker.ready; });
    await offlinePage.close();
    offlinePage = await offline.newPage();
    await offlinePage.goto(`${base}/daily_problems.html`, { waitUntil: 'networkidle' });
    assert(await offlinePage.evaluate(() => Boolean(navigator.serviceWorker.controller)));
    const mediaUrl = `${base}/assets/audio/tonina.m4a`;
    const partial = await offlinePage.evaluate(async url => {
      const response = await fetch(url, { headers: { Range: 'bytes=0-63' } });
      return { status: response.status, range: response.headers.get('Content-Range'), bytes: (await response.arrayBuffer()).byteLength };
    }, mediaUrl);
    assert.deepEqual(partial, { status: 206, range: 'bytes 0-63/1775824', bytes: 64 });
    await offline.setOffline(true);
    await offlinePage.reload({ waitUntil: 'networkidle' });
    await offlinePage.waitForFunction(() => document.querySelector('audio').duration > 210);
    const offlineRange = await offlinePage.evaluate(async url => {
      const response = await fetch(url, { headers: { Range: 'bytes=-32' } });
      return { status: response.status, bytes: (await response.arrayBuffer()).byteLength };
    }, mediaUrl);
    assert.deepEqual(offlineRange, { status: 206, bytes: 32 });
    const invalid = await offlinePage.evaluate(async url => (await fetch(url, { headers: { Range: 'bytes=99999999-' } })).status, mediaUrl);
    assert.equal(invalid, 416);
    await offline.close();
    console.log('PASS: 14 guided turns, wrong/retry and resume, 10 open recall drafts/ratings, real audio playback, unscored listening notes, balanced adaptive modes and due dates, preserved/backup state, 36 responsive/theme/a11y cases, offline audio byte ranges.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
