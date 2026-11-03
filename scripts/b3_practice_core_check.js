const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const root = path.resolve(__dirname, '..');
const core = require(path.join(root, 'assets/js/b3-practice-core.js'));
const NOW = '2026-11-03T10:00:00.000Z';
const at = days => new Date(Date.parse(NOW) + days * 86400000).toISOString();
const result = (patternId, mode, correct, itemId = patternId + '-' + mode + '-0') => ({ patternId, mode, correct, itemId });
const fixture = {
    chapters: Array.from({length: 7}, (_, chapterIndex) => ({
        id: 'b3-chapter-' + chapterIndex,
        title: 'Chapter ' + chapterIndex,
        patterns: Array.from({length: 3}, (_, patternIndex) => {
            const id = `b3-pattern-${chapterIndex}-${patternIndex}`;
            return { id, title: 'Pattern ' + id, explanation: 'Remember the person.',
                contrast: {maltese:'jien / aħna',english:'I / we'}, model:{maltese:'Aħna nixorbu.',english:'We drink.'},
                variants: ['recognition','production'].flatMap(mode => Array.from({length:3},(_,index) => ({id:id+'-'+mode+'-'+index,patternId:id,chapterId:'b3-chapter-'+chapterIndex,assessmentMode:mode,type:'fill-blank',prompt:'Complete.',answer:'nixorbu',accepted:['nixorbu']}))),
                transfer:{id:id+'-transfer',assessmentMode:'production',type:'fill-blank',prompt:'Write.',answer:'nixorbu',accepted:['nixorbu']}
            };
        })
    }))
};
const id = 'b3-pattern-0-0';
let checks = 0;
function check(name, action) { action();checks++;console.log('PASS '+name); }

