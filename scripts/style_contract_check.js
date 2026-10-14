const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
// Existing independent page systems are not migrated by the numbers refactor.
// New page styles are checked by default; this list must not grow casually.
const legacyPages=['pages.css','lesson01-practice.css','topic-picker.css','vocabulary-games.css','word-search.css'];
const owners=['assets/css/site/components.css','assets/css/site/print.css'];
const diagramSurfaces={
  '.numbers-nav-heading':['color'],
  '.numbers-builder-group-label':['color'],
  '.numbers-fraction-parts > span':['border','background'],
  '.numbers-fraction-parts > .is-filled':['background'],
  '.numbers-builder-answer':['border-bottom'],
  '.numbers-builder-group + .numbers-builder-group':['border-inline-start','border-top'],
  '.numbers-reference-subgroup':['border-top'],
  '.numbers-breakdown':['border-top']
};
function filesIn(dir,extension='.css'){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  if(e.isDirectory())return ['.git','node_modules','target','visual-regression'].includes(e.name)||e.name.startsWith('tmp')?[]:filesIn(path.join(dir,e.name),extension);
  return e.name.endsWith(extension)?[path.join(dir,e.name)]:[];
});}
async function main(){
  const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser=await chromium.launch(process.env.PLAYWRIGHT_USE_BUNDLED==='1'||!fs.existsSync(chrome)?{}:{executablePath:chrome});
  try{
    const page=await browser.newPage();
    const files=filesIn(path.join(root,'assets/css')).map(file=>({file:path.relative(root,file).replace(/\\/g,'/'),text:fs.readFileSync(file,'utf8')}));
    const html=filesIn(root,'.html').map(file=>({file:path.relative(root,file).replace(/\\/g,'/'),text:fs.readFileSync(file,'utf8')}));
    const result=await page.evaluate(({files,html,legacyPages,owners,diagramSurfaces})=>{
      function inspect(file,text){
        const issues=[];
        const sheet=new CSSStyleSheet();sheet.replaceSync(text);
        const isPage=!file.startsWith('scripts/fixtures/')&&!file.includes('/site/')&&!file.includes('/themes/')&&!['theme.css','site.css',...legacyPages].includes(file.split('/').pop());
        const shared=/\.(?:study-(?:field|input|check|option|token|icon-button|link-button|disclosure|disclosure-body|question|feedback|contrast|live-status|progress-status)|control-row|print-sheet|copy-fallback)(?:--[\w-]+)?(?=[\s,.#:{>+~\[]|$)/;
        const surface=/^(?:background(?:-.+)?|color|border(?:-.+)?|box-shadow|font(?:-family)?|outline(?:-.+)?)$/;
        function walk(rules){for(const rule of rules){
          if(rule.cssRules)walk(rule.cssRules);
          if(!rule.selectorText||!rule.style)continue;
          const selectors=rule.selectorText.split(',').map(s=>s.trim());
          for(const property of rule.style){
            const value=rule.style.getPropertyValue(property);
            if(/^(?:--control-|--study-question-)/.test(property)&&file!=='assets/css/theme.css'&&!file.includes('/themes/'))issues.push(`${file}: ${property} must be owned by the theme`);
            if(!owners.includes(file)&&shared.test(rule.selectorText)&&surface.test(property))issues.push(`${file}: ${rule.selectorText} redefines shared ${property}`);
            if(!isPage)continue;
            if(surface.test(property)&&!selectors.every(s=>diagramSurfaces[s]?.some(p=>property===p||property.startsWith(p+'-'))))issues.push(`${file}: ${rule.selectorText}: ${property} belongs to shared components`);
            const spacing=/^(?:gap|row-gap|column-gap|padding(?:-.+)?|margin(?:-.+)?|font-size)$/;
            if(spacing.test(property)&&/\d+(?:px|rem)/.test(value.replace(/\b0(?:px|rem)\b/g,'0'))&&!selectors.every(s=>s==='.numbers-fraction-parts'))issues.push(`${file}: ${rule.selectorText}: ${property} must use a theme token`);
          }
        }}
        walk(sheet.cssRules);return issues;
      }
      function inspectHTML(file,text){
        const doc=new DOMParser().parseFromString(text,'text/html');
        return [...doc.querySelectorAll('style')].flatMap((n,i)=>inspect(file+'#style-'+i,n.textContent))
          .concat([...doc.querySelectorAll('[style]')].map(n=>`${file}: inline style on ${n.tagName} bypasses shared ownership`));
      }
      return {issues:[...files.flatMap(({file,text})=>inspect(file,text)),...html.flatMap(({file,text})=>inspectHTML(file,text))],
        mutations:[
          inspect('assets/css/new-page.css','.new-input { background: var(--surface-input); border-radius: 6px; }'),
          inspect('assets/css/new-page.css','@media (max-width:600px) { .new-page .study-input { color: red; } }'),
          inspect('assets/css/new-page.css','.new-toolbar { gap: 17px; }'),
          inspect('assets/css/new-page.css','.new-layout { display:grid; gap:var(--space-lg); }'),
          inspect('assets/css/new-page.css','@supports (display:grid) { .study-token--selected { border-radius:8px; } }'),
          inspectHTML('new-page.html','<style>.study-input { background: red; }</style>'),
          inspectHTML('new-page.html','<input class="study-input" style="border-radius: 8px">'),
          inspect('assets/css/new-page.css','.new-page { --control-radius: 8px; }')
        ]};
    },{files,html,legacyPages,owners,diagramSurfaces});
    assert(result.mutations[0].length>=2,'A renamed local control must be rejected');
    assert(result.mutations[1].some(s=>s.includes('redefines shared')),'Nested shared overrides must be rejected');
    assert(result.mutations[2].length,'Hardcoded page spacing must be rejected');
    assert.equal(result.mutations[3].length,0,'Tokenized page composition must remain allowed');
    assert(result.mutations[4].some(s=>s.includes('redefines shared')),'Shared modifiers must also be protected');
    assert(result.mutations[5].some(s=>s.includes('redefines shared')),'Inline style blocks must also be checked');
    assert(result.mutations[6].length,'Style attributes must not bypass shared ownership');
    assert(result.mutations[7].length,'Page-local token overrides must not bypass theme ownership');
    if(result.issues.length)throw new Error(result.issues.join('\n'));
    console.log('ok shared study style ownership, tokenized page composition and negative regression cases');
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
