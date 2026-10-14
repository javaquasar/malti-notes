const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
async function main(){
  const server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.wasm':'application/wasm'};
    fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':(mime[path.extname(file)]||'application/octet-stream')+'; charset=utf-8'});res.end(error?'Not found':data);});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
  let browser;
  try{
    browser=await chromium.launch(process.env.PLAYWRIGHT_USE_BUNDLED==='1'||!fs.existsSync(chrome)?{}:{executablePath:chrome});
    const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage(),catalog=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/numbers_calendar_time.html');await page.waitForFunction(()=>window.MaltiNumbersExpansion);
    await catalog.goto(base+'/scripts/fixtures/ui_component_catalog.html');
    const practice=page.locator('[data-numbers-practice]');
    await practice.getByLabel('Practice topic').selectOption('form-choice');
    const answer=await page.evaluate(()=>window.MaltiNumbersExpansion.getCurrent().answer);
    await practice.getByLabel('Your answer').fill(answer);await practice.getByRole('button',{name:'Check answer',exact:true}).click();
    const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem('malti_numbers_extended_v1')).results);
    await page.locator('#number-forms .numbers-more').first().evaluate(n=>{n.open=true;});
    const bank=page.locator('#number-builder .numbers-word-bank .numbers-word');await bank.first().click();
    const signature=node=>{const s=getComputedStyle(node);return [s.backgroundColor,s.borderRadius,s.borderTopWidth,s.paddingTop,s.paddingRight,s.fontFamily,s.minHeight];};
    const output=path.join(root,'tmp_numbers_sessions');fs.mkdirSync(output,{recursive:true});
    const axe=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');await page.addScriptTag({content:axe});
    for(const theme of ['classic','forest','contrast']){
      await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await catalog.evaluate(t=>document.documentElement.dataset.theme=t,theme);
      assert.deepEqual(await page.locator('[data-number-explorer] .study-input').first().evaluate(signature),await catalog.locator('[data-component="study-fields"] .study-input').first().evaluate(signature),theme+' field contract');
      assert.deepEqual(await bank.first().evaluate(signature),await catalog.locator('.study-token').first().evaluate(signature),theme+' token contract');
      for(const width of [1440,390,320]){
        await page.setViewportSize({width,height:1000});await catalog.setViewportSize({width,height:1000});
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${theme}/${width} page overflow`);
        assert(await catalog.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${theme}/${width} catalog overflow`);
        const heights=await page.locator('#number-builder .study-token').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().height));assert(heights.every(h=>h===48));
        for(const id of ['number-explorer','numbers-practice','number-builder','number-worksheet']){
          await page.evaluate(id=>window.MaltiNumbersExpansion.navigateTo(id),id);
          const target=page.locator('#'+id);await target.scrollIntoViewIfNeeded();await target.screenshot({path:path.join(output,`shared-${theme}-${width}-${id}.png`)});
        }
        if(width!==320){
          const violations=await page.evaluate(async()=>{
            const r=await window.axe.run({include:['#numbers-practice','#number-explorer','#number-speaking','#number-worksheet','#number-builder']},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});
            return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));
          });assert.deepEqual(violations,[],`${theme}/${width} accessibility`);
        }
      }
    }
    // Changing central tokens must reach the real page and the catalog alike.
    for(const target of [page,catalog])await target.evaluate(()=>{
      document.documentElement.style.setProperty('--control-height','52px');document.documentElement.style.setProperty('--control-token-height','56px');document.documentElement.style.setProperty('--control-radius','10px');
    });
    assert.equal(await bank.first().evaluate(n=>n.getBoundingClientRect().height),56);
    assert.equal(await catalog.locator('.study-token').first().evaluate(n=>n.getBoundingClientRect().height),56);
    assert.equal(await page.locator('[data-number-explorer] .study-input').first().evaluate(n=>getComputedStyle(n).borderRadius),'10px');
    assert.equal(await page.locator('[data-number-explorer] .study-input').first().evaluate(n=>getComputedStyle(n).minHeight),'52px');
    await page.evaluate(()=>document.body.classList.add('printing-sheet'));await page.emulateMedia({media:'print'});
    assert(await page.locator('.print-sheet').isVisible());assert(!(await page.locator('#numbers').isVisible()));assert(!(await page.locator('[data-number-worksheet] .control-row').isVisible()));
    await page.pdf({path:path.join(output,'shared-worksheet.pdf'),format:'A4'});
    await page.emulateMedia({media:'screen'});await page.reload();await page.waitForFunction(()=>window.MaltiNumbersExpansion);
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('malti_numbers_extended_v1')).results),progress);
    assert.deepEqual(errors,[]);
    console.log('PASS: shared catalog/page contracts, global token propagation, three themes at 320/390/1440px, accessibility, worksheet PDF and unchanged progress.');
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
