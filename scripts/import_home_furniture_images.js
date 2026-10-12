const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { root, save } = require('./vocabulary_image_inventory');
const directory = path.join(root, 'docs/vocabulary-images');
const cc0 = [
    ['saqaf', 'roof', '282481/roof'],
    ['kcina', 'kitchen', '490818/kitchen-room'],
    ['kamra-tas-sodda', 'bedroom-furnishings', { url: 'https://openclipart.org/download/275615/20150927.svg', page: 'https://openclipart.org/detail/275615/bedroom', provider: 'Openclipart', author: 'loveandread' }],
    ['kamra-tal-banju', 'bathroom-interior', '75264/bathroom-furniture'],
    ['salott', 'living-room', '490835/living-room'],
    ['kamra-tal-ikel', 'dining-room', '22808/dining-room']
];
const references = [
    ['gnien', 'openmoji/1F3E1'],
    ['dar', 'openmoji/1F3E0'], ['bieb', 'cc0/classroom-door-closed'],
    ['tieqa', 'cc0/classroom-window-open'], ['gallarija', 'mdi/balcony'],
    ['garaxx', 'game-icons/home-garage'], ['studju', 'game-icons/desk'],
    ['mejda', 'game-icons/table'], ['siggu', 'openmoji/1FA91'],
    ['sufan', 'openmoji/1F6CB'], ['sodda', 'openmoji/1F6CF'],
    ['armarju', 'mdi/cupboard-outline'], ['lampa', 'openmoji/E163'],
    ['skrivanija', 'game-icons/desk'], ['frigg', 'game-icons/fridge'],
    ['xkaffa', 'cc0/shelf'], ['mera', 'openmoji/1FA9E']
];
async function main() {
    const manifests = ['downloaded-assets', 'game-icons-assets', 'mdi-assets', 'cc0-assets'].map((name) => JSON.parse(fs.readFileSync(path.join(directory, name + '.json'), 'utf8')));
    const assets = [];
    for (const [slug, name, source] of cc0) {
        const file = './assets/img/cc0/home-' + name + '.svg';
        const location = path.join(root, file);
        const info = typeof source === 'string' ? { url: 'https://www.svgrepo.com/show/' + source + '.svg', page: 'https://www.svgrepo.com/svg/' + source, provider: 'SVG Repo', author: 'SVG Repo (uploader)' } : source;
        const url = info.url;
        if (!fs.existsSync(location)) {
            const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
            if (!response.ok) throw new Error(name + ': HTTP ' + response.status);
            const svg = await response.text();
            if (!svg.includes('<svg') || /<script|<foreignObject|<image|\bon\w+\s*=/i.test(svg)) throw new Error(name + ': unsafe SVG');
            fs.writeFileSync(location, svg);
        }
        assets.push({ slug, file, ...info, license: 'CC0-1.0', changes: 'None', sha256: crypto.createHash('sha256').update(fs.readFileSync(location)).digest('hex') });
    }
    for (const [slug, name] of references) {
        const file = './assets/img/' + name + '.svg';
        const manifest = manifests.find((entry) => entry.assets.some((asset) => asset.file === file));
        if (!manifest) throw new Error('Uncredited original: ' + file);
        const asset = manifest.assets.find((entry) => entry.file === file);
        assets.push({ ...asset, slug, provider: asset.provider || manifest.provider, license: asset.license || manifest.license });
    }
    const location = path.join(root, 'assets/data/home_furniture.json');
    const data = JSON.parse(fs.readFileSync(location, 'utf8'));
    const replacementFile = path.join(directory, 'home-image-replacements.json');
    const replacements = fs.existsSync(replacementFile) ? JSON.parse(fs.readFileSync(replacementFile, 'utf8')) : [];
    for (const group of data.groups) for (const item of group.items) {
        const asset = assets.find((entry) => entry.slug === item.slug);
        if (!asset) throw new Error('Missing image for ' + item.slug);
        let replacement = replacements.find((entry) => entry.slug === item.slug);
        if (!replacement) { replacement = { file: 'home_furniture.json', slug: item.slug, maltese: item.maltese, oldImage: item.image || '' }; replacements.push(replacement); }
        replacement.newImage = asset.file;
        replacement.source = asset.page || asset.url;
        item.image = asset.file;
        item.imageSource = { provider: asset.provider, author: asset.author || 'Collection contributors', license: asset.license, url: asset.page || asset.url };
        item.imageQuizEligible = group.id === 'home-furniture' || ['bieb', 'tieqa', 'gallarija', 'garaxx'].includes(item.slug);
        item.imageRole = item.imageQuizEligible ? 'identifying' : 'context';
        item.imageAlt = (item.imageQuizEligible ? '' : 'Context illustration for ') + item.english;
    }
    fs.writeFileSync(location, JSON.stringify(data, null, 2) + '\n');
    fs.writeFileSync(replacementFile, JSON.stringify(replacements, null, 2) + '\n');
    const manifestFile = path.join(directory, 'home-assets.json');
    const previous = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')).assets : [];
    const retained = previous.filter((asset) => !assets.some((entry) => entry.file === asset.file));
    fs.writeFileSync(manifestFile, JSON.stringify({ changes: 'None. Original open-licensed artwork; room scenes and workspace cues are context-only.', assets: [...assets, ...retained] }, null, 2) + '\n');
    save();
    console.log('Replaced all ' + assets.length + ' Home and Furniture images');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
