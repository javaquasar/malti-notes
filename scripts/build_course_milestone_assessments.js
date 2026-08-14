const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputPath = path.join(root, "assets", "data", "course_milestone_assessments.json");
const checkOnly = process.argv.includes("--check");
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const course = read("assets/data/course_path.json");
const assessments = read("assets/data/course_target_assessments.json");

function candidatesFor(chapterId, mode) {
  const seen = new Set();
  return assessments.sets
    .filter((set) => set.chapterId === chapterId && set.kind === "checkpoint")
    .flatMap((set) => set.items)
    .filter((item) => item.assessmentMode === mode && item.type !== "matching")
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

function selectChapterItems(chapter, countPerMode, offset) {
  return ["recognition", "production"].flatMap((mode, modeIndex) => {
    const candidates = candidatesFor(chapter.id, mode);
    if (candidates.length < countPerMode) {
      throw new Error(`${chapter.id} has only ${candidates.length} ${mode} milestone candidates`);
    }
    return Array.from({ length: countPerMode }, (_, index) => {
      const source = candidates[(offset + index + (modeIndex * countPerMode)) % candidates.length];
      return { ...source, sourceAssessmentId: source.id, sourceChapterId: chapter.id };
    });
  });
}

function createSet(id, title, chapters, countPerMode, offset) {
  const items = chapters.flatMap((chapter, chapterIndex) => selectChapterItems(chapter, countPerMode, offset + chapterIndex)
    .map((item, itemIndex) => ({ ...item, id: `${id}-${chapter.id}-${item.assessmentMode}-${itemIndex + 1}` })));
  const targetIds = [...new Set(items.flatMap((item) => item.targetIds || []))];
  return {
    id,
    title,
    kind: "milestone",
    passPercent: 75,
    chapterIds: chapters.map((chapter) => chapter.id),
    chapterCount: chapters.length,
    targetCount: targetIds.length,
    itemCount: items.length,
    modeCounts: {
      recognition: items.filter((item) => item.assessmentMode === "recognition").length,
      production: items.filter((item) => item.assessmentMode === "production").length
    },
    items
  };
}

const b1 = course.levels.find((level) => level.id === "b1").chapters;
const b2 = course.levels.find((level) => level.id === "b2").chapters;
const output = {
  schemaVersion: 1,
  description: "Generated cumulative assessments balanced across course chapters and response modes.",
  sets: [
    createSet("course-milestone-b1", "B1 Cumulative Test", b1, 2, 0),
    createSet("course-milestone-b2", "B2 Cumulative Test", b2, 2, 1),
    createSet("course-milestone-mixed", "B1 and B2 Mixed Test", [...b1, ...b2], 1, 2)
  ]
};
const serialized = `${JSON.stringify(output, null, 2)}\n`;

if (checkOnly) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== serialized) {
    console.error("fail cumulative course assessments are stale; run npm run course:milestones:build");
    process.exit(1);
  }
  output.sets.forEach((set) => {
    if (set.itemCount !== set.items.length || set.modeCounts.recognition !== set.modeCounts.production) {
      throw new Error(`${set.id} is not balanced`);
    }
  });
  console.log(`ok checked ${output.sets.length} cumulative course assessments`);
} else {
  fs.writeFileSync(outputPath, serialized, "utf8");
  console.log(`wrote ${output.sets.length} cumulative course assessments`);
}
