const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const bank=read('assets/data/b3_practice_bank.json');
const contexts=read('assets/data/b3_context_exercises.json');
const speaking=read('assets/data/b3_speaking_tasks.json');
const newItems=bank.chapters.flatMap(c=>c.patterns.flatMap(p=>[...p.variants,p.transfer])).concat(bank.finalSet.items);
const itemsById=new Map([...newItems,...contexts.sets.flatMap(s=>s.items)].map(i=>[i.id,i]));
const output=path.join(root,'tmp_b3_practice');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json','.wasm':'application/wasm'};
let checks=0;
function passed(message){checks++;console.log('PASS '+message);}
async function main(){
 fs.mkdirSync(output,{recursive:true});
 const server=http.createServer((request,response)=>{
  const pathname=new URL(request.url,'http://localhost').pathname;
  if(pathname==='/__b3-seed.html'){
   response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
   response.end('<!doctype html><title>Offline setup</title>');
   return;
  }
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){response.writeHead(403);response.end();return;}
  fs.readFile(file,(error,data)=>{response.writeHead(error?404:200,{'Content-Type':(mime[path.extname(file)]||'application/octet-stream')+'; charset=utf-8'});response.end(error?'Missing':data);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}/`;
 const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
 const browser=await chromium.launch(fs.existsSync(chrome)?{executablePath:chrome}:{});
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:1000}});
 const page=await context.newPage();
 const errors=[],failed=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)failed.push(response.url());});
 const ready=async()=>page.waitForFunction(()=>document.querySelector('[data-b3-practice-root]')?.dataset.b3Ready==='true');
 const reload=async()=>{await page.reload();await ready();};
 const scoped=()=>page.evaluate(()=>window.MaltiStorage.getJson('malti_topic_practice_v1').b3Revision);
 const ids=async panel=>panel.locator('.exercise-item').evaluateAll(elements=>elements.map(e=>e.dataset.exerciseItem));
 const open=async locator=>locator.evaluate(element=>{let p=element.parentElement;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement;}});
 async function solve(panel){
  const actual=await ids(panel);assert.ok(actual.length);
  for(const id of actual){
   const item=itemsById.get(id);assert.ok(item,'Known authored item '+id);
   const element=panel.locator(`[data-exercise-item="${id}"]`);
   if(item.type==='fill-blank')await element.locator('[data-exercise-answer]').fill(item.answer);
   else if(item.type==='matching')for(let i=0;i<item.pairs.length;i++)await element.locator('select').nth(i).selectOption(item.pairs[i].right);
   else if(item.type==='order-words')for(const token of item.tokens)await element.locator('.exercise-order-bank').getByRole('button',{name:token,exact:true}).first().click();
   else {
    const values=await element.locator('input[type="radio"]').evaluateAll(nodes=>nodes.map(n=>n.value));
    const index=values.findIndex(value=>value.toLowerCase()===String(item.answer).toLowerCase());assert.ok(index>=0);
    await element.locator('input[type="radio"]').nth(index).check();
   }
  }
  await panel.getByRole('button',{name:'Check answers',exact:true}).click();
  assert.match(await panel.locator('.exercise-result').innerText(),new RegExp(`${actual.length}/${actual.length}.*passed`));
  return actual;
 }
 try{
  await page.goto(base+'b3_revision.html');await ready();
  assert.equal(await page.locator('[data-b3-context] [data-bank-item]').count(),29);
  assert.equal(await page.locator('[data-b3-speaking] [data-bank-item]').count(),8);
  assert.equal(await page.locator('[data-b3-context] [data-bank-translation]:visible').count(),0);
  assert.equal(await page.locator('[data-b3-daily-start]').isEnabled(),true);
  assert.equal(await page.locator('link[rel="stylesheet"]').count(),3);
  passed('seven context and eight speaking blocks mount with optional English support');

  const legacy={threeWords:{answers:{preserved:'dar, kelb, ktieb'}},mixedHistory:{keep:{attempts:2}}};
  const oldCheck={attempts:3,bestScore:12,lastScore:11,total:14,passed:true,updatedAt:'2026-10-01T12:00:00Z'};
  await page.evaluate(({legacy,oldCheck})=>{
   const storage=window.MaltiStorage;
   storage.setJson('malti_topic_practice_v1',{...storage.getJson('malti_topic_practice_v1'),...legacy});
   storage.setJson('malti_exercise_progress_v1',{'b3-mixed-check':oldCheck,'b2-hobbies-check':oldCheck});
   storage.setJson('malti_course_progress_v1',{objectives:{'b2-hobbies::future':true}});
   window.MaltiReviewStore.addSentence({id:'b3-browser-legacy',maltese:'Dar sabiħa.',english:'A beautiful house.',sourcePage:'body_appearance.html'});
  },{legacy,oldCheck});
  await page.locator('[data-b3-daily-start]').click();
  let daily=page.locator('[data-b3-daily-panel]');
  const dailyIds=await ids(daily);assert.equal(dailyIds.length,6);
  assert.equal(new Set(dailyIds.map(id=>itemsById.get(id).assessmentMode)).size,2);
  assert.equal(await page.locator('[data-b3-daily-start]').isDisabled(),true);
  const written=daily.locator('[data-exercise-answer]').first();
  await written.fill('unfinished response');
  await reload();daily=page.locator('[data-b3-daily-panel]');
  assert.deepEqual(await ids(daily),dailyIds);
  assert.equal(await daily.locator('[data-exercise-answer]').first().inputValue(),'unfinished response');
  assert.equal((await scoped()).core?.patterns && Object.keys((await scoped()).core.patterns).length || 0,0);
  passed('daily session balances modes and resumes stable questions plus unfinished answers');

  await daily.getByRole('button',{name:'Check answers',exact:true}).click();
  assert.match(await daily.locator('.exercise-result').innerText(),/0\/6/);
  let afterWrong=await scoped();assert.ok(afterWrong.recoveryQueue.length);
  const attempts=JSON.stringify(afterWrong.core);
  await daily.locator('form').evaluate(form=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  assert.equal(JSON.stringify((await scoped()).core),attempts);
  const originalFailure=afterWrong.recoveryQueue[0];
  const repair=page.locator('[data-b3-recovery]');
  assert.equal(await repair.isVisible(),true);
  assert.equal(await repair.locator('[data-b3-recovery-model]').isHidden(),true);
  await repair.getByRole('button',{name:'Show another example',exact:true}).click();
  assert.equal(await repair.locator('[data-b3-recovery-model]').isVisible(),true);
  await repair.getByRole('button',{name:'Try a new example',exact:true}).click();
  const repairIds=await ids(repair.locator('[data-b3-recovery-panel]'));
  assert.notEqual(repairIds[0],originalFailure.itemId);
  assert.equal(itemsById.get(repairIds[0]).assessmentMode,'production');
  if(itemsById.get(repairIds[0]).type==='fill-blank')await repair.locator('[data-exercise-answer]').fill('partial repair');
  await reload();
  const repairAgain=page.locator('[data-b3-recovery-panel]');
  assert.deepEqual(await ids(repairAgain),repairIds);
  if(itemsById.get(repairIds[0]).type==='fill-blank')assert.equal(await repairAgain.locator('[data-exercise-answer]').inputValue(),'partial repair');
  await solve(repairAgain);
  assert.ok(!(await scoped()).recoveryQueue.some(entry=>entry.patternId===originalFailure.patternId&&entry.mode===originalFailure.mode));
  passed('mistakes lead through explanation, model and a fresh saved production task; duplicate submits are ignored');

  const exercised=new Set();
  for(const chapter of bank.chapters){
   const owner=page.locator(`[data-b3-chapter="${chapter.id}"]`);
   const button=owner.locator('[data-b3-chapter-start]');await open(button);
   const selections=[];
   for(let round=0;round<3;round++){
    await button.click();assert.equal(await button.isDisabled(),true);
    const panel=owner.locator('[data-b3-chapter-panel]');
    const selection=await solve(panel);selections.push(selection);selection.forEach(id=>exercised.add(id));
    assert.equal(await button.isEnabled(),true);
   }
   assert.equal(new Set(selections.flat()).size,18,chapter.id+' rotates all variants');
   console.log('PASS all variants '+chapter.id);
  }
  assert.equal(exercised.size,126);
  assert.equal((await scoped()).recoveryQueue.length,0);
  assert.equal(await page.locator('[data-b3-recovery]').isHidden(),true);
  const summary=await page.evaluate(bank=>window.MaltiB3PracticeCore.summarize(bank,window.MaltiStorage.getJson('malti_topic_practice_v1').b3Revision.core),bank);
  assert.equal(summary.recognition.practised,21);assert.equal(summary.production.practised,21);
  assert.equal(summary.recognition.secure,0);assert.equal(summary.production.secure,0);
  passed('126 variants grade through real controls; modes stay separate and same-day practice cannot imply retained mastery');

  await page.locator('[data-b3-final-start]').click();
  assert.equal(await page.locator('[data-b3-final-start]').isDisabled(),true);
  const final=await solve(page.locator('[data-b3-final-panel]'));
  assert.equal(final.length,14);assert.ok(final.every(id=>!exercised.has(id)));
  passed('fresh final test grades fourteen independent transfer questions');

  for(const set of contexts.sets.filter(set=>set.id!=='b3-calendar-plan-check')){
   const panel=page.locator(`[data-exercise-set="${set.id}"]`);await open(panel);await solve(panel);
  }
  const calendar=page.locator('#b3-calendar-plan table');
  assert.match(await calendar.innerText(),/16:00/);assert.match(await calendar.innerText(),/17:00/);assert.match(await calendar.innerText(),/15:30/);
  const toggle=page.locator('#b3-calendar [data-b3-toggle-translations]');await toggle.check();
  assert.equal(await page.locator('#b3-calendar [data-b3-context] [data-bank-translation]:visible').count(),4);
  await toggle.uncheck();
  passed('all 28 comprehension questions agree with connected text, timetable and neighbourhood clues');

  await page.setViewportSize({width:320,height:844});
  const calendarPlan=page.locator('#b3-calendar-plan');
  assert.equal(await calendarPlan.isVisible(),true);
  assert.ok(await calendarPlan.evaluate(element=>element.scrollWidth<=element.clientWidth));
  const availableDays=await calendarPlan.locator('tbody tr').evaluateAll(rows=>rows
   .filter(row=>row.cells[1].textContent.trim().match(/\d{2}:\d{2}$/)?.[0] > '16:00')
   .map(row=>row.cells[0].textContent.trim()));
  assert.deepEqual(availableDays,['It-Tlieta']);
  const listener=calendarPlan.locator('details').filter({has:page.getByText('Listen with someone (optional)',{exact:true})});
  const reader=listener.locator('details');
  assert.equal(await listener.getAttribute('open'),null);
  await listener.locator(':scope > summary').focus();await page.keyboard.press('Enter');
  assert.equal(await listener.locator('ol li').count(),2);
  assert.equal(await reader.locator('p[lang="mt"]').isVisible(),false);
  await reader.locator(':scope > summary').click();
  assert.match(await reader.locator('p[lang="mt"]').innerText(),/It-Tlieta tipprattika l-għawm fil-ħamsa/);
  await listener.locator(':scope > summary').click();
  const calendarCheck=calendarPlan.locator('[data-exercise-set="b3-calendar-plan-check"]');
  const choice=calendarCheck.getByRole('radio',{name:'Tuesday at 16:00',exact:true});
  await choice.focus();await page.keyboard.press('Space');
  assert.equal(await choice.isChecked(),true);
  await calendarCheck.getByRole('button',{name:'Check answers',exact:true}).click();
  assert.match(await calendarCheck.locator('.exercise-result').innerText(),/1\/1.*passed/);

  const previousCalendarDraft='Għeluq snini fit-tnejn ta’ April.';
  await page.evaluate(draft=>{
   const storage=window.MaltiStorage;
   const all=storage.getJson('malti_topic_practice_v1');
   const b3=all.b3Revision;
   storage.setJson('malti_topic_practice_v1',{...all,b3Revision:{...b3,speaking:{...b3.speaking,'b3-calendar':{draft}}}});
  },previousCalendarDraft);
  const planOwner=calendarPlan.locator('[data-b3-speaking-owner="b3-calendar-plan"]');
  const planDraft="Nhar it-Tlieta se niltaqa' ma' Nina fl-erbgħa. Se nilagħbu flimkien.";
  await planOwner.locator('[data-bank-item] > summary').click();
  await planOwner.locator('textarea').fill(planDraft);
  await planOwner.locator('[data-b3-speaking-check]').first().focus();await page.keyboard.press('Space');
  assert.equal(await planOwner.locator('[data-b3-speaking-check]').count(),3);
  assert.equal(await planOwner.getByText('On Tuesday I will meet Nina at four.',{exact:false}).isVisible(),false);
  await planOwner.getByRole('button',{name:'Show model answer',exact:true}).click();
  assert.equal(await planOwner.getByText('On Tuesday I will meet Nina at four.',{exact:false}).isVisible(),true);
  await reload();
  await planOwner.locator('[data-bank-item] > summary').click();
  assert.equal(await planOwner.locator('textarea').inputValue(),planDraft);
  assert.equal(await planOwner.locator('[data-b3-speaking-check]').first().isChecked(),true);
  assert.equal((await scoped()).speaking['b3-calendar'].draft,previousCalendarDraft);
  assert.match(await calendarCheck.locator('.status-chip').textContent(),/Best 1\/1/);
  await page.setViewportSize({width:1440,height:1000});
  passed('Calendar scenario offers one valid time, optional listening and an independent two-sentence draft with three checks');

  const task=speaking.tasks[0];const owner=page.locator(`[data-b3-speaking-owner="${task.chapterId}"]`);await open(owner);
  const prompt=owner.locator('[data-bank-item] > summary');await prompt.focus();await page.keyboard.press('Enter');
  const draft='Illum inħossni għajjien. Għandi bżonn nistrieħ.';
  const beforeSpeaking=JSON.stringify((await scoped()).core);
  await owner.locator('textarea').fill(draft);
  await owner.locator('[data-b3-speaking-check]').first().focus();await page.keyboard.press('Space');
  assert.equal(await owner.getByRole('button',{name:'Confident',exact:true}).isDisabled(),true);
  await owner.getByRole('button',{name:'Show model answer',exact:true}).click();
  await owner.getByRole('button',{name:'Confident',exact:true}).click();
  assert.equal(JSON.stringify((await scoped()).core),beforeSpeaking);
  await reload();await open(owner);await owner.locator('[data-bank-item]').evaluate(element=>{element.open=true;});
  assert.equal(await owner.locator('textarea').inputValue(),draft);
  assert.equal(await owner.locator('[data-b3-speaking-check]').first().isChecked(),true);
  assert.equal(await owner.getByRole('button',{name:'Confident',exact:true}).getAttribute('aria-pressed'),'true');
  await owner.locator('textarea').fill(draft+' Illum noqgħod id-dar.');
  assert.equal((await scoped()).speaking[task.chapterId].rating,null);
  assert.equal(await owner.locator('[data-b3-speaking-check]:checked').count(),0);
  passed('speaking draft, model, keyboard checklist and self-rating persist; editing invalidates the old self-check without scoring it');

  await page.goto(base+'review_cards.html');
  await page.waitForFunction(()=>Boolean(window.MaltiProgressBackup));
  const preserved=await page.evaluate(()=>({topic:window.MaltiStorage.getJson('malti_topic_practice_v1'),checks:window.MaltiStorage.getJson('malti_exercise_progress_v1'),course:window.MaltiStorage.getJson('malti_course_progress_v1'),card:window.MaltiReviewStore.getCard('b3-browser-legacy'),backup:window.MaltiProgressBackup.exportBackup()}));
  assert.deepEqual(preserved.topic.threeWords,legacy.threeWords);assert.deepEqual(preserved.topic.mixedHistory,legacy.mixedHistory);
  assert.deepEqual(preserved.checks['b3-mixed-check'],oldCheck);assert.deepEqual(preserved.checks['b2-hobbies-check'],oldCheck);
  assert.equal(preserved.course.objectives['b2-hobbies::future'],true);assert.ok(preserved.card);
  assert.equal(JSON.parse(preserved.backup.data.malti_topic_practice_v1).b3Revision.speaking[task.chapterId].draft.includes('Illum'),true);
  passed('B1/B2, earlier B3 scores, topic-practice state and shared review survive; drafts are included in existing backup');

  await page.goto(base+'b3_revision.html');await ready();
  await page.setViewportSize({width:320,height:844});
  const map=page.locator('img[src="./assets/img/b3-town-map.svg"]');await open(map);
  assert.ok((await map.boundingBox()).width>=150,'map is not squeezed by figure margins');
  assert.equal(await page.locator('#b3-town details[open] > summary').filter({hasText:'Text version of the plan'}).count(),1);
  const screenshots=path.join(root,'docs/analysis/b3-practice-screenshots');fs.mkdirSync(screenshots,{recursive:true});
  await map.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(screenshots,'town-mobile-320.png')});
  await page.setViewportSize({width:1440,height:1000});await page.locator('#b3-today').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(screenshots,'today-desktop.png')});

  const offlineContext=await browser.newContext({viewport:{width:390,height:844}});
  const offline=await offlineContext.newPage();
  // Register before opening the app so its controllerchange reload cannot race test navigation.
  await offline.goto(base+'__b3-seed.html');
  await offline.evaluate(async()=>{await navigator.serviceWorker.register('./service-worker.js');});
  await offline.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');
  await offline.goto(base+'b3_revision.html',{waitUntil:'networkidle'});
  await offline.waitForFunction(()=>document.querySelector('[data-b3-practice-root]')?.dataset.b3Ready==='true');
  await offline.evaluate(topic=>window.MaltiStorage.setJson('malti_topic_practice_v1',topic),preserved.topic);
  await offlineContext.setOffline(true);await offline.reload();
  await offline.waitForFunction(()=>document.querySelector('[data-b3-practice-root]')?.dataset.b3Ready==='true');
  const offlineDraft=await offline.evaluate(()=>window.MaltiStorage.getJson('malti_topic_practice_v1').b3Revision.speaking['b3-feelings'].draft);
  assert.equal(offlineDraft,preserved.topic.b3Revision.speaking['b3-feelings'].draft);
  const offlinePlan=offline.locator('#b3-calendar-plan');
  await offlinePlan.locator('[data-b3-speaking] [data-bank-item] > summary').click();
  assert.equal(await offlinePlan.locator('textarea').inputValue(),planDraft);
  const practice=offline.locator('#b3-town [data-b3-chapter-start]');await open(practice);await practice.click();
  assert.equal(await offline.locator('#b3-town [data-b3-chapter-panel] .exercise-item').count(),6);
  await offlineContext.close();
  passed('all new data, guided drafts, diagram and dynamic practice reopen offline');
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  fs.writeFileSync(path.join(output,'validation.json'),JSON.stringify({checks,variantsGraded:126,freshFinalGraded:14,contextQuestionsGraded:28,calendarPlan:true,recognitionAndProductionSeparate:true,spacedReviewAntiInflation:true,repairFlow:true,unfinishedSessionAndRepairResume:true,speakingPersistenceAndInvalidation:true,legacyProgressPreserved:true,backupIncludesDrafts:true,offline:true,errors,failed},null,2)+'\n');
  console.log(`PASS B3 enhancements: ${checks} scenario groups.`);
 }catch(error){await page.screenshot({path:path.join(output,'failure.png'),fullPage:false}).catch(()=>{});throw error;}
 finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
