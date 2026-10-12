const fs = require('node:fs');
const path = require('node:path');
const { root, vocabularyFiles, save } = require('./vocabulary_image_inventory');
const { withdrawn, missingDecision } = require('./vocabulary_image_policy');
const directory = path.join(root, 'docs/vocabulary-images');
const changeFile = path.join(directory, 'withdrawn-images.json');
const changes = fs.existsSync(changeFile) ? JSON.parse(fs.readFileSync(changeFile, 'utf8')) : [];
const roles = new Map();
for (const [file] of vocabularyFiles()) {
    const location = path.join(root, 'assets/data', file);
    const data = JSON.parse(fs.readFileSync(location, 'utf8'));
    let changed = false;
    for (const group of data.groups || []) for (const item of group.items || []) {
        const reason = withdrawn.get(String(item.english).split(' -> ')[0]);
        const rejectOriginal = !item.imageSource && ['I clean', 'library'].includes(item.english);
        if (reason && (item.imageSource?.provider === 'OpenMoji' || rejectOriginal) && item.image) {
            if (!changes.some((entry) => entry.file === file && entry.maltese === item.maltese)) changes.push({ file, maltese: item.maltese, english: item.english, oldImage: item.image, reason });
            delete item.image;
            delete item.imageAlt;
            delete item.imageSource;
            item.imageRole = 'none';
            item.imageQuizEligible = false;
            changed = true;
        }
        roles.set(file + '::' + (item.id || item.slug || item.maltese), item.imageRole || 'none');
    }
    if (changed) fs.writeFileSync(location, JSON.stringify(data, null, 2) + '\n');
}
const records = save();
const missing = records.filter((entry) => !['image', 'swatch'].includes(entry.status)).map((entry) => ({ ...entry, ...missingDecision(entry) }));
function report(name, entries) {
    fs.writeFileSync(path.join(directory, name + '.json'), JSON.stringify(entries, null, 2) + '\n');
    const cell = (text) => String(text).replaceAll('|', '\\|');
    fs.writeFileSync(path.join(directory, name + '.md'), `# ${name.replaceAll('-', ' ')} (${entries.length} card entries)\n\n| Maltese | English | Page | Reason |\n| --- | --- | --- | --- |\n` + entries.map((entry) => '| ' + [entry.maltese, entry.english, entry.page || entry.file, entry.reason].map(cell).join(' | ') + ' |').join('\n') + '\n');
}
report('needs-image', missing.filter((entry) => entry.queue === 'needs-image'));
report('no-image-needed', missing.filter((entry) => entry.queue === 'no-image-needed'));
report('withdrawn-images', changes);
report('context-only', records.filter((entry) => entry.status === 'image' && roles.get(entry.file + '::' + entry.id) !== 'identifying').map((entry) => ({ ...entry, reason: 'Context cue only; not eligible for image-to-word quizzes. Original labelled artwork may reveal the answer.' })));
const audit = records.map((entry) => ({ ...entry, decision: entry.status === 'swatch' ? 'color-swatch' : entry.status === 'image' ? roles.get(entry.file + '::' + entry.id) === 'identifying' ? 'literal-image' : 'context-only' : missingDecision(entry).queue }));
fs.writeFileSync(path.join(directory, 'semantic-audit.json'), JSON.stringify(audit, null, 2) + '\n');
console.log({ withdrawn: changes.length, needsImage: missing.filter((entry) => entry.queue === 'needs-image').length, noImageNeeded: missing.filter((entry) => entry.queue === 'no-image-needed').length });
