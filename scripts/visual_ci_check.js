const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { PNG } = require("pngjs");
const { fullPageVisualPages: defaultPages } = require("./visual_config");

const root = path.resolve(__dirname, "..");
const defaultThemes = ["classic", "forest", "contrast"];
const viewportCount = 2;

function parseList(value, fallback) {
  return (value || fallback.join(","))
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOutputFolder(output) {
  const match = output.match(/Screenshots saved to (.+)\s*$/m);
  return match ? path.resolve(root, match[1].trim()) : null;
}

function listPng(folder) {
  return fs.readdirSync(folder)
    .filter((file) => file.toLowerCase().endsWith(".png"))
    .sort();
}

function isBlankPng(filePath) {
  const png = PNG.sync.read(fs.readFileSync(filePath));
  const first = [png.data[0], png.data[1], png.data[2], png.data[3]];
  const step = Math.max(1, Math.floor((png.width * png.height) / 5000));

  for (let pixel = 0; pixel < png.width * png.height; pixel += step) {
    const offset = pixel * 4;

    if (
      Math.abs(png.data[offset] - first[0]) > 2 ||
      Math.abs(png.data[offset + 1] - first[1]) > 2 ||
      Math.abs(png.data[offset + 2] - first[2]) > 2 ||
      Math.abs(png.data[offset + 3] - first[3]) > 2
    ) {
      return false;
    }
  }

  return true;
}

function main() {
  const allPages = parseList(process.env.VISUAL_CI_PAGES || process.env.VISUAL_PAGES, defaultPages);
  const shardTotal = Number(process.env.VISUAL_SHARD_TOTAL || 1);
  const shardIndex = Number(process.env.VISUAL_SHARD_INDEX || 0);
  if (!Number.isInteger(shardTotal) || shardTotal < 1 || !Number.isInteger(shardIndex) || shardIndex < 0 || shardIndex >= shardTotal) {
    throw new Error(`Invalid visual shard ${shardIndex}/${shardTotal}`);
  }
  const pages = allPages.filter((_, index) => index % shardTotal === shardIndex);
  if (!pages.length) throw new Error(`Visual shard ${shardIndex}/${shardTotal} has no pages`);
  const themes = parseList(process.env.VISUAL_CI_THEMES || process.env.VISUAL_THEMES, defaultThemes);
  const env = {
    ...process.env,
    VISUAL_PAGES: pages.join(","),
    VISUAL_THEMES: themes.join(","),
    VISUAL_PORT: process.env.VISUAL_PORT || "4174",
    VISUAL_OUTPUT_SUFFIX: process.env.VISUAL_OUTPUT_SUFFIX || `shard-${shardIndex}`
  };
  const result = spawnSync(process.execPath, [path.join(__dirname, "visual_screenshots.js")], {
    cwd: root,
    env,
    encoding: "utf8"
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }

  const outputFolder = parseOutputFolder(result.stdout || "");

  if (!outputFolder || !fs.existsSync(outputFolder)) {
    throw new Error("Could not find visual screenshot output folder");
  }

  const pngFiles = listPng(outputFolder);
  const expectedCount = pages.length * themes.length * viewportCount;

  if (pngFiles.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} screenshots, found ${pngFiles.length}`);
  }

  const blankFiles = pngFiles.filter((file) => isBlankPng(path.join(outputFolder, file)));

  if (blankFiles.length) {
    throw new Error(`Blank screenshots detected: ${blankFiles.join(", ")}`);
  }

  console.log(`ok visual CI shard ${shardIndex + 1}/${shardTotal} checked ${pngFiles.length} screenshot(s) in ${path.relative(root, outputFolder)}`);
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
