const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../assets/js/lesson01-practice-core');
const story = require('../assets/js/about-me-story-core');
const data = require('../assets/data/lesson01_practice.json');
const { chromium } = require('playwright');
const family = { children: 'two', child1Name: 'Ivan', child1Gender: 'male', child1Age: '9', child2Name: 'Kira', child2Gender: 'female', child2Age: '6' };
assert.deepEqual(story.children(family), ['Għandi żewġt itfal.', 'Ibni jismu Ivan.', 'Għandu 9 snin.', 'Binti jisimha Kira.', 'Għandha 6 snin.']);
assert.equal(story.children({ ...family, children: 'one', child1Age: '1' }).join(' '), 'Għandi tifel wieħed. Ibni jismu Ivan. Għandu sena.');
assert.equal(story.children({ ...family, children: 'none' }).join(' '), "M'għandix tfal.");
assert.deepEqual(story.children({ ...family, children: '' }), []);
assert.ok(!story.children({ ...family, child1Age: '-2' }).join(' ').includes('-2'));
assert.ok(!story.children({ ...family, child1Age: '2.5' }).join(' ').includes('2.5'));
assert.match(story.children({ children: 'daughter', child1Name: 'Maya', child1Age: '1' }).join(' '), /Binti jisimha Maya. Għandha sena/);
assert.equal(core.analyze('L ikla tajba', ['L-ikla t-tajba.']).correct, false);
assert.equal(core.analyze('Ikla t-tajba', ['L-ikla t-tajba.']).category, 'article');
assert.equal(core.analyze('Ghandha 6 snin', ['Għandha 6 snin.']).category, 'spelling');
assert.equal(core.analyze('Binti għandu 6 snin', ['Binti għandha 6 snin.']).category, 'form');
assert.equal(core.analyze("Ta' xejn", ["M'hemmx imniex.", "Ta' xejn."]).correct, true);
assert.equal(core.analyze('Hello', ['Bonġu!']).correct, false);
const mixed = core.mixed(data.phrases, () => .3);
assert.equal(mixed.length, 8); assert.equal(new Set(mixed.map((p) => p.skill)).size, 4);
assert.equal(new Set(mixed.map((p) => p.id)).size, 8);
assert.equal(core.weakest({ a: { skill: 'reply', correct: false } }, ['greeting', 'reply']), 'reply');
const base = process.env.LESSON01_URL || 'http://127.0.0.1:4190';
(async () => {
    const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
    const errors = [];
    const shots = path.resolve('visual-regression/screenshots/lesson01-adaptive'); fs.mkdirSync(shots, { recursive: true });
    try {
        for (const width of [1280, 390]) {
            const context = await browser.newContext({ viewport: { width, height: 1000 }, serviceWorkers: 'block' });
            const page = await context.newPage(); page.on('pageerror', (e) => { errors.push(e.message); console.error('Browser:', e.message); });
            await page.goto(base + '/about_me.html');
            await page.waitForFunction(() => document.querySelector('[data-about-me-practice]')?.dataset.aboutMeReady === 'true');
            await page.locator('[data-about-me-sample]').click();
            await page.locator('[name="name"]').fill('Artur');
            await page.locator('[name="origin"]').fill('mill-Ukrajna');
            for (const [field, value] of Object.entries(family)) {
                const input = page.locator('[name="' + field + '"]');
                if (field.endsWith('Gender') || field === 'children') await input.selectOption(value); else await input.fill(value);
            }
            assert.match(await page.locator('[data-about-me-output]').innerText(), /Ibni jismu Ivan/);
            assert.match(await page.locator('[data-about-me-output]').innerText(), /Binti jisimha Kira/);
            await page.locator('[name="children"]').selectOption('one');
            assert.equal(await page.locator('[data-child-fields="2"]').isVisible(), false);
            assert.equal((await page.locator('[data-about-me-output]').innerText()).includes('Kira'), false);
            await page.locator('[name="child1Age"]').fill('1');
            assert.match(await page.locator('[data-about-me-output]').innerText(), /Għandu sena/);
            await page.locator('[name="children"]').selectOption('none');
            assert.match(await page.locator('[data-about-me-output]').innerText(), /M'għandix tfal/);
            await page.locator('[name="children"]').selectOption('two'); await page.locator('[name="child1Age"]').fill('9');
            await page.evaluate(() => {
                Object.defineProperty(navigator.clipboard, 'writeText', { configurable: true, value: async (text) => { window.copiedStory = text; } });
            });
            await page.locator('[data-about-me-copy]').click();
            assert.equal(await page.evaluate(() => window.copiedStory), await page.evaluate(() => window.MaltiAboutMe.getStory().join('\n')));
            assert.ok((await page.evaluate(() => window.copiedStory)).includes('\nBinti jisimha Kira.\nGħandha 6 snin.'));
            await page.locator('[data-about-me-save]').click();
            await page.reload(); await page.waitForFunction(() => document.querySelector('[data-about-me-practice]')?.dataset.aboutMeReady === 'true');
            assert.equal(await page.locator('[name="child2Name"]').inputValue(), 'Kira');
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            await page.locator('[data-child-fields="1"]').scrollIntoViewIfNeeded();
            await page.mouse.move(width - 5, 950); await page.locator('[data-child-fields="1"] legend').click();
            await page.screenshot({ path: path.join(shots, 'children-' + width + '.png') });
            // The guided builder must expose the same child fields and copy them back.
            for (let i = 0; i < 8; i++) await page.locator('[data-guided-next]').click();
            await page.locator('[data-guided-input]').selectOption('one');
            await page.getByLabel('Child 1 name', { exact: true }).fill('Ivan');
            await page.getByLabel('Child 1 gender', { exact: true }).selectOption('male');
            await page.getByLabel('Child 1 age', { exact: true }).fill('9');
            await page.locator('[data-guided-next]').click();
            assert.equal(await page.locator('[name="children"]').inputValue(), 'one');
            await page.locator('[name="children"]').selectOption('two'); await page.locator('[data-about-me-save]').click();
            await page.goto(base + '/getting_to_know.html'); await page.waitForSelector('.lp-phrase');
            const region = page.locator('#speaking-practice');
            await region.getByLabel('Use my local story').check();
            await region.getByRole('button', { name: 'Role-play', exact: true }).click();
            await region.getByLabel('Your role', { exact: true }).selectOption('Pawlu');
            await region.getByLabel('Mode', { exact: true }).selectOption('independent');
            await region.getByRole('button', { name: 'Show model', exact: true }).click();
            assert.match(await region.locator('.lp-feedback').nth(1).innerText(), /Artur/);
            await region.getByLabel('Your next line in Maltese').fill('wrong personal answer Ivan Kira');
            await region.getByRole('button', { name: 'Check reply', exact: true }).click();
            await region.getByRole('button', { name: 'Restart', exact: true }).click();
            await region.getByLabel('Your next line in Maltese').fill('Bonġu! Jisimni Artur. Għandi pjaċir.');
            await region.getByRole('button', { name: 'Check reply', exact: true }).click();
            assert.equal(await region.locator('.lp-feedback').nth(1).innerText(), 'Correct.');
            await region.getByRole('button', { name: 'Your turn', exact: true }).click();
            await region.getByLabel('Your answer', { exact: true }).fill('private answer Ivan Kira Artur');
            await region.getByRole('button', { name: 'Check answer', exact: true }).click();
            assert.equal(await page.evaluate(() => Object.keys(localStorage).filter((key) => key !== 'malti_about_me_draft_v1').some((key) => /Artur|Ivan|Kira/.test(localStorage.getItem(key)))), false);
            await region.getByLabel('Use my local story').uncheck();
            await region.getByRole('button', { name: 'Your turn', exact: true }).click();
            await region.getByLabel('Task', { exact: true }).selectOption('mixed');
            assert.equal(await region.getByRole('button', { name: 'Show model', exact: true }).isVisible(), false);
            for (let i = 0; i < 8; i++) {
                const text = await region.locator('#lp-pane-1 .lp-prompt').innerText();
                const phrase = data.phrases.find((p) => text.endsWith(p.english) || text.endsWith('Reply to: ' + p.maltese));
                assert.ok(phrase, text);
                await region.getByLabel('Your answer', { exact: true }).fill(text.includes('Reply to:') ? phrase.reply : phrase.maltese);
                await region.getByRole('button', { name: 'Check answer', exact: true }).click();
                await region.getByRole('button', { name: 'Next', exact: true }).click();
            }
            assert.match(await region.locator('#lp-pane-1 .lp-prompt').innerText(), /Session complete: 8\/8/);
            await page.evaluate(() => window.MaltiStorage.setJson('malti_lesson01_skills_v1', {
                'phrase-night-translate': { skill: 'greeting', correct: false }, 'phrase-evening-translate': { skill: 'greeting', correct: false }
            }));
            await region.getByRole('button', { name: 'Skills', exact: true }).click();
            assert.match(await region.locator('#lp-pane-4 .lp-prompt').innerText(), /Greeting and leaving/);
            await region.getByRole('button', { name: 'Practise greeting and leaving', exact: true }).click();
            assert.equal(await region.getByLabel('Task', { exact: true }).inputValue(), 'focused');
            await region.getByLabel('Your answer', { exact: true }).fill('wrong');
            await region.getByRole('button', { name: 'Check answer', exact: true }).click();
            const feedback = await region.locator('.lp-feedback').first().innerText(); assert.match(feedback, /Compare this part|Keep the article/);
            await region.getByRole('button', { name: 'Practise this part', exact: true }).click();
            const fragment = (await region.locator('#lp-pane-1 .lp-prompt').innerText()).replace('Restore this part: ', '');
            await region.getByLabel('Your answer', { exact: true }).fill(fragment);
            await region.getByRole('button', { name: 'Check answer', exact: true }).click();
            assert.match(await region.locator('.lp-feedback').first().innerText(), /Fragment restored/);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            await region.evaluate((node) => scrollTo(0, node.getBoundingClientRect().top + scrollY - 150));
            await page.mouse.move(width - 5, 950); await region.getByRole('heading', { name: 'Speaking Practice', exact: true }).click();
            await page.screenshot({ path: path.join(shots, 'focused-' + width + '.png') });
            await context.close();
        }
        assert.deepEqual(errors, []);
        console.log('PASS: child details, one/two/none, age and gender forms, guided builder, local persistence, personal dialogues, privacy, accepted variants, diagnostics, mixed assessment and focused next steps on desktop/mobile.');
    } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
