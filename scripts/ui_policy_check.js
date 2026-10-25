const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { inventory, scanDocuments, scriptFactories, hash } = require('./ui_policy_scan');
const root = path.resolve(__dirname, '..');
const contractFile = 'scripts/ui_unification_contract.json';
const descriptionFile = 'docs/quality/ui-unification-contract.md';
const defaultControls = ['action-button', 'action-link', 'review-add-button', 'toggle-chip', 'study-input', 'study-option', 'study-token', 'study-icon-button', 'study-link-button', 'toggle-images', 'home-toggle', 'review-input', 'review-select', 'review-textarea'];

function render(contract) {
  const safe = (text) => text.replaceAll('|', '\\|').replace(/[\r\n]+/g, ' ');
  return ['# Enforced UI Unification Contract', '',
    'Generated from `scripts/ui_unification_contract.json` by `npm run ui:policy:describe`. Both files must change together when this contract changes. The check never accepts a new inventory automatically.', '',
    '## Rules', '', ...contract.rules.flatMap((rule) => [`### ${rule.id}: ${rule.title}`, '', rule.description, '']),
    '## Standard Native Controls', '', contract.controlClasses.map((name) => `\`${name}\``).join(', '), '',
    'Fields use `study-input`, `review-input`, `review-select` or `review-textarea`; commands use the command classes, not field classes. `action-link` is for navigation, not an input/button shortcut. Checkboxes and radios use native inputs inside `study-check`, `exercise-choice` or `course-objective`. Hidden inputs are not visual controls.', '',
    '## Registered Ownership And Exceptions', '',
    'Each entry below is exact, file-bound and count-bound. CSS selector ownership is registered separately from its values so central theme/design edits remain possible. Legacy CSS freezes regulated declarations, including nested conditions and priorities. Legacy HTML controls freeze their attributes and content. JavaScript factory signatures use parsed ASTs, excluding formatting/comments/locations. New or changed factories require an explicit registry and description review.', '',
    '| File | Kind | Entries | Description |', '| --- | --- | ---: | --- |',
    ...contract.scopes.map((scope) => `| ${scope.file} | ${scope.kind} | ${scope.entries.length} | ${safe(scope.description)} |`), '',
    ...contract.scopes.flatMap((scope) => [`## ${scope.file} (${scope.kind})`, '', scope.description, '',
      '| Registered element | Count | Signature |', '| --- | ---: | --- |',
      ...scope.entries.map((entry) => `| ${safe(entry.label)} | ${entry.count} | \`${entry.signature}\` |`), '']),
    '## Change Procedure', '',
    '1. Prefer composing registered components. New standard HTML and typed learning data do not need exceptions.',
    '2. For a genuinely new component or an intentional exception, change the JSON rules/scopes, explain the purpose and ownership, and update the component guide and catalog as applicable.',
    '3. Run `npm run ui:policy:describe` to regenerate this complete list and description; review the diff. This command does not scan or approve source changes.',
    '4. Run `npm run materials:check` and relevant runtime/accessibility/visual checks. No automatic baseline promotion is permitted.', '',
    '## Enforcement Limits', '',
    'This is a repository quality contract, not a security boundary against a maintainer editing the checks. AST factory checks are conservative and are not a proof of all possible JavaScript data flow. Existing CSSOM/HTML checks, runtime contracts and review remain required. GitHub branch protection, required CI and independent review of policy changes are necessary for server-side enforcement. Local hooks alone can be bypassed by the machine owner. No remote repository setting is changed by this implementation.', ''].join('\n');
}
function validateContract(contract) {
  assert.equal(contract.version, 1);
  assert.equal(new Set(contract.rules.map((rule) => rule.id)).size, contract.rules.length);
  for (const rule of contract.rules) assert.ok(rule.title && rule.description.trim().length >= 80, `Missing rule description: ${rule.id}`);
  for (const scope of contract.scopes) {
    assert.ok(scope.description.trim().length >= 40, `Missing exception/ownership explanation: ${scope.file}`);
    assert.ok(['shared-selector', 'legacy-css', 'legacy-control', 'script-factory', 'stylesheet-import', 'style-payload'].includes(scope.kind));
    for (const entry of scope.entries) assert.ok(/^[a-f0-9]{64}$/.test(entry.signature) && entry.label && Number.isInteger(entry.count) && entry.count > 0);
  }
  assert.ok(contract.controlClasses.length && new Set(contract.controlClasses).size === contract.controlClasses.length);
}
function compare(contract, actual) {
  const expected = new Map();
  for (const scope of contract.scopes) for (const entry of scope.entries) {
    const id = `${scope.kind}:${scope.file}:${entry.signature}`;
    assert.ok(!expected.has(id), `Duplicate policy entry: ${id}`);
    expected.set(id, entry.count);
  }
  const observed = new Map();
  for (const entry of actual) observed.set(entry.id, (observed.get(entry.id) || 0) + 1);
  const failures = [];
  for (const entry of actual) if (!expected.has(entry.id)) failures.push(`Unregistered ${entry.kind}: ${entry.file}: ${entry.label}`);
  for (const [id, count] of expected) if (observed.get(id) !== count) failures.push(`Changed or removed registered entry: ${id} (expected ${count}, found ${observed.get(id) || 0})`);
  return failures;
}
async function negativeTests(page, contract, actual) {
  const styles = [
    ['assets/css/pages.css', '.backdoor { border:1px solid red; padding:7px; }'],
    ['assets/css/lesson01-practice.css', '@media(max-width:500px) { .lesson-practice input { background:red } }'],
    ['assets/css/site/components.css', '.unlisted-button { background:red; }'],
    ['assets/css/pages.css', '@supports(display:grid) { .study-input { padding:31px !important; } }'],
    ['assets/css/pages.css', '.page { --component-chip-bg: var(--surface-input); }'],
    ['assets/css/pages.css', '@keyframes local-skin { to { background:red; } }']
  ];
  for (const [file, text] of styles) {
    const scan = await page.evaluate(scanDocuments, { styles: [{ file, text }], documents: [], controlClasses: contract.controlClasses });
    assert.ok(scan.findings.length, `CSS mutation escaped detection: ${file}`);
  }
  const shell = '<link rel="stylesheet" href="./assets/css/theme.css"><link rel="stylesheet" href="./assets/css/site.css"><link rel="stylesheet" href="./assets/css/pages.css">';
  const markup = await page.evaluate(scanDocuments, { styles: [], documents: [{ file: 'new-page.html', text: shell + '<input class="local-field"><button>Save</button>' }], controlClasses: contract.controlClasses });
  assert.equal(markup.findings.length, 2, 'Unclassified native controls must be rejected');
  const wrongTypes = await page.evaluate(scanDocuments, { styles: [], documents: [{ file: 'new-page.html', text: shell + '<input class="action-button"><button class="study-input">Save</button>' }], controlClasses: contract.controlClasses });
  assert.equal(wrongTypes.findings.length, 2, 'Using the wrong shared class must not bypass native control classification');
  const valid = await page.evaluate(scanDocuments, { styles: [{ file: 'assets/css/new-page.css', text: '.layout {display:grid;gap:var(--space-md);padding:var(--space-lg)}' }], documents: [{ file: 'new.html', text: shell + '<label class="study-field">Answer<input class="study-input"></label><button class="action-button">Save</button>' }], controlClasses: contract.controlClasses });
  assert.equal(valid.findings.length, 0, 'Standard composition must not require an exception');
  const imported = await page.evaluate(scanDocuments, { styles: [{ file: 'assets/css/site.css', text: '@import url("https://example.invalid/custom.css");' }], documents: [], controlClasses: contract.controlClasses });
  assert.ok(imported.findings.some((entry) => entry.kind === 'stylesheet-import'), 'Imported styles must not bypass the registry');
  for (const source of ['box["style"].color="red";', 'node.setAttribute("style", "color:red");', 'node.innerHTML="<input>";', 'const make=()=>document.createElement("button");', 'new Function("return 1")']) {
    assert.ok(scriptFactories('assets/js/new.js', source).length, `Script mutation escaped detection: ${source}`);
  }
  assert.deepEqual(scriptFactories('x.js', 'function make(){return document.createElement("input")}').map((entry) => entry.signature), scriptFactories('x.js', '// comment\nfunction make() { return document.createElement("input"); }').map((entry) => entry.signature), 'Formatting must not change AST factory signatures');
  assert.ok(compare(contract, [...actual, { id: 'unregistered', kind: 'legacy-css', file: 'pages.css', label: 'new surface' }]).length);
  assert.ok(compare(contract, actual.slice(1)).length, 'Removed exceptions must require a documented list update');
  const mutated = structuredClone(contract); mutated.rules[0].description += ' Changed.';
  assert.notEqual(render(mutated), render(contract), 'Descriptions must be coupled to the rule registry');
  assert.notEqual(hash(contract), hash(mutated));
}
async function main() {
  const exists = fs.existsSync(path.join(root, contractFile));
  const contract = exists ? JSON.parse(fs.readFileSync(path.join(root, contractFile), 'utf8')) : null;
  if (process.argv.includes('--describe')) {
    validateContract(contract); fs.writeFileSync(path.join(root, descriptionFile), render(contract));
    console.log('wrote the UI rule list and description from the reviewed registry'); return;
  }
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.route('**/*', (route) => route.abort());
    const actual = await inventory(root, page, contract?.controlClasses || defaultControls);
    if (process.argv.includes('--inventory')) {
      fs.mkdirSync(path.join(root, 'tmp_ui'), { recursive: true });
      fs.writeFileSync(path.join(root, 'tmp_ui/policy-inventory.json'), JSON.stringify({ controlClasses: defaultControls, entries: actual }, null, 2) + '\n');
      console.log(`wrote ${actual.length} observations for manual review; no policy entry was accepted`); return;
    }
    assert.ok(contract, `Missing ${contractFile}`); validateContract(contract);
    assert.equal(fs.readFileSync(path.join(root, descriptionFile), 'utf8').replace(/\r\n/g, '\n'), render(contract), 'Rule list/description is stale: review the registry and run npm run ui:policy:describe');
    const failures = compare(contract, actual);
    if (failures.length) throw new Error(`UI changes require an explicit registry AND description update (${failures.length} issue(s)):\n${failures.slice(0, 20).join('\n')}`);
    await negativeTests(page, contract, actual);
    console.log(`ok enforced UI registry: ${contract.rules.length} described rules, ${actual.length} exact observations, negative CSS/HTML/AST/documentation tests`);
  } finally { await browser.close(); }
}
if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = { render, validateContract, compare };
