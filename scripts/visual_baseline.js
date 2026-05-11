const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const baselineFolder = path.join(root, "visual-regression", "baseline");

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

function copyDirectory(source, target) {
  fs.mkdirSync(target, { recursive: true });
  fs.readdirSync(source, { withFileTypes: true }).forEach((entry) => {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

function removeDirectory(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const args = parseArgs(process.argv);
  const sourceArg = args.from;
  assert(sourceArg, "Missing --from screenshot folder");

  const sourceFolder = path.resolve(root, sourceArg);
  assert(fs.existsSync(sourceFolder), `Source folder does not exist: ${sourceArg}`);
  assert(fs.statSync(sourceFolder).isDirectory(), `Source is not a directory: ${sourceArg}`);

  const pngFiles = fs.readdirSync(sourceFolder).filter((file) => file.toLowerCase().endsWith(".png"));
  assert(pngFiles.length > 0, `Source folder has no PNG screenshots: ${sourceArg}`);

  removeDirectory(baselineFolder);
  copyDirectory(sourceFolder, baselineFolder);

  const metadata = {
    source: path.relative(root, sourceFolder),
    promotedAt: new Date().toISOString(),
    screenshots: pngFiles.length
  };
  fs.writeFileSync(path.join(baselineFolder, "baseline.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

  console.log(`Promoted ${pngFiles.length} screenshot(s) to ${path.relative(root, baselineFolder)}`);
}

main();
