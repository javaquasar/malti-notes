/* Compose existing exercise and bank renderers; all markup is shared or static. */
(() => {
  'use strict';
  const root = document.querySelector('[data-b3-practice-root]');
  if (!root) return;
  const KEY = 'malti_topic_practice_v1';
  const storage = window.MaltiStorage;
  const core = window.MaltiB3PracticeCore;
  const runner = window.MaltiExerciseRunner;
  const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const allState = () => object(storage.getJson(KEY, {}));
  const state = () => object(allState().b3Revision);
  const save = patch => storage.setJson(KEY, { ...allState(), b3Revision: { ...state(), ...patch } });
  const setText = (selector, value, owner = root) => { owner.querySelector(selector).textContent = value; };
  const load = async url => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Practice data could not be loaded (${response.status}).`);
    return response.json();
  };

  const weekdayClip = root.querySelector('[data-b3-weekday-audio]');
  const weekdayError = root.querySelector('[data-b3-weekday-error]');
  root.querySelector('[data-b3-weekday-play]')?.addEventListener('click', async () => {
    try {
      if (weekdayClip.readyState > 0) weekdayClip.currentTime = 0;
      await weekdayClip.play();
      weekdayError.hidden = true;
    } catch {
      weekdayError.hidden = false;
    }
  });

  async function initialize() {
    if (!storage || !core || !runner) throw new Error('The shared study tools are unavailable. Reload the page.');
    const [bank, contexts, speaking] = await Promise.all([
      load('./assets/data/b3_practice_bank.json'),
      load('./assets/data/b3_context_examples.json'),
      load('./assets/data/b3_speaking_tasks.json')
    ]);
    const itemsById = new Map(bank.chapters.flatMap(chapter => chapter.patterns.flatMap(pattern => [
      ...pattern.variants, pattern.transfer
    ])).concat(bank.finalSet.items).map(item => [item.id, item]));
    const sessions = new Map();
    const summaryFor = () => core.summarize(bank, core.createState(state().core));
    const live = root.querySelector('[data-b3-live]');
    const patternTitle = id => bank.chapters.flatMap(chapter=>chapter.patterns).find(pattern=>pattern.id===id)?.title || id;
    const dateLabel = value => value ? new Date(value).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) : 'after your first session';

    function refreshSummary() {
      const summary = summaryFor();
      setText('[data-b3-recognition]', `${summary.recognition.practised} / ${summary.totalPatterns} patterns practised`);
      setText('[data-b3-production]', `${summary.production.practised} / ${summary.totalPatterns} patterns practised`);
      setText('[data-b3-due]', `${summary.duePatternIds.length} due · ${summary.weakPatternIds.length} need practice`);
      setText('[data-b3-retention]', `${summary.recognition.secure} recognition and ${summary.production.secure} writing patterns revisited successfully on separate days.`);
      for (const chapter of summary.chapters) {
        const owner = root.querySelector(`[data-b3-chapter="${chapter.id}"]`);
        const modeText = mode => `${mode.practised}/${chapter.total} patterns tried · ${mode.attempts ? mode.accuracy + '% correct across ' + mode.attempts + ' answers' : 'no answers yet'}`;
        setText('[data-b3-chapter-recognition]', 'Recognition: ' + modeText(chapter.recognition), owner);
        setText('[data-b3-chapter-production]', 'Writing: ' + modeText(chapter.production), owner);
        const focusIds=chapter.weakPatternIds.length?chapter.weakPatternIds:chapter.duePatternIds;
        setText('[data-b3-chapter-next]', chapter.nextAction+(focusIds.length?' Focus: '+focusIds.map(patternTitle).join('; '):''), owner);
        const activeChapter = sessions.get('chapter:'+chapter.id);
        owner.querySelector('[data-b3-chapter-start]').disabled = Boolean(activeChapter && !activeChapter.complete);
      }
      const plan = core.buildDailyPlan(bank, state().core, { limit:Number(root.querySelector('[data-b3-session-size]').value) });
      const reasons = plan.reasons.map(reason => reason.reason);
      const due = reasons.filter(value => value === 'due').length;
      const weak = reasons.filter(value => value === 'weak').length;
      const fresh = reasons.filter(value => value === 'new').length;
      setText('[data-b3-today-patterns]',plan.reasons.length?plan.reasons.map(reason=>reason.label).join(' · '):'No patterns are due now. Choose a topic if you want extra practice.');
      setText('[data-b3-today-reason]', plan.items.length
        ? `Next selection: ${due} due, ${weak} from recent mistakes, ${fresh} not yet practised. Recognition and writing are tracked separately.`
        : `Your next spaced review is ${dateLabel(plan.nextDueAt)}. You can still choose a topic for extra practice.`);
      const active = sessions.get('daily');
      root.querySelector('[data-b3-daily-start]').disabled = Boolean(active && !active.complete) || !plan.items.length;
      root.querySelector('[data-b3-session-size]').disabled = Boolean(active && !active.complete);
      const finalSession = sessions.get('final');
      root.querySelector('[data-b3-final-start]').disabled = Boolean(finalSession && !finalSession.complete);
    }

    function rememberSession(key, record) {
      save({ sessions: { ...object(state().sessions), [key]: record } });
    }

    function readAnswers(panel, items) {
      return Object.fromEntries(items.map(item => {
        const element = panel.querySelector(`[data-exercise-item="${item.id}"]`);
        let answer = '';
        if (!element) return [item.id, answer];
        if (item.type === 'matching') answer = [...element.querySelectorAll('select[data-match-index]')].map(select => select.value);
        else if (item.type === 'order-words') answer = [...element.querySelectorAll('.exercise-order-answer .exercise-token')].map(button=>button.textContent);
        else if (item.type === 'fill-blank') answer = element.querySelector('[data-exercise-answer]')?.value || '';
        else answer = element.querySelector('input[type="radio"]:checked')?.value || '';
        return [item.id, answer];
      }));
    }

    function restoreAnswers(panel, items, answers) {
      for (const item of items) {
        const value = answers[item.id];
        const element = panel.querySelector(`[data-exercise-item="${item.id}"]`);
        if (!element || value === undefined) continue;
        if (item.type === 'fill-blank') element.querySelector('[data-exercise-answer]').value = String(value);
        else if (item.type === 'matching') element.querySelectorAll('select[data-match-index]').forEach((select, index) => { select.value = value[index] || ''; });
        else if (item.type === 'multiple-choice' || item.type === 'true-false') element.querySelectorAll('input[type="radio"]').forEach(input => { input.checked = input.value === value; });
        else if (item.type === 'order-words' && value) {
          for (const word of (Array.isArray(value)?value:String(value).split(' '))) {
            const button = [...element.querySelectorAll('.exercise-order-bank .exercise-token')].find(candidate => candidate.textContent === word);
            if (button) button.click();
          }
        }
      }
    }

    function mountSession(key, panel, set, savedAnswers) {
      const session = { key, panel, set, complete:false, restoring:true };
      sessions.set(key, session);
      panel.hidden = false;
      runner.render(panel, set);
      if (savedAnswers) restoreAnswers(panel, set.items, savedAnswers);
      session.restoring = false;
      rememberSession(key, { setId:set.id, title:set.title, ids:set.items.map(item => item.id), complete:false, answers:readAnswers(panel,set.items) });
      refreshSummary();
      return session;
    }

    function wirePanel(panel, key) {
      // A checked form cannot produce duplicate attempts through repeated submits.
      panel.addEventListener('submit', event => {
        if (event.target.dataset.b3Submitted === 'true') { event.preventDefault();event.stopImmediatePropagation(); }
        else event.target.dataset.b3Submitted = 'true';
      }, true);
      const remember = () => {
        const session = sessions.get(key);
        if (!session || session.restoring) return;
        rememberSession(key, { setId:session.set.id,title:session.set.title,ids:session.set.items.map(item=>item.id),complete:session.complete,answers:readAnswers(panel,session.set.items) });
      };
      panel.addEventListener('keyup',remember);
      panel.addEventListener('change',remember);
      window.addEventListener('pagehide',remember);
      panel.addEventListener('click',event => {
        if (event.target.textContent === 'Try again') {
          const session = sessions.get(key);
          if (session) session.complete = false;
          refreshSummary();
        }
        remember();
      });
    }

    const dailyPanel = root.querySelector('[data-b3-daily-panel]');
    wirePanel(dailyPanel,'daily');
    const size = root.querySelector('[data-b3-session-size]');
    size.value = ['6','10'].includes(state().sessionSize) ? state().sessionSize : '6';
    size.addEventListener('change',()=>{save({sessionSize:size.value});refreshSummary();});
    root.querySelector('[data-b3-daily-start]').addEventListener('click',()=>{
      const plan = core.buildDailyPlan(bank, state().core, { limit:Number(size.value) });
      if (!plan.items.length) return;
      mountSession('daily',dailyPanel,{id:'b3-daily-practice-'+plan.items.length,title:'Today’s B3 practice',passPercent:70,items:plan.items});
      live.textContent = `Started ${plan.items.length} questions. Your unfinished answers are saved.`;
      dailyPanel.querySelector('h3').tabIndex=-1;dailyPanel.querySelector('h3').focus();
    });

    for (const chapter of bank.chapters) {
      const owner = root.querySelector(`[data-b3-chapter="${chapter.id}"]`);
      const panel = owner.querySelector('[data-b3-chapter-panel]');
      const key = 'chapter:'+chapter.id;
      wirePanel(panel,key);
      owner.querySelector('[data-b3-chapter-start]').addEventListener('click',()=>{
        const items = core.chooseChapterItems(bank, chapter.id, state().core, {limit:6});
        mountSession(key,panel,{id:chapter.id+'-varied',title:chapter.title+' — varied practice',passPercent:70,items});
        const heading=panel.querySelector('h3');heading.tabIndex=-1;heading.focus();
      });
    }

    const finalPanel = root.querySelector('[data-b3-final-panel]');
    wirePanel(finalPanel,'final');
    root.querySelector('[data-b3-final-start]').addEventListener('click',()=>{
      mountSession('final',finalPanel,bank.finalSet);
      const heading=finalPanel.querySelector('h3');heading.tabIndex=-1;heading.focus();
    });

    const repair = root.querySelector('[data-b3-recovery]');
    const repairPanel = repair.querySelector('[data-b3-recovery-panel]');
    wirePanel(repairPanel,'repair');
    function showRecovery() {
      const queue = Array.isArray(state().recoveryQueue) ? state().recoveryQueue : [];
      const current = queue[0];
      const recovery = current && core.recoveryFor(bank,current.patternId,current.itemId);
      repair.hidden = !recovery;
      root.querySelector('[data-b3-recovery-link]').hidden = !recovery;
      if (!recovery) return;
      setText('[data-b3-recovery-title]',recovery.title,repair);
      setText('[data-b3-recovery-explanation]',recovery.explanation,repair);
      setText('[data-b3-recovery-contrast-mt]',recovery.contrast?.maltese || '',repair);
      setText('[data-b3-recovery-contrast-en]',recovery.contrast?.english || '',repair);
      setText('[data-b3-recovery-model-mt]',recovery.model?.maltese || '',repair);
      setText('[data-b3-recovery-model-en]',recovery.model?.english || '',repair);
      repair.querySelector('[data-b3-recovery-model]').hidden = true;
      repair.querySelector('[data-b3-recovery-try]').hidden = true;
      repairPanel.hidden = true;
      repair.querySelector('[data-b3-recovery-reveal]').hidden = false;
      setText('[data-b3-recovery-status]',`${queue.length} patterns waiting for a fresh example.`,repair);
    }
    repair.querySelector('[data-b3-recovery-reveal]').addEventListener('click',()=>{
      repair.querySelector('[data-b3-recovery-model]').hidden=false;
      repair.querySelector('[data-b3-recovery-try]').hidden=false;
      repair.querySelector('[data-b3-recovery-reveal]').hidden=true;
    });
    repair.querySelector('[data-b3-recovery-try]').addEventListener('click',()=>{
      const current = state().recoveryQueue?.[0];
      const recovery = current && core.recoveryFor(bank,current.patternId,current.itemId);
      if (!recovery?.transfer) return;
      mountSession('repair',repairPanel,{id:'b3-repair-'+current.patternId,title:'Try it in a new sentence',passPercent:100,items:[recovery.transfer]});
      repair.querySelector('[data-b3-recovery-try]').hidden=true;
      const heading=repairPanel.querySelector('h3');heading.tabIndex=-1;heading.focus();
    });

    window.addEventListener('malti-exercise-complete',event=>{
      const session = [...sessions.values()].find(candidate=>candidate.set.id===event.detail.setId);
      if (!session) return;
      const results = event.detail.results.flatMap(result=>{
        const item=session.set.items.find(candidate=>candidate.id===result.itemId);
        return item?.patternId ? [{itemId:item.id,patternId:item.patternId,mode:item.assessmentMode,correct:result.correct}] : [];
      });
      let queue=Array.isArray(state().recoveryQueue)?state().recoveryQueue:[];
      const pending = results.filter(result=>!result.correct);
      for (const result of results) {
        queue=queue.filter(entry=>entry.patternId!==result.patternId || (entry.mode || 'production')!==result.mode);
        if (!result.correct) queue.push({patternId:result.patternId,itemId:result.itemId,mode:result.mode});
      }
      const fixed = session.key==='repair' && results.length && results.every(result=>result.correct);
      if (fixed) {
        const completedRecovery=state().recoveryQueue?.[0];
        if (completedRecovery) queue=queue.filter(entry=>entry.patternId!==completedRecovery.patternId || entry.mode!==completedRecovery.mode);
      }
      save({core:core.recordResults(state().core,results),recoveryQueue:queue});
      session.complete=true;
      rememberSession(session.key,{setId:session.set.id,title:session.set.title,ids:session.set.items.map(item=>item.id),complete:true,answers:readAnswers(session.panel,session.set.items)});
      if (session.key==='repair' && fixed) {
        setText('[data-b3-recovery-status]','Correct. Writing is recorded; recognition and writing continue to be checked separately.',repair);
        if (queue.length) showRecovery();
        else { repair.querySelector('[data-b3-recovery-model]').hidden=false;repair.querySelector('[data-b3-recovery-try]').hidden=true; }
      } else if (pending.length) {showRecovery();live.textContent=`${pending.length} answers need another example. Open “Learn from mistakes” above.`;}
      else if (session.key!=='repair') showRecovery();
      refreshSummary();
      const owner=session.panel.closest('[data-b3-chapter]');
      if(owner) owner.querySelector('[data-b3-chapter-start]').disabled=false;
    });

    // Restore unfinished dynamic sessions from stable item IDs and saved answers.
    for (const [key,saved] of Object.entries(object(state().sessions))) {
      if (!saved || saved.complete || !Array.isArray(saved.ids) || key==='repair') continue;
      const panel = key==='daily'?dailyPanel:key==='final'?finalPanel:root.querySelector(`[data-b3-chapter="${key.replace('chapter:','')}"] [data-b3-chapter-panel]`);
      const items = saved.ids.map(id=>itemsById.get(id)).filter(Boolean);
      const title = key==='daily'?'Today’s B3 practice':key==='final'?bank.finalSet.title:(bank.chapters.find(chapter=>key==='chapter:'+chapter.id)?.title || 'Topic')+' — varied practice';
      if (panel && items.length && items.length===saved.ids.length) mountSession(key,panel,{id:saved.setId,title,passPercent:70,items},object(saved.answers));
    }

    const speakingTasks = speaking.tasks.map(task => ({ ...task, id: task.id ?? task.chapterId }));
    const speakingViews={};
    const speakingRecords=object(state().speaking);
    for (const task of speakingTasks) {
      const record=object(speakingRecords[task.id]);
      speakingViews[task.groupId]={presentation:'selfAssessment',state:{answers:{[task.slug]:record.draft || ''},ratings:{[task.slug]:record.rating || ''}}};
      const owner=root.querySelector(`[data-b3-speaking-owner="${task.id}"]`);
      owner.querySelectorAll('[data-b3-speaking-check]').forEach(input=>{
        input.checked=object(record.checklist)[input.dataset.b3SpeakingCheck]===true;
        input.addEventListener('change',()=>{
          const previous=object(state().speaking);
          const current=object(previous[task.id]);
          save({speaking:{...previous,[task.id]:{...current,checklist:{...object(current.checklist),[input.dataset.b3SpeakingCheck]:input.checked}}}});
          speakingStatus(task);
        });
      });
    }
    function speakingStatus(task) {
      const owner=root.querySelector(`[data-b3-speaking-owner="${task.id}"]`);
      const record=object(object(state().speaking)[task.id]);
      const checked=Object.values(object(record.checklist)).filter(Boolean).length;
      setText('[data-b3-speaking-status]',`${record.draft?'Draft saved':'Write your own response'} · ${checked}/${task.checklist.length} self-checks${record.rating?' · '+(record.rating==='confident'?'confident':'needs practice')+' (self-assessed)':''}`,owner);
    }
    root.addEventListener('malti-bank-draft',event=>{
      const task=speakingTasks.find(task=>task.slug===event.detail.slug);
      if(!task)return;
      const records=object(state().speaking);
      const previous=object(records[task.id]);
      save({speaking:{...records,[task.id]:{...previous,draft:event.detail.value,rating:null,checklist:{}}}});
      const owner=root.querySelector(`[data-b3-speaking-owner="${task.id}"]`);
      owner.querySelectorAll('[data-b3-speaking-check]').forEach(input=>{input.checked=false;});
      owner.querySelectorAll('.toolbar-row .action-button[aria-pressed]').forEach(button=>{button.ariaPressed='false';});
      speakingStatus(task);
    });
    root.addEventListener('malti-bank-rating',event=>{
      const task=speakingTasks.find(task=>task.slug===event.detail.slug);
      if(!task)return;
      const records=object(state().speaking);
      save({speaking:{...records,[task.id]:{...object(records[task.id]),rating:event.detail.value}}});
      speakingStatus(task);
    });
    await window.renderExampleBanksFromData({
      dataUrl:'./assets/data/b3_context_examples.json',data:contexts,groupAttribute:'data-b3-speaking',reviewPrefix:'b3-speaking',sourcePage:'b3_revision.html',
      groupViews:speakingViews,numbered:false
    });
    const readingViews=Object.fromEntries(contexts.groups.filter(group=>group.itemType==='example').map(group=>[group.id,{presentation:'reading'}]));
    await window.renderExampleBanksFromData({
      dataUrl:'./assets/data/b3_context_examples.json',data:contexts,groupAttribute:'data-b3-context',reviewPrefix:'b3-context',sourcePage:'b3_revision.html',groupViews:readingViews,numbered:false
    });
    speakingTasks.forEach(speakingStatus);
    root.querySelectorAll('[data-b3-toggle-translations]').forEach(input=>{
      const toggle=()=>input.closest('[data-b3-context-owner]').querySelectorAll('[data-bank-translation]').forEach(element=>{element.hidden=!input.checked;});
      input.addEventListener('change',toggle);
      toggle();
    });
    refreshSummary();showRecovery();
    const savedRepair=object(object(state().sessions).repair);
    const nextRecovery=state().recoveryQueue?.[0];
    const repairItems=Array.isArray(savedRepair.ids)?savedRepair.ids.map(id=>itemsById.get(id)).filter(Boolean):[];
    if (!savedRepair.complete && nextRecovery && repairItems.length===1 && repairItems[0].patternId===nextRecovery.patternId) {
      repair.querySelector('[data-b3-recovery-model]').hidden=false;
      repair.querySelector('[data-b3-recovery-reveal]').hidden=true;
      repair.querySelector('[data-b3-recovery-try]').hidden=true;
      mountSession('repair',repairPanel,{id:savedRepair.setId,title:savedRepair.title,passPercent:100,items:repairItems},object(savedRepair.answers));
    }
    root.querySelector('[data-b3-practice-loading]').hidden=true;
    root.dataset.b3Ready='true';
  }
  initialize().catch(error=>{
    const status=root.querySelector('[data-b3-practice-loading]');
    status.hidden=false;status.textContent=error.message;
    console.error('B3 practice initialization failed',error);
  });
})();
