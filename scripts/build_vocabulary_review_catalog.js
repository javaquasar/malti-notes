const fs = require('node:fs');
const path = require('node:path');
const { root, vocabularyFiles } = require('./vocabulary_image_inventory');
const normalize = (text) => String(text).replace(/[’`´]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();
const words = new Map();
function add(item, prefix, sourcePage) {
    if (!item.maltese || !item.english || item.verificationStatus === 'needs-review') return;
    const id = 'word::' + prefix + '::' + normalize(item.slug || item.maltese);
    if (words.has(id)) return;
    words.set(id, { id, sourcePage, maltese: item.maltese, english: item.english,
        image: item.image || '', imageAlt: item.imageAlt || item.english,
        imageRole: item.imageRole || 'none', imageQuizEligible: item.imageQuizEligible === true,
        swatchStyle: item.swatchStyle || '', example: item.example || '', exampleTranslation: item.exampleTranslation || '' });
}
for (const [file, page] of vocabularyFiles()) {
    const data = JSON.parse(fs.readFileSync(path.join(root, 'assets/data', file), 'utf8'));
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    const config = html.match(/(?:window\.)?MaltiVocabReviewPage\s*=\s*\{([\s\S]*?)\};/)?.[1];
    const prefix = file === 'year4_vocabulary.json' ? 'year-4-exam' : config?.match(/reviewPrefix:\s*["']([^"']+)["']/)?.[1];
    if (!prefix) throw new Error('Missing review prefix: ' + page);
    for (const group of data.groups || []) for (const item of group.items || []) add(item, prefix, page);
}
const year4 = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/year4_revision_vocabulary.json'), 'utf8'));
for (const collection of year4.collections) for (const group of collection.groups) for (const item of group.items) add(item, 'year-4-exam', 'year4_exam.html');
const output = JSON.stringify({ words: Object.fromEntries(words) }, null, 2) + '\n';
const file = path.join(root, 'assets/data/vocabulary_review_catalog.json');
if (process.argv.includes('--check')) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== output) throw new Error('Vocabulary review catalog needs rebuilding.');
} else fs.writeFileSync(file, output);
console.log(`ok vocabulary review catalog: ${words.size} entries`);
