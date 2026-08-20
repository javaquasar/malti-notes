const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const host = "127.0.0.1";
const port = Number(process.env.FUNCTIONAL_PORT || 4175);
const defaultChromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const chromePath = process.env.CHROME_PATH || (fs.existsSync(defaultChromePath) ? defaultChromePath : "");
const baseUrl = `http://${host}:${port}`;
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webp": "image/webp",
  ".wasm": "application/wasm"
};
const bankPages = fs.readdirSync(root)
  .filter((file) => file.endsWith(".html"))
  .filter((file) => /data-(?:example|question)-group/.test(fs.readFileSync(path.join(root, file), "utf8")))
  .sort();

const courseTopicPages = [
  { pageName: "introductions_alphabet.html", groupSelector: "[data-introduction-group]", groupCount: 2, exerciseSetCount: 1, contextLinkCount: 1 },
  { pageName: "school_classroom.html", groupSelector: "[data-school-group]", groupCount: 2, exerciseSetCount: 2, contextLinkCount: 2 },
  { pageName: "hobbies_future.html", groupSelector: "[data-hobby-group]", groupCount: 2, exerciseSetCount: 1, contextLinkCount: 1 },
  { pageName: "environment_recycling.html", groupSelector: "[data-recycling-group]", groupCount: 2, exerciseSetCount: 1, contextLinkCount: 1 }
];

const framedGroupClassTokens = [
  "content-group",
  "open-group",
  "example-bank-section",
  "shopping-dialogue-bank",
  "grammar-contrast-card",
  "wide-box"
];
const framedGroupSelector = framedGroupClassTokens.map((token) => `.${token}`).join(", ");
const framedGroupPages = fs.readdirSync(root)
  .filter((file) => file.endsWith(".html"))
  .filter((file) => framedGroupClassTokens.some((token) => fs.readFileSync(path.join(root, file), "utf8").includes(token)))
  .sort();


function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeServer() {
  return http.createServer((request, response) => {
    const requestUrl = new URL(request.url, baseUrl);
    const relativePath = decodeURIComponent(requestUrl.pathname) === "/"
      ? "index.html"
      : decodeURIComponent(requestUrl.pathname).slice(1);
    const filePath = path.resolve(root, relativePath);

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      response.end(data);
    });
  });
}

async function openCleanPage(page, pageName) {
  await page.goto(`${baseUrl}/index.html`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => window.localStorage.clear());
  await page.goto(`${baseUrl}/${pageName}`, { waitUntil: "networkidle" });
}

async function runTest(context, name, callback) {
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    await callback(page);
    assert(pageErrors.length === 0, `Unexpected page error: ${pageErrors.join("; ")}`);
    console.log(`ok - ${name}`);
  } finally {
    await page.close();
  }
}

