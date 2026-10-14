const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

function command(executable, args, cwd, input) {
  const result = spawnSync(executable, args, { cwd, input, maxBuffer: 128 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr.toString() || `${executable} failed`);
  return result.stdout;
}

function independentGitEnvironment(repository) {
  const env = { ...process.env };
  for (const name of command('git', ['rev-parse', '--local-env-vars'], repository).toString().trim().split(/\r?\n/)) delete env[name];
  return env;
}

function withSnapshot(repository, revision, callback, linkDependencies = true) {
  const prefix = path.join(os.tmpdir(), 'malti-materials-');
  const snapshot = fs.mkdtempSync(prefix);
  try {
    const archive = command('git', ['-c', 'core.autocrlf=false', 'archive', '--format=tar', revision], repository);
    command('tar', ['-xf', '-', '-C', snapshot], repository, archive);
    // Archive attributes must not exclude or substitute files being validated.
    const entries = command('git', ['ls-tree', '-rz', '--full-tree', revision], repository).toString('utf8').split('\0').filter(Boolean);
    for (const entry of entries) {
      const match = entry.match(/^(\d+) (blob|commit) ([a-f0-9]+)\t([\s\S]+)$/);
      if (!match || match[2] !== 'blob') throw new Error('Unsupported Git tree entry; refusing an incomplete snapshot');
      const [, mode, , expected, relative] = match;
      const file = path.resolve(snapshot, relative);
      if (!file.startsWith(snapshot + path.sep)) throw new Error('Unsafe Git tree path');
      if (!fs.existsSync(file)) throw new Error(`Incomplete snapshot: ${relative}; export-ignore cannot bypass validation`);
      const bytes = mode === '120000' ? Buffer.from(fs.readlinkSync(file)) : fs.readFileSync(file);
      const hash = crypto.createHash(expected.length === 64 ? 'sha256' : 'sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
      if (hash !== expected) throw new Error(`Changed snapshot bytes: ${relative}; archive substitutions cannot bypass validation`);
    }
    if (linkDependencies) {
      const dependencies = path.join(repository, 'node_modules');
      if (!fs.existsSync(dependencies)) throw new Error('Run npm ci before committing or pushing.');
      fs.symlinkSync(dependencies, path.join(snapshot, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
    }
    return callback(snapshot);
  } finally {
    // Only remove the temporary snapshot created here, never a computed repo path.
    if (!snapshot.startsWith(prefix) || path.dirname(snapshot) !== path.resolve(os.tmpdir())) throw new Error('Unsafe snapshot cleanup path');
    fs.rmSync(snapshot, { recursive: true, force: true });
  }
}

function validateRevision(repository, revision) {
  withSnapshot(repository, revision, snapshot => {
    const validator = path.join(snapshot, 'scripts/materials_check.js');
    if (!fs.existsSync(validator)) throw new Error('The staged/outgoing tree is missing the material policy. Include the policy files in this commit.');
    const result = spawnSync(process.execPath, [validator], { cwd: snapshot, env: independentGitEnvironment(repository), stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Material gate rejected tree ${revision}`);
  });
}

if (require.main === module) {
  try {
    if (process.argv[2] === '--staged') {
      const tree = command('git', ['write-tree'], root).toString().trim();
      validateRevision(root, tree);
    } else if (process.argv[2] === '--push') {
      const revisions = new Set();
      for (const line of fs.readFileSync(0, 'utf8').trim().split('\n').filter(Boolean)) {
        const sha = line.trim().split(/\s+/)[1];
        if (!/^[a-f0-9]{40,64}$/.test(sha)) throw new Error('Invalid outgoing revision');
        if (!/^0+$/.test(sha)) revisions.add(sha);
      }
      for (const revision of revisions) validateRevision(root, revision);
    } else throw new Error('Expected --staged or --push');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { command, withSnapshot, validateRevision, independentGitEnvironment };
