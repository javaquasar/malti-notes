(() => {
  'use strict';
  const root = document.querySelector('[data-synonym-game]');
  if (!root) return;

  const storage = window.MaltiStorage;
  const core = window.MaltiStudySessionCore;
  const runner = window.MaltiExerciseRunner;
  const route = core.PRACTICE_ROUTES.find(({ id }) => id === 'sib-is-sinonimu');
  const key = 'malti_topic_practice_v1';
  const find = name => root.querySelector('[data-synonym-' + name + ']');
  const say = (name, value) => { find(name).textContent = value; };
  const read = () => storage.getJson(key, {});
  const pending = () => read().studySession?.helpQueue || [];
  const exercise = find('exercise');
  const start = find('start');
  const next = find('next');
  let plan, round, activeSet;

  const question = () => round.entries[round.index].item;
  const choices = () => [...exercise.querySelectorAll('input[type="radio"]')];
  const field = () => exercise.querySelector('[data-exercise-answer]');
  const answer = () => field()?.value ?? choices().find(input => input.checked)?.value ?? '';

  function saveRound(newQueue) {
    const current = read();
    const nextState = { ...current, synonymGame: { ...round, helpQueue: [] } };
    if (newQueue) nextState.studySession = { ...current.studySession, schemaVersion: 1, helpQueue: newQueue };
    storage.setJson(key, nextState);
  }

  function message(value) {
    say('message', value);
    find('message').hidden = !value;
  }

  function shuffle(options) {
    for (let end = options.length - 1; end > 0; end -= 1) {
      const index = Math.floor(Math.random() * (end + 1));
      [options[index], options[end]] = [options[end], options[index]];
    }
  }

  function drawCue(item) {
    const { maltese, target } = item.cue;
    const offset = target ? maltese.indexOf(target) : -1;
    say('before', offset < 0 ? maltese : maltese.slice(0, offset));
    say('target', offset < 0 ? '' : target);
    say('after', offset < 0 ? '' : maltese.slice(offset + target.length));
    find('target').hidden = offset < 0;
    find('direction').hidden = !target;
    say('title', target ? 'Replace the word' : 'Find the synonym');
  }

  function showChecked(item, result) {
    next.hidden = !result?.checked;
    exercise.querySelector('button[type="submit"]').hidden = !next.hidden;
    for (const input of exercise.querySelectorAll('input[type="radio"], [data-exercise-answer]')) input.disabled = !next.hidden;
    const show = result?.checked && !result.previousQuestion;
    find('checked').hidden = !show;
    if (!show) {
      if (result?.previousQuestion) message('This question was updated. Your earlier result is saved.');
      return;
    }
    const isChoice = item.type === 'multiple-choice';
    const example = item.reviewCard;
    say('outcome', result.correct ? 'Correct' : 'Not quite');
    say('answer', isChoice ? item.cue.maltese + ' / ' + item.answer : item.answer);
    say('translation', item.answerTranslation);
    find('example').hidden = !example?.example;
    say('example-mt', example?.example || '');
    say('example-en', example?.exampleTranslation || '');
    find('explanation').hidden = isChoice;
    say('explanation', item.explanation);
  }

  function drawQuestion() {
    const item = question();
    activeSet = core.stepSet(round);
    const [rendered] = activeSet.items;
    if (rendered.choices) shuffle(rendered.choices);
    runner.render(exercise, activeSet);
    for (const element of exercise.querySelectorAll('header, .exercise-question-header, .exercise-result, .exercise-feedback')) element.hidden = true;

    const draft = round.drafts[item.id] || '';
    choices().forEach(input => {
      input.checked = input.value === draft;
      input.nextElementSibling.lang = 'mt';
    });
    const textField = field();
    if (textField) {
      textField.value = draft;
      textField.lang = 'mt';
      textField.ariaLabel = 'Your answer. ' + item.prompt;
    }
    message('');
    drawCue(item);
    say('progress', 'Question ' + (round.index + 1) + ' of ' + round.entries.length);
    next.textContent = round.index + 1 === round.entries.length ? 'See results' : 'Next question';
    showChecked(item, round.results[item.id]);
    find('title').focus();
  }

  function finishRound() {
    activeSet = null;
    const summary = core.summary(round);
    find('round').hidden = true;
    find('finish').hidden = false;
    say('score', summary.correct + ' of ' + summary.total + ' correct.');
    const count = core.repeatEntries(plan.catalog, pending()).length;
    const repeat = find('repeat');
    repeat.hidden = count === 0;
    repeat.textContent = 'Repeat ' + count + (count === 1 ? ' question' : ' questions') + ' in My practice';
    find('finish-title').focus();
  }

  function begin(saved) {
    round = saved || core.createSession(plan);
    saveRound();
    find('home').hidden = true;
    find('finish').hidden = true;
    find('round').hidden = false;
    drawQuestion();
  }

  exercise.oninput = () => {
    const item = question();
    if (round.results[item.id]?.checked) return;
    round = core.updateDraft(round, item.id, answer());
    saveRound();
    message('');
  };
  exercise.addEventListener('submit', event => {
    const item = question();
    if (round.results[item.id]?.checked || !answer().trim()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!round.results[item.id]?.checked) {
        message(item.type === 'fill-blank' ? 'Write the sentence first.' : 'Choose a synonym first.');
        (field() || choices()[0]).focus();
      }
      return;
    }
    round = core.updateDraft(round, item.id, answer());
  }, true);
  window.addEventListener('malti-exercise-complete', event => {
    if (event.detail.setId !== activeSet?.id) return;
    const item = question();
    const result = event.detail.results.find(entry => entry.itemId === item.id);
    if (!result || round.results[item.id]?.checked) return;
    round.helpQueue = pending();
    round = core.recordResult(round, { itemId: item.id, correct: result.correct, setId: activeSet.id });
    saveRound(result.correct ? undefined : round.helpQueue);
    // The shared runner completes its form actions after emitting the result.
    queueMicrotask(() => {
      exercise.querySelector('.exercise-feedback').hidden = true;
      exercise.querySelectorAll('.exercise-actions button[type="button"]').forEach(button => { button.hidden = true; });
      showChecked(item, round.results[item.id]);
      find('outcome').focus();
    });
  });
  next.addEventListener('click', () => {
    if (!activeSet || !round.results[question().id]?.checked) return;
    round = core.advance(round);
    saveRound();
    if (core.summary(round).complete) finishRound();
    else drawQuestion();
  });
  find('again').addEventListener('click', () => begin());

  async function initialize() {
    const response = await fetch(route.practiceFile);
    if (!response.ok) throw new Error('The question bank is unavailable.');
    plan = core.planFixedPractice(await response.json(), route);
    if (!plan.entries.length) throw new Error('The question bank is empty.');
    const saved = core.resumeSession(read().synonymGame, plan.catalog);
    const unfinished = saved && !core.summary(saved).complete ? saved : null;
    if (unfinished) start.textContent = 'Continue round';
    start.addEventListener('click', () => begin(unfinished));
    start.disabled = false;
    find('loading').hidden = true;
  }

  initialize().catch(error => {
    console.error(error);
    say('loading', 'The game could not load. Reload the page to try again.');
  });
})();
