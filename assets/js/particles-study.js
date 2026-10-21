(() => {
  'use strict';
  const KEY='malti_particles_study_v1';
  const storage=window.MaltiStorage;
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
  const button=(text,action)=>{const b=el('button',text,'action-button');b.type='button';b.addEventListener('click',action);return b;};
  const field=(text,input)=>{const label=el('label',text,input.type==='checkbox'?'study-check':'study-field');input.setAttribute('aria-label',text);label.append(input);return label;};
  const select=(values)=>{const n=el('select',null,'study-input');values.forEach(([value,title])=>{const option=el('option',title);option.value=value;n.append(option);});return n;};
  const state=name=>storage.getJson(KEY,{})[name] || {};
  const save=(name,value)=>storage.setJson(KEY,{...storage.getJson(KEY,{}),[name]:value});
  const load=async url=>{const response=await fetch(url);if(!response.ok)throw new Error('Could not load lesson data.');return response.json();};
  async function copy(text,status){
    status.replaceChildren();
    try{await navigator.clipboard.writeText(text);status.textContent='Copied.';}
    catch{const area=el('textarea',null,'study-input');area.value=text;area.readOnly=true;area.rows=6;area.setAttribute('aria-label','Copyable text');status.append(el('span','Clipboard unavailable. Select the text below.'),area);area.focus();area.select();}
  }
  function reviewCard(item,group,page){
    const normalized=window.MaltiLearningContent.normalizeItem(item,group);
    return {id:'sentence::lesson03::'+item.slug,type:'sentence-card',contentType:normalized.itemType,
      maltese:normalized.primary,english:normalized.secondary,prompt:normalized.prompt,answer:normalized.answer,
      questionTranslation:normalized.questionTranslation,answerTranslation:normalized.answerTranslation,
      sourcePage:page,topic:group.title,group:group.title};
  }
  function mountPractice(data){
    const root=document.querySelector('[data-particle-practice]'),items=data.groups.find(g=>g.id==='particle-practice').items;
    const prefs={topic:'all',mode:'source',...state('practice')};
    const titles={corrections:'Correct the form',articles:'Article or no article',shortened:'Shortened lil',translation:'Translate a phrase',cloze:'Motorcycle story'};
    const topic=select([['all','All topics'],...Object.entries(titles)]),mode=select([['source','Source task'],['write','Write the answer']]);
    if([...topic.options].some(o=>o.value===prefs.topic))topic.value=prefs.topic;
    if([...mode.options].some(o=>o.value===prefs.mode))mode.value=prefs.mode;
    const mistakes=el('input');mistakes.type='checkbox';mistakes.checked=!!prefs.mistakes;
    const question=select([]),panel=el('div'),stats=el('p',null,'study-progress-status'),saveButton=button('Save question to review',()=>{});
    const controls=el('div',null,'control-row control-row--responsive');controls.append(field('Topic',topic),field('Task',mode),field('Mistakes only',mistakes));
    const actions=el('div',null,'toolbar-row'),next=button('Next question',()=>{const pool=filtered();const index=pool.findIndex(q=>q.slug===question.value);prefs.current=pool[(index+1)%pool.length]?.slug;draw();question.focus();});
    actions.append(next,saveButton);root.append(controls,field('Question',question),stats,panel,actions);
    let active=null;
    const filtered=()=>items.filter(item=>(topic.value==='all'||item.topic===topic.value)&&(!mistakes.checked||window.MaltiMistakeStore.getOpen().some(m=>m.itemId===item.slug&&m.setId.startsWith('particles-'))));
    function remember(){Object.assign(prefs,{topic:topic.value,mode:mode.value,mistakes:mistakes.checked,current:question.value});save('practice',prefs);}
    function statistics(){const progress=window.MaltiExerciseRunner.getProgress();const passed=items.filter(q=>['source','write'].some(mode=>progress['particles-'+q.slug+'-'+mode]?.passed)).length;stats.textContent=`${passed} / ${items.length} questions passed · ${filtered().length} questions in this selection`;}
    function render(){
      remember();active=items.find(item=>item.slug===question.value);panel.replaceChildren();next.disabled=!active;saveButton.disabled=!active;
      saveButton.textContent=active&&window.MaltiReviewStore.hasCard('sentence::lesson03::'+active.slug)?'Question saved':'Save question to review';
      if(!active){panel.append(el('p','No open mistakes in this selection.'));statistics();return;}
      const item={id:active.slug,prompt:active.question.maltese,answer:active.answer.maltese,
        type:mode.value==='source'&&active.options?'multiple-choice':'fill-blank',choices:active.options,
        accepted:active.accepted||[active.answer.maltese],explanation:active.explanation,
        sourcePage:'particles_prepositions.html#practice',category:'grammar',assessmentMode:mode.value==='write'||!active.options?'production':'recognition'};
      window.MaltiExerciseRunner.render(panel,{id:'particles-'+active.slug+'-'+mode.value,title:titles[active.topic],items:[item],passPercent:100,category:'grammar'});
      const draft=(prefs.drafts||{})[active.slug+'-'+mode.value];
      if(draft!=null){const input=panel.querySelector('[data-exercise-answer]');if(input)input.value=draft;else panel.querySelectorAll('input[type="radio"]').forEach(r=>r.checked=r.value===draft);}
      panel.querySelectorAll('input[type="text"]').forEach(n=>n.classList.add('study-input'));
      panel.querySelector('h4').lang=active.topic==='translation'?'en':'mt';statistics();
    }
    function draw(){const pool=filtered();question.replaceChildren();pool.forEach((q,i)=>{const option=el('option',`${i+1}. ${q.question.maltese}`);option.value=q.slug;question.append(option);});if(pool.some(q=>q.slug===prefs.current))question.value=prefs.current;render();}
    [topic,mode,mistakes].forEach(n=>n.addEventListener('change',draw));question.addEventListener('change',render);
    panel.addEventListener('input',event=>{if(!active)return;const n=event.target;if(!n.matches('input'))return;prefs.drafts={...prefs.drafts,[active.slug+'-'+mode.value]:n.value};remember();});
    panel.addEventListener('submit',event=>{if(event.target.dataset.submitted){event.preventDefault();event.stopImmediatePropagation();}else event.target.dataset.submitted='true';},true);
    saveButton.addEventListener('click',()=>{if(!active)return;const card=reviewCard(active,{itemType:'questionAnswer',title:titles[active.topic]},'particles_prepositions.html#practice');if(!window.MaltiReviewStore.hasCard(card.id))window.MaltiReviewStore.addSentence(card);saveButton.textContent='Question saved';});
    question.addEventListener('change',()=>saveButton.textContent='Save question to review');
    window.addEventListener('malti-exercise-complete',()=>{statistics();panel.querySelectorAll('input').forEach(n=>n.disabled=true);});draw();
  }
  async function particles(){
    const data=await load('./assets/data/particles_prepositions_examples.json');
    await window.renderExampleBanksFromData({dataUrl:'./assets/data/particles_prepositions_examples.json',data,groupAttribute:'data-bank-view',sourcePage:'particles_prepositions.html',reviewPrefix:'lesson03',containerClass:'stack',numbered:false,
      groupViews:{'particle-meanings':{presentation:'table',columns:[{field:'particle',lang:'mt'},{field:'meaning',lang:'en'},{field:'contracted',lang:'mt'},{field:'maltese',lang:'mt'},{field:'english',lang:'en'}]},'particle-sun':{presentation:'correction'}}});
    await window.renderExampleBanksFromData({dataUrl:'./assets/data/particles_prepositions_examples.json',groupAttribute:'data-particle-group',sourcePage:'particles_prepositions.html',reviewPrefix:'lesson03',containerClass:'stack',numbered:false});
    document.querySelectorAll('[data-particle-group] code').forEach(n=>n.lang=n.closest('[data-particle-group]').dataset.particleGroup==='particle-rules'?'en':'mt');
    mountPractice(data);
  }
  function mtText(node,text,highlight){
    node.replaceChildren();text.split(/(\s+)/).forEach(token=>{const match=/^(?:fil-|fit-|fix-|fiċ-|fid-|f'|mill-|mis-|min-|miċ-|mit-|mal-|mat-|tal-|tad-|biż-|bil-|b'|bl-|ġol-|għall-)/u.test(token);node.append(highlight&&match?el('mark',token):document.createTextNode(token));});
  }
  async function reading(){
    const data=await load('./assets/data/reading_red_cave_examples.json'),prefs={english:true,highlight:false,format:'mt',...state('reading')};
    const story=data.groups.find(g=>g.id==='red-cave-story');
    const english=document.querySelector('[data-reading-english]'),highlight=document.querySelector('[data-reading-highlight]'),format=document.querySelector('[data-reading-copy-format]'),status=document.querySelector('[data-reading-status]');
    english.checked=prefs.english;highlight.checked=prefs.highlight;format.value=['mt','bilingual'].includes(prefs.format)?prefs.format:'mt';
    const questionRoot=document.querySelector('[data-reading-questions]');
    questionRoot.addEventListener('malti-bank-draft',event=>{prefs.answers={...prefs.answers,[event.detail.slug]:event.detail.value};save('reading',prefs);});
    questionRoot.addEventListener('malti-bank-rating',event=>{prefs.ratings={...prefs.ratings,[event.detail.slug]:event.detail.value};save('reading',prefs);});
    await window.renderExampleBanksFromData({dataUrl:'./assets/data/reading_red_cave_examples.json',data,groupAttribute:'data-bank-view',sourcePage:'reading_red_cave.html',reviewPrefix:'lesson03',containerClass:'stack',numbered:false,
      groupViews:{'red-cave-story':{presentation:'reading'},'red-cave-comprehension':{presentation:'selfAssessment',state:prefs}}});
    function refresh(){prefs.english=english.checked;prefs.highlight=highlight.checked;prefs.format=format.value;save('reading',prefs);document.querySelectorAll('[data-bank-translation]').forEach(n=>n.hidden=!english.checked);story.items.forEach(item=>mtText(document.querySelector(`[data-bank-primary="${item.slug}"]`),item.maltese,highlight.checked));}
    [english,highlight,format].forEach(n=>n.addEventListener('change',refresh));
    document.querySelector('[data-reading-copy]').addEventListener('click',()=>copy(story.items.map(item=>item.maltese+(format.value==='bilingual'?'\n'+item.english:'')).join('\n\n'),status));refresh();
  }
  async function directions(){
    const data=await load('./assets/data/directions_particles_examples.json'),group=data.groups[0],prefs={...state('directions')};
    await window.renderExampleBanksFromData({dataUrl:'./assets/data/directions_particles_examples.json',groupAttribute:'data-direction-particle-group',sourcePage:'directions_town.html',reviewPrefix:'lesson03',containerClass:'grid-3',numbered:false});
    document.querySelectorAll('[data-direction-particle-group] code').forEach(n=>n.lang='mt');
    const root=document.querySelector('[data-direction-writing]');
    const count=el('p',null,'study-progress-status'),status=el('p',null,'study-feedback');status.setAttribute('role','status');
    const update=()=>count.textContent=`${group.items.filter(item=>prefs[item.slug]?.trim()).length} / 9 sentences drafted`;
    group.items.forEach(item=>{const input=el('textarea',null,'study-input');input.rows=2;input.lang='mt';input.value=prefs[item.slug]||'';input.addEventListener('input',()=>{prefs[item.slug]=input.value;save('directions',prefs);update();});root.append(field('Sentence with '+item.maltese,input));});
    root.append(count,button('Copy my sentences',()=>copy(group.items.map(item=>`${item.maltese}\n${prefs[item.slug]||''}`).join('\n\n'),status)),status);update();
  }
  async function start(){
    try{if(document.querySelector('[data-particles-page]'))await particles();if(document.querySelector('[data-red-cave-page]'))await reading();if(document.querySelector('[data-direction-writing]'))await directions();document.documentElement.dataset.particlesReady='true';if(location.hash)document.getElementById(location.hash.slice(1))?.scrollIntoView({block:'start'});}
    catch(error){console.error(error);const root=document.querySelector('[data-particle-practice], [data-reading-text], [data-direction-writing]');root.replaceChildren(el('p','The study material could not be loaded.'),button('Retry',()=>location.reload()));}
  }
  start();
})();
