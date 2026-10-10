const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { root, vocabularyFiles, save } = require('./vocabulary_image_inventory');

const sources = [
    { name: 'wasp', gloss: 'wasp', provider: 'Openclipart', author: 'Juhele (uploader), publicdomainq.net', page: 'https://openclipart.org/detail/285334/wasp', url: 'https://openclipart.org/download/285334/publicdomainq-wasp.svg' },
    { name: 'cauliflower', gloss: 'cauliflower', provider: 'Openclipart', author: 'cactus cowboy', page: 'https://commons.wikimedia.org/wiki/File:Cauliflower.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Cauliflower.svg' },
    { name: 'glue', gloss: 'glue', provider: 'SVG Repo', author: 'SVG Repo (uploader)', page: 'https://www.svgrepo.com/svg/288207/glue-bottle', url: 'https://www.svgrepo.com/show/288207/glue-bottle.svg' }
];

async function main() {
    const directory = path.join(root, 'assets/img/cc0');
    fs.mkdirSync(directory, { recursive: true });
    const assets = [];
    for (const source of sources) {
        const response = await fetch(source.url, { headers: { 'User-Agent': 'MaltiNotes/1.0 vocabulary artwork import' } });
        if (!response.ok) throw new Error(`${source.name}: HTTP ${response.status}`);
        const svg = await response.text();
        if (!svg.includes('<svg') || /<script|<foreignObject|<image|\bon\w+\s*=/i.test(svg)) throw new Error(`${source.name}: unsafe SVG`);
        const file = './assets/img/cc0/' + source.name + '.svg';
        fs.writeFileSync(path.join(root, file), svg);
        assets.push({ ...source, file, license: 'CC0-1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', changes: 'None', sha256: crypto.createHash('sha256').update(svg).digest('hex') });
    }
    for (const [file] of vocabularyFiles()) {
        const location = path.join(root, 'assets/data', file);
        const data = JSON.parse(fs.readFileSync(location, 'utf8'));
        for (const group of data.groups || []) for (const item of group.items || []) {
            const asset = assets.find((source) => source.gloss === String(item.english).split(' -> ')[0]);
            if (!asset || (item.image && !item.image.includes('favicon') && !item.image.includes('/cc0/'))) continue;
            item.image = asset.file;
            item.imageAlt = asset.gloss;
            item.imageSource = { provider: asset.provider, author: asset.author, license: asset.license, url: asset.page };
        }
        fs.writeFileSync(location, JSON.stringify(data, null, 2) + '\n');
    }
    fs.writeFileSync(path.join(root, 'docs/vocabulary-images/cc0-assets.json'), JSON.stringify({ license: 'CC0-1.0', assets }, null, 2) + '\n');
    save();
    console.log(`Imported ${assets.length} unmodified CC0 SVGs`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
