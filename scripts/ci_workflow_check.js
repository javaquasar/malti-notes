const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const workflowPath = path.join(
  rootDir,
  ".github",
  "workflows",
  "build-pages-with-wasm.yml"
);
const workflow = fs.readFileSync(workflowPath, "utf8");

const requiredChecks = [
  "style:lint",
  "data:lint",
  "content:lint",
  "books:coverage",
  "course:lint",
  "links:lint",
  "theme:a11y",
  "visual:smoke",
  "functional:test",
  "visual:ci",
  "visual:groups",
];

const missingChecks = requiredChecks.filter(
  (check) => !workflow.includes(`npm run ${check}`)
);
const requiredFragments = [
  "pull_request:",
  "needs: quality",
  "node-version: \"24\"",
  "actions/checkout@v7",
  "actions/setup-node@v7",
];
const missingFragments = requiredFragments.filter(
  (fragment) => !workflow.includes(fragment)
);

if (missingChecks.length || missingFragments.length) {
  if (missingChecks.length) {
    console.error(`Missing CI checks: ${missingChecks.join(", ")}`);
  }
  if (missingFragments.length) {
    console.error(`Missing CI requirements: ${missingFragments.join(", ")}`);
  }
  process.exit(1);
}

console.log(
  `CI workflow contract passed (${requiredChecks.length} quality checks, PR gate, Node 24).`
);
