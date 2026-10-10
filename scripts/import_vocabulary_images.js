const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { root, vocabularyFiles, inventory, save } = require('./vocabulary_image_inventory');
const config = require('../assets/data/vocabulary_image_sources.json');
const directory = path.join(root, 'assets/img/openmoji');
const aliases = new Map(Object.entries(config.aliases).flatMap(([code, words]) => words.map((word) => [word.toLowerCase(), code])));
function match(item) {
    if (item.maltese === 'hamster' && item.english === 'same in English') return '1F439';
    // Collective cards name both singular and plural; match only their explicit singular gloss.
    return aliases.get(item.english.toLowerCase().split(' -> ')[0]);
}
async function download(code) {
    const url = `https://raw.githubusercontent.com/hfg-gmuend/openmoji/${config.revision}/color/svg/${code}.svg`;
    const destination = path.join(directory, code + '.svg');
    if (!fs.existsSync(destination)) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${code}: HTTP ${response.status}`);
        const svg = await response.text();
        if (!svg.includes('<svg') || /<script|<foreignObject|<image|\bon\w+\s*=|(?:href|url)\s*\(?(?:["'])?https?:/i.test(svg)) throw new Error(`Unsafe or invalid SVG: ${code}`);
        fs.writeFileSync(destination, svg);
    }
    const svg = fs.readFileSync(destination);
    return { code, file: './assets/img/openmoji/' + code + '.svg', url, sha256: crypto.createHash('sha256').update(svg).digest('hex') };
}
async function main() {
    fs.mkdirSync(directory, { recursive: true });
    const candidates = inventory().filter((item) => item.status !== 'swatch' && match(item) &&
        (item.status !== 'image' || (item.image.includes('/openmoji/') && item.image !== './assets/img/openmoji/' + match(item) + '.svg')));
    const codes = [...new Set(candidates.map(match))];
    const manifest = [];
    for (const code of codes) manifest.push(await download(code));
    const licenseUrl = `https://raw.githubusercontent.com/hfg-gmuend/openmoji/${config.revision}/LICENSE.txt`;
    const response = await fetch(licenseUrl);
    if (!response.ok) throw new Error('Could not download the original graphics license.');
    fs.writeFileSync(path.join(directory, 'LICENSE.txt'), await response.text());
    let updated = 0;
    for (const [file] of vocabularyFiles()) {
        const location = path.join(root, 'assets/data', file);
        const data = JSON.parse(fs.readFileSync(location, 'utf8'));
        let changed = false;
        for (const group of data.groups || []) for (const item of group.items || []) {
            const code = match(item);
            if (!code) continue;
            const expected = './assets/img/openmoji/' + code + '.svg';
            if (item.swatchStyle || !item.english || (item.image && !item.image.includes('favicon') &&
                !(item.imageSource?.provider === 'OpenMoji' && item.image !== expected))) continue;
            item.image = './assets/img/openmoji/' + code + '.svg';
            item.imageAlt = item.english;
            item.imageSource = { provider: 'OpenMoji', license: config.license, url: manifest.find((asset) => asset.code === code).url };
            changed = true; updated++;
        }
        if (changed) fs.writeFileSync(location, JSON.stringify(data, null, 2) + '\n');
    }
    const allFiles = fs.readdirSync(directory).filter((file) => file.endsWith('.svg'));
    const allAssets = allFiles.map((file) => {
        const code = path.basename(file, '.svg');
        return manifest.find((asset) => asset.code === code) || { code, file: './assets/img/openmoji/' + file, url: `https://raw.githubusercontent.com/hfg-gmuend/openmoji/${config.revision}/color/svg/${file}`, sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(directory, file))).digest('hex') };
    });
    fs.writeFileSync(path.join(root, 'docs/vocabulary-images/downloaded-assets.json'), JSON.stringify({ ...config, aliases: undefined, assets: allAssets }, null, 2) + '\n');
    save();
    console.log(`Downloaded ${codes.length} SVGs; added images to ${updated} previously unillustrated cards.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
