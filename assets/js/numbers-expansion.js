(() => {
  const storage = window.MaltiStorage;
  const KEY = 'malti_numbers_extended_v1';
  const COPY_KEY = 'malti_numbers_copy_format_v1';
  const page = 'numbers_calendar_time.html';
  const titles = {
    'number-forms': 'Number Forms', 'large-numbers': 'Hundreds and Thousands',
    'number-builder': 'Build a Number', 'dual-forms': 'Dual Forms',
    fractions: 'Fractions and Mixed Numbers', measurements: 'Decimals, Measurements and Money',
    temperature: 'Temperature and Weather', decades: 'Decades',
    'extra-time-expressions': 'Everyday Time Expressions', clock: 'Clock Time', core: 'Core Numbers'
  };
  const rules = {
    'number-forms': ['The number changes with its context. Compare counting alone, counting ordinary nouns, and counting nouns with an initial linking i.', 'Compare ħames kotba with ħamest itfal. In the same context, use tliet kotba but tlett / tlitt itfal. Numbers 11–19 take a singular counted noun: tnax-il pazjent.'],
    'large-numbers': ['Read the thousands as one group, then the remaining hundreds, tens and units. Within 21–99, the unit comes before the ten.', '100 = mija; 200 = mitejn; 1,000 = elf; 2,000 = elfejn; 10,000 = għaxart elef; 100,000 = mitt elf.'],
    'number-builder': ['123,655 = 123 thousand + 655. 130,568 = 130 thousand + 568.'],
    'dual-forms': ['The dual is a special form for two, a natural pair, or selected expressions of time and quantity. It is not a general replacement for every plural.', 'Learn the whole pair: jum → jumejn, ġimgħa → ġimagħtejn, sena → sentejn. Endings and vowel changes vary by noun.'],
    fractions: ['Nofs = one half; kwart = one quarter; terz = one third. Tliet kwarti = three quarters. Tnejn minn ħamsa = two fifths.', 'State the whole quantity before its fraction: kilometru u nofs; żewġ litri u nofs ilma.'],
    measurements: ['For a decimal measurement, state the whole quantity and unit first, then punt and the decimal digits. Preserve zeroes when reading a written decimal exactly.', '5.60 m = ħames metri punt sitta żero. For money, €4.70 = erba’ ewro u sebgħin ċenteżmu. A decimal without a currency sign is not automatically a price.'],
    temperature: ['Use the counted forms with gradi for 2–10: tmien gradi Celsius. Compare ħmistax-il grad Celsius and tletin grad Celsius.'],
    decades: ['A decade names a period of ten years: sittinijiet, sebgħinijiet, tmeninijiet and disgħinijiet.'],
    'extra-time-expressions': ['Useful expressions for waiting, meeting, arriving and describing dates.']
  };
  const el = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text !== undefined && text !== null) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };
  const button = (text, action, cls = 'action-button') => {
    const node = el('button', text, cls); node.type = 'button';
    node.addEventListener('click', action); return node;
  };
  const normal = value => String(value).normalize('NFKC').toLocaleLowerCase().trim()
    .replace(/[’‘`´]/g, "'").replace(/[.!?]+$/g, '').replace(/\s+/g, ' ');
  const status = el('p', '', 'numbers-live-status');
  status.setAttribute('role', 'status');
  document.querySelector('.content').append(status);
  let announcementTimer;
  const announce=text=>{clearTimeout(announcementTimer);status.textContent=text;announcementTimer=setTimeout(()=>{status.textContent='';},3000);};
  const copySelect = document.querySelector('[data-numbers-copy-format]');
  copySelect.value = storage.getString(COPY_KEY, 'mt') === 'bilingual' ? 'bilingual' : 'mt';
  copySelect.addEventListener('change', () => storage.setString(COPY_KEY, copySelect.value));
  const copyText = rows => rows.map(row => [row.maltese, copySelect.value === 'bilingual' ? row.english : null].filter(Boolean).join('\n')).join('\n\n');
  const exportRow = row => row.kind==='forms' ? {...row,maltese:`${row.maltese} → ${row.ordinary} → ${row.linked==='tlett'?'tlett / tlitt':row.linked}`,english:`${row.value}: standalone → before a noun → linking i`} : row;
  const copy = async rows => {
    try {
      await navigator.clipboard.writeText(copyText(rows)); announce('Copied.');
    } catch {
      const area = el('textarea'); area.value = copyText(rows); area.readOnly = true;
      area.className = 'numbers-copy-fallback'; document.body.append(area); area.select();
      const ok = document.execCommand('copy'); area.remove();
      announce(ok ? 'Copied.' : 'Copy is unavailable in this browser.');
    }
  };
  const reviewButtons = [];
  function review(row, topic) {
    const store = window.MaltiReviewStore;
    const id = 'sentence::numbers-expanded::' + normal(row.maltese);
    const sync = b => {
      const saved = store.hasCard(id);
      b.classList.toggle('is-added', saved); b.setAttribute('aria-pressed', String(saved));
      b.title = saved ? 'Remove from review' : 'Save to review'; b.setAttribute('aria-label', b.title);
    };
    const b = button('', () => {
      if (store.hasCard(id)) store.removeCard(id);
      else store.addSentence({ id, maltese: row.maltese, english: row.english,
        topic: titles[topic], sourcePage: page + '#' + (topic === 'dual-forms' ? 'group-counts' : topic) });
      refreshReview();
    }, 'review-add-button review-add-button--icon numbers-review-button');
    reviewButtons.push(() => sync(b)); sync(b); return b;
  }
  function refreshReview() { reviewButtons.forEach(sync => sync()); }
  window.addEventListener('malti-storage-change', event => {
    if (event.detail?.key === 'malti_review_cards_v2') refreshReview();
  });
  const rowActions = (row, topic) => {
    const actions = el('div', null, 'numbers-row-actions');
    actions.append(review(row, topic), button('Copy', () => copy([row]), 'numbers-copy-button'));
    return actions;
  };
  function fractionPicture(value) {
    const match = String(value).match(/^(?:(\d+) )?(\d+)\/(\d+)$/);
    if (!match) return null;
    const [, whole, top, bottom] = match;
    const figure = el('div', null, 'numbers-fraction');
    figure.setAttribute('role', 'img'); figure.setAttribute('aria-label', value);
    if (whole) figure.append(el('span', whole + ' + '));
    const parts = el('span', null, 'numbers-fraction-parts');
    for (let n = 0; n < Number(bottom); n++) parts.append(el('span', '', n < Number(top) ? 'is-filled' : ''));
    figure.append(parts, el('span', top + '/' + bottom)); return figure;
  }
  function referenceRow(row, topic) {
    const article = el('article', null, 'study-card numbers-reference-row');
    const body = el('div', null, 'numbers-reference-body');
    if (row.kind === 'fraction') body.append(fractionPicture(row.value));
    if (row.singular) body.append(el('small', row.singular + ' →', 'muted'));
    body.append(el('strong', row.maltese));
    body.lastChild.lang = 'mt';
    body.append(el('span', row.english));
    if (row.kind === 'forecast') body.append(el('span', row.value + '°C · ' + row.weather));
    if (row.example) {
      const example = el('p', row.example); example.lang = 'mt'; body.append(example, el('small', row.exampleTranslation));
    }
    article.append(body, rowActions(row, topic)); return article;
  }
  function renderReference(root, topic, rows, questions) {
    root.replaceChildren(el('h2', titles[topic]));
    (rules[topic] || []).forEach(text => root.append(el('p', text, 'numbers-rule')));
    const actions = el('div', null, 'toolbar-row');
    actions.append(button('Copy examples', () => copy(rows.filter(r => r.maltese && !['source-exercise','rule'].includes(r.kind)).map(exportRow))));
    const count = questions.filter(q => q.topic === topic).length;
    if (count) {
      const link = el('a', 'Practise · ' + count, 'action-link'); link.href = '#numbers-practice';
      link.addEventListener('click', () => { practiceTopic.value = topic; direction.value='all'; mistakes.checked=false; renderQuestion(); }); actions.append(link);
    }
    root.append(actions);
    if (topic === 'number-forms') {
      const wrap = el('div', null, 'numbers-table-wrap');
      const table = el('table', null, 'table-soft numbers-forms-table');
      const caption = el('caption', 'Standalone and counted forms'); table.append(caption);
      const head = el('tr'); ['Number','Alone','Before a noun','Linking i'].forEach(t => { const th = el('th', t); th.scope = 'col'; head.append(th); });
      const reviewHeading=el('th',null,'numbers-forms-review'); reviewHeading.scope='col';
      reviewHeading.append(el('span','Review','visually-hidden')); head.append(reviewHeading);
      table.append(el('thead')); table.lastChild.append(head);
      const body = el('tbody');
      rows.filter(r=>r.kind==='forms').forEach(r => {
        const tr=el('tr');
        [r.value,r.maltese,r.ordinary,r.linked==='tlett'?'tlett / tlitt':r.linked].forEach(t=>tr.append(el('td',t)));
        const cell=el('td',null,'numbers-forms-review'); cell.append(review(exportRow(r),topic));
        tr.append(cell); body.append(tr);
      });
      table.append(body); wrap.append(table); root.append(wrap);
      const examples=el('details',null,'numbers-more'); examples.append(el('summary','Examples in context'));
      const exampleBody=el('div',null,'numbers-disclosure-body');
      rows.filter(r=>r.kind!=='forms').forEach(r=>exampleBody.append(referenceRow(r,topic)));
      examples.append(exampleBody); root.append(examples);
    } else if (topic === 'number-builder') {
      renderBuilder(root, rows);
    } else {
      const display = rows.filter(r => !['rule','source-exercise'].includes(r.kind));
      display.slice(0, 6).forEach(row => root.append(referenceRow(row, topic)));
      if (display.length > 6) {
        const details = el('details', null, 'numbers-more'); details.append(el('summary', 'All examples · ' + display.length));
        const exampleBody=el('div',null,'numbers-disclosure-body');
        display.slice(6).forEach(row => exampleBody.append(referenceRow(row, topic)));
        details.append(exampleBody); root.append(details);
      }
    }
    const bank = questions.filter(q => q.topic === topic);
    if (bank.length) {
      const details = el('details', null, 'numbers-more'); details.append(el('summary', 'Exercise bank · ' + bank.length));
      const exerciseBody=el('div',null,'numbers-disclosure-body');
      bank.forEach(q => {
        const item = el('details', null, 'numbers-source-question'); item.append(el('summary', q.prompt));
        if (q.visualValue) { const graphic = fractionPicture(q.visualValue); if (graphic) item.append(graphic); }
        item.append(el('p', q.answer), el('small', q.explanation)); exerciseBody.append(item);
      }); details.append(exerciseBody); root.append(details);
    }
  }
  function renderBuilder(root, rows) {
    const selector = el('select'); selector.setAttribute('aria-label', 'Number to build');
    rows.forEach((r, index) => { const option = el('option', r.english); option.value = index; selector.append(option); });
    const answer = el('div', null, 'numbers-builder-answer'); answer.setAttribute('aria-live','polite');
    const bank = el('div', null, 'numbers-word-bank'); const feedback = el('p'); feedback.setAttribute('role','status');
    let words = [], selected = [];
    const draw = (returnedIndex) => {
      answer.replaceChildren(); bank.replaceChildren();
      if (!selected.length) answer.append(el('span','…'));
      selected.forEach((index, position) => {
        const tile=button(words[index],()=>{
          selected.splice(selected.indexOf(index),1); draw(index);
        },'numbers-word numbers-selected-word');
        tile.dataset.wordIndex=index;
        tile.title=`Return ${words[index]} to word bank`;
        tile.setAttribute('aria-label',`${tile.title} (position ${position+1})`);
        answer.append(tile);
      });
      words.forEach((word, index) => { const b = button(word, () => { selected.push(index); draw(); }, 'numbers-word'); b.dataset.wordIndex=index; b.disabled = selected.includes(index); bank.append(b); });
      feedback.textContent = ''; feedback.dataset.state='';
      if (returnedIndex !== undefined) bank.children[returnedIndex].focus({preventScroll:true});
    };
    const reset = () => { words = rows[Number(selector.value)].maltese.replace(/,/g,'').split(' ').map((word, index) => ({word,index})).sort((a,b) => a.word.localeCompare(b.word) || a.index-b.index).map(w => w.word); selected=[]; draw(); };
    selector.addEventListener('change', reset);
    const controls = el('div', null, 'toolbar-row');
    controls.append(button('Undo', () => { selected.pop(); draw(); }), button('Reset', reset), button('Check answer', () => {
      const expected = rows[Number(selector.value)].maltese.replace(/,/g,'');
      const correct = normal(selected.map(index=>words[index]).join(' ')) === normal(expected);
      feedback.textContent = correct ? 'Correct.' : 'Not yet. Check the thousands group, then the remaining hundreds, tens and units.';
      feedback.dataset.state = correct ? 'correct' : 'incorrect';
    }), button('Show answer', () => { feedback.textContent = rows[Number(selector.value)].maltese; }));
    root.append(selector, answer, bank, controls, feedback); reset();
  }
  const practiceRoot = document.querySelector('[data-numbers-practice]');
  const practiceTopic = el('select'); practiceTopic.setAttribute('aria-label','Practice topic');
  const direction = el('select'); direction.setAttribute('aria-label','Practice direction');
  [['all','Both directions'],['words','Write in Maltese'],['digits','Write in digits']].forEach(([value,text]) => { const opt=el('option',text); opt.value=value; direction.append(opt); });
  const mistakes = el('input'); mistakes.type = 'checkbox';
  const filters = el('div', null, 'numbers-practice-filters');
  const topicLabel = el('label','Topic'); topicLabel.append(practiceTopic);
  const directionLabel = el('label','Direction'); directionLabel.append(direction);
  const mistakesLabel = el('label',null,'numbers-checkbox'); mistakesLabel.append(mistakes,el('span','Mistakes only'));
  filters.append(topicLabel,directionLabel,mistakesLabel);
  const stats = el('p', null, 'muted'); stats.setAttribute('aria-live','polite');
  const prompt = el('p',null,'numbers-question'); prompt.lang='mt';
  const visual = el('div'); const options = el('div',null,'numbers-options');
  const form = el('form',null,'numbers-answer-form');
  const label = el('label','Your answer'); const input = el('input'); input.type='text'; input.autocomplete='off'; input.spellcheck=false; label.append(input);
  const check = el('button','Check answer','action-button'); check.type='submit';
  const next = button('Next', () => renderQuestion());
  const reveal = button('Show answer', () => {
    if (!current) return;
    feedback.textContent = current.answer + ' — ' + current.explanation;
    input.disabled = true; check.disabled = true; options.querySelectorAll('button').forEach(b => { b.disabled=true; });
    const previous = progress.results[current.id] || {attempts:0,correct:0};
    progress.results[current.id]={...previous,lastResult:'revealed'}; saveProgress(); updateStats();
  });
  const feedback = el('p', null, 'numbers-feedback'); feedback.setAttribute('role','status');
  const saveAnswer = button('Save answer to review', () => {
    if (!current) return;
    const reversed=['integer','time'].includes(current.answerKind);
    window.MaltiReviewStore.addSentence({id:'sentence::numbers-practice::'+current.id,maltese:reversed?current.prompt:current.answer,english:reversed?current.answer:(current.english || ''),topic:titles[current.topic],sourcePage:page+'#numbers-practice'});
    announce('Saved to review.');
  });
  const copyAnswer=button('Copy answer',()=>{
    if (!current) return;
    const reversed=['integer','time'].includes(current.answerKind);
    copy([{maltese:reversed?current.prompt:current.answer,english:reversed?current.answer:current.english}]);
  });
  const controls = el('div',null,'toolbar-row'); controls.append(next,reveal,saveAnswer,copyAnswer);
  form.append(label,check); practiceRoot.append(filters,stats,prompt,visual,options,form,controls,feedback);
  let allQuestions = [], current = null;
  const stored = storage.getJson(KEY, {});
  const progress = {results:stored.results && typeof stored.results==='object' ? stored.results : {},shownAt:stored.shownAt && typeof stored.shownAt==='object'?stored.shownAt:{},topic:stored.topic || 'all',direction:stored.direction || 'all'};
  const saveProgress = () => { progress.topic=practiceTopic.value; progress.direction=direction.value; storage.setJson(KEY,progress); };
  function pool() {
    return allQuestions.filter(q => (practiceTopic.value==='all' || q.topic===practiceTopic.value) &&
      (direction.value==='all' || (direction.value==='digits') === (['integer','time'].includes(q.answerKind))) &&
      (!mistakes.checked || ['incorrect','revealed'].includes(progress.results[q.id]?.lastResult)));
  }
  function updateStats() {
    const ids = new Set(pool().map(q => q.id));
    const rows = Object.entries(progress.results).filter(([id]) => ids.has(id)).map(([,r]) => r);
    const attempts=rows.reduce((n,r)=>n+(r.attempts || 0),0); const correct=rows.reduce((n,r)=>n+(r.correct || 0),0);
    stats.textContent=`${ids.size} questions · ${attempts} attempts · ${correct} correct`;
  }
  function renderQuestion() {
    const available=pool(); const previousId=current?.id;
    available.sort((a,b)=>(progress.results[a.id]?.attempts || 0)-(progress.results[b.id]?.attempts || 0) || (progress.shownAt[a.id]||0)-(progress.shownAt[b.id]||0));
    current=available.find(q=>q.id!==previousId) || available[0] || null;
    options.replaceChildren(); visual.replaceChildren(); feedback.textContent=''; feedback.dataset.state=''; input.value='';
    input.disabled=!current; check.disabled=!current; reveal.disabled=!current; saveAnswer.disabled=!current; copyAnswer.disabled=!current; next.disabled=!current;
    if (!current) { prompt.textContent=mistakes.checked ? 'No mistakes in this selection.' : 'No questions in this selection.'; updateStats(); return; }
    prompt.textContent=current.prompt;
    progress.shownAt[current.id]=Date.now();
    if (current.visualValue) { const picture=fractionPicture(current.visualValue); if (picture) visual.append(picture); }
    current.options.forEach(text=>options.append(button(text,()=>{ input.value=text; form.requestSubmit(); },'numbers-option')));
    saveProgress(); updateStats();
  }
  form.addEventListener('submit', event => {
    event.preventDefault(); if (!current || input.disabled) return;
    if (!input.value.trim()) { feedback.textContent='Enter an answer first.'; input.focus(); return; }
    const normalizeAnswer = text => current.answerKind==='integer' ? normal(text).replace(/[,\s]/g,'') : normal(text);
    const correct=current.accepted.some(a=>normalizeAnswer(a)===normalizeAnswer(input.value));
    const result=progress.results[current.id] || {attempts:0,correct:0};
    progress.results[current.id]={attempts:result.attempts+1,correct:result.correct+(correct?1:0),lastResult:correct?'correct':'incorrect'};
    saveProgress(); feedback.dataset.state=correct?'correct':'incorrect';
    feedback.textContent=(correct?'Correct. ':'Answer: '+current.answer+'. ')+current.explanation;
    window.MaltiMistakeStore?.recordAttempt({id:'numbers-expanded::'+current.id,setId:'numbers-expanded',itemId:current.id,
      prompt:current.prompt,given:input.value,correctAnswer:current.answer,explanation:current.explanation,
      sourcePage:page+'#'+(current.topic==='dual-forms'?'group-counts':current.topic),topic:titles[current.topic],type:'fill-blank',category:'numbers-time'},correct);
    input.disabled=true; check.disabled=true; reveal.disabled=true; options.querySelectorAll('button').forEach(b=>{ b.disabled=true; }); updateStats(); next.focus({preventScroll:true});
  });
  [practiceTopic,direction,mistakes].forEach(control=>control.addEventListener('change',renderQuestion));
  function supplementalQuestions(data) {
    const result=[];
    Object.entries(data.sections).forEach(([topic,rows])=>rows.forEach(row=>{
      if (!['integer','fraction','dual','temperature','measurement'].includes(row.kind) || row.kind==='measurement') return;
      const prompt=row.kind==='dual' ? row.singular+' → 2' : row.kind==='fraction' ? row.value : row.english;
      if (row.maltese.includes(' / ')) return;
      result.push({id:row.id+'-read',topic,prompt,answer:row.maltese,accepted:[row.maltese],options:[],explanation:rules[topic][0],english:row.english,visualValue:row.kind==='fraction'?row.value:null});
      if (row.kind==='integer') result.push({id:row.id+'-digits',topic,prompt:row.maltese,answer:String(row.value),accepted:[String(row.value)],answerKind:'integer',options:[],explanation:'Separate the thousands group from the remaining hundreds, tens and units.',english:row.english});
    }));
    return result;
  }
  function legacyQuestions(data) {
    const result=[];
    const known=new Map(data.numbers.forms.map(row=>[row.value,row.maltese]));
    const add=(topic,value,maltese)=>{
      result.push({id:`${topic}-${value}-words`,topic,prompt:String(value),answer:maltese,accepted:topic==='clock'?[maltese,`huwa ${maltese}`,`hija ${maltese}`,`huma ${maltese}`]:[maltese],options:[],english:String(value),explanation:topic==='core'?'For 21–99, say the unit first, then u and the ten.':'Use u for past and neqsin for minutes before the next hour.'});
      if (topic==='core') result.push({id:`${topic}-${value}-digits`,topic,prompt:maltese,answer:String(value),accepted:[String(value)],answerKind:'integer',options:[],english:String(value),explanation:'Write the number in digits.'});
      else result.push({id:`${topic}-${value}-digits`,topic,prompt:maltese,answer:String(value),accepted:[String(value),String(value).padStart(5,'0')],answerKind:'time',options:[],english:String(value),explanation:'Write the clock time in digits.'});
    };
    for (let n=data.numbers.minimum;n<=data.numbers.maximum;n++) add('core',n,known.get(n)||`${known.get(n%10)} u ${known.get(n-n%10)}`);
    const hours=new Map(data.clock.hours.map(row=>[row.value,row.maltese]));
    data.clock.hours.forEach(hour=>{
      data.clock.pastMinutes.forEach(minute=>add('clock',`${hour.value}:${String(minute.value).padStart(2,'0')}`,hour.maltese+(minute.value?' u '+minute.maltese:'')));
      if (hours.has(hour.value+1)) data.clock.toMinutes.forEach(minute=>add('clock',`${hour.value}:${String(minute.value).padStart(2,'0')}`,hours.get(hour.value+1)+' neqsin '+minute.maltese));
    });
    return result;
  }
  async function load() {
    const response=await fetch('./assets/data/numbers_expansion.json');
    if (!response.ok) throw new Error('Numbers data could not be loaded.');
    const data=await response.json();
    const legacyResponse=await fetch('./assets/data/numbers_time_drills.json');
    if (!legacyResponse.ok) throw new Error('Core drill data could not be loaded.');
    allQuestions=[...data.questions,...supplementalQuestions(data),...legacyQuestions(await legacyResponse.json())];
    const all=el('option','All topics'); all.value='all'; practiceTopic.append(all);
    [...new Set(allQuestions.map(q=>q.topic))].forEach(topic=>{ const opt=el('option',titles[topic]); opt.value=topic; practiceTopic.append(opt); });
    practiceTopic.value=[...practiceTopic.options].some(o=>o.value===progress.topic)?progress.topic:'all';
    direction.value=['all','words','digits'].includes(progress.direction)?progress.direction:'all';
    document.querySelectorAll('[data-numbers-section]').forEach(root=>renderReference(root,root.dataset.numbersSection,data.sections[root.dataset.numbersSection],data.questions));
    const editorial=document.querySelector('[data-numbers-editorial]');
    editorial.append(el('p',`${data.materials.length} source materials · ${data.coverage.length} mapped learning items. Teaching versions are separated from original wording.`));
    data.references.forEach(ref=>{ const p=el('p'); const link=el('a',ref.title); link.href=ref.url; p.append(link); editorial.append(p); });
    const details=el('details'); details.append(el('summary','Editorial decisions and source coverage'));
    const decisions = [
      'tlett and tlitt are both retained as accepted forms in the appropriate counted-noun context.',
      '0.75 kg is corrected to 750 g; decimal unit order and the inconsistent rainfall options are revised.',
      'Rkopa / rkoptejn is corrected to irkoppa / irkopptejn. The source forms xkertejn and ġwinħajn are retained.',
      'The time expression is standardized to ilbiraħtlula. Missing u after hundreds is restored in three examples.',
      'żewġ kuċċarina is corrected to żewġ kuċċarini. The exercise practises language only.',
      'Original animation stages become two word-building activities, not duplicate questions.',
      'The final worksheet listening task is not graded because its recording was not supplied. Embedded short sound clips are not treated as pronunciation audio.'
    ]; decisions.forEach(text=>details.append(el('p',text)));
    const download=el('a','Download original source evidence (JSON)'); download.href=data.sourceEvidenceUrl; download.download='numbers-source-evidence.json'; details.append(download);
    const coverage=el('p'); const coverageLink=el('a','Download teaching data and coverage (JSON)'); coverageLink.href='./assets/data/numbers_expansion.json'; coverageLink.download='numbers_expansion.json'; coverage.append(coverageLink); details.append(coverage);
    editorial.append(details); renderQuestion();
    window.MaltiNumbersExpansion={getCurrent:()=>current?{...current}:null,getQuestions:()=>allQuestions.map(q=>({...q})),copyText,version:1};
    document.documentElement.dataset.numbersExpansionReady='true';
  }
  load().catch(error=>{
    practiceRoot.replaceChildren(el('p','The additional numbers material could not be loaded.'));
    practiceRoot.append(button('Retry',()=>window.location.reload())); console.error(error);
    document.querySelectorAll('[data-numbers-section]').forEach(root=>root.append(el('p','Additional examples are unavailable. Please reload this page.')));
  });
})();
