const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");
const baseUrl = process.env.LESSON01_URL || "http://127.0.0.1:4190";
const files = fs.readdirSync(path.join(root, "assets/data")).filter((file) => file.endsWith("_lesson01_examples.json"));
const screenshotDir = path.join(root, "visual-regression/screenshots/lesson01");
fs.mkdirSync(screenshotDir, { recursive: true });
function assert(ok, message) { if (!ok) throw new Error(message); }

async function main() {
    const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
    try {
        for (const width of [1280, 390]) {
            const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: "block" });
            const page = await context.newPage();
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            for (const file of files) {
                const data = JSON.parse(fs.readFileSync(path.join(root, "assets/data", file), "utf8"));
                await page.goto(baseUrl + "/" + data.page);
                for (const group of data.groups) {
                    const cards = page.locator('[data-lesson01-group="' + group.id + '"] > article');
                    await cards.first().waitFor();
                    assert(await cards.count() === group.items.length, data.page + ": incomplete group " + group.id);
                    assert(await cards.locator("button[data-review-id]").count() === group.items.length, data.page + ": missing review toggle");
                }
                const button = page.locator("[data-lesson01-group] button[data-review-id]").first();
                await button.click();
                assert(await button.getAttribute("aria-pressed") === "true", data.page + ": review add failed");
                await button.click();
                assert(await button.getAttribute("aria-pressed") === "false", data.page + ": immediate review removal failed");
                const layout = await page.evaluate(() => {
                    const collisions = [];
                    for (const card of document.querySelectorAll("[data-lesson01-group] > article")) {
                        const button = card.querySelector("button[data-review-id]");
                        const b = button.getBoundingClientRect();
                        for (const text of card.querySelectorAll("code, small, .qa-pair-label")) {
                            const range = document.createRange();
                            range.selectNodeContents(text);
                            for (const r of range.getClientRects()) {
                                if (r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top) collisions.push(card.textContent.slice(0, 60));
                            }
                        }
                    }
                    return { overflow: document.documentElement.scrollWidth > innerWidth + 1, collisions };
                });
                assert(!layout.overflow, data.page + ": horizontal overflow at " + width);
                assert(layout.collisions.length === 0, data.page + ": review button overlaps text: " + layout.collisions.join(", "));
                if (["greetings.html", "polite_phrases.html", "conversation_help.html", "getting_to_know.html"].includes(data.page)) {
                    await page.evaluate(() => scrollTo(0, 0));
                    await page.screenshot({ path: path.join(screenshotDir, data.page.replace(".html", "") + "-" + width + ".png") });
                    const exerciseData = JSON.parse(fs.readFileSync(path.join(root, "assets/data/lesson01_exercises.json"), "utf8"));
                    const setId = await page.locator("[data-exercise-set]").getAttribute("data-exercise-set");
                    const set = exerciseData.sets.find((entry) => entry.id === setId);
                    const questions = page.locator(".exercise-item");
                    await questions.first().waitFor();
                    for (let index = 0; index < set.items.length; index += 1) {
                        const item = set.items[index];
                        const question = questions.nth(index);
                        if (item.type === "multiple-choice") await question.getByLabel(item.answer, { exact: true }).check();
                        else await question.locator('input[type="text"]').fill(item.answer);
                    }
                    await page.getByRole("button", { name: "Check answers", exact: true }).click();
                    assert((await page.locator(".exercise-result").textContent()).startsWith(set.items.length + "/" + set.items.length + "."), data.page + ": correct answers were not accepted");
                }
                console.log("ok " + width + "px " + data.page);
            }
            assert(errors.length === 0, "Browser errors: " + errors.join("; "));
            await context.close();
        }
    } finally {
        await browser.close();
    }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
