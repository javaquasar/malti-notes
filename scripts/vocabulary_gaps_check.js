const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const base = process.env.TOPICS_TEST_URL || 'http://127.0.0.1:4190';
const output = path.join(root, 'tmp_ui/vocabulary-gaps');
const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const pages = [
  { file: 'gender_agreement.html', scopes: ['[data-example-group="gender-terms"]', '[data-example-group="gender-exercise-words"]'], counts: [3, 11] },
  { file: 'food_preferences.html', scopes: ['[data-food-group="food-kitchen-details"]', '[data-example-group="food-cooking-context"]'], counts: [5, 4] },
  { file: 'getting_to_know.html', scopes: ['[data-example-group="work-job-search-vocabulary"]', '[data-example-group="work-job-search-dialogue"]'], counts: [5, 7] },
  { file: 'restaurant_ordering.html', scopes: ['[data-example-group="restaurant-cafe-small-talk"]'], counts: [4] },
  { file: 'daily_problems.html', scopes: ['[data-daily-problems-group="daily-problems-incidents"]', '[data-example-group="daily-problems-incident-expressions"]'], counts: [6, 8] },
  { file: 'daily_routine.html', scopes: ['[data-daily-routine-group="daily-routine-habits"]', '[data-example-group="daily-routine-habit-expressions"]'], counts: [2, 2] },
  { file: 'school_classroom.html', scopes: ['[data-example-group="school-word-game-language"]'], counts: [5] },
  { file: 'home_furniture.html', scopes: ['[data-home-group="home-outside"]', '[data-home-group="home-furniture"]'], counts: [8, 11] },
  { file: 'weather.html', scopes: ['[data-weather-group="weather-core"]'], counts: [7] },
  { file: 'emotions.html', scopes: ['[data-example-group="emotions-situations"]'], counts: [7] }
];

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
    await page.goto(`${base}/food_preferences.html`, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('malti_numbers_extended_v1', JSON.stringify({ sentinel: { attempts: 9 } }));
      localStorage.setItem('malti_exercise_progress_v1', JSON.stringify({ sentinel: { bestScore: 3 } }));
      window.MaltiReviewStore.addSentence({ id: 'gap-audit-existing', maltese: 'Bonġu!', english: 'Good morning!', sourcePage: 'greetings.html', topic: 'Existing' });
    });
    const prior = await page.evaluate(() => window.MaltiReviewStore.getAllCards().find(card => card.id === 'gap-audit-existing'));
    for (const config of pages) {
      for (const width of [390, 1440]) for (const theme of ['classic', 'forest', 'contrast']) {
        await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
        await page.evaluate(value => localStorage.setItem('malti_site_theme', value), theme);
        await page.goto(`${base}/${config.file}`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.querySelectorAll('details').forEach(details => { details.open = true; }));
        for (const [index, selector] of config.scopes.entries()) {
          const bank = page.locator(selector);
          await page.waitForFunction(([selector, count]) => document.querySelector(selector)?.querySelectorAll('.review-add-button').length === count, [selector, config.counts[index]]);
          assert.equal(await bank.locator('.review-add-button').count(), config.counts[index]);
          assert(!/Lesson\s*0?4|Lecture\s*0?4/i.test(await bank.innerText()));
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${config.file} ${width} ${theme}: overflow`);
        await page.locator(config.scopes[0]).evaluate(element => element.scrollIntoView({ block: 'start' }));
        if (theme === 'classic') await page.screenshot({ path: path.join(output, `${config.file.replace('.html', '')}-${width}.png`) });
        // Product resources are checked before axe's cloned-CSSOM import requests.
        auditing = true;
        await page.addScriptTag({ content: axe });
        const violations = await page.evaluate(async selectors => (await axe.run({ include: selectors }, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }
        })).violations.filter(row => ['serious', 'critical'].includes(row.impact)).map(row => `${row.id}: ${row.nodes.map(node => node.target.join(' ')).join(', ')}`), config.scopes);
        await page.waitForLoadState('networkidle');
        auditing = false;
        assert.deepEqual(violations, [], `${config.file} ${width} ${theme}`);
      }
      const bank = page.locator(config.scopes[0]);
      const button = bank.locator('.review-add-button').first();
      await button.focus();
      await page.keyboard.press('Enter');
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      const id = await button.getAttribute('data-review-id');
      assert(await page.evaluate(id => window.MaltiReviewStore.hasCard(id), id));
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      await page.evaluate(() => document.querySelectorAll('details').forEach(details => { details.open = true; }));
      await button.click();
      assert.equal(await button.getAttribute('aria-pressed'), 'false');
    }
    await page.goto(`${base}/food_preferences.html`, { waitUntil: 'networkidle' });
    assert.match(await page.locator('[data-food-group="food-produce"]').innerText(), /zunnarija/);
    assert(await page.getByText('qarabagħli', { exact: true }).count());
    await page.goto(`${base}/restaurant_ordering.html`, { waitUntil: 'networkidle' });
    assert(await page.getByText('sarvetta', { exact: true }).count());
    const search = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/search-index.json'), 'utf8'));
    for (const term of ['zunnarija', 'qarabagħli', 'intervista', 'tilwima', 'għatba', 'mewġ']) assert(search.entries.some(row => row.title.includes(term) || row.normalized.includes(term)), `Missing search entry: ${term}`);
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('malti_numbers_extended_v1'))), { sentinel: { attempts: 9 } });
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('malti_exercise_progress_v1'))), { sentinel: { bestScore: 3 } });
    assert.deepEqual(await page.evaluate(() => window.MaltiReviewStore.getAllCards().find(card => card.id === 'gap-audit-existing')), prior);
    assert.deepEqual(errors, []);
    console.log('PASS: 10 existing pages; 60 viewport/theme and scoped accessibility cases; bank counts, keyboard bookmarks, reload persistence, aliases, search and unchanged prior progress.');
    console.log(`Screenshots: ${output}`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
