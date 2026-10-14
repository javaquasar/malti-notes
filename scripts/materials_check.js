const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { requiredReading, checks } = require('./materials_policy');
const { checkPolicy } = require('./materials_policy_check');
const { independentGitEnvironment } = require('./materials_git_gate');
const root = path.resolve(__dirname, '..');

try {
  checkPolicy();
  const env = independentGitEnvironment(root);
  if (process.argv.includes('--preflight')) {
    console.log('Required reading before authoring (a passed check is not proof that you read it):');
    requiredReading.forEach(file => console.log(`  ${file}`));
  }
  for (const [name, file, ...args] of checks) {
    console.log(`\nMaterial gate: ${name}`);
    const result = spawnSync(process.execPath, [path.join(root, file), ...args], { cwd: root, env, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Material gate failed: ${name}`);
  }
  console.log('\nPASS: material authoring gate. Re-run after changes; this is not a permanent approval.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
