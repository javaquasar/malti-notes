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
      assert((await firstResult.getAttribute("href")) === "./verbs_guide.html", "Verb guide was not the first result.");
      await Promise.all([
        page.waitForURL(/\/verbs_guide\.html$/),
        search.press("Enter")
      ]);
    });

    await runTest(context, "site directory is generated from the shared map", async (page) => {
      await openCleanPage(page, "all_pages.html");
      assert(await page.locator("[data-site-map-directory] > .section").count() === 5, "Site directory does not contain five groups.");
      assert(await page.locator("[data-site-map-directory] .page-card").count() === 39, "Site directory page count is out of sync.");
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

    await runTest(context, "guided chapter route reports book, mapping, and assessment scope", async (page) => {
      await openCleanPage(page, "course_chapter.html?chapter=b1-animals");
      assert((await page.locator("[data-course-chapter-title]").textContent()).trim() === "L-Annimali", "Animals chapter title is missing.");
      assert((await page.locator("[data-course-book-coverage]").textContent()).trim() === "21 / 27", "Frozen animals coverage is incorrect.");
      assert((await page.locator("[data-course-guided-coverage]").textContent()).trim() === "20 / 27", "Guided animals coverage is incorrect.");
      assert(await page.locator(".course-step").count() === 2, "Animals chapter steps are incomplete.");
      assert(await page.locator("#chapter-test .exercise-item").count() === 7, "Animals chapter test is incomplete.");
      const targetCheck = page.locator('[data-course-target-exercise][data-exercise-set="b1-animals-target-check"]');
      assert(await targetCheck.locator(".exercise-item").count() === 40, "Animals target check does not cover all implemented targets in both modes.");
      const firstStepHref = await page.locator(".course-step a").first().getAttribute("href");
      assert(firstStepHref.includes("animals.html?course=b1") && firstStepHref.includes("view=chapter"), "Animals step does not open chapter view.");

      await page.locator("#chapter-test button[type=submit]").click();
      const saved = await page.evaluate(() => ({
        targets: JSON.parse(localStorage.getItem("malti_course_target_progress_v1")),
        review: JSON.parse(localStorage.getItem("malti_review_cards_v2"))
      }));
      assert(Object.values(saved.targets).filter((target) => target.state === "review").length === 3, "Missed target states were not saved.");
      assert(Object.keys(saved.review).length === 7, "Missed chapter answers were not added to shared review.");
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
      assert((await page.locator("[data-course-guided-coverage]").textContent()).trim() === "9 / 24", "B2 hobbies mapping is incorrect.");
      assert(await page.locator(".course-step").count() === 4, "B2 hobbies study steps are incomplete.");
      assert(await page.locator('[data-course-target-exercise][data-exercise-set="b2-hobbies-target-check"] .exercise-item').count() === 18, "B2 hobbies target check is incomplete.");
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
      assert((await page.locator("[data-course-mastery]").textContent()).trim() === "1 / 9", "Chapter mastery metric did not update.");
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
        const backup = window.MaltiProgressBackup.exportBackup();
        window.MaltiProgressBackup.clearAll();
        const clearedTotal = window.MaltiReviewStore.getStats().total;
        const clearedSeen = window.localStorage.getItem("malti_word_search_seen_words_v1");
        const clearedCourse = window.localStorage.getItem("malti_course_progress_v1");
        const clearedExercises = window.localStorage.getItem("malti_exercise_progress_v1");
        const clearedTargets = window.localStorage.getItem("malti_course_target_progress_v1");
        const imported = window.MaltiProgressBackup.importBackup(backup, { mode: "replace" });
        return {
          format: backup.format,
          exportedKeys: Object.keys(backup.data).length,
          importedKeys: imported.importedKeys,
          clearedTotal,
          clearedSeen,
          clearedCourse,
          clearedExercises,
          clearedTargets,
          restoredTotal: window.MaltiReviewStore.getStats().total,
          restoredSeen: JSON.parse(window.localStorage.getItem("malti_word_search_seen_words_v1")),
          restoredCourse: JSON.parse(window.localStorage.getItem("malti_course_progress_v1")),
          restoredExercises: JSON.parse(window.localStorage.getItem("malti_exercise_progress_v1")),
          restoredTargets: JSON.parse(window.localStorage.getItem("malti_course_target_progress_v1"))
        };
      });

      assert(result.format === "malti-progress-backup-v1", "Unexpected backup format.");
      assert(result.exportedKeys >= 5 && result.importedKeys === result.exportedKeys, "Backup did not contain all progress values.");
      assert(result.clearedTotal === 0 && result.clearedSeen === null && result.clearedCourse === null && result.clearedExercises === null && result.clearedTargets === null, "Progress was not cleared before import.");
      assert(result.restoredTotal === 1 && result.restoredSeen[0] === "kelb", "Review and game progress was not restored.");
      assert(result.restoredCourse.objectives["b1-introductions::identity"] === true, "Course progress was not restored.");
      assert(result.restoredExercises["b1-introductions-check"].passed === true, "Exercise progress was not restored.");
      assert(result.restoredTargets["b1-animals-kelb"].state === "learning", "Course target progress was not restored.");
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
