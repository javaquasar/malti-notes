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
const defaultPages = fs.readdirSync(root)
  .filter((file) => file.toLowerCase().endsWith(".html") && fs.statSync(path.join(root, file)).isFile())
  .sort();
const pages = (process.env.A11Y_PAGES || defaultPages.join(",")).split(",").map((page) => page.trim()).filter(Boolean);
const requestedConcurrency = Number(process.env.A11Y_CONCURRENCY || 4);
const concurrency = Number.isFinite(requestedConcurrency) && requestedConcurrency > 0
  ? Math.floor(requestedConcurrency)
  : 4;
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

async function auditPage(context, pageName, viewportName) {
  const page = await context.newPage();
  const failures = [];

  try {
    await page.goto(`${baseUrl}/${pageName}`, { waitUntil: "networkidle" });
    await page.addScriptTag({ content: axeSource });
    const audit = await page.evaluate(async () => {
      const result = await window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
        resultTypes: ["violations"]
      });
      const tableIssues = [];
      const scrollIssues = [];

      document.querySelectorAll("table").forEach((table, index) => {
        const label = table.id ? `#${table.id}` : `table ${index + 1}`;
        const caption = table.querySelector(":scope > caption");
        if (!caption?.textContent.trim()) tableIssues.push(`${label} has no caption`);

        const missingScopes = table.querySelectorAll("th:not([scope='col']):not([scope='row'])");
        if (missingScopes.length) tableIssues.push(`${label} has ${missingScopes.length} header cell(s) without scope`);
      });

      document.querySelectorAll("table, #key-verbs > .study-card").forEach((element, index) => {
        const style = getComputedStyle(element);
        const overflowsHorizontally = element.scrollWidth > element.clientWidth + 1;
        const isVisible = element.getClientRects().length > 0 && style.visibility !== "hidden";
        const scrollsHorizontally = isVisible
          && ["auto", "scroll"].includes(style.overflowX)
          && overflowsHorizontally;
        const clipsHorizontally = isVisible
          && ["hidden", "clip"].includes(style.overflowX)
          && overflowsHorizontally;
        if (clipsHorizontally) {
          scrollIssues.push(`horizontal table region ${index + 1} clips content instead of allowing scrolling`);
        }
        if (scrollsHorizontally && element.tabIndex < 0) {
          scrollIssues.push(`horizontal scroll region ${index + 1} is not keyboard focusable`);
        }
      });

      return {
        scrollIssues,
        tableIssues,
        violations: result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact))
      };
    });

    audit.violations.forEach((violation) => {
      const targets = violation.nodes.slice(0, 4).map((node) => node.target.join(" ")).join(", ");
      const detail = violation.nodes[0]?.failureSummary?.replace(/\s+/g, " ") || "";
      failures.push(`${violation.id} (${violation.nodes.length} node(s)) ${violation.help}; ${targets}; ${detail}`);
    });
    failures.push(...audit.tableIssues);
    failures.push(...audit.scrollIssues);

    await page.keyboard.press("Tab");
    const focus = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element || element === document.body) return { focusable: false, visible: false };
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return { focusable: true, visible: style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0 };
    });
    if (!focus.focusable || !focus.visible) failures.push("first Tab does not reach a visible control");
  } finally {
    await page.close();
  }

  console.log(`${failures.length ? "fail" : "ok"} a11y ${pageName} ${viewportName}`);
  return failures.map((failure) => `${pageName} ${viewportName}: ${failure}`);
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
      let nextPageIndex = 0;
      const workers = Array.from({ length: Math.min(concurrency, pages.length) }, async () => {
        while (nextPageIndex < pages.length) {
          const pageName = pages[nextPageIndex];
          nextPageIndex += 1;
          failures.push(...await auditPage(context, pageName, viewport.name));
        }
      });
      await Promise.all(workers);
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
