/* B3 interactions, existing progress preservation, shared styles and offline use. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const bank = read('assets/data/b3_revision_examples.json');
const exercises = read('assets/data/b3_revision_exercises.json');
const foundationSets = exercises.sets.filter(set => set.id !== 'b3-mixed-check');
const output = path.join(root, 'tmp_b3_revision');
const snapshots = path.join(root, 'docs/analysis/b3-revision-screenshots');
const mime = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.webmanifest':'application/manifest+json', '.wasm':'application/wasm'};

async function main() {
  fs.mkdirSync(output, {recursive:true});
  fs.mkdirSync(snapshots, {recursive:true});
  const server = http.createServer((request,response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) {response.writeHead(403);response.end();return;}
    fs.readFile(file,(error,data) => {response.writeHead(error?404:200, {'Content-Type': (mime[path.extname(file)]||'application/octet-stream')+'; charset=utf-8'});response.end(error?'Missing':data);});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await chromium.launch(fs.existsSync(chrome)?{executablePath:chrome}:{ });
  const errors=[], failed=[], auditImportProbes=[];
  let auditActive=false;
  const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{
    if(!response.url().startsWith(base)||response.status()<400)return;
    const pathname=new URL(response.url()).pathname;
    // axe's preloadCssom creates a synthetic HTMLDocument: its relative CSS
    // imports resolve at the document root. Keep those tool probes visible in
    // the report, separately from real page-resource failures.
    if(auditActive && /^\/(?:site|themes)\//.test(pathname) && fs.existsSync(path.join(root,'assets/css',pathname))) auditImportProbes.push(response.url());
    else failed.push(response.url());
  });
  try {
    await page.goto(base+'b3_revision.html');
    await page.waitForFunction(()=>document.querySelectorAll('[data-bank-item]').length===128 && document.querySelectorAll('.exercise-item').length===70);
    assert.equal(await page.locator('main > .course-chapter-list > article').count(),7);
    assert.equal(await page.locator('h1').innerText(),'Everyday Maltese Practice');
    assert.doesNotMatch(await page.locator('main, .hero').allTextContents().then(parts=>parts.join(' ')), /Malti\.B|Book pp\.|book mastery|book-aligned|the book uses|Chapter [1-7]/i);
    assert.equal(await page.locator('[data-example-group$="-models"] [lang="mt"], [data-example-group$="-words"] [lang="mt"]').count(),92);
    assert.equal(await page.locator('[data-example-group$="-models"] [lang="en"], [data-example-group$="-words"] [lang="en"]').count(),92);
    assert.equal(await page.locator('link[rel="stylesheet"]').count(),3);
    assert.equal(await page.locator('style,[style]').count(),0);
    await page.waitForFunction(()=>document.querySelector('[data-b3-load-status]').hidden);
    assert.match(await page.locator('[data-review-summary]').innerText(),/saved, .* due/);

    const oldProgress={objectives:{'b2-hobbies::future':true},updatedAt:'2026-10-01T12:00:00Z'};
    const oldCheck={attempts:2,bestScore:4,lastScore:4,total:4,passed:true,updatedAt:'2026-10-01T12:00:00Z'};
    await page.evaluate(({oldProgress,oldCheck})=>{
      window.MaltiStorage.setJson('malti_course_progress_v1',oldProgress);
      window.MaltiStorage.setJson('malti_exercise_progress_v1',{'b2-hobbies-check':oldCheck});
      window.MaltiReviewStore.addSentence({id:'sentence::b2-preserved',maltese:'Jien inħobb naqra.',english:'I like reading.',sourcePage:'hobbies_future.html',topic:'Hobbies'});
    },{oldProgress,oldCheck});
    const oldCard=await page.evaluate(()=>window.MaltiReviewStore.getCard('sentence::b2-preserved'));

    // Native disclosure keyboard interaction and the shared sentence bookmark.
    const disclosure=page.locator('#b3-feelings details').nth(1);
    await disclosure.locator('summary').focus();await page.keyboard.press('Enter');
    assert.equal(await disclosure.getAttribute('open'),'');
    const bookmark=disclosure.locator('[data-bank-item] .review-add-button').first();
    await bookmark.focus();await page.keyboard.press('Space');
    assert.equal(await bookmark.getAttribute('aria-pressed'),'true');
    assert.equal(await page.evaluate(()=>window.MaltiReviewStore.getStats().total),2);
    await page.reload();await page.waitForFunction(()=>document.querySelectorAll('[data-bank-item]').length===128);
    assert.equal(await page.locator('[data-bank-item="b3-feelings-models-1"] .review-add-button').getAttribute('aria-pressed'),'true');

    // An unsuccessful attempt must give feedback and save the relevant missed card.
    let first=page.locator('[data-exercise-set="b3-feelings-check"]');
    await first.evaluate(element=>{element.closest('details').open=true;});
    await first.getByRole('button',{name:'Check answers',exact:true}).click();
    assert.match(await first.locator('.exercise-result').innerText(),/0\/6/);
    await first.getByRole('button',{name:'Add missed answers to review',exact:true}).click();
    const missed=await page.evaluate(()=>window.MaltiReviewStore.getCard('sentence::course-exercise::b3-feelings-check::b3-feelings-demonstrative'));
    assert.equal(missed.maltese,'din widna');
    await first.getByRole('button',{name:'Try again',exact:true}).click();

    // Grade every interaction type in every set, while the new transfer check is covered by b3_practice_browser_check.js.
    for(const set of foundationSets) {
      const container=page.locator(`[data-exercise-set="${set.id}"]`);
      await container.evaluate(element=>{if(element.closest('details'))element.closest('details').open=true;});
      for(const item of set.items) {
        const element=container.locator(`[data-exercise-item="${item.id}"]`);
        if(item.type==='fill-blank') await element.locator('input').fill(item.answer);
        else if(item.type==='multiple-choice') {
          const index=item.choices.indexOf(item.answer);assert.ok(index>=0);
          await element.locator('input[type="radio"]').nth(index).check();
        } else if(item.type==='matching') {
          for(let i=0;i<item.pairs.length;i++)await element.locator('select').nth(i).selectOption(item.pairs[i].right);
        } else if(item.type==='order-words') {
          for(const token of item.tokens)await element.locator('.exercise-order-bank').getByRole('button',{name:token,exact:true}).first().click();
        } else assert.fail('Unhandled B3 question type '+item.type);
      }
      await container.getByRole('button',{name:'Check answers',exact:true}).click();
      assert.match(await container.locator('.exercise-result').innerText(),new RegExp(`${set.items.length}/${set.items.length}.*passed`));
      console.log('PASS grading '+set.id);
    }
    await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.exercise-item').length===70);
    for(const set of foundationSets)assert.match(await page.locator(`[data-exercise-set="${set.id}"] .status-chip`).textContent(),new RegExp(`Best ${set.items.length}/${set.items.length}.*passed`));
    const retained=await page.evaluate(()=>({course:window.MaltiStorage.getJson('malti_course_progress_v1'),check:window.MaltiExerciseRunner.getProgress()['b2-hobbies-check'],card:window.MaltiReviewStore.getCard('sentence::b2-preserved')}));
    assert.deepEqual(retained,{course:oldProgress,check:oldCheck,card:oldCard});

    // Compare the new chapter's real computed surface with the existing B2 surface.
    const styleOf=element=>{const s=getComputedStyle(element);return ['fontFamily','backgroundColor','borderTopColor','borderTopWidth','borderRadius','paddingTop'].map(key=>[key,s[key]]);};
    const b3style=await page.locator('#b3-feelings').evaluate(styleOf);
    await page.goto(base+'course_path.html#b2-hobbies');await page.locator('[data-course-level-button="b2"]').click();
    assert.deepEqual(await page.locator('#b2-hobbies').evaluate(styleOf),b3style);
    assert.equal(await page.locator('[data-course-level="b2"] .course-chapter').count(),7);
    assert.equal(await page.locator('a[href="./b3_revision.html"]').count()>=1,true);
    await page.goto(base+'all_pages.html');
    await page.getByRole('link',{name:'Everyday Maltese Practice',exact:true}).last().waitFor();
    await page.goto(base+'b3_revision.html');await page.locator('[data-theme-select]').waitFor();
    await page.waitForFunction(()=>document.querySelectorAll('[data-bank-item]').length===128);
    const audits=[];
    const axeSource=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
    for(const theme of ['classic','forest','contrast']) {
      await page.setViewportSize({width:1440,height:1000});
      await page.locator('[data-theme-select]').selectOption(theme);
      for(const width of [1440,390,320]) {
        await page.setViewportSize({width,height:width===1440?1000:844});
        await page.evaluate(()=>{document.querySelectorAll('details.study-disclosure').forEach(d=>d.open=true);});
        await page.waitForLoadState('networkidle');
        auditActive=true;
        await page.addScriptTag({content:axeSource});
        const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})));
        auditActive=false;
        assert.deepEqual(violations,[],`${theme}/${width}: accessibility`);
        const overflow=await page.evaluate(()=>({page:document.documentElement.scrollWidth>innerWidth+1,clipped:[...document.querySelectorAll('main a,main button,main input,main select,main .study-card')].filter(e=>{const r=e.getBoundingClientRect();return r.width&& !e.closest('.table-scroll') &&(r.left<0||r.right>innerWidth+1);}).map(e=>e.outerHTML.slice(0,120))}));
        assert.deepEqual(overflow,{page:false,clipped:[]},`${theme}/${width}: overflow`);
        audits.push({theme,width,violations:0,overflow:false});
        if(width!==320){
          await page.evaluate(()=>{document.querySelectorAll('details.study-disclosure').forEach(d=>d.open=false);scrollTo(0,0);});
          await page.getByRole('heading',{name:'Everyday Maltese Practice',exact:true}).click();
          await page.screenshot({path:path.join(snapshots,`b3-${theme}-${width}.png`)});
          const reference=page.locator('#b3-sport details').first();await reference.locator('summary').click();
          await page.locator('#b3-sport').scrollIntoViewIfNeeded();
          await page.screenshot({path:path.join(snapshots,`b3-${theme}-${width}-reference.png`)});
        }
        console.log(`PASS ${theme}/${width}: axe, no clipping`);
      }
    }
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('[data-theme-select]').selectOption('forest');await page.reload();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'forest');
    await page.waitForFunction(()=>document.querySelectorAll('.exercise-item').length===70);
    const savedChecks=await page.evaluate(()=>window.MaltiExerciseRunner.getProgress());
    const offlineContext=await browser.newContext();
    const offlinePage=await offlineContext.newPage();
    await offlinePage.goto(base+'b3_revision.html');
    try {await offlinePage.evaluate(async()=>{await navigator.serviceWorker.ready;});}
    catch(error){if(!error.message.includes('Execution context was destroyed'))throw error;}
    await offlinePage.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
    await offlinePage.reload({waitUntil:'networkidle'});
    await offlinePage.waitForFunction(()=>document.querySelectorAll('.exercise-item').length===70);
    await offlinePage.evaluate(checks=>window.MaltiStorage.setJson('malti_exercise_progress_v1',checks),savedChecks);
    await offlineContext.setOffline(true);await offlinePage.reload();
    await offlinePage.waitForFunction(()=>document.querySelectorAll('[data-bank-item]').length===128 && document.querySelectorAll('.exercise-item').length===70);
    assert.equal(await offlinePage.locator('[data-exercise-set="b3-town-check"] .status-chip').textContent(),'Best 6/6 · passed');
    await offlineContext.close();
    assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
    const report={chapters:7,items:128,questions:70,foundationSetsGraded:7,allFoundationSetsGraded:true,missedCardsCorrect:true,legacyProgressPreserved:true,sharedB2SurfaceMatches:true,bookmarkAndDisclosureKeyboard:true,offlineReload:true,audits,errors,failed,auditImportProbes:[...new Set(auditImportProbes)]};
    fs.writeFileSync(path.join(output,'validation.json'),JSON.stringify(report,null,2)+'\n');
    console.log('PASS B3 revision: all sets, persistence, bookmarks, B2 styles, 9 accessibility/layout combinations and offline reload.');
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
