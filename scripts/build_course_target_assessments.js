const fs = require("fs");
const path = require("path");
const { createHash } = require("node:crypto");

const root = path.resolve(__dirname, "..");
const outputFile = path.join(root, "assets", "data", "course_target_assessments.json");
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const bindings = readJson("assets/data/course_target_bindings.json");
const course = readJson("assets/data/course_path.json");
const glosses = readJson("assets/data/course_target_glosses.json").glosses;
const contextualExamples = readJson("assets/data/course_target_examples.json").examples;
const colourPairs = readJson("assets/data/colors.json").groups
  .find((group) => group.id === "core-colours").items
  .map((item) => [item.lemma, item.verifiedClaims?.feminine?.value])
  .filter(([masculine, feminine]) => masculine && feminine && masculine !== feminine);
const grammarTargets = new Map(readJson("assets/data/grammar_targets.json").targets.map((target) => [target.id, target]));
const requestedLevels = new Set(
  (process.env.COURSE_ASSESSMENT_LEVELS || "B1,B2")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean)
);

function targetMeaning(target) {
  if (target.type === "grammar") return grammarTargets.get(target.id)?.masteryLabel;
  const key = `${target.chapterId}::${target.sourceRequirement}`;
  const meaning = glosses[key];
  if (!meaning) throw new Error(`No reviewed assessment meaning for ${target.id}`);
  return meaning;
}

function grammarAssessmentItem(target, mode, suffix = mode) {
  const grammarTarget = grammarTargets.get(target.id);
  const source = grammarTarget?.assessment?.[mode];
  if (!source) throw new Error(`No ${mode} grammar assessment for ${target.id}`);
  return {
    ...source,
    id: `${target.id}-${suffix}`,
    assessmentMode: mode,
    targetIds: [target.id],
    reviewCard: {
      maltese: grammarTarget.pattern,
      english: grammarTarget.summary,
      example: grammarTarget.examples[0].maltese
    }
  };
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

function trueFalseItem(entry, index, meanings, correct, suffix) {
  const { target, meaning } = entry;
  const distractor = rotate(meanings, index + 1).find((value) => value !== meaning);
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

function colourRecognitionItem({ target, meaning }, index, pair, correct, suffix) {
  const form = target.sourceRequirement;
  const formIndex = pair.indexOf(form);
  const otherForm = pair[1 - formIndex];
  const { context, cloze } = clozeExample(target);
  const gender = formIndex === 0 ? "masculine" : "feminine";
  const noun = context.maltese.split(" ")[0];
  const id = `${target.id}-${suffix}`;
  const shared = {
    assessmentMode: "recognition",
    targetIds: [target.id],
    explanation: `${noun} is ${gender}, so use ${form}. ${context.maltese}`,
    reviewCard: { maltese: form, english: meaning }
  };
  if (index % 2 !== 0) {
    const sentence = cloze.replace("_____", correct ? form : otherForm);
    return {
      ...shared,
      id: `${id}-true-false`,
      type: "true-false",
      prompt: `True or false? “${sentence}” correctly says “${context.english}”`,
      answer: correct
    };
  }
  const otherColours = colourPairs
    .filter((candidate) => candidate !== pair && contextualExamples[`${target.chapterId}::${candidate[formIndex]}`])
    .map((candidate) => candidate[formIndex]);
  return {
    ...shared,
    id,
    type: "multiple-choice",
    prompt: `Choose the right colour form. ${cloze} (${context.english})`,
    choices: rotate([form, otherForm, otherColours[index % otherColours.length]], index % 3),
    answer: form
  };
}

function recognitionItem(entry, index, meanings, trueTargets, suffix = "recognition") {
  if (entry.target.type === "grammar") return grammarAssessmentItem(entry.target, "recognition", suffix);
  const correct = trueTargets.has(entry.target.id);
  if (entry.target.chapterId === "b1-colours") {
    const pair = colourPairs.find((forms) => forms.includes(entry.target.sourceRequirement));
    if (pair) return colourRecognitionItem(entry, index, pair, correct, suffix);
  }
  return index % 2 === 0
    ? multipleChoiceItem(entry, index, meanings, suffix)
    : trueFalseItem(entry, index, meanings, correct, suffix);
}

function trueTargetsFor(entries, suffix) {
  // Keep the existing question types and IDs. Choose half of the actual
  // true/false candidates by stable hash, independently of display order.
  const candidates = entries.flatMap(({ target }, index) => index % 2 === 1 && target.type !== "grammar"
    ? [{ id: target.id, key: createHash("sha256").update(`${suffix}/${target.id}`).digest("hex") }]
    : []);
  candidates.sort((left, right) => left.key.localeCompare(right.key));
  return new Set(candidates.slice(0, Math.ceil(candidates.length / 2)).map(({ id }) => id));
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
  if (target.type === "grammar") return grammarAssessmentItem(target, "production");
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
  const diagnosticTargets = diagnosticEntries(entries);
  const diagnosticTrueTargets = trueTargetsFor(diagnosticTargets, "diagnostic-recognition");
  const checkpointTrueTargets = trueTargetsFor(entries, "recognition");
  const diagnostic = {
    ...shared,
    id: `${chapter.id}-diagnostic`,
    kind: "diagnostic",
    title: `${chapter.title} Entry Diagnostic`,
    items: diagnosticTargets.map((entry, index) => recognitionItem(entry, index, meanings, diagnosticTrueTargets, "diagnostic-recognition"))
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
        recognitionItem(entry, checkpointIndex * 6 + index, meanings, checkpointTrueTargets),
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
