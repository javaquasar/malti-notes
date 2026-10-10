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
    const assets = [require('../docs/vocabulary-images/downloaded-assets.json'), require('../docs/vocabulary-images/game-icons-assets.json')].flatMap((manifest) => manifest.assets);
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
