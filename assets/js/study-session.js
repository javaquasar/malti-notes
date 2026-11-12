/* A common study flow over the existing course, B3 and exercise APIs. */
(() => {
  'use strict';
  const root = document.querySelector('[data-study-root]');
  if (!root) return;
  const KEY = 'malti_topic_practice_v1';
  const storage = window.MaltiStorage, core = window.MaltiStudySessionCore, runner = window.MaltiExerciseRunner;
  const { LESSON05, ROUTE_IDS } = core;
  const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const all = () => object(storage.getJson(KEY, {}));
  const state = () => object(all().studySession);
  const save = patch => storage.setJson(KEY, { ...all(), studySession: { ...state(), ...patch, schemaVersion: 1 } });
  const find = selector => root.querySelector(selector);
  const say = (selector, value) => { find(selector).textContent = value; };
  const status = value => { const node = find('[data-study-status]'); node.textContent = value; node.hidden = !value; };
  const load = async url => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('This topic is not available yet. Connect once to save it for offline practice.');
    return response.json();
  };
  const panel = find('[data-study-exercise]');
  const topicSelect = find('[data-study-topic]');
  const payloads = new Map(), catalogs = new Map();
  const helpKey = entry => [entry.routeId, entry.chapterId, entry.skillId || entry.itemId, entry.mode].join('::');
  let course, manifest, b3, routes = [], route, plan, session, activeSet;
  let rendering = false, submitted = false, handled = false, selectionVersion = 0, helpPage = 0;

  const isLesson05 = entry => (entry.levelId || entry.routeId) === LESSON05.levelId;
  const routeTitle = entry => (entry.levelLabel || entry.levelId.toUpperCase()) + ' · ' + entry.title;
  const parentQueue = () => (state().helpQueue || []).filter(entry => !isLesson05(entry));
  const repeatCount = () => core.lesson05Repeats(plan.catalog, state().helpQueue).length;
  const repeatLabel = count => `Repeat ${count} question${count === 1 ? '' : 's'}`;
  const retryAdvice = () => isLesson05(route) ? 'You can try again or repeat this question later.' : 'You can try again or leave this for a parent.';

  function sourceLink(entry) {
    if (isLesson05(entry)) return './noun_plurals.html#practice';
    return entry.levelId === 'b3' ? './b3_revision.html#' + entry.id
      : './course_chapter.html?chapter=' + encodeURIComponent(entry.id);
  }
  async function planFor(selected) {
    const options = { levelId: selected.levelId, chapterId: selected.id, limit: 6,
      targetProgress: runner.getTargetProgress(), helpQueue: state().helpQueue || [] };
    if (selected.levelId === 'b3') return core.planB3(b3, object(all().b3Revision).core, options);
    if (!payloads.has(selected.id)) {
      const file = isLesson05(selected) ? './assets/data/lesson05_exercises.json'
        : manifest.chapters.find(chapter => chapter.id === selected.id).file;
      payloads.set(selected.id, load(file).catch(error => { payloads.delete(selected.id); throw error; }));
    }
    const payload = await payloads.get(selected.id);
    if (isLesson05(selected)) return core.planLesson05(payload, state().helpQueue);
    return core.planCourse({ course, assessments: payload.assessmentSets, supplements: payload.supplementalItems,
      targets: payload.targets || [] }, options);
  }
  function queueWithPrompts(queue) {
    const previous = new Map((state().helpQueue || []).map(entry => [helpKey(entry), entry]));
    return (queue || []).map(entry => {
      const catalog = catalogs.get(entry.chapterId) || [];
      const original = catalog.find(candidate => candidate.item.id === entry.itemId);
      return { ...previous.get(helpKey(entry)), ...entry,
        prompt: original?.item.prompt || previous.get(helpKey(entry))?.prompt || 'A question in this topic' };
    });
  }
  function persistSession() {
    if (!session) return;
    session.helpQueue = queueWithPrompts(session.helpQueue);
    const current = state(), history = Array.isArray(current.completedSessions) ? current.completedSessions.slice() : [];
    const summary = core.summary(session);
    if (summary.complete && !history.some(entry => entry.id === session.id)) {
      history.push({ id: session.id, routeId: session.routeId, chapterId: session.chapterId,
        title: session.title, ...summary, completedAt: session.completedAt });
    }
    save({ sessions: { ...object(current.sessions), [session.chapterId]: session },
      helpQueue: session.helpQueue, completedSessions: history });
  }
  function readAnswer(item) {
    const element = panel.querySelector('[data-exercise-item]');
    if (!element) return '';
    if (item.type === 'fill-blank') return element.querySelector('[data-exercise-answer]')?.value || '';
    if (item.type === 'matching') return [...element.querySelectorAll('select[data-match-index]')].map(select => select.value);
    if (item.type === 'order-words') return [...element.querySelectorAll('.exercise-order-answer .exercise-token')].map(button => button.textContent);
    return element.querySelector('input[type="radio"]:checked')?.value || '';
  }
  function remember() {
    if (rendering || !session || find('[data-study-session]').hidden) return;
    const entry = session.entries[session.index];
    if (!entry) return;
    session = core.updateDraft(session, entry.item.id, readAnswer(entry.item));
    persistSession();
  }
  function restoreAnswer(item, value) {
    if (value === undefined) return;
    if (item.type === 'fill-blank') panel.querySelector('[data-exercise-answer]').value = String(value);
    else if (item.type === 'matching') panel.querySelectorAll('select[data-match-index]').forEach((select, index) => { select.value = value[index] || ''; });
    else if (item.type === 'order-words') {
      for (const word of Array.isArray(value) ? value : String(value).split(' ')) {
        const token = [...panel.querySelectorAll('.exercise-order-bank .exercise-token')].find(button => button.textContent === word);
        if (token) token.click();
      }
    } else panel.querySelectorAll('input[type="radio"]').forEach(input => { input.checked = input.value === String(value); });
  }
  function setAnswerDisabled(disabled) {
    panel.querySelectorAll('input, select, .exercise-token').forEach(input => { input.disabled = disabled; });
  }
  function refreshHelpQueue() {
    const pending = parentQueue(), slots = [...root.querySelectorAll('[data-study-help-slot]')];
    helpPage = Math.max(0, Math.min(helpPage, Math.ceil(pending.length / slots.length) - 1));
    const start = helpPage * slots.length;
    slots.forEach((slot, index) => {
      const entry = pending[start + index];
      slot.hidden = !entry;
      if (!entry) return;
      slot.dataset.helpKey = helpKey(entry);
      const selected = routes.find(candidate => candidate.id === entry.chapterId);
      slot.querySelector('[data-help-topic]').textContent = (selected?.levelId || entry.routeId).toUpperCase() + ' · ' + (selected?.title || 'Practice');
      slot.querySelector('[data-help-prompt]').textContent = entry.prompt || 'A question in this topic';
      slot.querySelector('[data-help-open]').href = selected ? sourceLink(selected) : './course_path.html';
    });
    const completed = (state().completedSessions || []).length;
    say('[data-study-parent-summary]', pending.length
      ? `${pending.length} question${pending.length === 1 ? '' : 's'} to revisit together. ${completed} short session${completed === 1 ? '' : 's'} finished. Hints and parent requests are kept separate from independent answers.`
      : `No questions waiting for help. ${completed} short session${completed === 1 ? '' : 's'} finished.`);
    say('[data-help-page]', pending.length ? `${start + 1}–${Math.min(start + slots.length, pending.length)} of ${pending.length}` : 'No requests');
    find('[data-help-prev]').disabled = helpPage === 0;
    find('[data-help-next]').disabled = start + slots.length >= pending.length;
  }
  function refreshWarmup(current, saved) {
    const warmup = core.warmupFor(plan);
    const panel = find('[data-study-warmup]');
    const hasPractised = Boolean(saved) || (current.completedSessions || []).some(value => value.chapterId === route.id);
    panel.hidden = !warmup.phrases.length;
    panel.open = !panel.hidden && !hasPractised;
    find('[data-study-goal]').hidden = hasPractised || panel.hidden;
    say('[data-study-goal]', warmup.goal);
    panel.querySelectorAll('[data-study-phrase]').forEach((slot, index) => {
      const phrase = warmup.phrases[index];
      slot.hidden = !phrase;
      slot.querySelector('[lang="mt"]').textContent = phrase?.maltese || '';
      slot.querySelector('[lang="en"]').textContent = phrase?.english || '';
    });
    find('[data-study-warmup-example]').hidden = !warmup.model;
    say('[data-study-warmup-mt]', warmup.model?.maltese || '');
    say('[data-study-warmup-en]', warmup.model?.english || '');
    say('[data-study-warmup-tip]', warmup.tip);
    find('[data-study-calendar-home]').hidden = route.id !== 'b3-calendar';
  }
  function refreshHome() {
    if (!route || !plan) return;
    say('[data-study-topic-title]', routeTitle(route));
    const current = state();
    const saved = core.resumeSession(object(current.sessions)[route.id], plan.catalog);
    const unfinished = saved && !core.summary(saved).complete;
    refreshWarmup(current, saved);
    const repeats = isLesson05(route) ? repeatCount() : 0;
    find('[data-study-start]').textContent = unfinished ? 'Continue practice' : repeats ? repeatLabel(repeats) : 'Start practice';
    find('[data-study-start]').disabled = !plan.entries.length;
    say('[data-study-home-status]', unfinished
      ? `Continue at question ${saved.index + 1} of ${saved.entries.length}. Your answers are saved.`
      : isLesson05(route) ? repeats ? 'Answer again without hints to clear your repeat list.'
        : `${plan.catalog.length} questions. Write a complete sentence in Maltese for each one.`
        : `${plan.entries.length} short questions, one at a time.`);
    topicSelect.value = route.id;
    [...topicSelect.options].forEach(option => { option.hidden = option.dataset.level !== route.levelId; option.disabled = option.hidden; });
    root.querySelectorAll('[data-study-level]').forEach(button => { button.ariaPressed = String(button.dataset.studyLevel === route.levelId); });
    find('[data-study-reference]').href = sourceLink(route);
    const assigned = state().assignment;
    find('[data-study-assigned-note]').hidden = assigned?.chapterId !== route.id;
    say('[data-study-assigned-note]', 'Chosen by your parent for this practice.');
    find('[data-study-assignment]').value = assigned?.chapterId || route.id;
    refreshHelpQueue();
  }
  async function selectRoute(selected, announce = true) {
    if (!selected) return;
    remember();
    const version = ++selectionVersion;
    find('[data-study-start]').disabled = true;
    status('Preparing this topic…');
    const next = await planFor(selected);
    if (version !== selectionVersion) return;
    route = selected; plan = next; session = null; activeSet = null;
    catalogs.set(route.id, plan.catalog);
    const current = state();
    save({ levelId: route.levelId, chapterId: route.id, topicsByLevel: { ...object(current.topicsByLevel), [route.levelId]: route.id } });
    const address = new URL(location.href);
    address.searchParams.set('level', route.levelId); address.searchParams.set('topic', route.id);
    address.searchParams.delete('chapter');
    history.replaceState(null, '', address.pathname + address.search + address.hash);
    find('[data-study-home]').hidden = false; find('[data-study-session]').hidden = true; find('[data-study-finish]').hidden = true;
    refreshHome();
    status(announce ? 'Ready. Start when you are ready.' : 'Your place is saved.');
  }
  function showFinish() {
    persistSession();
    const summary = core.summary(session);
    find('[data-study-home]').hidden = true; find('[data-study-session]').hidden = true; find('[data-study-finish]').hidden = false;
    say('[data-study-result]', `${summary.checked} answer${summary.checked === 1 ? '' : 's'} checked out of ${summary.total}: ${summary.independentCorrect} correct on your own and ${summary.correct - summary.independentCorrect} correct with help.`);
    if (isLesson05(route)) {
      const repeats = repeatCount();
      say('[data-study-result-help]', repeats
        ? 'Missed, skipped and helped answers are saved for another try in My practice.'
        : 'You answered every question in this session correctly on your own.');
      say('[data-study-new]', repeats ? repeatLabel(repeats) : 'Start full practice again');
    } else {
      say('[data-study-result-help]', summary.deferred
        ? `${summary.deferred} question${summary.deferred === 1 ? '' : 's'} left for a parent. You can look at it together later.`
        : parentQueue().length ? 'Some questions are saved to practise together later.' : 'Your next practice will use your results.');
      say('[data-study-new]', 'Another short session');
    }
    find('[data-study-calendar-finish]').hidden = session.chapterId !== 'b3-calendar';
    refreshHelpQueue(); status('Session finished. Your work is saved.');
    find('#study-finish-title').focus();
  }
  function showSupport(entry, result) {
    const id = entry.item.id, support = core.supportFor(entry, plan.catalog);
    const hinted = session.hints[id] === true;
    const example = hinted && object(session.examples)[id] === true && Boolean(support.model);
    const solution = hinted && object(session.solutions)[id] === true;
    const checked = result?.checked === true;
    const hint = find('[data-study-hint]');
    const model = find('[data-study-model]');
    const answer = find('[data-study-solution]');
    hint.hidden = checked;
    hint.ariaExpanded = String(hinted);
    model.hidden = checked || !hinted || !support.model;
    model.ariaExpanded = String(example);
    answer.hidden = checked || !hinted || (Boolean(support.model) && !example);
    answer.ariaExpanded = String(solution);
    find('[data-study-help]').hidden = !hinted || checked;
    say('[data-study-help-explanation]', support.clue);
    find('[data-study-help-example]').hidden = !example;
    find('[data-study-help-mt]').hidden = !example;
    find('[data-study-help-en]').hidden = !example || !support.model.english;
    say('[data-study-help-mt]', example ? support.model.maltese : '');
    say('[data-study-help-en]', example ? support.model.english : '');
    const correct = entry.item.type === 'matching' ? entry.item.pairs.map(pair => `${pair.left} → ${pair.right}`).join('; ')
      : entry.item.type === 'true-false' ? entry.item.answer ? 'True' : 'False' : entry.item.answer;
    find('[data-study-help-answer]').hidden = !solution;
    say('[data-study-help-answer]', solution ? `Answer: ${correct}. ${entry.help.explanation}` : '');
    const transfer = support.transfer;
    find('[data-study-transfer]').hidden = !checked || result.previousQuestion === true || !transfer;
    find('[data-study-transfer-model]').open = false;
    if (transfer) {
      say('[data-study-transfer-prompt]', transfer.prompt.maltese);
      say('[data-study-transfer-meaning]', `(${transfer.prompt.english})`);
      say('[data-study-transfer-mt]', transfer.model);
      say('[data-study-transfer-cue]', transfer.cue);
    }
  }
  function showCheckedAnswer(entry, result) {
    const { answer, answerTranslation } = entry.item;
    const visible = Boolean(answerTranslation && result?.checked && !result.previousQuestion);
    find('[data-study-checked-answer]').hidden = !visible;
    say('[data-study-checked-mt]', visible ? answer + '.' : '');
    say('[data-study-checked-en]', visible ? answerTranslation : '');
    if (visible) {
      panel.querySelector('.exercise-feedback').textContent = `${result.correct ? 'Correct.' : 'Not yet.'} ${entry.help.explanation}`;
    }
  }

  function drawStep() {
    if (!session || core.summary(session).complete) { if (session) showFinish(); return; }
    rendering = true;
    session.helpQueue = state().helpQueue || [];
    activeSet = core.stepSet(session);
    const entry = session.entries[session.index], result = session.results[entry.item.id];
    activeSet.items[0].sourcePage = entry.help.sourcePage && entry.help.sourcePage !== 'course_chapter.html'
      ? entry.help.sourcePage : sourceLink(route);
    runner.render(panel, activeSet);
    panel.hidden = result?.previousQuestion === true;
    const runnerHeading = panel.querySelector('header');
    if (runnerHeading) runnerHeading.hidden = true;
    restoreAnswer(entry.item, session.drafts[entry.item.id]);
    submitted = Boolean(result?.checked); handled = submitted;
    if (result?.checked) {
      const feedback = panel.querySelector('.exercise-feedback');
      feedback.hidden = false;
      feedback.textContent = result.feedback || (result.correct ? 'Correct. ' : 'Keep practising. ') + entry.help.explanation;
      panel.querySelector('button[type="submit"]').hidden = true;
      panel.querySelectorAll('.exercise-actions button').forEach(button => { if (button.textContent === 'Try again') button.hidden = Boolean(result.previousQuestion); });
      setAnswerDisabled(true);
    }
    say('[data-study-session-title]', routeTitle(route));
    say('[data-study-step-status]', `Question ${session.index + 1} of ${session.entries.length}`);
    find('[data-study-next]').disabled = !result?.checked;
    find('[data-study-next]').textContent = session.index + 1 === session.entries.length ? 'See my result' : 'Next question';
    find('[data-study-reading]').hidden = !isLesson05(route) || entry.item.sourcePage !== 'places_events.html#lesson05-il-festi';
    const assisted = session.hints[entry.item.id] === true;
    showSupport(entry, result);
    showCheckedAnswer(entry, result);
    const feedback = result?.previousQuestion ? 'You checked an earlier version of this question. Your result is saved. Go to the next question.'
      : result?.checked ? result.correct ? 'You can go to the next question.' : retryAdvice()
      : assisted ? 'This attempt uses a hint. Your independent results stay separate.' : '';
    say('[data-study-feedback]', feedback);
    say('[data-study-ask]', isLesson05(route) ? 'Save for later' : 'Leave this for a parent');
    find('[data-study-ask]').hidden = isLesson05(route) && result?.checked === true;
    find('[data-study-home]').hidden = true; find('[data-study-finish]').hidden = true; find('[data-study-session]').hidden = false;
    rendering = false;
    status('');
  }
  async function startPractice(fresh = false) {
    remember();
    const selected = route, version = ++selectionVersion;
    find('[data-study-start]').disabled = true;
    const prepared = await planFor(selected);
    if (version !== selectionVersion || route.id !== selected.id) return;
    plan = prepared; catalogs.set(route.id, plan.catalog);
    const saved = object(state().sessions)[route.id];
    session = !fresh && core.resumeSession(saved, plan.catalog);
    if (session && (session.chapterId !== route.id || session.routeId !== route.levelId)) session = null;
    if (!session || core.summary(session).complete) {
      if (saved && !core.resumeSession(saved, plan.catalog)) {
        save({ archivedSessions: [...(state().archivedSessions || []), saved] });
      }
      session = core.createSession(plan, { id: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), helpQueue: state().helpQueue || [] });
    }
    if (!session.entries.length) { status('Choose another topic to practise.'); return; }
    session.helpQueue = state().helpQueue || [];
    persistSession(); drawStep();
    find('[data-study-session]').scrollIntoView({ block: 'start' });
    find('[data-study-session-title]').tabIndex = -1; find('[data-study-session-title]').focus();
  }
  function assist(stage) {
    const id = session?.entries[session.index]?.item.id;
    if (!id || session.results[id]?.checked) return;
    remember();
    session = core.useHint(session);
    if (stage === 'example') session.examples = { ...object(session.examples), [id]: true };
    if (stage === 'solution') session.solutions = { ...object(session.solutions), [id]: true };
    persistSession(); drawStep();
  }
  const guarded = action => async event => { try { await action(event); } catch (error) { status(error.message); find('[data-study-start]').disabled = !plan?.entries.length; } };

  async function initialize() {
    [course, manifest, b3] = await Promise.all([load('./assets/data/course_path.json'), load('./assets/data/course/manifest.json'), load('./assets/data/b3_practice_bank.json')]);
    routes = course.levels.flatMap(level => level.chapters.map(chapter => ({ id: chapter.id, levelId: level.id, title: chapter.title })))
      .concat(b3.chapters.map(chapter => ({ id: chapter.id, levelId: 'b3', title: chapter.title })), LESSON05);
    root.querySelectorAll('[data-study-level]').forEach(button => button.addEventListener('click', guarded(async () => {
      const id = button.dataset.studyLevel;
      await selectRoute(routes.find(candidate => candidate.id === object(state().topicsByLevel)[id] && candidate.levelId === id) || routes.find(candidate => candidate.levelId === id));
    })));
    topicSelect.addEventListener('change', guarded(async () => {
      await selectRoute(routes.find(candidate => candidate.id === topicSelect.value));
      find('[data-study-topics]').open = false;
      find('[data-study-topic-title]').focus();
    }));
    root.querySelector('a[href="#study-topics"]').addEventListener('click', event => {
      event.preventDefault(); find('[data-study-topics]').open = true; topicSelect.focus();
    });
    find('[data-study-start]').addEventListener('click', guarded(() => startPractice()));
    find('[data-study-back]').addEventListener('click', () => { remember(); find('[data-study-session]').hidden = true; find('[data-study-home]').hidden = false; refreshHome(); status('Your place and answers are saved.'); });
    find('[data-study-hint]').addEventListener('click', () => assist('clue'));
    find('[data-study-model]').addEventListener('click', () => assist('example'));
    find('[data-study-solution]').addEventListener('click', () => assist('solution'));
    find('[data-study-next]').addEventListener('click', () => { if (!session || !session.results[session.entries[session.index]?.item.id]?.checked) return; session = core.advance(session); persistSession(); drawStep(); });
    find('[data-study-ask]').addEventListener('click', () => {
      if (!session) return;
      remember(); session.helpQueue = state().helpQueue || []; session = core.requestHelp(session); persistSession(); drawStep();
      status(isLesson05(route) ? 'Saved to repeat in My practice.' : 'Saved for a parent. You can continue with the next question.');
    });
    find('[data-study-done]').addEventListener('click', () => { find('[data-study-finish]').hidden = true; find('[data-study-home]').hidden = false; refreshHome(); status('Practice finished. Your work is saved.'); });
    find('[data-study-new]').addEventListener('click', guarded(() => startPractice(true)));
    find('[data-study-assign]').addEventListener('click', guarded(async () => {
      const selected = routes.find(candidate => candidate.id === find('[data-study-assignment]').value);
      if (!selected) return;
      remember(); save({ assignment: { levelId: selected.levelId, chapterId: selected.id } });
      await selectRoute(selected);
      say('[data-study-assignment-status]', routeTitle(selected) + ' is chosen. Earlier sessions stay saved.');
    }));
    root.querySelectorAll('[data-help-resolve]').forEach(button => button.addEventListener('click', () => {
      const id = button.closest('[data-study-help-slot]').dataset.helpKey;
      save({ helpQueue: (state().helpQueue || []).filter(entry => helpKey(entry) !== id) });
      if (session) session.helpQueue = state().helpQueue;
      refreshHelpQueue();
    }));
    find('[data-help-prev]').addEventListener('click', () => { helpPage -= 1; refreshHelpQueue(); });
    find('[data-help-next]').addEventListener('click', () => { helpPage += 1; refreshHelpQueue(); });
    // This panel is owned by this controller; native input snapshots also cover autofill and dictation.
    panel.oninput = remember;
    panel.addEventListener('keyup', remember); panel.addEventListener('change', remember);
    panel.addEventListener('compositionend', remember);
    ['paste', 'cut', 'drop'].forEach(name => panel.addEventListener(name, () => setTimeout(remember, 0)));
    panel.addEventListener('click', event => {
      const button = event.target.closest('button[type=button]');
      if (button?.textContent === 'Try again' && session?.results[session.entries[session.index]?.item.id]?.checked) {
        event.preventDefault(); event.stopImmediatePropagation(); session = core.beginRetry(session); persistSession(); drawStep();
      }
    }, true);
    panel.addEventListener('click', remember);
    panel.addEventListener('submit', event => {
      if (rendering || submitted || !session) { event.preventDefault(); event.stopImmediatePropagation(); return; }
      const entry = session.entries[session.index], value = readAnswer(entry.item);
      if (Array.isArray(value) ? !value.length || value.some(answer => !answer) : !String(value).trim()) {
        event.preventDefault(); event.stopImmediatePropagation(); say('[data-study-feedback]', 'Choose or write an answer first.');
        panel.querySelector('input, select, button')?.focus(); return;
      }
      remember(); submitted = true; handled = false;
    }, true);
    window.addEventListener('pagehide', remember);
    window.addEventListener('malti-exercise-complete', event => {
      if (!session || !activeSet || handled || event.detail.setId !== activeSet.id) return;
      const entry = session.entries[session.index], result = event.detail.results.find(item => item.itemId === entry.item.id);
      if (!result) return;
      handled = true;
      const previous = session.results[entry.item.id];
      session.helpQueue = state().helpQueue || [];
      session = core.recordResult(session, { itemId: entry.item.id, correct: result.correct, setId: activeSet.id,
        attemptToken: session.id + ':' + entry.item.id + ':' + ((previous?.attempts || 0) + 1) });
      const saved = session.results[entry.item.id];
      saved.feedback = panel.querySelector('.exercise-feedback')?.textContent || '';
      if (entry.routeId === 'b3' && !saved.assisted) {
        const prior = object(all().b3Revision);
        storage.setJson(KEY, { ...all(), b3Revision: { ...prior, core: window.MaltiB3PracticeCore.recordResults(prior.core,
          [{ itemId: entry.item.id, patternId: entry.skillId, mode: entry.mode, correct: result.correct }]) } });
      }
      persistSession(); setAnswerDisabled(true); find('[data-study-next]').disabled = false;
      showSupport(entry, saved);
      showCheckedAnswer(entry, saved);
      if (isLesson05(route)) find('[data-study-ask]').hidden = true;
      say('[data-study-feedback]', result.correct ? 'Answer checked. You can go to the next question.' : retryAdvice());
      refreshHelpQueue();
    });
    const params = new URLSearchParams(location.search), current = state();
    const level = ROUTE_IDS.includes(params.get('level')) ? params.get('level') : ROUTE_IDS.includes(current.levelId) ? current.levelId : 'b1';
    const requested = params.get('topic') || params.get('chapter') || object(current.topicsByLevel)[level];
    await selectRoute(routes.find(candidate => candidate.id === requested && candidate.levelId === level) || routes.find(candidate => candidate.levelId === level));
  }
  initialize().catch(error => { status(error.message); });
})();
