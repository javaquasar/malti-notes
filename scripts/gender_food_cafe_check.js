const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const base = process.env.TOPICS_TEST_URL || 'http://127.0.0.1:4190';
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'assets/data', name), 'utf8'));
const gender = read('gender_agreement_examples.json');
const genderSets = read('gender_agreement_exercises.json').sets;
const foodSets = read('food_cafe_exercises.json').sets;
const orderingIds = ['food-vegetable-orders', 'food-fruit-orders', 'restaurant-coffee-orders'];
const orderingSets = foodSets.filter(set => orderingIds.includes(set.id));
const output = path.join(root, 'artifacts/gender-food-cafe');
const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

assert.equal(gender.groups.find(g => g.id === 'gender-people').items.length, 13);
assert.equal(gender.groups.find(g => g.id === 'gender-animals').items.length, 10);
assert.equal(gender.groups.find(g => g.id === 'gender-adjectives').items.length, 7);
assert.equal(genderSets.reduce((n, s) => n + s.items.length, 0), 33);
assert.deepEqual(orderingSets.map(set => set.items.length), [8, 8, 10]);
assert.equal(new Set(foodSets.flatMap(set => set.items.map(item => item.id))).size, 38);
for (const set of orderingSets) {
  for (const item of set.items) {
    assert(item.explanation, `${item.id}: missing feedback`);
    if (item.type === 'order-words') assert.equal(item.tokens.join(' '), item.answer);
    if (item.type === 'multiple-choice') assert(item.choices.includes(item.answer));
    if (item.accepted) assert(item.accepted.includes(item.answer));
  }
}
assert(!JSON.stringify(gender).includes('mgerfxa'));
assert(!JSON.stringify(genderSets).includes('moħor'));
assert.equal(genderSets[0].items.find(i => i.id === 'nun').answer, 'soru');
assert.equal(genderSets[0].items.find(i => i.id === 'young-woman').answer, 'tfajla');
const genderHtml = fs.readFileSync(path.join(root, 'gender_agreement.html'), 'utf8');
for (const group of ['gender-people', 'gender-animals', 'gender-adjectives']) {
  assert(genderHtml.includes(`data-bank-layout="table" data-example-group="${group}"`), `${group}: missing shared table-layout contract`);
}

