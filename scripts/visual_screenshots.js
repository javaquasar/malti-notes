const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const defaultChromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const chromePath = process.env.CHROME_PATH || (fs.existsSync(defaultChromePath) ? defaultChromePath : "");
const host = "127.0.0.1";
const port = Number(process.env.VISUAL_PORT || 4173);
const themes = (process.env.VISUAL_THEMES || "classic,forest,contrast")
  .split(",")
  .map((theme) => theme.trim())
  .filter(Boolean);
const pages = (process.env.VISUAL_PAGES || [
  "index.html",
  "verbs_guide.html",
  "pronouns_possessives.html",
  "picture_description.html",
  "collective_nouns.html",
  "word_search.html",
  "memory_game.html",
  "word_builder_game.html",
  "shopping_clothes.html",
  "daily_problems.html"
].join(","))
  .split(",")
  .map((page) => page.trim())
  .filter(Boolean);
const viewports = [
  { name: "desktop", width: 1280, height: 960 },
  { name: "mobile", width: 390, height: 900 }
];

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webp": "image/webp",
  ".wasm": "application/wasm"
};

function safeName(value) {
  return value.replace(/[^a-z0-9._-]+/gi, "_").replace(/^_+|_+$/g, "");
}

function screenshotSeed(pageName, theme, viewportName) {
  return `${pageName}:${theme}:${viewportName}`;
}

function makeServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, `http://${host}:${port}`);
    const decodedPath = decodeURIComponent(url.pathname);
    const relativePath = decodedPath === "/" ? "index.html" : decodedPath.slice(1);
    const filePath = path.resolve(root, relativePath);

    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      res.writeHead(200, {
        "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      res.end(data);
    });
  });
}

async function main() {
  const outputRoot = path.join(root, "visual-regression", "screenshots", new Date().toISOString().replace(/[:.]/g, "-"));
  fs.mkdirSync(outputRoot, { recursive: true });

  const server = makeServer();
  await new Promise((resolve) => server.listen(port, host, resolve));
  const browser = await chromium.launch(chromePath ? { executablePath: chromePath } : {});

  try {
    for (const viewport of viewports) {
      for (const theme of themes) {
        for (const pageName of pages) {
          const context = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height },
            deviceScaleFactor: 1
          });
          const page = await context.newPage();
          await page.addInitScript(({ themeName, seed }) => {
            let state = 0;

            for (let index = 0; index < seed.length; index += 1) {
              state = ((state << 5) - state + seed.charCodeAt(index)) >>> 0;
            }

            Math.random = () => {
              state = (1664525 * state + 1013904223) >>> 0;
              return state / 4294967296;
            };

            window.localStorage.clear();
            window.localStorage.setItem("malti_site_theme", themeName);
          }, {
            themeName: theme,
            seed: screenshotSeed(pageName, theme, viewport.name)
          });
          await page.goto(`http://${host}:${port}/${pageName}`, { waitUntil: "networkidle" });
          await page.evaluate((themeName) => {
            document.documentElement.dataset.theme = themeName;
            window.localStorage.setItem("malti_site_theme", themeName);
          }, theme);
          await page.waitForTimeout(150);

          const screenshotPath = path.join(
            outputRoot,
            `${safeName(pageName.replace(/\.html$/i, ""))}__${theme}__${viewport.name}.png`
          );
          await page.screenshot({ path: screenshotPath, fullPage: true });
          await page.close();
          await context.close();
          console.log(path.relative(root, screenshotPath));
        }
      }
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  console.log(`\nScreenshots saved to ${path.relative(root, outputRoot)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
