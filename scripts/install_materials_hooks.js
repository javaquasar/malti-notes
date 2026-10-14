const fs = require('node:fs');
const path = require('node:path');
const { command } = require('./materials_git_gate');
const root = path.resolve(__dirname, '..');
try {
  const custom = require('node:child_process').spawnSync('git', ['config', '--get', 'core.hooksPath'], { cwd: root, encoding: 'utf8' });
  if (custom.status === 0 && custom.stdout.trim()) throw new Error('A custom core.hooksPath is configured. Integrate the material hooks there explicitly; it will not be overwritten.');
  const directory = path.resolve(root, command('git', ['rev-parse', '--git-path', 'hooks'], root).toString().trim());
  const hooks = ['pre-commit', 'pre-push'].map(name => ({
    name, target: path.join(directory, name), source: path.join(root, 'scripts/hooks', name)
  }));
  for (const { target } of hooks) {
    if (fs.existsSync(target) && !fs.readFileSync(target, 'utf8').includes('# malti-materials-policy-hook')) throw new Error(`Existing hook preserved: ${target}`);
  }
  fs.mkdirSync(directory, { recursive: true });
  for (const { name, target, source } of hooks) {
    fs.copyFileSync(source, target);fs.chmodSync(target, 0o755);console.log(`Installed ${name}: exact-tree material validation`);
  }
} catch (error) { console.error(error.message);process.exitCode = 1; }
