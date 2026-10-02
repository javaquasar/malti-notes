const fs = require("fs");
const path = require("path");
const { suiteNames } = require("./functional_suites");

const rootDir = path.resolve(__dirname, "..");
const workflowPath = path.join(
  rootDir,
  ".github",
  "workflows",
  "build-pages-with-wasm.yml"
);
const workflow = fs.readFileSync(workflowPath, "utf8");

const requiredChecks = [
  "docs:check",
  "cloud-sync:check",
  "firebase:check",
  "style:lint",
  "data:lint",
  "schema:check",
  "content:lint",
  "content:model:check",
  "content:verify",
  "books:coverage",
  "depth:check",
  "course:lint",
  "coverage:check",
  "links:lint",
  "pwa:check",
  "search:check",
  "theme:a11y",
  "a11y:check",
  "visual:smoke",
  "functional:test",
  "visual:ci",
  "visual:catalog",
  "visual:groups",
];

const missingChecks = requiredChecks.filter(
  (check) => !workflow.includes(`npm run ${check}`)
);
const requiredFragments = [
  "pull_request:",
  "needs: [quality, functional, visual]",
  "node-version: \"24\"",
  "actions/checkout@v7",
  "actions/setup-node@v7",
  "actions/cache@v5",
  "VISUAL_SHARD_TOTAL: 3",
  "FUNCTIONAL_SUITE: ${{ matrix.suite }}",
  ...suiteNames,
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
  `CI workflow contract passed (${requiredChecks.length} workflow checks, ${suiteNames.length} functional suites, PR gate, Node 24).`
);
