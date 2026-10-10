const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { root, vocabularyFiles, save } = require('./vocabulary_image_inventory');

// Explicit glosses only: related objects are not interchangeable illustrations.
const entries = [
    ['caro-asercion', 'fridge', ['fridge']],
    ['caro-asercion', 'sink', ['sink']],
    ['delapouite', 'table', ['table', 'our table']],
    ['delapouite', 'desk', ['desk']],
    ['delapouite', 'bookshelf', ['shelf']],
    ['delapouite', 'pillow', ['pillow']],
    ['delapouite', 'skirt', ['skirt']],
    ['delapouite', 'towel', ['towel']],
    ['delapouite', 'waterfall', ['waterfall', 'waterfalls', 'waterfall / waterfalls']],
    ['delapouite', 'cave-entrance', ['cave']],
    ['delapouite', 'sea-cliff', ['cliff', 'cliffs', 'cliff / cliffs']],
    ['delapouite', 'crossroad', ['crossroads']],
    ['delapouite', 'aquarium', ['aquarium']]
];
const aliases = new Map(entries.flatMap((entry) => entry[2].map((word) => [word, entry])));
const directory = path.join(root, 'assets/img/game-icons');

async function main() {
    fs.mkdirSync(directory, { recursive: true });
    const assets = [];
    for (const [author, name] of entries) {
        const url = `https://game-icons.net/icons/000000/transparent/1x1/${author}/${name}.svg`;
        const file = `./assets/img/game-icons/${name}.svg`;
        const destination = path.join(root, file);
        if (!fs.existsSync(destination)) {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
            const svg = await response.text();
            if (!svg.includes('<svg') || /<script|<foreignObject|<image|\bon\w+\s*=|(?:href|url)\s*\(?(?:["'])?https?:/i.test(svg)) throw new Error(`Unsafe SVG: ${name}`);
            fs.writeFileSync(destination, svg);
        }
        assets.push({ name, author: author === 'caro-asercion' ? 'Caro Asercion' : 'Delapouite', file, url,
            page: `https://game-icons.net/1x1/${author}/${name}.html`,
            sha256: crypto.createHash('sha256').update(fs.readFileSync(destination)).digest('hex') });
    }
    let updated = 0;
    for (const [file] of vocabularyFiles()) {
        const location = path.join(root, 'assets/data', file);
        const data = JSON.parse(fs.readFileSync(location, 'utf8'));
        let changed = false;
        for (const group of data.groups || []) for (const item of group.items || []) {
            const entry = aliases.get((item.english || '').toLowerCase());
            if (!entry || item.swatchStyle) continue;
            // Replace only our fish placeholder for aquarium, never a pre-existing illustration.
            if (item.image && !item.image.includes('favicon') && !(entry[1] === 'aquarium' && item.imageSource?.provider === 'OpenMoji')) continue;
            const asset = assets.find((asset) => asset.name === entry[1]);
            item.image = asset.file;
            item.imageAlt = item.english;
            item.imageSource = { provider: 'Game-icons.net', author: asset.author, license: 'CC BY 3.0', url: asset.page };
            updated++; changed = true;
        }
        if (changed) fs.writeFileSync(location, JSON.stringify(data, null, 2) + '\n');
    }
    fs.writeFileSync(path.join(root, 'docs/vocabulary-images/game-icons-assets.json'), JSON.stringify({
        provider: 'Game-icons.net', license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
        changes: 'None; original black-on-transparent exports.', assets
    }, null, 2) + '\n');
    save();
    console.log(`Added or improved ${updated} cards with Game-icons.net images.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
