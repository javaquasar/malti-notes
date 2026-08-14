const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const inventory = read("assets/data/book_coverage_inventory.json");
const glossData = read("assets/data/course_target_glosses.json");
const supplements = read("assets/data/course_supplemental_content.json");
const assessments = read("assets/data/course_target_assessments.json");
const errors = [];
const fail = (message) => errors.push(message);
const normalize = (value) => String(value || "").normalize("NFKC").trim().toLocaleLowerCase("mt");
const allowedSame = new Set(["dentist", "emu", "malta", "pakistan", "pizza", "paella", "kiwi", "banana", "pastizzi", "boots", "menu"]);

const requirements = inventory.chapters.flatMap((chapter) => chapter.targets.map((target) => ({
  key: `${chapter.courseChapterId}::${target}`,
  target
})));
const expectedKeys = new Set(requirements.map(({ key }) => key));
const glossKeys = Object.keys(glossData.glosses || {});

if (glossData.schemaVersion !== 2) fail("course_target_glosses schemaVersion must be 2");
if (glossKeys.length !== expectedKeys.size) fail(`expected ${expectedKeys.size} explicit glosses, found ${glossKeys.length}`);
glossKeys.filter((key) => !expectedKeys.has(key)).forEach((key) => fail(`unexpected gloss key: ${key}`));

requirements.forEach(({ key, target }) => {
  const gloss = glossData.glosses[key];
  if (typeof gloss !== "string" || !gloss.trim()) fail(`${key} has no reviewed English gloss`);
  if (typeof gloss !== "string") return;
  if (/\[(?:UNCERTAIN|overview-based)\]/i.test(gloss)) fail(`${key} contains an uncertainty marker`);
  if (gloss.length > 80) fail(`${key} gloss is too long (${gloss.length} characters)`);
  if (normalize(gloss) === normalize(target) && !allowedSame.has(normalize(target))) {
    fail(`${key} repeats the Maltese target as its English gloss`);
  }
});

const supplementItems = new Map();
(supplements.chapters || []).forEach((chapter) => (chapter.items || []).forEach((item) => {
  const key = `${chapter.id}::${item.maltese}`;
  supplementItems.set(key, item);
  if (item.glossReview !== "reviewed") fail(`${key} is not marked as reviewed`);
  if (item.english !== glossData.glosses[key]) fail(`${key} is out of sync with reviewed glosses`);
}));
if (supplementItems.size !== expectedKeys.size) fail(`expected ${expectedKeys.size} supplemental cards, found ${supplementItems.size}`);

(assessments.sets || []).forEach((set) => (set.items || []).forEach((item) => {
  const strings = [item.prompt, item.answer, item.explanation, item.reviewCard?.english].filter(Boolean);
  if (strings.some((value) => /\[(?:UNCERTAIN|overview-based)\]/i.test(value))) {
    fail(`${set.id}/${item.id} contains an uncertainty marker`);
  }
}));

if (errors.length) {
  errors.forEach((error) => console.error(`fail course quality: ${error}`));
  process.exit(1);
}
console.log(`ok checked ${expectedKeys.size} explicit reviewed course glosses and generated dependants`);
