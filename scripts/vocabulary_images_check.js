const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const http = require('node:http');
const { chromium } = require('playwright');
const { root, inventory } = require('./vocabulary_image_inventory');

async function main() {
    const mime = { '.svg': 'image/svg+xml', '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' };
    const server = http.createServer((request, response) => {
        const file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
        if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404); response.end(); return; }
        response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
        fs.createReadStream(file).pipe(response);
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const records = inventory();
    assert.equal(records.length, 911);
    assert.equal(records.filter((item) => item.status === 'missing-file').length, 0);
    const before = require('../docs/vocabulary-images/before-with-images.json');
    before.forEach((old) => assert.equal(records.find((item) => item.file === old.file && item.id === old.id).image, old.image));
    const assets = [require('../docs/vocabulary-images/downloaded-assets.json'), require('../docs/vocabulary-images/game-icons-assets.json'), require('../docs/vocabulary-images/mdi-assets.json')].flatMap((manifest) => manifest.assets);
    assets.forEach((asset) => assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, asset.file))).digest('hex'), asset.sha256));
    const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
    try {
        const context = await browser.newContext({ serviceWorkers: 'block' });
        const page = await context.newPage();
        await page.goto(base + '/food_preferences.html');
        const failures = await page.evaluate(async (files) => {
            const failures = [];
            for (const file of files) {
                const text = await (await fetch(file)).text();
                const xml = new DOMParser().parseFromString(text, 'image/svg+xml');
                if (xml.querySelector('parsererror')) { failures.push(file + ': invalid XML'); continue; }
                const img = new Image();
                img.src = file;
                try { await img.decode(); } catch { failures.push(file + ': decoding'); continue; }
                const canvas = document.createElement('canvas');
                canvas.width = canvas.height = 128;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 128, 128);
                const pixels = ctx.getImageData(0, 0, 128, 128).data;
                if (!pixels.some((value, index) => index % 4 === 3 && value > 0)) failures.push(file + ': blank');
                if ([0, 127, 127 * 128, 128 * 128 - 1].some((corner) => pixels[corner * 4 + 3] !== 0)) failures.push(file + ': opaque corner');
            }
            return failures;
        }, assets.map((asset) => asset.file));
        assert.deepEqual(failures, []);
        await page.goto(base + '/food_preferences.html');
        await page.locator('.vocab-example').first().waitFor({ state: 'attached' });
        const controls = page.locator('.vocab-study-controls').first();
        const group = controls.locator('xpath=following-sibling::*[1]');
        await controls.getByLabel('Images', { exact: true }).uncheck();
        assert.equal(await group.locator('img').first().evaluate((img) => getComputedStyle(img).visibility), 'hidden');
        assert.equal(await group.locator('.vocab-english').first().evaluate((el) => getComputedStyle(el).visibility), 'visible');
        await controls.getByLabel('English', { exact: true }).uncheck();
        await controls.getByLabel('Images', { exact: true }).check();
        assert.equal(await group.locator('.vocab-english').first().evaluate((el) => getComputedStyle(el).visibility), 'hidden');
        assert.equal(await group.locator('img').first().evaluate((img) => getComputedStyle(img).visibility), 'visible');
        await page.reload();
        await page.locator('.vocab-example').first().waitFor({ state: 'attached' });
        assert.equal(await controls.getByLabel('English', { exact: true }).isChecked(), false);
        await controls.getByLabel('English', { exact: true }).check();
        const catalog = require('../assets/data/vocabulary_review_catalog.json');
        const cards = Object.values(catalog.words);
        assert.ok(cards.filter((item) => /box of eggs|tin of peas|January|Monday/.test(item.english)).every((item) => !item.imageQuizEligible), 'Ambiguous illustration marked quiz-safe');
        assert.ok(cards.find((item) => item.english === 'box of eggs').exampleTranslation);
        const literal = Object.values(catalog.words).find((item) => item.imageQuizEligible && item.image && !item.swatchStyle);
        const contextOnly = Object.values(catalog.words).find((item) => item.imageRole === 'context' && item.image);
        const savedBefore = await page.evaluate(({ literal, contextOnly }) => {
            localStorage.clear();
            const store = window.MaltiReviewStore;
            store.addWord({ ...literal, image: './old-image.svg', imageQuizEligible: undefined,
                box: 4, reviewCount: 12, addedAt: '2025-01-02T00:00:00.000Z',
                nextReviewAt: '2030-01-02T00:00:00.000Z', lastReviewedAt: '2026-01-02T00:00:00.000Z' });
            store.addWord({ ...contextOnly, image: './old-context.svg', imageQuizEligible: undefined });
            store.addWord({ id: 'custom-check', maltese: 'custom', english: 'custom', sourcePage: 'manual', image: './custom.svg' });
            return store.getCard(literal.id);
        }, { literal, contextOnly });
        await page.goto(base + '/review_cards.html');
        await page.waitForFunction(({ id, image }) => window.MaltiReviewStore.getCard(id)?.image === image, literal);
        const savedAfter = await page.evaluate((id) => window.MaltiReviewStore.getCard(id), literal.id);
        for (const key of ['box', 'reviewCount', 'addedAt', 'nextReviewAt', 'lastReviewedAt']) assert.equal(savedAfter[key], savedBefore[key]);
        assert.equal(await page.evaluate(() => window.MaltiReviewStore.getCard('custom-check').image), './custom.svg');
        await page.locator('#review-direction-filter').selectOption('image-to-maltese');
        await page.waitForTimeout(100);
        assert.ok(await page.locator('#review-stage img').count(), 'Literal image missing in visual practice');
        assert.ok(await page.locator('#review-stage img').first().getAttribute('src') === literal.image, 'Context image entered visual practice');
        await page.evaluate(() => localStorage.clear());
        const screenshots = path.join(root, 'visual-regression/screenshots/vocabulary-images');
        fs.mkdirSync(screenshots, { recursive: true });
        for (const width of [1280, 390]) {
            await page.setViewportSize({ width, height: 900 });
            for (const name of ['food_preferences', 'emotions', 'family_home_food', 'collective_nouns', 'year4_exam']) {
                await page.goto(base + '/' + name + '.html');
                const selector = name === 'year4_exam' ? '.year4-vocab-image' : '.vocab-image--cutout';
                await page.locator(selector).first().waitFor({ state: 'attached' });
                await page.locator(selector).first().scrollIntoViewIfNeeded();
                await page.waitForFunction((selector) => {
                    const img = document.querySelector(selector);
                    return img && img.complete && img.naturalWidth > 0;
                }, selector);
                assert.ok(await page.locator('#vocabulary-image-credits a').count() >= 2, name + ': credits missing');
                assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name + ': overflow');
                assert.ok(await page.locator(selector).first().evaluate((img) => img.getBoundingClientRect().width <= img.parentElement.getBoundingClientRect().width), name + ': oversized image');
                await page.screenshot({ path: path.join(screenshots, name + '-' + width + '.png') });
                const card = page.locator(selector).first().locator('..');
                await card.locator('.review-add-button').click();
                assert.ok(await page.evaluate((image) => window.MaltiReviewStore.getAllWords().some((word) => word.image === image), await card.locator('img').getAttribute('src')), name + ': image not saved to review');
                await context.clearCookies();
                await page.evaluate(() => localStorage.clear());
            }
        }
        console.log(`ok: ${records.length} cards, ${assets.length} original SVGs; transparency, checksums, preserved originals, desktop/mobile and review images`);
        await context.close();
    } finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
