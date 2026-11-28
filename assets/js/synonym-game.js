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
  const pairs = find('pairs');
  const start = find('start');
  const next = find('next');
  const pairButtons = {
    left: [...pairs.querySelectorAll('[data-pair-side="left"]')],
    right: [...pairs.querySelectorAll('[data-pair-side="right"]')]
  };
  const formats = {
    word: ['Find the synonym', ''],
    listen: ['Listen and choose', ''],
    pairs: ['Match the pairs', 'Tap one word from each column. Matching numbers show your pairs.'],
    context: ['Choose in context', 'Replace the highlighted word with a synonym.'],
    article: ['Choose the article', 'Pick the synonym with the correct article.'],
    rewrite: ['Rewrite the sentence', 'Replace the highlighted word and write the whole sentence.']
  };
  let bank, plan, round, activeSet, selectedPairWord;

  const question = () => round.entries[round.index].item;
  const formatOf = item => item.gameFormat || (item.type === 'fill-blank' ? 'rewrite' : 'word');
  const choices = () => [...exercise.querySelectorAll('input[type="radio"]')];
  const matchFields = () => [...exercise.querySelectorAll('[data-match-index]')];
  const field = () => exercise.querySelector('[data-exercise-answer]');
  const answer = () => question().type === 'matching'
    ? matchFields().map(input => input.value)
    : field()?.value ?? choices().find(input => input.checked)?.value ?? '';

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

  function saveDraft() {
    const item = question();
    if (round.results[item.id]?.checked) return;
    round = core.updateDraft(round, item.id, answer());
    saveRound();
    message('');
  }

  function shuffle(options) {
    for (let end = options.length - 1; end > 0; end -= 1) {
      const index = Math.floor(Math.random() * (end + 1));
      [options[index], options[end]] = [options[end], options[index]];
    }
  }

  function mixedEntries() {
    // The bank interleaves formats. Shuffle the items within each set of slots.
    const byFormat = new Map();
    for (const entry of plan.entries) {
      const format = formatOf(entry.item);
      if (!byFormat.has(format)) byFormat.set(format, []);
      byFormat.get(format).push(entry);
    }
    byFormat.forEach(shuffle);
    return plan.entries.map(({ item }) => byFormat.get(formatOf(item)).pop());
  }

  function paintPairs() {
    const matched = matchFields().map(input => input.value);
    for (const [side, buttons] of Object.entries(pairButtons)) {
      buttons.forEach((button, index) => {
        const pair = side === 'left' ? (matched[index] ? index : -1) : matched.indexOf(button.value);
        button.ariaPressed = String(button === selectedPairWord);
        button.querySelector('[data-pair-number]').textContent = pair < 0 ? '' : ' · ' + (pair + 1);
      });
    }
  }

  function drawPairs(item, draft) {
    const fields = matchFields();
    const right = item.pairs.map(pair => pair.right);
    shuffle(right);
    selectedPairWord = null;
    fields.forEach((input, index) => { input.value = draft?.[index] || ''; });
    for (const [side, words] of Object.entries({ left: item.pairs.map(pair => pair.left), right })) {
      pairButtons[side].forEach((button, index) => {
        button.value = words[index];
        button.querySelector('[data-pair-word]').textContent = words[index];
      });
    }
    // The shared runner still grades and persists the equivalent select values.
    exercise.querySelector('[data-exercise-item]').hidden = true;
    paintPairs();
  }

  pairs.addEventListener('click', event => {
    const word = event.target.closest('[data-pair-side]');
    if (!word || question().type !== 'matching' || round.results[question().id]?.checked) return;
    if (!selectedPairWord || word.dataset.pairSide === selectedPairWord.dataset.pairSide) {
      selectedPairWord = word === selectedPairWord ? null : word;
    } else {
      const [left, right] = word.dataset.pairSide === 'left' ? [word, selectedPairWord] : [selectedPairWord, word];
      const fields = matchFields();
      const input = fields[pairButtons.left.indexOf(left)];
      const alreadyMatched = fields.find(element => element.value === right.value);
      if (alreadyMatched) alreadyMatched.value = '';
      if (alreadyMatched !== input) input.value = right.value;
      selectedPairWord = null;
      saveDraft();
    }
    paintPairs();
  });

  function drawCue(item) {
    const format = formatOf(item);
    const [title, direction] = formats[format];
    const listening = format === 'listen';
    find('listening').hidden = !listening;
    say('listening-word', listening ? item.cue.maltese : '');
    const { maltese = '', target } = listening ? {} : item.cue || {};
    const offset = target ? maltese.indexOf(target) : -1;
    say('before', offset < 0 ? maltese : maltese.slice(0, offset));
    say('target', offset < 0 ? '' : target);
    say('after', offset < 0 ? '' : maltese.slice(offset + target.length));
    find('target').hidden = offset < 0;
    find('cue').hidden = !maltese;
    const instruction = listening ? item.prompt : direction;
    find('direction').hidden = !instruction;
    say('direction', instruction);
    say('title', listening && item.cue.target ? 'Listen to a phrase' : title);
  }

  function drawAnswer(item) {
    const format = formatOf(item);
    const example = item.reviewCard;
    const useExample = format === 'context' || format === 'article';
    const isWordPair = format === 'word' || format === 'listen';
    const { maltese = '', target } = item.cue || {};
    const answer = isWordPair ? (target || maltese) + ' / ' + item.answer : useExample ? example.example : item.answer;
    const model = format === 'listen' && target ? maltese + ' (' + answer + ')' : answer;
    const offset = target ? maltese.indexOf(target) : -1;
    const before = offset < 0 ? '' : maltese.slice(0, offset);
    const after = offset < 0 ? '' : maltese.slice(offset + target.length);
    const changed = offset >= 0 && model.startsWith(before) && model.endsWith(after);
    say('answer-before', changed ? before : model);
    say('answer-change', changed ? model.slice(before.length, model.length - after.length) : '');
    say('answer-after', changed ? after : '');
    find('answer-change').hidden = !changed;
    say('translation', useExample ? example.exampleTranslation : item.answerTranslation);
    find('example').hidden = format !== 'word' || !example?.example;
    say('example-mt', example?.example || '');
    say('example-en', example?.exampleTranslation || '');
    say('explanation', item.explanation);
  }

  function showChecked(item, result) {
    const checked = Boolean(result?.checked);
    next.hidden = !checked;
    find('next-row').hidden = !checked;
    exercise.hidden = checked;
    pairs.hidden = checked || item.type !== 'matching';
    say('progress-marks', '●'.repeat(round.index + Number(checked)) + '○'.repeat(round.entries.length - round.index - Number(checked)));
    const show = checked && !result.previousQuestion;
    find('checked').hidden = !show;
    if (!show) {
      if (result?.previousQuestion) message('This question was updated. Your earlier result is saved.');
      return;
    }
    say('outcome', result.correct ? 'Correct' : 'Not quite');
    drawAnswer(item);
  }

  function drawQuestion() {
    const item = question();
    activeSet = core.stepSet(round);
    const [rendered] = activeSet.items;
    if (rendered.choices) shuffle(rendered.choices);
    runner.render(exercise, activeSet);
    for (const element of exercise.querySelectorAll('header, .exercise-question-header, .exercise-result, .exercise-feedback')) element.hidden = true;

    const draft = round.drafts[item.id];
    if (item.type === 'matching') drawPairs(item, draft);
    choices().forEach(input => {
      input.checked = input.value === draft;
      input.nextElementSibling.lang = 'mt';
    });
    const textField = field();
    if (textField) {
      textField.value = draft || '';
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

  function showCategory(category, items) {
    const missed = items.filter(item => !round.results[item.id]?.correct);
    say(category + '-score', (items.length - missed.length) + ' of ' + items.length + ' correct');
    find(category + '-review').hidden = missed.length === 0;
    say(category + '-misses', missed.map(item => {
      if (item.type !== 'matching') return item.cue.target || item.cue.maltese;
      const draft = round.drafts[item.id];
      return item.pairs.filter((pair, index) => pair.right !== draft?.[index]).map(pair => pair.left).join(' / ');
    }).join(' · '));
  }

  function finishRound() {
    activeSet = null;
    const summary = core.summary(round);
    find('round').hidden = true;
    find('finish').hidden = false;
    say('score', summary.correct + ' of ' + summary.total + ' correct.');
    const items = round.entries.map(entry => entry.item);
    const usesForm = item => ['rewrite', 'article'].includes(formatOf(item));
    showCategory('meaning', items.filter(item => !usesForm(item)));
    showCategory('form', items.filter(usesForm));
    const count = core.repeatEntries(plan.catalog, pending()).length;
    const repeat = find('repeat');
    repeat.hidden = count === 0;
    repeat.textContent = 'Repeat ' + count + (count === 1 ? ' question' : ' questions') + ' in My practice';
    find('finish-title').focus();
  }

  function begin(saved) {
    if (!saved) {
      plan = core.planFixedPractice(bank, route, undefined, read().synonymGame?.entries);
    }
    round = saved || core.createSession({ ...plan, entries: mixedEntries() });
    saveRound();
    find('home').hidden = true;
    find('finish').hidden = true;
    find('round').hidden = false;
    drawQuestion();
  }

  exercise.oninput = saveDraft;
  exercise.addEventListener('submit', event => {
    const item = question();
    const value = answer();
    const complete = Array.isArray(value) ? value.every(Boolean) : Boolean(value.trim());
    if (round.results[item.id]?.checked || !complete) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!round.results[item.id]?.checked) {
        const prompt = item.type === 'matching' ? 'Match all three pairs before checking.'
          : item.type === 'fill-blank' ? 'Write the sentence first.' : 'Choose a synonym first.';
        message(prompt);
        (field() || choices()[0] || pairButtons.left[value.indexOf('')]).focus();
      }
      return;
    }
    round = core.updateDraft(round, item.id, value);
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
    bank = await response.json();
    plan = core.planFixedPractice(bank, route);
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
