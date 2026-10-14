(() => {
  const normal=value=>String(value).normalize('NFKC').toLocaleLowerCase().replace(/[’‘`´]/g,"'").replace(/[.,!?]/g,'').trim().replace(/\s+/g,' ');
  const words=value=>normal(value).split(' ').filter(Boolean);
  const same=(a,b)=>a.join(' ')===b.join(' ');
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
  function changed(text,other){
    const tokens=words(text),against=words(other);let start=0,end=tokens.length,otherEnd=against.length;
    while(start<end&&start<otherEnd&&tokens[start]===against[start])start++;
    while(end>start&&otherEnd>start&&tokens[end-1]===against[otherEnd-1]){end--;otherEnd--;}
    return {before:tokens.slice(0,start).join(' '),changed:tokens.slice(start,end).join(' ')||'(missing)',after:tokens.slice(end).join(' ')};
  }
  function diagnose(q,given){
    const got=words(given);
    const expected=(q.accepted||[q.answer]).reduce((best,value)=>{
      const distance=text=>{const ts=words(text);return Math.abs(ts.length-got.length)+ts.filter((t,i)=>t!==got[i]).length;};
      return distance(value)<distance(best)?value:best;
    },q.answer);
    const want=words(expected),withoutU=want.filter(w=>w!=='u');
    let type='answer',message='Compare the highlighted part with the checked answer.';
    if(same(got,withoutU)&&want.includes('u')){type='linking-word';message='The linking word u is missing. Keep it between the number groups.';}
    else if(same([...got].sort(),[...want].sort())){type='word-order';message='The words are right, but their order is different. Follow the order in the checked answer.';if(q.topic==='core')message='In 21–99, say the unit before the ten.';if(q.topic==='noun-counting')message='Put the counted number before its noun.';if(q.topic==='clock')message='Keep the hour and the time expression in the checked order.';}
    else if(q.contrast?.some(row=>normal(row.form)===got[0])&&got[0]!==want[0]){type='number-form';message=q.explanation;}
    else if(q.topic==='clock'&&((got.includes('u')&&want.includes('neqsin'))||(got.includes('neqsin')&&want.includes('u')))){type='clock-direction';message='Check past versus to: u adds minutes; neqsin counts back from the next hour.';}
    else {
      const units=['metru','metri','kilometru','kilometri','litru','litri','millimetru','millimetri','ċentimetru','ċentimetri','gramma','kilo','ewro','ċenteżmu','grad','gradi'];
      const gotUnit=got.find(w=>units.includes(w)),wantUnit=want.find(w=>units.includes(w));
      if(gotUnit&&wantUnit&&gotUnit!==wantUnit){type='unit';message=`Check the unit: this answer needs ${wantUnit}, not ${gotUnit}.`;}
      else if(wantUnit&&same(got,want.filter(w=>w!==wantUnit))){type='unit';message=`The unit ${wantUnit} is missing.`;}
      else if(q.topic==='large-numbers'){
        const boundary=want.findIndex(w=>['elf','elef','elfejn'].includes(w));
        type='place-value';message=boundary>=0&&same(got.slice(0,boundary+1),want.slice(0,boundary+1))?'The thousands group is correct. Check the remaining hundreds, tens and units.':'Check the thousands group separately from the remainder.';
      }else if(normal(given).normalize('NFD').replace(/\p{M}/gu,'').replace(/ħ/g,'h')===normal(expected).normalize('NFD').replace(/\p{M}/gu,'').replace(/ħ/g,'h')){
        type='spelling';message='Check the Maltese letters and diacritics in the highlighted part.';
      }
    }
    return {type,message,expected,given:String(given),givenDiff:changed(given,expected),expectedDiff:changed(expected,given)};
  }
  function renderDiagnosis(root,q,given){
    const result=diagnose(q,given);root.replaceChildren(el('p',result.message));root.dataset.errorType=result.type;
    for(const [label,diff] of [['Your answer',result.givenDiff],['Checked answer',result.expectedDiff]]){
      const p=el('p');p.append(document.createTextNode(label+': '));
      if(diff.before)p.append(document.createTextNode(diff.before+' '));
      const mark=el('mark',diff.changed);mark.lang='mt';p.append(mark);
      if(diff.after)p.append(document.createTextNode(' '+diff.after));root.append(p);
    }
    return result;
  }
  function choices(q,all){
    const distractors=[...(q.options||[]),...all.filter(other=>other.topic===q.topic&&other.id!==q.id&&!!other.answerKind===!!q.answerKind).map(other=>other.answer)]
      .filter(value=>!(q.accepted||[q.answer]).some(a=>normal(a)===normal(value)));
    const options=[q.answer,...new Set(distractors)].slice(0,4);
    // Stable rotation avoids always putting the checked answer first.
    const shift=[...q.id].reduce((n,c)=>n+c.charCodeAt(0),0)%options.length;
    return options.slice(shift).concat(options.slice(0,shift));
  }
  function mountViews(controller){
    if(new URLSearchParams(location.search).get('view')==='chapter')return {showSection:()=>{},refresh:()=>{}};
    const content=document.querySelector('main.content'),nav=el('div',null,'toolbar-row no-print');nav.setAttribute('role','group');nav.setAttribute('aria-label','Numbers page view');
    content.prepend(document.getElementById('numbers-practice'));
    nav.id='numbers-reference';
    const segmented=el('div',null,'segmented-toggle');nav.append(segmented);
    const compactTitle=el('h1','Numbers and Time');document.querySelector('.site-header').after(compactTitle,nav);
    const practiceIds=new Set(['number-builder','numbers-practice','number-situations','number-speaking','number-worksheet','number-comparisons']);
    let view=controller.getPageView(),printView=null;
    const buttons=new Map();
    const viewFor=section=>section.id==='numbers-mistakes'?'mistakes':practiceIds.has(section.id)?'practice':'reference';
    const sections=()=>[...content.children].filter(n=>n.tagName==='SECTION');
    const referenceSelect=el('select',null,'study-input');referenceSelect.setAttribute('aria-label','Reference topic');
    const allOption=el('option','All reference sections');allOption.value='all';referenceSelect.append(allOption);
    sections().filter(s=>viewFor(s)==='reference').forEach(section=>{const o=el('option',section.querySelector('h2')?.textContent || section.id);o.value=section.id;referenceSelect.append(o);});
    let referenceId=controller.getReferenceSection();if(![...referenceSelect.options].some(o=>o.value===referenceId))referenceId='numbers';
    const referenceLabel=el('label','Reference topic','study-field');referenceLabel.append(referenceSelect);nav.append(referenceLabel);
    const setReference=id=>{referenceId=id;referenceSelect.value=id;controller.setReferenceSection(id);};
    function refresh(){
      document.querySelector('.hero').hidden=view!=='reference';compactTitle.hidden=view==='reference';document.querySelector('.sidebar').hidden=view==='mistakes';
      sections().forEach(section=>{section.hidden=viewFor(section)!==view||(view==='reference'&&referenceId!=='all'&&section.id!==referenceId);});
      referenceLabel.hidden=view!=='reference';referenceSelect.value=referenceId;
      buttons.forEach((b,id)=>b.setAttribute('aria-pressed',String(id===view)));
      document.querySelectorAll('.sidebar li').forEach(li=>{
        const link=li.querySelector('a[href^="#"]');if(!link)return;
        const target=document.getElementById(decodeURIComponent(link.hash.slice(1))),section=target?.closest('main.content > section');li.hidden=!!section&&viewFor(section)!==view;
      });
      document.querySelectorAll('.sidebar .numbers-nav-heading').forEach(heading=>{
        let n=heading.nextElementSibling,visible=false;while(n&&!n.classList.contains('numbers-nav-heading')){if(!n.hidden)visible=true;n=n.nextElementSibling;}heading.hidden=!visible;
      });
    }
    function setView(next,replaceHash=false){
      view=['reference','practice','mistakes'].includes(next)?next:'practice';controller.setPageView(view);refresh();
      if(replaceHash)history.replaceState(null,'','#'+({reference:referenceId==='all'?'numbers-reference':referenceId,practice:'numbers-practice',mistakes:'numbers-mistakes'}[view]));
    }
    function route(){
      let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
      if(id==='numbers-reference'){setView('reference');return;}
      const section=document.getElementById(id)?.closest('main.content > section');if(section){if(viewFor(section)==='reference')setReference(section.id);setView(viewFor(section));}
    }
    for(const [id,title] of [['reference','Reference'],['practice','Practice'],['mistakes','My mistakes']]){
      const b=el('button',title,'toggle-chip');b.type='button';b.addEventListener('click',()=>{setView(id,true);nav.scrollIntoView({block:'start'});});buttons.set(id,b);segmented.append(b);
    }
    window.addEventListener('hashchange',route);
    referenceSelect.addEventListener('change',()=>{setReference(referenceSelect.value);setView('reference',true);});
    content.addEventListener('click',event=>{const a=event.target.closest('a[href^="#"]');if(a)setTimeout(route,0);});
    const observer=new MutationObserver(records=>{if(records.some(r=>r.target===content))refresh();});observer.observe(content,{childList:true});
    window.addEventListener('beforeprint',()=>{if(document.body.classList.contains('printing-sheet')){printView=view;document.querySelector('.print-sheet-section').hidden=false;}});
    window.addEventListener('afterprint',()=>{if(printView){setView(printView);printView=null;}});
    route();refresh();
    return {refresh,showSection:id=>{const section=document.getElementById(id)?.closest('main.content > section');if(section){if(viewFor(section)==='reference')setReference(section.id);setView(viewFor(section));history.replaceState(null,'','#'+id);document.getElementById(id).scrollIntoView({block:'start'});}}};
  }
  window.MaltiNumbersLearning={diagnose,renderDiagnosis,choices,mountViews};
})();
