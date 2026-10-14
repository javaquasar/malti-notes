const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
async function main(){
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',permissions:['clipboard-read','clipboard-write']});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto((process.env.NUMBERS_TEST_URL||'http://127.0.0.1:4190')+'/numbers_calendar_time.html');
    await page.waitForFunction(()=>window.MaltiNumbersExpansion);
    const practice=page.locator('[data-numbers-practice]');
    const get=()=>page.evaluate(()=>window.MaltiNumbersExpansion.getCurrent());
    const submit=async value=>{await practice.getByLabel('Your answer').fill(value);await practice.getByRole('button',{name:'Check answer',exact:true}).click();};
    const pool=await page.evaluate(()=>window.MaltiNumbersExpansion.getQuestions());
    const forms=pool.filter(q=>q.topic==='form-choice');assert.equal(forms.length,27);
    for(const q of forms)assert(q.options.includes(q.answer));
    await practice.getByLabel('Practice topic').selectOption('form-choice');
    await submit((await get()).answer);assert(await practice.locator('.numbers-form-contrast').isVisible());assert.equal(await practice.locator('.numbers-form-contrast mark').count(),3);
    const record=await page.evaluate(()=>JSON.parse(localStorage.getItem('malti_numbers_extended_v1')));
    assert(Object.values(record.results).some(r=>r.streak===1&&r.dueAt>Date.now()));
    await practice.getByRole('button',{name:'Next',exact:true}).click();
    const failed=await get();await submit('wrong');
    // Three intervening answers bring a weak item back into the due queue.
    for(let i=0;i<3;i++){await practice.getByRole('button',{name:'Next',exact:true}).click();await submit((await get()).answer);}
    await practice.getByRole('button',{name:'Next',exact:true}).click();assert.equal((await get()).id,failed.id);
    await practice.getByRole('button',{name:'Show hint',exact:true}).click();await submit(failed.answer);
    const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('malti_numbers_extended_v1')));
    assert.equal(state.results[failed.id].assistedCorrect,1);assert.equal(state.results[failed.id].streak,0);
    await page.reload();await page.waitForFunction(()=>window.MaltiNumbersExpansion);
    assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('malti_numbers_extended_v1')).results[id].assistedCorrect,failed.id),1);
    const explorer=page.locator('[data-number-explorer]');
    await page.evaluate(()=>window.MaltiNumbersExpansion.navigateTo('number-explorer'));
    await explorer.getByLabel('Number or quantity',{exact:true}).fill('123655');await explorer.getByRole('button',{name:'Explore',exact:true}).click();
    assert.match(await explorer.textContent(),/123,655 = 123000 \+ 600 \+ 55/);assert.match(await explorer.locator('.numbers-breakdown').textContent(),/Thousands.*elf.*Remainder/s);
    for(const [category,value,pattern] of [['fractions','3/4',/tliet kwarti/],['Volume','9.60',/sitta żero/],['Money','3.5',/ewro/]]){
      await explorer.getByLabel('Explorer category').selectOption(category);await explorer.getByLabel('Number or quantity',{exact:true}).fill(value);await explorer.getByRole('button',{name:'Explore',exact:true}).click();assert.match(await explorer.locator('[role="status"]').textContent(),pattern);
    }
    await explorer.getByLabel('Number or quantity',{exact:true}).fill('not a number');await explorer.getByRole('button',{name:'Explore',exact:true}).click();assert.match(await explorer.textContent(),/No checked example/);
    const situations=page.locator('[data-number-situations]');
    await page.evaluate(()=>window.MaltiNumbersExpansion.navigateTo('number-situations'));
    for(const id of ['shopping','meeting','measuring','dates']){
      await situations.getByLabel('Situation',{exact:true}).selectOption(id);assert((await situations.locator('li').count())>=2);
      await situations.getByRole('button',{name:'Start situation',exact:true}).click();
      assert((await page.evaluate(()=>window.MaltiNumbersExpansion.getSession())).ids.length>=2);
      await practice.getByRole('button',{name:'Finish session',exact:true}).click();
    }
    const speaking=page.locator('[data-number-speaking]');
    const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('malti_numbers_extended_v1')).results);
    assert(!(await speaking.getByRole('button',{name:'Confident',exact:true}).isEnabled()));
    const spokenPrompt=await speaking.locator('.numbers-question').textContent();
    await speaking.getByRole('button',{name:'Reveal spoken answer',exact:true}).click();await speaking.getByRole('button',{name:'Practise again',exact:true}).click();
    await speaking.getByLabel('Repeat speaking mistakes only').check();assert.equal(await speaking.locator('.numbers-question').textContent(),spokenPrompt);
    await speaking.getByRole('button',{name:'Reveal spoken answer',exact:true}).click();await speaking.getByRole('button',{name:'Confident',exact:true}).click();assert.match(await speaking.textContent(),/No speaking prompts to repeat/);
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('malti_numbers_extended_v1')).results),before);
    await page.addScriptTag({url:(process.env.NUMBERS_TEST_URL||'http://127.0.0.1:4190')+'/assets/js/progress-backup.js'});
    assert(await page.evaluate(()=>{
      const old=localStorage.getItem('malti_numbers_speaking_v1'),backup=window.MaltiProgressBackup.exportBackup();
      localStorage.removeItem('malti_numbers_speaking_v1');window.MaltiProgressBackup.importBackup(backup);
      return localStorage.getItem('malti_numbers_speaking_v1')===old;
    }));
    const sheet=page.locator('[data-number-worksheet]');
    assert(!(await sheet.locator('pre').textContent()).includes('Answer:'));
    await sheet.getByLabel('Include answers').check();await sheet.getByLabel('English translation').check();await sheet.getByLabel('Worksheet length').selectOption('10');
    assert.equal(((await sheet.locator('pre').textContent()).match(/Answer:/g)||[]).length,10);
    assert.match(await sheet.locator('pre').textContent(),/English:/);
    await sheet.getByRole('button',{name:'Copy worksheet',exact:true}).click();assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/Numbers and Time\r?\n\r?\n1\./);
    await sheet.getByLabel('Include answers').uncheck();assert(!(await sheet.locator('pre').textContent()).includes('Answer:'));
    await page.evaluate(()=>document.body.classList.add('printing-sheet'));await page.emulateMedia({media:'print'});
    assert(!(await page.locator('.hero').isVisible()));assert(!(await page.locator('#numbers').isVisible()));assert(await sheet.locator('pre').isVisible());
    await page.emulateMedia({media:'screen'});await page.evaluate(()=>document.body.classList.remove('printing-sheet'));
    const output=path.resolve(__dirname,'../tmp_numbers_sessions');fs.mkdirSync(output,{recursive:true});
    for(const width of [1440,390,320]){
      await page.setViewportSize({width,height:1000});
      for(const id of ['number-explorer','number-situations','number-speaking','number-worksheet','numbers-practice']){
        await page.evaluate(id=>window.MaltiNumbersExpansion.navigateTo(id),id);
        await page.locator('#'+id).scrollIntoViewIfNeeded();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${id} overflow at ${width}`);
        await page.screenshot({path:path.join(output,`tools-${width}-${id}.png`)});
      }
    }
    assert.deepEqual(errors,[]);console.log('PASS: form contrasts, adaptive return and persistence, explorer, four scenarios, isolated speaking ratings, worksheet answers/translation/copy/print and responsive layouts.');
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
