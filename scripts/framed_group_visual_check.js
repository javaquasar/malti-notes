const path = require("path");
const { spawnSync } = require("child_process");
const { framedGroupFixturePage } = require("./visual_config");

const root = path.resolve(__dirname, "..");
const baselineFolder = path.join("visual-regression", "framed-group-baseline");

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

function main() {
  const updateBaseline = process.argv.includes("--update");
  const output = runNode("visual_screenshots.js", [], {
    PLAYWRIGHT_USE_BUNDLED: "1",
    VISUAL_PAGES: framedGroupFixturePage,
    VISUAL_PORT: process.env.FRAMED_GROUP_VISUAL_PORT || "4178",
    VISUAL_THEMES: "classic,forest,contrast"
  });
  const currentFolder = parseOutputFolder(output);

  if (!currentFolder) {
    throw new Error("Could not find framed-group screenshot output folder");
  }

  const currentRelative = path.relative(root, currentFolder);

  if (updateBaseline) {
    runNode("visual_baseline.js", [
      "--from",
      currentRelative,
      "--target",
      baselineFolder
    ]);
    return;
  }

  runNode("visual_diff.js", [
    "--baseline",
    baselineFolder,
    "--current",
    currentRelative
  ]);
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
