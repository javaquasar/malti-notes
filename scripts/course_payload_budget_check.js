const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "assets", "data", "course", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const maxManifestBytes = 64 * 1024;
const maxChapterBytes = 256 * 1024;
const errors = [];

const manifestBytes = fs.statSync(manifestPath).size;
if (manifestBytes > maxManifestBytes) errors.push(`manifest is ${manifestBytes} bytes (budget ${maxManifestBytes})`);
(manifest.chapters || []).forEach((chapter) => {
  const file = path.join(root, chapter.file.replace(/^\.\//, ""));
  const bytes = fs.statSync(file).size;
  if (bytes !== chapter.bytes) errors.push(`${chapter.id} manifest size is stale (${chapter.bytes} vs ${bytes})`);
  if (bytes > maxChapterBytes) errors.push(`${chapter.id} is ${bytes} bytes (budget ${maxChapterBytes})`);
});

if (errors.length) {
  errors.forEach((error) => console.error(`fail course payload budget: ${error}`));
  process.exit(1);
}
const largest = [...manifest.chapters].sort((a, b) => b.bytes - a.bytes)[0];
console.log(`ok course payload budget: manifest ${manifestBytes} bytes; largest ${largest.id} ${largest.bytes} bytes`);
