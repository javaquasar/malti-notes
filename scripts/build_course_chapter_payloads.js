const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputRoot = path.join(root, "assets", "data", "course");
const chapterRoot = path.join(outputRoot, "chapters");
const manifestPath = path.join(outputRoot, "manifest.json");
const checkOnly = process.argv.includes("--check");
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));

const course = read("assets/data/course_path.json");
const courseExercises = read("assets/data/course_exercises.json");
const inventory = read("assets/data/book_coverage_inventory.json");
const bindings = read("assets/data/course_target_bindings.json");
const assessments = read("assets/data/course_target_assessments.json");
const supplements = read("assets/data/course_supplemental_content.json");
const provenance = read("assets/data/course_source_provenance.json");

const inventoryByChapter = new Map(inventory.chapters.map((chapter) => [chapter.courseChapterId, chapter]));
const supplementsByChapter = new Map(supplements.chapters.map((chapter) => [chapter.id, chapter]));
const sourceChapters = new Map(provenance.chapters.map((chapter) => [chapter.chapterId, chapter]));
const expectedFiles = new Map();
const manifestChapters = [];

function assessmentIdsByTarget(sets) {
  const ids = new Map();
  sets.forEach((set) => (set.items || []).forEach((item) => (item.targetIds || []).forEach((targetId) => {
    const targetIds = ids.get(targetId) || [];
    if (!targetIds.includes(item.id)) targetIds.push(item.id);
    ids.set(targetId, targetIds);
  })));
  return ids;
}

course.levels.forEach((level) => level.chapters.forEach((chapter) => {
  const assessmentSets = assessments.sets.filter((set) => set.chapterId === chapter.id);
  const linkedAssessmentSets = [
    ...courseExercises.sets.filter((set) => set.chapterId === chapter.id),
    ...assessmentSets,
  ];
  const assessmentIndex = assessmentIdsByTarget(linkedAssessmentSets);
  const chapterTargets = bindings.targets
    .filter((target) => target.chapterId === chapter.id)
    .map((target) => ({ ...target, assessmentIds: assessmentIndex.get(target.id) || [] }));
  const sourceChapter = sourceChapters.get(chapter.id);
  const targetSources = Object.fromEntries(chapterTargets.map((target) => [target.id, provenance.targets[target.id]]));
  const payload = {
    schemaVersion: 1,
    chapter: {
      id: chapter.id,
      levelId: level.id,
      levelLabel: level.label,
      number: chapter.number,
      title: chapter.title
    },
    inventoryChapter: inventoryByChapter.get(chapter.id),
    sourceChapter,
    targets: chapterTargets,
    targetSources,
    supplementalItems: supplementsByChapter.get(chapter.id)?.items || [],
    assessmentSets
  };
  const serialized = `${JSON.stringify(payload, null, 2)}\n`;
  const fileName = `${chapter.id}.json`;
  expectedFiles.set(fileName, serialized);

  const diagnostic = assessmentSets.find((set) => set.kind === "diagnostic");
  const checkpoints = assessmentSets.filter((set) => set.kind === "checkpoint").sort((a, b) => a.sequence - b.sequence);
  manifestChapters.push({
    id: chapter.id,
    levelId: level.id,
    levelLabel: level.label,
    number: chapter.number,
    title: chapter.title,
    file: `./assets/data/course/chapters/${fileName}`,
    bytes: Buffer.byteLength(serialized),
    targetIds: chapterTargets.filter((target) => target.implementationStatus === "implemented").map((target) => target.id),
    implementedCount: chapterTargets.filter((target) => target.implementationStatus === "implemented").length,
    pageHrefs: [...new Set(chapterTargets
      .filter((target) => target.implementationStatus === "implemented" && target.contentRef?.page)
      .map((target) => target.contentRef.page))],
    diagnostic: diagnostic ? { id: diagnostic.id, itemCount: diagnostic.items.length } : null,
    checkpoints: checkpoints.map((set) => ({ id: set.id, sequence: set.sequence, targetCount: set.targetCount, itemCount: set.items.length })),
    source: sourceChapter ? { book: sourceChapter.book, pageStart: sourceChapter.pageStart, pageEnd: sourceChapter.pageEnd } : null
  });
}));

const manifest = {
  schemaVersion: 1,
  description: "Runtime index for lazy-loaded book-course chapter payloads.",
  chapterCount: manifestChapters.length,
  targetCount: manifestChapters.reduce((total, chapter) => total + chapter.targetIds.length, 0),
  chapters: manifestChapters
};
const serializedManifest = `${JSON.stringify(manifest, null, 2)}\n`;

if (checkOnly) {
  const errors = [];
  if (!fs.existsSync(manifestPath) || fs.readFileSync(manifestPath, "utf8") !== serializedManifest) errors.push("manifest.json is stale");
  expectedFiles.forEach((serialized, fileName) => {
    const file = path.join(chapterRoot, fileName);
    if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== serialized) errors.push(`${fileName} is stale`);
  });
  const actualFiles = fs.existsSync(chapterRoot) ? fs.readdirSync(chapterRoot).filter((file) => file.endsWith(".json")) : [];
  actualFiles.filter((file) => !expectedFiles.has(file)).forEach((file) => errors.push(`${file} is unexpected`));
  if (errors.length) {
    errors.forEach((error) => console.error(`fail course payload: ${error}`));
    process.exit(1);
  }
  console.log(`ok checked ${expectedFiles.size} lazy chapter payloads`);
} else {
  fs.mkdirSync(chapterRoot, { recursive: true });
  expectedFiles.forEach((serialized, fileName) => fs.writeFileSync(path.join(chapterRoot, fileName), serialized, "utf8"));
  fs.readdirSync(chapterRoot).filter((file) => file.endsWith(".json") && !expectedFiles.has(file))
    .forEach((file) => fs.unlinkSync(path.join(chapterRoot, file)));
  fs.writeFileSync(manifestPath, serializedManifest, "utf8");
  console.log(`wrote manifest and ${expectedFiles.size} lazy chapter payloads`);
}
