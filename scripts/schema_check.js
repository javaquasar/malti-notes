const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");

const root = path.resolve(__dirname, "..");
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const ajv = new Ajv({ allErrors: true, strict: false });
const checks = [
  ["schemas/site-map.schema.json", ["assets/data/site-map.json"]],
  ["schemas/search-index.schema.json", ["assets/data/search-index.json"]],
  ["schemas/course-manifest.schema.json", ["assets/data/course/manifest.json"]],
  ["schemas/course-chapter.schema.json", fs.readdirSync(path.join(root, "assets/data/course/chapters")).filter((file) => file.endsWith(".json")).sort().map((file) => `assets/data/course/chapters/${file}`)],
  ["schemas/course-milestones.schema.json", ["assets/data/course_milestone_assessments.json"]]
];
const failures = [];

checks.forEach(([schemaFile, dataFiles]) => {
  const validate = ajv.compile(read(schemaFile));
  dataFiles.forEach((dataFile) => {
    const data = read(dataFile);
    if (!validate(data)) {
      validate.errors.forEach((error) => failures.push(`${dataFile}${error.instancePath || "/"} ${error.message}`));
      return;
    }
    if (dataFile.endsWith("search-index.json") && data.entryCount !== data.entries.length) failures.push(`${dataFile} entryCount does not match entries.length`);
    if (dataFile.endsWith("manifest.json") && (data.chapterCount !== data.chapters.length || data.targetCount !== data.chapters.reduce((total, chapter) => total + chapter.targetIds.length, 0))) failures.push(`${dataFile} summary counts are stale`);
    if (dataFile.endsWith("course_milestone_assessments.json")) data.sets.forEach((set) => {
      if (set.chapterCount !== set.chapterIds.length || set.itemCount !== set.items.length) failures.push(`${dataFile} ${set.id} summary counts are stale`);
    });
    console.log(`ok schema ${dataFile}`);
  });
});

if (failures.length) {
  failures.forEach((failure) => console.error(`fail schema ${failure}`));
  process.exit(1);
}

console.log(`ok validated ${checks.reduce((total, check) => total + check[1].length, 0)} structured files with JSON Schema`);
