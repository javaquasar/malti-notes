const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputFile = path.join(root, "assets/data/course_supplemental_content.json");
const bindings = readJson("assets/data/course_target_bindings.json");
const course = readJson("assets/data/course_path.json");
const inventory = readJson("assets/data/book_coverage_inventory.json");
const glosses = readJson("assets/data/course_target_glosses.json").glosses;
const examples = readJson("assets/data/course_target_examples.json").examples;
const baselineMissingKeys = new Set(inventory.chapters.flatMap((chapter) => (
  chapter.baselineMissing.map((requirement) => `${chapter.courseChapterId}::${requirement}`)
)));
const numberGlosses = new Map([
  ["wieħed", "one"], ["tnejn", "two"], ["tlieta", "three"], ["erbgħa", "four"],
  ["ħamsa", "five"], ["sitta", "six"], ["sebgħa", "seven"], ["tmienja", "eight"],
  ["disgħa", "nine"], ["għaxra", "ten"], ["ħdax", "eleven"], ["tnax", "twelve"],
  ["tlettax", "thirteen"], ["erbatax", "fourteen"], ["ħmistax", "fifteen"],
  ["sittax", "sixteen"], ["sbatax", "seventeen"], ["tmintax", "eighteen"],
  ["dsatax", "nineteen"], ["għoxrin", "twenty"]
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function targetItem(target) {
  const key = `${target.chapterId}::${target.sourceRequirement}`;
  const english = glosses[key] || numberGlosses.get(target.sourceRequirement.toLocaleLowerCase("mt"));
  if (!english) throw new Error(`Missing reviewed gloss for ${key}`);
  const context = examples[key];
  if (!context) throw new Error(`Missing contextual example for ${key}`);
  return {
    id: target.id,
    maltese: target.sourceRequirement,
    english,
    example: context.maltese,
    exampleTranslation: context.english,
    examplePattern: context.pattern,
    exampleReview: context.review,
    glossReview: "reviewed",
    sourceStatus: baselineMissingKeys.has(key)
      ? "added-from-book"
      : (target.contentRef?.file === "assets/data/course_supplemental_content.json" || target.implementationStatus === "evidence-only"
        ? "evidence-only"
        : "implemented"),
    review: { enabled: true, type: target.type === "phrase" ? "sentence" : "word" }
  };
}

const chapters = course.levels.flatMap((level) => level.chapters).map((chapter) => ({
  id: chapter.id,
  title: chapter.title,
  items: bindings.targets
    .filter((target) => target.chapterId === chapter.id)
    .map(targetItem)
}));

const output = {
  schemaVersion: 1,
  page: "course_chapter.html",
  topic: "Book Course Supplements",
  description: "Canonical fallback cards for audited book targets; existing topic cards remain the preferred source.",
  chapters
};
const serialized = `${JSON.stringify(output, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, "utf8") : "";
  if (current !== serialized) {
    console.error("fail assets/data/course_supplemental_content.json is not synchronized; run npm run course:supplements:build");
    process.exit(1);
  }
  console.log(`ok checked ${chapters.reduce((sum, chapter) => sum + chapter.items.length, 0)} supplemental course cards`);
} else {
  fs.writeFileSync(outputFile, serialized);
  console.log(`wrote ${chapters.reduce((sum, chapter) => sum + chapter.items.length, 0)} supplemental course cards`);
}
