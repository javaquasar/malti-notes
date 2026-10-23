const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const sourceRoot = path.resolve(__dirname, "..");
const textExtensions = new Set([".html", ".css", ".js", ".json", ".webmanifest", ".svg"]);
const excluded = new Set(["course_target_assessments.json", "course_target_bindings.json", "course_target_examples.json",
  "course_target_glosses.json", "course_source_provenance.json", "course_supplemental_content.json"]);
function files(root, directory = "") {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.posix.join(directory, entry.name);
    return entry.isDirectory() ? files(root, relative) : [relative];
  }).sort();
}
function normalize(file, data) {
  return textExtensions.has(path.extname(file)) ? data.toString("utf8").replace(/\r\n/g, "\n") : data;
}
function rewriteResources(content, revision) {
  return content.replace(/(^|["'(\s=])((?:\.{1,2}\/)*|\/)assets\//g, `$1$2assets/${revision}/`)
    .replace(/(["'(])([^"'()\s]+\.(?:css|js))\?v=([a-zA-Z0-9._-]+)(?=["')])/g, (match, delimiter, resource) => {
      const url = new URL(resource, "https://release.invalid/");
      return url.origin === "https://release.invalid" ? delimiter + resource : match;
    });
}
function buildRelease(output, source = sourceRoot) {
  output = path.resolve(output);
  if (fs.existsSync(output)) throw new Error(`Release output already exists: ${output}`);
  if (output === source || source.startsWith(output + path.sep)) throw new Error("Release output cannot contain the source tree");
  const selected = [...fs.readdirSync(source).filter((file) => file.endsWith(".html")), "manifest.webmanifest",
    ...files(source, "assets").filter((file) => !excluded.has(path.basename(file)))].sort();
  const hash = crypto.createHash("sha256");
  for (const builder of ["build_release.js", "build_service_worker.js"]) {
    hash.update(builder).update("\0").update(normalize(builder, fs.readFileSync(path.join(__dirname, builder)))).update("\0");
  }
  for (const file of selected) hash.update(file).update("\0").update(normalize(file, fs.readFileSync(path.join(source, file)))).update("\0");
  const revision = hash.digest("hex").slice(0, 16);
  fs.mkdirSync(output, { recursive: true });
  for (const file of selected) {
    fs.mkdirSync(path.dirname(path.join(output, file)), { recursive: true });
    fs.writeFileSync(path.join(output, file), normalize(file, fs.readFileSync(path.join(source, file))));
  }
  const worker = spawnSync(process.execPath, [path.join(__dirname, "build_service_worker.js")], {
    env: { ...process.env, SITE_BUILD_ROOT: output }, encoding: "utf8"
  });
  if (worker.status !== 0) throw new Error(worker.stderr || worker.stdout);
  // Version the whole resource namespace: relative CSS imports and JS modules inherit it automatically.
  for (const file of files(output)) {
    if (!textExtensions.has(path.extname(file))) continue;
    const content = rewriteResources(fs.readFileSync(path.join(output, file), "utf8"), revision);
    fs.writeFileSync(path.join(output, file), content);
  }
  const temporaryAssets = path.join(output, `release-${revision}`);
  fs.renameSync(path.join(output, "assets"), temporaryAssets);
  fs.mkdirSync(path.join(output, "assets"));
  fs.renameSync(temporaryAssets, path.join(output, "assets", revision));
  const integrity = Object.fromEntries(files(output).map((file) => [file,
    crypto.createHash("sha256").update(fs.readFileSync(path.join(output, file))).digest("hex")]));
  fs.writeFileSync(path.join(output, "release.json"), JSON.stringify({ revision, integrity }, null, 2) + "\n");
  return { revision, output };
}
if (require.main === module) console.log(buildRelease(process.argv[2] || path.join(sourceRoot, "site-dist")));
module.exports = { buildRelease, files, normalize, rewriteResources };
