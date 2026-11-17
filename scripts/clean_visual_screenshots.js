'use strict';
const fs = require('node:fs');
const path = require('node:path');

const repo = fs.realpathSync(path.join(__dirname, '..'));
const screenshots = path.join(repo, 'visual-regression', 'screenshots');
const captureRun = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z(?:-.*)?$/;
let removed = 0;
let bytes = 0;

function clean(folder) {
  const resolved = fs.realpathSync(folder);
  if (resolved !== folder || (resolved !== screenshots && !resolved.startsWith(screenshots + path.sep))) {
    throw new Error(`Screenshot cleanup requires a real directory under ${screenshots}: ${folder}`);
  }

  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const target = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      clean(target);
    } else if (entry.isFile()) {
      const manifest = entry.name === 'capture.json' && captureRun.test(path.basename(folder));
      if (path.extname(entry.name).toLowerCase() !== '.png' && !manifest) continue;
      const size = fs.statSync(target).size;
      fs.unlinkSync(target);
      removed += 1;
      bytes += size;
    }
  }
}

if (fs.existsSync(screenshots)) clean(screenshots);
console.log(`Removed ${removed} generated screenshot files (${(bytes / 1024 ** 2).toFixed(1)} MiB).`);
