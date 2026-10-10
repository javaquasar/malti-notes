const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { root, vocabularyFiles, save } = require('./vocabulary_image_inventory');
const revision = '9e04201d4557e729822fb57f62a316c3dea1d4a8';
const replacements = [
    ['wardrobe-outline', ['wardrobe']], ['cupboard-outline', ['wardrobe / cupboard']],
    ['balcony', ['balcony']], ['bottle-wine-outline', ['bottle of red wine']], ['pot-steam-outline', ['pot']]
];
const identifying = new Set(('eye|nose|mouth|ear|hand|teeth|door|window|bed|chair|sofa|television|mirror|lamp|armchair|bread|cheese|egg|rice|potato|potatoes|tomato|tomatoes|carrot|carrots|pizza|meat cut|fish|pasta|butter|coffee|tea|milk|salt|pepper|pie|biscuit|banana|pear|watermelon|melon|peach|lemon|onion|garlic|mushroom|cucumber|aubergine|ant|mosquito|fly|cockroach|bee|spider|snail|cow|turtle|rabbit|bird|lion|elephant|dog|parrot|duck|cat|snake|pig|suitcase|gift|robot|soap|toilet|drum|hat|tie|socks|scarf|shorts|grapes|bowl|bicycle|airplane|ambulance|anchor|spider web|astronaut|shower|eraser|chocolate|pen|pencil|calculator|scissors|computer|trousers|dress|jacket|shoe|table|desk|fridge|sink|pillow|skirt|towel|waterfall|cave|cliff|aquarium|wardrobe|balcony|pot|cup|strawberry').split('|'));
const uncountable = new Set('bread|cheese|rice|pasta|butter|coffee|tea|milk|salt|pepper|soap|chocolate'.split('|'));
const norm = (text) => String(text || '').replace(/[’`]/g, "'").trim().toLocaleLowerCase('mt');
const exampleTranslations = {
    'Nixtieq kartuna bajd.': 'I would like a box of eggs.',
    'Fil-kċina hemm borża ross.': 'There is a bag of rice in the kitchen.',
    'Irrid pakkett għaġin.': 'I want a packet of pasta.',
    'Xtrajna bott piżelli.': 'We bought a tin of peas.',
    'Din hija kaxxa frawli.': 'This is a box of strawberries.',
    'Se nsajjar kapuljat.': 'I am going to cook minced meat.',
    'Nixtieq ftit perżut.': 'I would like some ham.',
    'Hemm flixkun inbid aħmar fuq il-mejda.': 'There is a bottle of red wine on the table.',
    'Għandi ras kbira.': 'I have a big head.',
    'Xi kultant nimxi d-dar.': 'Sometimes I walk home.'
};
function bankExamples(file) {
    const location = path.join(root, 'assets/data', file.replace('.json', '_examples.json'));
    if (!fs.existsSync(location)) return [];
    const pairs = [];
    function visit(value) {
        if (!value || typeof value !== 'object' || value.verificationStatus === 'needs-review') return;
        if (value.maltese && value.english && !value.question && String(value.maltese).split(/\s+/).length > 1) pairs.push({ example: value.maltese, exampleTranslation: value.english, exampleSource: 'topic example bank' });
        Object.values(value).forEach(visit);
    }
    visit(JSON.parse(fs.readFileSync(location, 'utf8')));
    return pairs;
}
async function main() {
    const directory = path.join(root, 'assets/img/mdi');
    fs.mkdirSync(directory, { recursive: true });
    const metadata = await (await fetch(`https://raw.githubusercontent.com/Templarian/MaterialDesign-SVG/${revision}/meta.json`)).json();
    const assets = [];
    for (const [name] of replacements) {
        const url = `https://raw.githubusercontent.com/Templarian/MaterialDesign-SVG/${revision}/svg/${name}.svg`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Could not download ${name}`);
        const svg = await response.text();
        if (!svg.includes('<svg') || /<script|<foreignObject|<image|\bon\w+\s*=/i.test(svg)) throw new Error('Invalid SVG');
        const file = './assets/img/mdi/' + name + '.svg';
        fs.writeFileSync(path.join(root, file), svg);
        assets.push({ name, file, url, author: metadata.find((item) => item.name === name).author, sha256: crypto.createHash('sha256').update(svg).digest('hex') });
    }
    const license = await fetch(`https://raw.githubusercontent.com/Templarian/MaterialDesign-SVG/${revision}/LICENSE`);
    if (!license.ok) throw new Error('License unavailable');
    fs.writeFileSync(path.join(directory, 'LICENSE.txt'), await license.text());
    const apache = await fetch('https://www.apache.org/licenses/LICENSE-2.0.txt');
    if (!apache.ok) throw new Error('Apache license unavailable');
    fs.writeFileSync(path.join(directory, 'Apache-2.0.txt'), await apache.text());
    fs.writeFileSync(path.join(root, 'docs/vocabulary-images/mdi-assets.json'), JSON.stringify({ provider: 'Pictogrammers', revision, license: 'Apache-2.0', licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0', changes: 'None', assets }, null, 2) + '\n');
    const audit = [];
    for (const [file] of vocabularyFiles()) {
        const location = path.join(root, 'assets/data', file);
        const data = JSON.parse(fs.readFileSync(location, 'utf8'));
        const examples = bankExamples(file);
        for (const group of data.groups || []) for (const item of group.items || []) {
            if (!item.maltese || !item.english) continue;
            const replacement = replacements.find((entry) => entry[1].includes(item.english));
            if (replacement && (!item.image || item.imageSource)) {
                const asset = assets.find((asset) => asset.name === replacement[0]);
                item.image = asset.file;
                item.imageAlt = item.english;
                item.imageSource = { provider: 'Pictogrammers', author: asset.author, license: 'Apache-2.0', url: asset.url };
            }
            const gloss = item.english.split(' -> ')[0].toLowerCase();
            item.imageQuizEligible = !!item.swatchStyle || !!(item.image && !item.image.includes('favicon') &&
                (identifying.has(gloss) || (!item.imageSource && !item.image.includes('/openmoji/'))));
            item.imageRole = item.swatchStyle ? 'identifying' : !item.image ? 'none' : item.imageQuizEligible ? 'identifying' : 'context';
            if (item.imageRole === 'context' && item.imageSource) item.imageAlt = 'Context illustration for ' + item.english;
            if (!item.exampleTranslation && exampleTranslations[item.example]) {
                item.exampleTranslation = exampleTranslations[item.example];
                item.exampleSource = 'translated topic example';
            }
            if (!item.exampleTranslation) {
                const exact = examples.find((pair) => norm(pair.example) === norm(item.example));
                const words = norm(item.maltese.split(/ -> | \/ /)[0]);
                const found = exact || examples.find((pair) => (' ' + norm(pair.example).replace(/[.,!?]/g, ' ') + ' ').includes(' ' + words + ' '));
                if (found) Object.assign(item, found);
                else if (identifying.has(gloss) && !/[\/\[\]]/.test(item.maltese)) {
                    const term = item.maltese.split(' -> ')[0];
                    const plural = ['potatoes', 'tomatoes', 'carrots', 'teeth', 'trousers', 'scissors', 'socks', 'shorts', 'grapes'].includes(gloss);
                    const article = uncountable.has(gloss) || plural ? '' : /^[aeiou]/.test(gloss) ? 'an ' : 'a ';
                    Object.assign(item, { example: 'Nara ' + term + '.', exampleTranslation: 'I see ' + article + gloss + '.', exampleSource: 'simple object example' });
                }
            }
            audit.push({ file, id: item.slug || item.id || item.maltese, maltese: item.maltese, english: item.english, imageRole: item.imageRole, imageQuizEligible: item.imageQuizEligible, exampleReady: !!(item.example && item.exampleTranslation) });
        }
        fs.writeFileSync(location, JSON.stringify(data, null, 2) + '\n');
    }
    fs.writeFileSync(path.join(root, 'docs/vocabulary-images/teaching-audit.json'), JSON.stringify(audit, null, 2) + '\n');
    save();
    console.log({ quizImages: audit.filter((item) => item.imageQuizEligible).length, pairedExamples: audit.filter((item) => item.exampleReady).length });
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
