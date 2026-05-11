const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const keyPages = [
  "index.html",
  "verbs_guide.html",
  "pronouns_possessives.html",
  "picture_description.html",
  "collective_nouns.html",
  "word_search.html",
  "shopping_clothes.html"
];

const cssFiles = [
  "assets/css/theme.css",
  "assets/css/themes/forest.css",
  "assets/css/themes/contrast.css",
  "assets/css/site.css",
  "assets/css/pages.css",
  "assets/css/word-search.css"
];

const runtimeCssTokens = new Set([
  "--word-search-size",
  "--word-search-found-bg",
  "--word-search-found-border",
  "--word-search-found-ink",
  "--word-search-overlap-bg",
  "--word-search-overlap-border"
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

check("word search stays modular", () => {
  const wordPage = read("word_search.html");
  assert(wordPage.includes("assets/css/word-search.css"), "word_search.html does not load word-search.css");
  keyPages
    .filter((page) => page !== "word_search.html")
    .forEach((page) => {
      assert(!read(page).includes("assets/css/word-search.css"), `${page} should not load word-search.css`);
    });
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
