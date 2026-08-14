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

if (errors.length) {
  errors.forEach((error) => console.error(`fail course build graph: ${error}`));
  process.exit(1);
}

console.log("ok course build graph is bindings -> examples/supplements/assessments -> chapter payloads");
