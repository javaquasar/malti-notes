(() => {
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
  const button=(text,action)=>{const b=el('button',text,'action-button');b.type='button';b.addEventListener('click',action);return b;};
  const select=(name,values)=>{const s=el('select');s.setAttribute('aria-label',name);values.forEach(([value,text])=>{const o=el('option',text);o.value=value;s.append(o);});return s;};
  const label=(text,node)=>{const l=el('label',text);l.append(node);return l;};
  function formQuestions(data){
    return data.sections['number-forms'].filter(r=>r.kind==='forms').flatMap(r=>{
      const contrast=[{label:'Alone',form:r.maltese},{label:'Before a noun',form:r.ordinary,noun:'kotba'},{label:'Linking i',form:r.linked,noun:'itfal'}];
      return contrast.map((row,i)=>({id:`form-choice-${r.value}-${i}`,topic:'form-choice',difficulty:'foundation',
        prompt:i===0?`Count ${r.value} on its own.`:`${r.value} ${i===1?'books':'children'}: ___ ${row.noun}`,
        answer:row.form,accepted:row.form==='tlett'?['tlett','tlitt']:[row.form],
        options:[...new Set(contrast.map(c=>c.form))],contrast,
        hint:i===0?'There is no noun here.':i===1?'Use the ordinary counted form.':'This noun uses a linking i.',
        explanation:i===0?'Use the standalone form.':i===1?'Kotba takes the ordinary counted form.':'Itfal takes the linking-i form. Tlett and tlitt are accepted for three.',
        english:i===0?String(r.value):`${r.value} ${i===1?'books':'children'}`}));
    });
  }
  function mount({data,questions,controller,copy,announce}){
    const storage=window.MaltiStorage;
    const written=questions.filter(q=>!['integer','time'].includes(q.answerKind));
    const root=name=>document.querySelector(`[data-number-${name}]`);
    const explorer=root('explorer');
    const entries=Object.entries(data.sections).flatMap(([topic,rows])=>rows.filter(r=>r.value!=null&&r.maltese&&!['forms','rule','source-exercise','forecast'].includes(r.kind)).map(r=>({...r,topic})));
    questions.filter(q=>q.topic==='core'&&q.id.endsWith('-words')).forEach(q=>entries.push({value:q.prompt,maltese:q.answer,english:q.prompt,topic:'core'}));
    const unique=[...new Map(entries.map(r=>[`${r.topic}:${r.subtopic||''}:${r.value}`,r])).values()];
    const category=select('Explorer category',[['integer','Whole numbers'],['fractions','Fractions'],...['Decimals','Length','Weight','Volume','Money'].map(t=>[t,t])]);
    const value=el('input');value.type='text';value.setAttribute('aria-label','Number or quantity');value.setAttribute('list','numbers-explorer-values');
    const list=el('datalist');list.id='numbers-explorer-values';
    const output=el('div',null,'numbers-explorer-result');output.setAttribute('role','status');
    const choices=()=>unique.filter(r=>category.value==='integer'?['core','large-numbers','number-builder'].includes(r.topic):category.value==='fractions'?r.topic==='fractions':r.subtopic===category.value);
    function explore(){
      output.replaceChildren();const typed=value.value.trim().replace(/,/g,'');
      const row=choices().find(r=>String(r.value).replace(/,/g,'')===typed);
      if(!row){output.append(el('p','No checked example for this value. Choose a value from the list.'));return;}
      const answer=el('p',row.maltese);answer.lang='mt';output.append(answer,el('p',row.english));
      if(/^\d+$/.test(typed)){
        const n=Number(typed),parts=[Math.floor(n/1000)*1000,Math.floor(n%1000/100)*100,n%100].filter(Boolean);
        output.append(el('p',`${Number(typed).toLocaleString('en-GB')} = ${parts.join(' + ')||'0'}`));
        const tokens=row.maltese.replace(/,/g,'').split(' '),boundary=tokens.indexOf('elf');
        if(boundary>=0){const groups=el('div',null,'numbers-breakdown');
          [['Thousands',tokens.slice(0,boundary+1).join(' ')],['Remainder',tokens.slice(boundary+1).join(' ')]].filter(([,text])=>text).forEach(([name,text])=>{const p=el('p');p.append(el('small',name),el('strong',text));groups.append(p);});output.append(groups);
        }else if(n>=21&&n<=99)output.append(el('p','Within 21–99, read the unit before the ten.'));
      }else if(category.value==='fractions')output.append(el('p','Read the whole amount first, then the fraction.'));
      else output.append(el('p',row.subtopic==='Money'?'Read euros and cents separately.':'Keep the unit with the whole quantity; preserve written decimal digits.'));
      output.append(button('Copy result',()=>copy([{maltese:row.maltese,english:row.english}])));
    }
    function changeCategory(){list.replaceChildren();choices().forEach(r=>{const o=el('option');o.value=r.value;o.label=r.english;list.append(o);});value.value=String(choices()[0]?.value||'');explore();}
    const explorerForm=el('form',null,'numbers-tool-controls');const go=el('button','Explore','action-button');go.type='submit';
    explorerForm.append(label('Category',category),label('Number or quantity',value),go,list);explorerForm.addEventListener('submit',e=>{e.preventDefault();explore();});category.addEventListener('change',changeCategory);explorer.append(explorerForm,output);changeCategory();

    const situations=[
      {id:'shopping',name:'At the shop',steps:[['Count the items',q=>q.id==='noun-4-books'],['Read the price',q=>q.topic==='measurements'&&/ewro/.test(q.answer)]]},
      {id:'meeting',name:'Arrange a meeting',steps:[['Give a clock time',q=>q.id==='clock-3:00-words'],['Name the group size',q=>q.id==='noun-4-friends'],['Read a time expression',q=>q.topic==='extra-time-expressions']]},
      {id:'measuring',name:'Measure and cook',steps:[['Read a length',q=>q.topic==='measurements'&&/metri/.test(q.answer)],['Read a volume',q=>q.topic==='measurements'&&/litri/.test(q.answer)],['Read a fraction',q=>q.topic==='fractions']]},
      {id:'dates',name:'Dates and quantities',steps:[['Read the year',q=>q.topic==='large-numbers'&&Number(q.value)>=2000&&Number(q.value)<2100],['Count the children',q=>q.id==='noun-3-children'],['Read a duration',q=>q.topic==='dual-forms']]}
    ];
    const situationsRoot=root('situations');
    const situation=select('Situation',situations.map(s=>[s.id,s.name]));const itinerary=el('ol');let scenarioIds=[];
    function drawSituation(){itinerary.replaceChildren();scenarioIds=[];situations.find(s=>s.id===situation.value).steps.forEach(([name,test])=>{
      const q=written.find(test);if(q){scenarioIds.push(q.id);itinerary.append(el('li',`${name}: ${q.prompt}`));}
    });}
    situation.addEventListener('change',drawSituation);
    const situationActions=el('div',null,'numbers-tool-controls');situationActions.append(label('Situation',situation),button('Start situation',()=>{if(controller.startQuestions(scenarioIds))document.querySelector('#numbers-practice').scrollIntoView({behavior:'smooth'});}));
    situationsRoot.append(situationActions,itinerary);drawSituation();

    const speaking=root('speaking'),speakingKey='malti_numbers_speaking_v1';
    const speechState=storage.getJson(speakingKey,{ratings:{},index:0});
    const speechTopic=select('Speaking topic',[['all','All topics'],...['core','noun-counting','clock','fractions','measurements'].map(t=>[t,t==='core'?'Numbers':t==='noun-counting'?'Number + noun':t[0].toUpperCase()+t.slice(1)])]);
    const repeatSpeaking=el('input');repeatSpeaking.type='checkbox';
    if([...speechTopic.options].some(o=>o.value===speechState.topic))speechTopic.value=speechState.topic;
    repeatSpeaking.checked=!!speechState.repeatOnly;
    const speechPrompt=el('p',null,'numbers-question'),speechAnswer=el('div'),speechStats=el('p');speechAnswer.hidden=true;let speechCurrent=null;
    const speechPool=()=>written.filter(q=>(speechTopic.value==='all'||q.topic===speechTopic.value)&&!q.id.startsWith('form-choice')&&(!repeatSpeaking.checked||speechState.ratings[q.id]?.rating==='again'));
    function drawSpeech(){
      const pool=speechPool();speechCurrent=pool[(speechState.index||0)%pool.length];speechPrompt.textContent=speechCurrent?.prompt||'No speaking prompts to repeat in this selection.';speechAnswer.replaceChildren(el('p',speechCurrent?.answer));speechAnswer.hidden=true;
      ratingButtons.forEach(b=>b.disabled=true);reveal.disabled=!speechCurrent;
      const ratings=Object.values(speechState.ratings);speechStats.textContent=`${ratings.filter(r=>r.rating==='confident').length} confident · ${ratings.filter(r=>r.rating==='again').length} to repeat · Self-assessed, not pronunciation scored`;
    }
    const reveal=button('Reveal spoken answer',()=>{speechAnswer.hidden=false;ratingButtons.forEach(b=>b.disabled=false);});
    const rate=rating=>{if(!speechCurrent)return;speechState.ratings[speechCurrent.id]={rating,at:Date.now()};storage.setJson(speakingKey,speechState);advanceSpeech();};
    const ratingButtons=[button('Confident',()=>rate('confident')),button('Practise again',()=>rate('again'))];
    function advanceSpeech(){speechState.index=(speechState.index||0)+1;storage.setJson(speakingKey,speechState);drawSpeech();}
    const speechActions=el('div',null,'toolbar-row');speechActions.append(reveal,...ratingButtons,button('Next speaking prompt',advanceSpeech));
    [speechTopic,repeatSpeaking].forEach(n=>n.addEventListener('change',()=>{speechState.index=0;speechState.topic=speechTopic.value;speechState.repeatOnly=repeatSpeaking.checked;storage.setJson(speakingKey,speechState);drawSpeech();}));
    speaking.append(label('Topic',speechTopic),label('Repeat speaking mistakes only',repeatSpeaking),speechPrompt,speechAnswer,speechActions,speechStats);drawSpeech();

    const worksheet=root('worksheet');
    const sheetTopic=select('Worksheet topic',[['all','All topics'],...[...new Set(written.map(q=>q.topic))].map(t=>[t,t==='form-choice'?'Choose a Number Form':t.replace(/-/g,' ')])]);
    const count=select('Worksheet length',[['5','5 questions'],['10','10 questions']]);
    const answers=el('input');answers.type='checkbox';const translations=el('input');translations.type='checkbox';
    const preview=el('div',null,'numbers-worksheet-preview');preview.setAttribute('aria-live','polite');let sheet=[];
    function buildSheet(){
      const pool=written.filter(q=>sheetTopic.value==='all'||q.topic===sheetTopic.value);
      // Spread a mixed worksheet across topics instead of taking the first source block.
      const groups=new Map();pool.forEach(q=>{if(!groups.has(q.topic))groups.set(q.topic,[]);groups.get(q.topic).push(q);});
      sheet=[];while(sheet.length<Number(count.value)&&[...groups.values()].some(g=>g.length))for(const group of groups.values())if(group.length&&sheet.length<Number(count.value))sheet.push(group.shift());
      renderSheet();
    }
    function lines(){return sheet.map((q,i)=>`${i+1}. ${q.prompt}\n${answers.checked?'Answer: '+q.answer:'____________________'}${translations.checked&&q.english?'\nEnglish: '+q.english:''}`).join('\n\n');}
    function renderSheet(){preview.replaceChildren(el('h3','Numbers and Time'),el('p','Name: ____________________'),el('p','Date: ____________________'),el('pre',lines()));}
    const sheetControls=el('div',null,'numbers-tool-controls');
    sheetControls.append(label('Topic',sheetTopic),label('Length',count),label('Include answers',answers),label('English translation',translations));
    const sheetActions=el('div',null,'toolbar-row');
    sheetActions.append(button('Copy worksheet',async()=>{try{await navigator.clipboard.writeText('Numbers and Time\n\n'+lines());announce('Worksheet copied.');}catch{announce('Clipboard unavailable. Use the printable worksheet.');}}),button('Print worksheet',()=>{
      document.body.classList.add('numbers-print-worksheet');window.print();
    }));
    window.addEventListener('afterprint',()=>document.body.classList.remove('numbers-print-worksheet'));
    [sheetTopic,count].forEach(n=>n.addEventListener('change',buildSheet));[answers,translations].forEach(n=>n.addEventListener('change',renderSheet));
    worksheet.append(sheetControls,sheetActions,preview);buildSheet();
  }
  window.MaltiNumbersTools={mount,formQuestions};
})();
