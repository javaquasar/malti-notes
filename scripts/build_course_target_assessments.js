const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputFile = path.join(root, "assets", "data", "course_target_assessments.json");
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const bindings = readJson("assets/data/course_target_bindings.json");
const course = readJson("assets/data/course_path.json");
const glosses = readJson("assets/data/course_target_glosses.json").glosses;
const contextualExamples = readJson("assets/data/course_target_examples.json").examples;
const requestedLevels = new Set(
  (process.env.COURSE_ASSESSMENT_LEVELS || "B1,B2")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean)
);

function targetMeaning(target) {
  const key = `${target.chapterId}::${target.sourceRequirement}`;
  const meaning = glosses[key];
  if (!meaning) throw new Error(`No reviewed assessment meaning for ${target.id}`);
  return meaning;
}

function rotate(values, offset) {
  return values.map((_, index) => values[(index + offset) % values.length]);
}

function multipleChoiceItem(entry, index, meanings, suffix = "recognition") {
  const { target, meaning } = entry;
  const distractors = rotate(meanings, index + 1).filter((value) => value !== meaning).slice(0, 2);
  return {
    id: `${target.id}-${suffix}`,
    type: "multiple-choice",
    assessmentMode: "recognition",
    targetIds: [target.id],
    prompt: `What is the lesson meaning of “${target.sourceRequirement}”?`,
    choices: rotate([meaning, ...distractors], index % 3),
    answer: meaning,
    explanation: `${target.sourceRequirement} means “${meaning}” in this chapter.`,
    reviewCard: { maltese: target.sourceRequirement, english: meaning }
  };
}

function trueFalseItem(entry, index, meanings, suffix = "recognition") {
  const { target, meaning } = entry;
  const distractor = rotate(meanings, index + 1).find((value) => value !== meaning);
  const correct = index % 2 === 0;
  const shownMeaning = correct ? meaning : distractor;
  return {
    id: `${target.id}-${suffix}-true-false`,
    type: "true-false",
    assessmentMode: "recognition",
    targetIds: [target.id],
    prompt: `True or false: “${target.sourceRequirement}” means “${shownMeaning}” in this chapter.`,
    answer: correct,
    explanation: `${target.sourceRequirement} means “${meaning}”.`,
    reviewCard: { maltese: target.sourceRequirement, english: meaning }
  };
}

function recognitionItem(entry, index, meanings, suffix = "recognition") {
  return index % 2 === 0
    ? multipleChoiceItem(entry, index, meanings, suffix)
    : trueFalseItem(entry, index, meanings, suffix);
}

function clozeExample(target) {
  const key = `${target.chapterId}::${target.sourceRequirement}`;
  const context = contextualExamples[key];
  if (!context) throw new Error(`No contextual assessment example for ${target.id}`);
  const escaped = target.sourceRequirement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const cloze = context.maltese.replace(new RegExp(escaped, "i"), "_____");
  if (cloze === context.maltese) throw new Error(`Could not make contextual cloze for ${target.id}`);
  return { context, cloze };
}

function productionItem({ target, meaning }) {
  const { context, cloze } = clozeExample(target);
  const shared = {
    id: `${target.id}-production`,
    assessmentMode: "production",
    targetIds: [target.id],
    prompt: `Complete the Maltese sentence: “${cloze}” (${context.english})`,
    answer: target.sourceRequirement,
    explanation: `The complete sentence is “${context.maltese}”`,
    reviewCard: { maltese: target.sourceRequirement, english: meaning, example: context.maltese }
  };
  const tokens = target.sourceRequirement.split(/\s+/).filter(Boolean);
  return tokens.length > 1
    ? { ...shared, type: "order-words", tokens }
    : { ...shared, type: "fill-blank", accepted: [target.sourceRequirement] };
}

