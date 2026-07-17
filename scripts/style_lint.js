const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const allowedColorFiles = new Set([
  "assets/css/theme.css",
  "assets/css/themes/forest.css",
  "assets/css/themes/contrast.css"
]);

function normalize(file) {
  return file.replace(/\\/g, "/");
}

function listFiles(dir, ext, files = []) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const abs = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "visual-regression") {
        return;
      }

      listFiles(abs, ext, files);
      return;
    }

    if (entry.isFile() && entry.name.endsWith(ext)) {
      files.push(abs);
    }
  });

  return files;
}

function count(text, pattern) {
  return (text.match(pattern) || []).length;
}

function report(message) {
  failures.push(message);
  console.error(`fail ${message}`);
}

const failures = [];
const cssFiles = listFiles(path.join(root, "assets", "css"), ".css")
  .map((file) => normalize(path.relative(root, file)))
  .sort();

cssFiles.forEach((file) => {
  const text = fs.readFileSync(path.join(root, file), "utf8");

  if (count(text, /\{/g) !== count(text, /\}/g)) {
    report(`${file}: unbalanced braces`);
  }

  if (/,\s*$/.test(text)) {
    report(`${file}: file ends with a dangling selector comma`);
  }

  if (!allowedColorFiles.has(file)) {
    const lines = text.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (/(#[0-9a-fA-F]{3,8}\b|rgba?\(|color-mix\()/i.test(line)) {
        report(`${file}:${index + 1}: direct color value should be a theme token`);
      }
    });
  }
});

const siteEntry = fs.readFileSync(path.join(root, "assets/css/site.css"), "utf8");
[
  "base.css",
  "review.css",
  "layout.css",
  "components.css",
  "verbs.css",
  "imperative.css",
  "games.css",
  "navigation.css",
  "responsive.css",
  "print.css"
].forEach((file) => {
  if (!siteEntry.includes(`@import url("./site/${file}")`)) {
    report(`assets/css/site.css: missing ${file} import`);
  }
});

if (failures.length) {
  console.error(`\n${failures.length} style lint issue(s) found.`);
  process.exit(1);
}

console.log(`ok checked ${cssFiles.length} css files`);
