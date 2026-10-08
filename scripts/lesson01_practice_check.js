const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../assets/js/lesson01-practice-core');
const data = require('../assets/data/lesson01_practice.json');
const { chromium } = require('playwright');
assert.deepEqual(core.check('  Grazzi! ', ['Grazzi.']), { correct: true, spelling: false });
assert.deepEqual(core.check('Sahha', ['Saħħa!']), { correct: true, spelling: true });
assert.equal(core.check('no', ['Grazzi.']).correct, false);
assert.equal(core.check('Jekk jogħġbok', ['Jekk jogħġbok.']).correct, true);
assert.equal(core.check('M’hemmx imniex', ["M'hemmx imniex."]).correct, true);
assert.deepEqual(core.progress({ a: { skill: 'reply', independent: true, correct: true }, b: { skill: 'reply', assisted: true, correct: true }, c: { skill: 'reply', correct: false } }, 'reply'), { independent: 1, assisted: 1, needsPractice: 1 });
assert.equal(data.phrases.length, 20);
assert.equal(new Set(data.phrases.map((p) => p.id)).size, 20);
const base = process.env.LESSON01_URL || 'http://127.0.0.1:4190';
(async () => {
    const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
        args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
    const errors = [];
    const shots = path.resolve('visual-regression/screenshots/lesson01-practice');
    fs.mkdirSync(shots, { recursive: true });
    try {
        for (const width of [1280, 390]) {
            const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
            const page = await context.newPage();
            await context.grantPermissions(['microphone'], { origin: base });
            page.on('pageerror', (e) => errors.push(e.message));
            for (const stem of ['greetings', 'polite_phrases', 'conversation_help', 'getting_to_know']) {
                await page.goto(base + '/' + stem + '.html');
                await page.waitForSelector('.lp-phrase', { state: 'attached' });
                await page.locator('#speaking-practice').scrollIntoViewIfNeeded();
                await page.waitForSelector('[data-lesson01-group] > *', { state: 'attached' });
                assert.equal(await page.locator('.lp-priority').count(), 0);
                await page.mouse.move(width - 5, 850);
                const region = page.locator('#speaking-practice');
                assert.equal(await region.evaluate((node) => getComputedStyle(node).backgroundColor), await page.locator('main.content > .card').first().evaluate((node) => getComputedStyle(node).backgroundColor));
                assert.notEqual(await region.evaluate((node) => getComputedStyle(node).backgroundColor), 'rgba(0, 0, 0, 0)');
                await region.getByLabel('Phrase selection').selectOption('all');
                assert.equal(await region.locator('.lp-phrase').count(), 20);
                assert.equal(await region.locator('.lp-phrase').evaluateAll((rows) => rows.some((row) => {
                    const text = row.firstElementChild.getBoundingClientRect(); const button = row.lastElementChild.getBoundingClientRect();
                    return text.right > button.left || button.right > innerWidth;
                })), false);
                const save = region.locator('.lp-save').first();
                const before = await save.getAttribute('aria-pressed');
                await save.click(); assert.equal(await save.getAttribute('aria-pressed'), String(before !== 'true'));
                await save.click(); assert.equal(await save.getAttribute('aria-pressed'), before);
                await region.getByRole('button', { name: 'Your turn', exact: true }).click();
                await region.getByLabel('Your answer', { exact: true }).fill('wrong');
                await region.getByRole('button', { name: 'Check answer', exact: true }).click();
                assert.match(await region.locator('.lp-feedback').first().innerText(), /Added to review/);
                assert.ok(await page.evaluate(() => window.MaltiReviewStore.getAllCards().length > 0));
                assert.ok(await page.evaluate(() => window.MaltiMistakeStore.getOpen().length > 0));
                await region.getByRole('button', { name: 'Next', exact: true }).click();
                const item = data.phrases.filter((p) => p.page === stem + '.html')[1];
                await region.getByLabel('Your answer', { exact: true }).fill(item.maltese);
                await region.getByRole('button', { name: 'Check answer', exact: true }).click();
                assert.match(await region.locator('.lp-feedback').first().innerText(), /Correct/);
                await region.getByLabel('Task', { exact: true }).selectOption('reply');
                await region.getByLabel('Your answer', { exact: true }).fill(item.reply);
                await region.getByRole('button', { name: 'Check answer', exact: true }).click();
                assert.match(await region.locator('.lp-feedback').first().innerText(), /Correct/);
                await region.getByLabel('Task', { exact: true }).selectOption('cloze');
                await region.getByLabel('Your answer', { exact: true }).fill(item.maltese.split(' ')[0]);
                await region.getByRole('button', { name: 'Check answer', exact: true }).click();
                assert.match(await region.locator('.lp-feedback').first().innerText(), /Correct/);
                await region.getByRole('button', { name: 'Role-play', exact: true }).click();
                if (stem === 'greetings') {
                    for (const scenario of data.scenarios) {
                        await region.getByLabel('Situation', { exact: true }).selectOption(scenario.id);
                        await region.getByLabel('Mode', { exact: true }).selectOption('independent');
                        for (const role of scenario.roles) {
                            await region.getByLabel('Your role', { exact: true }).selectOption(role);
                            await region.getByRole('button', { name: 'Restart', exact: true }).click();
                            for (const turn of scenario.turns.filter((t) => t.role === role)) {
                                await region.getByLabel('Your next line in Maltese', { exact: true }).fill(turn.maltese);
                                await region.getByRole('button', { name: 'Check reply', exact: true }).click();
                                assert.equal(await region.locator('.lp-feedback').nth(1).innerText(), 'Correct.');
                                await region.getByRole('button', { name: 'Next turn', exact: true }).click();
                            }
                            assert.match(await region.innerText(), /Conversation complete/);
                        }
                    }
                    await region.getByRole('button', { name: 'Restart', exact: true }).click();
                    await region.getByLabel('Mode', { exact: true }).selectOption('guided');
                    assert.match(await region.innerText(), /Opening:/);
                    await region.getByLabel('Self-assessment').selectOption('independent');
                    await region.getByRole('button', { name: 'Start', exact: true }).click();
                    await page.waitForTimeout(1200);
                    assert.notEqual(await region.getByRole('timer').innerText(), '01:00');
                    await region.getByRole('button', { name: 'Reset', exact: true }).click();
                    assert.equal(await region.getByRole('timer').innerText(), '01:00');
                }
                await region.getByRole('button', { name: 'Pronunciation', exact: true }).click();
                assert.equal(await region.locator('a[href*="forvo.com"]').count(), 3);
                if (stem === 'greetings') {
                    await page.evaluate(() => {
                        window.savedGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
                        navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('Denied', 'NotAllowedError'));
                    });
                    await region.getByRole('button', { name: 'Record', exact: true }).click();
                    await page.waitForFunction(() => document.querySelector('#lp-pane-3').textContent.includes('Microphone unavailable'));
                    await page.evaluate(() => { navigator.mediaDevices.getUserMedia = window.savedGetUserMedia; });
                    await region.getByLabel('Recording text').selectOption('dialogue:phone');
                    assert.match(await region.innerText(), /Emma: Ħelow/);
                    await region.getByRole('button', { name: 'Record', exact: true }).click();
                    await page.waitForTimeout(600);
                    await region.getByRole('button', { name: 'Stop', exact: true }).click();
                    await page.waitForFunction(() => document.querySelector('.lp-audio').src.startsWith('blob:'));
                    await region.getByLabel('Playback speed').selectOption('0.75');
                    assert.equal(await region.locator('audio').evaluate((a) => a.playbackRate), 0.75);
                    await region.getByLabel('Playback speed').selectOption('1');
                    assert.equal(await region.locator('audio').evaluate((a) => a.playbackRate), 1);
                    const wav = Buffer.alloc(44 + 8000 * 2);
                    wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
                    wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
                    wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
                    wav.write('data', 36); wav.writeUInt32LE(16000, 40);
                    await region.locator('input[type="file"]').setInputFiles({ name: 'test.wav', mimeType: 'audio/wav', buffer: wav });
                    await page.waitForFunction(() => document.querySelector('.lp-audio').duration === 1);
                    await page.screenshot({ path: path.join(shots, 'audio-' + width + '.png') });
                }
                await region.getByRole('button', { name: 'Skills', exact: true }).click();
                assert.match(await region.locator('.lp-skills').innerText(), /independent/);
                const saved = await page.evaluate(() => localStorage.getItem('malti_lesson01_skills_v1'));
                assert.ok(saved);
                await page.reload(); await page.waitForSelector('.lp-phrase');
                assert.equal(await page.evaluate(() => localStorage.getItem('malti_lesson01_skills_v1')), saved);
                assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
                await region.evaluate((node) => window.scrollTo(0, node.getBoundingClientRect().top + scrollY - 150));
                await page.mouse.move(width - 5, 850);
                await page.waitForTimeout(600);
                await region.getByRole('heading', { name: 'Lesson 01 Speaking Practice', exact: true }).click();
                await page.screenshot({ path: path.join(shots, stem + '-' + width + '.png') });
                for (const tab of ['Your turn', 'Role-play', 'Skills']) {
                    await region.getByRole('button', { name: tab, exact: true }).click();
                    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
                    await page.screenshot({ path: path.join(shots, stem + '-' + tab.replace(' ', '-') + '-' + width + '.png') });
                }
            }
            await context.close();
        }
        assert.deepEqual(errors, []);
        console.log('PASS: normalization, all four pages, 20 phrases, review toggles, three task modes, six dialogue roles, hints, timer, persistence, mobile layout.');
    } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
