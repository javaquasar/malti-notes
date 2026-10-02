const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const keyPages = [
  "index.html",
  "verbs_guide.html",
  "pronouns_possessives.html",
  "picture_description.html",
  "collective_nouns.html",
  "course_path.html",
  "coverage_test.html",
  "environment_recycling.html",
  "hobbies_future.html",
  "introductions_alphabet.html",
  "word_search.html",
  "memory_game.html",
  "word_builder_game.html",
  "shopping_clothes.html",
  "school_classroom.html",
  "daily_problems.html"
];

function listCssFiles(relDir) {
  const absDir = path.join(root, relDir);

  if (!fs.existsSync(absDir)) {
    return [];
  }

  return fs.readdirSync(absDir)
    .filter((file) => file.endsWith(".css"))
    .sort()
    .map((file) => path.join(relDir, file).replace(/\\/g, "/"));
}

const cssFiles = [
  "assets/css/theme.css",
  "assets/css/themes/forest.css",
  "assets/css/themes/contrast.css",
  "assets/css/site.css",
  ...listCssFiles("assets/css/site"),
  "assets/css/pages.css",
  "assets/css/topic-picker.css",
  "assets/css/word-search.css",
  "assets/css/vocabulary-games.css"
];

const runtimeCssTokens = new Set([
  "--word-search-size",
  "--word-search-found-bg",
  "--word-search-found-border",
  "--word-search-found-ink",
  "--word-search-overlap-bg",
  "--word-search-overlap-border",
  "--memory-columns"
]);

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function count(text, pattern) {
  return (text.match(pattern) || []).length;
}

const failures = [];

