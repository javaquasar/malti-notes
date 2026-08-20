const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputFile = path.join(root, "assets/data/comprehensive_test_bank.json");
const checkOnly = process.argv.includes("--check");
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const bindings = read("assets/data/course_target_bindings.json");
const assessments = read("assets/data/course_target_assessments.json");
const grammar = read("assets/data/grammar_targets.json");
const verbs = read("assets/data/course_verb_paradigms.json");
const course = read("assets/data/course_path.json");

const excludedDataFiles = new Set([
  "book_coverage_inventory.json",
  "comprehensive_test_bank.json",
  "course_exercises.json",
  "course_milestone_assessments.json",
  "course_path.json",
  "course_source_provenance.json",
  "course_supplemental_content.json",
  "course_target_assessments.json",
  "course_target_bindings.json",
  "course_target_examples.json",
  "course_target_glosses.json",
  "course_verb_paradigms.json",
  "grammar_targets.json",
  "search-index.json",
  "site-map.json",
  "year4_revision_vocabulary.json"
]);
const pageOverrides = {
  colors: "colors_maltese.html",
  food: "food_preferences.html",
  transport: "transport_travel.html",
  year4_vocabulary: "year4_exam.html"
};
const categoryOrder = ["grammar", "pronouns", "verbs", "numbers-time", "adjectives", "vocabulary"];
const chapters = new Map(course.levels.flatMap((level) => level.chapters).map((chapter) => [chapter.id, chapter]));

