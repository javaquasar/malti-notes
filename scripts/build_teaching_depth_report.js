const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputFile = path.join(root, "assets", "data", "teaching_depth_report.json");
const checkOnly = process.argv.includes("--check");
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));

const bindings = read("assets/data/course_target_bindings.json");
const glosses = read("assets/data/course_target_glosses.json").glosses;
const examples = read("assets/data/course_target_examples.json").examples;
const grammarTargets = read("assets/data/grammar_targets.json").targets;
const assessments = read("assets/data/course_target_assessments.json");
const course = read("assets/data/course_path.json");

const stageIds = ["meaning", "explanation", "example", "recognition", "production", "review"];
const grammarById = new Map(grammarTargets.map((target) => [target.id, target]));
const assessmentItemsByTarget = new Map();

assessments.sets.forEach((set) => (set.items || []).forEach((item) => {
  (item.targetIds || []).forEach((targetId) => {
    const items = assessmentItemsByTarget.get(targetId) || [];
    items.push(item);
    assessmentItemsByTarget.set(targetId, items);
  });
}));

const targetKey = (target) => `${target.chapterId}::${target.sourceRequirement}`;
const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0;
const hasAssessmentMode = (items, mode) => items.some((item) => item.assessmentMode === mode);

function targetStages(target) {
  const items = assessmentItemsByTarget.get(target.id) || [];
  const grammar = grammarById.get(target.id);
  const key = targetKey(target);
  return {
    meaning: target.type === "grammar"
      ? nonEmpty(grammar?.summary)
      : nonEmpty(glosses[key]),
    explanation: target.type === "grammar"
      ? [grammar?.summary, grammar?.rule, grammar?.commonMistake].every(nonEmpty)
      : Boolean(target.contentRef?.page) && items.some((item) => nonEmpty(item.explanation)),
    example: target.type === "grammar"
      ? Array.isArray(grammar?.examples) && grammar.examples.some((example) => nonEmpty(example.maltese) && nonEmpty(example.english))
      : nonEmpty(examples[key]?.maltese) && nonEmpty(examples[key]?.english),
    recognition: hasAssessmentMode(items, "recognition"),
    production: hasAssessmentMode(items, "production"),
    review: items.some((item) => nonEmpty(item.reviewCard?.maltese) && nonEmpty(item.reviewCard?.english))
  };
}

function summarizeTargets(targets) {
  const evaluated = targets.map((target) => {
    const stages = targetStages(target);
    const missingStages = stageIds.filter((stage) => !stages[stage]);
    return { target, stages, missingStages };
  });
  const stageCounts = Object.fromEntries(stageIds.map((stage) => [
    stage,
    evaluated.filter((entry) => entry.stages[stage]).length
  ]));
  const completeTargetCount = evaluated.filter((entry) => !entry.missingStages.length).length;
  return {
    targetCount: evaluated.length,
    completeTargetCount,
    completePercent: evaluated.length ? Math.round(completeTargetCount / evaluated.length * 1000) / 10 : 0,
    stageCounts,
    gaps: evaluated.filter((entry) => entry.missingStages.length).map((entry) => ({
      targetId: entry.target.id,
      chapterId: entry.target.chapterId,
      type: entry.target.type,
      sourceRequirement: entry.target.sourceRequirement,
      missingStages: entry.missingStages
    }))
  };
}

const implementedTargets = bindings.targets.filter((target) => target.implementationStatus === "implemented");
const overall = summarizeTargets(implementedTargets);
const chapterMetadata = new Map(course.levels.flatMap((level) => level.chapters.map((chapter) => [
  chapter.id,
  { level: level.id.toUpperCase(), number: chapter.number, title: chapter.title }
])));
const chapters = [...chapterMetadata.entries()].map(([chapterId, metadata]) => ({
  chapterId,
  ...metadata,
  ...summarizeTargets(implementedTargets.filter((target) => target.chapterId === chapterId))
}));
const typeIds = [...new Set(implementedTargets.map((target) => target.type))].sort();
const targetTypes = Object.fromEntries(typeIds.map((type) => [
  type,
  summarizeTargets(implementedTargets.filter((target) => target.type === type))
]));

const output = {
  schemaVersion: 1,
  generatedFrom: [
    "assets/data/course_target_bindings.json",
    "assets/data/course_target_glosses.json",
    "assets/data/course_target_examples.json",
    "assets/data/grammar_targets.json",
    "assets/data/course_target_assessments.json"
  ],
  description: "Teaching-depth coverage for every implemented B1/B2 course target.",
  stages: [
    { id: "meaning", label: "Meaning" },
    { id: "explanation", label: "Explanation" },
    { id: "example", label: "Example" },
    { id: "recognition", label: "Recognition" },
    { id: "production", label: "Production" },
    { id: "review", label: "Review" }
  ],
  targetCount: overall.targetCount,
  completeTargetCount: overall.completeTargetCount,
  completePercent: overall.completePercent,
  stageCounts: overall.stageCounts,
  gapCount: overall.gaps.length,
  gaps: overall.gaps,
  targetTypes,
  chapters
};
const serialized = `${JSON.stringify(output, null, 2)}\n`;

if (checkOnly) {
  const current = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, "utf8") : "";
  if (current !== serialized) {
    console.error("fail assets/data/teaching_depth_report.json is not synchronized; run npm run depth:build");
    process.exit(1);
  }
  if (output.gapCount) {
    output.gaps.slice(0, 20).forEach((gap) => console.error(`fail teaching depth ${gap.targetId}: ${gap.missingStages.join(", ")}`));
    console.error(`fail teaching depth: ${output.gapCount} of ${output.targetCount} targets are incomplete`);
    process.exit(1);
  }
  console.log(`ok teaching depth: ${output.completeTargetCount}/${output.targetCount} targets complete across ${output.stages.length} stages`);
} else {
  fs.writeFileSync(outputFile, serialized, "utf8");
  console.log(`wrote teaching depth report: ${output.completeTargetCount}/${output.targetCount} complete, ${output.gapCount} gap(s)`);
}