function check(name, fn) {
  try {
    fn();
    console.log(`ok ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`fail ${name}: ${error.message}`);
  }
}

check("key pages exist", () => {
  keyPages.forEach((page) => assert(fs.existsSync(path.join(root, page)), `${page} is missing`));
});

check("css brace balance", () => {
  cssFiles.forEach((file) => {
    const text = read(file);
    assert(count(text, /\{/g) === count(text, /\}/g), `${file} has unbalanced braces`);
  });
});

check("css tokens resolve", () => {
  const declarations = new Set();
  const usages = new Set();

  cssFiles.forEach((file) => {
    const text = read(file);
    [...text.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)].forEach((match) => declarations.add(match[1]));
    [...text.matchAll(/var\((--[a-zA-Z0-9_-]+)/g)].forEach((match) => usages.add(match[1]));
  });

  [...usages].forEach((token) => {
    assert(declarations.has(token) || runtimeCssTokens.has(token), `${token} is used but not declared`);
  });
});

check("css links resolve", () => {
  fs.readdirSync(root)
    .filter((file) => file.endsWith(".html"))
    .forEach((page) => {
      const html = read(page);
      [...html.matchAll(/href="\.\/(assets\/css\/[^"]+)"/g)].forEach((match) => {
        assert(fs.existsSync(path.join(root, match[1])), `${page} links missing ${match[1]}`);
      });
    });
});

check("theme imports are present", () => {
  const theme = read("assets/css/theme.css");
  assert(theme.includes('@import url("./themes/forest.css");'), "forest import missing");
  assert(theme.includes('@import url("./themes/contrast.css");'), "contrast import missing");
});

check("theme switcher knows all themes", () => {
  const js = read("assets/js/site-header.js");
  ["classic", "forest", "contrast"].forEach((theme) => {
    assert(js.includes(`value: "${theme}"`), `${theme} missing from switcher`);
  });
});

check("site header exposes page search", () => {
  const js = read("assets/js/site-header.js");
  const siteMap = JSON.parse(read("assets/data/site-map.json"));
  const css = read("assets/css/site/navigation.css");
  assert(js.includes("data-site-search"), "site search input is missing");
  assert(js.includes("searchItems"), "site search index is missing");
  assert(js.includes("MaltiSiteMapReady"), "site header does not load the shared site map");
  assert(siteMap.groups.length === 5, "site map must expose five navigation groups");
  assert(css.includes(".site-search"), "site search styles are missing");
});

check("Firebase progress sync stays optional and local-first", () => {
  const config = JSON.parse(read("assets/data/firebase-config.json"));
  const header = read("assets/js/site-header.js");
  const storage = read("assets/js/storage.js");
  const rules = read("firestore.rules");
  assert(typeof config.enabled === "boolean", "Firebase configuration has no enabled flag");
  assert(header.includes("initializeCloudSync") && header.includes("firebase-config.json"), "site header does not load optional cloud sync");
  assert(storage.includes("malti-storage-change"), "storage does not publish changes for cloud sync");
  assert(rules.includes("request.auth.uid == userId"), "Firestore progress is not scoped to the signed-in user");
});

check("course pages suppress the floating review shortcut", () => {
  const js = read("assets/js/site-header.js");
  const siteMap = JSON.parse(read("assets/data/site-map.json"));
  const responsiveCss = read("assets/css/site/responsive.css");
  const course = siteMap.groups.find((group) => group.id === "course");
  assert(course?.pages.length > 0, "site map has no Course pages");
  assert(js.includes('currentGroup?.id === "course"'), "site header does not suppress the review shortcut by Course group");
  assert(js.includes('document.querySelector(".review-fab")?.remove()'), "site header does not remove an existing review shortcut");
  assert(
    /@media \(max-width: 980px\)[\s\S]*?\.review-fab\s*\{\s*display:\s*none;\s*\}/.test(responsiveCss),
    "mobile layouts do not suppress the floating Review shortcut"
  );
  assert(responsiveCss.includes("[data-section-review-row] .action-button"), "mobile section Review actions lack compact sizing");
  assert(responsiveCss.includes("min-height: 44px"), "mobile section Review actions lack a touch-safe height");
});

check("individual review bookmarks keep usable mobile targets", () => {
  const css = read("assets/css/site/review.css");
  assert(
    /@media \(max-width: 720px\)[\s\S]*?\.review-add-button--icon\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px;/.test(css),
    "mobile review bookmarks lack a 44px target"
  );
  assert(
    /\.sentence-card--review-toggle\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\) 44px;/.test(css),
    "mobile sentence cards do not reserve the larger bookmark column"
  );
});

check("shared actions keep usable mobile targets", () => {
  const css = read("assets/css/site/review.css");
  assert(
    /@media \(max-width: 720px\)[\s\S]*?\.action-link,[\s\S]*?\.action-button,[\s\S]*?\.review-add-button:not\(\.review-add-button--icon\)[\s\S]*?min-height:\s*44px;/.test(css),
    "shared mobile actions lack a 44px minimum height"
  );
});

check("page directories render from shared data", () => {
  const index = read("index.html");
  const directory = read("all_pages.html");
  const renderer = read("assets/js/site-map-pages.js");
  assert(!index.includes('class="page-card"'), "index.html still duplicates page cards");
  assert(!directory.includes('class="page-card"'), "all_pages.html still duplicates page cards");
  assert(directory.includes("data-site-map-directory"), "all_pages.html lacks a generated directory target");
  assert(renderer.includes("createCluster"), "site map renderer does not generate directory clusters");
});

check("pronouns page keeps English section headings readable", () => {
  const html = read("pronouns_possessives.html");
  const headings = [...html.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/g)]
    .map((match) => match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
  const tables = [...html.matchAll(/<table\b([^>]*)>/g)];

  assert(headings.includes("Quick Choice by Noun"), "pronouns page lost the quick-choice heading");
  assert(headings.includes("Additional Example Clarifiers"), "pronouns page lost the additional-example heading");
  ["Singular", "Plural", "Common Prepositions", "Additional Prepositions"].forEach((heading) => {
    assert(headings.includes(heading), `pronouns page lost the ${heading} table heading`);
  });
  assert(tables.length === 9, "pronouns page must keep all nine reference tables");
  assert(tables.every((match) => /class="[^"]*table-soft/.test(match[1])), "pronouns reference tables lost the shared light surface");
  assert(!html.includes('class="demo-box'), "pronouns page still wraps tables in demo-box frames");
  assert(!html.includes('class="open-group"'), "pronouns page still nests content cards inside open-group frames");
  ["ċhoice", "éxample", "ċlarifiers"].forEach((typo) => {
    assert(!headings.some((heading) => heading.includes(typo)), `pronouns page heading contains ${typo}`);
  });
});

check("animal vocabulary groups stay unframed", () => {
  const html = read("animals.html");
  const groupWrappers = [...html.matchAll(/<div\s+class="([^"]+)"\s+data-animal-vocabulary-groups>/g)];

  assert(groupWrappers.length === 2, "animals page must expose two vocabulary group wrappers");
  groupWrappers.forEach((match) => {
    const classes = match[1].split(/\s+/);
    assert(classes.includes("section-stack"), "animal vocabulary wrapper must keep shared vertical spacing");
    assert(!classes.includes("study-card"), "animal vocabulary wrapper must not add an outer frame");
  });
});

check("home review toolbar can wrap every generated action", () => {
  const css = read("assets/css/pages.css");
  const toolbarRule = css.match(/\.home-toggle-row\s*\{([^}]+)\}/)?.[1] || "";
  assert(toolbarRule.includes("flex-wrap: wrap"), "home review toolbar cannot wrap generated actions");
  assert(toolbarRule.includes("justify-content: flex-start"), "home review toolbar can push actions past the left edge");
  assert(css.includes(".home-toggle-row > [data-mobile-label]"), "home review toolbar lacks compact mobile labels");

  const html = read("home_furniture.html");
  assert(html.includes('data-mobile-label="Hide images"'), "home image toggle lacks a compact mobile label");
  assert(html.includes('pageBulkMobileLabel: "Add words"'), "home vocabulary action lacks a compact mobile label");
  assert(html.includes('pageBulkMobileLabel: "Add examples"'), "home sentence action lacks a compact mobile label");
});

check("mobile verb banks keep a readable action layout", () => {
  const css = read("assets/css/pages.css");
  assert(css.includes(".compact-list.compact-3"), "compact verb lists lack a shared mobile override");
  assert(css.includes("min-height: 44px"), "mobile verb targets lack a usable minimum height");
  assert(css.includes("white-space: normal"), "long mobile verb labels cannot wrap");
});

check("Year 4 tabs use a stable mobile grid", () => {
  const css = read("assets/css/pages.css");
  assert(css.includes(".year4-collection-tabs"), "Year 4 collection tabs lack shared layout styles");
  assert(css.includes("grid-template-columns: repeat(2, minmax(0, 1fr))"), "Year 4 tabs lack a two-column mobile grid");
  assert(css.includes("min-height: 44px"), "Year 4 mobile tabs lack a usable minimum height");
});

check("book verb levels use the shared segmented control", () => {
  const html = read("verbs_guide.html");
  const css = read("assets/css/site/verbs.css");
  assert(html.includes('course-verb-book-toggle segmented-toggle'), "book-level toggle lacks the shared segmented control");
  assert(html.match(/class="toggle-chip"/g)?.length >= 2, "book-level buttons lack shared toggle chips");
  assert(html.includes('role="group" aria-label="Choose book level"'), "book-level toggle lacks accessible group semantics");
  assert(css.includes(".course-verb-book-toggle .toggle-chip"), "book-level toggle lacks scoped sizing");
});

check("course quick checks keep usable mobile targets", () => {
  const css = read("assets/css/site/exercises.css");
  assert(css.includes(".course-practice > summary"), "course quick checks lack shared summary styling");
  assert(css.includes("min-height: 44px"), "course quick checks lack a usable mobile minimum height");
});

check("question and answer examples use paired cards", () => {
  const migratedBanks = [
    ["home_furniture.html", "assets/data/home_furniture_examples.json", "home-qa"],
    ["body_appearance.html", "assets/data/body_appearance_examples.json", "body-qa"],
    ["modals_needs.html", "assets/data/modals_needs_examples.json", "modals-qa"],
    ["daily_routine.html", "assets/data/daily_routine_examples.json", "daily-small-talk-qa"],
    ["pronouns_possessives.html", "assets/data/pronouns_possessives_examples.json", "pronouns-quick-answers"],
    ["comparisons.html", "assets/data/comparisons_examples.json", "comparisons-questions"],
    ["colors_maltese.html", "assets/data/colors_examples.json", "colour-questions"]
  ];

  migratedBanks.forEach(([page, dataFile, groupId]) => {
    const html = read(page);
    const data = JSON.parse(read(dataFile));
    const group = data.groups.find((item) => item.id === groupId);
    assert(html.includes(`data-example-group="${groupId}"`), `${page} does not expose ${groupId}`);
    assert(!/<h3>\s*(Questions|Answers)\s*<\/h3>/i.test(html), `${page} still separates questions from answers`);
    assert(group?.itemType === "questionAnswer", `${dataFile} ${groupId} is not a typed Q&A bank`);
    assert(group.items.every((item) => item.question?.maltese && item.answer?.maltese), `${dataFile} ${groupId} contains an incomplete pair`);
  });

  ["emotions.html"].forEach((page) => {
    assert(read(page).includes('class="qa-pair-grid"'), `${page} does not use the shared Q&A layout`);
  });

  const renderer = read("assets/js/render-example-banks.js");
  const css = read("assets/css/site/components.css");
  assert(renderer.includes("appendQuestionAnswerCard"), "example renderer lacks paired Q&A cards");
  assert(css.includes(".qa-pair-card"), "shared Q&A card styles are missing");
});

check("colour lesson examples use shared banks and light groups", () => {
  const html = read("colors_maltese.html");
  const data = JSON.parse(read("assets/data/colors_examples.json"));
  const expectedGroups = [
    ["colour-patterns", 6],
    ["colour-objects", 8],
    ["colour-questions", 4]
  ];

  expectedGroups.forEach(([groupId, itemCount]) => {
    const group = data.groups.find((item) => item.id === groupId);
    assert(html.includes(`data-example-group="${groupId}"`), `colors page does not expose ${groupId}`);
    assert(group?.items.length === itemCount, `${groupId} does not contain ${itemCount} items`);
  });
  assert(!html.includes('class="demo-box"'), "colors page still uses heavy demo-box groups");
  assert(!html.includes('class="study-card"'), "colors page still contains manual study cards");
});

check("daily routine keeps generated greetings unframed", () => {
  const html = read("daily_routine.html");
  const data = JSON.parse(read("assets/data/daily_routine_examples.json"));
  const greetingGroups = ["daily-greetings", "daily-replies"];

  greetingGroups.forEach((groupId) => {
    const group = data.groups.find((item) => item.id === groupId);
    assert(group?.items.length === 4, `${groupId} must keep four examples`);
    assert(html.includes(`data-example-group="${groupId}"`), `daily routine page does not expose ${groupId}`);
  });
  assert(!html.includes('class="open-group"'), "daily routine still nests generated cards inside framed groups");
  assert((html.match(/<section class="section-stack">/g) || []).length === 2, "daily routine greeting groups lost their neutral wrappers");
});

check("sentence builder keeps one bank and an unframed grammar table", () => {
  const html = read("sentence_builder.html");
  const data = JSON.parse(read("assets/data/sentence_builder_examples.json"));
  const bankTargets = html.match(/data-example-group="combination-bank"/g) || [];
  const bank = data.groups.find((group) => group.id === "combination-bank");

  assert(bankTargets.length === 1, "sentence builder must expose one combination bank target");
  assert(bank?.items.length === 10, "sentence builder combination bank lost examples");
  assert(/id="qed-pattern"[\s\S]*?<table class="table-soft">/.test(html), "sentence builder qed table lost its light surface");
  assert(!/id="qed-pattern"[\s\S]*?<div class="study-card">\s*<table/.test(html), "sentence builder qed table still has a second frame");
});

check("numbers and time keeps reference surfaces light", () => {
  const html = read("numbers_calendar_time.html");
  const data = JSON.parse(read("assets/data/numbers_calendar_time_examples.json"));
  const countingGroup = data.groups.find((group) => group.id === "counting-sentence-examples");
  const framedTablePanels = html.match(/class="study-card" data-vocab-view-panel="table"/g) || [];
  const timeExpressions = html.match(/id="time-expressions"([\s\S]*?)id="clock-time"/)?.[1] || "";

  assert(framedTablePanels.length === 0, "numbers page table views still add a second frame");
  assert(countingGroup?.items.length === 5, "numbers page lost its five counting examples");
  assert(html.includes('data-example-group="counting-sentence-examples"'), "numbers page does not expose the counting example bank");
  assert(/id="group-counts"[\s\S]*?<table class="table-soft">/.test(html), "counting reference table lost its light surface");
  assert(!timeExpressions.includes('class="open-group"'), "time expression banks still use outer framed groups");
  assert((html.match(/<div class="study-card">/g) || []).length === 2, "numbers page should keep only the two clock-pattern cards framed");
});

check("common mistakes keeps correction banks unframed", () => {
  const html = read("common_mistakes.html");
  const data = JSON.parse(read("assets/data/common_mistakes_examples.json"));
  const exampleCount = data.groups.reduce((total, group) => total + group.items.length, 0);

  assert((html.match(/class="grammar-contrast-grid"/g) || []).length === 6, "common mistakes lost a Wrong/Right comparison");
  assert((html.match(/class="grammar-contrast-card /g) || []).length === 12, "common mistakes lost a contrast card");
  assert((html.match(/class="open-group"/g) || []).length === 1, "common mistakes should frame only the final checklist");
  assert((html.match(/data-example-group=/g) || []).length === 6, "common mistakes lost a correction bank target");
  assert(exampleCount === 28, "common mistakes correction bank count changed unexpectedly");
  data.groups.forEach((group) => {
    const examples = group.items.map((item) => item.maltese);
    assert(new Set(examples).size === examples.length, `common mistakes ${group.id} contains duplicate examples`);
  });
});

check("health lesson keeps tables and dialogue banks singly framed", () => {
  const html = read("health_doctor.html");
  const data = JSON.parse(read("assets/data/health_doctor_examples.json"));
  const exampleCount = data.groups.reduce((total, group) => total + group.items.length, 0);
  const uniqueReviewItems = new Set(
    data.groups.flatMap((group) => group.items).map((item) => item.maltese.trim().toLocaleLowerCase())
  );

  assert(!html.includes('class="example-bank-section"'), "health lesson still uses framed bank sections");
  assert((html.match(/class="section-stack"/g) || []).length === 4, "health lesson lost a neutral bank wrapper");
  assert(/<table class="table-soft attached-pattern-table">/.test(html), "attached-pronoun table lost its shared light surface");
  assert((html.match(/<td data-label="(Base|Example|English)">/g) || []).length === 12, "attached-pronoun table lost its mobile row labels");
  assert((html.match(/data-example-group="health-dialogue-/g) || []).length === 2, "health lesson lost a dialogue bank");
  assert((html.match(/class="open-group"/g) || []).length === 2, "health lesson lost a role-play card");
  assert((html.match(/class="grammar-contrast-card /g) || []).length === 2, "health lesson lost its Wrong/Right contrast");
  assert(exampleCount === 70, "health lesson example count changed unexpectedly");
  assert(uniqueReviewItems.size === 58, "health lesson unique Review item count changed unexpectedly");
});

check("preposition visual drill uses typed disclosures", () => {
  const html = read("prepositions_place.html");
  const data = JSON.parse(read("assets/data/prepositions_place_examples.json"));
  const group = data.groups.find((item) => item.id === "prepositions-visual-drill");
  assert(html.includes('data-example-group="prepositions-visual-drill"'), "prepositions page lacks the generated visual drill target");
  assert(!html.includes('class="example-bank"'), "prepositions page still contains a manual example bank");
  assert(group?.itemType === "questionAnswer", "preposition visual drill is not typed as questionAnswer");
  assert(group?.presentation === "disclosure", "preposition visual drill does not use disclosure presentation");
  assert(group.items.every((item) => item.options?.length >= 2), "preposition visual drill has incomplete options");
});

check("offline application shell is complete", () => {
  const manifest = JSON.parse(read("manifest.webmanifest"));
  const serviceWorker = read("service-worker.js");
  const siteHeader = read("assets/js/site-header.js");
  const coreAssets = JSON.parse(serviceWorker.match(/const CORE_ASSETS = (\[[\s\S]*?\]);/)?.[1] || "[]");
  const lazyAssets = JSON.parse(serviceWorker.match(/const LAZY_ASSETS = (\[[\s\S]*?\]);/)?.[1] || "[]");
  const deferredBanks = [
    "./assets/data/course_milestone_assessments.json",
    "./assets/data/comprehensive_test_bank.json"
  ];
  assert(manifest.start_url === "./index.html", "manifest start URL must be index.html");
  assert(manifest.display === "standalone", "manifest display mode must be standalone");
  assert(serviceWorker.includes("CORE_ASSETS"), "service worker does not define its application shell");
  assert(serviceWorker.includes("lazyAssetResponse"), "service worker lacks an on-demand asset strategy");
  assert(serviceWorker.includes("request.mode === \"navigate\""), "service worker lacks an offline navigation strategy");
  assert(siteHeader.includes("serviceWorker.register"), "site header does not register the service worker");
  deferredBanks.forEach((asset) => {
    assert(lazyAssets.includes(asset), `${asset} is missing from the lazy asset list`);
    assert(!coreAssets.includes(asset), `${asset} must not be downloaded during service worker installation`);
  });
  manifest.icons.forEach((icon) => {
    assert(fs.existsSync(path.join(root, icon.src.replace(/^\.\//, ""))), `manifest icon is missing: ${icon.src}`);
  });
});

check("storage helper loads before asset scripts", () => {
  fs.readdirSync(root)
    .filter((file) => file.endsWith(".html"))
    .forEach((page) => {
      const html = read(page);
      const scripts = [...html.matchAll(/<script src="\.\/assets\/js\/([^"]+)"><\/script>/g)]
        .map((match) => match[1]);

      if (!scripts.length) {
        return;
      }

      assert(scripts[0] === "storage.js", `${page} must load storage.js before other asset scripts`);
    });
});

check("review page can back up all progress", () => {
  const html = read("review_cards.html");
  const js = read("assets/js/progress-backup.js");
  assert(html.includes("assets/js/progress-backup.js"), "review page does not load progress backup helper");
  assert(html.includes("reset-all-progress"), "review page does not expose all-progress reset");
  assert(js.includes("malti-progress-backup-v1"), "progress backup format is missing");
  ["malti_review_cards_v2", "malti_word_search_seen_words_v1", "malti_memory_game_seen_words_v1", "malti_course_progress_v1", "malti_exercise_progress_v1", "malti_comprehensive_coverage_v1"]
    .forEach((key) => assert(js.includes(key), `progress backup omits ${key}`));
});

check("course pages use the shared learning runtime", () => {
  const coursePath = read("course_path.html");
  const serviceWorker = read("service-worker.js");
  const topicPages = [
    ["introductions_alphabet.html", "introductions_alphabet.json", "b1-introductions-check"],
    ["school_classroom.html", "school_classroom.json", "b1-school-check"],
    ["hobbies_future.html", "hobbies_future.json", "b2-hobbies-future-check"],
    ["environment_recycling.html", "environment_recycling.json", "b2-recycling-check"]
  ];

  assert(coursePath.includes("assets/js/course-path.js"), "course path renderer is missing");
  assert(coursePath.includes("assets/js/exercise-runner.js"), "course path exercise runtime is missing");
  topicPages.forEach(([page, dataFile, exerciseSet]) => {
    const html = read(page);
    assert(html.includes(`assets/data/${dataFile}`), `${page} does not load ${dataFile}`);
    assert(html.includes("assets/data/course_exercises.json"), `${page} does not load course exercises`);
    assert(html.includes("assets/js/exercise-runner.js"), `${page} does not load the exercise runtime`);
    assert(html.includes(exerciseSet), `${page} does not expose ${exerciseSet}`);
    assert(serviceWorker.includes(`./${page}`), `${page} is missing from the offline shell`);
  });
});

check("course avoids browser speech fallback", () => {
  const runner = read("assets/js/exercise-runner.js");
  const exercises = read("assets/data/course_exercises.json");
  assert(!runner.includes("speechSynthesis"), "course runtime must not use browser speech synthesis");
  assert(!runner.includes("SpeechSynthesisUtterance"), "course runtime contains a browser TTS fallback");
  assert(!exercises.includes('"listen"'), "course data still contains deferred audio fields");
});

check("word search stays modular", () => {
  const wordPage = read("word_search.html");
  const wordCss = read("assets/css/word-search.css");
  assert(wordPage.includes("assets/css/word-search.css"), "word_search.html does not load word-search.css");
  assert(wordCss.includes("margin-inline: calc(-1 * var(--space-3xl))"), "mobile word-search board does not use the full card width");
  keyPages
    .filter((page) => page !== "word_search.html")
    .forEach((page) => {
      assert(!read(page).includes("assets/css/word-search.css"), `${page} should not load word-search.css`);
    });
});

check("vocabulary games use shared word-search bank", () => {
  ["memory_game.html", "word_builder_game.html"].forEach((page) => {
    const html = read(page);
    assert(html.includes("assets/css/vocabulary-games.css"), `${page} missing vocabulary-games.css`);
    assert(html.includes("assets/css/topic-picker.css"), `${page} missing topic-picker.css`);
    assert(html.includes("assets/js/word-search-bank.js"), `${page} missing word-search-bank.js`);
    assert(html.includes("assets/js/topic-picker.js"), `${page} missing topic-picker.js`);
    assert(html.includes("assets/js/seen-words.js"), `${page} missing seen-words.js`);
    assert(html.includes("assets/js/game-audio.js"), `${page} missing game-audio.js`);
    assert(html.includes("assets/js/vocabulary-games.js"), `${page} missing vocabulary-games.js`);
  });
});

check("vocabulary games share mobile topic targets", () => {
  const css = read("assets/css/site/games.css");
  assert(css.includes(".topic-picker-check"), "shared topic-picker target styles are missing");
  assert(css.includes(".word-search-topic-check"), "word-search topic picker is not included in shared styles");
  assert(css.includes("max-height: 260px"), "mobile topic picker cannot preserve its visible row count");
  assert(css.includes("min-height: 44px"), "mobile topic targets lack a usable minimum height");
});

check("word search uses shared game audio", () => {
  const html = read("word_search.html");
  const js = read("assets/js/word-search-game.js");
  assert(html.includes("assets/css/topic-picker.css"), "word_search.html missing topic-picker.css");
  assert(html.includes("assets/js/topic-picker.js"), "word_search.html missing topic-picker.js");
  assert(html.includes("assets/js/seen-words.js"), "word_search.html missing seen-words.js");
  assert(html.includes("assets/js/game-audio.js"), "word_search.html missing game-audio.js");
  assert(js.includes("MaltiGameAudio"), "word-search-game.js does not use shared audio helper");
});

check("visual pages keep shared css stack", () => {
  keyPages.forEach((page) => {
    const html = read(page);
    ["assets/css/theme.css", "assets/css/site.css", "assets/css/pages.css"].forEach((css) => {
      assert(html.includes(css), `${page} missing ${css}`);
    });
  });
});

console.log("\nManual visual sweep:");
keyPages.forEach((page) => {
  console.log(`- ${page}: check Classic, Forest, Contrast at desktop and mobile widths`);
});

if (failures.length) {
  console.error(`\n${failures.length} smoke check(s) failed.`);
  process.exit(1);
}

console.log("\nAll smoke checks passed.");
