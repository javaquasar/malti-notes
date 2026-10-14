const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const base=process.env.NUMBERS_TEST_URL||'http://127.0.0.1:4190';
const output=path.resolve(__dirname,'../tmp_numbers_sessions');fs.mkdirSync(output,{recursive:true});
async function main(){
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},serviceWorkers:'block'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/numbers_calendar_time.html');await page.waitForFunction(()=>window.MaltiNumbersExpansion);
    const practice=page.locator('[data-numbers-practice]');
    const current=()=>page.evaluate(()=>window.MaltiNumbersExpansion.getCurrent());
    const next=()=>practice.getByRole('button',{name:'Next',exact:true}).click();
    const submit=async answer=>{await practice.locator('input[type="text"]').fill(answer);await practice.locator('button[type="submit"]').click();};
    for(const name of ['Units','Decimals','Length','Weight','Volume','Money'])assert.equal(await page.locator(`[data-reference-subgroup="${name}"]`).count(),1);
    const pool=await page.evaluate(()=>window.MaltiNumbersExpansion.getQuestions());
    const nouns=pool.filter(q=>q.topic==='noun-counting');assert.equal(nouns.length,63);
    assert.equal(nouns.find(q=>q.id==='noun-4-friends').answer,'erbat iħbieb');
    assert.deepEqual(nouns.find(q=>q.id==='noun-3-children').accepted,['tlett itfal','tlitt itfal']);
    assert.equal(nouns.find(q=>q.id==='noun-5-books').answer,'ħames kotba');
    await practice.getByLabel('Practice topic').selectOption('noun-counting');
    await practice.getByLabel('Practice difficulty').selectOption('advanced');assert.equal(await current(),null);
    await practice.getByLabel('Practice difficulty').selectOption('foundation');
    await practice.getByRole('button',{name:'Start session',exact:true}).click();
    const session=await page.evaluate(()=>window.MaltiNumbersExpansion.getSession());assert.equal(session.ids.length,5);assert.equal(new Set(session.ids).size,5);
    assert(await practice.getByLabel('Practice topic').isDisabled());
    const first=await current();await practice.getByRole('button',{name:'Show hint',exact:true}).click();await submit(first.answer);
    await page.reload();await page.waitForFunction(()=>window.MaltiNumbersExpansion);
    assert.equal((await current()).id,first.id);assert(await practice.locator('input[type="text"]').isDisabled());
    await next();await submit('wrong noun');await next();
    await practice.getByRole('button',{name:'Show answer',exact:true}).click();await next();
    await submit((await current()).answer);await next();await next();
    const summary=practice.locator('.numbers-session-summary');assert(await summary.isVisible());
    const completed=await page.evaluate(()=>window.MaltiNumbersExpansion.getLastSession());
    assert.deepEqual(completed.results.map(r=>r.outcome),['assisted-correct','incorrect','revealed','independent-correct','skipped']);
    assert.match(await summary.textContent(),/1 independent correct · 1 assisted correct · 1 incorrect · 1 revealed · 1 skipped/);
    const wrongIds=completed.results.filter(r=>!r.outcome.endsWith('correct')||r.outcome==='incorrect').map(r=>r.id);
    await summary.getByRole('button',{name:'Retry session mistakes',exact:true}).click();
    assert.deepEqual((await page.evaluate(()=>window.MaltiNumbersExpansion.getSession())).ids,wrongIds);
    await practice.getByRole('button',{name:'Finish session',exact:true}).click();
    await summary.getByRole('button',{name:'Continue practice',exact:true}).click();

    await practice.getByLabel('Practice topic').selectOption('all');await practice.getByLabel('Practice difficulty').selectOption('all');
    await practice.getByLabel('Session length').selectOption('10');await practice.getByLabel('Test mode').check();
    await practice.getByRole('button',{name:'Start session',exact:true}).click();
    assert.equal((await page.evaluate(()=>window.MaltiNumbersExpansion.getSession())).ids.length,10);
    assert(!(await practice.getByRole('button',{name:'Show hint',exact:true}).isVisible()));
    assert(await practice.getByRole('button',{name:'Copy answer',exact:true}).isDisabled());
    for(let n=0;n<10;n++){
      await submit(n===0?'wrong':(await current()).answer);
      assert.equal(await practice.locator('.numbers-feedback').textContent(),'Answer recorded.');await next();
    }
    const exam=await page.evaluate(()=>window.MaltiNumbersExpansion.getLastSession());
    assert.equal(exam.results.filter(r=>r.outcome==='independent-correct').length,9);
    assert.equal(exam.results.filter(r=>r.outcome==='incorrect').length,1);
    assert(new Set(exam.results.map(r=>r.topic)).size>1,'Mixed sessions need topic diversity');

    const builder=page.locator('#number-builder');await builder.getByLabel('Number to build').selectOption('0');
    const bankWord=word=>builder.locator('.numbers-word-bank .numbers-word:not(:disabled)').getByText(word,{exact:true}).first();
    for(const word of ['mija','u','tlieta'])await bankWord(word).click();
    const selected=builder.locator('.numbers-selected-word');
    const words=()=>selected.allTextContents();assert.deepEqual(await words(),['mija','u','tlieta']);
    await selected.nth(2).press('ArrowLeft');assert.deepEqual(await words(),['mija','tlieta','u']);
    await selected.nth(1).press('ArrowRight');assert.deepEqual(await words(),['mija','u','tlieta']);
    const beforeId=await selected.nth(1).getAttribute('data-word-index');await builder.getByLabel('Insert word at').selectOption(beforeId);
    await bankWord('elf').click();assert.deepEqual(await words(),['mija','elf','u','tlieta']);
    await selected.nth(1).press('Enter');assert.deepEqual(await words(),['mija','u','tlieta']);
    await builder.getByRole('button',{name:'Undo',exact:true}).click();assert.deepEqual(await words(),['mija','elf','u','tlieta']);
    await builder.getByRole('button',{name:'Undo',exact:true}).click();assert.deepEqual(await words(),['mija','u','tlieta']);
    await selected.nth(2).dragTo(selected.first());assert.deepEqual(await words(),['tlieta','mija','u']);
    await builder.getByRole('button',{name:'Check answer',exact:true}).click();assert.match(await builder.locator('[role="status"]').textContent(),/Check the thousands group/);
    for(const width of [1440,390,320]){
      await page.setViewportSize({width,height:900});
      for(const anchor of ['measurements','number-builder','numbers-practice']){
        await page.locator('#'+anchor).scrollIntoViewIfNeeded();
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${anchor} overflows at ${width}`);
        await page.screenshot({path:path.join(output,`${width}-${anchor}.png`)});
      }
    }
    assert.deepEqual(errors,[]);console.log('PASS: subtopics, 63 noun combinations, session resume, hint accounting, 10-question tests, mistakes retry, insertion, keyboard/drag reordering and mobile layout.');
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
