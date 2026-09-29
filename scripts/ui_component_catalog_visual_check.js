const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { uiComponentCatalogPage } = require("./visual_config");

const root = path.resolve(__dirname, "..");
const baselineFolder = path.join("visual-regression", "ui-component-catalog-baseline");
const requiredComponents = [
  "controls",
  "card-study",
  "card-info",
  "card-example",
  "card-pattern",
  "card-dialogue",
  "card-demo",
  "card-compact",
  "card-note",
  "pair-translation",
  "pair-question-answer",
  "dialogue-stack",
  "grammar-target",
  "rule-box",
  "contrast-wrong",
  "contrast-right",
  "list-example",
  "list-card-stack",
  "table-standard",
  "table-soft",
  "table-attached"
];

function runNode(script, args = [], extraEnv = {}) {
  const result = spawnSync(process.execPath, [path.join(__dirname, script), ...args], {
    cwd: root,
    env: { ...process.env, ...extraEnv },
    encoding: "utf8"
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
  return result.stdout || "";
}

function parseOutputFolder(output) {
  const match = output.match(/Screenshots saved to (.+)\s*$/m);
  return match ? path.resolve(root, match[1].trim()) : null;
}

function validateFixture() {
  const fixturePath = path.join(root, uiComponentCatalogPage);
  const html = fs.readFileSync(fixturePath, "utf8");
  const missing = requiredComponents.filter((component) => !html.includes(`data-component="${component}"`));
  if (missing.length) throw new Error(`UI component catalog is missing: ${missing.join(", ")}`);
  if (/#[0-9a-f]{3,8}\b|rgba?\(/i.test(html)) throw new Error("UI component catalog must use theme tokens, not direct colors");
  console.log(`ok UI component catalog contains ${requiredComponents.length} required variants`);
}

function main() {
  validateFixture();
  const updateBaseline = process.argv.includes("--update");
  const output = runNode("visual_screenshots.js", [], {
    PLAYWRIGHT_USE_BUNDLED: "1",
    VISUAL_PAGES: uiComponentCatalogPage,
    VISUAL_PORT: process.env.UI_CATALOG_VISUAL_PORT || "4179",
    VISUAL_THEMES: "classic,forest,contrast"
  });
  const currentFolder = parseOutputFolder(output);

  if (!currentFolder) throw new Error("Could not find UI component catalog screenshot output folder");
  const currentRelative = path.relative(root, currentFolder);

  if (updateBaseline) {
    runNode("visual_baseline.js", ["--from", currentRelative, "--target", baselineFolder]);
    return;
  }

  runNode("visual_diff.js", ["--baseline", baselineFolder, "--current", currentRelative]);
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
