const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const inventory = read("assets/data/book_coverage_inventory.json");
const glossData = read("assets/data/course_target_glosses.json");
const exampleData = read("assets/data/course_target_examples.json");
const supplements = read("assets/data/course_supplemental_content.json");
const assessments = read("assets/data/course_target_assessments.json");
const grammar = read("assets/data/grammar_targets.json");
const errors = [];
const fail = (message) => errors.push(message);
const normalize = (value) => String(value || "").normalize("NFKC").trim().toLocaleLowerCase("mt");
const allowedSame = new Set(["dentist", "emu", "malta", "pakistan", "pizza", "paella", "kiwi", "banana", "pastizzi", "boots", "menu"]);
const grammarTopicIds = new Set((inventory.grammarTopics || []).map((topic) => topic.id));
const grammarTargetIds = new Set();

(grammar.targets || []).forEach((target) => {
  if (grammarTargetIds.has(target.id)) fail(`duplicate grammar target id: ${target.id}`);
  grammarTargetIds.add(target.id);
  if (target.sourceRef.kind === "book-grammar-topic") {
    target.sourceRef.inventoryTopicIds.forEach((topicId) => {
      if (!grammarTopicIds.has(topicId)) fail(`${target.id} references missing inventory grammar topic ${topicId}`);
    });
  } else if (!fs.existsSync(path.join(root, target.sourceRef.sourcePage))) {
    fail(`${target.id} references missing site extension page ${target.sourceRef.sourcePage}`);
  }
  if (!target.assessment.recognition.choices.includes(target.assessment.recognition.answer)) {
    fail(`${target.id} recognition answer is absent from its choices`);
  }
  if (!target.assessment.production.prompt.includes("_____")) {
    fail(`${target.id} production prompt has no cloze`);
  }
});
if (grammarTargetIds.size !== 8) fail(`expected 8 grammar targets, found ${grammarTargetIds.size}`);

const requirements = inventory.chapters.flatMap((chapter) => chapter.targets.map((target) => ({
  key: `${chapter.courseChapterId}::${target}`,
  target
})));
const expectedKeys = new Set(requirements.map(({ key }) => key));
const glossKeys = Object.keys(glossData.glosses || {});
const exampleKeys = Object.keys(exampleData.examples || {});

if (glossData.schemaVersion !== 2) fail("course_target_glosses schemaVersion must be 2");
if (glossKeys.length !== expectedKeys.size) fail(`expected ${expectedKeys.size} explicit glosses, found ${glossKeys.length}`);
glossKeys.filter((key) => !expectedKeys.has(key)).forEach((key) => fail(`unexpected gloss key: ${key}`));
if (exampleData.schemaVersion !== 1) fail("course_target_examples schemaVersion must be 1");
if (exampleKeys.length !== expectedKeys.size) fail(`expected ${expectedKeys.size} contextual examples, found ${exampleKeys.length}`);
exampleKeys.filter((key) => !expectedKeys.has(key)).forEach((key) => fail(`unexpected example key: ${key}`));

requirements.forEach(({ key, target }) => {
  const gloss = glossData.glosses[key];
  if (typeof gloss !== "string" || !gloss.trim()) fail(`${key} has no reviewed English gloss`);
  if (typeof gloss !== "string") return;
  if (/\[(?:UNCERTAIN|overview-based)\]/i.test(gloss)) fail(`${key} contains an uncertainty marker`);
  if (gloss.length > 80) fail(`${key} gloss is too long (${gloss.length} characters)`);
  if (normalize(gloss) === normalize(target) && !allowedSame.has(normalize(target))) {
    fail(`${key} repeats the Maltese target as its English gloss`);
  }
  const example = exampleData.examples[key];
  if (!example) return;
  if (!normalize(example.maltese).includes(normalize(target))) fail(`${key} example does not contain its target`);
  if (normalize(example.maltese) === normalize(target)) fail(`${key} example repeats only its target`);
  if (!normalize(example.english)) fail(`${key} example has no English translation`);
  if (example.review !== "reviewed-template") fail(`${key} example is not marked reviewed`);
});

const supplementItems = new Map();
(supplements.chapters || []).forEach((chapter) => (chapter.items || []).forEach((item) => {
  const key = `${chapter.id}::${item.maltese}`;
  supplementItems.set(key, item);
  if (item.glossReview !== "reviewed") fail(`${key} is not marked as reviewed`);
  if (item.english !== glossData.glosses[key]) fail(`${key} is out of sync with reviewed glosses`);
  if (item.example !== exampleData.examples[key]?.maltese) fail(`${key} is out of sync with contextual examples`);
  if (item.exampleTranslation !== exampleData.examples[key]?.english) fail(`${key} has a stale example translation`);
}));
if (supplementItems.size !== expectedKeys.size) fail(`expected ${expectedKeys.size} supplemental cards, found ${supplementItems.size}`);

if (assessments.schemaVersion !== 2) fail("course_target_assessments schemaVersion must be 2");
const assessmentTypes = new Set();
(assessments.sets || []).forEach((set) => {
  const setTypes = new Set((set.items || []).map((item) => item.type));
  setTypes.forEach((type) => assessmentTypes.add(type));
  if (set.kind === "diagnostic" && (!setTypes.has("multiple-choice") || !setTypes.has("true-false"))) {
    fail(`${set.id} must mix multiple-choice and true-false recognition`);
  }
  if (set.kind === "checkpoint" && set.targetCount > 1 && !setTypes.has("matching")) fail(`${set.id} has no matching task`);
  (set.items || []).forEach((item) => {
    if (item.assessmentMode === "production" && !String(item.prompt || "").includes("_____")) {
      fail(`${set.id}/${item.id} production prompt has no contextual cloze`);
    }
    if (item.type === "order-words" && (item.tokens || []).length < 2) {
      fail(`${set.id}/${item.id} phrase ordering needs at least two tokens`);
    }
  });
});
["multiple-choice", "true-false", "fill-blank", "matching", "order-words"].forEach((type) => {
  if (!assessmentTypes.has(type)) fail(`generated assessments do not exercise ${type}`);
});

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
console.log(`ok checked ${expectedKeys.size} explicit reviewed course glosses, ${grammarTargetIds.size} grammar targets, and generated dependants`);
