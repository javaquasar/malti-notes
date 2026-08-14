const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputFile = path.join(root, "assets/data/course_target_assessments.json");
const bindings = readJson("assets/data/course_target_bindings.json");
const course = readJson("assets/data/course_path.json");
const requestedLevels = new Set(
  (process.env.COURSE_ASSESSMENT_LEVELS || "B1,B2")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean)
);

const numberMeanings = new Map([
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

function findContentItem(value, itemId) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const match = findContentItem(item, itemId);
      if (match) return match;
    }
    return null;
  }
  if (!value || typeof value !== "object") return null;
  if (value.id === itemId || value.slug === itemId) return value;
  for (const item of Object.values(value)) {
    const match = findContentItem(item, itemId);
    if (match) return match;
  }
  return null;
}

function normalize(value) {
  return String(value || "").normalize("NFKC").trim().toLocaleLowerCase("mt");
}

function formLabel(item, requirement) {
  const expected = normalize(requirement);
  const keys = [
    ["imperativeSingular", "singular command"],
    ["imperativePlural", "plural command"],
    ["singular", "singular form"],
    ["plural", "plural form"]
  ];
  const keyed = keys.find(([key]) => normalize(item[key]) === expected);
  if (keyed) return keyed[1];

  const notes = [item.note, ...(Array.isArray(item.notes) ? item.notes : [])]
    .filter((value) => typeof value === "string");
  const note = notes.find((value) => normalize(value).includes(expected));
  if (note) {
    if (/female|feminine/i.test(note)) return "feminine form";
    if (/plural/i.test(note)) return "plural form";
    if (/male|masculine/i.test(note)) return "masculine form";
  }

  const primary = String(item.maltese || item.lemma || "").split("/").map(normalize).filter(Boolean);
  if (primary.length > 1 && primary.includes(expected)) {
    if (primary.indexOf(expected) === 0) return "masculine or base form";
    if (primary.indexOf(expected) === 1) return "feminine form";
    return "alternate form";
  }
  return "required form";
}

function targetMeaning(target) {
  const numberMeaning = numberMeanings.get(normalize(target.sourceRequirement));
  if (numberMeaning) return numberMeaning;
  const ref = target.contentRef;
  if (!ref || ref.file.endsWith(".html")) {
    throw new Error(`No assessment meaning for ${target.id}`);
  }
  const item = findContentItem(readJson(ref.file), ref.itemId);
  if (!item || typeof item.english !== "string" || !item.english.trim()) {
    throw new Error(`No English gloss for ${target.id} in ${ref.file}#${ref.itemId}`);
  }
  const label = formLabel(item, target.sourceRequirement);
  return label === "required form" ? item.english.trim() : `${item.english.trim()} (${label})`;
}

function rotate(values, offset) {
  return values.map((_, index) => values[(index + offset) % values.length]);
}

function buildSet(chapter, targets) {
  const entries = targets.map((target) => ({ target, meaning: targetMeaning(target) }));
  const meanings = [...new Set(entries.map((entry) => entry.meaning))];
  if (meanings.length < 3) throw new Error(`${chapter.id} needs at least three distinct meanings`);

  const items = entries.flatMap(({ target, meaning }, index) => {
    const distractors = rotate(meanings, index + 1).filter((value) => value !== meaning).slice(0, 2);
    const choices = rotate([meaning, ...distractors], index % 3);
    const reviewCard = { maltese: target.sourceRequirement, english: meaning };
    return [
      {
        id: `${target.id}-recognition`,
        type: "multiple-choice",
        assessmentMode: "recognition",
        targetIds: [target.id],
        prompt: `What is the lesson meaning of “${target.sourceRequirement}”?`,
        choices,
        answer: meaning,
        explanation: `${target.sourceRequirement} is linked to “${meaning}” in this chapter.`,
        reviewCard
      },
      {
        id: `${target.id}-production`,
        type: "fill-blank",
        assessmentMode: "production",
        targetIds: [target.id],
        prompt: `Write the Maltese ${target.type === "verb-form" ? "form" : "target"} for “${meaning}”.`,
        answer: target.sourceRequirement,
        accepted: [target.sourceRequirement],
        explanation: `The required chapter form is ${target.sourceRequirement}.`,
        reviewCard
      }
    ];
  });

  return {
    id: `${chapter.id}-target-check`,
    chapterId: chapter.id,
    level: chapter.id.startsWith("b1-") ? "B1" : "B2",
    kind: "target-coverage",
    title: `${chapter.title} Target Check`,
    passPercent: 75,
    items
  };
}

const chapters = course.levels.flatMap((level) => level.chapters);
const sets = chapters
  .filter((chapter) => requestedLevels.has(chapter.id.startsWith("b1-") ? "B1" : "B2"))
  .map((chapter) => {
    const targets = bindings.targets.filter((target) => (
      target.chapterId === chapter.id && target.implementationStatus === "implemented"
    ));
    return buildSet(chapter, targets);
  });

const output = {
  schemaVersion: 1,
  description: "Generated recognition and production checks for every implemented book-course target.",
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
  fs.writeFileSync(outputFile, serialized);
  console.log(`wrote ${sets.length} target assessment sets with ${sets.reduce((sum, set) => sum + set.items.length, 0)} items`);
}
