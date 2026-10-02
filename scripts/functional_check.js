const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("playwright");
const { allFunctionalTestNames, functionalSuites, suiteNames } = require("./functional_suites");

const root = path.resolve(__dirname, "..");
const host = "127.0.0.1";
const port = Number(process.env.FUNCTIONAL_PORT || 4175);
const defaultChromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const useBundledBrowser = process.env.PLAYWRIGHT_USE_BUNDLED === "1";
const chromePath = useBundledBrowser ? "" : process.env.CHROME_PATH || (fs.existsSync(defaultChromePath) ? defaultChromePath : "");
const baseUrl = `http://${host}:${port}`;
const suiteArgumentIndex = process.argv.indexOf("--suite");
const requestedSuite = process.env.FUNCTIONAL_SUITE
  || (suiteArgumentIndex >= 0 ? process.argv[suiteArgumentIndex + 1] : "");
const listSuites = process.argv.includes("--list");
const selectedTestNames = requestedSuite ? new Set(functionalSuites[requestedSuite] || []) : null;
const assignedTestNames = new Set(allFunctionalTestNames);
const observedTestNames = new Set();
let executedTestCount = 0;
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
const vocabularyCardPages = fs.readdirSync(root)
  .filter((file) => file.endsWith(".html"))
  .filter((file) => fs.readFileSync(path.join(root, file), "utf8").includes("vocab-review-page.js"))
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
function hasClassToken(contents, token) {
  return [...contents.matchAll(/class="([^"]+)"/g)]
    .some((match) => match[1].split(/\s+/).includes(token));
}
const framedGroupPages = fs.readdirSync(root)
  .filter((file) => file.endsWith(".html"))
  .filter((file) => {
    const contents = fs.readFileSync(path.join(root, file), "utf8");
    return framedGroupClassTokens.some((token) => hasClassToken(contents, token));
  })
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
  assert(assignedTestNames.has(name), `Functional test is not assigned to a suite: ${name}`);
  observedTestNames.add(name);
  if (selectedTestNames && !selectedTestNames.has(name)) return;
  executedTestCount += 1;

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
  assert(!requestedSuite || suiteNames.includes(requestedSuite), `Unknown functional suite: ${requestedSuite}. Expected one of: ${suiteNames.join(", ")}`);
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
      assert(await page.locator("[data-site-map-directory] .page-card").count() === 46, "Site directory page count is out of sync.");
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
      assert((await page.locator("[data-progress-target-total]").textContent()).trim() === "479 targets", "Course target total is stale.");
      assert((await page.locator("[data-depth-summary]").textContent()).trim() === "479/479 fully taught", "Teaching-depth summary is incomplete.");
      assert(await page.locator("[data-depth-stages] .status-chip").count() === 6, "Teaching-depth stages are incomplete.");
      const animals = page.locator('[data-progress-chapter="b1-animals"]');
      assert((await animals.textContent()).includes("1/28"), "Animals mastery is missing from chapter progress.");
      assert((await animals.textContent()).includes("1/5 passed"), "Animals checkpoint progress is incorrect.");
      assert((await animals.textContent()).includes("28/28 complete"), "Animals teaching depth is missing from chapter progress.");
      assert((await animals.locator(".course-progress-action-cell a").textContent()).trim() === "Review 1 due", "Due state did not choose the expected chapter action.");
      await page.locator('[data-progress-filter="b2"]').click();
      assert(await page.locator('[data-progress-level="b2"]:visible').count() === 7, "B2 progress filter is incomplete.");
      assert(await page.locator('[data-progress-level="b1"]:visible').count() === 0, "B1 rows remain visible after selecting B2.");
    });

    await runTest(context, "knowledge map explains the next study action", async (page) => {
      await openCleanPage(page, "knowledge_map.html");
      await page.evaluate(() => {
        window.MaltiReviewStore.addCustomWord({
          maltese: "kelma dghajfa",
          english: "weak word",
          topic: "Knowledge map test"
        });
        localStorage.setItem("malti_course_target_progress_v1", JSON.stringify({
          "b1-animals-qattus": {
            state: "review",
            dueAt: new Date(Date.now() - 60000).toISOString()
          },
          "grammar-agreement": { state: "learning", attempts: 1 }
        }));
        localStorage.setItem("malti_course_progress_v1", JSON.stringify({
          objectives: { "b1-introductions::identity": true }
        }));
        window.MaltiMistakeStore.recordAttempt({
          id: "knowledge-map-grammar-error",
          prompt: "Choose the agreeing adjective",
          correctAnswer: "karozza hamra",
          topic: "Gender agreement",
          category: "grammar",
          ruleId: "grammar-agreement",
          targetIds: ["grammar-agreement"]
        }, false);
      });
      await page.reload({ waitUntil: "networkidle" });

      assert(await page.locator("[data-knowledge-area]").count() === 14, "Knowledge map chapter coverage is incomplete.");
      assert((await page.locator("[data-knowledge-metric-due]").textContent()).trim() === "2", "Knowledge map did not combine due cards and course targets.");
      assert((await page.locator("[data-knowledge-metric-mistakes]").textContent()).trim() === "1", "Knowledge map did not count open mistakes.");
      assert((await page.locator("[data-knowledge-next-title]").textContent()).includes("Resolve 1 open mistake"), "Knowledge map did not prioritize the strongest learning signal.");
      assert(await page.locator("[data-knowledge-next-reasons] li").count() === 3, "Knowledge map does not explain its recommendation.");
      assert((await page.locator("[data-knowledge-vocabulary]").textContent()).includes("kelma dghajfa"), "Weak vocabulary is missing from the knowledge map.");
      const grammar = page.locator("[data-knowledge-grammar]");
      assert((await grammar.textContent()).includes("Gender and number agreement"), "Weak grammar target is missing from the knowledge map.");
      assert((await grammar.textContent()).includes("1 open mistake"), "Grammar focus does not explain its weak state.");
      assert((await page.locator('[data-knowledge-area="b1-introductions"]').textContent()).includes("Mistakes 1"), "Mistake was not connected to its chapter.");
      assert((await page.locator('[data-knowledge-area="b1-animals"]').textContent()).includes("Due 1"), "Due target was not connected to its chapter.");
      await page.locator('[data-knowledge-filter="b2"]').click();
      assert(await page.locator('[data-knowledge-level="b2"]:visible').count() === 7, "B2 knowledge map filter is incomplete.");
      assert(await page.locator('[data-knowledge-level="b1"]:visible').count() === 0, "B1 knowledge areas remain visible after selecting B2.");
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
      const stepNumberLayout = await page.locator(".course-step-number").evaluateAll((numbers) => numbers.map((number) => {
        const badge = number.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(number);
        const label = range.getBoundingClientRect();
        return {
          isSquare: Math.abs(badge.width - badge.height) < 0.5,
          hasStableSize: badge.width >= 28,
          containsLabel: label.left >= badge.left && label.right <= badge.right && label.top >= badge.top && label.bottom <= badge.bottom
        };
      }));
      assert(stepNumberLayout.every((number) => number.isSquare && number.hasStableSize && number.containsLabel), "Chapter step numbers do not fit inside their circular badges.");
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
      const supplementBookmark = supplementCard.locator(".review-add-button--icon");
      assert(await supplementBookmark.getAttribute("aria-label") === "Add to review", "Supplemental vocabulary does not use the bookmark action.");
      await supplementBookmark.click();
      assert(await page.evaluate(() => window.MaltiReviewStore.hasWord("word::course-supplement::b1-animals-brama")), "Supplemental target was not added to shared review.");
      assert(await supplementBookmark.getAttribute("aria-label") === "Remove from review", "Saved supplemental bookmark does not expose removal.");
      await supplementBookmark.click();
      assert(!await page.evaluate(() => window.MaltiReviewStore.hasWord("word::course-supplement::b1-animals-brama")), "Supplemental bookmark did not remove the saved word.");
      await supplementBookmark.click();
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
      const standaloneGrammarTables = page.locator("#lesson6-inserted-i > .table-scroll > table, #qed-system > table, #present > table, #future > table");
      assert(await standaloneGrammarTables.count() === 4, "Expected four standalone grammar tables.");
      assert(await standaloneGrammarTables.evaluateAll((tables) => tables.every((table) => !table.closest(".study-card"))), "Standalone grammar tables must not have a second framed wrapper.");
      const comparisonWrapper = page.locator("#lesson6-inserted-i > .table-scroll");
      const comparisonFrame = await comparisonWrapper.evaluate((wrapper) => {
        const styles = getComputedStyle(wrapper);
        return {
          borderWidth: styles.borderWidth,
          desktopScrolls: wrapper.scrollWidth > wrapper.clientWidth
        };
      });
      assert(comparisonFrame.borderWidth === "0px", "Comparison table kept an outer frame.");
      assert(!comparisonFrame.desktopScrolls, "Comparison table should fit without scrolling on desktop.");
      assert(await standaloneGrammarTables.evaluateAll((tables) => tables.every((table) => table.classList.contains("table-soft"))), "Standalone grammar tables lost their light surface styling.");
      const tableSurfaceMetrics = await standaloneGrammarTables.evaluateAll((tables) => {
        const renderedPixel = (backgrounds) => {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d", { willReadFrequently: true });
          canvas.width = 1;
          canvas.height = 1;
          backgrounds.forEach((background) => {
            context.fillStyle = background;
            context.fillRect(0, 0, 1, 1);
          });
          return Array.from(context.getImageData(0, 0, 1, 1).data.slice(0, 3));
        };

        return tables.map((table) => {
          const contentCard = table.closest(".content-card");
          const parentBackground = getComputedStyle(contentCard).backgroundColor;
          const defaultCard = document.querySelector("#past .study-card");
          const parentPixel = renderedPixel([parentBackground]);
          const tablePixel = renderedPixel([parentBackground, getComputedStyle(table).backgroundColor]);
          const defaultCardPixel = renderedPixel([parentBackground, getComputedStyle(defaultCard).backgroundColor]);
          return {
            distance: tablePixel.reduce((distance, channel, index) => distance + Math.abs(channel - parentPixel[index]), 0),
            defaultCardDistance: tablePixel.reduce(
              (distance, channel, index) => distance + Math.abs(channel - defaultCardPixel[index]),
              0
            )
          };
        });
      });
      assert(tableSurfaceMetrics.every(({ distance }) => distance >= 6), "Standalone grammar tables must keep a distinct fill from their parent cards.");
      assert(tableSurfaceMetrics.every(({ defaultCardDistance }) => defaultCardDistance <= 3), "Standalone grammar tables must match the default study-card fill.");
      await page.setViewportSize({ width: 390, height: 900 });
      const mobileComparison = await comparisonWrapper.evaluate((wrapper) => ({
        clientWidth: wrapper.clientWidth,
        scrollWidth: wrapper.scrollWidth,
        tableWidth: wrapper.querySelector("table").getBoundingClientRect().width
      }));
      assert(mobileComparison.scrollWidth > mobileComparison.clientWidth && mobileComparison.tableWidth >= 720, "Wide comparison table does not scroll cleanly on mobile.");
      await page.setViewportSize({ width: 1280, height: 900 });
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

    await runTest(context, "lesson support surfaces keep consistent spacing and width", async (page) => {
      await openCleanPage(page, "common_mistakes.html");
      const contrastGap = await page.locator("#qed-system").evaluate((section) => {
        const contrast = section.querySelector(".grammar-contrast-grid").getBoundingClientRect();
        const bank = section.querySelector('[data-example-group="qed-system"]').closest(".section-stack").getBoundingClientRect();
        return bank.top - contrast.bottom;
      });
      assert(contrastGap >= 16, "The correction bank touches the Wrong/Right cards.");
      assert(await page.locator(".grammar-contrast-grid").count() === 6, "Common mistakes lost a Wrong/Right comparison.");
      assert(await page.locator(".grammar-contrast-card").count() === 12, "Common mistakes lost a contrast card.");
      assert(await page.locator("main .open-group .study-card").count() === 0, "Common mistakes still nests correction cards inside framed groups.");
      assert(await page.locator("main .open-group").count() === 1, "Common mistakes should frame only its final checklist.");
      assert(await page.locator(".section-stack > [data-example-group]").count() === 6, "Common mistakes correction banks lost their neutral wrappers.");
      assert(await page.locator("[data-example-group] > article").count() === 28, "Common mistakes did not render all unique correction examples.");
      const articleBankWidth = await page.locator('[data-example-group="articles-prepositions"] > article').first().evaluate((card) => (
        card.getBoundingClientRect().width / card.closest(".content-card").getBoundingClientRect().width
      ));
      assert(articleBankWidth > 0.4, "Article and preposition correction cards remain compressed into a half-width column.");

      await openCleanPage(page, "daily_routine.html");
      const routineSurface = await page.locator("#time-blocks .formula + .study-card").evaluate((surface) => {
        const surfaceRect = surface.getBoundingClientRect();
        const sectionRect = surface.parentElement.getBoundingClientRect();
        return {
          isDirectChild: surface.parentElement.id === "time-blocks",
          relativeWidth: surfaceRect.width / sectionRect.width
        };
      });
      assert(routineSurface.isDirectChild && routineSurface.relativeWidth > 0.9, "Routine examples do not use the available content width.");

      await openCleanPage(page, "pronouns_possessives.html");
      const pronounTables = page.locator("main table");
      assert(await pronounTables.count() === 9, "Pronouns page lost a reference table.");
      const pronounTableSurfaces = await pronounTables.evaluateAll((tables) => tables.map((table) => {
        const wrapper = table.closest(".section-stack");
        const tableStyle = getComputedStyle(table);
        const wrapperStyle = wrapper ? getComputedStyle(wrapper) : null;
        return {
          hasWrapper: Boolean(wrapper),
          hasLightSurface: table.classList.contains("table-soft") && tableStyle.backgroundColor !== "rgba(0, 0, 0, 0)",
          wrapperBorderWidth: wrapperStyle?.borderWidth || "missing"
        };
      }));
      assert(pronounTableSurfaces.every((surface) => surface.hasWrapper), "A pronoun table lost its neutral layout wrapper.");
      assert(pronounTableSurfaces.every((surface) => surface.hasLightSurface), "A pronoun table lost its light shared fill.");
      assert(pronounTableSurfaces.every((surface) => surface.wrapperBorderWidth === "0px"), "A pronoun table still has a second outer frame.");
      assert(await page.locator("main .open-group .info-card, main .open-group .qa-pair-card, main .open-group .study-card").count() === 0, "Pronouns page still contains nested card groups.");

      await openCleanPage(page, "daily_routine.html");
      const greetingGroups = page.locator("#greetings-small-talk .section-stack");
      assert(await greetingGroups.count() === 2, "Daily routine greeting groups lost their two-column structure.");
      const greetingMetrics = await greetingGroups.evaluateAll((groups) => groups.map((group) => ({
        borderWidth: getComputedStyle(group).borderWidth,
        cards: group.querySelectorAll("[data-example-group] > article").length
      })));
      assert(greetingMetrics.every((group) => group.borderWidth === "0px"), "Daily routine greeting cards still have an outer frame.");
      assert(greetingMetrics.every((group) => group.cards === 4), "Daily routine greeting groups did not render all examples.");

      await openCleanPage(page, "sentence_builder.html");
      const combinationBank = page.locator('[data-example-group="combination-bank"]');
      assert(await combinationBank.count() === 1, "Sentence builder renders a duplicate combination bank target.");
      assert(await combinationBank.locator(":scope > article").count() === 10, "Sentence builder did not render all combination examples.");
      const sentenceBuilderBulkIds = await page.locator("[data-page-sentence-review-add]").evaluate((button) => (
        JSON.parse(button.dataset.items || "[]").map((item) => item.id)
      ));
      assert(sentenceBuilderBulkIds.length === 10, "Sentence builder bulk action does not contain the complete bank.");
      assert(new Set(sentenceBuilderBulkIds).size === sentenceBuilderBulkIds.length, "Sentence builder bulk action contains duplicate cards.");
      const qedTableSurface = await page.locator("#qed-pattern > table").evaluate((table) => ({
        hasLightSurface: table.classList.contains("table-soft") && getComputedStyle(table).backgroundColor !== "rgba(0, 0, 0, 0)",
        hasOuterCard: Boolean(table.closest(".study-card"))
      }));
      assert(qedTableSurface.hasLightSurface, "Sentence builder qed table lost its shared light fill.");
      assert(!qedTableSurface.hasOuterCard, "Sentence builder qed table still has a second outer frame.");

      await openCleanPage(page, "numbers_calendar_time.html");
      const calendarTables = page.locator("[data-vocab-table-group] > table");
      assert(await calendarTables.count() === 7, "Numbers page did not render all seven vocabulary tables.");
      assert(
        await calendarTables.evaluateAll((tables) => tables.every((table) => table.classList.contains("table-soft"))),
        "A numbers-page vocabulary table lost the shared light surface."
      );
      assert(await page.locator('[data-vocab-view-panel="table"].study-card').count() === 0, "Numbers page table views still have a second frame.");
      assert(await page.locator("#time-expressions .open-group").count() === 0, "Numbers page time banks still have an outer frame.");
      assert(await page.locator("#clock-time .study-card").count() === 2, "Numbers page did not preserve the two clock-pattern cards.");
      const countingExamples = page.locator('[data-example-group="counting-sentence-examples"] > article');
      assert(await countingExamples.count() === 5, "Numbers page did not render all counting examples.");
      assert(await countingExamples.locator(".review-add-button--icon").count() === 5, "Counting examples lost their individual Review controls.");
      const countingTable = page.locator("#group-counts table");
      const countingTableSurface = await countingTable.evaluate((table) => ({
        hasLightSurface: table.classList.contains("table-soft") && getComputedStyle(table).backgroundColor !== "rgba(0, 0, 0, 0)",
        hasOuterCard: Boolean(table.closest(".demo-box, .study-card"))
      }));
      assert(countingTableSurface.hasLightSurface, "Counting table lost its shared light fill.");
      assert(!countingTableSurface.hasOuterCard, "Counting table still has a second outer frame.");

      await openCleanPage(page, "health_doctor.html");
      const healthStacks = page.locator("#attached-pronouns .section-stack, #dialogues .section-stack");
      assert(await healthStacks.count() === 4, "Health lesson lost a neutral content wrapper.");
      assert(
        await healthStacks.evaluateAll((stacks) => stacks.every((stack) => getComputedStyle(stack).borderWidth === "0px")),
        "Health lesson still adds an outer frame around a table or card bank."
      );
      assert(await page.locator("main .example-bank-section").count() === 0, "Health lesson still uses framed bank sections.");
      const attachedPronounTable = await page.locator("#attached-pronouns .attached-pattern-table").evaluate((table) => ({
        hasLightSurface: table.classList.contains("table-soft") && getComputedStyle(table).backgroundColor !== "rgba(0, 0, 0, 0)",
        hasOuterCard: Boolean(table.closest(".example-bank-section, .study-card, .open-group"))
      }));
      assert(attachedPronounTable.hasLightSurface, "Attached-pronoun table lost its shared light fill.");
      assert(!attachedPronounTable.hasOuterCard, "Attached-pronoun table still has a second outer frame.");
      assert(await page.locator('[data-example-group] > article').count() === 70, "Health lesson did not render all examples.");
      const healthBulkIds = await page.locator("[data-page-sentence-review-add]").evaluate((button) => (
        JSON.parse(button.dataset.items || "[]").map((item) => item.id)
      ));
      assert(healthBulkIds.length === 58, "Health lesson bulk action does not contain all unique Review items.");
      assert(new Set(healthBulkIds).size === healthBulkIds.length, "Health lesson bulk action contains duplicate Review items.");
      assert(await page.locator("#roleplay .open-group").count() === 2, "Health lesson lost a role-play card.");
      assert(await page.locator("#wrong .grammar-contrast-card").count() === 2, "Health lesson lost its Wrong/Right contrast.");
    });

    await runTest(context, "floating review shortcut stays contextual and clear of mobile content", async (page) => {
      const siteMap = JSON.parse(fs.readFileSync(path.join(root, "assets", "data", "site-map.json"), "utf8"));
      const coursePages = siteMap.groups.find((group) => group.id === "course")?.pages || [];
      assert(coursePages.length > 0, "Course group has no pages to verify.");

      for (const coursePage of coursePages) {
        await openCleanPage(page, coursePage.href);
        assert(await page.locator(".review-fab").count() === 0, `${coursePage.href} renders the floating review shortcut.`);
      }

      await openCleanPage(page, "home_furniture.html");
      assert(await page.locator(".review-fab").count() === 1, "A desktop vocabulary page lost the floating review shortcut.");
      assert(await page.locator(".review-fab").isVisible(), "The desktop Review shortcut is hidden.");

      await page.setViewportSize({ width: 980, height: 844 });
      assert(await page.locator(".review-fab").isHidden(), "The Review shortcut covers content at the mobile navigation breakpoint.");
      await page.locator(".site-nav-toggle").click();
      await page.locator(".site-nav-panel .nav-group > summary", { hasText: "Review" }).click();
      assert(
        await page.locator('.site-nav-panel a[href="./review_cards.html"]').isVisible(),
        "Mobile navigation does not provide an accessible Review Cards link."
      );
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
              const isQuestionAnswer = card.getAttribute("data-content-type") === "questionAnswer";
              const isDisclosure = card.getAttribute("data-presentation") === "disclosure";
              const issues = [];
              cardCount += 1;

              if (parseFloat(style.borderTopWidth) === 0 || style.borderTopStyle === "none") issues.push("border");
              if (style.backgroundColor === "rgba(0, 0, 0, 0)") issues.push("background");

              if (isQuestionAnswer) {
                const question = card.querySelector(":scope > .qa-pair-part--question");
                const answer = card.querySelector(":scope > .qa-pair-part--answer");
                if (isDisclosure) {
                  const summary = card.querySelector(":scope > details > summary");
                  const disclosureAnswer = card.querySelector(":scope > details > .qa-pair-part--answer");
                  if (!summary || !disclosureAnswer) issues.push("disclosure structure");
                  if (!disclosureAnswer?.querySelector(".qa-pair-label")) issues.push("answer label");
                } else {
                  const parts = [question, answer].filter(Boolean);
                  if (parts.length !== 2) issues.push("paired structure");
                  if (parts.some((part) => parseFloat(window.getComputedStyle(part).paddingTop) === 0)) issues.push("pair padding");
                  if (parts.some((part) => !part.querySelector(".qa-pair-label"))) issues.push("pair labels");
                  if (parts.some((part) => window.getComputedStyle(part.querySelector(".qa-pair-text")).display !== "block")) issues.push("pair text display");
                }
              } else {
                const strong = card.querySelector(":scope > strong");
                const translation = card.querySelector(":scope > span");
                if (parseFloat(style.paddingTop) === 0) issues.push("padding");
                if (!strong || window.getComputedStyle(strong).display !== "block") issues.push("Maltese line display");
                if (!translation || window.getComputedStyle(translation).display !== "block") issues.push("translation display");
              }

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

    const verificationContext = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      serviceWorkers: "block"
    });
    await runTest(verificationContext, "verified example banks render without quarantined content", async (page) => {
      const cases = [
        ["animals.html", "animals_examples.json"],
        ["picture_description.html", "picture_description_examples.json"],
        ["pronouns_possessives.html", "pronouns_possessives_examples.json"]
      ];

      for (const [pageName, dataFile] of cases) {
        await page.goto(`${baseUrl}/${pageName}`, { waitUntil: "networkidle" });
        const result = await page.evaluate(async (fileName) => {
          const data = await fetch(`./assets/data/${fileName}`).then((response) => response.json());
          const mismatches = [];
          let quarantined = 0;

          (data.groups || []).forEach((group) => {
            [
              ["data-example-group", group.items || []],
              ["data-question-group", group.questions || []]
            ].forEach(([attribute, sourceItems]) => {
              const container = document.querySelector(`[${attribute}="${group.id}"]`);
              if (!container) return;
              const expected = sourceItems.filter((item) => item.verificationStatus !== "needs-review").length;
              quarantined += sourceItems.length - expected;
              if (container.children.length !== expected) {
                mismatches.push(`${group.id}/${attribute}: ${container.children.length}/${expected}`);
              }
            });
          });

          return {
            mismatches,
            quarantined,
            hasMarker: /\[(?:UNCERTAIN|overview-based)\]/i.test(document.body.textContent)
          };
        }, dataFile);

        assert(result.quarantined === 0, `${pageName} still contains ${result.quarantined} quarantined example(s).`);
        assert(result.mismatches.length === 0, `${pageName}: ${result.mismatches.join("; ")}`);
        assert(!result.hasMarker, `${pageName} rendered an uncertainty marker.`);
      }
    });
    await verificationContext.close();

    await runTest(context, "typed question-answer banks render and save the correct sides", async (page) => {
      await openCleanPage(page, "daily_routine.html");
      const bank = page.locator('[data-example-group="daily-routine-qa"]');
      const firstCard = bank.locator(":scope > article").first();
      assert(await firstCard.getAttribute("data-content-type") === "questionAnswer", "Q&A card lost its semantic content type.");
      assert((await firstCard.locator(".qa-pair-part--question .qa-pair-text").textContent()).includes("X'tagħmel filgħodu?"), "Q&A card does not render the question as its prompt.");
      assert((await firstCard.locator(".qa-pair-part--answer .qa-pair-text").textContent()).trim() === "Filgħodu nixrob kafè u niekol ftit ħobż.", "Q&A card does not render the Maltese answer separately.");
      assert((await firstCard.locator(".qa-pair-part--question .qa-pair-translation").textContent()).trim() === "What do you do in the morning?", "Q&A card lost the question translation.");
      assert((await firstCard.locator(".qa-pair-part--answer .qa-pair-translation").textContent()).trim() === "In the morning I drink coffee and eat some bread.", "Q&A card lost the answer translation.");

      await bank.locator("xpath=preceding-sibling::*[1]").locator("button").click();
      const saved = await page.evaluate(() => window.MaltiReviewStore.getAllCards().find((card) => card.prompt === "X'tagħmel filgħodu?"));
      assert(saved?.contentType === "questionAnswer", "Review card did not preserve its Q&A content type.");
      assert(saved?.prompt === "X'tagħmel filgħodu?", "Review card saved the wrong Q&A prompt.");
      assert(saved?.answer === "Filgħodu nixrob kafè u niekol ftit ħobż.", "Review card saved the wrong Q&A answer.");

      await openCleanPage(page, "pronouns_possessives.html");
      const quickAnswers = page.locator('[data-example-group="pronouns-quick-answers"] > .qa-pair-card');
      const miniDrill = page.locator('[data-example-group="pronouns-safe-mini-drill"] > article');
      assert(await quickAnswers.count() === 5, "Pronoun quick answers did not render all typed Q&A pairs.");
      assert(await miniDrill.count() === 4, "Pronoun mini drill did not render all typed examples.");
      assert(
        (await quickAnswers.nth(2).locator(".qa-pair-part--question .qa-pair-translation").textContent()).trim() === "Whose house is it?",
        "Pronoun quick answer lost its question translation."
      );

      await openCleanPage(page, "comparisons.html");
      const comparisonQuestions = page.locator('[data-example-group="comparisons-questions"]');
      const comparisonCards = comparisonQuestions.locator(":scope > .qa-pair-card");
      assert(await comparisonCards.count() === 3, "Comparison questions did not render all typed Q&A pairs.");
      const firstComparison = comparisonCards.first();
      assert(
        (await firstComparison.locator(".qa-pair-part--question .qa-pair-text").textContent()).trim() === "Liema dar akbar?",
        "Comparison Q&A rendered the wrong question."
      );
      await firstComparison.locator(":scope > .review-add-button--icon").click();
      assert(
        (await comparisonQuestions.locator("xpath=preceding-sibling::*[1]").locator("[data-section-status]").textContent()).includes("1 saved, 2 left"),
        "Comparison Q&A status did not reflect an individual save."
      );
      const savedComparison = await page.evaluate(() => window.MaltiReviewStore.getAllCards()[0]);
      assert(savedComparison?.prompt === "Liema dar akbar?", "Comparison Q&A saved the wrong prompt.");
      assert(savedComparison?.answer === "Din id-dar akbar.", "Comparison Q&A saved the wrong answer.");

      await openCleanPage(page, "colors_maltese.html");
      const colourQuestions = page.locator('[data-example-group="colour-questions"]');
      const colourCards = colourQuestions.locator(":scope > .qa-pair-card");
      assert(await page.locator('[data-example-group="colour-patterns"] > article').count() === 6, "Colour patterns did not render all typed examples.");
      assert(await page.locator('[data-example-group="colour-objects"] > article').count() === 8, "Colour objects did not render all typed examples.");
      assert(await colourCards.count() === 4, "Colour questions did not render all typed Q&A pairs.");
      const colourPageItems = await page.locator("[data-page-sentence-review-add]").evaluate((button) => (
        JSON.parse(button.dataset.items || "[]").map((item) => item.id)
      ));
      assert(new Set(colourPageItems).size === colourPageItems.length, "Colour page bulk review contains duplicate cards.");
      const firstColourQuestion = colourCards.first();
      await firstColourQuestion.locator(":scope > .review-add-button--icon").click();
      assert(
        (await colourQuestions.locator("xpath=preceding-sibling::*[1]").locator("[data-section-status]").textContent()).includes("1 saved, 3 left"),
        "Colour Q&A status did not reflect an individual save."
      );
      const savedColourQuestion = await page.evaluate(() => window.MaltiReviewStore.getAllCards()[0]);
      assert(savedColourQuestion?.prompt === "X'kulur hu l-qmis?", "Colour Q&A saved the wrong prompt.");
      assert(savedColourQuestion?.answer === "Il-qmis abjad.", "Colour Q&A saved the wrong answer.");

      await openCleanPage(page, "prepositions_place.html");
      const visualDrill = page.locator('[data-example-group="prepositions-visual-drill"]');
      const disclosureCards = visualDrill.locator(":scope > .qa-disclosure-card");
      assert(await disclosureCards.count() === 4, "Preposition visual drill did not render all disclosure questions.");
      const disclosureIds = await disclosureCards.locator(".review-add-button--icon").evaluateAll((buttons) => (
        buttons.map((button) => button.dataset.reviewId)
      ));
      assert(new Set(disclosureIds).size === disclosureIds.length, "Preposition visual drill generated duplicate Review IDs.");
      const firstDisclosure = disclosureCards.first();
      const firstDetails = firstDisclosure.locator(":scope > details");
      assert(!await firstDetails.getAttribute("open"), "Preposition visual drill reveals its answer initially.");
      await firstDisclosure.locator(".review-add-button--icon").click();
      assert(!await firstDetails.getAttribute("open"), "Saving a preposition drill reveals its answer.");
      assert(
        (await visualDrill.locator("xpath=preceding-sibling::*[1]").locator("[data-section-status]").textContent()).includes("1 saved, 3 left"),
        "Preposition visual drill bulk status did not reflect one saved answer."
      );
      const savedDisclosure = await page.evaluate(() => window.MaltiReviewStore.getAllCards()[0]);
      assert(savedDisclosure?.prompt === "Il-qattus qiegħed ___ il-ballun.", "Preposition drill saved the wrong prompt.");
      assert(savedDisclosure?.answer === "Il-qattus qiegħed taħt il-ballun.", "Preposition drill saved the wrong answer.");
      await firstDetails.locator("summary").click();
      assert(await firstDetails.locator(":scope > .qa-pair-part--answer").isVisible(), "Preposition visual drill does not reveal its answer.");
    });

    await runTest(context, "reviewable bank items toggle individually without covering text", async (page) => {
      for (const pageName of bankPages) {
        await openCleanPage(page, pageName);
        const result = await page.locator("[data-example-group], [data-question-group]").evaluateAll((containers) => {
          const renderedCards = containers.flatMap((container) => Array.from(container.children));
          return {
            cards: renderedCards.length,
            toggles: renderedCards.filter((card) => (
              card.classList.contains("sentence-card--review-toggle")
              && card.querySelector(".review-add-button--icon")
            )).length
          };
        });
        assert(result.cards > 0, `${pageName} rendered no reviewable bank items.`);
        assert(result.toggles === result.cards, `${pageName} did not add an individual bookmark to every bank item.`);
      }

      await openCleanPage(page, "emotions.html");
      const bank = page.locator('[data-example-group="emotions-practice-bank"]');
      const cards = bank.locator(":scope > .sentence-card--review-toggle");
      await cards.first().waitFor();
      assert(await cards.count() === 30, "The emotions practice bank did not render a bookmark for every sentence.");

      for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
        await page.setViewportSize(viewport);
        const geometry = await cards.last().evaluate((card) => {
          const content = card.querySelector("strong").getBoundingClientRect();
          const button = card.querySelector(".review-add-button--icon").getBoundingClientRect();
          return { contentRight: content.right, buttonLeft: button.left };
        });
        assert(geometry.contentRight < geometry.buttonLeft, `Sentence text reaches the bookmark at ${viewport.width}px.`);
      }

      const firstButton = cards.first().locator(".review-add-button--icon");
      const reviewId = await firstButton.getAttribute("data-review-id");
      const bulkRow = bank.locator("xpath=preceding-sibling::*[1]");
      assert(await firstButton.getAttribute("aria-label") === "Add to review", "Sentence bookmark has the wrong initial label.");
      await firstButton.click();
      assert(await page.evaluate((id) => window.MaltiReviewStore.hasCard(id), reviewId), "Sentence bookmark did not save its sentence.");
      assert(await firstButton.getAttribute("aria-label") === "Remove from review", "Saved sentence bookmark does not expose removal.");
      assert((await bulkRow.locator("[data-section-status]").textContent()).includes("1 saved, 29 left"), "Bulk status did not reflect the individual save.");
      await firstButton.click();
      assert(!await page.evaluate((id) => window.MaltiReviewStore.hasCard(id), reviewId), "Second sentence bookmark click did not remove its sentence.");
      assert(await firstButton.getAttribute("aria-label") === "Add to review", "Removed sentence bookmark did not return to its empty state.");

      await openCleanPage(page, "daily_routine.html");
      const qaCard = page.locator('[data-example-group="daily-routine-qa"] > .qa-pair-card').first();
      const qaButton = qaCard.locator(":scope > .review-add-button--icon");
      assert(await qaButton.count() === 1, "Question-and-answer card has no individual bookmark.");
      const qaGeometry = await qaCard.evaluate((card) => {
        const question = card.querySelector(".qa-pair-part--question").getBoundingClientRect();
        const button = card.querySelector(".review-add-button--icon").getBoundingClientRect();
        return { questionRight: question.right, buttonLeft: button.left };
      });
      assert(qaGeometry.questionRight < qaGeometry.buttonLeft, "Question-and-answer text reaches its bookmark area.");
      await qaButton.click();
      assert(await page.evaluate(() => window.MaltiReviewStore.getAllCards().some((card) => card.contentType === "questionAnswer")), "Question-and-answer bookmark did not save the pair.");

      await openCleanPage(page, "picture_description.html");
      const questionCard = page.locator('[data-question-group="family-home"] > .sentence-card--review-toggle').first();
      const questionButton = questionCard.locator(":scope > .review-add-button--icon");
      assert(await questionButton.count() === 1, "Standalone question has no individual bookmark.");
      await questionButton.click();
      assert(await page.evaluate(() => window.MaltiReviewStore.getStats().total === 1), "Standalone question bookmark did not save its question.");
    });

    await runTest(context, "shared vocabulary bookmarks toggle the review collection", async (page) => {
      for (const pageName of vocabularyCardPages) {
        await openCleanPage(page, pageName);
        const buttons = page.locator(".review-add-button");
        await buttons.first().waitFor();
        const counts = await page.evaluate(() => ({
          all: document.querySelectorAll(".vocab-card--review-toggle > .review-add-button").length,
          icons: document.querySelectorAll(".vocab-card--review-toggle > .review-add-button--icon").length,
          positionedCards: document.querySelectorAll(".vocab-card--review-toggle").length
        }));
        assert(counts.all > 0, `${pageName} rendered no vocabulary review controls.`);
        assert(counts.icons === counts.all, `${pageName} kept a full-width vocabulary review button.`);
        assert(counts.positionedCards === counts.all, `${pageName} did not position every vocabulary bookmark.`);
      }

      await openCleanPage(page, "animals.html");
      const lionButton = page.locator('[data-content-id="iljun"] .review-add-button--icon');
      const reviewId = await lionButton.getAttribute("data-review-id");

      assert(await lionButton.getAttribute("aria-label") === "Add to review", "Empty bookmark has the wrong accessible label.");
      await lionButton.click();
      assert(await page.evaluate((id) => window.MaltiReviewStore.hasWord(id), reviewId), "Bookmark did not add the animal word.");
      assert(await lionButton.getAttribute("aria-label") === "Remove from review", "Saved bookmark does not expose its remove action.");
      assert(await lionButton.isEnabled(), "Saved bookmark cannot be toggled.");

      await lionButton.click();
      assert(!await page.evaluate((id) => window.MaltiReviewStore.hasWord(id), reviewId), "Second bookmark click did not remove the animal word.");
      assert(await lionButton.getAttribute("aria-label") === "Add to review", "Removed bookmark did not return to its empty state.");
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
      const bookmark = page.locator(".year4-card .review-add-button--icon");
      assert(await bookmark.isEnabled(), "Saved Year 4 bookmark cannot be toggled.");
      assert(await bookmark.getAttribute("aria-label") === "Remove from review", "Saved Year 4 bookmark does not expose removal.");
      await bookmark.click();
      assert(await page.evaluate(() => window.MaltiReviewStore.getStats().total) === 0, "Year 4 bookmark did not remove the saved word.");
      await bookmark.click();
      await page.reload({ waitUntil: "networkidle" });
      await page.locator("#year4-search").fill("fekruna");
      await page.waitForFunction(() => document.querySelectorAll(".year4-card").length === 1);
      assert(await page.locator(".year4-card .review-add-button--icon").getAttribute("aria-label") === "Remove from review", "Year 4 review state did not survive reload.");
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

    await runTest(context, "Google sign-in sync uploads local progress by user id", async (page) => {
      const syncContext = await page.context().browser().newContext({
        viewport: { width: 1280, height: 900 },
        serviceWorkers: "block"
      });
      page = await syncContext.newPage();
      await page.route("**/assets/data/firebase-config.json", (route) => route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          enabled: true,
          firebaseConfig: {
            apiKey: "test-api-key",
            authDomain: "test-project.firebaseapp.com",
            projectId: "test-project",
            appId: "test-app-id"
          }
        })
      }));
      await page.route("https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js", (route) => route.fulfill({
        contentType: "application/javascript",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: "export const initializeApp = (config) => ({ config });"
      }));
      await page.route("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js", (route) => route.fulfill({
        contentType: "application/javascript",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: `
          let observer = null;
          export class GoogleAuthProvider { setCustomParameters() {} }
          export const browserLocalPersistence = {};
          export const getAuth = () => ({});
          export const setPersistence = async () => {};
          export const getRedirectResult = async () => null;
          export const onAuthStateChanged = (_auth, callback) => {
            observer = callback;
            queueMicrotask(() => callback(null));
            return () => {};
          };
          export const signInWithPopup = async () => {
            const user = { uid: "test-user", displayName: "Test Learner", email: "learner@example.com" };
            observer(user);
            return { user };
          };
          export const signInWithRedirect = async () => {};
          export const signOut = async () => observer(null);
        `
      }));
      await page.route("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js", (route) => route.fulfill({
        contentType: "application/javascript",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: `
          window.__firebaseWrites = [];
          export const getFirestore = () => ({});
          export const collection = (_db, ...parts) => ({ path: parts.join("/") });
          export const doc = (_db, ...parts) => ({ path: parts.join("/") });
          export const getDocs = async () => ({ docs: [] });
          export const serverTimestamp = () => "server-timestamp";
          export const setDoc = async (reference, data) => window.__firebaseWrites.push({ path: reference.path, data });
        `
      }));

      await openCleanPage(page, "course_path.html");
      await page.evaluate(() => {
        window.MaltiStorage.setJson("malti_course_progress_v1", {
          objectives: { "b1-introductions::identity": true },
          updatedAt: "2026-09-30T12:00:00.000Z"
        });
      });
      await page.locator(".account-trigger").click();
      await page.locator(".account-primary-action").click();
      await page.locator(".account-menu[data-sync-state='synced']").waitFor();
      await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });

      const result = await page.evaluate(() => ({
        email: document.querySelector(".account-email")?.textContent,
        writes: window.__firebaseWrites,
        state: window.MaltiFirebaseSync?.getState()
      }));
      const accessibility = await page.evaluate(async () => {
        const results = await window.axe.run(document.querySelector(".site-header"));
        return results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
      });
      const progressWrite = result.writes.find((entry) => entry.path.endsWith("/malti_course_progress_v1"));
      assert(result.email === "learner@example.com", "Signed-in Google account was not rendered.");
      assert(result.state?.signedIn === true && result.state.busy === false, "Firebase sync did not settle in the signed-in state.");
      assert(progressWrite?.path === "users/test-user/progress/malti_course_progress_v1", "Progress was not namespaced by Firebase uid.");
      assert(progressWrite.data.value.includes("b1-introductions::identity"), "Local course progress was not uploaded.");
      assert(progressWrite.data.deleted === false && progressWrite.data.checksum.startsWith("fnv1a-"), "Uploaded progress metadata is incomplete.");
      assert(accessibility.length === 0, `Cloud account UI has serious accessibility violations: ${accessibility.map((item) => item.id).join(", ")}`);
      await syncContext.close();
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

    await runTest(context, "large test bank is cached on first use", async (page) => {
      await openCleanPage(page, "index.html");
      const bankUrl = `${baseUrl}/assets/data/comprehensive_test_bank.json`;
      await page.evaluate(async (url) => {
        await navigator.serviceWorker.ready;
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames
          .filter((name) => name.startsWith("malti-notes-"))
          .map(async (name) => (await caches.open(name)).delete(url)));
      }, bankUrl);

      await page.reload({ waitUntil: "networkidle" });
      const cachedBeforeUse = await page.evaluate(async (url) => Boolean(await caches.match(url)), bankUrl);
      assert(!cachedBeforeUse, "Large test bank was restored by the application shell precache.");

      await page.goto(`${baseUrl}/coverage_test.html`, { waitUntil: "networkidle" });
      await page.locator("[data-coverage-test-stage] .exercise-item").first().waitFor();
      const cachedAfterUse = await page.evaluate(async (url) => Boolean(await caches.match(url)), bankUrl);
      assert(cachedAfterUse, "Large test bank was not cached after the coverage page requested it.");

      await page.context().setOffline(true);
      try {
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.locator("[data-coverage-test-stage] .exercise-item").first().waitFor();
        assert(Number((await page.locator("[data-coverage-total]").textContent()).trim()) >= 1200, "Cached coverage bank was incomplete offline.");
      } finally {
        await page.context().setOffline(false);
      }
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

    const missingRegistrations = allFunctionalTestNames.filter((testName) => !observedTestNames.has(testName));
    assert(missingRegistrations.length === 0, `Functional suite registry contains missing tests: ${missingRegistrations.join(", ")}`);
    const expectedTestCount = selectedTestNames ? selectedTestNames.size : allFunctionalTestNames.length;
    assert(executedTestCount === expectedTestCount, `Expected ${expectedTestCount} functional tests, ran ${executedTestCount}.`);
    console.log(`ok functional ${requestedSuite || "all"}: ${executedTestCount} test(s)`);
    await context.close();
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

if (listSuites) {
  suiteNames.forEach((suiteName) => console.log(`${suiteName}: ${functionalSuites[suiteName].length}`));
  console.log(`total: ${allFunctionalTestNames.length}`);
} else {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
