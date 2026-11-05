const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const core = require('../assets/js/study-session-core');
const b3Core = require('../assets/js/b3-practice-core');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const clone = value => structuredClone(value);
const course = read('assets/data/course_path.json');
const bank = read('assets/data/b3_practice_bank.json');
const NOW = '2026-11-05T12:00:00.000Z';
let checks = 0;
function check(name, action) { action(); checks += 1; console.log('PASS ' + name); }
function payload(chapterId = 'b1-colours') {
    const chapter = read('assets/data/course/chapters/' + chapterId + '.json');
    return { course, assessments: chapter.assessmentSets, supplements: chapter.supplementalItems, targets: chapter.targets };
}
const colourPayload = payload();
const plan = () => core.planCourse(colourPayload, { levelId: 'b1', chapterId: 'b1-colours', now: NOW });
const session = options => core.createSession(plan(), { id: 'test-session', now: NOW, ...options });
const mapFor = planned => new Map(planned.catalog.map(entry => [entry.item.id, entry]));

check('all fourteen real course chapters select six original focused items with balanced modes', () => {
    for (const level of course.levels) for (const chapter of level.chapters) {
        const input = payload(chapter.id), before = clone(input);
        const result = core.planCourse(input, { levelId: level.id, chapterId: chapter.id, now: NOW });
        const original = new Map(input.assessments.filter(set => set.kind === 'checkpoint').flatMap(set => set.items.map(item => [item.id, item])));
        assert.equal(result.entries.length, 6, chapter.id);
        assert.equal(new Set(result.entries.map(entry => entry.item.id)).size, 6);
        for (const mode of ['recognition', 'production']) assert.equal(result.entries.filter(entry => entry.mode === mode).length, 3);
        for (const entry of result.entries) {
            assert.deepEqual(entry.canonicalItem, original.get(entry.item.id));
            assert.notEqual(entry.item.type, 'matching');
            assert(!entry.originSetId.endsWith('-diagnostic'));
            assert.equal(entry.chapterId, chapter.id);
        }
        assert.deepEqual(input, before, 'Planning cannot mutate source banks');
    }
});
check('due targets and explicit help are prioritised without dropping the other assessment mode', () => {
    const first = plan(), last = first.catalog.at(-1);
    const targetProgress = { [last.skillId]: { state: 'review', dueAt: NOW, modeStats: { recognition: { attempts: 5 }, production: { attempts: 5 } } } };
    const due = core.planCourse(colourPayload, { levelId: 'b1', chapterId: 'b1-colours', now: NOW, targetProgress });
    assert.equal(due.entries[0].skillId, last.skillId);
    const helpQueue = [{ routeId: 'b1', chapterId: 'b1-colours', itemId: last.item.id, skillId: last.skillId, mode: last.mode }];
    const helped = core.planCourse(colourPayload, { levelId: 'b1', chapterId: 'b1-colours', now: NOW, helpQueue });
    assert(helped.entries.some(entry => entry.item.id === last.item.id));
    assert.equal(helped.entries.filter(entry => entry.mode === 'recognition').length, 3);
});
check('invalid routes, quarantined items, diagnostic-only banks and zero-sized plans do not fabricate work', () => {
    assert.deepEqual(core.planCourse(colourPayload, { levelId: 'b2', chapterId: 'b1-colours' }).entries, []);
    assert.deepEqual(core.planCourse(colourPayload, { levelId: 'b1', chapterId: 'missing' }).catalog, []);
    const quarantined = clone(colourPayload);
    quarantined.assessments.forEach(set => set.items.forEach(item => { item.verificationStatus = 'needs-review'; }));
    assert.deepEqual(core.planCourse(quarantined, { levelId: 'b1', chapterId: 'b1-colours' }).entries, []);
    assert.equal(core.planCourse(colourPayload, { levelId: 'b1', chapterId: 'b1-colours', limit: 0 }).entries.length, 0);
    const onlyDiagnostic = { ...colourPayload, assessments: colourPayload.assessments.filter(set => set.kind === 'diagnostic') };
    assert.equal(core.planCourse(onlyDiagnostic, { levelId: 'b1', chapterId: 'b1-colours' }).entries.length, 0);
});
check('B3 delegates selection to its existing scheduler and scopes the original items to the chosen chapter', () => {
    const chapterId = bank.chapters[0].id;
    const before = clone(bank), state = { futureMetadata: { preserve: true } };
    const result = core.planB3(bank, state, { chapterId, now: NOW });
    const expected = b3Core.chooseChapterItems(bank, chapterId, state, { now: NOW, limit: 30 }).slice(0, 6);
    assert.deepEqual(result.entries.map(entry => entry.item.id), expected.map(item => item.id));
    assert(result.entries.every(entry => entry.chapterId === chapterId));
    assert.deepEqual(bank, before); assert.deepEqual(state, { futureMetadata: { preserve: true } });
    const daily = core.planB3(bank, {}, { now: NOW });
    assert.deepEqual(daily.entries.map(entry => entry.item.id), b3Core.buildDailyPlan(bank, {}, { now: NOW, limit: 30 }).items.slice(0, 6).map(item => item.id));
});
check('helped B3 recognition returns a fresh recognition variant and preserves independent writing work', () => {
    const chapter = bank.chapters[0], pattern = chapter.patterns[0];
    const failed = pattern.variants.find(item => item.assessmentMode === 'recognition');
    const pending = [{ routeId: 'b3', chapterId: chapter.id, itemId: failed.id, skillId: pattern.id, mode: 'recognition' }];
    const result = core.planB3(bank, {}, { chapterId: chapter.id, helpQueue: pending, now: NOW });
    assert.equal(result.entries[0].skillId, pattern.id);
    assert.equal(result.entries[0].mode, 'recognition');
    assert.notEqual(result.entries[0].item.id, failed.id);
    const other = core.planB3(bank, {}, { chapterId: bank.chapters[1].id, helpQueue: pending, now: NOW });
    assert(other.entries.every(entry => entry.chapterId === bank.chapters[1].id));
});
check('stable short-step sets cannot pass original checkpoints or generate per-session Review duplicates', () => {
    const first = session(), second = session({ id: 'another-session' });
    const step = core.stepSet(first);
    assert.equal(step.id, core.stepSet(second).id);
    assert(!colourPayload.assessments.some(set => set.id === step.id));
    assert.equal(step.items.length, 1);
    assert.equal(step.items[0].id, first.entries[0].canonicalItem.id);
    assert.deepEqual(step.items[0].targetIds, first.entries[0].canonicalItem.targetIds);
    assert.equal(step.items[0].reviewCard, undefined);
    assert(first.entries[0].canonicalItem.reviewCard);
    step.items[0].prompt = 'mutation'; assert.notEqual(first.entries[0].canonicalItem.prompt, 'mutation');
});
check('resume restores drafts and authoritative source content without silently discarding an unresolved item', () => {
    let active = session();
    active = core.updateDraft(active, active.entries[0].item.id, ['draft', 'tokens']);
    active.futureField = { keep: true };
    const source = plan();
    source.catalog.find(entry => entry.item.id === active.entries[0].item.id).item.prompt = 'Authoritative corrected prompt';
    const restored = core.resumeSession(JSON.parse(JSON.stringify(active)), mapFor(source));
    assert.deepEqual(restored.drafts, active.drafts);
    assert.deepEqual(restored.futureField, { keep: true });
    assert.equal(restored.entries[0].item.prompt, 'Authoritative corrected prompt');
    assert.equal(core.stepSet(restored).items[0].prompt, 'Authoritative corrected prompt');
    const missing = mapFor(source); missing.delete(active.entries[3].item.id);
    assert.equal(core.resumeSession(active, missing), null);
    const skipped = clone(active); skipped.index = 2;
    assert.equal(core.resumeSession(skipped, mapFor(source)), null);
    const duplicate = clone(active); duplicate.entries[1] = clone(duplicate.entries[0]);
    assert.equal(core.resumeSession(duplicate, mapFor(source)), null);
});
check('unsubmitted work cannot advance and wrong or stale completion events do not record an attempt', () => {
    const active = session(), id = active.entries[0].item.id;
    assert.deepEqual(core.advance(active), active);
    assert.deepEqual(core.recordResult(active, { itemId: id, correct: true, setId: 'original-checkpoint' }), active);
    assert.deepEqual(core.recordResult(active, { itemId: 'another', correct: true }), active);
    assert.deepEqual(core.recordResult(active, { itemId: id, correct: 'true' }), active);
    assert.deepEqual(core.updateDraft(active, '__proto__', 'bad'), active);
    assert.equal({}.bad, undefined);
});
check('independent results are idempotent, preserve original target identity and only advance deliberately', () => {
    const active = session(), id = active.entries[0].item.id;
    const event = { itemId: id, correct: true, setId: core.stepSet(active).id, attemptToken: 'attempt-1' };
    const checked = core.recordResult(active, event, { now: NOW });
    assert.equal(checked.index, 0); assert.equal(checked.results[id].attempts, 1);
    assert.equal(core.summary(checked).independentCorrect, 1);
    assert.deepEqual(core.recordResult(checked, event, { now: NOW }), checked);
    assert.deepEqual(core.recordResult(checked, { itemId: id, correct: false }), checked);
    const next = core.advance(checked, { now: NOW }); assert.equal(next.index, 1);
    assert.deepEqual(active.results, {}); assert.equal(active.index, 0);
    assert(core.resumeSession(next, mapFor(plan())));
});
check('showing a hint before check or after a wrong answer keeps retries assisted and out of target mastery', () => {
    const active = session(), id = active.entries[0].item.id;
    const hinted = core.useHint(active), helpedSet = core.stepSet(hinted);
    assert(helpedSet.id.endsWith('-helped')); assert.deepEqual(helpedSet.items[0].targetIds, []);
    assert.equal(helpedSet.items[0].reviewCard, undefined);
    const correct = core.recordResult(hinted, { itemId: id, correct: true, attemptToken: 'hinted' }, { now: NOW });
    assert.equal(correct.results[id].assisted, true); assert.equal(core.summary(correct).independentCorrect, 0);
    assert.equal(correct.helpQueue.length, 1);
    const wrong = core.recordResult(active, { itemId: id, correct: false, attemptToken: 'wrong' }, { now: NOW });
    const retry = core.useHint(wrong);
    const fixed = core.recordResult(retry, { itemId: id, correct: true, attemptToken: 'retry' }, { now: NOW });
    assert.equal(fixed.results[id].attempts, 2); assert.equal(fixed.results[id].assisted, true);
    assert.equal(core.summary(fixed).independentCorrect, 0); assert.equal(fixed.helpQueue.length, 1);
    assert.notEqual(core.stepSet(wrong).id, core.stepSet(retry).id, 'Assistance cannot resolve the independent mistake alias');
});
check('beginRetry remounts assisted work, reopens drafts and rejects an already-consumed completion token', () => {
    const active = session(), id = active.entries[0].item.id;
    const event = { itemId: id, correct: false, attemptToken: 'first-submit' };
    const wrong = core.recordResult(active, event, { now: NOW });
    const retry = core.beginRetry(wrong);
    assert.equal(retry.results[id].checked, false); assert.equal(retry.results[id].correct, null);
    assert.equal(retry.results[id].assisted, true); assert.equal(retry.results[id].attempts, 1);
    assert(core.stepSet(retry).id.endsWith('-helped')); assert.deepEqual(core.stepSet(retry).items[0].targetIds, []);
    assert.deepEqual(core.beginRetry(retry), retry, 'Repeated retry does not clear or duplicate an open attempt');
    const drafted = core.updateDraft(retry, id, 'new answer');
    assert.equal(drafted.drafts[id], 'new answer');
    assert.deepEqual(core.recordResult(drafted, event, { now: NOW }), drafted, 'A delayed old event cannot grade the retry');
    const fixed = core.recordResult(drafted, { itemId: id, correct: true, attemptToken: 'second-submit' }, { now: NOW });
    assert.equal(fixed.results[id].attempts, 2); assert.equal(fixed.results[id].assisted, true);
    assert.equal(core.summary(fixed).independentCorrect, 0); assert.equal(core.advance(fixed).index, 1);
    assert(core.resumeSession(drafted, mapFor(plan())), 'An unfinished assisted retry restores after reload');
});
check('requesting help defers without grading, advances once and keeps unrelated queued work', () => {
    const other = { routeId: 'b2', chapterId: 'b2-weather', itemId: 'unrelated-item', skillId: 'other-skill', mode: 'production' };
    const active = session({ helpQueue: [other] }), id = active.entries[0].item.id;
    const helped = core.requestHelp(active, { now: NOW });
    assert.equal(helped.index, 1); assert.equal(helped.results[id].checked, false);
    assert.equal(helped.results[id].attempts, 0); assert.equal(core.summary(helped).checked, 0);
    assert.equal(helped.helpQueue.length, 2); assert.deepEqual(helped.helpQueue[0], other);
    assert.deepEqual(active.helpQueue, [other]);
    assert(core.resumeSession(helped, mapFor(plan())));
});
check('a fresh independent answer resolves only its matching queued skill and mode', () => {
    const initial = session(), entry = initial.entries[0];
    const failed = core.recordResult(initial, { itemId: entry.item.id, correct: false, attemptToken: 'wrong' }, { now: NOW });
    const otherMode = { ...failed.helpQueue[0], mode: entry.mode === 'recognition' ? 'production' : 'recognition' };
    const fresh = session({ id: 'fresh-session', helpQueue: [...failed.helpQueue, otherMode] });
    const correct = core.recordResult(fresh, { itemId: entry.item.id, correct: true, attemptToken: 'fresh' }, { now: NOW });
    assert.equal(correct.helpQueue.length, 1); assert.equal(correct.helpQueue[0].mode, otherMode.mode);
});
check('six checked or explicitly deferred steps complete a session without claiming six mastered targets', () => {
    let active = session();
    for (let index = 0; index < 6; index += 1) {
        if (index === 2) active = core.requestHelp(active, { now: NOW });
        else {
            const id = active.entries[active.index].item.id;
            active = core.recordResult(active, { itemId: id, correct: index !== 3, attemptToken: 'a-' + index }, { now: NOW });
            active = core.advance(active, { now: NOW });
        }
    }
    assert.deepEqual(core.summary(active), { total: 6, index: 6, remaining: 0, checked: 5, correct: 4,
        independentCorrect: 4, assisted: 1, deferred: 1, complete: true, helpCount: 2 });
    assert.equal(active.completedAt, NOW); assert.equal(core.stepSet(active), null);
    assert(core.resumeSession(active, mapFor(plan())));
});
check('per-topic persisted sessions preserve independent drafts, unrelated progress and prototype safety', () => {
    const saved = { b3Revision: { core: { patterns: { keep: true } } }, tonina: { notes: 'private notes' }, studySession: { sessions: {} } };
    const before = clone(saved), one = session();
    const secondPlan = core.planB3(bank, {}, { chapterId: bank.chapters[0].id, now: NOW });
    const two = core.createSession(secondPlan, { id: 'b3-session', now: NOW });
    const sessions = { one: core.updateDraft(one, one.entries[0].item.id, 'one'), two: core.updateDraft(two, two.entries[0].item.id, 'two') };
    assert.equal(core.resumeSession(sessions.one, mapFor(plan())).drafts[one.entries[0].item.id], 'one');
    assert.equal(core.resumeSession(sessions.two, mapFor(secondPlan)).drafts[two.entries[0].item.id], 'two');
    assert.deepEqual(saved, before, 'The data-only core must never write existing stores');
    const malicious = JSON.parse(JSON.stringify(one).replace('"drafts":{}', '"drafts":{"__proto__":{"polluted":true}}'));
    const resumed = core.resumeSession(malicious, mapFor(plan()));
    assert.equal({}.polluted, undefined); assert(!Object.prototype.hasOwnProperty.call(resumed.drafts, '__proto__'));
});
console.log(`PASS study session core (${checks} contracts): real B1/B2/B3 adapters, original IDs, balanced six-item plans, honest progress, assistance, deterministic resume and immutable topic state.`);
