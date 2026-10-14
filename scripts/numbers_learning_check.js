const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
async function main(){
  const root=path.resolve(__dirname,'..');let server;
  let base=process.env.NUMBERS_TEST_URL;
  if(!base){
    server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
      const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.wasm':'application/wasm'};
      fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':(mime[path.extname(file)]||'application/octet-stream')+'; charset=utf-8'});res.end(error?'Not found':data);});});
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;
  }
  const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
  let browser;
  try{
    browser=await chromium.launch(process.env.PLAYWRIGHT_USE_BUNDLED==='1'||!fs.existsSync(chrome)?{}:{executablePath:chrome});
    const page=await browser.newPage({viewport:{width:1440,height:1000},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
    await page.goto(base+'/numbers_calendar_time.html');await page.waitForFunction(()=>window.MaltiNumbersExpansion);
    const practice=page.locator('[data-numbers-practice]'),current=()=>page.evaluate(()=>window.MaltiNumbersExpansion.getCurrent());
    const navigate=id=>page.evaluate(id=>window.MaltiNumbersExpansion.navigateTo(id),id);
    const start=id=>page.evaluate(id=>window.MaltiNumbersExpansion.startQuestions([id]),id);
    const next=()=>practice.getByRole('button',{name:'Next',exact:true}).click();
    const submit=async answer=>{await practice.getByLabel('Your answer',{exact:true}).fill(answer);await practice.getByRole('button',{name:'Check answer',exact:true}).click();};
    assert(await practice.isVisible());assert(!(await page.locator('#numbers').isVisible()));
    assert.equal(await page.locator('main.content > section:visible').first().getAttribute('id'),'numbers-practice');
    const modes=page.getByRole('group',{name:'Numbers page view',exact:true});
    await modes.getByRole('button',{name:'Reference',exact:true}).click();assert(await page.locator('#numbers').isVisible());assert(!(await practice.isVisible()));
    await page.reload();await page.waitForFunction(()=>window.MaltiNumbersExpansion);assert(await page.locator('#numbers').isVisible());
    await page.getByLabel('Reference topic',{exact:true}).selectOption('fractions');assert(await page.locator('#fractions').isVisible());assert(!(await page.locator('#months').isVisible()));
    await page.getByLabel('Reference topic',{exact:true}).selectOption('all');assert(await page.locator('#months').isVisible());
    await page.reload();await page.waitForFunction(()=>window.MaltiNumbersExpansion);assert.equal(await page.getByLabel('Reference topic',{exact:true}).inputValue(),'all');
    await page.evaluate(()=>{location.hash='numbers-practice';});await practice.waitFor({state:'visible'});
    const pool=await page.evaluate(()=>window.MaltiNumbersExpansion.getQuestions());
    const diagnoses=[['core-23-words','tlieta għoxrin','linking-word'],['core-23-words','għoxrin u tlieta','word-order'],['noun-3-children','tlieta itfal','number-form'],['clock-3:45-words','l-erbgħa u kwart','clock-direction']];
    const measure=pool.find(q=>q.answer.includes('litri')&&q.topic==='measurements');assert(measure);diagnoses.push([measure.id,measure.answer.replace('litri','metri'),'unit']);
    for(const [id,given,type] of diagnoses){
      await start(id);await submit(given);assert.equal(await practice.locator('[data-number-diagnosis]').getAttribute('data-error-type'),type);assert.equal(await practice.locator('[data-number-diagnosis] mark').count(),2);await next();
    }
    await page.getByRole('group',{name:'Numbers page view',exact:true}).getByRole('button',{name:'My mistakes',exact:true}).click();
    const mistakes=page.locator('[data-number-mistakes]');assert.equal(await mistakes.locator('details').count(),new Set(diagnoses.map(([id])=>id)).size);
    const first=mistakes.locator('details').filter({has:page.locator('summary',{hasText:'23'})}).first();await first.locator('summary').click();
    await first.getByRole('button',{name:'Practise speaking',exact:true}).click();
    const speech=page.locator('[data-number-speaking]');assert(await speech.isVisible());assert.equal(await speech.locator('.numbers-question').textContent(),'23');
    const before=await page.evaluate(()=>window.MaltiNumbersExpansion.getResults());
    await speech.getByRole('button',{name:'Reveal spoken answer',exact:true}).click();await speech.getByRole('button',{name:'Confident',exact:true}).click();
    assert.deepEqual(await page.evaluate(()=>window.MaltiNumbersExpansion.getResults()),before);
    await speech.getByLabel('Speaking source').selectOption('written');assert(!(await speech.locator('.numbers-question').textContent()).includes('No speaking'));

    await navigate('numbers-practice');await practice.getByLabel('Answer mode').selectOption('guided');
    const id='noun-3-books',q=pool.find(q=>q.id===id);
    await start(id);await practice.getByRole('button',{name:'Show hint',exact:true}).click();await practice.locator('.numbers-option').getByText(q.answer,{exact:true}).click();await next();
    assert.deepEqual(await page.evaluate(id=>window.MaltiNumbersExpansion.getLearningStage(id),id),{stage:'choose',streak:0});
    for(let i=0;i<2;i++){
      await start(id);await practice.locator('.numbers-option').getByText(q.answer,{exact:true}).click();
      if(i===0){await page.reload();await page.waitForFunction(()=>window.MaltiNumbersExpansion);assert.equal((await page.evaluate(id=>window.MaltiNumbersExpansion.getLearningStage(id),id)).streak,1);}
      await next();
    }
    assert.equal((await page.evaluate(id=>window.MaltiNumbersExpansion.getLearningStage(id),id)).stage,'build');
    for(let i=0;i<2;i++){
      await start(id);const bank=practice.getByRole('group',{name:'Answer word bank',exact:true});
      for(const word of q.answer.split(' '))await bank.getByRole('button',{name:word,exact:true}).first().click();
      const selected=practice.getByRole('group',{name:'Selected answer words',exact:true});
      await selected.getByRole('button').last().press('Enter');assert(await bank.getByRole('button',{name:'kotba',exact:true}).evaluate(n=>n===document.activeElement));
      await bank.getByRole('button',{name:'kotba',exact:true}).press('Enter');
      await practice.getByRole('button',{name:'Check answer',exact:true}).click();await next();
    }
    assert.equal((await page.evaluate(id=>window.MaltiNumbersExpansion.getLearningStage(id),id)).stage,'write');
    const supported=await page.evaluate(id=>window.MaltiNumbersExpansion.getResults()[id],id);assert.equal(supported.independentCorrect,0);assert.equal(supported.streak,0);
    await start(id);await submit(q.answer);await next();assert.equal((await page.evaluate(id=>window.MaltiNumbersExpansion.getResults()[id],id)).independentCorrect,1);
    await speech.getByLabel('Speaking source').selectOption('stages');assert.match(await speech.textContent(),/Written learning stage:/);

    await navigate('number-comparisons');const comparison=page.locator('[data-number-comparisons]');
    await comparison.getByLabel('Number for comparison').selectOption('3');
    const text=await comparison.textContent();for(const phrase of ['tlieta','tliet kotba','tlett itfal','it-tlieta','tliet ewro'])assert(text.includes(phrase),phrase);
    await comparison.getByRole('button',{name:'Practise these contexts',exact:true}).click();assert((await page.evaluate(()=>window.MaltiNumbersExpansion.getSession())).ids.length>=5);
    await practice.getByRole('button',{name:'Finish session',exact:true}).click();
    await practice.getByLabel('Answer mode').selectOption('guided');await practice.getByLabel('Practice topic').selectOption('core');await practice.getByLabel('Test mode').check();await practice.getByRole('button',{name:'Start session',exact:true}).click();
    assert(await practice.getByLabel('Your answer',{exact:true}).isVisible());assert.equal(await practice.locator('.numbers-option').count(),0);
    await submit('incorrect');assert.equal(await practice.locator('.numbers-feedback').textContent(),'Answer recorded.');assert(!(await practice.locator('[data-number-diagnosis]').isVisible()));
    assert(await speech.getByRole('button',{name:'Reveal spoken answer',exact:true}).isDisabled());
    await modes.getByRole('button',{name:'My mistakes',exact:true}).click();assert.match(await mistakes.textContent(),/Finish the current test/);assert.equal(await mistakes.locator('details').count(),0);
    await navigate('numbers-practice');await practice.getByRole('button',{name:'Finish session',exact:true}).click();
    const output=path.resolve(__dirname,'../tmp_numbers_sessions');fs.mkdirSync(output,{recursive:true});
    for(const width of [1440,390,320]){
      await page.setViewportSize({width,height:1000});
      for(const section of ['numbers','numbers-practice','numbers-mistakes','number-comparisons','number-speaking']){
        await navigate(section);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${section} overflow at ${width}`);await page.waitForTimeout(200);await page.screenshot({path:path.join(output,`learning-${width}-${section}.png`)});
      }
    }
    assert.deepEqual(errors,[]);console.log('PASS: targeted diagnoses, persisted page modes/deep links, guided choose/build/write with independent advancement, keyboard token return, contextual comparisons, mistake-linked speaking, test secrecy and mobile layouts.');
  }finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
