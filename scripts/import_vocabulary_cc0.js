const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { root, vocabularyFiles, save } = require('./vocabulary_image_inventory');

const sources = [
    ...[
        ['window-open', 'tieqa', 'window', '138395/opened-window-door-of-glasses'],
        ['door-closed', 'bieb', 'door', '288905/door-close'],
        ['library', 'librerija', 'library', '25649/students-reading-sitting-in-a-library'],
        ['board', 'bord', 'board', '181999/blackboard-class']
    ].map(([name, slug, gloss, source]) => ({ name: 'classroom-' + name, slug, onlyFile: 'school_classroom.json', gloss, provider: 'SVG Repo', author: 'SVG Repo (uploader)', page: 'https://www.svgrepo.com/svg/' + source, url: 'https://www.svgrepo.com/show/' + source + '.svg' })),
    ...[
        ['bedside-table', 'small bedside table', '206915/bedside-table'],
        ['rug', 'rug', '78546/rug'],
        ['pond', 'pond', '159603/pond'],
        ['walnut', 'walnuts', '447082/walnut'],
        ['blackboard', 'board', '156356/blackboard'],
        ['sugar', 'sugar', '147886/sugar'],
        ['shelf', 'shelf', '103115/shelf']
    ].map(([name, gloss, source]) => ({ name, gloss, provider: 'SVG Repo', author: 'SVG Repo (uploader)', page: 'https://www.svgrepo.com/svg/' + source, url: 'https://www.svgrepo.com/show/' + source + '.svg' })),
    { name: 'wasp', gloss: 'wasp', provider: 'Openclipart', author: 'Juhele (uploader), publicdomainq.net', page: 'https://openclipart.org/detail/285334/wasp', url: 'https://openclipart.org/download/285334/publicdomainq-wasp.svg' },
    { name: 'cauliflower', gloss: 'cauliflower', provider: 'Openclipart', author: 'cactus cowboy', page: 'https://commons.wikimedia.org/wiki/File:Cauliflower.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Cauliflower.svg' },
    { name: 'glue', gloss: 'glue', provider: 'SVG Repo', author: 'SVG Repo (uploader)', page: 'https://www.svgrepo.com/svg/288207/glue-bottle', url: 'https://www.svgrepo.com/show/288207/glue-bottle.svg' }
];

const classroomReferences = [
    { slug: 'mejda', file: './assets/img/game-icons/table.svg', gloss: 'table / desk', provider: 'Game-icons.net', author: 'Delapouite', license: 'CC BY 3.0', page: 'https://game-icons.net/1x1/delapouite/table.html' },
    { slug: 'siggu', file: './assets/img/openmoji/1FA91.svg', gloss: 'chair', provider: 'OpenMoji', author: 'HfG Schwabisch Gmund and contributors', license: 'CC BY-SA 4.0', page: 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/aeb8bb3a59e2de39c754ac79180c8131c906acea/color/svg/1FA91.svg' }
];

async function main() {
    const replacementFile = path.join(root, 'docs/vocabulary-images/classroom-image-replacements.json');
    const replacements = fs.existsSync(replacementFile) ? JSON.parse(fs.readFileSync(replacementFile, 'utf8')) : [];
    const directory = path.join(root, 'assets/img/cc0');
    fs.mkdirSync(directory, { recursive: true });
    const assets = [];
    for (const source of sources) {
        const file = './assets/img/cc0/' + source.name + '.svg';
        const destination = path.join(root, file);
        if (!fs.existsSync(destination)) {
            const response = await fetch(source.url, { headers: { 'User-Agent': 'MaltiNotes/1.0 vocabulary artwork import' }, signal: AbortSignal.timeout(30000) });
            if (!response.ok) throw new Error(`${source.name}: HTTP ${response.status}`);
            const svg = await response.text();
            if (!svg.includes('<svg') || /<script|<foreignObject|<image|\bon\w+\s*=/i.test(svg)) throw new Error(`${source.name}: unsafe SVG`);
            fs.writeFileSync(destination, svg);
        }
        const svg = fs.readFileSync(destination, 'utf8');
        assets.push({ ...source, file, license: 'CC0-1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', changes: 'None', sha256: crypto.createHash('sha256').update(svg).digest('hex') });
    }
    for (const [file] of vocabularyFiles()) {
        const location = path.join(root, 'assets/data', file);
        const data = JSON.parse(fs.readFileSync(location, 'utf8'));
        for (const group of data.groups || []) for (const item of group.items || []) {
            const reference = file === 'school_classroom.json' && classroomReferences.find((source) => source.slug === item.slug);
            const override = reference || assets.find((source) => source.onlyFile === file && source.slug === item.slug);
            const asset = override || assets.find((source) => !source.onlyFile && source.gloss === String(item.english).split(' -> ')[0]);
            const replaceApproximation = (asset?.gloss === 'sugar' && item.imageSource?.provider === 'OpenMoji') || (asset?.gloss === 'shelf' && item.imageSource?.provider === 'Game-icons.net');
            if (!asset || (!override && item.image && !item.image.includes('favicon') && !item.image.includes('/cc0/') && !replaceApproximation)) continue;
            if (!fs.existsSync(path.join(root, asset.file))) throw new Error('Missing original classroom asset: ' + asset.file);
            if (override) {
                let entry = replacements.find((entry) => entry.slug === item.slug);
                if (!entry) { entry = { file, slug: item.slug, maltese: item.maltese, oldImage: item.image || '' }; replacements.push(entry); }
                entry.newImage = asset.file;
                entry.source = asset.page;
            }
            item.image = asset.file;
            item.imageAlt = asset.gloss;
            item.imageSource = { provider: asset.provider, author: asset.author, license: asset.license, url: asset.page };
        }
        fs.writeFileSync(location, JSON.stringify(data, null, 2) + '\n');
    }
    const manifestFile = path.join(root, 'docs/vocabulary-images/cc0-assets.json');
    const oldAssets = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')).assets : [];
    for (const asset of oldAssets) if (!assets.some((entry) => entry.file === asset.file)) assets.push(asset);
    fs.writeFileSync(manifestFile, JSON.stringify({ license: 'CC0-1.0', assets }, null, 2) + '\n');
    fs.writeFileSync(replacementFile, JSON.stringify(replacements, null, 2) + '\n');
    save();
    console.log(`Imported ${assets.length} unmodified CC0 SVGs`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