check('malformed raw state is repaired while valid drafts and unknown metadata survive', () => {
    const raw={drafts:{story:'Saved text'},futureField:{keep:1},patterns:{[id]:{production:{attempts:3,correct:20,streak:30,dueAt:'bad',lastAt:NOW},recognition:{attempts:-4}},bad:null}};
    const fixed=core.createState(raw);
    assert.equal(fixed.schemaVersion,1);assert.deepEqual(fixed.drafts,raw.drafts);assert.deepEqual(fixed.futureField,raw.futureField);
    assert.equal(fixed.patterns[id].production.correct,3);assert.equal(fixed.patterns[id].production.streak,3);assert.equal(fixed.patterns[id].production.dueAt,NOW);
    assert.equal(fixed.patterns[id].recognition.attempts,0);assert.equal(fixed.patterns.bad,undefined);
    assert.equal(raw.patterns[id].production.correct,20);
    assert.deepEqual(core.createState(null),{schemaVersion:1,patterns:{}});
    assert.equal(core.createState({patterns:{[id]:{production:{attempts:2,lastAt:1e30,dueAt:1e30}}}}).patterns[id].production.lastAt,null);
});
check('recognition and production are independent, with no one-answer secure status', () => {
    const state=core.recordResults({},[result(id,'recognition',true)],NOW);
    const summary=core.summarize(fixture,state,NOW);
    assert.equal(summary.recognition.practised,1);assert.equal(summary.production.practised,0);
    assert.equal(summary.recognition.secure,0);assert.equal(summary.production.secure,0);
    assert.equal(state.patterns[id].recognition.dueAt,at(1));
});
check('an error schedules next-day review and immediate recovery uses a fresh item', () => {
    const state=core.recordResults({},[result(id,'production',false)],NOW);
    const recovery=core.recoveryFor(fixture,id,id+'-production-0');
    assert.equal(state.patterns[id].production.dueAt,at(1));
    assert.equal(recovery.transfer.id,id+'-transfer');assert.notEqual(recovery.transfer.id,id+'-production-0');
    assert.equal(core.summarize(fixture,state,NOW).production.weak,1);
    assert.equal(core.buildDailyPlan(fixture,state,{now:NOW}).items[0].patternId,id);
    assert.equal(core.buildDailyPlan(fixture,state,{now:NOW}).items[0].assessmentMode,'production');
});
check('successful spaced stages are one, three and seven days; retries cannot inflate them', () => {
    let state=core.recordResults({},[result(id,'production',true)],NOW);
    state=core.recordResults(state,[result(id,'production',true,id+'-production-1')],NOW);
    assert.equal(state.patterns[id].production.spacedSuccesses,1);assert.equal(state.patterns[id].production.dueAt,at(1));
    state=core.recordResults(state,[result(id,'production',true)],at(1));
    assert.equal(state.patterns[id].production.dueAt,at(4));assert.equal(core.summarize(fixture,state,at(1)).production.secure,1);
    state=core.recordResults(state,[result(id,'production',true)],at(4));
    assert.equal(state.patterns[id].production.dueAt,at(11));
    state=core.recordResults(state,[result(id,'production',false)],at(5));
    assert.equal(state.patterns[id].production.spacedSuccesses,0);assert.equal(state.patterns[id].production.dueAt,at(6));
});
check('chapter practice rotates variants after an answer and preserves inputs', () => {
    const raw={drafts:{keep:'hello'}};
    const first=core.chooseChapterItems(fixture,'b3-chapter-0',raw,{now:NOW});
    assert.equal(first.length,6);assert.equal(new Set(first.map(item=>item.id)).size,6);
    const state=core.recordResults(raw,first.map(item=>result(item.patternId,item.assessmentMode,true,item.id)),NOW);
    const second=core.chooseChapterItems(fixture,'b3-chapter-0',state,{now:NOW});
    assert.equal(second.length,6);assert.ok(second.every(item=>!first.some(previous=>previous.id===item.id)));
    assert.deepEqual(raw,{drafts:{keep:'hello'}});
    second[0].prompt='Changed output';assert.equal(fixture.chapters[0].patterns[0].variants[0].prompt,'Complete.');
});
check('daily plan balances chapters and modes and never duplicates an item', () => {
    const plan=core.buildDailyPlan(fixture,{}, {limit:8,now:NOW});
    assert.equal(plan.items.length,8);assert.equal(plan.estimatedMinutes,7);
    assert.equal(new Set(plan.items.map(item=>item.chapterId)).size,7);
    assert.equal(new Set(plan.items.map(item=>item.id)).size,8);
    assert.equal(plan.items.filter(item=>item.assessmentMode==='recognition').length,4);
    assert.equal(plan.items.filter(item=>item.assessmentMode==='production').length,4);
    assert.ok(plan.reasons.every(item=>item.reason==='new'));
});
check('due review wins over new material and modes remain independent', () => {
    const state=core.recordResults({},[result(id,'recognition',true)],NOW);
    const plan=core.buildDailyPlan(fixture,state,{limit:2,now:at(1)});
    assert.equal(plan.items[0].patternId,id);assert.equal(plan.items[0].assessmentMode,'recognition');assert.equal(plan.reasons[0].reason,'due');
    assert.ok(plan.duePatternIds.includes(id));
    const before=core.buildDailyPlan(fixture,state,{limit:30,now:NOW});
    assert.ok(!before.items.some(item=>item.patternId===id&&item.assessmentMode==='recognition'));
});
check('scheduled-only history yields an empty daily plan rather than fake due work', () => {
    const all=fixture.chapters.flatMap(chapter=>chapter.patterns.flatMap(pattern=>['recognition','production'].map(mode=>result(pattern.id,mode,true))));
    const state=core.recordResults({},all,NOW);
    const plan=core.buildDailyPlan(fixture,state,{now:NOW});
    assert.deepEqual(plan.items,[]);assert.equal(plan.nextDueAt,at(1));assert.equal(plan.estimatedMinutes,0);
    assert.equal(core.summarize(fixture,state,NOW).production.secure,0);
});
check('recovery does not repeat its failed transfer and quarantine is never selected', () => {
    const recovery=core.recoveryFor(fixture,id,id+'-transfer');
    assert.notEqual(recovery.transfer.id,id+'-transfer');assert.equal(recovery.transfer.assessmentMode,'production');
    const bank=structuredClone(fixture);bank.chapters[0].patterns[0].variants[0].verificationStatus='needs-review';
    assert.ok(!core.chooseChapterItems(bank,'b3-chapter-0',{}, {now:NOW}).some(item=>item.id===id+'-recognition-0'));
    assert.equal(core.recoveryFor(bank,'unknown','missing'),null);
});
check('invalid results and duplicates in a completion event cannot corrupt progress', () => {
    const rows=[result(id,'production',true),result(id,'production',true),result(id,'invalid',true),{patternId:'__proto__',itemId:'x',mode:'production',correct:true},result(id,'production','false')];
    const state=core.recordResults({},rows,NOW);assert.equal(state.patterns[id].production.attempts,1);
    assert.equal({}.production,undefined);
    assert.equal(core.recordResults({},[result('toString','production',true)],NOW).patterns.toString.production.attempts,1);
    assert.deepEqual(core.chooseChapterItems({},'unknown',{}, {now:NOW}),[]);
    assert.equal(core.summarize({},null,NOW).recognition.accuracy,null);
});

const realBank=path.join(root,'assets/data/b3_practice_bank.json');
if(fs.existsSync(realBank))check('real content bank can produce balanced practice and fresh recovery',()=>{
    const bank=JSON.parse(fs.readFileSync(realBank,'utf8'));
    const plan=core.buildDailyPlan(bank,{}, {now:NOW});assert.equal(plan.items.length,8);
    assert.equal(new Set(plan.items.map(item=>item.chapterId)).size,7);
    for(const chapter of bank.chapters){const items=core.chooseChapterItems(bank,chapter.id,{}, {now:NOW});assert.equal(items.length,6);assert.equal(items.filter(item=>item.assessmentMode==='production').length,3);}
});
console.log(`PASS B3 practice core: ${checks} tests.`);
