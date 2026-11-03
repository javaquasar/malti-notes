/* Structural and coverage checks for the authored B3 pattern bank. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const bank = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/b3_practice_bank.json'), 'utf8'));
const original = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/b3_revision_exercises.json'), 'utf8'));
const provenance = JSON.parse(fs.readFileSync(path.join(root, 'docs/analysis/b3-provenance.json'), 'utf8')).files['assets/data/b3_practice_bank.json'];
const chapters = ['feelings', 'sport', 'calendar', 'festivals', 'people', 'ambitions', 'town'].map(id => 'b3-' + id);
const types = new Set(['multiple-choice', 'fill-blank', 'matching', 'order-words']);
const ids = new Set();
const patternIds = new Set();
const variantSignatures = new Set();
const transferSignatures = new Set();
const modes = {recognition: 0, production: 0};
const counts = {chapters: 0, patterns: 0, variants: 0, transfers: 0, finalItems: 0};
const normalize = value => String(value).normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
const nonempty = value => assert.ok(typeof value === 'string' && value.trim(), 'Expected nonempty text');
const bilingual = value => {assert.ok(value && typeof value === 'object'); nonempty(value.maltese); nonempty(value.english);};
const signature = item => JSON.stringify([item.type, normalize(item.prompt), normalize(item.answer || ''), item.pairs, item.tokens]);
const originalSignatures = new Set(original.sets.flatMap(set => set.items.map(signature)));

function checkItem(item, chapterId, patternId) {
  assert.ok(item && typeof item === 'object');
  assert.match(item.id, /^b3-[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(!ids.has(item.id), 'Duplicate item ID ' + item.id);ids.add(item.id);
  assert.equal(item.chapterId, chapterId);
  assert.equal(item.patternId, patternId);
  assert.ok(types.has(item.type), 'Unsupported exercise type ' + item.type);
  nonempty(item.prompt);nonempty(item.explanation);bilingual(item.reviewCard);
  const expectedMode = ['fill-blank', 'order-words'].includes(item.type) ? 'production' : 'recognition';
  assert.equal(item.assessmentMode, expectedMode);modes[expectedMode]++;
  if (item.type === 'multiple-choice') {
    assert.ok(Array.isArray(item.choices) && item.choices.length >= 3);
    assert.equal(new Set(item.choices.map(normalize)).size, item.choices.length);
    assert.ok(item.choices.includes(item.answer));
  } else if (item.type === 'fill-blank') {
    nonempty(item.answer);
    assert.ok(Array.isArray(item.accepted) && item.accepted.map(normalize).includes(normalize(item.answer)));
    assert.ok(item.accepted.some(answer => normalize(item.reviewCard.maltese).includes(normalize(answer))), 'Review card does not demonstrate the accepted answer '+item.id);
  } else if (item.type === 'matching') {
    assert.ok(Array.isArray(item.pairs) && item.pairs.length >= 3);
    item.pairs.forEach(pair => {nonempty(pair.left);nonempty(pair.right);});
    assert.equal(new Set(item.pairs.map(pair=>normalize(pair.left))).size, item.pairs.length);
    assert.equal(new Set(item.pairs.map(pair=>normalize(pair.right))).size, item.pairs.length);
  } else {
    assert.ok(Array.isArray(item.tokens) && item.tokens.length >= 2);
    assert.equal(normalize(item.tokens.join(' ')), normalize(item.answer));
  }
  assert.ok(!originalSignatures.has(signature(item)), 'Copied legacy exercise ' + item.id);
}

for (const file of fs.readdirSync(path.join(root, 'assets/data')).filter(file=>/^b3.*\.json$/.test(file))) {
  const runtimeText=fs.readFileSync(path.join(root, 'assets/data',file),'utf8');
  assert.doesNotMatch(runtimeText,/Malti\.B|book-aligned|Book pp\.|book mastery|the book uses|Ktieb tal-istudent/i,file+' must remain standalone');
}
assert.equal(bank.alignment,undefined);
assert.equal(bank.schemaVersion, 1);
assert.deepEqual(bank.source, {kind:'site', page:'b3_revision.html'});
assert.equal(provenance.alignment.sourcePdfSha256, '7fad01fe8b636de0d7ffefdfdcd34ca5b95d18be1ca21c89106c798330234f76');
assert.deepEqual(bank.chapters.map(chapter=>chapter.id), chapters);
bank.chapters.forEach(chapter => {
  counts.chapters++;
  nonempty(chapter.title);
  assert.ok(chapter.patterns.length >= 3, 'Insufficient patterns in ' + chapter.id);
  assert.ok(chapter.patterns.flatMap(pattern=>pattern.variants).length >= 18, 'Insufficient variants in ' + chapter.id);
  const chapterTypes = new Set();
  chapter.patterns.forEach(pattern => {
    counts.patterns++;
    assert.ok(pattern.id.startsWith(chapter.id+'-'));
    assert.ok(!patternIds.has(pattern.id));patternIds.add(pattern.id);
    nonempty(pattern.title);nonempty(pattern.explanation);
    bilingual(pattern.contrast);bilingual(pattern.model);
    assert.equal(provenance.patterns[pattern.id].book, 'Malti.B 3');
    assert.ok(provenance.patterns[pattern.id].printedPages.length && provenance.patterns[pattern.id].printedPages.every(page=>Number.isInteger(page)&&page>=3&&page<=92));
    assert.ok(pattern.variants.length >= 6);
    const patternModes = new Set();
    pattern.variants.forEach(item => {
      checkItem(item,chapter.id,pattern.id);counts.variants++;
      chapterTypes.add(item.type);patternModes.add(item.assessmentMode);
      const key=signature(item);assert.ok(!variantSignatures.has(key), 'Repeated variant '+item.id);variantSignatures.add(key);
    });
    assert.deepEqual([...patternModes].sort(), ['production','recognition']);
    checkItem(pattern.transfer,chapter.id,pattern.id);counts.transfers++;
    assert.equal(pattern.transfer.assessmentMode,'production','Recovery transfer must require an independent response');
    assert.ok(!variantSignatures.has(signature(pattern.transfer)),'Recovery copies an earlier variant');
    transferSignatures.add(signature(pattern.transfer));
  });
  assert.deepEqual([...chapterTypes].sort(), [...types].sort(), 'Missing question interaction in ' + chapter.id);
});

assert.equal(bank.finalSet.id,'b3-transfer-check');
assert.equal(bank.finalSet.items.length,14);
assert.equal(bank.finalSet.passPercent,70);
const seenFinal = new Set();
bank.finalSet.items.forEach(item => {
  assert.ok(chapters.includes(item.chapterId));assert.ok(patternIds.has(item.patternId));
  checkItem(item,item.chapterId,item.patternId);counts.finalItems++;
  const key=signature(item);assert.ok(!variantSignatures.has(key),'Final copies a training variant');
  assert.ok(!transferSignatures.has(key),'Final copies a recovery question');
  assert.ok(!seenFinal.has(key));seenFinal.add(key);
});
chapters.forEach(chapterId => {
  const items=bank.finalSet.items.filter(item=>item.chapterId===chapterId);
  assert.equal(items.length,2,'Final must sample every chapter equally');
  assert.deepEqual(items.map(item=>item.assessmentMode).sort(),['production','recognition']);
});
const choiceItems = bank.chapters.flatMap(chapter=>chapter.patterns.flatMap(pattern=>pattern.variants)).filter(item=>item.type==='multiple-choice');
assert.ok(new Set(choiceItems.map(item=>item.choices.indexOf(item.answer))).size>=3,'Correct choice positions must vary');
console.log('PASS B3 authored content: '+JSON.stringify({...counts,...modes}));
