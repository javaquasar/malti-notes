/* Source sentence corrections keep saved review history and never enrol new cards. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const key = 'malti_review_cards_v2';
const clone = value => JSON.parse(JSON.stringify(value));
let checks = 0;
function equal(actual, expected, label) {
    checks += 1;
    assert.deepEqual(clone(actual), clone(expected), label);
}
function harness(initial = {}) {
    let state = clone(initial), writes = 0;
    const context = { window: { MaltiStorage: {
        getJson(name, fallback) { assert.equal(name, key); return clone(state || fallback); },
        setJson(name, value) { assert.equal(name, key); state = clone(value); writes += 1; }
    } } };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/review-store.js'), 'utf8'), context);
    return { store: context.window.MaltiReviewStore, context,
        state: () => clone(state), writes: () => writes };
}
const canonical = 'sentence::colors::white-shirt';
const legacy = 'sentence::colors::il-qmis abjad.';
const page = 'colors_maltese.html';
const history = {
    addedAt: '2026-07-01T12:00:00.000Z', box: 4, reviewCount: 11,
    nextReviewAt: '2026-12-01T12:00:00.000Z', lastReviewedAt: '2026-11-04T12:00:00.000Z',
    personalNote: 'Remember the noun gender', customMetadata: { confidence: 0.75 }
};
function card(id = legacy, overrides = {}) {
    return { id, type: 'sentence-card', contentType: 'example', sourcePage: page,
        maltese: 'Il-qmis abjad.', english: 'The shirt is white.',
        displayMaltese: 'Il-qmis abjad.', normalizedMaltese: 'il-qmis abjad.',
        prompt: 'Il-qmis abjad.', answer: 'The shirt is white.', ...clone(history), ...overrides };
}
function correction(overrides = {}) {
    return { id: canonical, legacyIds: [legacy], sourcePage: page, contentType: 'example',
        maltese: 'Il-qmis bajda.', english: 'The shirt is white.',
        prompt: 'Il-qmis bajda.', answer: 'The shirt is white.',
        questionTranslation: '', answerTranslation: '', ...overrides };
}
function preserved(actual, expected = history) {
    for (const [field, value] of Object.entries(expected)) equal(actual[field], value, `Preserve ${field}`);
}

// A content correction cannot silently add a source card to an empty queue.
{
    const h = harness();
    equal(h.store.syncSentenceContent([correction()]), { changed: false, updated: 0, migrated: 0, conflicts: [] }, 'No implicit enrolment');
    equal(h.state(), {}, 'Queue stays empty');
    equal(h.writes(), 0, 'No needless storage event');
}
// Legacy-only migration preserves every historical/custom field and removes its duplicate atomically.
{
    const unrelated = card('sentence::food::example', { sourcePage: 'food.html' });
    const h = harness({ [legacy]: card(), [unrelated.id]: unrelated });
    equal(h.store.syncSentenceContent([correction({ legacyIds: [legacy, legacy, ''] })]),
        { changed: true, updated: 1, migrated: 1, conflicts: [] }, 'Migrate legacy once');
    const state = h.state(), actual = state[canonical];
    equal(Object.keys(state).sort(), [canonical, unrelated.id].sort(), 'Only intended IDs change');
    equal(state[unrelated.id], unrelated, 'Unrelated cards untouched');
    preserved(actual);
    equal(actual.maltese, 'Il-qmis bajda.', 'Correct the saved Maltese');
    equal(actual.prompt, 'Il-qmis bajda.', 'Correct the saved prompt');
    equal(actual.displayMaltese, actual.maltese, 'Refresh display label');
    equal(actual.normalizedMaltese, 'il-qmis bajda.', 'Refresh normalized label');
    equal(h.writes(), 1, 'One atomic storage write');
    equal(h.store.syncSentenceContent([correction()]), { changed: false, updated: 0, migrated: 0, conflicts: [] }, 'Idempotent migration');
    equal(h.writes(), 1, 'Idempotent call emits no storage write');
}
// Existing stable Q&A IDs are corrected in place, including separate translations and empty optional values.
{
    const h = harness({ [canonical]: card(canonical, { questionTranslation: 'stale', answerTranslation: 'stale' }) });
    const fixed = correction({ legacyIds: [], contentType: 'questionAnswer',
        maltese: "X'kulur hi l-qmis?", english: 'Il-qmis bajda.',
        prompt: "X'kulur hi l-qmis?", answer: 'Il-qmis bajda.',
        questionTranslation: 'What colour is the shirt?', answerTranslation: '' });
    const result = h.store.syncSentenceContent([fixed]);
    equal(result.migrated, 0, 'Stable Q&A ID unchanged');
    for (const field of ['contentType', 'maltese', 'english', 'prompt', 'answer', 'questionTranslation', 'answerTranslation']) {
        equal(h.state()[canonical][field], fixed[field], `Refresh Q&A ${field}`);
    }
    preserved(h.state()[canonical]);
}
// Conflicting aliases must not overwrite a manual card, another page, or another card type.
for (const protectedOverrides of [{ sourcePage: 'manual' }, { sourcePage: 'another.html' }, { type: 'word-card' }]) {
    for (const protectedId of [legacy, canonical]) {
        const initial = { [legacy]: card(), [canonical]: card(canonical) };
        initial[protectedId] = card(protectedId, protectedOverrides);
        const h = harness(initial);
        const result = h.store.syncSentenceContent([correction()]);
        equal(result.changed, false, 'Protected collision is not mutated');
        equal(result.conflicts, [{ id: canonical, protectedIds: [protectedId] }], 'Report protected collision');
        equal(h.state(), initial, 'Preserve both protected and source-owned records');
        equal(h.writes(), 0, 'No protected collision write');
    }
}
// Both IDs may exist after restoring an old backup: retain the most recent actual review.
for (const scenario of [
    { name: 'newer legacy review', current: { lastReviewedAt: '2026-11-01T12:00:00.000Z', reviewCount: 50 },
      old: { lastReviewedAt: '2026-11-05T12:00:00.000Z', reviewCount: 8 }, winner: 'legacy' },
    { name: 'newer canonical review', current: { lastReviewedAt: '2026-11-05T12:00:00.000Z', reviewCount: 8 },
      old: { lastReviewedAt: '2026-11-01T12:00:00.000Z', reviewCount: 50 }, winner: 'canonical' },
    { name: 'equal dates higher count', current: { reviewCount: 10 }, old: { reviewCount: 12 }, winner: 'legacy' },
    { name: 'complete tie canonical', current: {}, old: {}, winner: 'canonical' },
    { name: 'valid date beats invalid', current: { lastReviewedAt: 'not-a-date', reviewCount: 100 },
      old: { lastReviewedAt: '2026-11-01T12:00:00.000Z', reviewCount: 2 }, winner: 'legacy' },
    { name: 'invalid dates use count', current: { lastReviewedAt: 'invalid', reviewCount: 12 },
      old: { lastReviewedAt: null, reviewCount: 11 }, winner: 'canonical' }
]) {
    const current = card(canonical, { ...scenario.current, personalNote: 'canonical note', box: 2 });
    const old = card(legacy, { ...scenario.old, personalNote: 'legacy note', box: 5 });
    const expected = scenario.winner === 'legacy' ? old : current;
    const h = harness({ [canonical]: current, [legacy]: old });
    equal(h.store.syncSentenceContent([correction()]).migrated, 1, `${scenario.name}: remove duplicate`);
    const state = h.state();
    equal(Object.keys(state), [canonical], `${scenario.name}: canonical queue entry`);
    for (const field of Object.keys(history)) equal(state[canonical][field], expected[field], `${scenario.name}: preserve winner ${field}`);
    equal(state[canonical].maltese, 'Il-qmis bajda.', `${scenario.name}: content is canonical`);
    equal(h.writes(), 1, `${scenario.name}: atomic dedupe`);
}
// Multiple restored legacy aliases are collapsed using the same rule, without importing API-supplied SRS fields.
{
    const otherLegacy = 'sentence::colors::old-white-shirt';
    const h = harness({ [legacy]: card(), [otherLegacy]: card(otherLegacy, { reviewCount: 20, personalNote: 'winner' }) });
    const result = h.store.syncSentenceContent([correction({ legacyIds: [legacy, otherLegacy], box: 0, reviewCount: 0, personalNote: 'not content' })]);
    equal(result.migrated, 2, 'Collapse all legacy aliases');
    equal(h.state()[canonical].reviewCount, 20, 'Incoming data cannot reset review count');
    equal(h.state()[canonical].box, 4, 'Incoming data cannot reset box');
    equal(h.state()[canonical].personalNote, 'winner', 'Incoming data cannot replace custom metadata');
}
{
    const h = harness({ [legacy]: card() });
    const initial = h.state();
    h.store.syncSentenceContent([null, {}, correction({ id: 'word::colors::white' }), correction({ sourcePage: 'manual' }), correction({ maltese: '' })]);
    equal(h.state(), initial, 'Malformed incoming records leave progress intact');
    equal(h.writes(), 0, 'Malformed payloads do not write');
}

// Regression: adding a missing swatch through Review must not call addWord and reset an old card's SRS.
async function checkSwatchBackfill() {
    const wordId = 'word::colors::abjad', manualId = 'word::colors::ahmar';
    const word = { ...card(wordId), type: 'word-card', maltese: 'abjad', sourcePage: page, swatchStyle: '' };
    const manual = { ...card(manualId), type: 'word-card', sourcePage: 'manual', swatchStyle: '', maltese: 'my own label' };
    const h = harness({ [wordId]: word, [manualId]: manual });
    const source = fs.readFileSync(path.join(root, 'assets/js/review-cards.js'), 'utf8');
    const start = source.indexOf('    function backfillColorSwatches() {');
    const end = source.indexOf('\n    document.addEventListener', start);
    assert(start >= 0 && end > start, 'Locate the actual Review swatch backfill');
    const colors = { page, groups: [{ title: 'Colours', items: [
        { slug: 'abjad', maltese: 'abjad / bajda', english: 'white', example: 'Il-qmis bajda.', swatchStyle: 'existing-swatch' },
        { slug: 'ahmar', maltese: 'aħmar / ħamra', english: 'red', swatchStyle: 'another-existing-swatch' },
        { slug: 'iswed', maltese: 'iswed / sewda', english: 'black', swatchStyle: 'not-saved' }
    ] }] };
    Object.assign(h.context, { COLORS_DATA_URL: 'colors.json', console,
        fetch: async () => ({ ok: true, json: async () => colors }),
        getAllCards: () => h.store.getAllCards(),
        toColorReviewId: item => 'word::colors::' + h.store.normalizeForKey(item.slug || item.maltese) });
    h.store.addWord = () => { throw new Error('Backfill must not re-enrol or reset saved cards'); };
    vm.runInContext(source.slice(start, end), h.context);
    equal(await h.context.backfillColorSwatches(), true, 'Backfill applies missing swatch');
    const state = h.state();
    preserved(state[wordId]);
    equal(state[wordId].swatchStyle, 'existing-swatch', 'Restore swatch');
    equal(state[wordId].maltese, 'abjad / bajda', 'Restore current source labels');
    equal(state[manualId], manual, 'Do not alter manually owned color card');
    equal(Object.keys(state).length, 2, 'Backfill cannot enrol unsaved colors');
    equal(await h.context.backfillColorSwatches(), false, 'Backfill is idempotent');
    equal(h.writes(), 1, 'Backfill writes once');
}
checkSwatchBackfill().then(() => {
    console.log(`PASS sentence content sync (${checks} assertions): corrections, alias collisions, manual/source protection, exact SRS preservation and swatch backfill.`);
}).catch(error => { console.error(error); process.exitCode = 1; });
