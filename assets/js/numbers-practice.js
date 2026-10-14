(() => {
  const KEY='malti_numbers_extended_v1';
  const normalize=value=>String(value).normalize('NFKC').trim().toLocaleLowerCase().replace(/[’‘`´]/g,"'").replace(/[.!?]+$/g,'').replace(/\s+/g,' ');
  function difficultyFor(q) {
    if (['core','number-forms','noun-counting'].includes(q.topic)) return 'foundation';
    if (q.topic==='large-numbers' && Number(q.value || q.prompt.replace(/,/g,''))>=10000) return 'advanced';
    return 'intermediate';
  }
  function migrateLegacy(progress,storage) {
    const legacy=storage.getJson('malti_numbers_time_drill_v1',{});
    progress.legacyImported=progress.legacyImported || {};
    ['numbers','clock'].forEach(mode=>Object.entries(legacy[mode]?.results || {}).forEach(([id,result])=>{
      const match=id.match(/^(numbers|clock)-(.+)-(to-maltese|from-maltese)$/);
      if (!match) return;
      const target=`${match[1]==='numbers'?'core':'clock'}-${match[2]}-${match[3]==='to-maltese'?'words':'digits'}`;
      const prior=progress.legacyImported[id] || {attempts:0,correct:0};
      const added=Math.max(0,(result.attempts || 0)-prior.attempts);
      const correct=Math.max(0,(result.correct || 0)-prior.correct);
      if (added || correct) {
        const current=progress.results[target] || {attempts:0,correct:0};
        progress.results[target]={...current,attempts:current.attempts+added,correct:current.correct+correct,
          independentCorrect:(current.independentCorrect ?? current.correct)+correct,
          lastResult:current.lastResult || result.lastResult || 'incorrect'};
      }
      progress.legacyImported[id]={attempts:Math.max(prior.attempts,result.attempts || 0),correct:Math.max(prior.correct,result.correct || 0)};
    }));
  }
  function mount({root,questions,titles,copy,announce,fractionPicture}) {
    const storage=window.MaltiStorage;
    const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
    const button=(text,action)=>{const b=el('button',text,'action-button');b.type='button';b.addEventListener('click',action);return b;};
    const select=(name,values)=>{const s=el('select',null,'study-input');s.setAttribute('aria-label',name);values.forEach(([v,t])=>{const o=el('option',t);o.value=v;s.append(o);});return s;};
    const label=(text,node)=>{const l=el('label',text,node.type==='checkbox'?'study-check':'study-field');l.append(node);return l;};
    const all=questions.map(q=>({...q,difficulty:q.difficulty || difficultyFor(q)}));
    const byId=new Map(all.map(q=>[q.id,q]));
    const stored=storage.getJson(KEY,{});
    const progress={...stored,results:stored.results || {},shownAt:stored.shownAt || {},history:stored.history || [],turn:stored.turn || 0};
    migrateLegacy(progress,storage);
    let current=null,assisted=false,session=stored.session || null,lastSession=stored.lastSession || null;
    if (session && (!Array.isArray(session.ids) || session.ids.some(id=>!byId.has(id)) || session.index>=session.ids.length)) session=null;
    const topic=select('Practice topic',[['all','All topics'],...[...new Set(all.map(q=>q.topic))].map(id=>[id,titles[id]])]);
    const direction=select('Practice direction',[['all','Both directions'],['words','Write in Maltese'],['digits','Write in digits']]);
    const difficulty=select('Practice difficulty',[['all','All levels'],['foundation','Foundation'],['intermediate','Intermediate'],['advanced','Advanced']]);
    const mistakes=el('input');mistakes.type='checkbox';
    const adaptive=el('input');adaptive.type='checkbox';adaptive.checked=stored.adaptive!==false;
    const adaptiveLabel=label('Adaptive review',adaptive);
    const legacyMode=storage.getJson('malti_numbers_time_drill_v1',{}).activeMode;
    topic.value=[...topic.options].some(o=>o.value===stored.topic)?stored.topic:legacyMode==='clock'?'clock':legacyMode==='numbers'?'core':'all';
    direction.value=['all','words','digits'].includes(stored.direction)?stored.direction:'all';
    difficulty.value=['all','foundation','intermediate','advanced'].includes(stored.difficulty)?stored.difficulty:'all';
    const filters=el('div',null,'numbers-practice-filters control-row control-row--responsive no-print');
    const mistakeLabel=label('Mistakes only',mistakes);
    filters.append(label('Topic',topic),label('Direction',direction),label('Level',difficulty),mistakeLabel,adaptiveLabel);
    const length=select('Session length',[['5','5 questions'],['10','10 questions']]);
    const test=el('input');test.type='checkbox';const testLabel=label('Test mode',test);
    const sessionControls=el('div',null,'numbers-session-controls control-row no-print');
    const start=button('Start session',()=>startSession());
    const finish=button('Finish session',()=>finishSession(true));
    const previousSummary=button('Last session',()=>showSummary());
    sessionControls.append(label('Session',length),testLabel,start,finish,previousSummary);
    const stats=el('p',null,'muted');stats.setAttribute('aria-live','polite');
    const sessionStatus=el('p',null,'numbers-session-status study-progress-status');sessionStatus.setAttribute('role','status');
    const panel=el('div',null,'numbers-practice-panel');
    const prompt=el('p',null,'numbers-question study-question');prompt.lang='mt';
    const options=el('div',null,'numbers-options');
    const visual=el('div');
    const form=el('form',null,'numbers-answer-form control-row control-row--responsive no-print');
    const input=el('input',null,'study-input');input.type='text';input.autocomplete='off';input.spellcheck=false;
    const check=el('button','Check answer','action-button');check.type='submit';
    form.append(label('Your answer',input),check);
    const feedback=el('p',null,'numbers-feedback study-feedback');feedback.setAttribute('role','status');
    const contrast=el('div',null,'numbers-form-contrast study-contrast');contrast.hidden=true;
    const next=button('Next',()=>{
      if (session) {
        if (!session.results.some(r=>r.id===current.id)) recordSession('skipped');
        session.index++;
        if (session.index>=session.ids.length) {finishSession(false);return;}
      }
      renderQuestion();
    });
    const hint=button('Show hint',()=>{
      if (!current || inTest() || input.disabled) return;
      assisted=true;if(session&&!session.assistedIds.includes(current.id))session.assistedIds.push(current.id);
      feedback.textContent=current.hint || 'Consider the number, the unit and the noun before choosing a form.';save();
    });
    const reveal=button('Show answer',()=>{
      if (!current || input.disabled || inTest()) return;
      const prior=progress.results[current.id] || {attempts:0,correct:0};
      progress.results[current.id]={...prior,reveals:(prior.reveals || 0)+1,lastResult:'revealed'};
      schedule(false,true);recordSession('revealed');feedback.textContent=current.answer+' — '+current.explanation;showContrast();lock();save();updateStats();
    });
    const answerRow=()=>{
      const reversed=['integer','time'].includes(current.answerKind);
      return {maltese:reversed?current.prompt:current.answer,english:reversed?current.answer:(current.english || '')};
    };
    const saveAnswer=button('Save answer to review',()=>{
      if(!current||inTest())return;
      window.MaltiReviewStore.addSentence({id:'sentence::numbers-practice::'+current.id,...answerRow(),topic:titles[current.topic],sourcePage:'numbers_calendar_time.html#numbers-practice'});
      announce('Saved to review.');
    });
    const copyAnswer=button('Copy answer',()=>{if(current&&!inTest())copy([answerRow()]);});
    const controls=el('div',null,'toolbar-row no-print');controls.append(next,hint,reveal,saveAnswer,copyAnswer);
    panel.append(prompt,visual,options,form,controls,feedback,contrast);
    const mastery=el('details',null,'numbers-more study-disclosure');mastery.append(el('summary','Progress by topic'));
    const masteryBody=el('div',null,'numbers-disclosure-body study-disclosure-body');mastery.append(masteryBody);
    const summary=el('div',null,'numbers-session-summary');summary.hidden=true;summary.setAttribute('aria-live','polite');
    root.replaceChildren(filters,sessionControls,stats,sessionStatus,panel,summary,mastery);
    function inTest(){return session?.mode==='test';}
    function save(){
      Object.assign(progress,{topic:topic.value,direction:direction.value,difficulty:difficulty.value,adaptive:adaptive.checked,session,lastSession});
      storage.setJson(KEY,progress);
    }
    function pool(){return all.filter(q=>(topic.value==='all'||q.topic===topic.value)&&
      (direction.value==='all'||(direction.value==='digits')===['integer','time'].includes(q.answerKind))&&
      (difficulty.value==='all'||q.difficulty===difficulty.value)&&
      (!mistakes.checked||['incorrect','revealed'].includes(progress.results[q.id]?.lastResult)));}
    function updateStats(){
      const available=pool(),ids=new Set(available.map(q=>q.id));
      const rows=Object.entries(progress.results).filter(([id])=>ids.has(id)).map(([,r])=>r);
      stats.textContent=`${ids.size} questions · ${rows.reduce((n,r)=>n+r.attempts,0)} attempts · ${rows.reduce((n,r)=>n+(r.independentCorrect??r.correct),0)} independent correct · ${rows.reduce((n,r)=>n+(r.assistedCorrect||0),0)} assisted correct`;
      [topic,direction,difficulty,mistakes,length,test,start].forEach(n=>{n.disabled=!!session;});
      finish.hidden=!session;
      previousSummary.hidden=!lastSession||!!session;
      sessionStatus.textContent=session?`${session.mode==='test'?'Test':'Practice'} · Question ${session.index+1} of ${session.ids.length}`:'';
      masteryBody.replaceChildren();
      [...new Set(all.map(q=>q.topic))].forEach(t=>{
        const qs=all.filter(q=>q.topic===t),rs=qs.map(q=>progress.results[q.id]).filter(Boolean);
        const secure=rs.filter(r=>(r.streak||0)>=2).length;
        const due=rs.filter(r=>r.dueAt && r.dueAt<=Date.now()).length;
        masteryBody.append(el('p',`${titles[t]}: ${secure} / ${qs.length} secure · ${rs.filter(r=>r.attempts).length} attempted · ${due} due`));
      });
    }
    function priority(q){
      const r=progress.results[q.id];if(!adaptive.checked)return 1;
      if(r?.dueAt && (r.dueAt<=Date.now() || r.dueTurn<=progress.turn))return 0;
      if(!r?.attempts)return 1;
      return 2;
    }
    function schedule(correct,helped){
      const r=progress.results[current.id];progress.turn++;
      r.streak=correct&&!helped?(r.streak||0)+1:0;
      r.dueTurn=progress.turn+(r.streak?Math.min(40,6*2**(r.streak-1)):3);
      r.dueAt=Date.now()+(r.streak?Math.min(30,2**(r.streak-1))*86400000:600000);
    }
    function showContrast(){
      contrast.replaceChildren();contrast.hidden=!current?.contrast;
      (current?.contrast||[]).forEach(row=>{
        const p=el('p');p.append(el('span',row.label+': '),el('mark',row.form),document.createTextNode(row.noun?' '+row.noun:''));contrast.append(p);
      });
    }
    function lock(){input.disabled=true;check.disabled=true;hint.disabled=true;reveal.disabled=true;options.querySelectorAll('button').forEach(b=>{b.disabled=true;});}
    function recordSession(outcome){
      if(!session || session.results.some(r=>r.id===current.id))return;
      session.results.push({id:current.id,topic:current.topic,outcome,given:input.value,answer:current.answer,prompt:current.prompt});
    }
    function renderQuestion(){
      const old=current?.id;
      if(session)current=byId.get(session.ids[session.index]);
      else{
        const available=pool().sort((a,b)=>priority(a)-priority(b)||(progress.results[a.id]?.attempts||0)-(progress.results[b.id]?.attempts||0)||(progress.shownAt[a.id]||0)-(progress.shownAt[b.id]||0));
        current=available.find(q=>q.id!==old)||available[0]||null;
      }
      panel.hidden=false;summary.hidden=true;contrast.hidden=true;feedback.textContent='';feedback.dataset.state='';options.replaceChildren();visual.replaceChildren();input.value='';
      assisted=!!session?.assistedIds.includes(current?.id);
      [input,check,next,hint,reveal,saveAnswer,copyAnswer].forEach(n=>{n.disabled=!current;});
      if(!current){prompt.textContent=mistakes.checked?'No mistakes in this selection.':'No questions in this selection.';updateStats();save();return;}
      prompt.textContent=current.prompt;progress.shownAt[current.id]=Date.now();
      if(current.visualValue){const picture=fractionPicture(current.visualValue);if(picture)visual.append(picture);}
      current.options.forEach(text=>{const b=button(text,()=>{input.value=text;form.requestSubmit();});b.className='numbers-option study-option';options.append(b);});
      [hint,reveal].forEach(n=>{n.hidden=!!inTest();});saveAnswer.disabled=copyAnswer.disabled=!!inTest();
      const saved=session?.results.find(r=>r.id===current.id);
      if(saved){input.value=saved.given;lock();feedback.textContent=inTest()?'Answer recorded.':saved.outcome==='skipped'?'Skipped.':current.answer+' — '+current.explanation;if(!inTest())showContrast();}
      updateStats();save();
    }
    form.addEventListener('submit',event=>{
      event.preventDefault();if(!current||input.disabled)return;
      if(!input.value.trim()){feedback.textContent='Enter an answer first.';input.focus();return;}
      const norm=text=>current.answerKind==='integer'?normalize(text).replace(/[,\s]/g,''):normalize(text);
      const correct=current.accepted.some(a=>norm(a)===norm(input.value));
      const previous=progress.results[current.id]||{attempts:0,correct:0};
      progress.results[current.id]={...previous,attempts:previous.attempts+1,correct:previous.correct+(correct?1:0),
        independentCorrect:(previous.independentCorrect??previous.correct)+(correct&&!assisted?1:0),
        assistedCorrect:(previous.assistedCorrect||0)+(correct&&assisted?1:0),lastResult:correct?'correct':'incorrect'};
      schedule(correct,assisted);
      recordSession(correct?(assisted?'assisted-correct':'independent-correct'):'incorrect');
      feedback.dataset.state=inTest()?'recorded':correct?'correct':'incorrect';
      feedback.textContent=inTest()?'Answer recorded.':(correct?'Correct. ':'Answer: '+current.answer+'. ')+current.explanation;
      if(!inTest())showContrast();
      window.MaltiMistakeStore?.recordAttempt({id:'numbers-expanded::'+current.id,setId:'numbers-expanded',itemId:current.id,prompt:current.prompt,
        given:input.value,correctAnswer:current.answer,explanation:current.explanation,sourcePage:'numbers_calendar_time.html#'+(['core','noun-counting'].includes(current.topic)?'number-forms':current.topic==='clock'?'clock-time':current.topic==='dual-forms'?'group-counts':current.topic),
        topic:titles[current.topic],type:'fill-blank',category:'numbers-time'},correct);
      lock();save();updateStats();next.focus({preventScroll:true});
    });
    function chooseSession(candidates,size){
      const groups=new Map();
      candidates.sort((a,b)=>priority(a)-priority(b)||(progress.results[a.id]?.attempts||0)-(progress.results[b.id]?.attempts||0)||(progress.shownAt[a.id]||0)-(progress.shownAt[b.id]||0)).forEach(q=>{
        if(!groups.has(q.topic))groups.set(q.topic,[]);groups.get(q.topic).push(q.id);
      });
      const topics=[...groups.keys()];
      for(let i=topics.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[topics[i],topics[j]]=[topics[j],topics[i]];}
      const ids=[];
      while(ids.length<size && [...groups.values()].some(g=>g.length))topics.forEach(t=>{if(ids.length<size&&groups.get(t).length)ids.push(groups.get(t).shift());});
      return ids;
    }
    function startSession(retryIds){
      const ids=retryIds||chooseSession(pool(),Number(length.value));
      if(!ids.length){announce('No questions in this selection.');return;}
      session={id:Date.now(),ids,index:0,results:[],assistedIds:[],mode:retryIds?'practice':test.checked?'test':'practice',startedAt:new Date().toISOString()};
      renderQuestion();
    }
    function finishSession(early){
      if(!session)return;
      lastSession={...session,finishedAt:new Date().toISOString(),endedEarly:early};
      progress.history=[...progress.history,lastSession].slice(-20);session=null;save();showSummary();
    }
    function showSummary(){
      if(!lastSession)return;
      panel.hidden=true;summary.hidden=false;summary.replaceChildren(el('h3','Session summary'));
      const outcomes=lastSession.results;
      const count=state=>outcomes.filter(r=>r.outcome===state).length;
      summary.append(el('p',`${count('independent-correct')} independent correct · ${count('assisted-correct')} assisted correct · ${count('incorrect')} incorrect · ${count('revealed')} revealed · ${count('skipped')} skipped · ${lastSession.ids.length-outcomes.length} unanswered`));
      const table=el('table',null,'table-soft');const head=el('tr');
      [['Topic','Practice topic'],['Alone','Correct without hints'],['Hint','Correct after a hint'],['Review','Incorrect, revealed or skipped']].forEach(([text,title])=>{const th=el('th',text);th.scope='col';th.title=title;head.append(th);});
      const thead=el('thead');thead.append(head);table.append(thead);const body=el('tbody');
      const compactTopics={'large-numbers':'Large numbers','dual-forms':'Dual forms','number-forms':'Number forms',measurements:'Measures',fractions:'Fractions',temperature:'Weather',core:'Numbers',clock:'Clock time','noun-counting':'Counting'};
      [...new Set(outcomes.map(r=>r.topic))].forEach(t=>{
        const rows=outcomes.filter(r=>r.topic===t),tr=el('tr');
        [compactTopics[t]||titles[t],rows.filter(r=>r.outcome==='independent-correct').length,rows.filter(r=>r.outcome==='assisted-correct').length,rows.filter(r=>!['independent-correct','assisted-correct'].includes(r.outcome)).length].forEach(text=>tr.append(el('td',text)));tr.firstChild.title=titles[t];body.append(tr);
      });table.append(body);summary.append(table);
      const failed=outcomes.filter(r=>!['independent-correct','assisted-correct'].includes(r.outcome));
      failed.forEach(r=>{const d=el('details',null,'numbers-source-question study-disclosure study-card');d.append(el('summary',r.prompt),el('p','Answer: '+r.answer),el('p','Your answer: '+(r.given||'—')),el('small',byId.get(r.id).explanation));summary.append(d);});
      const actions=el('div',null,'toolbar-row');
      const retry=button('Retry session mistakes',()=>startSession(failed.map(r=>r.id)));retry.disabled=!failed.length;
      actions.append(retry,button('Continue practice',()=>renderQuestion()));summary.append(actions);
      updateStats();
    }
    [topic,direction,difficulty,mistakes].forEach(control=>control.addEventListener('change',renderQuestion));
    adaptive.addEventListener('change',()=>{save();if(!session)renderQuestion();});
    renderQuestion();
    return {getCurrent:()=>current?{...current}:null,getQuestions:()=>all.map(q=>({...q})),
      getSession:()=>session?structuredClone(session):null,getLastSession:()=>lastSession?structuredClone(lastSession):null,
      startQuestions:ids=>{if(session){announce('Finish the current session before starting a situation.');return false;}const valid=[...new Set(ids)].filter(id=>byId.has(id));if(!valid.length)return false;startSession(valid);return true;},
      setTopic:value=>{if(session){announce('Finish the current session before changing topics.');return;}topic.value=value;direction.value='all';difficulty.value='all';mistakes.checked=false;renderQuestion();}};
  }
  window.MaltiNumbersPractice={mount,difficultyFor};
})();