function normalize(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("mt")
    .replace(/[\u2018\u2019\u00b4`]/g, "'")
    .replace(/\s+/g, " ");
}

function slugify(value) {
  return normalize(value)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replaceAll("għ", "gh")
    .replaceAll("ħ", "h")
    .replaceAll("ġ", "g")
    .replaceAll("ċ", "c")
    .replaceAll("ż", "z")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function hash(value) {
  return Array.from(value).reduce((total, character) => Math.imul(total ^ character.charCodeAt(0), 16777619) >>> 0, 2166136261);
}

function pageFor(fileName, data) {
  if (data.page && fs.existsSync(path.join(root, data.page))) return data.page;
  const stem = fileName.replace(/\.json$/, "");
  const page = pageOverrides[stem] || `${stem}.html`;
  return fs.existsSync(path.join(root, page)) ? page : null;
}

function categoryFor({ fileName = "", group = {}, page = "", type = "", value = "" }) {
  const context = normalize([fileName, group.id, group.title, group.sectionTitle, page, value].join(" "));
  if (type === "grammar") return "grammar";
  if (type === "verb-form" || /(?:modal|routine|hobby|verb|action)/.test(context)) return "verbs";
  if (/pronoun|possessive|demonstrative/.test(context)) return "pronouns";
  if (/number|calendar|weekday|month|season|clock|time|ordinal|cardinal/.test(context)) return "numbers-time";
  if (/(?:adjective|colour|color|comparison|appearance|emotion|qualit|shopping-colours|shopping-sizes)/.test(context)) return "adjectives";
  return "vocabulary";
}

function sourceAssessments(targetId) {
  const candidates = assessments.sets
    .filter((set) => set.kind === "checkpoint")
    .flatMap((set) => set.items)
    .filter((item) => item.type !== "matching" && (item.targetIds || []).includes(targetId));
  return Object.fromEntries(["recognition", "production"].map((mode) => {
    const item = candidates.find((candidate) => candidate.assessmentMode === mode);
    if (!item) throw new Error(`${targetId} has no ${mode} assessment`);
    return [mode, item];
  }));
}

function coverageItem(source, target, mode) {
  return {
    ...source,
    id: `coverage-${slugify(target.id)}-${mode}`,
    assessmentMode: mode,
    coverageIds: [target.id],
    category: target.category,
    ruleId: target.category === "grammar" ? target.id : "",
    sourcePage: target.sourcePage
  };
}

function canonicalEntries() {
  return fs.readdirSync(path.join(root, "assets/data"))
    .filter((fileName) => fileName.endsWith(".json") && !fileName.endsWith("_examples.json") && !excludedDataFiles.has(fileName))
    .sort()
    .flatMap((fileName) => {
      const data = read(`assets/data/${fileName}`);
      const page = pageFor(fileName, data);
      if (!page || !Array.isArray(data.groups)) return [];
      return data.groups.flatMap((group, groupIndex) => (group.items || []).flatMap((item, itemIndex) => {
        const maltese = typeof item.maltese === "string" ? item.maltese.trim() : "";
        const english = typeof (item.english || item.translation) === "string" ? (item.english || item.translation).trim() : "";
        if (!maltese || !english) return [];
        return [{
          fileName,
          page,
          topic: group.title || group.sectionTitle || data.topic || fileName.replace(/\.json$/, ""),
          group,
          sourceId: item.id || item.slug || `${groupIndex + 1}-${itemIndex + 1}`,
          maltese,
          english,
          example: item.example || ""
        }];
      }));
    });
}

const targets = [];
const seenPairs = new Set();

bindings.targets.filter((target) => target.type !== "grammar").forEach((binding) => {
  const source = sourceAssessments(binding.id);
  const maltese = binding.sourceRequirement;
  const english = source.recognition.reviewCard?.english || source.production.reviewCard?.english || binding.sourceRequirement;
  const category = categoryFor({ page: binding.contentRef?.page, type: binding.type, value: binding.sourceRequirement });
  const target = {
    id: binding.id,
    level: binding.book,
    category,
    kind: binding.type,
    topic: chapters.get(binding.chapterId)?.title || binding.chapterId,
    title: maltese,
    maltese,
    english,
    sourceKind: "book-course",
    sourcePage: binding.contentRef?.page || "course_chapter.html"
  };
  target.items = {
    recognition: coverageItem(source.recognition, target, "recognition"),
    production: coverageItem(source.production, target, "production")
  };
  targets.push(target);
  seenPairs.add(`${normalize(maltese)}::${normalize(english)}`);
});

grammar.targets.forEach((grammarTarget) => {
  const target = {
    id: grammarTarget.id,
    level: grammarTarget.book,
    category: "grammar",
    kind: "grammar",
    topic: grammarTarget.title,
    title: grammarTarget.title,
    maltese: grammarTarget.pattern,
    english: grammarTarget.summary,
    sourceKind: grammarTarget.sourceRef.kind,
    sourcePage: grammar.page
  };
  target.items = Object.fromEntries(["recognition", "production"].map((mode) => [
    mode,
    coverageItem({
      ...grammarTarget.assessment[mode],
      targetIds: [grammarTarget.id],
      reviewCard: {
        maltese: grammarTarget.pattern,
        english: grammarTarget.summary,
        example: grammarTarget.examples[0].maltese
      }
    }, target, mode)
  ]));
  targets.push(target);
});

const allVerbForms = verbs.paradigms.flatMap((paradigm) => paradigm.forms.map((form) => ({ paradigm, form })));
allVerbForms.forEach(({ paradigm, form }) => {
  const target = {
    id: `verb-${form.id}`,
    level: paradigm.book,
    category: "verbs",
    kind: "verb-form",
    topic: `${paradigm.lemma} / ${form.mode}`,
    title: form.form,
    maltese: form.form,
    english: form.englishPrompt,
    sourceKind: "verb-paradigm",
    sourcePage: "verbs_guide.html"
  };
  const sameParadigm = paradigm.forms.map((candidate) => candidate.form).filter((candidate) => normalize(candidate) !== normalize(form.form));
  const fallback = allVerbForms.map(({ form: candidate }) => candidate.form).filter((candidate) => normalize(candidate) !== normalize(form.form));
  const distractors = [...new Set([...sameParadigm, ...fallback])].slice(0, 2);
  target.items = {
    recognition: coverageItem({
      type: "multiple-choice",
      prompt: `Which Maltese form means "${form.englishPrompt}" for ${paradigm.lemma}?`,
      choices: [form.form, ...distractors],
      answer: form.form,
      explanation: `${form.form} is the ${form.person} ${form.mode} form in this paradigm.`,
      targetIds: [],
      reviewCard: { maltese: form.form, english: form.englishPrompt }
    }, target, "recognition"),
    production: coverageItem({
      type: "fill-blank",
      prompt: `Write the Maltese form for "${form.englishPrompt}" (${paradigm.lemma}).`,
      answer: form.form,
      accepted: [form.form],
      explanation: `${form.form} is the ${form.person} ${form.mode} form.`,
      targetIds: [],
      reviewCard: { maltese: form.form, english: form.englishPrompt }
    }, target, "production")
  };
  targets.push(target);
});

const siteTargets = canonicalEntries().flatMap((entry) => {
  const pairKey = `${normalize(entry.maltese)}::${normalize(entry.english)}`;
  if (seenPairs.has(pairKey)) return [];
  seenPairs.add(pairKey);
  const category = categoryFor(entry);
  return [{
    id: `site-${slugify(entry.fileName.replace(/\.json$/, ""))}-${slugify(entry.group.id || entry.topic)}-${slugify(entry.sourceId)}`,
    level: "Site",
    category,
    kind: entry.maltese.includes(" ") ? "phrase" : "vocabulary",
    topic: entry.topic,
    title: entry.maltese,
    maltese: entry.maltese,
    english: entry.english,
    sourceKind: "site-bank",
    sourcePage: entry.page,
    example: entry.example
  }];
});

const lexicalPool = [...targets, ...siteTargets].filter((target) => target.category !== "grammar");
siteTargets.forEach((target) => {
  const preferred = lexicalPool.filter((candidate) => (
    candidate.id !== target.id
    && candidate.category === target.category
    && normalize(candidate.english) !== normalize(target.english)
    && normalize(candidate.maltese) !== normalize(target.maltese)
  ));
  const fallback = lexicalPool.filter((candidate) => (
    candidate.id !== target.id
    && normalize(candidate.english) !== normalize(target.english)
    && normalize(candidate.maltese) !== normalize(target.maltese)
  ));
  const pool = [...preferred, ...fallback];
  const offset = pool.length ? hash(target.id) % pool.length : 0;
  const distractors = [];
  for (let index = 0; index < pool.length && distractors.length < 2; index += 1) {
    const value = pool[(offset + index) % pool.length].maltese;
    if (!distractors.some((candidate) => normalize(candidate) === normalize(value))) distractors.push(value);
  }
  if (distractors.length < 2) throw new Error(`${target.id} has too few recognition distractors`);
  target.items = {
    recognition: coverageItem({
      type: "multiple-choice",
      prompt: `Which Maltese item means "${target.english}"?`,
      choices: [target.maltese, ...distractors],
      answer: target.maltese,
      explanation: `${target.maltese} means "${target.english}".`,
      targetIds: [],
      reviewCard: { maltese: target.maltese, english: target.english, example: target.example }
    }, target, "recognition"),
    production: coverageItem({
      type: "fill-blank",
      prompt: `Write the Maltese for "${target.english}".`,
      answer: target.maltese,
      accepted: [target.maltese],
      explanation: `The Maltese answer is ${target.maltese}.`,
      targetIds: [],
      reviewCard: { maltese: target.maltese, english: target.english, example: target.example }
    }, target, "production")
  };
  delete target.example;
  targets.push(target);
});

const uniqueTargets = [];
const targetByPair = new Map();
targets.forEach((target) => {
  const pairKey = `${normalize(target.maltese)}::${normalize(target.english)}`;
  const existing = targetByPair.get(pairKey);
  if (!existing) {
    targetByPair.set(pairKey, target);
    uniqueTargets.push(target);
    return;
  }
  ["recognition", "production"].forEach((mode) => {
    existing.items[mode].targetIds = [...new Set([
      ...(existing.items[mode].targetIds || []),
      ...(target.items[mode].targetIds || [])
    ])];
  });
});
targets.splice(0, targets.length, ...uniqueTargets);

targets.sort((left, right) => (
  categoryOrder.indexOf(left.category) - categoryOrder.indexOf(right.category)
  || left.topic.localeCompare(right.topic, "en")
  || left.id.localeCompare(right.id, "en")
));

const countBy = (key) => Object.fromEntries([...new Set(targets.map((target) => target[key]))]
  .sort((left, right) => String(left).localeCompare(String(right)))
  .map((value) => [value, targets.filter((target) => target[key] === value).length]));
const output = {
  schemaVersion: 1,
  generatedFrom: [
    "assets/data/course_target_bindings.json",
    "assets/data/course_target_assessments.json",
    "assets/data/grammar_targets.json",
    "assets/data/course_verb_paradigms.json",
    "canonical assets/data topic banks"
  ],
  description: "Generated unique coverage bank with recognition and production for book targets, grammar, verb paradigms, and canonical site vocabulary.",
  targetCount: targets.length,
  modeCount: targets.length * 2,
  categoryCounts: countBy("category"),
  levelCounts: countBy("level"),
  sourceCounts: countBy("sourceKind"),
  targets
};
const serialized = `${JSON.stringify(output, null, 2)}\n`;

function validate() {
  const ids = new Set();
  const itemIds = new Set();
  const pairs = new Set();
  targets.forEach((target) => {
    if (ids.has(target.id)) throw new Error(`Duplicate coverage target: ${target.id}`);
    ids.add(target.id);
    const pairKey = `${normalize(target.maltese)}::${normalize(target.english)}`;
    if (pairs.has(pairKey)) throw new Error(`Duplicate coverage pair: ${target.maltese} / ${target.english}`);
    pairs.add(pairKey);
    ["recognition", "production"].forEach((mode) => {
      const item = target.items[mode];
      if (!item || item.assessmentMode !== mode || !item.coverageIds.includes(target.id)) throw new Error(`${target.id} has invalid ${mode} coverage`);
      if (itemIds.has(item.id)) throw new Error(`Duplicate coverage item: ${item.id}`);
      itemIds.add(item.id);
    });
  });
  const minimums = { grammar: 8, pronouns: 30, verbs: 125, "numbers-time": 50, adjectives: 30, vocabulary: 500 };
  Object.entries(minimums).forEach(([category, minimum]) => {
    if ((output.categoryCounts[category] || 0) < minimum) throw new Error(`${category} coverage is below ${minimum}`);
  });
}

validate();
if (checkOnly) {
  const current = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, "utf8") : "";
  if (current !== serialized) {
    console.error("fail comprehensive test bank is stale; run npm run coverage:build");
    process.exit(1);
  }
  console.log(`ok checked ${targets.length} comprehensive targets across ${categoryOrder.length} categories`);
} else {
  fs.writeFileSync(outputFile, serialized, "utf8");
  console.log(`wrote ${targets.length} comprehensive targets`, output.categoryCounts);
}
