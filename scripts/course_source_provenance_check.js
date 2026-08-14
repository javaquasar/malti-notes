const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const provenance = read("assets/data/course_source_provenance.json");
const inventory = read("assets/data/book_coverage_inventory.json");
const bindings = read("assets/data/course_target_bindings.json");
const errors = [];
const fail = (message) => errors.push(message);

if (provenance.schemaVersion !== 1) fail("schemaVersion must be 1");
const fullTextSources = new Map(
  inventory.sources.filter((source) => source.kind === "full-text-pdf").map((source) => [source.book, source])
);
(provenance.sources || []).forEach((source) => {
  const expected = fullTextSources.get(source.book);
  if (!expected) fail(`unexpected source book ${source.book}`);
  if (expected && source.sha256 !== expected.sha256) fail(`${source.book} source hash differs from frozen inventory`);
  if (!Number.isInteger(source.pdfPageCount) || source.pdfPageCount < 100) fail(`${source.book} has an invalid PDF page count`);
});
if ((provenance.sources || []).length !== fullTextSources.size) fail("full-text source list is incomplete");

const inventoryChapters = new Map(inventory.chapters.map((chapter) => [chapter.courseChapterId, chapter]));
const sourceChapters = new Map((provenance.chapters || []).map((chapter) => [chapter.chapterId, chapter]));
if (sourceChapters.size !== inventoryChapters.size) fail(`expected ${inventoryChapters.size} chapter ranges, found ${sourceChapters.size}`);
inventoryChapters.forEach((chapter, chapterId) => {
  const source = sourceChapters.get(chapterId);
  if (!source) return fail(`missing chapter provenance for ${chapterId}`);
  if (source.book !== chapter.book || source.chapterNumber !== chapter.number || source.chapterTitle !== chapter.title) {
    fail(`${chapterId} metadata differs from frozen inventory`);
  }
  if (!Number.isInteger(source.pageStart) || !Number.isInteger(source.pageEnd) || source.pageStart > source.pageEnd) {
    fail(`${chapterId} has an invalid printed page range`);
  }
});

const targetEntries = Object.entries(provenance.targets || {});
const targetIds = new Set(bindings.targets.map((target) => target.id));
if (targetEntries.length !== targetIds.size) fail(`expected ${targetIds.size} target source records, found ${targetEntries.length}`);
targetEntries.forEach(([targetId, source]) => {
  const target = bindings.targets.find((item) => item.id === targetId);
  if (!target) return fail(`unexpected target provenance ${targetId}`);
  const chapter = sourceChapters.get(target.chapterId);
  if (source.book !== target.book || source.chapterId !== target.chapterId) fail(`${targetId} points to the wrong book chapter`);
  if (!Array.isArray(source.pageRange) || source.pageRange[0] !== chapter?.pageStart || source.pageRange[1] !== chapter?.pageEnd) {
    fail(`${targetId} has a stale chapter page range`);
  }
  if (!Array.isArray(source.pages)) fail(`${targetId}.pages must be an array`);
  (source.pages || []).forEach((page) => {
    if (!Number.isInteger(page) || page < source.pageRange[0] || page > source.pageRange[1]) fail(`${targetId} has an out-of-range page hit`);
  });
  if (source.primaryPage !== null && source.primaryPage !== source.pages[0]) fail(`${targetId} primaryPage must be its first text hit`);
  if (!["text-exact", "text-folded", "chapter-range"].includes(source.match)) fail(`${targetId} has unsupported match type ${source.match}`);
});

const exactTargets = targetEntries.filter(([, source]) => source.match !== "chapter-range").length;
if (exactTargets / targetEntries.length < 0.9) fail(`only ${exactTargets}/${targetEntries.length} targets have OCR page hits`);

const verbEntries = Object.entries(provenance.verbParadigms || {});
const inventoryVerbs = new Map(inventory.verbParadigms.map((paradigm) => [paradigm.id, paradigm]));
if (verbEntries.length !== inventoryVerbs.size) fail(`expected ${inventoryVerbs.size} verb provenance records, found ${verbEntries.length}`);
verbEntries.forEach(([id, source]) => {
  const paradigm = inventoryVerbs.get(id);
  if (!paradigm) return fail(`unexpected verb provenance ${id}`);
  if (source.book !== paradigm.book || source.lemma !== paradigm.lemma) fail(`${id} metadata differs from verb inventory`);
  if (!source.primaryPage || !source.pages.includes(source.primaryPage)) fail(`${id} has no source page`);
  paradigm.forms.forEach((form) => {
    if (!source.forms?.[form]) fail(`${id} is missing provenance for form ${form}`);
  });
});

if (errors.length) {
  errors.forEach((error) => console.error(`fail course provenance: ${error}`));
  process.exit(1);
}
console.log(`ok checked ${targetEntries.length} target sources (${exactTargets} OCR page hits) and ${verbEntries.length} verb paradigms`);
