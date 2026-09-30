const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const docsRoot = path.join(root, "docs");
const errors = [];
const requiredFiles = [
  "README.md",
  "roadmap.md",
  "decisions/0001-book-course-and-topic-library.md",
  "decisions/0002-shared-learning-content-and-review.md",
  "decisions/0003-layered-style-system.md",
  "analysis/book-coverage.md",
  "analysis/phrase-bank-audit.md",
  "analysis/review-connections.md",
  "analysis/word-search-pdf-coverage.md",
  "quality/visual-regression-checklist.md",
  "proposals/multi-language-framework.md",
  "tools/word-search-pdf-audit.md"
];

const rootMarkdown = fs.readdirSync(root)
  .filter((name) => name.toLowerCase().endsWith(".md"))
  .filter((name) => name !== "README.md");
if (rootMarkdown.length) {
  errors.push(`Markdown files must live under docs/: ${rootMarkdown.join(", ")}`);
}

requiredFiles.forEach((relativePath) => {
  if (!fs.existsSync(path.join(docsRoot, relativePath))) {
    errors.push(`Missing required documentation file: docs/${relativePath}`);
  }
});

function markdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(absolute);
    return entry.name.toLowerCase().endsWith(".md") ? [absolute] : [];
  });
}

const documentationFiles = [path.join(root, "README.md"), ...markdownFiles(docsRoot)];
documentationFiles.forEach((file) => {
  const source = fs.readFileSync(file, "utf8");
  const links = Array.from(source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g), (match) => match[1]);
  links.forEach((href) => {
    if (/^(?:https?:|mailto:|#)/i.test(href)) return;
    const pathname = href.split("#")[0].split("?")[0];
    if (!pathname || !pathname.toLowerCase().endsWith(".md")) return;
    const target = path.resolve(path.dirname(file), decodeURIComponent(pathname));
    if (!fs.existsSync(target)) {
      errors.push(`${path.relative(root, file)} links to missing file ${href}`);
    }
  });
});

if (errors.length) {
  errors.forEach((error) => console.error(`fail ${error}`));
  process.exit(1);
}

console.log(`ok documentation structure and links (${documentationFiles.length} files)`);
