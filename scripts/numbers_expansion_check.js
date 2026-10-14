const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root,'assets/data/numbers_expansion.json'),'utf8'));
const screenshots = path.join(root,'tmp_numbers_expansion');
fs.mkdirSync(screenshots,{recursive:true});
const base = process.env.NUMBERS_TEST_URL || 'http://127.0.0.1:4190';
const oldResults = {'numbers-35-to-maltese':{attempts:4,correct:3,lastResult:'correct'}};

async function main() {
  assert.equal(data.coverage.length,205);
  assert.equal(new Set(data.coverage.map(i=>i.sourceItemId)).size,205);
  assert.equal(data.materials.length,13);
  assert.equal(data.sourceUnits.length,129);
  assert.equal(data.questions.length,77);
  assert.equal(data.coverage.filter(i=>i.disposition==='deferred-missing-audio').length,1);
  const qids=new Set();
  for(const q of data.questions) {
    assert(q.answer && q.accepted.includes(q.answer),q.id);
    assert(!qids.has(q.id)); qids.add(q.id);
    if(q.options.length) assert(q.options.includes(q.answer),q.id);
  }
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try {
    const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write'],serviceWorkers:'block'});
    const page=await context.newPage(); const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base+'/numbers_calendar_time.html');
    await page.evaluate(old=>{
      localStorage.setItem('malti_numbers_time_drill_v1',JSON.stringify({activeMode:'numbers',numbers:{results:old},clock:{results:{}}}));
      localStorage.setItem('malti_review_cards_v2',JSON.stringify({'test-existing':{id:'test-existing',type:'sentence-card',maltese:'Bongu',english:'Good morning',topic:'Test',box:4,reviewCount:8,nextReviewAt:'2030-01-01T00:00:00.000Z'}}));
    },oldResults);
    await page.reload(); await page.waitForFunction(()=>document.documentElement.dataset.numbersExpansionReady==='true');
    await page.waitForFunction(()=>document.querySelectorAll('#months .vocab-card--review-toggle').length===12);
    for(const [section,count] of [['weekdays',7],['months',12],['time-words',17]]) {
      assert.equal(await page.locator(`#${section} .vocab-card--review-toggle`).count(),count);
      assert.equal(await page.locator(`#${section} img, #${section} .vocab-card--has-visual`).count(),0,`${section} still contains redundant illustrations`);
    }
    await page.evaluate(()=>window.MaltiReviewStore.addWord({id:'word::calendar-time::il-ħamis',maltese:'Il-Ħamis',english:'Thursday',sourcePage:'numbers_calendar_time.html',image:'./assets/img/openmoji/1F4C5.svg',box:3,reviewCount:4}));
    await page.reload(); await page.waitForFunction(()=>window.MaltiNumbersExpansion && window.MaltiReviewStore.getCard('word::calendar-time::il-ħamis')?.image==='');
    const cleaned=await page.evaluate(()=>window.MaltiReviewStore.getCard('word::calendar-time::il-ħamis'));
    assert.equal(cleaned.box,3); assert.equal(cleaned.reviewCount,4); assert.equal(cleaned.imageRole,'none');
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('malti_numbers_time_drill_v1')).numbers.results),oldResults);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('malti_numbers_extended_v1')).results['core-35-words'].attempts),4);
    assert.equal(await page.locator('[data-numbers-practice]').count(),1);
    assert.equal(await page.locator('[data-number-time-drill]').count(),0);
    const pool=await page.evaluate(()=>window.MaltiNumbersExpansion.getQuestions());
    assert(pool.length>450); assert.equal(new Set(pool.map(q=>q.id)).size,pool.length);
    assert(pool.some(q=>q.topic==='clock') && pool.some(q=>q.topic==='core'));
    for(const section of Object.keys(data.sections)) {
      const element=page.locator(`[data-numbers-section="${section}"]`);
      assert((await element.textContent()).length>100,section);
    }
    const practice=page.locator('[data-numbers-practice]');
    for(const topic of ['number-forms','large-numbers','fractions','dual-forms','measurements','temperature','clock','core']) {
      await practice.locator('select[aria-label="Practice topic"]').selectOption(topic);
      const current=await page.evaluate(()=>window.MaltiNumbersExpansion.getCurrent());
      assert.equal(current.topic,topic);
      await practice.locator('input[type="text"]').fill(current.answer);
      await practice.locator('button[type="submit"]').click();
      assert.match(await practice.locator('.numbers-feedback').textContent(),/^Correct\./);
    }
    await practice.getByRole('button',{name:'Next',exact:true}).click();
    const wrong=await page.evaluate(()=>window.MaltiNumbersExpansion.getCurrent());
    await practice.locator('input[type="text"]').fill('not an answer');
    await practice.locator('button[type="submit"]').click();
    assert.match(await practice.locator('.numbers-feedback').textContent(),/^Answer:/);
    await practice.getByLabel('Mistakes only').check();
    assert.equal((await page.evaluate(()=>window.MaltiNumbersExpansion.getCurrent())).id,wrong.id);
    await practice.locator('input[type="text"]').fill(wrong.answer);
    await practice.locator('button[type="submit"]').click();
    await practice.getByRole('button',{name:'Next',exact:true}).click();
    assert.match(await practice.locator('.numbers-question').textContent(),/No mistakes/);
    await practice.getByLabel('Mistakes only').uncheck();
    const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('malti_numbers_extended_v1')).results);
    await page.reload(); await page.waitForFunction(()=>window.MaltiNumbersExpansion);
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('malti_numbers_extended_v1')).results),before);
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('malti_numbers_time_drill_v1')).numbers.results),oldResults);
    const oldReview=await page.evaluate(()=>JSON.parse(localStorage.getItem('malti_review_cards_v2'))['test-existing']);
    assert.equal(oldReview.box,4); assert.equal(oldReview.reviewCount,8);

    const example=page.locator('#fractions .numbers-reference-row').first();
    await example.locator('.numbers-review-button').click();
    assert.equal(await example.locator('.numbers-review-button').getAttribute('aria-pressed'),'true');
    await page.reload(); await page.waitForFunction(()=>window.MaltiNumbersExpansion);
    assert.equal(await example.locator('.numbers-review-button').getAttribute('aria-pressed'),'true');
    await page.locator('[data-numbers-copy-format]').selectOption('bilingual');
    await example.locator('.numbers-copy-button').click();
    let copied=await page.evaluate(()=>navigator.clipboard.readText()); assert.equal(copied.replace(/\r\n/g,'\n'),'kwart\none quarter');
    await page.locator('[data-numbers-copy-format]').selectOption('mt');
    await example.locator('.numbers-copy-button').click();
    copied=await page.evaluate(()=>navigator.clipboard.readText()); assert.equal(copied,'kwart');
    await page.locator('#fractions').getByRole('button',{name:'Copy examples',exact:true}).click();
    copied=await page.evaluate(()=>navigator.clipboard.readText()); assert(copied.replace(/\r\n/g,'\n').includes('\n\n'));

    await page.addScriptTag({url:base+'/assets/js/progress-backup.js'});
    const backupResult=await page.evaluate(()=>{
      const backup=window.MaltiProgressBackup.exportBackup();
      const before=localStorage.getItem('malti_numbers_extended_v1');
      const mode=localStorage.getItem('malti_numbers_copy_format_v1');
      localStorage.removeItem('malti_numbers_extended_v1'); localStorage.removeItem('malti_numbers_copy_format_v1');
      window.MaltiProgressBackup.importBackup(backup);
      return {progress:localStorage.getItem('malti_numbers_extended_v1')===before,copy:localStorage.getItem('malti_numbers_copy_format_v1')===mode};
    });
    assert.deepEqual(backupResult,{progress:true,copy:true});

    const builder=page.locator('#number-builder');
    for(let n=0;n<2;n++) {
      await builder.getByLabel('Number to build').selectOption(String(n));
      const expected=data.sections['number-builder'][n].maltese.replace(/,/g,'');
      for(const word of expected.split(' ')) {
        await builder.locator('.numbers-word-bank .numbers-word:not(:disabled)').getByText(word,{exact:true}).first().click();
      }
      await builder.getByRole('button',{name:'Check answer',exact:true}).click();
      assert.equal(await builder.locator('[role="status"]').textContent(),'Correct.');
      const selected=builder.locator('.numbers-selected-word');
      const original=await selected.evaluateAll(tiles=>tiles.map(tile=>tile.dataset.wordIndex));
      const removedAt=original.length>6?original.indexOf(await selected.filter({hasText:/^u$/}).nth(1).getAttribute('data-word-index')):1;
      const removedId=original[removedAt];
      await selected.nth(removedAt).press('Enter');
      assert.deepEqual(await selected.evaluateAll(tiles=>tiles.map(tile=>tile.dataset.wordIndex)),original.filter((_,i)=>i!==removedAt));
      const returned=builder.locator(`.numbers-word-bank [data-word-index="${removedId}"]`);
      assert(await returned.isEnabled());
      assert.equal(await returned.evaluate(node=>node===document.activeElement),true);
      assert.equal(await builder.locator('[role="status"]').textContent(),'');
      await returned.click();
      assert.deepEqual(await selected.evaluateAll(tiles=>tiles.map(tile=>tile.dataset.wordIndex)),[...original.filter((_,i)=>i!==removedAt),removedId]);
      await builder.getByRole('button',{name:'Undo',exact:true}).click();
      assert.equal(await selected.count(),original.length-1);
    }
    for(const width of [1440,390,320]) {
      await page.setViewportSize({width,height:900});
      const tileHeights=await builder.locator('.numbers-word').evaluateAll(tiles=>tiles.map(tile=>tile.getBoundingClientRect().height));
      assert(tileHeights.length>0 && tileHeights.every(height=>Math.abs(height-48)<1),`Candidate and selected tile heights differ at ${width}px`);
      const drillSpacing=await page.locator('[data-numbers-practice]').evaluate(root=>{
        const input=root.querySelector('.numbers-answer-form input').getBoundingClientRect();
        const actions=root.querySelector('.numbers-practice-panel .toolbar-row').getBoundingClientRect();
        return {form:actions.top-input.bottom};
      });
      assert(drillSpacing.form>=12,`Drill answer controls touch at ${width}px`);
      const positions=await page.locator('.numbers-forms-table tbody .numbers-review-button').evaluateAll(buttons=>buttons.map(button=>{
        const b=button.getBoundingClientRect(); const row=button.closest('tr').getBoundingClientRect();
        return {x:b.x+b.width/2,offset:Math.abs(b.y+b.height/2-row.y-row.height/2)};
      }));
      assert.equal(positions.length,9);
      assert(Math.max(...positions.map(p=>p.x))-Math.min(...positions.map(p=>p.x))<1,`Bookmark column is misaligned at ${width}px`);
      assert(positions.every(p=>p.offset<1),`Bookmarks are not vertically centred at ${width}px`);
      for(const anchor of ['number-forms','fractions','number-builder','numbers-practice']) {
        await page.locator('#'+anchor).scrollIntoViewIfNeeded();
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow: ${width} ${anchor}`);
        const style=await page.locator('#'+anchor).evaluate(node=>({radius:parseFloat(getComputedStyle(node).borderRadius),background:getComputedStyle(node).backgroundColor}));
        assert(style.radius>0,`Missing rounded section: ${anchor}`);
        assert.notEqual(style.background,'rgba(0, 0, 0, 0)',`Missing section background: ${anchor}`);
        await page.screenshot({path:path.join(screenshots,`${width}-${anchor}.png`)});
      }
    }
    assert.deepEqual(errors,[]);
    const search=JSON.parse(fs.readFileSync(path.join(root,'assets/data/search-index.json'),'utf8'));
    assert(search.entries.some(e=>e.href==='numbers_calendar_time.html#group-counts' && e.title==='xkertejn'));
    const broken=await page.evaluate(()=>Array.from(document.images).filter(img=>!img.complete || !img.naturalWidth).map(img=>img.src));
    assert.deepEqual(broken,[]);
    const unified=await page.evaluate(()=>{
      const visual=node=>{
        const s=getComputedStyle(node);
        return {background:s.backgroundColor,border:s.borderTop,radius:s.borderRadius,padding:s.padding};
      };
      const baseline=visual(document.querySelector('#clock-time .study-card'));
      return {baseline,cards:Array.from(document.querySelectorAll('.numbers-reference-row')).map(visual),
        disclosures:Array.from(document.querySelectorAll('.numbers-more > summary, .numbers-source-question')).map(visual)};
    });
    for(const style of [...unified.cards,...unified.disclosures]) assert.deepEqual(style,unified.baseline,'New examples and disclosures must share the standard study-card surface.');
    for(const width of [1440,390,320]) {
      await page.setViewportSize({width,height:900});
      await page.locator('.numbers-more').evaluateAll(groups=>groups.forEach(group=>{group.open=true;}));
      const nesting=await page.locator('.numbers-disclosure-body').evaluateAll(bodies=>bodies.map(body=>{
        const header=body.parentElement.querySelector('summary').getBoundingClientRect();
        const child=body.firstElementChild.getBoundingClientRect();
        const style=getComputedStyle(body);
        return {indent:child.left-header.left,line:parseFloat(style.borderInlineStartWidth),below:child.top>=header.bottom};
      }));
      assert(nesting.length>0 && nesting.every(n=>n.indent>=18 && n.line>=2 && n.below),`Disclosure hierarchy missing at ${width}px`);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Expanded content overflow at ${width}px`);
      await page.locator('#number-forms .numbers-more').first().scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(screenshots,`${width}-expanded-examples.png`)});
      await page.locator('.numbers-more').evaluateAll(groups=>groups.forEach(group=>{group.open=false;}));
    }
    await page.setViewportSize({width:1440,height:1000});
    await page.goto(base+'/index.html');
    await page.locator('[data-site-search]').fill('xkertejn');
    const result=page.locator('.site-search-result').filter({hasText:'xkertejn'}).first();
    await result.waitFor();
    const searchUrl=new URL(await result.getAttribute('href'),base+'/');
    assert.equal(searchUrl.hash,'#group-counts'); assert.equal(searchUrl.searchParams.get('find'),'xkertejn');
    await result.click();
    await page.locator('.is-search-target').first().waitFor({state:'visible'});
    assert.match(await page.locator('.is-search-target').first().textContent(),/xkertejn/);
    console.log(`PASS: ${pool.length} practice questions; all 205 source items mapped; desktop/mobile layout, builder, copy, review and progress persistence.`);
    await context.close();
  } finally { await browser.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
