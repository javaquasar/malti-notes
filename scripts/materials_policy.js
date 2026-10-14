const requiredReading = [
  'docs/quality/material-authoring.md',
  'docs/reference/ui-components.md',
  'docs/decisions/0003-layered-style-system.md',
  'docs/learning-content-model.md',
  'docs/content-verification.md'
];

const checks = [
  ['materials:gate:check', 'scripts/materials_gate_check.js'],
  ['docs:check', 'scripts/docs_check.js'],
  ['style:lint', 'scripts/style_lint.js'],
  ['data:lint', 'scripts/data_lint.js'],
  ['schema:check', 'scripts/schema_check.js'],
  ['content:lint', 'scripts/content_lint.js'],
  ['content:model:check', 'scripts/learning_content_model_check.js'],
  ['content:verify', 'scripts/content_verification_check.js'],
  ['links:lint', 'scripts/links_lint.js'],
  ['search:check', 'scripts/build_search_index.js', '--check'],
  ['pwa:check', 'scripts/build_service_worker.js', '--check'],
  ['ci:workflow:check', 'scripts/ci_workflow_check.js']
];

module.exports = { requiredReading, checks };
