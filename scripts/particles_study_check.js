const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const {PNG}=require('pngjs');
async function assertCenteredIcon(button,label){
  const color=await button.evaluate(node=>getComputedStyle(node,'::before').color.match(/\d+/g).slice(0,3).map(Number));
  const png=PNG.sync.read(await button.screenshot());
  const pixels=[];
  for(let y=8;y<png.height-8;y++)for(let x=8;x<png.width-8;x++){
    const offset=(y*png.width+x)*4;
    if(png.data[offset+3]>200&&color.every((value,i)=>Math.abs(png.data[offset+i]-value)<18))pixels.push([x,y]);
  }
  assert(pixels.length>8,`${label}: bookmark ink missing`);
  const xs=pixels.map(p=>p[0]),ys=pixels.map(p=>p[1]);
  assert(Math.abs((Math.min(...xs)+Math.max(...xs)+1)/2-png.width/2)<=1.5,`${label}: glyph is not horizontally centered`);
  assert(Math.abs((Math.min(...ys)+Math.max(...ys)+1)/2-png.height/2)<=1.5,`${label}: glyph is not vertically centered`);
}
const root=path.resolve(__dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const data=read('assets/data/particles_prepositions_examples.json');
const questions=data.groups.find(g=>g.id==='particle-practice').items;
const coverage=read('docs/analysis/lesson03/site-coverage.json');
execFileSync(process.execPath,['scripts/build_particles_content.js','--check'],{cwd:root,stdio:'inherit'});
assert.equal(questions.length,56);assert.equal(new Set(questions.map(q=>q.slug)).size,56);
assert.equal(coverage.records.length,109);assert.equal(coverage.heldForReview.length,4);
for(const row of coverage.records)assert(row.state==='held-for-review'||row.outputIds.length,row.id);
for(const id of coverage.heldForReview)assert(!Object.values(data.groups).flatMap(g=>g.items).some(q=>q.intakeId===id||q.intakeId?.startsWith(id+'-')),id);
for(const q of questions){assert(q.answer.maltese);if(q.options)assert(q.options.includes(q.answer.maltese),q.slug);}
const reading=read('assets/data/reading_red_cave_examples.json');
assert.equal(reading.groups[0].items.length,8);assert.equal(reading.groups[1].items.length,8);
assert(reading.groups[0].items[4].maltese.includes('mis-saqaf'));
assert(!JSON.stringify(data).includes('għad irid nara'));
async function main(){
  const server=http.createServer((req,res)=>{const requested=decodeURIComponent(new URL(req.url,'http://local').pathname);const file=path.resolve(root,'.'+(requested==='/'?'/index.html':requested));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,buffer)=>{const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml'};res.writeHead(err?404:200,{'Content-Type':(mime[path.extname(file)]||'application/octet-stream')+'; charset=utf-8'});res.end(err?'Not found':buffer);});});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  let browser;
  try{
    const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
    browser=await chromium.launch(fs.existsSync(chrome)?{executablePath:chrome}:{});
    const page=await browser.newPage({viewport:{width:1440,height:1000},serviceWorkers:'block'}),errors=[];
    page.setDefaultTimeout(10000);
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copied=text;}}});});
    const go=async url=>{await page.goto(base+'/'+url);await page.waitForFunction(()=>document.documentElement.dataset.particlesReady==='true');};
    await go('particles_prepositions.html#practice');
    await page.evaluate(()=>{localStorage.setItem('malti_numbers_extended_v1',JSON.stringify({results:{existing:{attempts:4}}}));});
    const practice=page.locator('[data-particle-practice]'),choose=practice.getByLabel('Question',{exact:true});
    const select=async id=>choose.selectOption(id);
    await select('l03-lil-a03');
    await practice.getByLabel("'l",{exact:true}).check();await practice.getByRole('button',{name:'Check answers',exact:true}).click();
    assert.match(await practice.locator('.exercise-feedback').textContent(),/Not yet/);
    const first=await page.evaluate(()=>window.MaltiExerciseRunner.getProgress());
    await practice.locator('form').evaluate(form=>form.requestSubmit());assert.deepEqual(await page.evaluate(()=>window.MaltiExerciseRunner.getProgress()),first);
    await practice.getByLabel('Mistakes only').check();assert.equal(await choose.locator('option').count(),1);
    for(let i=0;i<2;i++){
      const retry=practice.getByRole('button',{name:'Try again',exact:true});if(await retry.isVisible())await retry.click();
      await practice.getByLabel("'il",{exact:true}).check();await practice.getByRole('button',{name:'Check answers',exact:true}).click();assert.match(await practice.locator('.exercise-feedback').textContent(),/^Correct/);
    }
    assert.equal((await page.evaluate(()=>window.MaltiMistakeStore.getAll()))[0].status,'resolved');
    await practice.getByLabel('Mistakes only').uncheck();
    await practice.getByLabel('Task',{exact:true}).selectOption('write');await select('l03-lil-a05');
    await practice.getByLabel('Your answer',{exact:true}).fill("'l");await practice.getByRole('button',{name:'Check answers',exact:true}).click();assert.match(await practice.locator('.exercise-feedback').textContent(),/Not yet/);
    await practice.getByRole('button',{name:'Try again',exact:true}).click();await practice.getByLabel('Your answer',{exact:true}).fill('’l-');await practice.getByRole('button',{name:'Check answers',exact:true}).click();assert.match(await practice.locator('.exercise-feedback').textContent(),/^Correct/);
    await select('l03-tr-02');await practice.getByLabel('Your answer',{exact:true}).fill('Ma’ ħabibti');
    await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.particlesReady==='true');assert.equal(await practice.getByLabel('Your answer',{exact:true}).inputValue(),'Ma’ ħabibti');
    await practice.getByRole('button',{name:'Check answers',exact:true}).click();assert.match(await practice.locator('.exercise-feedback').textContent(),/^Correct/);
    await practice.getByRole('button',{name:'Save question to review',exact:true}).click();
    const cards=await page.evaluate(()=>window.MaltiReviewStore.getAllCards());assert(cards.some(c=>c.contentType==='questionAnswer'&&c.prompt==='With my friend'&&c.answer==="Ma' ħabibi"));
    await practice.getByLabel('Task',{exact:true}).selectOption('source');
    for(const q of questions){await select(q.slug);if(q.options)await practice.getByLabel(q.answer.maltese,{exact:true}).check();else await practice.getByLabel('Your answer',{exact:true}).fill(q.answer.maltese);await practice.getByRole('button',{name:'Check answers',exact:true}).click();assert.match(await practice.locator('.exercise-feedback').textContent(),/^Correct/,q.slug);}
    await go('reading_red_cave.html');assert.equal(await page.locator('[data-bank-primary]').count(),8);
    await page.getByLabel('Copy format').selectOption('bilingual');await page.getByRole('button',{name:'Copy reading'}).click();
    const expected=reading.groups[0].items.map(q=>q.maltese+'\n'+q.english).join('\n\n');assert.equal(await page.evaluate(()=>window.copied),expected);
    await page.evaluate(()=>navigator.clipboard.writeText=async()=>{throw new Error('denied');});await page.getByRole('button',{name:'Copy reading'}).click();assert.equal(await page.getByLabel('Copyable text').inputValue(),expected);
    await page.evaluate(()=>navigator.clipboard.writeText=async text=>{window.copied=text;});
    await page.getByLabel('English translation',{exact:true}).uncheck();assert.equal(await page.locator('[data-bank-translation]:visible').count(),0);
    await page.getByLabel('Highlight particles').check();assert(await page.locator('[data-bank-primary] mark').count()>10);
    const detail=page.locator('[data-reading-questions] details').first();await detail.locator('summary').click();await detail.getByLabel('Your answer').fill('F’Lulju.');
    assert(await detail.getByRole('button',{name:'Confident',exact:true}).isDisabled());await detail.getByRole('button',{name:'Show model answer'}).click();await detail.getByRole('button',{name:'Confident',exact:true}).click();
    await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.particlesReady==='true');await detail.locator('summary').click();assert.equal(await detail.getByLabel('Your answer').inputValue(),'F’Lulju.');assert.equal(await detail.getByRole('button',{name:'Confident',exact:true}).getAttribute('aria-pressed'),'true');
    assert(await detail.getByRole('button',{name:'Confident',exact:true}).isDisabled());
    await go('directions_town.html#direction-particles');assert.equal(await page.locator('[data-direction-particle-group] article').count(),9);
    await page.locator('[data-direction-writing]').locator('..').locator('summary').click();const drafts=page.locator('[data-direction-writing] textarea');assert.equal(await drafts.count(),9);await drafts.first().fill('Mur ’il barra.');
    await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.particlesReady==='true');assert.equal(await drafts.first().inputValue(),'Mur ’il barra.');
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('malti_numbers_extended_v1'))),{results:{existing:{attempts:4}}});
    await page.addScriptTag({url:base+'/assets/js/progress-backup.js'});const backup=await page.evaluate(()=>window.MaltiProgressBackup.exportBackup());assert(backup.data.malti_particles_study_v1);
    const out=path.join(root,'tmp_particles');fs.mkdirSync(out,{recursive:true});
    const axe=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
    for(const theme of ['classic','forest','contrast'])for(const width of [320,390,1440])for(const url of ['particles_prepositions.html#practice','reading_red_cave.html','directions_town.html#direction-particles']){
      await page.setViewportSize({width,height:1000});await go(url);await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${url} ${theme} ${width}`);
      if(url.startsWith('particles_prepositions')){
        assert.equal(await page.locator('[data-particle-table] > tr').count(),10);
        assert.equal(await page.locator('[data-particle-table] > tr > td').count(),60);
        assert.equal(await page.locator('#particles table article, #particles table [data-sentence-review-row]').count(),0);
        for(const group of ['particle-extra','particle-motorcycle-story']){
          const bank=page.locator(`[data-particle-group="${group}"]`),disclosure=bank.locator('xpath=ancestor::details[1]');
          await disclosure.evaluate(node=>node.open=true);
          const geometry=await bank.evaluate(node=>{const body=node.parentElement,details=body.parentElement,summary=details.querySelector('summary'),toolbar=body.querySelector('[data-sentence-review-row]');return {bodyClass:body.classList.contains('study-disclosure-body'),outside:details.querySelectorAll(':scope > [data-sentence-review-row]').length,indent:toolbar.getBoundingClientRect().left-summary.getBoundingClientRect().left,gap:toolbar.getBoundingClientRect().top-summary.getBoundingClientRect().bottom};});
          assert(geometry.bodyClass);assert.equal(geometry.outside,0);assert(geometry.indent>0);assert(geometry.gap>=12);
          await disclosure.locator('summary').click();assert.equal(await disclosure.locator('[data-sentence-review-row]:visible').count(),0);
        }
        const buttons=await page.locator('[data-particle-table] button').evaluateAll(nodes=>nodes.map(button=>{const box=button.getBoundingClientRect(),icon=getComputedStyle(button,'::before');return {width:box.width,height:box.height,position:getComputedStyle(button).position,transform:icon.transform,display:getComputedStyle(button).display};}));
        assert.equal(buttons.length,10);buttons.forEach(button=>{assert.equal(button.width,button.height);assert.equal(button.position,'static');assert.equal(button.transform,'none');assert.equal(button.display,'inline-flex');});
        const rowOffsets=await page.locator('[data-particle-table] > tr').evaluateAll(rows=>rows.map(row=>{
          const button=row.querySelector('button').getBoundingClientRect(),buttonY=(button.top+button.bottom)/2;
          return Array.from(row.cells).slice(0,-1).map(cell=>{const range=document.createRange();range.selectNodeContents(cell);const rect=range.getBoundingClientRect();return Math.abs((rect.top+rect.bottom)/2-buttonY);});
        }));assert(rowOffsets.flat().every(offset=>offset<=2),'Table text and button centers differ');
        const cardOffsets=await page.locator('[data-particle-contrasts] > article').evaluateAll(cards=>cards.map(card=>{
          const button=card.querySelector('button').getBoundingClientRect(),range=document.createRange();range.selectNodeContents(card.querySelector('p'));const text=range.getBoundingClientRect();return Math.abs((text.top+text.bottom-button.top-button.bottom)/2);
        }));assert(cardOffsets.every(offset=>offset<=2),'Correction first line and button centers differ');
        await assertCenteredIcon(page.locator('[data-particle-table] button').first(),`${theme}/${width} table`);
        await assertCenteredIcon(page.locator('[data-particle-contrasts] button').first(),`${theme}/${width} correction`);
        await page.locator('#practice').scrollIntoViewIfNeeded();
        const surfaces=await page.locator('[data-particle-contrasts] > article').evaluateAll(nodes=>nodes.map(node=>({card:node.classList.contains('study-card'),background:getComputedStyle(node).backgroundColor,border:parseFloat(getComputedStyle(node).borderTopWidth)})));
        assert.equal(surfaces.length,8);surfaces.forEach(surface=>{assert(surface.card);assert.notEqual(surface.background,'rgba(0, 0, 0, 0)');assert(surface.border>0);});
      }
      if(width===390){await page.addScriptTag({content:axe});const violations=await page.evaluate(async()=>{const context=document.querySelector('#direction-particles')||document;const r=await axe.run(context,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return r.violations.map(v=>v.id+':'+v.nodes.map(n=>n.target.join(' ')).join(','));});assert.deepEqual(violations,[],`${url} ${theme}`);}
      await page.screenshot({path:path.join(out,`${theme}-${width}-${url.split('.')[0]}.png`)});
    }
    await page.setViewportSize({width:1440,height:1000});await go('particles_prepositions.html');await page.screenshot({path:path.join(out,'reference-desktop.png')});
    const positions=await page.locator('[data-particle-table] button').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().left));assert.equal(new Set(positions.map(Math.round)).size,1);
    await page.locator('#sun-consonants').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'sun-consonants-desktop.png')});
    await page.locator('[data-particle-contrasts] > article').first().screenshot({path:path.join(out,'review-alignment-card.png')});
    for(const group of ['particle-extra','particle-motorcycle-story']){const disclosure=page.locator(`[data-particle-group="${group}"]`).locator('xpath=ancestor::details[1]');await disclosure.locator('summary').click();await disclosure.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${group}-expanded.png`)});}
    for(const width of [320,1440]){await page.setViewportSize({width,height:1000});await go('reading_red_cave.html#comprehension');await page.getByLabel('English translation',{exact:true}).check();await detail.evaluate(node=>node.open=true);const show=detail.getByRole('button',{name:'Show model answer'});if(await show.isVisible())await show.click();await page.screenshot({path:path.join(out,`comprehension-${width}.png`)});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
    // Exercise the same presentations with unrelated group IDs, including quarantine and rerendering.
    const generic=await page.evaluate(async ({reference,correction,story,question})=>{
      const host=document.createElement('section');document.body.appendChild(host);
      host.innerHTML='<table><caption>Renderer reference fixture</caption><thead><tr><th scope="col">Maltese</th></tr></thead><tbody data-generic-bank="generic-reference"></tbody></table><div data-generic-bank="generic-correction"></div><div data-generic-bank="generic-reading"></div><div data-generic-bank="generic-questions"></div>';
      const groups=[['generic-reference',reference,'translation'],['generic-correction',correction,'example'],['generic-reading',story,'example'],['generic-questions',question,'questionAnswer']].map(([id,item,itemType])=>({id,itemType,items:[item,{...item,slug:'held-'+item.slug,verificationStatus:'needs-review'}]}));
      const config={dataUrl:'fixture.json',data:{groups},groupAttribute:'data-generic-bank',reviewPrefix:'renderer-fixture',groupViews:{
        'generic-reference':{presentation:'table',columns:[{field:'maltese',lang:'mt'}]},'generic-correction':{presentation:'correction'},'generic-reading':{presentation:'reading'},'generic-questions':{presentation:'selfAssessment',state:{answers:{[question.slug]:'Saved draft'},ratings:{[question.slug]:'again'}}}
      }};
      await window.renderExampleBanksFromData(config);await window.renderExampleBanksFromData(config);
      const counts=Array.from(host.querySelectorAll('[data-generic-bank]')).map(container=>container.children.length);
      const details=host.querySelector('details'),draft=details.querySelector('textarea'),events=[];
      host.addEventListener('malti-bank-draft',event=>events.push(event.detail));host.addEventListener('malti-bank-rating',event=>events.push(event.detail));
      const savedDraft=draft.value;draft.value='Changed draft';draft.dispatchEvent(new Event('input',{bubbles:true}));
      const buttons=Array.from(details.querySelectorAll('button')),reveal=buttons.find(button=>button.textContent==='Show model answer'),again=buttons.find(button=>button.textContent==='Needs practice');
      const hiddenRating=again.disabled,savedRating=again.getAttribute('aria-pressed');reveal.click();again.click();
      const review=host.querySelector('[data-generic-bank="generic-reference"] button');review.click();const saved=window.MaltiReviewStore.hasCard(review.dataset.reviewId);review.click();
      const result={counts,headings:host.querySelectorAll('[data-bank-review-heading]').length,events,savedDraft,savedRating,hiddenRating,saved,removed:!window.MaltiReviewStore.hasCard(review.dataset.reviewId),id:review.dataset.reviewId};
      result.rejections=[];
      for(const invalid of [
        {...config,groupViews:{...config.groupViews,'generic-reference':{presentation:'unknown'}}},
        {...config,groupViews:{...config.groupViews,'generic-reference':{presentation:'selfAssessment'}}},
        {...config,data:{groups:[{...groups[0],items:[{...reference,slug:''}]}]}}
      ]){try{await window.renderExampleBanksFromData(invalid);result.rejections.push(false);}catch{result.rejections.push(true);}}
      host.remove();return result;
    },{reference:data.groups[0].items[0],correction:data.groups.find(g=>g.id==='particle-sun').items[0],story:reading.groups[0].items[0],question:reading.groups[1].items[0]});
    assert.deepEqual(generic.counts,[1,1,1,1]);assert.deepEqual(generic.rejections,[true,true,true]);assert.equal(generic.headings,1);assert.equal(generic.savedDraft,'Saved draft');assert.equal(generic.savedRating,'true');assert(generic.hiddenRating&&generic.saved&&generic.removed);assert(generic.id.startsWith('sentence::renderer-fixture::'));assert.equal(generic.events[0].value,'Changed draft');assert.equal(generic.events[1].value,'again');assert(generic.events.every(event=>event.groupId==='generic-questions'));
    await page.goto(base+'/scripts/fixtures/ui_component_catalog.html');
    for(const theme of ['classic','forest','contrast'])for(const width of [390,1440]){
      await page.setViewportSize({width,height:1000});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
      for(const selector of ['[data-component="review-inline"]','[data-component="review-inline-added"]','[data-component="review-paragraph"] button']){
        await assertCenteredIcon(page.locator(selector),`${theme}/${width} catalog ${selector}`);
        const original=await page.locator(selector).textContent();await page.locator(selector).evaluate(node=>node.textContent='');
        await assertCenteredIcon(page.locator(selector),`${theme}/${width} empty label ${selector}`);
        await page.locator(selector).evaluate((node,text)=>node.textContent=text,original);
      }
      const paragraphOffset=await page.locator('[data-component="review-paragraph"]').evaluate(card=>{const range=document.createRange();range.selectNodeContents(card.querySelector('p'));const text=range.getBoundingClientRect(),button=card.querySelector('button').getBoundingClientRect();return Math.abs((text.top+text.bottom-button.top-button.bottom)/2);});assert(paragraphOffset<=2);
    }
    const offlineContext=await browser.newContext({serviceWorkers:'allow'}),offline=await offlineContext.newPage();
    await offline.goto(base+'/particles_prepositions.html');await offline.waitForFunction(()=>navigator.serviceWorker.controller,{},{timeout:30000});
    await offlineContext.setOffline(true);await offline.goto(base+'/reading_red_cave.html');await offline.waitForFunction(()=>document.documentElement.dataset.particlesReady==='true');assert.equal(await offline.locator('[data-bank-primary]').count(),8);
    await offline.goto(base+'/directions_town.html#direction-particles');await offline.waitForFunction(()=>document.documentElement.dataset.particlesReady==='true');assert.equal(await offline.locator('[data-direction-particle-group] article').count(),9);await offlineContext.close();
    assert.deepEqual(errors,[]);console.log('PASS: 109 intake records, 56 source tasks, strict apostrophe/hyphen grading, variants, duplicate-submit guard, mistakes/review, persisted drafts/backup, bilingual copy, three themes, keyboard/mobile, accessibility, row/card alignment and bookmark pixel centering.');
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
