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

check("page directories render from shared data", () => {
  const index = read("index.html");
  const directory = read("all_pages.html");
  const renderer = read("assets/js/site-map-pages.js");
  assert(!index.includes('class="page-card"'), "index.html still duplicates page cards");
  assert(!directory.includes('class="page-card"'), "all_pages.html still duplicates page cards");
  assert(directory.includes("data-site-map-directory"), "all_pages.html lacks a generated directory target");
  assert(renderer.includes("createCluster"), "site map renderer does not generate directory clusters");
});

check("offline application shell is complete", () => {
  const manifest = JSON.parse(read("manifest.webmanifest"));
  const serviceWorker = read("service-worker.js");
  const siteHeader = read("assets/js/site-header.js");
  assert(manifest.start_url === "./index.html", "manifest start URL must be index.html");
  assert(manifest.display === "standalone", "manifest display mode must be standalone");
  assert(serviceWorker.includes("CORE_ASSETS"), "service worker does not define its application shell");
  assert(serviceWorker.includes("request.mode === \"navigate\""), "service worker lacks an offline navigation strategy");
  assert(siteHeader.includes("serviceWorker.register"), "site header does not register the service worker");
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
  ["malti_review_cards_v2", "malti_word_search_seen_words_v1", "malti_memory_game_seen_words_v1", "malti_course_progress_v1", "malti_exercise_progress_v1"]
    .forEach((key) => assert(js.includes(key), `progress backup omits ${key}`));
});

check("word search stays modular", () => {
  const wordPage = read("word_search.html");
  assert(wordPage.includes("assets/css/word-search.css"), "word_search.html does not load word-search.css");
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
