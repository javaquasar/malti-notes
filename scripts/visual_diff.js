const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const root = path.resolve(__dirname, "..");
const threshold = Number(process.env.VISUAL_DIFF_THRESHOLD || 0.1);
const maxDiffRatio = Number(process.env.VISUAL_DIFF_MAX_RATIO || 0.002);

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[index + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        index += 1;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function resolveFolder(input, label) {
  if (!input) {
    throw new Error(`Missing --${label} folder`);
  }
  const folder = path.resolve(root, input);
  if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
    throw new Error(`Invalid --${label} folder: ${input}`);
  }
  return folder;
}

function readPng(filePath) {
  return PNG.sync.read(fs.readFileSync(filePath));
}

function listPng(folder) {
  return fs.readdirSync(folder)
    .filter((file) => file.toLowerCase().endsWith(".png"))
    .sort();
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function loadPixelmatch() {
  const mod = await import("pixelmatch");
  return mod.default || mod;
}

async function main() {
  const args = parseArgs(process.argv);
  const baselineFolder = resolveFolder(args.baseline, "baseline");
  const currentFolder = resolveFolder(args.current, "current");
  const outputFolder = path.resolve(
    root,
    args.output || path.join("visual-regression", "diffs", new Date().toISOString().replace(/[:.]/g, "-"))
  );
  fs.mkdirSync(outputFolder, { recursive: true });

  const pixelmatch = await loadPixelmatch();
  const baselineFiles = new Set(listPng(baselineFolder));
  const currentFiles = new Set(listPng(currentFolder));
  const allFiles = [...new Set([...baselineFiles, ...currentFiles])].sort();
  const results = [];

  for (const file of allFiles) {
    const baselinePath = path.join(baselineFolder, file);
    const currentPath = path.join(currentFolder, file);
    const diffPath = path.join(outputFolder, file.replace(/\.png$/i, "__diff.png"));

    if (!baselineFiles.has(file) || !currentFiles.has(file)) {
      results.push({
        file,
        status: baselineFiles.has(file) ? "missing-current" : "missing-baseline",
        diffPixels: null,
        diffRatio: null
      });
      continue;
    }

    const baseline = readPng(baselinePath);
    const current = readPng(currentPath);

    if (baseline.width !== current.width || baseline.height !== current.height) {
      results.push({
        file,
        status: "size-mismatch",
        baselineSize: `${baseline.width}x${baseline.height}`,
        currentSize: `${current.width}x${current.height}`,
        diffPixels: null,
        diffRatio: null
      });
      continue;
    }

    const diff = new PNG({ width: baseline.width, height: baseline.height });
    const diffPixels = pixelmatch(
      baseline.data,
      current.data,
      diff.data,
      baseline.width,
      baseline.height,
      { threshold }
    );
    const totalPixels = baseline.width * baseline.height;
    const diffRatio = diffPixels / totalPixels;

    if (diffPixels > 0) {
      fs.writeFileSync(diffPath, PNG.sync.write(diff));
    }

    results.push({
      file,
      status: diffRatio > maxDiffRatio ? "changed" : "ok",
      diffPixels,
      diffRatio: Number(diffRatio.toFixed(6)),
      diff: diffPixels > 0 ? path.relative(root, diffPath) : null
    });
  }

  const summary = {
    baseline: path.relative(root, baselineFolder),
    current: path.relative(root, currentFolder),
    output: path.relative(root, outputFolder),
    threshold,
    maxDiffRatio,
    total: results.length,
    changed: results.filter((result) => result.status === "changed").length,
    ok: results.filter((result) => result.status === "ok").length,
    issues: results.filter((result) => !["ok"].includes(result.status)),
    results
  };

  writeJson(path.join(outputFolder, "summary.json"), summary);

  console.log(`Compared ${summary.total} screenshot(s).`);
  console.log(`Changed: ${summary.changed}`);
  console.log(`Output: ${summary.output}`);

  if (summary.issues.length) {
    summary.issues.slice(0, 20).forEach((issue) => {
      console.log(`${issue.status}: ${issue.file}${issue.diffRatio !== null ? ` (${issue.diffRatio})` : ""}`);
    });
  }

  if (summary.issues.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
