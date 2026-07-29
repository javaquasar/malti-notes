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
      assert(await page.locator("[data-site-map-directory] > .section").count() === 4, "Site directory does not contain four groups.");
      assert(await page.locator("[data-site-map-directory] .page-card").count() === 33, "Site directory page count is out of sync.");
      assert(await page.locator("[data-site-map-jumps] .action-link").count() === 4, "Site directory quick jumps are incomplete.");
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
        const backup = window.MaltiProgressBackup.exportBackup();
        window.MaltiProgressBackup.clearAll();
        const clearedTotal = window.MaltiReviewStore.getStats().total;
        const clearedSeen = window.localStorage.getItem("malti_word_search_seen_words_v1");
        const imported = window.MaltiProgressBackup.importBackup(backup, { mode: "replace" });
        return {
          format: backup.format,
          exportedKeys: Object.keys(backup.data).length,
          importedKeys: imported.importedKeys,
          clearedTotal,
          clearedSeen,
          restoredTotal: window.MaltiReviewStore.getStats().total,
          restoredSeen: JSON.parse(window.localStorage.getItem("malti_word_search_seen_words_v1"))
        };
      });

      assert(result.format === "malti-progress-backup-v1", "Unexpected backup format.");
      assert(result.exportedKeys >= 2 && result.importedKeys === result.exportedKeys, "Backup did not contain all progress values.");
      assert(result.clearedTotal === 0 && result.clearedSeen === null, "Progress was not cleared before import.");
      assert(result.restoredTotal === 1 && result.restoredSeen[0] === "kelb", "Progress was not restored.");
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
