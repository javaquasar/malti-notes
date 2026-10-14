const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { command, withSnapshot, validateRevision } = require('./materials_git_gate');
const { checkPolicy } = require('./materials_policy_check');
const { requiredReading, checks } = require('./materials_policy');
const root = path.resolve(__dirname, '..');
const prefix = path.join(os.tmpdir(), 'malti-policy-test-');
const temporary = fs.mkdtempSync(prefix);
try {
  const repository = path.join(temporary, 'repository');fs.mkdirSync(repository);
  command('git', ['init', '--quiet'], repository);
  fs.mkdirSync(path.join(repository, 'scripts'));
  fs.mkdirSync(path.join(repository, 'node_modules'));
  fs.writeFileSync(path.join(repository, 'value.txt'), 'invalid');
  fs.writeFileSync(path.join(repository, 'scripts/materials_check.js'), "if(require('node:fs').readFileSync('value.txt','utf8')!=='valid') process.exit(1);\n");
  fs.copyFileSync(path.join(root, 'scripts/materials_git_gate.js'), path.join(repository, 'scripts/materials_git_gate.js'));
  command('git', ['add', 'value.txt', 'scripts'], repository);
  const badTree = command('git', ['write-tree'], repository).toString().trim();
  fs.writeFileSync(path.join(repository, 'value.txt'), 'valid');
  let exported;
  withSnapshot(repository, badTree, snapshot => {
    exported = snapshot;assert.equal(fs.readFileSync(path.join(snapshot, 'value.txt'), 'utf8'), 'invalid');
  }, false);
  assert(!fs.existsSync(exported), 'Successful exports must be cleaned up');
  assert.throws(() => validateRevision(repository, badTree), /Material gate rejected/);
  assert.notEqual(spawnSync(process.execPath, ['scripts/materials_git_gate.js', '--staged'], { cwd: repository }).status, 0);
  assert.equal(fs.readFileSync(path.join(repository, 'value.txt'), 'utf8'), 'valid');
  command('git', ['add', 'value.txt'], repository);
  const goodTree = command('git', ['write-tree'], repository).toString().trim();
  validateRevision(repository, goodTree);
  assert.throws(() => withSnapshot(repository, goodTree, snapshot => { exported = snapshot;throw new Error('fixture failure'); }, false), /fixture failure/);
  assert(!fs.existsSync(exported), 'Failed exports must be cleaned up');
  const commit = tree => command('git', ['-c', 'user.name=Material Gate Test', '-c', 'user.email=test@example.invalid', 'commit-tree', tree, '-m', 'fixture'], repository).toString().trim();
  const goodCommit = commit(goodTree), badCommit = commit(badTree), zeros = '0'.repeat(40);
  const push = lines => spawnSync(process.execPath, ['scripts/materials_git_gate.js', '--push'], { cwd: repository, input: lines, encoding: 'utf8' });
  assert.equal(push(`refs/heads/main ${goodCommit} refs/heads/main ${zeros}\n`).status, 0);
  assert.notEqual(push(`refs/heads/main ${badCommit} refs/heads/main ${zeros}\n`).status, 0, 'A clean worktree cannot conceal an invalid outgoing commit');
  assert.equal(push(`(delete) ${zeros} refs/heads/obsolete ${badCommit}\n`).status, 0);
  assert.notEqual(push('refs/heads/main invalid-sha refs/heads/main 0000\n').status, 0);
  fs.writeFileSync(path.join(repository, '.gitattributes'), 'value.txt export-ignore\n');
  command('git', ['add', '.gitattributes'], repository);
  const excluded = command('git', ['write-tree'], repository).toString().trim();
  assert.throws(() => withSnapshot(repository, excluded, () => {}, false), /Incomplete snapshot/);
  fs.writeFileSync(path.join(repository, '.gitattributes'), 'value.txt export-subst\n');
  fs.writeFileSync(path.join(repository, 'value.txt'), '$Format:%H$');
  command('git', ['add', '.gitattributes', 'value.txt'], repository);
  const substituted = command('git', ['write-tree'], repository).toString().trim();
  assert.throws(() => withSnapshot(repository, commit(substituted), () => {}, false), /Changed snapshot bytes/);

  for (const file of ['scripts/install_materials_hooks.js', 'scripts/hooks/pre-commit', 'scripts/hooks/pre-push']) {
    fs.mkdirSync(path.dirname(path.join(repository, file)), { recursive: true });fs.copyFileSync(path.join(root, file), path.join(repository, file));
  }
  const install = () => spawnSync(process.execPath, ['scripts/install_materials_hooks.js'], { cwd: repository, encoding: 'utf8' });
  const hook = path.join(repository, '.git/hooks/pre-commit');
  fs.writeFileSync(hook, '# existing unrelated hook\n');
  assert.notEqual(install().status, 0);assert.equal(fs.readFileSync(hook, 'utf8'), '# existing unrelated hook\n');
  fs.unlinkSync(hook);assert.equal(install().status, 0);
  assert(fs.readFileSync(hook, 'utf8').includes('materials_git_gate.js --staged'));
  assert(fs.readFileSync(path.join(repository, '.git/hooks/pre-push'), 'utf8').includes('--push'));
  command('git', ['config', 'core.hooksPath', 'custom-hooks'], repository);
  assert.notEqual(install().status, 0);
  assert.equal(command('git', ['config', '--get', 'core.hooksPath'], repository).toString().trim(), 'custom-hooks');

  const policy = path.join(temporary, 'policy');fs.mkdirSync(policy);
  const files = [...requiredReading, ...checks.map(([, file]) => file), 'AGENTS.md', 'package.json',
    'scripts/hooks/pre-commit', 'scripts/hooks/pre-push', '.github/workflows/build-pages-with-wasm.yml'];
  for (const file of new Set(files)) {
    const target = path.join(policy, file);fs.mkdirSync(path.dirname(target), { recursive: true });fs.copyFileSync(path.join(root, file), target);
  }
  assert(checkPolicy(policy));
  const guide = path.join(policy, 'docs/reference/ui-components.md'), savedGuide = fs.readFileSync(guide);
  fs.unlinkSync(guide);assert.throws(() => checkPolicy(policy));fs.writeFileSync(guide, savedGuide);
  const workflow = path.join(policy, '.github/workflows/build-pages-with-wasm.yml'), savedWorkflow = fs.readFileSync(workflow, 'utf8');
  fs.writeFileSync(workflow, savedWorkflow.replace('npm run materials:check', 'echo skipped'));assert.throws(() => checkPolicy(policy), /CI must run/);
  fs.writeFileSync(workflow, savedWorkflow);
  const style = path.join(policy, 'scripts/style_lint.js');fs.writeFileSync(style, fs.readFileSync(style, 'utf8').replace('style_contract_check.js', 'disabled.js'));
  assert.throws(() => checkPolicy(policy), /Style ownership guard/);
  console.log('PASS: staged/outgoing tree isolation, valid/invalid/deleted refs, archive exclusions/substitution, cleanup, hook installation/preservation, missing guide and disconnected style/CI guards.');
} finally {
  if (!temporary.startsWith(prefix) || path.dirname(temporary) !== path.resolve(os.tmpdir())) throw new Error('Unsafe test cleanup path');
  fs.rmSync(temporary, { recursive: true, force: true });
}