async function answerSet(page, set, alternate = false) {
  const container = page.locator(`[data-exercise-set="${set.id}"]`);
  await container.locator('form').waitFor();
  for (const item of set.items) {
    const question = container.locator(`[data-exercise-item="${item.id}"]`);
    if (item.type === 'fill-blank') {
      const answer = alternate ? item.accepted?.at(-1) || item.answer : item.answer;
      await question.getByLabel('Your answer', { exact: true }).fill(alternate ? `  ${answer.toUpperCase()}.  ` : answer);
    } else if (item.type === 'matching') {
      for (const [index, pair] of item.pairs.entries()) {
        await question.locator('select').nth(index).selectOption(pair.right);
      }
    } else if (item.type === 'multiple-choice') {
      await question.getByRole('radio', { name: item.answer, exact: true }).check();
    } else if (item.type === 'order-words') {
      const bank = question.locator('.exercise-order-bank');
      const selected = question.locator('.exercise-order-answer');
      const tokenCount = item.tokens.length;
      await bank.getByRole('button').first().focus();
      await page.keyboard.press('Enter');
      assert.equal(await selected.getByRole('button').count(), 1);
      await selected.getByRole('button').first().focus();
      await page.keyboard.press('Enter');
      assert.equal(await selected.getByRole('button').count(), 0);
      assert.equal(await bank.getByRole('button').count(), tokenCount);
      for (const token of item.tokens) {
        await bank.getByRole('button', { name: token, exact: true }).first().click();
      }
      assert.equal(await selected.getByRole('button').count(), tokenCount);
      assert.equal(await bank.getByRole('button').count(), 0);
    } else {
      throw new Error(`Untested exercise type: ${item.type}`);
    }
  }
  await container.getByRole('button', { name: 'Check answers', exact: true }).click();
  assert.match(await container.locator('.exercise-result').textContent(), /Quick check passed/);
  assert.match(await container.locator('.exercise-result').textContent(), new RegExp(`^${set.items.length}/${set.items.length}\\.`));
  assert.equal(await container.locator('.exercise-item.is-incorrect').count(), 0);
  assert.equal(await container.locator('.exercise-item.is-correct').count(), set.items.length);
}

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await chromium.launch(fs.existsSync(chrome) ? { executablePath: chrome } : {});
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  page.setDefaultTimeout(30000);
  const errors = [];
  let auditing = false;
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (!auditing && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  try {
    await page.goto(`${base}/gender_agreement.html`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelectorAll('#people tbody tr').length === 13);
    await page.evaluate(() => {
      localStorage.setItem('malti_numbers_extended_v1', JSON.stringify({ existing: { attempts: 7 } }));
      localStorage.setItem('malti_exercise_progress_v1', JSON.stringify({ existing: { bestScore: 3, total: 4 } }));
      window.MaltiReviewStore.addSentence({ id: 'existing-sentence', maltese: 'Bonġu!', english: 'Good morning!', sourcePage: 'greetings.html', topic: 'Existing' });
    });
    const sourceReview = await page.evaluate(() => window.MaltiReviewStore.getAllCards().find(c => c.id === 'existing-sentence'));
    assert(sourceReview);
    const bookmark = page.locator('#people .review-add-button').first();
    await bookmark.click();
    const savedId = await bookmark.getAttribute('data-review-id');
    assert.equal(await bookmark.getAttribute('aria-pressed'), 'true');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await bookmark.getAttribute('aria-pressed'), 'true');
    assert(await page.evaluate(id => window.MaltiReviewStore.hasCard(id), savedId));
    await bookmark.click();
    assert.equal(await bookmark.getAttribute('aria-pressed'), 'false');

    const disclosure = page.locator('#practice details').nth(1);
    await disclosure.locator('summary').focus();
    await page.keyboard.press('Enter');
    assert(await disclosure.evaluate(node => node.open));
    await page.keyboard.press('Enter');
    assert.equal(await disclosure.evaluate(node => node.open), false);
    await page.evaluate(() => document.querySelectorAll('#practice details').forEach(d => { d.open = true; }));
    const first = page.locator('[data-exercise-set="gender-context"]');
    await first.getByLabel('Your answer', { exact: true }).first().fill('incorrect');
    await first.getByRole('button', { name: 'Check answers', exact: true }).click();
    assert.match(await first.locator('.exercise-result').textContent(), /try again/);
    await first.getByRole('button', { name: 'Try again', exact: true }).click();
    for (const set of genderSets) await answerSet(page, set);
    await page.reload({ waitUntil: 'networkidle' });
    const progress = await page.evaluate(() => window.MaltiExerciseRunner.getProgress());
    assert.deepEqual(progress.existing, { bestScore: 3, total: 4 });
    for (const set of genderSets) assert(progress[set.id], `Missing persisted result: ${set.id}`);

    for (const file of ['food_preferences.html', 'restaurant_ordering.html']) {
      await page.goto(`${base}/${file}`, { waitUntil: 'networkidle' });
      const orderDisclosures = page.locator('details[id$="order-practice"]');
      for (const disclosure of await orderDisclosures.all()) {
        assert.equal(await disclosure.evaluate(node => node.open), false);
        await disclosure.locator('summary').focus();
        await page.keyboard.press('Enter');
        assert(await disclosure.evaluate(node => node.open));
      }
      await page.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; }));
      for (const set of foodSets.filter(set => set.sourcePage === file)) {
        const container = page.locator(`[data-exercise-set="${set.id}"]`);
        if (orderingIds.includes(set.id)) {
          await container.getByRole('button', { name: 'Check answers', exact: true }).click();
          assert.match(await container.locator('.exercise-result').textContent(), /^0\//);
          assert.equal(await container.locator('.exercise-item.is-incorrect').count(), set.items.length);
          await container.getByRole('button', { name: 'Add missed answers to review', exact: true }).click();
          for (const item of set.items.filter(item => item.reviewCard)) {
            const id = `sentence::course-exercise::${set.id}::${item.id}`;
            assert(await page.evaluate(id => window.MaltiReviewStore.hasCard(id), id));
          }
          await container.getByRole('button', { name: 'Try again', exact: true }).click();
          await answerSet(page, set, true);
          await container.getByRole('button', { name: 'Try again', exact: true }).click();
        }
        await answerSet(page, set);
      }
      await page.reload({ waitUntil: 'networkidle' });
      const saved = await page.evaluate(() => window.MaltiExerciseRunner.getProgress());
      for (const set of foodSets.filter(set => set.sourcePage === file)) {
        assert.equal(saved[set.id].bestScore, set.items.length);
        if (orderingIds.includes(set.id)) assert.equal(saved[set.id].attempts, 3);
      }
      const newBank = page.locator('[data-example-group]').filter({ has: page.locator('.review-add-button') }).first();
      assert(await newBank.count());
    }

    const pages = [
      ['gender_agreement.html', '#people', 30],
      ['food_preferences.html', '#supermarket-produce', 30],
      ['restaurant_ordering.html', '#cafe-coffee', 21]
    ];
    for (const [file, focus, minimum] of pages) {
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
        for (const theme of ['classic', 'forest', 'contrast']) {
          await page.evaluate(value => localStorage.setItem('malti_site_theme', value), theme);
          await page.goto(`${base}/${file}`, { waitUntil: 'networkidle' });
          assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
          await page.evaluate(() => document.querySelectorAll('details[id$="order-practice"]').forEach(d => { d.open = true; }));
          const target = page.locator(focus);
          await target.evaluate(element => element.scrollIntoView({ block: 'start' }));
          await page.waitForFunction(() => Array.from(document.images).filter(image => {
            const bounds = image.getBoundingClientRect();
            return bounds.width && bounds.height && bounds.top < innerHeight && bounds.bottom > 0;
          }).every(image => image.complete && image.naturalWidth > 0));
          assert(await page.locator('[data-example-group] .review-add-button').count() >= minimum);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${file} ${width} ${theme}: page overflows`);
          const text = await page.locator('main').innerText();
          assert(!/Lesson\s*0?4|Lecture\s*0?4/i.test(text));
          if (file === 'gender_agreement.html') {
            const aligned = await page.locator('#people tbody tr').evaluateAll(rows => rows.map(row => {
              const button = row.querySelector('.review-add-button').getBoundingClientRect();
              const cell = row.lastElementChild.getBoundingClientRect();
              return Math.abs(button.y + button.height / 2 - cell.y - cell.height / 2) < 2;
            }).every(Boolean));
            assert(aligned, `${width} ${theme}: table bookmarks misaligned`);
          }
          if (width === 390 || width === 1440) {
            // Axe's cloned CSSOM re-fetches relative imports against the page URL.
            // Keep product-load failures separate from those audit-only requests.
            auditing = true;
            await page.addScriptTag({ content: axe });
            const violations = await page.evaluate(async () => (await axe.run(document, {
              runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }
            })).violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`));
            await page.waitForLoadState('networkidle');
            auditing = false;
            assert.deepEqual(violations, [], `${file} ${width} ${theme}`);
          }
          if (theme === 'classic') {
            await page.screenshot({ path: path.join(output, `${file.replace('.html', '')}-${width}.png`) });
          }
          if (file !== 'gender_agreement.html') {
            const practice = page.locator('details[id$="order-practice"]').first();
            await practice.scrollIntoViewIfNeeded();
            await practice.locator('summary').evaluate(node => node.scrollIntoView({ block: 'start' }));
            await page.screenshot({ path: path.join(output, `${file.replace('.html', '')}-orders-${width}-${theme}.png`) });
          }
        }
      }
    }
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('malti_numbers_extended_v1'))), { existing: { attempts: 7 } });
    assert.deepEqual(await page.evaluate(() => window.MaltiReviewStore.getAllCards().find(c => c.id === 'existing-sentence')), sourceReview);
    assert.deepEqual(errors, []);
    console.log('PASS: 71 answers, 26 new ordering tasks, accepted variants, retry, missed-answer review, persisted state, keyboard disclosures/token return, 27 responsive/theme views, 18 accessibility audits, images and aligned review columns.');
    console.log(`Screenshots: ${output}`);
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
