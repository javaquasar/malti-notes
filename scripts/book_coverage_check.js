const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const inventoryPath = path.join(root, "assets", "data", "book_coverage_inventory.json");
const bindingsPath = path.join(root, "assets", "data", "course_target_bindings.json");
const wordSearchBankPath = path.join(root, "assets", "js", "word-search-bank.js");
const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));

function listFiles(dir, predicate, files = []) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "generated") listFiles(absolute, predicate, files);
    if (entry.isFile() && predicate(absolute)) files.push(absolute);
  });
  return files;
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&apos;|&#39;|&#x27;/gi, "'")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function collectJsonStrings(value, strings = []) {
  if (typeof value === "string") strings.push(value);
  if (Array.isArray(value)) value.forEach((item) => collectJsonStrings(item, strings));
  if (value && typeof value === "object" && !Array.isArray(value)) {
    Object.values(value).forEach((item) => collectJsonStrings(item, strings));
  }
  return strings;
}

function htmlVariants(raw) {
  const content = raw
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, " ");
  const splitNumberWords = [...content.matchAll(/<span\b[^>]*class=["'][^"']*\bnum-word\b[^"']*["'][^>]*>([\s\S]*?)<\/span>\s*<\/li>/gi)]
    .map((match) => match[1].replace(/<[^>]+>/g, ""))
    .join(" ");
  return [
    decodeHtml(content.replace(/<[^>]+>/g, " ")),
    decodeHtml(content.replace(/<[^>]+>/g, "")),
    decodeHtml(splitNumberWords)
  ];
}

function tokenize(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase("mt")
    .replace(/[\u2018\u2019\u00b4]/g, "'")
    .match(/[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*/gu) || [];
}

function foldToken(token) {
  return token
    .replace(/għ/g, "gh")
    .replace(/ċ/g, "c")
    .replace(/ġ/g, "g")
    .replace(/ħ/g, "h")
    .replace(/ż/g, "z")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function makeDocument(value) {
  const exact = tokenize(value);
  return {
    exact,
    folded: exact.map(foldToken)
  };
}

function loadCorpus() {
  const documents = [];
  fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => path.join(root, entry.name))
    .sort()
    .forEach((file) => htmlVariants(fs.readFileSync(file, "utf8")).forEach((value) => documents.push(makeDocument(value))));

  const dataRoot = path.join(root, "assets", "data");
  listFiles(dataRoot, (file) => (
    file.endsWith(".json") &&
    path.resolve(file) !== path.resolve(inventoryPath) &&
    path.resolve(file) !== path.resolve(bindingsPath)
  ))
    .sort()
    .forEach((file) => {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      documents.push(makeDocument(collectJsonStrings(data).join(" bookcoverageboundary ")));
    });

  if (fs.existsSync(wordSearchBankPath)) {
    documents.push(makeDocument(fs.readFileSync(wordSearchBankPath, "utf8")));
  }
  const exactTokens = new Set();
  const foldedTokens = new Set();
  const exactDocuments = [];
  const foldedDocuments = [];
  documents.forEach((document) => {
    document.exact.forEach((token) => exactTokens.add(token));
    document.folded.forEach((token) => foldedTokens.add(token));
    exactDocuments.push(`\u0001${document.exact.join("\u0001")}\u0001`);
    foldedDocuments.push(`\u0001${document.folded.join("\u0001")}\u0001`);
  });
  return {
    exactTokens,
    foldedTokens,
    exactText: exactDocuments.join("\u0002"),
    foldedText: foldedDocuments.join("\u0002")
  };
}

const corpus = loadCorpus();

function isCovered(target) {
  const exactTokens = tokenize(target);
  const foldedTokens = exactTokens.map(foldToken);
  if (exactTokens.length === 1) {
    return corpus.exactTokens.has(exactTokens[0]) || corpus.foldedTokens.has(foldedTokens[0]);
  }
  const exactNeedle = `\u0001${exactTokens.join("\u0001")}\u0001`;
  const foldedNeedle = `\u0001${foldedTokens.join("\u0001")}\u0001`;
  return corpus.exactText.includes(exactNeedle) || corpus.foldedText.includes(foldedNeedle);
}

function uniqueByLevel(items, valueKey) {
  return ["B1", "B2"].reduce((levels, book) => {
    levels[book] = [...new Set(items.filter((item) => item.book === book).flatMap((item) => item[valueKey]))];
    return levels;
  }, {});
}

function baselineMissingByLevel(items) {
  return ["B1", "B2"].reduce((levels, book) => {
    levels[book] = new Set(items.filter((item) => item.book === book).flatMap((item) => item.baselineMissing));
    return levels;
  }, {});
}

function evaluate(kind, items, valueKey) {
  const targetsByLevel = uniqueByLevel(items, valueKey);
  const knownMissingByLevel = baselineMissingByLevel(items);
  const result = { kind, levels: {}, regressions: [], improvements: [] };

  ["B1", "B2"].forEach((book) => {
    const targets = targetsByLevel[book];
    const currentMissing = targets.filter((target) => !isCovered(target));
    const currentMissingSet = new Set(currentMissing);
    const knownMissing = knownMissingByLevel[book];
    const regressions = currentMissing.filter((target) => !knownMissing.has(target));
    const improvements = [...knownMissing].filter((target) => targets.includes(target) && !currentMissingSet.has(target));

    result.levels[book] = {
      required: targets.length,
      covered: targets.length - currentMissing.length,
      missing: currentMissing.length,
      coveragePercent: Number((((targets.length - currentMissing.length) / targets.length) * 100).toFixed(1)),
      currentMissing
    };
    result.regressions.push(...regressions.map((target) => `${book}: ${target}`));
    result.improvements.push(...improvements.map((target) => `${book}: ${target}`));
  });

  return result;
}

function combinedVocabulary(chapters) {
  const targets = [...new Set(chapters.flatMap((chapter) => chapter.targets))];
  const missing = targets.filter((target) => !isCovered(target));
  return {
    required: targets.length,
    covered: targets.length - missing.length,
    missing: missing.length,
    coveragePercent: Number((((targets.length - missing.length) / targets.length) * 100).toFixed(1))
  };
}

function validateInventory() {
  const errors = [];
  const chapterIds = new Set();
  const coursePath = JSON.parse(fs.readFileSync(path.join(root, "assets", "data", "course_path.json"), "utf8"));
  const courseChapterIds = new Set(coursePath.levels.flatMap((level) => level.chapters.map((chapter) => chapter.id)));
  inventory.chapters.forEach((chapter) => {
    if (chapterIds.has(chapter.id)) errors.push(`duplicate chapter id ${chapter.id}`);
    chapterIds.add(chapter.id);
    if (!courseChapterIds.has(chapter.courseChapterId)) errors.push(`${chapter.id}: missing course chapter ${chapter.courseChapterId}`);
    chapter.baselineMissing.forEach((target) => {
      if (!chapter.targets.includes(target)) errors.push(`${chapter.id}: baseline missing target is not required: ${target}`);
    });
  });
  inventory.verbParadigms.forEach((paradigm) => {
    paradigm.baselineMissing.forEach((form) => {
      if (!paradigm.forms.includes(form)) errors.push(`${paradigm.id}: baseline missing form is not required: ${form}`);
    });
  });
  if (inventory.chapters.length !== 14) errors.push(`expected 14 chapters, found ${inventory.chapters.length}`);

  const vocabularyTargets = uniqueByLevel(inventory.chapters, "targets");
  const vocabularyMissing = baselineMissingByLevel(inventory.chapters);
  ["B1", "B2"].forEach((book) => {
    const expected = inventory.baseline.vocabulary[book];
    const actualRequired = vocabularyTargets[book].length;
    const actualMissing = vocabularyMissing[book].size;
    if (actualRequired !== expected.requiredUnique) {
      errors.push(`${book}: frozen vocabulary requires ${expected.requiredUnique} unique targets, inventory has ${actualRequired}`);
    }
    if (actualMissing !== expected.missingUnique) {
      errors.push(`${book}: frozen vocabulary has ${expected.missingUnique} missing targets, inventory has ${actualMissing}`);
    }
    if (actualRequired - actualMissing !== expected.coveredUnique) {
      errors.push(`${book}: frozen vocabulary coverage does not match inventory targets`);
    }
  });

  const allVocabularyTargets = new Set(inventory.chapters.flatMap((chapter) => chapter.targets));
  const allVocabularyMissing = new Set(inventory.chapters.flatMap((chapter) => chapter.baselineMissing));
  const combinedBaseline = inventory.baseline.vocabulary.combined;
  if (allVocabularyTargets.size !== combinedBaseline.requiredUnique ||
      allVocabularyMissing.size !== combinedBaseline.missingUnique ||
      allVocabularyTargets.size - allVocabularyMissing.size !== combinedBaseline.coveredUnique) {
    errors.push("combined frozen vocabulary baseline does not match inventory targets");
  }

  const verbTargets = uniqueByLevel(inventory.verbParadigms, "forms");
  ["B1", "B2"].forEach((book) => {
    if (verbTargets[book].length !== inventory.baseline.verbForms[book].required) {
      errors.push(`${book}: verb-form requirement count does not match the frozen baseline`);
    }
  });
  if (inventory.sources.length !== 4 || inventory.sources.some((source) => !/^[A-F0-9]{64}$/.test(source.sha256))) {
    errors.push("expected four source records with uppercase SHA-256 hashes");
  }
  return errors;
}

const inventoryErrors = validateInventory();
const vocabulary = evaluate("vocabulary", inventory.chapters, "targets");
const verbForms = evaluate("verb forms", inventory.verbParadigms, "forms");
const combined = combinedVocabulary(inventory.chapters);
const regressions = [...vocabulary.regressions, ...verbForms.regressions];
const jsonMode = process.argv.includes("--json");

if (jsonMode) {
  console.log(JSON.stringify({ auditedAt: inventory.auditedAt, vocabulary, combinedVocabulary: combined, verbForms, inventoryErrors }, null, 2));
} else {
  const frozen = inventory.baseline.vocabulary;
  console.log(`Book coverage snapshot (inventory audited ${inventory.auditedAt})`);
  console.log(`Frozen vocabulary baseline: B1 ${frozen.B1.coveredUnique}/${frozen.B1.requiredUnique}, B2 ${frozen.B2.coveredUnique}/${frozen.B2.requiredUnique}, combined ${frozen.combined.coveredUnique}/${frozen.combined.requiredUnique}`);
  [vocabulary, verbForms].forEach((section) => {
    console.log(`\nCurrent ${section.kind} regression scan:`);
    ["B1", "B2"].forEach((book) => {
      const level = section.levels[book];
      console.log(`  ${book}: ${level.covered}/${level.required} covered (${level.coveragePercent}%), ${level.missing} missing`);
    });
  });
  console.log(`  vocabulary combined: ${combined.covered}/${combined.required} covered (${combined.coveragePercent}%), ${combined.missing} missing`);
  if (vocabulary.improvements.length || verbForms.improvements.length) {
    console.log(`\nImprovements since baseline: ${vocabulary.improvements.length} vocabulary target(s), ${verbForms.improvements.length} verb-form watch item(s)`);
  }
}

if (inventoryErrors.length || regressions.length) {
  inventoryErrors.forEach((error) => console.error(`fail inventory: ${error}`));
  regressions.forEach((target) => console.error(`fail coverage regression: ${target}`));
  process.exit(1);
}

if (!jsonMode) console.log("\nok no book coverage regressions");
