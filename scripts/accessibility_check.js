const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const host = "127.0.0.1";
const port = Number(process.env.A11Y_PORT || 4176);
const baseUrl = `http://${host}:${port}`;
const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const defaultChromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const useBundledBrowser = process.env.PLAYWRIGHT_USE_BUNDLED === "1";
const chromePath = useBundledBrowser ? "" : process.env.CHROME_PATH || (fs.existsSync(defaultChromePath) ? defaultChromePath : "");
const defaultPages = ["index.html", "today.html", "course_path.html", "grammar_path.html", "course_exam.html", "coverage_test.html", "mistakes.html", "review_cards.html", "year4_exam.html"];
const pages = (process.env.A11Y_PAGES || defaultPages.join(",")).split(",").map((page) => page.trim()).filter(Boolean);
const allViewports = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "mobile", width: 390, height: 844 }
];
const requestedViewports = (process.env.A11Y_VIEWPORTS || "desktop,mobile").split(",").map((name) => name.trim());
const viewports = allViewports.filter((viewport) => requestedViewports.includes(viewport.name));
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".wasm": "application/wasm"
};

function makeServer() {
  return http.createServer((request, response) => {
    const requestUrl = new URL(request.url, baseUrl);
    const relativePath = decodeURIComponent(requestUrl.pathname) === "/" ? "index.html" : decodeURIComponent(requestUrl.pathname).slice(1);
    const filePath = path.resolve(root, relativePath);
    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    fs.readFile(filePath, (error, data) => {
      response.writeHead(error ? 404 : 200, { "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
      response.end(error ? "Not found" : data);
    });
  });
}

async function main() {
  const server = makeServer();
  await new Promise((resolve) => server.listen(port, host, resolve));
  const browser = await chromium.launch(chromePath ? { executablePath: chromePath } : {});
  const failures = [];
  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        serviceWorkers: "block"
      });
      for (const pageName of pages) {
        const page = await context.newPage();
        await page.goto(`${baseUrl}/${pageName}`, { waitUntil: "networkidle" });
        await page.addScriptTag({ content: axeSource });
        const violations = await page.evaluate(async () => {
          const result = await window.axe.run(document, {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
            resultTypes: ["violations"]
          });
          return result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
        });
        violations.forEach((violation) => {
          const targets = violation.nodes.slice(0, 4).map((node) => node.target.join(" ")).join(", ");
          const detail = violation.nodes[0]?.failureSummary?.replace(/\s+/g, " ") || "";
          failures.push(`${pageName} ${viewport.name}: ${violation.id} (${violation.nodes.length} node(s)) ${violation.help}; ${targets}; ${detail}`);
        });

        await page.keyboard.press("Tab");
        const focus = await page.evaluate(() => {
          const element = document.activeElement;
          if (!element || element === document.body) return { focusable: false, visible: false };
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return { focusable: true, visible: style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0 };
        });
        if (!focus.focusable || !focus.visible) failures.push(`${pageName} ${viewport.name}: first Tab does not reach a visible control`);
        await page.close();
        console.log(`ok a11y ${pageName} ${viewport.name}`);
      }
      await context.close();
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  if (failures.length) {
    failures.forEach((failure) => console.error(`fail a11y ${failure}`));
    process.exit(1);
  }
  console.log(`ok accessibility gate checked ${pages.length * viewports.length} page/viewport combinations`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