function matchingItem(chunk, checkpointIndex) {
  const uniqueMeanings = new Set();
  const entries = chunk.filter((entry) => {
    if (uniqueMeanings.has(entry.meaning)) return false;
    uniqueMeanings.add(entry.meaning);
    return true;
  }).slice(0, 4);
  if (entries.length < 2) throw new Error(`Checkpoint ${checkpointIndex + 1} needs two unique matching pairs`);
  return {
    id: `${entries[0].target.chapterId}-checkpoint-${checkpointIndex + 1}-matching`,
    type: "matching",
    assessmentMode: "recognition",
    targetIds: entries.map((entry) => entry.target.id),
    prompt: "Match each Maltese target to its chapter meaning.",
    pairs: entries.map((entry) => ({ left: entry.target.sourceRequirement, right: entry.meaning })),
    explanation: "These pairs use the reviewed meanings from this chapter.",
    reviewCard: { maltese: entries[0].target.sourceRequirement, english: entries[0].meaning }
  };
}

function diagnosticEntries(entries, limit = 10) {
  if (entries.length <= limit) return entries;
  return Array.from({ length: limit }, (_, index) => entries[Math.floor(index * (entries.length - 1) / (limit - 1))]);
}

function chunks(values, size) {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) => values.slice(index * size, (index + 1) * size));
}

function buildSets(chapter, targets) {
  const entries = targets.map((target) => ({ target, meaning: targetMeaning(target) }));
  const meanings = [...new Set(entries.map((entry) => entry.meaning))];
  if (meanings.length < 3) throw new Error(`${chapter.id} needs at least three distinct meanings`);

  const shared = {
    chapterId: chapter.id,
    level: chapter.id.startsWith("b1-") ? "B1" : "B2",
    passPercent: 75
  };
  const diagnostic = {
    ...shared,
    id: `${chapter.id}-diagnostic`,
    kind: "diagnostic",
    title: `${chapter.title} Entry Diagnostic`,
    items: diagnosticEntries(entries).map((entry, index) => recognitionItem(entry, index, meanings, "diagnostic-recognition"))
  };
  const checkpoints = chunks(entries, 6).map((chunk, checkpointIndex) => ({
    ...shared,
    id: `${chapter.id}-checkpoint-${checkpointIndex + 1}`,
    kind: "checkpoint",
    sequence: checkpointIndex + 1,
    targetCount: chunk.length,
    title: `${chapter.title} Checkpoint ${checkpointIndex + 1}`,
    items: [
      ...chunk.flatMap((entry, index) => [
        recognitionItem(entry, checkpointIndex * 6 + index, meanings),
        productionItem(entry)
      ]),
      ...(chunk.length > 1 ? [matchingItem(chunk, checkpointIndex)] : [])
    ]
  }));
  return [diagnostic, ...checkpoints];
}

const chapters = course.levels.flatMap((level) => level.chapters);
const sets = chapters
  .filter((chapter) => requestedLevels.has(chapter.id.startsWith("b1-") ? "B1" : "B2"))
  .flatMap((chapter) => {
    const targets = bindings.targets.filter((target) => (
      target.chapterId === chapter.id && target.implementationStatus === "implemented"
    ));
    return buildSets(chapter, targets);
  });

const output = {
  schemaVersion: 2,
  description: "Generated diagnostics and contextual recognition, matching, cloze, and phrase-order checkpoints for every implemented book-course target.",
  levels: [...requestedLevels].sort(),
  sets
};
const serialized = `${JSON.stringify(output, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, "utf8") : "";
  if (current !== serialized) {
    console.error("fail assets/data/course_target_assessments.json is not synchronized; run npm run course:assessments:build");
    process.exit(1);
  }
  console.log(`ok checked ${sets.length} generated target assessment sets`);
} else {
  fs.writeFileSync(outputFile, serialized, "utf8");
  console.log(`wrote ${sets.length} target assessment sets with ${sets.reduce((sum, set) => sum + set.items.length, 0)} items`);
}
