const assert = require("assert/strict");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");
const pages = ["greetings.html", "polite_phrases.html", "conversation_help.html", "getting_to_know.html",
  "particles_prepositions.html", "reading_red_cave.html", "numbers_calendar_time.html"];
const properties = ["color", "backgroundColor", "borderTopColor", "borderTopWidth", "borderRadius",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "width", "height", "display", "alignItems", "justifyContent", "fontSize", "lineHeight", "outlineStyle", "outlineWidth", "outlineColor"];

async function check(page) {
  return page.evaluate((properties) => {
    const failures = [];
    const buttons = [...document.querySelectorAll(".review-add-button--icon")].filter((node) => node.getClientRects().length);
    const read = (node) => {
      const css = getComputedStyle(node);
      const icon = getComputedStyle(node, "::before");
      // Grid/flex items blockify inline-flex without changing the component's inner layout.
      return [...properties.map((key) => key === "display" ? css[key].replace(/^inline-/, "") : css[key]), icon.backgroundColor, icon.width, icon.height, icon.transform];
    };
    for (const button of buttons) {
      const probe = document.createElement("button");
      probe.type = "button";
      probe.className = "review-add-button review-add-button--icon review-add-button--inline";
      if (button.classList.contains("is-added")) probe.classList.add("is-added");
      probe.setAttribute("aria-pressed", button.getAttribute("aria-pressed") || "false");
      // Keep the reference outside page-specific containers and off-screen without changing its own styling.
      const host = document.createElement("div");
      host.style.cssText = "position:fixed;left:-10000px;top:0;display:grid";
      host.append(probe); document.body.append(host);
      const focused = document.activeElement === button;
      const actual = read(button);
      if (focused) probe.focus({ preventScroll: true });
      const expected = read(probe);
      actual.forEach((value, index) => {
        if (value !== expected[index]) failures.push(`${button.className}: ${[...properties, "icon.color", "icon.width", "icon.height", "icon.transform"][index]} ${value} != ${expected[index]}`);
      });
      host.remove();
      if (focused) button.focus({ preventScroll: true });
      const rect = button.getBoundingClientRect();
      if (Math.abs(rect.width - rect.height) > 0.5) failures.push("Non-square review button");
      const cell = button.closest(".review-table-action");
      if (cell) {
        const parent = cell.getBoundingClientRect();
        if (Math.abs(rect.x + rect.width / 2 - parent.x - parent.width / 2) > 2 ||
          Math.abs(rect.y + rect.height / 2 - parent.y - parent.height / 2) > 2) failures.push("Review button is not centered in its table cell");
      }
    }
    const fields = [...document.querySelectorAll("input.study-input, select.study-input, textarea.study-input")].filter((node) => node.getClientRects().length);
    const fieldProperties = ["color", "backgroundColor", "borderTopColor", "borderTopWidth", "borderRadius", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "minHeight", "opacity", "outlineStyle", "outlineColor", "outlineWidth"];
    for (const field of fields) {
      const host = document.createElement("div");
      host.style.cssText = "position:fixed;left:-10000px;top:0";
      const reference = field.cloneNode(true);
      for (const attribute of reference.getAttributeNames()) {
        if (attribute === "id" || attribute === "style" || attribute.startsWith("data-")) reference.removeAttribute(attribute);
      }
      reference.className = "study-input";
      host.append(reference); document.body.append(host);
      const actual = Object.fromEntries(fieldProperties.map((property) => [property, getComputedStyle(field)[property]]));
      const focused = document.activeElement === field;
      if (focused) reference.focus({ preventScroll: true });
      const expected = getComputedStyle(reference);
      for (const property of fieldProperties) if (actual[property] !== expected[property]) failures.push(`study-input ${property}: ${actual[property]} != ${expected[property]}`);
      host.remove();
      if (focused) field.focus({ preventScroll: true });
    }
    return { buttons: buttons.length, fields: fields.length, failures };
  }, properties);
}