async function main() {
  const server = makeServer();
  await new Promise((resolve) => server.listen(port, host, resolve));
  const browser = await chromium.launch(chromePath ? { executablePath: chromePath } : {});

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

    await runTest(context, "site search opens the matching page", async (page) => {
      await openCleanPage(page, "index.html");
      const search = page.locator("[data-site-search]");
      await search.fill("verbs guide");
      const firstResult = page.locator(".site-search-result").first();
      await firstResult.waitFor();
      const firstHref = await firstResult.getAttribute("href");
      assert(firstHref === "./verbs_guide.html", `Verb guide was not the first result (${firstHref}).`);
      await Promise.all([
        page.waitForURL(/\/verbs_guide\.html$/),
        search.press("Enter")
      ]);
    });

    await runTest(context, "site search finds and reveals learning content", async (page) => {
      await openCleanPage(page, "index.html");
      const search = page.locator("[data-site-search]");
      await search.fill("fekruna");
      const result = page.locator(".site-search-result").filter({ hasText: "fekruna" }).first();
      await result.waitFor();
      const href = await result.getAttribute("href");
      assert(href.includes("find=fekruna"), "Content result does not carry a reveal target.");
      await Promise.all([page.waitForURL(/find=fekruna/), result.click()]);
      await page.locator(".is-search-target").waitFor();
      assert(String(await page.locator(".is-search-target").first().textContent()).toLowerCase().includes("fekruna"), "Destination content was not revealed.");
    });

    await runTest(context, "site directory is generated from the shared map", async (page) => {
      await openCleanPage(page, "all_pages.html");
      assert(await page.locator("[data-site-map-directory] > .section").count() === 5, "Site directory does not contain five groups.");
      assert(await page.locator("[data-site-map-directory] .page-card").count() === 45, "Site directory page count is out of sync.");
      assert(await page.locator("[data-site-map-jumps] .action-link").count() === 5, "Site directory quick jumps are incomplete.");
    });

    await runTest(context, "course path saves objectives and quick-check progress", async (page) => {
      await openCleanPage(page, "course_path.html");
      await page.locator('[data-course-level="b1"]:not([hidden])').waitFor();
      assert(await page.locator('[data-course-level="b1"] [data-course-chapter]').count() === 7, "B1 chapter count is incomplete.");

      const firstObjective = page.locator('[data-course-chapter="b1-introductions"] [data-objective-key]').first();
      await firstObjective.check();
      await page.locator('[data-course-chapter="b1-introductions"] .course-practice > summary').click();
      const exercise = page.locator('[data-exercise-set="b1-introductions-check"]');
      await exercise.locator('[data-exercise-item="name-introduction"] input[value="Jien jisimni Lara."]').check();
      await exercise.locator('[data-exercise-item="complete-name"] input').fill("jisimni");
      const matching = exercise.locator('[data-exercise-item="adjective-gender"] select');
      await matching.nth(0).selectOption("ferħana");
      await matching.nth(1).selectOption("attiva");
      await matching.nth(2).selectOption("ċajtiera");
      await exercise.locator('button[type="submit"]').click();
      assert((await exercise.locator(".exercise-result").textContent()).includes("passed"), "Quick check did not pass.");

      const saved = await page.evaluate(() => ({
        course: JSON.parse(localStorage.getItem("malti_course_progress_v1")),
        exercises: JSON.parse(localStorage.getItem("malti_exercise_progress_v1"))
      }));
      assert(saved.course.objectives["b1-introductions::identity"] === true, "Course objective was not saved.");
      assert(saved.exercises["b1-introductions-check"].passed === true, "Exercise result was not saved.");

      await page.locator('[data-course-level-button="b2"]').click();
      assert(await page.locator('[data-course-level="b2"]:not([hidden]) [data-course-chapter]').count() === 7, "B2 chapter count is incomplete.");
      await page.reload({ waitUntil: "networkidle" });
      assert(await page.locator('[data-objective-key="b1-introductions::identity"]').isChecked(), "Course objective was not restored.");
    });

    await runTest(context, "course progress summarizes target states and filters chapters", async (page) => {
      await openCleanPage(page, "course_progress.html");
      await page.evaluate(() => {
        localStorage.setItem("malti_course_target_progress_v1", JSON.stringify({
          "b1-animals-kelb": { state: "mastered" },
          "b1-animals-kelba": { state: "learning" },
          "b1-animals-qattus": { state: "review" }
        }));
        localStorage.setItem("malti_exercise_progress_v1", JSON.stringify({
          "b1-animals-diagnostic": { attempts: 1, bestScore: 8, total: 10, passed: true },
          "b1-animals-checkpoint-1": { attempts: 1, bestScore: 12, total: 12, passed: true }
        }));
      });
      await page.reload({ waitUntil: "networkidle" });
      assert(await page.locator("[data-progress-chapter]").count() === 14, "Course progress chapter count is incomplete.");
      assert((await page.locator("[data-progress-mastered]").textContent()).trim() === "1", "Mastered target total is incorrect.");
      assert((await page.locator("[data-progress-learning]").textContent()).trim() === "1", "Learning target total is incorrect.");
      assert((await page.locator("[data-progress-review]").textContent()).trim() === "1", "Review target total is incorrect.");
      assert((await page.locator("[data-progress-new]").textContent()).trim() === "476", "Not-started target total is incorrect.");
      const animals = page.locator('[data-progress-chapter="b1-animals"]');
      assert((await animals.textContent()).includes("1/28"), "Animals mastery is missing from chapter progress.");
      assert((await animals.textContent()).includes("1/5 passed"), "Animals checkpoint progress is incorrect.");
      assert((await animals.locator(".course-progress-action-cell a").textContent()).trim() === "Review 1 due", "Due state did not choose the expected chapter action.");
      await page.locator('[data-progress-filter="b2"]').click();
      assert(await page.locator('[data-progress-level="b2"]:visible').count() === 7, "B2 progress filter is incomplete.");
      assert(await page.locator('[data-progress-level="b1"]:visible').count() === 0, "B1 rows remain visible after selecting B2.");
    });

    await runTest(context, "Today builds a focused adaptive study queue", async (page) => {
      await openCleanPage(page, "today.html");
      await page.evaluate(() => {
        window.MaltiReviewStore.addCustomWord({
          maltese: "kelma tal-lum",
          english: "today word",
          topic: "Today test"
        });
        localStorage.setItem("malti_course_target_progress_v1", JSON.stringify({
          "b1-animals-kelb": {
            state: "review",
            dueAt: new Date(Date.now() - 60000).toISOString()
          }
        }));
      });
      await page.reload({ waitUntil: "networkidle" });
      assert((await page.locator("[data-today-review-count]").textContent()).trim() === "1 due", "Today did not count due review cards.");
      assert((await page.locator("[data-today-target-count]").textContent()).trim() === "1 due", "Today did not count due course targets.");
      await page.locator('[data-minutes="30"]').click();
      assert(await page.evaluate(() => localStorage.getItem("malti_today_minutes_v1")) === "30", "Today did not save the selected duration.");
      const primary = page.locator("[data-today-primary]");
      assert((await primary.getAttribute("href")).includes("review_cards.html?quick=due&limit=15"), "Today did not adapt the review limit to 30 minutes.");
      await Promise.all([page.waitForURL(/review_cards\.html\?quick=due&limit=15/), primary.click()]);
      assert((await page.locator("#review-session-status").textContent()).includes("Today's due cards"), "Due review session did not start from Today.");
    });

    await runTest(context, "wrong exercise answers flow into the mistake journal", async (page) => {
      await openCleanPage(page, "course_path.html");
      await page.locator('[data-course-chapter="b1-introductions"] .course-practice > summary').click();
      const exercise = page.locator('[data-exercise-set="b1-introductions-check"]');
      await exercise.locator('button[type="submit"]').click();
      let journal = await page.evaluate(() => window.MaltiMistakeStore.getAll());
      assert(journal.length === 4 && journal.every((entry) => entry.status === "open"), "Wrong answers were not added to the mistake journal.");

      await exercise.getByRole("button", { name: "Try again" }).click();
      await exercise.locator('[data-exercise-item="name-introduction"] input[value="Jien jisimni Lara."]').check();
      await exercise.locator('[data-exercise-item="complete-name"] input').fill("jisimni");
      const matching = exercise.locator('[data-exercise-item="adjective-gender"] select');
      await matching.nth(0).selectOption("ferħana");
      await matching.nth(1).selectOption("attiva");
      await matching.nth(2).selectOption("ċajtiera");
      await exercise.locator('[data-exercise-item="personal-happy-production"] input').fill("ferħan");
      await exercise.locator('button[type="submit"]').click();
      journal = await page.evaluate(() => window.MaltiMistakeStore.getAll());
      assert(journal.every((entry) => entry.correctStreak === 1), "Correct retry did not advance mistake remediation.");

      await page.goto(`${baseUrl}/mistakes.html`, { waitUntil: "networkidle" });
      assert((await page.locator("[data-mistake-open]").textContent()).trim() === "4", "Mistake journal open count is incorrect.");
      await page.locator("[data-mistake-reveal]").click();
      await page.locator("[data-mistake-correct]").click();
      assert((await page.locator("[data-mistake-open]").textContent()).trim() === "3", "Two correct attempts did not resolve a mistake.");
      assert((await page.locator("[data-mistake-resolved]").textContent()).trim() === "1", "Resolved mistake count is incorrect.");
    });

    await runTest(context, "grammar path tracks recognition, production, and rule mistakes", async (page) => {
      await openCleanPage(page, "grammar_path.html");
      await page.locator(".grammar-target").first().waitFor();
      assert(await page.locator(".grammar-target").count() === 17, "Grammar path does not contain seventeen targets.");
      assert(await page.locator(".grammar-rule-box").count() === 17, "Grammar rules do not share the framed visual contract.");

      await page.locator('[data-grammar-level="B1"]').click();
      assert(await page.locator(".grammar-target").count() === 8, "B1 grammar filter is incorrect.");
      assert(await page.locator("#grammar-subject-pronouns").isVisible(), "B1 grammar filter omits subject pronouns.");
      assert(await page.locator("#grammar-collective-forms").isVisible(), "B1 grammar filter omits collective noun forms.");
      await page.locator('[data-grammar-level="B2"]').click();
      assert(await page.locator(".grammar-target").count() === 9, "B2 grammar filter is incorrect.");
      assert(await page.locator("#grammar-past-person-forms").isVisible(), "B2 grammar filter omits past-tense forms.");
      assert(await page.locator("#grammar-verb-negation").isVisible(), "B2 grammar filter omits verb negation.");

      const future = page.locator("#grammar-future-se");
      await future.locator(".grammar-practice > summary").click();
      const practice = future.locator(".exercise-set");
      await practice.locator(".exercise-item").first().waitFor();
      await practice.locator('button[type="submit"]').click();
      let state = await page.evaluate(() => ({
        target: JSON.parse(localStorage.getItem("malti_course_target_progress_v1"))["grammar-future-se"],
        mistakes: window.MaltiMistakeStore.getAll()
      }));
      assert(state.target.state === "review", "Missed grammar target was not scheduled for review.");
      assert(state.mistakes.length === 2 && state.mistakes.every((entry) => entry.category === "grammar" && entry.ruleId === "grammar-future-se"), "Grammar mistakes lost their rule category.");

      await practice.getByRole("button", { name: "Try again" }).click();
      await practice.locator('input[value="Għada se mmur il-belt."]').check();
      await practice.locator('[data-exercise-item="grammar-future-se-focused-production"] input').fill("se mmur");
      await practice.locator('button[type="submit"]').click();
      state = await page.evaluate(() => JSON.parse(localStorage.getItem("malti_course_target_progress_v1"))["grammar-future-se"]);
      assert(state.state === "learning" && state.recognitionCorrect && state.productionCorrect, "Successful grammar practice did not record both mastery modes.");

      await page.goto(`${baseUrl}/mistakes.html`, { waitUntil: "networkidle" });
      await page.locator('[data-mistake-category] option[value="grammar"]').waitFor({ state: "attached" });
      await page.locator("[data-mistake-category]").selectOption("grammar");
      assert(await page.locator(".mistake-entry").count() === 2, "Grammar category filter does not isolate rule mistakes.");
      assert((await page.locator(".mistake-entry").first().textContent()).includes("future se"), "Grammar mistake does not expose its stable rule label.");

      await page.goto(`${baseUrl}/grammar_path.html?course=b2&chapter=b2-hobbies&step=5&view=chapter`, { waitUntil: "networkidle" });
      await page.locator("#grammar-future-se").waitFor();
      assert(await page.locator(".grammar-target:visible").count() === 2, "Chapter grammar view is not scoped to its targets.");
      assert(await page.locator("#grammar-past-person-forms").isVisible(), "Chapter grammar view omits the past-tense target.");
    });

    await runTest(context, "milestone tests stay balanced across course chapters", async (page) => {
      await openCleanPage(page, "course_exam.html");
      const stage = page.locator("[data-course-exam-stage]");
      await stage.locator(".exercise-item").first().waitFor();
      assert(await stage.locator(".exercise-item").count() === 28, "B1 milestone item count is incorrect.");
      assert((await page.locator("[data-exam-chapters]").textContent()).trim() === "7", "B1 milestone chapter count is incorrect.");

      await page.locator('[data-exam-set="course-milestone-b2"]').click();
      await page.waitForFunction(() => document.querySelector("[data-course-exam-stage]")?.dataset.exerciseSet === "course-milestone-b2" && document.querySelectorAll("[data-course-exam-stage] .exercise-item").length === 28);
      await page.locator('[data-exam-set="course-milestone-mixed"]').click();
      await page.waitForFunction(() => document.querySelector("[data-course-exam-stage]")?.dataset.exerciseSet === "course-milestone-mixed" && document.querySelectorAll("[data-course-exam-stage] .exercise-item").length === 28);
      assert((await page.locator("[data-exam-chapters]").textContent()).trim() === "14", "Mixed milestone does not cover all chapters.");
      assert((await page.locator("[data-exam-balance]").textContent()).includes("14 recognition and 14 production"), "Mixed milestone modes are not balanced.");
      const structure = await page.evaluate(async () => {
        const data = await fetch("./assets/data/course_milestone_assessments.json").then((response) => response.json());
        return data.sets.map((set) => ({ chapters: new Set(set.items.map((item) => item.sourceChapterId)).size, modes: set.modeCounts, uniqueIds: new Set(set.items.map((item) => item.id)).size }));
      });
      assert(structure.every((set, index) => set.chapters === (index === 2 ? 14 : 7) && set.modes.recognition === set.modes.production && set.uniqueIds === 28), "Generated milestone structure is incomplete.");
    });

    await runTest(context, "coverage tests rotate and track the complete learning bank", async (page) => {
      await openCleanPage(page, "coverage_test.html");
      const stage = page.locator("[data-coverage-test-stage]");
      await stage.locator(".exercise-item").first().waitFor();
      assert(await stage.locator(".exercise-item").count() === 20, "Default coverage session does not contain 20 questions.");
      assert(Number((await page.locator("[data-coverage-total]").textContent()).trim()) >= 1200, "Coverage target total is unexpectedly low.");
      const firstIds = await page.evaluate(() => window.MaltiCoverageTest.getCurrentSession().targetIds);

      await page.reload({ waitUntil: "networkidle" });
      await stage.locator(".exercise-item").first().waitFor();
      const refreshedIds = await page.evaluate(() => window.MaltiCoverageTest.getCurrentSession().targetIds);
      assert(firstIds.join("|") !== refreshedIds.join("|"), "Reload repeated the same coverage session.");

      await page.locator('[data-size="50"]').click();
      assert(await stage.locator(".exercise-item").count() === 50, "Coverage size control did not create 50 questions.");

      await page.locator("[data-coverage-category-list] input").evaluateAll((inputs) => {
        inputs.forEach((input) => {
          const shouldCheck = input.value === "grammar";
          if (input.checked !== shouldCheck) {
            input.checked = shouldCheck;
            input.dispatchEvent(new Event("change", { bubbles: true }));
          }
        });
      });
      assert(await stage.locator(".exercise-item").count() === 17, "Grammar-only coverage does not contain all seventeen rules.");
      assert((await page.evaluate(() => new Set(window.MaltiCoverageTest.getCurrentSession().categories).size)) === 1, "Grammar filter mixed unrelated categories.");

      await stage.locator('button[type="submit"]').click();
      let coverage = await page.evaluate(() => JSON.parse(localStorage.getItem("malti_comprehensive_coverage_v1")));
      assert(Object.keys(coverage.targets).length === 17, "Coverage progress did not save attempted grammar targets.");
      assert((await page.locator("[data-coverage-started]").textContent()).trim() === "17", "Started target count was not updated.");

      await page.locator("[data-coverage-new]").click();
      await stage.locator('button[type="submit"]').click();
      coverage = await page.evaluate(() => JSON.parse(localStorage.getItem("malti_comprehensive_coverage_v1")));
      assert(Object.values(coverage.targets).every((target) => target.modes.recognition?.attempts === 1 && target.modes.production?.attempts === 1), "Coverage cycle did not test both recognition and production.");
      assert((await page.locator("[data-coverage-complete]").textContent()).trim() === "17", "Both-mode coverage total was not updated.");
    });

    await runTest(context, "course runtime loads manifest and one chapter payload", async (page) => {
      const requested = [];
      page.on("request", (request) => requested.push(new URL(request.url()).pathname));
      await openCleanPage(page, "course_chapter.html?chapter=b1-animals");
      await page.locator("[data-course-chapter-title]").getByText("L-Annimali").waitFor();
      assert(requested.some((url) => url.endsWith("/assets/data/course/chapters/b1-animals.json")), "Chapter payload was not requested.");
      ["course_target_bindings.json", "course_target_assessments.json", "course_supplemental_content.json", "course_source_provenance.json"].forEach((file) => {
        assert(!requested.some((url) => url.endsWith(`/assets/data/${file}`)), `${file} was loaded by the chapter runtime.`);
      });

      requested.length = 0;
      await page.goto(`${baseUrl}/course_progress.html`, { waitUntil: "networkidle" });
      assert(requested.some((url) => url.endsWith("/assets/data/course/manifest.json")), "Progress screen did not request the course manifest.");
      assert(!requested.some((url) => url.includes("/assets/data/course/chapters/")), "Progress screen eagerly loaded chapter payloads.");
    });

    await runTest(context, "guided chapter route reports book, mapping, and assessment scope", async (page) => {
      await openCleanPage(page, "course_chapter.html?chapter=b1-animals");
      assert((await page.locator("[data-course-chapter-title]").textContent()).trim() === "L-Annimali", "Animals chapter title is missing.");
      assert((await page.locator("[data-course-book-coverage]").textContent()).trim() === "27 / 27", "Current animals coverage is incorrect.");
      assert((await page.locator("[data-course-guided-coverage]").textContent()).trim() === "28 / 28", "Guided animals coverage is incorrect.");
      assert((await page.locator("[data-course-chapter-pills]").textContent()).includes("B1 pp. 46-64"), "Animals book page range is missing.");
      assert((await page.locator("[data-course-recommendation-title]").textContent()).trim() === "Start with the entry diagnostic", "New chapter did not recommend its diagnostic.");
      assert(await page.locator(".course-step").count() === 3, "Animals chapter steps are incomplete.");
      assert(await page.locator("#chapter-test .exercise-item").count() === 7, "Animals chapter test is incomplete.");
      assert(await page.locator('[data-course-diagnostic] [data-exercise-set="b1-animals-diagnostic"] .exercise-item').count() === 10, "Animals entry diagnostic is incomplete.");
      const animalCheckpoints = page.locator("[data-course-checkpoints] .course-checkpoint");
      assert(await animalCheckpoints.count() === 5, "Animals checkpoints do not cover the chapter in small groups.");
      assert(await animalCheckpoints.locator(".exercise-item").count() === 0, "Closed checkpoints should not render their questions eagerly.");
      await animalCheckpoints.first().locator("summary").click();
      await animalCheckpoints.first().locator(".exercise-item").first().waitFor();
      assert(await animalCheckpoints.first().locator(".exercise-item").count() === 13, "The first animals checkpoint should assess six targets in both modes plus matching.");
      assert(await page.locator("[data-course-supplement-grid] .visual-vocab-card").count() === 7, "Animals supplemental vocabulary is incomplete.");
      assert((await page.locator("[data-course-missing-targets]").textContent()).includes("All required targets are linked"), "Completed chapter still reports missing targets.");
      const supplementCard = page.locator('[data-course-supplement-grid] [data-content-id="b1-animals-brama"]');
      assert(await supplementCard.count() === 1, "The unlinked animals target was not promoted to a supplemental card.");
      assert((await supplementCard.textContent()).includes("Source: B1, Chapter 4, p. 62"), "Supplemental target source page is missing.");
      await supplementCard.locator(".review-add-button").click();
      assert(await page.evaluate(() => window.MaltiReviewStore.hasWord("word::course-supplement::b1-animals-brama")), "Supplemental target was not added to shared review.");
      const firstStepHref = await page.locator(".course-step a").first().getAttribute("href");
      assert(firstStepHref.includes("animals.html?course=b1") && firstStepHref.includes("view=chapter"), "Animals step does not open chapter view.");

      await page.locator("#chapter-test button[type=submit]").click();
      const saved = await page.evaluate(() => ({
        targets: JSON.parse(localStorage.getItem("malti_course_target_progress_v1")),
        review: JSON.parse(localStorage.getItem("malti_review_cards_v2"))
      }));
      assert(Object.values(saved.targets).filter((target) => target.state === "review").length === 3, "Missed target states were not saved.");
      assert(Object.values(saved.targets).filter((target) => target.state === "review").every((target) => target.intervalDays === 0 && target.streak === 0 && Boolean(target.dueAt)), "Missed targets were not scheduled for immediate review.");
      assert(Object.keys(saved.review).length === 8, "Missed chapter answers were not added to shared review.");
      assert((await page.locator("[data-course-review-count]").textContent()).trim() === "3", "Chapter review count did not update.");
    });

    await runTest(context, "book context scopes a topic without changing its full view", async (page) => {
      await openCleanPage(page, "animals.html");
      await page.locator("[data-content-id]").first().waitFor();
      assert(await page.locator("[data-content-id]:visible").count() === 60, "Normal animals topic is not complete.");

      await page.goto(`${baseUrl}/animals.html?course=b1&chapter=b1-animals&step=1&view=chapter`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => document.body.classList.contains("course-topic-chapter-view"));
      assert(await page.locator("[data-content-id]:visible").count() === 18, "Chapter animals view has the wrong card count.");
      assert(await page.locator('[data-course-section-role="extended"]:visible').count() === 0, "Extended animal banks are visible in chapter mode.");
      assert(await page.locator("[data-course-view-toggle]").count() === 1, "Topic scope control is missing.");
      const chapterBulkCount = await page.locator("[data-page-review-add]").evaluate((button) => JSON.parse(button.dataset.items).length);
      assert(chapterBulkCount === 18, "Chapter bulk review contains extended animal cards.");

      await page.locator('[data-course-view="all"]').click();
      assert(await page.locator("[data-content-id]:visible").count() === 60, "Full topic did not restore all animal cards.");
      assert(await page.locator('[data-course-section-role="extended"]:visible').count() === 2, "Full topic did not restore extended animal banks.");
      assert(new URL(page.url()).searchParams.get("view") === "all", "Topic scope was not written to the URL.");
    });

    await runTest(context, "guided chapter scope is derived for every mapped page type", async (page) => {
      await openCleanPage(page, "course_chapter.html?chapter=b2-hobbies");
      assert((await page.locator("[data-course-guided-coverage]").textContent()).trim() === "26 / 26", "B2 hobbies mapping is incorrect.");
      assert(await page.locator(".course-step").count() === 5, "B2 hobbies study steps are incomplete.");
      assert(await page.locator('[data-course-diagnostic] [data-exercise-set="b2-hobbies-diagnostic"] .exercise-item').count() === 10, "B2 hobbies diagnostic is incomplete.");
      assert(await page.locator("[data-course-checkpoints] .course-checkpoint").count() === 5, "B2 hobbies checkpoints are incomplete.");
      const imperativeHref = await page.locator(".course-step a", { hasText: "Imperative Verbs" }).getAttribute("href");
      assert(imperativeHref.includes("imperative_verbs.html") && imperativeHref.includes("view=chapter"), "Mapped imperative step is not scoped.");
      const guideHref = await page.locator(".course-step a", { hasText: "Verbs Guide" }).getAttribute("href");
      assert(!guideHref.includes("view="), "Unmapped verb guide step should keep normal course context.");

      await page.goto(`${baseUrl}/introductions_alphabet.html?course=b1&chapter=b1-introductions&step=1&view=chapter`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => document.body.classList.contains("course-topic-chapter-view"));
      assert(await page.locator("[data-content-id]:visible").count() === 2, "B1 introductions did not keep the two mapped adjective cards.");
      assert((await page.locator("[data-course-scope-status]").textContent()).includes("4 chapter targets"), "Shared-card target count is missing.");
      await page.locator('[data-course-view="all"]').click();
      assert(await page.locator("[data-content-id]:visible").count() === 13, "B1 introductions full view was not restored.");

      await page.goto(`${baseUrl}/numbers_calendar_time.html?course=b2&chapter=b2-imperative&step=2&view=chapter`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => document.body.classList.contains("course-topic-chapter-view"));
      assert(await page.locator('[data-content-id="cardinal-1"]').isVisible(), "Chapter cardinal number is hidden.");
      assert(await page.locator('[data-content-id="cardinal-11"]').isHidden(), "Extended cardinal number is visible.");
      assert(await page.locator('[data-content-id="cardinal-30"]').isHidden(), "Unbound tens are visible.");
      await page.locator('[data-course-view="all"]').click();
      assert(await page.locator('[data-content-id="cardinal-11"]').isVisible(), "Full number topic did not restore 11.");
      assert(await page.locator('[data-content-id="cardinal-30"]').isVisible(), "Full number topic did not restore the tens.");

      await page.goto(`${baseUrl}/imperative_verbs.html?course=b2&chapter=b2-hobbies&step=3&view=chapter`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => document.body.classList.contains("course-topic-chapter-view"));
      const coreImperatives = await page.locator('[data-content-id][data-course-role="core"]:visible').evaluateAll((items) => (
        new Set(items.map((item) => item.dataset.contentId)).size
      ));
      assert(coreImperatives === 5, "B2 hobbies imperative scope has the wrong item set.");
      assert(await page.locator("[data-course-view-toggle]").count() === 1, "Derived imperative scope control is missing.");
    });

    await runTest(context, "linked chapter checks can advance a target to mastery", async (page) => {
      await openCleanPage(page, "course_chapter.html?chapter=b2-hobbies");
      const exercise = page.locator('[data-exercise-set="b2-hobbies-future-check"]');
      await exercise.locator('[data-exercise-item="hobby-do-recognition"] input[value="agħmel"]').check();
      await exercise.locator('[data-exercise-item="hobby-do-production"] input').fill("agħmel");
      await exercise.locator('button[type="submit"]').click();
      let target = await page.evaluate(() => JSON.parse(localStorage.getItem("malti_course_target_progress_v1"))["b2-hobbies-aghmel"]);
      assert(target.state === "learning" && target.recognitionCorrect && target.productionCorrect, "First mixed attempt did not enter learning state.");
      assert(target.intervalDays === 1 && target.streak === 1 && target.ease > 2.3 && Boolean(target.dueAt), "First success did not create an adaptive review schedule.");
      assert(target.modeStats.recognition.attempts === 1 && target.modeStats.production.attempts === 1, "Mode statistics were not recorded.");

      await page.evaluate(() => {
        const progress = JSON.parse(localStorage.getItem("malti_course_target_progress_v1"));
        progress["b2-hobbies-aghmel"].successfulDates = ["2026-08-12"];
        localStorage.setItem("malti_course_target_progress_v1", JSON.stringify(progress));
      });
      await exercise.getByRole("button", { name: "Try again" }).click();
      await exercise.locator('[data-exercise-item="hobby-do-recognition"] input[value="agħmel"]').check();
      await exercise.locator('[data-exercise-item="hobby-do-production"] input').fill("agħmel");
      await exercise.locator('button[type="submit"]').click();
      target = await page.evaluate(() => JSON.parse(localStorage.getItem("malti_course_target_progress_v1"))["b2-hobbies-aghmel"]);
      assert(target.state === "mastered", "Spaced recognition and production did not master the target.");
      assert(target.intervalDays === 3 && target.streak === 2, "Repeated success did not expand the review interval.");
      assert((await page.locator("[data-course-mastery]").textContent()).trim() === "1 / 26", "Chapter mastery metric did not update.");
    });

    await runTest(context, "course topic pages render data, exercises, and chapter context", async (page) => {
      for (const config of courseTopicPages) {
        await openCleanPage(page, config.pageName);
        const groups = page.locator(config.groupSelector);
        await groups.first().locator(":scope > *").first().waitFor();
        assert(await groups.count() === config.groupCount, `${config.pageName} has an incomplete vocabulary group set.`);
        const emptyGroups = await groups.evaluateAll((containers) => containers.filter((container) => !container.children.length).length);
        assert(emptyGroups === 0, `${config.pageName} has an empty vocabulary group.`);

        const exerciseSets = page.locator("[data-exercise-set]");
        await exerciseSets.first().locator(".exercise-item").first().waitFor();
        assert(await exerciseSets.count() === config.exerciseSetCount, `${config.pageName} has an incomplete quick-check set.`);
        const incompleteExerciseSets = await exerciseSets.evaluateAll((sets) => sets.filter((set) => set.querySelectorAll(".exercise-item").length < 3).length);
        assert(incompleteExerciseSets === 0, `${config.pageName} has an incomplete exercise item set.`);

        const contextLinks = page.locator("[data-course-context] .action-link");
        await contextLinks.first().waitFor();
        assert(await contextLinks.count() === config.contextLinkCount, `${config.pageName} has incorrect course chapter context.`);
      }
    });

    await runTest(context, "book verb paradigms render every audited form and save a drill", async (page) => {
      await openCleanPage(page, "verbs_guide.html");
      await page.locator("[data-course-verb-paradigms][data-ready='true']").waitFor();
      assert(await page.locator("[data-course-verb-paradigm]").count() === 18, "Expected 18 book verb paradigms.");
      assert(await page.locator("[data-course-verb-form]").count() === 125, "Expected 125 audited book verb forms.");
      await page.locator("[data-course-verb-book='B2']").click();
      assert(await page.locator("[data-course-verb-list='B2'] [data-course-verb-paradigm]").count() === 8, "Expected 8 B2 paradigms.");
      const first = page.locator("[data-course-verb-list='B2'] [data-course-verb-paradigm]").first();
      await first.locator("summary").click();
      await first.locator(".course-verb-review-button").click();
      const savedCount = await page.evaluate(() => window.MaltiReviewStore.getStats().total);
      assert(savedCount > 0, "Book verb paradigm was not added to Review.");
    });

    await runTest(context, "book checkpoints render varied contextual assessment types", async (page) => {
      await openCleanPage(page, "course_chapter.html?chapter=b1-residence");
      await page.locator("[data-course-assessment-flow] .exercise-item").first().waitFor();
      const checkpoint = page.locator("[data-course-checkpoints] .course-checkpoint").first();
      await checkpoint.locator("summary").click();
      await checkpoint.locator(".exercise-item").first().waitFor();
      assert(await page.locator("[data-course-assessment-flow] .exercise-matching").count() > 0, "Matching checks were not rendered.");
      assert(await page.locator("[data-course-assessment-flow] .exercise-order-bank").count() > 0, "Phrase ordering checks were not rendered.");
      assert(await page.locator("[data-course-assessment-flow] input[value='True']").count() > 0, "True/false checks were not rendered.");
      assert((await page.locator("[data-course-assessment-flow] .exercise-question-header").allTextContents()).some((text) => text.includes("_____")), "Contextual cloze prompts were not rendered.");
      const phraseTokens = await page.locator("[data-course-assessment-flow] .exercise-order-bank").first().locator(".exercise-token").allTextContents();
      assert(phraseTokens.join(" ") !== "karozza tal-linja", "Phrase tokens were shown in answer order.");
    });

    await runTest(context, "generated banks keep the shared card styling", async (page) => {
      await page.goto(`${baseUrl}/index.html`, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => window.localStorage.clear());
      let checkedCards = 0;

      for (const pageName of bankPages) {
        await page.goto(`${baseUrl}/${pageName}`, { waitUntil: "networkidle" });
        const result = await page.locator("[data-example-group], [data-question-group]").evaluateAll((containers) => {
          const problems = [];
          let cardCount = 0;

          containers.forEach((container) => {
            const groupName =
              container.getAttribute("data-example-group") ||
              container.getAttribute("data-question-group") ||
              "unknown";

            Array.from(container.children).forEach((card, index) => {
              const style = window.getComputedStyle(card);
              const strong = card.querySelector(":scope > strong");
              const translation = card.querySelector(":scope > span");
              const issues = [];
              cardCount += 1;

              if (parseFloat(style.borderTopWidth) === 0 || style.borderTopStyle === "none") issues.push("border");
              if (parseFloat(style.paddingTop) === 0) issues.push("padding");
              if (style.backgroundColor === "rgba(0, 0, 0, 0)") issues.push("background");
              if (!strong || window.getComputedStyle(strong).display !== "block") issues.push("Maltese line display");
              if (!translation || window.getComputedStyle(translation).display !== "block") issues.push("translation display");

              if (issues.length) {
                problems.push(`${groupName}[${index}] (${card.className}): ${issues.join(", ")}`);
              }
            });
          });

          return { cardCount, problems };
        });

        assert(result.cardCount > 0, `${pageName} did not render any bank cards.`);
        assert(result.problems.length === 0, `${pageName}: ${result.problems.join("; ")}`);
        checkedCards += result.cardCount;
      }

      assert(checkedCards > 0, "No generated bank cards were checked.");
    });

    await runTest(context, "Year 4 vocabulary uses the shared review store", async (page) => {
      await openCleanPage(page, "year4_exam.html");
      await page.locator("#year4-search").fill("fekruna");
      await page.waitForFunction(() => document.querySelectorAll(".year4-card").length === 1);
      await page.locator("#year4-add-visible").click();
      const saved = await page.evaluate(() => ({
        total: window.MaltiReviewStore.getStats().total,
        visible: window.MaltiYear4Exam.getVisibleItems().length
      }));
      assert(saved.total === 1 && saved.visible === 1, "Year 4 visible word was not saved once.");
      assert(await page.locator(".year4-card .review-add-button").isDisabled(), "Saved Year 4 card did not update its state.");
      await page.reload({ waitUntil: "networkidle" });
      await page.locator("#year4-search").fill("fekruna");
      await page.waitForFunction(() => document.querySelectorAll(".year4-card").length === 1);
      assert(await page.locator(".year4-card .review-add-button").isDisabled(), "Year 4 review state did not survive reload.");
    });

    await runTest(context, "framed content groups keep the shared visual contract", async (page) => {
      await page.goto(`${baseUrl}/index.html`, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => window.localStorage.clear());
      let checkedGroups = 0;

      for (const pageName of framedGroupPages) {
        await page.goto(`${baseUrl}/${pageName}`, { waitUntil: "networkidle" });
        const result = await page.locator(framedGroupSelector).evaluateAll((groups) => {
          const problems = [];

          groups.forEach((group, index) => {
            const style = window.getComputedStyle(group);
            const heading = group.querySelector("h2, h3, h4")?.textContent.trim() || `group ${index + 1}`;
            const borderWidths = [
              style.borderTopWidth,
              style.borderRightWidth,
              style.borderBottomWidth,
              style.borderLeftWidth
            ].map(Number.parseFloat);
            const paddings = [
              style.paddingTop,
              style.paddingRight,
              style.paddingBottom,
              style.paddingLeft
            ].map(Number.parseFloat);
            const issues = [];

            if (borderWidths.some((width) => width === 0) || style.borderTopStyle === "none") issues.push("border");
            if (paddings.some((padding) => padding === 0)) issues.push("padding");
            if (style.backgroundColor === "transparent" || style.backgroundColor === "rgba(0, 0, 0, 0)") issues.push("background");
            if (Number.parseFloat(style.borderTopLeftRadius) === 0) issues.push("radius");

            if (issues.length) {
              problems.push(`${heading} (${group.className}): ${issues.join(", ")}`);
            }
          });

          return { groupCount: groups.length, problems };
        });

        assert(result.groupCount > 0, `${pageName} did not contain any framed groups.`);
        assert(result.problems.length === 0, `${pageName}: ${result.problems.join("; ")}`);
        checkedGroups += result.groupCount;
      }

      assert(checkedGroups > 0, "No framed content groups were checked.");
    });

    await runTest(context, "theme choice survives a reload", async (page) => {
      await openCleanPage(page, "index.html");
      await page.locator("[data-theme-select]").selectOption("contrast");
      assert(await page.evaluate(() => document.documentElement.dataset.theme) === "contrast", "Theme was not applied.");
      await page.reload({ waitUntil: "networkidle" });
      assert(await page.locator("[data-theme-select]").inputValue() === "contrast", "Theme selector was not restored.");
      assert(await page.evaluate(() => document.documentElement.dataset.theme) === "contrast", "Theme dataset was not restored.");
    });

    await runTest(context, "progress backup restores cleared data", async (page) => {
      await openCleanPage(page, "review_cards.html");
      const result = await page.evaluate(() => {
        window.MaltiReviewStore.addCustomWord({
          maltese: "kelma tat-test",
          english: "test word",
          topic: "Functional test"
        });
        window.localStorage.setItem("malti_word_search_seen_words_v1", JSON.stringify(["kelb"]));
        window.localStorage.setItem("malti_course_progress_v1", JSON.stringify({ objectives: { "b1-introductions::identity": true }, activeLevel: "b1" }));
        window.localStorage.setItem("malti_exercise_progress_v1", JSON.stringify({ "b1-introductions-check": { score: 3, total: 3, passed: true } }));
        window.localStorage.setItem("malti_course_target_progress_v1", JSON.stringify({ "b1-animals-kelb": { state: "learning", attempts: 1 } }));
        window.localStorage.setItem("malti_comprehensive_coverage_v1", JSON.stringify({ schemaVersion: 1, counter: 2, targets: { "grammar-future-se": { modes: { recognition: { attempts: 1, correct: 1 } } } } }));
        const backup = window.MaltiProgressBackup.exportBackup();
        const preview = window.MaltiProgressBackup.previewBackup(backup);
        const legacy = JSON.parse(JSON.stringify(backup));
        legacy.format = window.MaltiProgressBackup.LEGACY_FORMAT;
        delete legacy.checksum;
        delete legacy.schemaVersion;
        const legacyPreview = window.MaltiProgressBackup.previewBackup(legacy);
        const tampered = JSON.parse(JSON.stringify(backup));
        tampered.data.malti_site_theme = "forest";
        let tamperRejected = false;
        try {
          window.MaltiProgressBackup.previewBackup(tampered);
        } catch (error) {
          tamperRejected = true;
        }
        window.MaltiProgressBackup.clearAll();
        const clearedTotal = window.MaltiReviewStore.getStats().total;
        const clearedSeen = window.localStorage.getItem("malti_word_search_seen_words_v1");
        const clearedCourse = window.localStorage.getItem("malti_course_progress_v1");
        const clearedExercises = window.localStorage.getItem("malti_exercise_progress_v1");
        const clearedTargets = window.localStorage.getItem("malti_course_target_progress_v1");
        const clearedCoverage = window.localStorage.getItem("malti_comprehensive_coverage_v1");
        const imported = window.MaltiProgressBackup.importBackup(backup, { mode: "replace" });
        return {
          format: backup.format,
          checksum: backup.checksum,
          schemaVersion: preview.schemaVersion,
          storageSchemaVersion: window.MaltiStorage.getMeta().schemaVersion,
          tamperRejected,
          legacyAccepted: legacyPreview.legacy,
          exportedKeys: Object.keys(backup.data).length,
          importedKeys: imported.importedKeys,
          clearedTotal,
          clearedSeen,
          clearedCourse,
          clearedExercises,
          clearedTargets,
          clearedCoverage,
          restoredTotal: window.MaltiReviewStore.getStats().total,
          restoredSeen: JSON.parse(window.localStorage.getItem("malti_word_search_seen_words_v1")),
          restoredCourse: JSON.parse(window.localStorage.getItem("malti_course_progress_v1")),
          restoredExercises: JSON.parse(window.localStorage.getItem("malti_exercise_progress_v1")),
          restoredTargets: JSON.parse(window.localStorage.getItem("malti_course_target_progress_v1")),
          restoredCoverage: JSON.parse(window.localStorage.getItem("malti_comprehensive_coverage_v1"))
        };
      });

      assert(result.format === "malti-progress-backup-v2" && result.checksum.startsWith("fnv1a-"), "Unexpected backup format or checksum.");
      assert(result.schemaVersion === 3 && result.storageSchemaVersion === 3, "Storage schema metadata was not initialized.");
      assert(result.tamperRejected, "Tampered progress backup was accepted.");
      assert(result.legacyAccepted, "Version 1 progress backup is no longer accepted.");
      assert(result.exportedKeys >= 5 && result.importedKeys === result.exportedKeys, "Backup did not contain all progress values.");
      assert(result.clearedTotal === 0 && result.clearedSeen === null && result.clearedCourse === null && result.clearedExercises === null && result.clearedTargets === null && result.clearedCoverage === null, "Progress was not cleared before import.");
      assert(result.restoredTotal === 1 && result.restoredSeen[0] === "kelb", "Review and game progress was not restored.");
      assert(result.restoredCourse.objectives["b1-introductions::identity"] === true, "Course progress was not restored.");
      assert(result.restoredExercises["b1-introductions-check"].passed === true, "Exercise progress was not restored.");
      assert(result.restoredTargets["b1-animals-kelb"].state === "learning", "Course target progress was not restored.");
      assert(result.restoredCoverage.targets["grammar-future-se"].modes.recognition.correct === 1, "Coverage test progress was not restored.");
    });

    await runTest(context, "word search creates a playable puzzle", async (page) => {
      await openCleanPage(page, "word_search.html");
      const cellCount = await page.locator(".word-search-cell").count();
      const wordCount = await page.locator("#word-search-list li").count();
      assert(cellCount > 0, "Word search grid is empty.");
      assert(wordCount > 0, "Word search list is empty.");
      await page.locator("#word-search-new").click();
      await page.waitForFunction((previous) => document.querySelectorAll(".word-search-cell").length === previous, cellCount);
      assert(await page.locator("#word-search-total").textContent(), "Word search total is empty.");
    });

    await runTest(context, "memory game creates a complete deck", async (page) => {
      await openCleanPage(page, "memory_game.html");
      assert(await page.locator(".memory-card").count() === 16, "Memory game did not create 16 cards.");
      await page.locator("#memory-new").click();
      assert(await page.locator(".memory-card").count() === 16, "New memory game has an incomplete deck.");
      assert((await page.locator("#memory-score").textContent()).trim() === "0 / 8 matched", "Memory score did not reset.");
    });

    await runTest(context, "offline application assets are registered", async (page) => {
      await openCleanPage(page, "index.html");
      const result = await page.evaluate(async () => {
        const manifest = await fetch(document.querySelector('link[rel="manifest"]').href).then((response) => response.json());
        const registration = await navigator.serviceWorker.ready;
        return {
          name: manifest.name,
          startUrl: manifest.start_url,
          hasActiveWorker: Boolean(registration.active)
        };
      });
      assert(result.name === "Maltese Study Site", "Web manifest was not loaded.");
      assert(result.startUrl === "./index.html", "Web manifest has an unexpected start URL.");
      assert(result.hasActiveWorker, "Service worker did not become active.");
    });

    await runTest(context, "visited course chapter remains available offline", async (page) => {
      await openCleanPage(page, "course_chapter.html?chapter=b1-animals");
      await page.locator("[data-course-chapter-title]").getByText("L-Annimali").waitFor();
      await page.evaluate(() => navigator.serviceWorker.ready);
      await page.context().setOffline(true);
      try {
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.locator("[data-course-chapter-title]").getByText("L-Annimali").waitFor();
        assert((await page.locator("[data-course-book-coverage]").textContent()).trim() === "27 / 27", "Offline chapter payload was incomplete.");
      } finally {
        await page.context().setOffline(false);
      }
    });

    await context.close();
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
