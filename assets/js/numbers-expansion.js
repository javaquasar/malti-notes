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
    'extra-time-expressions': 'Everyday Time Expressions', clock: 'Clock Time', core: 'Core Numbers', 'noun-counting':'Number + Noun'
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
  const status = el('p', '', 'numbers-live-status study-live-status no-print');
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
      area.className = 'copy-fallback'; document.body.append(area); area.select();
      const ok = document.execCommand('copy'); area.remove();
      announce(ok ? 'Copied.' : 'Copy is unavailable in this browser.');
    }
  };
  const reviewButtons = [];
  let practiceController;
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
    const actions = el('div', null, 'numbers-row-actions no-print');
    actions.append(review(row, topic), button('Copy', () => copy([row]), 'numbers-copy-button study-link-button'));
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
      link.addEventListener('click', () => practiceController.setTopic(topic)); actions.append(link);
    }
    root.append(actions);
    if (topic === 'number-forms') {
      const nounLink=el('a','Number + noun','action-link');nounLink.href='#numbers-practice';
      nounLink.addEventListener('click',()=>practiceController.setTopic('noun-counting'));actions.append(nounLink);
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
      const examples=el('details',null,'numbers-more study-disclosure'); examples.append(el('summary','Examples in context'));
      const exampleBody=el('div',null,'numbers-disclosure-body study-disclosure-body');
      rows.filter(r=>r.kind!=='forms').forEach(r=>exampleBody.append(referenceRow(r,topic)));
      examples.append(exampleBody); root.append(examples);
    } else if (topic === 'number-builder') {
      renderBuilder(root, rows);
    } else {
      const display = rows.filter(r => !['rule','source-exercise'].includes(r.kind));
      if(topic==='measurements'){
        ['Units','Decimals','Length','Weight','Volume','Money'].forEach(name=>{
          const members=display.filter(row=>row.subtopic===name);if(!members.length)return;
          const group=el('section',null,'numbers-reference-subgroup');group.dataset.referenceSubgroup=name;
          group.append(el('h3',name));
          members.slice(0,2).forEach(row=>group.append(referenceRow(row,topic)));
          if(members.length>2){
            const more=el('details',null,'numbers-more study-disclosure');more.append(el('summary',`More ${name.toLowerCase()} examples · ${members.length-2}`));
            const body=el('div',null,'numbers-disclosure-body study-disclosure-body');members.slice(2).forEach(row=>body.append(referenceRow(row,topic)));more.append(body);group.append(more);
          }
          root.append(group);
        });
      }else display.slice(0, 6).forEach(row => root.append(referenceRow(row, topic)));
      if (topic!=='measurements' && display.length > 6) {
        const details = el('details', null, 'numbers-more study-disclosure'); details.append(el('summary', 'All examples · ' + display.length));
        const exampleBody=el('div',null,'numbers-disclosure-body study-disclosure-body');
        display.slice(6).forEach(row => exampleBody.append(referenceRow(row, topic)));
        details.append(exampleBody); root.append(details);
      }
    }
    const bank = questions.filter(q => q.topic === topic);
    if (bank.length) {
      const details = el('details', null, 'numbers-more study-disclosure'); details.append(el('summary', 'Exercise bank · ' + bank.length));
      const exerciseBody=el('div',null,'numbers-disclosure-body study-disclosure-body');
      bank.forEach(q => {
        const item = el('details', null, 'numbers-source-question study-disclosure study-card'); item.append(el('summary', q.prompt));
        if (q.visualValue) { const graphic = fractionPicture(q.visualValue); if (graphic) item.append(graphic); }
        item.append(el('p', q.answer), el('small', q.explanation)); exerciseBody.append(item);
      }); details.append(exerciseBody); root.append(details);
    }
  }
  function renderBuilder(root, rows) {
    const selector=el('select',null,'study-input');selector.setAttribute('aria-label','Number to build');
    rows.forEach((row,index)=>{const option=el('option',row.english);option.value=index;selector.append(option);});
    const insertion=el('select',null,'study-input');insertion.setAttribute('aria-label','Insert word at');
    const moving=el('select',null,'study-input');moving.setAttribute('aria-label','Word to move');
    const answer=el('div',null,'numbers-builder-answer');answer.setAttribute('aria-live','polite');
    const bank=el('div',null,'numbers-word-bank no-print');
    const feedback=el('p');feedback.setAttribute('role','status');
    let words=[],selected=[],history=[],dragged=null;
    const remember=()=>{history.push([...selected]);history=history.slice(-50);};
    const expectedWords=()=>rows[Number(selector.value)].maltese.replace(/,/g,'').split(' ');
    const move=(delta)=>{
      const index=Number(moving.value),from=selected.indexOf(index),to=from+delta;
      if(from<0||to<0||to>=selected.length)return;
      remember();selected.splice(from,1);selected.splice(to,0,index);draw({selected:index});
    };
    const remove=index=>{
      remember();selected.splice(selected.indexOf(index),1);draw({bank:index});
    };
    const before=(index,target)=>{
      if(index===target)return;
      remember();selected.splice(selected.indexOf(index),1);
      const position=selected.indexOf(target);selected.splice(position<0?selected.length:position,0,index);draw({selected:index});
    };
    const left=button('←',()=>move(-1),'action-button study-icon-button');left.title='Move selected word left';left.setAttribute('aria-label',left.title);
    const right=button('→',()=>move(1),'action-button study-icon-button');right.title='Move selected word right';right.setAttribute('aria-label',right.title);
    moving.addEventListener('change',()=>updateMoveButtons());
    function updateMoveButtons(){
      const position=selected.indexOf(Number(moving.value));
      left.disabled=position<=0;right.disabled=position<0||position>=selected.length-1;moving.disabled=!selected.length;
    }
    function draw(focus){
      const insertValue=insertion.value,moveValue=moving.value;
      insertion.replaceChildren();const end=el('option','End');end.value='end';insertion.append(end);
      moving.replaceChildren();
      selected.forEach((index,position)=>{
        const point=el('option',`Before ${words[index]} (${position+1})`);point.value=index;insertion.append(point);
        const option=el('option',`${position+1}. ${words[index]}`);option.value=index;moving.append(option);
      });
      insertion.value=selected.includes(Number(insertValue))?insertValue:'end';
      if(moveValue!==''&&selected.includes(Number(moveValue)))moving.value=moveValue;
      answer.replaceChildren();bank.replaceChildren();
      const boundary=expectedWords().indexOf('elf')+1;
      const value=rows[Number(selector.value)].value;
      const groups=[selected.slice(0,boundary),selected.slice(boundary)];
      groups.forEach((indexes,groupIndex)=>{
        const group=el('div',null,'numbers-builder-group');
        group.append(el('span',groupIndex===0?`Thousands · ${(Math.floor(value/1000)*1000).toLocaleString('en-GB')}`:`Remainder · ${value%1000}`,'numbers-builder-group-label'));
        const tiles=el('div',null,'numbers-builder-group-tiles');
        if(!indexes.length)tiles.append(el('span','…'));
        indexes.forEach(index=>{
          const position=selected.indexOf(index);
          const tile=button(words[index],()=>remove(index),'numbers-word numbers-selected-word study-token study-token--selected study-token--removable');
          tile.dataset.wordIndex=index;tile.draggable=true;
          tile.title=`Return ${words[index]} to word bank`;
          tile.setAttribute('aria-label',`${tile.title} (position ${position+1})`);
          tile.addEventListener('focus',()=>{moving.value=index;updateMoveButtons();});
          tile.addEventListener('keydown',event=>{
            if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
            event.preventDefault();moving.value=index;move(event.key==='ArrowLeft'?-1:1);
          });
          tile.addEventListener('dragstart',event=>{dragged=index;event.dataTransfer.setData('text/plain',String(index));event.dataTransfer.effectAllowed='move';});
          tile.addEventListener('dragend',()=>{dragged=null;});
          tile.addEventListener('dragover',event=>{if(dragged!==null)event.preventDefault();});
          tile.addEventListener('drop',event=>{event.preventDefault();if(dragged!==null){const source=dragged;dragged=null;before(source,index);}});
          tiles.append(tile);
        });
        group.append(tiles);answer.append(group);
      });
      words.forEach((word,index)=>{
        const tile=button(word,()=>{
          remember();const at=insertion.value==='end'?-1:selected.indexOf(Number(insertion.value));
          selected.splice(at<0?selected.length:at,0,index);draw({selected:index});
        },'numbers-word study-token');
        tile.dataset.wordIndex=index;tile.disabled=selected.includes(index);bank.append(tile);
      });
      updateMoveButtons();feedback.textContent='';feedback.dataset.state='';
      if(focus?.bank!==undefined)bank.children[focus.bank].focus({preventScroll:true});
      if(focus?.selected!==undefined)answer.querySelector(`[data-word-index="${focus.selected}"]`)?.focus({preventScroll:true});
    }
    bank.addEventListener('dragover',event=>{if(dragged!==null)event.preventDefault();});
    bank.addEventListener('drop',event=>{event.preventDefault();if(dragged!==null){const index=dragged;dragged=null;remove(index);}});
    const reset=()=>{
      words=expectedWords().map((word,index)=>({word,index})).sort((a,b)=>a.word.localeCompare(b.word)||a.index-b.index).map(word=>word.word);
      selected=[];history=[];draw();
    };
    selector.addEventListener('change',reset);
    const placement=el('div',null,'numbers-builder-placement control-row control-row--responsive no-print');
    const insertLabel=el('label','Insert at','study-field');insertLabel.append(insertion);
    const moveLabel=el('label','Word to move','study-field');moveLabel.append(moving);
    const movement=el('div',null,'numbers-builder-movement');movement.append(left,right);
    placement.append(insertLabel,moveLabel,movement);
    const controls=el('div',null,'toolbar-row');
    controls.append(button('Undo',()=>{if(history.length){selected=history.pop();draw();}}),button('Reset',reset),button('Check answer',()=>{
      const expected=expectedWords(),actual=selected.map(index=>words[index]),boundary=expected.indexOf('elf')+1;
      const thousands=normal(actual.slice(0,boundary).join(' '))===normal(expected.slice(0,boundary).join(' '));
      const remainder=normal(actual.slice(boundary).join(' '))===normal(expected.slice(boundary).join(' '));
      feedback.textContent=thousands&&remainder?'Correct.':!thousands?'Check the thousands group. Read the whole group before elf.':'The thousands group is correct. Check the remaining hundreds, tens and units.';
      feedback.dataset.state=thousands&&remainder?'correct':'incorrect';
    }),button('Show answer',()=>{feedback.textContent=rows[Number(selector.value)].maltese;}));
    root.append(selector,placement,answer,bank,controls,feedback);reset();
  }
  const practiceRoot = document.querySelector('[data-numbers-practice]');
  function supplementalQuestions(data) {
    const result=[];
    Object.entries(data.sections).forEach(([topic,rows])=>rows.forEach(row=>{
      if (!['integer','fraction','dual','temperature','measurement'].includes(row.kind) || row.kind==='measurement') return;
      const prompt=row.kind==='dual' ? row.singular+' → 2' : row.kind==='fraction' ? row.value : row.english;
      if (row.maltese.includes(' / ')) return;
      result.push({id:row.id+'-read',topic,prompt,value:row.value,answer:row.maltese,accepted:[row.maltese],options:[],explanation:rules[topic][0],english:row.english,visualValue:row.kind==='fraction'?row.value:null});
      if (row.kind==='integer') result.push({id:row.id+'-digits',topic,prompt:row.maltese,value:row.value,answer:String(row.value),accepted:[String(row.value)],answerKind:'integer',options:[],explanation:'Separate the thousands group from the remaining hundreds, tens and units.',english:row.english});
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
  function nounQuestions(data){
    return data.sections['number-forms'].filter(row=>row.kind==='forms').flatMap(row=>data.countingNouns.map(noun=>{
      const form=noun.form==='linked'?row.linked:row.ordinary;
      const answer=`${form} ${noun.maltese}`;
      const accepted=form==='tlett'?[answer,`tlitt ${noun.maltese}`]:[answer];
      return {id:`noun-${row.value}-${noun.english}`,topic:'noun-counting',prompt:`${row.value} + ${noun.maltese}`,value:row.value,
        answer,accepted,options:[],english:`${row.value} ${noun.english}`,sourceRefs:row.sourceRefs,
        contrast:[{label:'Alone',form:row.maltese},{label:'Before a noun',form:row.ordinary,noun:'kotba'},{label:'Linking i',form:row.linked,noun:'itfal'}],
        explanation:noun.form==='linked'?'This noun uses a linking i. Choose the linked counted form, rather than the standalone number. Tlett and tlitt are accepted variants for three.':'This noun takes the ordinary counted form, rather than the standalone number.'};
    }));
  }
  async function load() {
    const response=await fetch('./assets/data/numbers_expansion.json');
    if (!response.ok) throw new Error('Numbers data could not be loaded.');
    const data=await response.json();
    const legacyResponse=await fetch('./assets/data/numbers_time_drills.json');
    if (!legacyResponse.ok) throw new Error('Core drill data could not be loaded.');
    const allQuestions=[...data.questions,...supplementalQuestions(data),...legacyQuestions(await legacyResponse.json()),...nounQuestions(data),...window.MaltiNumbersTools.formQuestions(data),...window.MaltiNumbersTools.contextQuestions(data)];
    titles['form-choice']='Choose a Number Form';
    practiceController=window.MaltiNumbersPractice.mount({root:practiceRoot,questions:allQuestions,titles,copy,announce,fractionPicture});
    document.querySelectorAll('[data-numbers-section]').forEach(root=>renderReference(root,root.dataset.numbersSection,data.sections[root.dataset.numbersSection],data.questions));
    const views=window.MaltiNumbersLearning.mountViews(practiceController);practiceController.navigateTo=views.showSection;
    window.MaltiNumbersTools.mount({data,questions:allQuestions,controller:practiceController,copy,announce});
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
    editorial.append(details);
    window.MaltiNumbersExpansion={...practiceController,copyText,version:3};
    document.documentElement.dataset.numbersExpansionReady='true';
  }
  load().catch(error=>{
    practiceRoot.replaceChildren(el('p','The additional numbers material could not be loaded.'));
    practiceRoot.append(button('Retry',()=>window.location.reload())); console.error(error);
    document.querySelectorAll('[data-numbers-section]').forEach(root=>root.append(el('p','Additional examples are unavailable. Please reload this page.')));
  });
})();