async function main() {
  const server = http.createServer((request, response) => {
    const file = path.resolve(root, "." + decodeURIComponent(new URL(request.url, "http://local").pathname));
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    fs.readFile(file, (error, data) => {
      response.writeHead(error ? 404 : 200, { "Content-Type": ({ ".html": "text/html", ".css": "text/css", ".js": "application/javascript", ".json": "application/json" })[path.extname(file)] || "application/octet-stream" });
      response.end(error ? "Not found" : data);
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  let browser;
  let passed = false;
  const evidence = [];
  try {
    browser = await chromium.launch();
    for (const theme of ["classic", "forest", "contrast"]) {
      for (const width of [1280, 390]) {
        for (const file of pages) {
          const context = await browser.newContext({ viewport: { width, height: 960 }, serviceWorkers: "block" });
          const page = await context.newPage();
          const errors = [];
          page.on("pageerror", (error) => errors.push(error.message));
          await context.addInitScript((theme) => localStorage.setItem("malti_site_theme", theme), theme);
          await page.goto(`http://127.0.0.1:${server.address().port}/${file}`, { waitUntil: "networkidle" });
          async function verify(state) {
            const result = await check(page);
            evidence.push({ file, theme, width, state, ...result });
            assert.deepEqual(result.failures, [], `${file}/${theme}/${width}/${state}`);
          }
          await verify("loaded");
          if (file === "numbers_calendar_time.html") {
            await page.evaluate(() => { location.hash = "number-forms"; });
            await page.locator("#number-forms .review-add-button--icon").first().waitFor({ state: "visible" });
            await verify("numbers-section-selected");
          }
          await page.locator("details").evaluateAll((nodes) => nodes.forEach((node) => { node.open = true; }));
          await verify("disclosures-open");
          const tabs = page.locator('#speaking-practice button[aria-controls^="lp-pane-"]');
          for (let index = 1; index < await tabs.count(); index += 1) {
            await tabs.nth(index).click();
            await verify(`tab-${index}`);
          }
          if (await tabs.count()) await tabs.first().click();
          const button = page.locator(".review-add-button--icon:visible").first();
          assert.ok(await button.count(), `${file}: no review controls exercised; errors: ${errors.join("; ")}`);
          await button.focus();
          await verify("focused");
          const field = page.locator(".study-input:visible:not(:disabled)").first();
          if (await field.count()) {
            await field.focus();
            await verify("field-focused");
          }
          await button.click();
          await page.locator("body").click({ position: { x: 1, y: 1 } });
          await verify("saved");
          const savedBefore = await page.evaluate(() => JSON.stringify(window.MaltiReviewStore.getAllCards()));
          assert.notEqual(savedBefore, "[]", "Save did not persist a card");
          await page.reload({ waitUntil: "networkidle" });
          assert.equal(await page.evaluate(() => JSON.stringify(window.MaltiReviewStore.getAllCards())), savedBefore, "Review progress changed on reload");
          await verify("restored");
          assert.deepEqual(errors, [], `${file}: browser errors`);
          // Prove that a legacy container override cannot contaminate the external reference.
          await page.locator(".review-add-button--icon:visible").first().evaluate((node) => node.dataset.uiNegative = "true");
          const mutation = await page.addStyleTag({ content: "[data-ui-negative] { border-top-color: magenta !important; width: 61px !important; }" });
          const broken = await check(page);
          assert.ok(broken.failures.length, "Negative appearance mutation escaped detection");
          await mutation.evaluate((node) => node.remove());
          const visibleField = page.locator(".study-input:visible").first();
          if (await visibleField.count()) {
            await visibleField.evaluate((node) => node.dataset.uiFieldNegative = "true");
            const fieldMutation = await page.addStyleTag({ content: "[data-ui-field-negative] { border-radius: 31px !important; }" });
            assert.ok((await check(page)).failures.length, "Negative input mutation escaped detection");
            await fieldMutation.evaluate((node) => node.remove());
          }
          await context.close();
        }
      }
    }
    passed = true;
    console.log(`ok ${evidence.length} runtime appearance states; saved progress, focus, disclosures, tabs and negative mutations`);
  } finally {
    fs.mkdirSync(path.join(root, "tmp_ui"), { recursive: true });
    fs.writeFileSync(path.join(root, "tmp_ui/runtime-contracts.json"), JSON.stringify({ passed, checks: evidence.length, evidence }, null, 2) + "\n");
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
