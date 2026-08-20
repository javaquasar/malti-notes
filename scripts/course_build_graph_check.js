const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const bindingsBuilder = fs.readFileSync(
  path.join(root, "scripts", "build_course_target_bindings.js"),
  "utf8"
);
const payloadBuilder = fs.readFileSync(
  path.join(root, "scripts", "build_course_chapter_payloads.js"),
  "utf8"
);
const milestoneBuilder = fs.readFileSync(
  path.join(root, "scripts", "build_course_milestone_assessments.js"),
  "utf8"
);
const coverageBuilder = fs.readFileSync(
  path.join(root, "scripts", "build_comprehensive_test_bank.js"),
  "utf8"
);
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");

const forbiddenUpstreamInputs = [
  "course_target_assessments.json",
  "course_supplemental_content.json",
];
const errors = forbiddenUpstreamInputs
  .filter((file) => bindingsBuilder.includes(`readJson(\"assets/data/${file}\")`) || bindingsBuilder.includes(`readOptionalJson(\"assets/data/${file}\"`))
  .map((file) => `bindings builder must not read downstream artifact ${file}`);

if (!payloadBuilder.includes("assessmentIdsByTarget")) {
  errors.push("chapter payload builder must derive assessmentIds downstream");
}

if (!milestoneBuilder.includes("course_target_assessments.json")) {
  errors.push("milestone builder must derive cumulative tests from canonical target assessments");
}

[
  "course_target_bindings.json",
  "course_target_assessments.json",
  "grammar_targets.json",
  "course_verb_paradigms.json"
].forEach((file) => {
  if (!coverageBuilder.includes(file)) errors.push(`comprehensive coverage builder must read ${file}`);
});

if (!packageJson.includes("npm run course:verbs:build && npm run coverage:build")) {
  errors.push("course build must generate verb paradigms before the comprehensive coverage bank");
}

if (errors.length) {
  errors.forEach((error) => console.error(`fail course build graph: ${error}`));
  process.exit(1);
}

console.log("ok course build graph includes downstream chapter, milestone, verb, and comprehensive coverage artifacts");
