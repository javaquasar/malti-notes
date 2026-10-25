const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { requiredReading, checks } = require('./materials_policy');
const { render, validateContract } = require('./ui_policy_check');
const root = path.resolve(__dirname, '..');

function checkPolicy(base = root) {
  const read = file => fs.readFileSync(path.join(base, file), 'utf8');
  const instructions = read('AGENTS.md');
  for (const file of requiredReading) {
    assert(read(file).trim().length > 200, `Missing or empty required reference: ${file}`);
    assert(instructions.includes(file), `AGENTS.md must require ${file}`);
  }
  for (const command of ['materials:preflight', 'materials:check', 'materials:hooks:install']) {
    assert(instructions.includes(command), `AGENTS.md must require ${command}`);
  }
  const guide = read('docs/reference/ui-components.md');
  const registry = JSON.parse(read('scripts/ui_unification_contract.json'));
  validateContract(registry);
  assert.equal(read('docs/quality/ui-unification-contract.md').replace(/\r\n/g, '\n'), render(registry), 'UI rule registry and description must change together');
  assert(read('scripts/ui_policy_scan.js').includes('acorn'), 'Missing parsed JavaScript factory guard');
  for (const component of ['study-input', 'study-check', 'study-disclosure', 'study-token', 'control-row', 'print-sheet']) {
    assert(guide.includes(component), `Component guide is missing ${component}`);
  }
  const scripts = JSON.parse(read('package.json')).scripts;
  assert.equal(scripts['materials:preflight'], 'node ./scripts/materials_check.js --preflight');
  assert.equal(scripts['materials:check'], 'node ./scripts/materials_check.js');
  for (const [name, file, ...args] of checks) {
    assert.equal(scripts[name], `node ./${file}${args.length ? ' ' + args.join(' ') : ''}`, `Changed validation command: ${name}`);
    assert(fs.existsSync(path.join(base, file)), `Missing validator: ${file}`);
  }
  assert(read('scripts/style_lint.js').includes('style_contract_check.js'), 'Style ownership guard must remain connected');
  assert(read('scripts/style_lint.js').includes('ui_policy_check.js'), 'Exact UI registry guard must remain connected');
  assert.equal(scripts['ui:policy:describe'], 'node ./scripts/ui_policy_check.js --describe');
  assert(read('.github/workflows/build-pages-with-wasm.yml').includes('npm run ui:policy:check'), 'CI must check the UI registry');
  for (const file of ['scripts/ui_unification_contract.json', 'docs/quality/ui-unification-contract.md', 'scripts/ui_policy_check.js', 'scripts/ui_policy_scan.js']) {
    assert(read('.github/CODEOWNERS').includes(file), `Missing policy code owner: ${file}`);
  }
  assert(read('.github/workflows/build-pages-with-wasm.yml').includes('npm run materials:check'), 'CI must run the material gate');
  assert(read('.github/workflows/build-pages-with-wasm.yml').includes('needs: [quality, functional, visual]'), 'Publishing must remain dependent on quality checks');
  assert(read('scripts/hooks/pre-commit').includes('materials_git_gate.js --staged'), 'Missing staged-tree hook');
  assert(read('scripts/hooks/pre-push').includes('materials_git_gate.js --push'), 'Missing outgoing-commit hook');
  return true;
}

if (require.main === module) {
  try { checkPolicy(); console.log('ok mandatory component references, authoring instructions, validators, hooks and CI gate'); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { checkPolicy };
