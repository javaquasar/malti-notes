const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function vocabularyFiles() {
    const files = new Map();
    for (const page of fs.readdirSync(root).filter((name) => name.endsWith('.html'))) {
        const html = fs.readFileSync(path.join(root, page), 'utf8');
        const config = html.match(/(?:window\.)?MaltiVocabReviewPage\s*=\s*\{([\s\S]*?)\};/);
        const url = config?.[1].match(/dataUrl:\s*["']\.\/assets\/data\/([^"']+)["']/)?.[1];
        if (url) files.set(url, page);
    }
    files.set('year4_vocabulary.json', 'year4_exam.html');
    return files;
}
function inventory() {
    const records = [];
    for (const [file, page] of vocabularyFiles()) {
        const data = JSON.parse(fs.readFileSync(path.join(root, 'assets/data', file), 'utf8'));
        for (const group of data.groups || []) for (const item of group.items || []) {
            if (!item.maltese || !item.english) continue;
            const image = item.image || '';
            const placeholder = image.includes('favicon');
            const exists = image && !/^https?:/.test(image) && fs.existsSync(path.resolve(root, image));
            const status = placeholder ? 'placeholder' : image ? (exists ? 'image' : 'missing-file') : item.swatchStyle ? 'swatch' : 'no-image';
            records.push({ file, page, group: group.id, id: item.id || item.slug || item.maltese, maltese: item.maltese, english: item.english, image, status });
        }
    }
    return records;
}
function save(prefix = 'current') {
    const records = inventory();
    const directory = path.join(root, 'docs/vocabulary-images');
    fs.mkdirSync(directory, { recursive: true });
    const categories = { 'with-images': records.filter((r) => r.status === 'image'), 'without-images': records.filter((r) => r.status !== 'image' && r.status !== 'swatch'), 'with-swatches': records.filter((r) => r.status === 'swatch') };
    for (const [name, items] of Object.entries(categories)) {
        const stem = path.join(directory, prefix + '-' + name);
        fs.writeFileSync(stem + '.json', JSON.stringify(items, null, 2) + '\n');
        const cell = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
        fs.writeFileSync(stem + '.md', `# ${name.replaceAll('-', ' ')} (${items.length} card entries)\n\n| Maltese | English | Page | Group | Image/status |\n| --- | --- | --- | --- | --- |\n` + items.map((r) => '| ' + [r.maltese, r.english, r.page, r.group, r.image || r.status].map(cell).join(' | ') + ' |').join('\n') + '\n');
    }
    console.log(JSON.stringify({ snapshot: prefix, total: records.length, withImages: categories['with-images'].length, withoutImages: categories['without-images'].length, swatches: categories['with-swatches'].length }));
    return records;
}
if (require.main === module) save(process.argv[2] || 'current');
module.exports = { root, vocabularyFiles, inventory, save };
