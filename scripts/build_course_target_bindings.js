const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const bindingFile = path.join(root, "assets/data/course_target_bindings.json");
const inventory = readJson("assets/data/book_coverage_inventory.json");
const course = readJson("assets/data/course_path.json");
const exerciseSources = [
  readJson("assets/data/course_exercises.json"),
  readOptionalJson("assets/data/course_target_assessments.json", { sets: [] })
];
const supplementalContent = readOptionalJson("assets/data/course_supplemental_content.json", { chapters: [] });
const supplementalIds = new Set(
  (supplementalContent.chapters || []).flatMap((chapter) => (chapter.items || []).map((item) => item.id))
);
const assessmentIds = new Map();

exerciseSources.flatMap((source) => source.sets || []).forEach((set) => set.items.forEach((item) => {
  (item.targetIds || []).forEach((targetId) => {
    const ids = assessmentIds.get(targetId) || [];
    ids.push(item.id);
    assessmentIds.set(targetId, ids);
  });
}));

const contentAliases = new Map([
  ["b2-town::ispiżerija", "spiżerija"]
]);

const staticContent = new Map([
  ...["wieħed", "tnejn", "tlieta", "erbgħa", "ħamsa", "sitta", "sebgħa", "tmienja", "disgħa", "għaxra"]
    .map((requirement, index) => [
      `b2-imperative::${requirement}`,
      { page: "numbers_calendar_time.html", file: "numbers_calendar_time.html", itemId: `cardinal-${index + 1}` }
    ]),
  ...["ħdax", "tnax", "tlettax", "erbatax", "ħmistax", "sittax", "sbatax", "tmintax", "dsatax", "għoxrin"]
    .map((requirement, index) => [
      `b2-clothes::${requirement}`,
      { page: "numbers_calendar_time.html", file: "numbers_calendar_time.html", itemId: `cardinal-${index + 11}` }
    ])
]);
const cardinalNumbers = new Set([
  "wieħed", "tnejn", "tlieta", "erbgħa", "ħamsa", "sitta", "sebgħa", "tmienja", "disgħa", "għaxra",
  "ħdax", "tnax", "tlettax", "erbatax", "ħmistax", "sittax", "sbatax", "tmintax", "dsatax", "għoxrin"
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function readOptionalJson(file, fallback) {
  const absolute = path.join(root, file);
  return fs.existsSync(absolute) ? JSON.parse(fs.readFileSync(absolute, "utf8")) : fallback;
}

function normalize(value) {
  return (String(value || "").toLocaleLowerCase("mt").normalize("NFC").match(/[\p{L}\p{N}]+/gu) || []).join(" ");
}

function slugify(value) {
  return normalize(value).normalize("NFD").replace(/\p{M}/gu, "")
    .replaceAll("għ", "gh")
    .replaceAll("ħ", "h")
    .replaceAll("ġ", "g")
    .replaceAll("ċ", "c")
    .replaceAll("ż", "z")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function itemStrings(item) {
  const primaryKeys = [
    "maltese",
    "lemma",
    "imperativeSingular",
    "imperativePlural",
    "singular",
    "plural",
    "command",
    "label"
  ];
  const primary = primaryKeys.filter((key) => typeof item[key] === "string").map((key) => item[key]);
  const notes = [item.note, ...(Array.isArray(item.notes) ? item.notes : [])]
    .filter((value) => typeof value === "string");
  return { primary, notes };
}

function itemScore(item, sourceRequirement) {
  const expected = normalize(sourceRequirement);
  const { primary, notes } = itemStrings(item);
  const score = (value, exact, contained) => {
    const candidate = normalize(value);
    if (candidate === expected) return exact;
    return ` ${candidate} `.includes(` ${expected} `) ? contained : 0;
  };
  return Math.max(
    0,
    ...primary.map((value) => score(value, 100, 80)),
    ...notes.map((value) => score(value, 70, 60))
  );
}

function pageDataFiles(page) {
  const html = fs.readFileSync(path.join(root, page.href), "utf8");
  const files = [];
  const pattern = /dataUrl:\s*["']\.\/(assets\/data\/[^"']+\.json)["']/g;
  let match;
  while ((match = pattern.exec(html))) {
    if (!match[1].includes("_examples") && !files.includes(match[1])) files.push(match[1]);
  }
  return files;
}

function contentItems(file) {
  const data = readJson(file);
  return (data.groups || []).flatMap((group) => (group.items || []).flatMap((item) => {
    const itemId = item.id || item.slug;
    return itemId ? [{ item, itemId }] : [];
  }));
}

function chapterCandidates(chapter) {
  return chapter.pages.flatMap((page, pageIndex) => pageDataFiles(page).flatMap((file, fileIndex) => (
    contentItems(file).map(({ item, itemId }, itemIndex) => ({
      page: page.href,
      file,
      item,
      itemId,
      order: pageIndex * 100000 + fileIndex * 10000 + itemIndex
    }))
  )));
}

function targetType(chapterId, requirement) {
  if (cardinalNumbers.has(requirement)) return "vocabulary";
  if (chapterId === "b2-imperative" || chapterId === "b2-hobbies") return requirement.includes(" ") ? "phrase" : "verb-form";
  if (chapterId === "b2-recycling" && /^(armi|armu|għażel|agħżel|agħżlu|waddab|waddbu|issepara|isseparaw|ħareġ|oħroġ|oħorġu)$/.test(requirement)) {
    return "verb-form";
  }
  return requirement.includes(" ") ? "phrase" : "vocabulary";
}

function buildTarget(inventoryChapter, candidates, requirement) {
  const key = `${inventoryChapter.courseChapterId}::${requirement}`;
  const targetId = `${inventoryChapter.courseChapterId}-${slugify(requirement)}`;
  const isMissing = inventoryChapter.baselineMissing.includes(requirement);
  const staticRef = staticContent.get(key);
  const lookup = contentAliases.get(key) || requirement;
  const match = isMissing || staticRef ? null : candidates
    .map((candidate) => ({ ...candidate, score: itemScore(candidate.item, lookup) }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)[0];
  const contentRef = staticRef || (match ? {
    page: match.page,
    file: match.file,
    itemId: match.itemId
  } : (supplementalIds.has(targetId) ? {
    page: "course_chapter.html",
    file: "assets/data/course_supplemental_content.json",
    itemId: targetId
  } : null));

  return {
    id: targetId,
    book: inventoryChapter.book,
    chapterId: inventoryChapter.courseChapterId,
    type: targetType(inventoryChapter.courseChapterId, requirement),
    sourceRequirement: requirement,
    role: "core",
    implementationStatus: contentRef ? "implemented" : (isMissing ? "missing" : "evidence-only"),
    contentRef,
    assessmentIds: assessmentIds.get(targetId) || []
  };
}

const courseChapters = new Map(course.levels.flatMap((level) => level.chapters).map((chapter) => [chapter.id, chapter]));
const targets = inventory.chapters.flatMap((inventoryChapter) => {
  const chapter = courseChapters.get(inventoryChapter.courseChapterId);
  if (!chapter) throw new Error(`Missing course chapter: ${inventoryChapter.courseChapterId}`);
  const candidates = chapterCandidates(chapter);
  return inventoryChapter.targets.map((requirement) => buildTarget(inventoryChapter, candidates, requirement));
});
const output = {
  schemaVersion: 2,
  description: "Audited runtime bindings between all B1/B2 book requirements, canonical site content, and assessments.",
  fullyAuditedChapterIds: inventory.chapters.map((chapter) => chapter.courseChapterId),
  targets
};
const serialized = `${JSON.stringify(output, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = fs.existsSync(bindingFile) ? fs.readFileSync(bindingFile, "utf8") : "";
  if (current !== serialized) {
    console.error("fail assets/data/course_target_bindings.json is not synchronized; run npm run course:bindings:build");
    process.exit(1);
  }
  console.log(`ok checked ${targets.length} generated course target bindings`);
} else {
  fs.writeFileSync(bindingFile, serialized);
  const counts = targets.reduce((summary, target) => {
    summary[target.implementationStatus] += 1;
    return summary;
  }, { implemented: 0, "evidence-only": 0, missing: 0 });
  console.log(`wrote ${targets.length} course target bindings`, counts);
}
