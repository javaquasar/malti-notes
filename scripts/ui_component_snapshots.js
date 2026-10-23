const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const { uiComponentCatalogPage } = require("./visual_config");
const root = path.resolve(__dirname, "..");
const result = spawnSync(process.execPath, [path.join(__dirname, "visual_screenshots.js")], {
  cwd: root, encoding: "utf8", env: { ...process.env, PLAYWRIGHT_USE_BUNDLED: "1",
    VISUAL_PAGES: uiComponentCatalogPage, VISUAL_COMPONENTS: "1", VISUAL_PORT: "4189" }
});
process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");
if (result.status !== 0) process.exit(result.status || 1);
const folder = result.stdout.match(/Screenshots saved to (.+)/)?.[1].trim();
if (!folder) throw new Error("Missing snapshot output");
fs.writeFileSync(path.join(root, folder, "capture.json"), JSON.stringify({
  platform: process.platform, browser: require("playwright/package.json").version,
  fixture: uiComponentCatalogPage, themes: ["classic", "forest", "contrast"],
  viewports: [1280, 390], comparison: "Capture only until platform-specific references are reviewed; existing catalog comparison remains mandatory."
}, null, 2) + "\n");
const baselineIndex = process.argv.indexOf("--baseline");
if (baselineIndex !== -1) {
  const baseline = process.argv[baselineIndex + 1];
  if (!baseline) throw new Error("--baseline requires a reviewed reference directory");
  const metadata = JSON.parse(fs.readFileSync(path.resolve(root, baseline, "capture.json"), "utf8"));
  if (metadata.platform !== process.platform) throw new Error("Snapshot platform mismatch");
  const diff = spawnSync(process.execPath, [path.join(__dirname, "visual_diff.js"), "--baseline", baseline, "--current", folder], { cwd: root, stdio: "inherit" });
  process.exitCode = diff.status || 0;
}
