(() => {
  'use strict';
  const KEY = 'malti_topic_practice_v1';
  const storage = window.MaltiStorage;
  const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const state = () => object(storage.getJson(KEY, {}));
  const save = (name, value) => storage.setJson(KEY, { ...state(), [name]: value });
  const load = async url => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Practice data unavailable (${response.status}).`);
    return response.json();
  };
  const text = (root, selector, value) => { root.querySelector(selector).textContent = value; };
  const guardSubmission = root => root.addEventListener('submit', event => {
    if (event.target.dataset.submitted) {
      event.preventDefault();
      event.stopImmediatePropagation();
    } else event.target.dataset.submitted = 'true';
  }, true);

  async function guided(root) {
    const data = await load('./assets/data/everyday_scenarios_exercises.json');
    const scenario = data.sets.find(set => set.id === root.dataset.guidedScenario);
    if (!scenario) throw new Error('Conversation not found.');
    const key = `scenario:${scenario.id}`;
    const saved = object(state()[key]);
    let index = Number.isInteger(saved.index) ? Math.max(0, Math.min(saved.index, scenario.items.length)) : 0;
    const drafts = object(saved.drafts);
    const panel = root.querySelector('[data-scenario-exercise]');
    const next = root.querySelector('[data-scenario-next]');
    const stepId = () => `${scenario.id}-turn-${index + 1}`;
    const remember = () => save(key, { index, drafts });
    const completed = () => window.MaltiExerciseRunner.getProgress()[stepId()]?.passed === true;
    guardSubmission(panel);
    function draw() {
      const done = index === scenario.items.length;
      panel.hidden = done;
      next.hidden = done;
      root.querySelector('[data-scenario-cue]').hidden = done;
      text(root, '[data-scenario-status]', done ? 'Conversation complete.' : `Turn ${index + 1} of ${scenario.items.length}`);
      if (done) return;
      const item = scenario.items[index];
      text(root, '[data-scenario-maltese]', item.cue.maltese);
      text(root, '[data-scenario-english]', item.cue.english);
      window.MaltiExerciseRunner.render(panel, {
        id: stepId(), title: scenario.title, passPercent: 100,
        items: [{ ...item, sourcePage: scenario.sourcePage, assessmentMode: item.type === 'fill-blank' ? 'production' : 'recognition' }]
      });
      next.disabled = !completed();
      next.textContent = index === scenario.items.length - 1 ? 'Finish conversation' : 'Next turn';
      const draft = drafts[item.id];
      if (typeof draft === 'string') panel.querySelectorAll('input[type="text"], input[type="radio"]').forEach(input => {
        if (input.type === 'radio') input.checked = input.value === draft;
        else input.value = draft;
      });
      const heading = panel.querySelector('h3');
      heading.tabIndex = -1;
    }
    panel.addEventListener('input', event => {
      if (!scenario.items[index] || !(event.target instanceof HTMLInputElement)) return;
      drafts[scenario.items[index].id] = event.target.value;
      remember();
    });
    window.addEventListener('malti-exercise-complete', event => {
      if (event.detail.setId === stepId()) next.disabled = !completed();
    });
    next.addEventListener('click', () => {
      if (!completed() || index >= scenario.items.length) return;
      index += 1;
      remember();
      draw();
      if (index < scenario.items.length) panel.querySelector('h3').focus();
      else root.querySelector('[data-scenario-restart]').focus();
    });
    root.querySelector('[data-scenario-restart]').addEventListener('click', () => {
      index = 0;
      Object.keys(drafts).forEach(key => delete drafts[key]);
      remember();
      draw();
      panel.querySelector('h3').focus();
    });
    draw();
  }

  async function recall(root) {
    const dataUrl = root.dataset.contentSrc;
    const data = await load(dataUrl);
    const saved = object(state().threeWords);
    const answers = object(saved.answers);
    const ratings = object(saved.ratings);
    const remember = () => save('threeWords', { answers, ratings });
    const progress = () => text(root, '[data-recall-progress]',
      `${Object.values(answers).filter(value => typeof value === 'string' && value.trim()).length} / 10 answered · ${Object.values(ratings).filter(value => value === 'confident').length} confident (self-assessed)`);
    root.addEventListener('malti-bank-draft', event => {
      const { slug, value } = event.detail;
      if (answers[slug] !== value) {
        delete ratings[slug];
        root.querySelectorAll(`[data-bank-item="${slug}"] .toolbar-row > .action-button[aria-pressed]`).forEach(button => { button.ariaPressed = 'false'; });
      }
      answers[slug] = value;
      remember();
      progress();
      const words = value.split(/[;,\n]+/).map(word => word.trim().toLocaleLowerCase()).filter(Boolean);
      const check = data.groups[0].items.find(item => item.slug === slug)?.check;
      const letterMatch = words.every(word => (!check?.prefix || word.startsWith(check.prefix)) && (!check?.suffix || word.endsWith(check.suffix)));
      text(root, '[data-recall-status]', `${words.length} entries; ${new Set(words).size} distinct.${check ? (letterMatch && words.length ? ' The requested letters match; meaning still needs review.' : ' Check the requested first or last letters.') : ' Compare meanings and pronunciation with the examples or a teacher.'}`);
    });
    root.addEventListener('malti-bank-rating', event => {
      ratings[event.detail.slug] = event.detail.value;
      remember();
      progress();
    });
    await window.renderExampleBanksFromData({
      dataUrl, data, groupAttribute: 'data-recall-bank', sourcePage: 'school_classroom.html#three-word-challenge',
      reviewPrefix: 'three-words', numbered: false,
      groupViews: { 'three-word-challenge': { presentation: 'selfAssessment', state: { answers, ratings } } }
    });
    progress();
  }

  async function listening(root) {
    const saved = object(state().tonina);
    const audio = root.querySelector('audio');
    const notes = root.querySelector('[data-listening-notes]');
    const speed = root.querySelector('[data-listening-speed]');
    let localAudio = null;
    let preparing = null;
    notes.value = typeof saved.notes === 'string' ? saved.notes : '';
    speed.value = ['0.75', '1'].includes(saved.speed) ? saved.speed : '1';
    audio.playbackRate = Number(speed.value);
    const remember = () => save('tonina', { notes: notes.value, speed: speed.value, position: audio.currentTime });
    notes.addEventListener('input', remember);
    speed.addEventListener('change', () => { audio.playbackRate = Number(speed.value); remember(); });
    audio.addEventListener('pause', remember);
    audio.addEventListener('ended', remember);
    async function seek(position) {
      // Some static preview servers cannot serve byte ranges; a local blob keeps seeking usable.
      if (!audio.seekable.length || audio.seekable.end(audio.seekable.length - 1) === 0) {
        if (!preparing) preparing = (async () => {
          const response = await fetch(audio.currentSrc || audio.querySelector('source').src);
          if (!response.ok) throw new Error('The recording could not be prepared.');
          localAudio = URL.createObjectURL(await response.blob());
          const ready = new Promise((resolve, reject) => {
            audio.addEventListener('loadedmetadata', resolve, { once: true });
            audio.addEventListener('error', () => reject(new Error('The recording could not be opened.')), { once: true });
          });
          audio.src = localAudio;
          audio.load();
          await ready;
          audio.playbackRate = Number(speed.value);
        })();
        await preparing;
      }
      audio.currentTime = position;
      remember();
    }
    const restorePosition = () => {
      if (Number.isFinite(saved.position) && saved.position > 0 && saved.position < audio.duration) {
        seek(saved.position).catch(error => text(root, '[data-practice-error]', error.message));
      }
    };
    if (audio.readyState >= 1) restorePosition();
    else audio.addEventListener('loadedmetadata', restorePosition, { once: true });
    audio.addEventListener('error', () => text(root, '[data-listening-status]', 'The recording could not be loaded.'));
    root.querySelectorAll('[data-listening-seek]').forEach(button => button.addEventListener('click', async () => {
      try { await seek(Number(button.dataset.listeningSeek)); }
      catch (error) { text(root, '[data-practice-error]', error.message); }
      audio.focus();
    }));
    window.addEventListener('pagehide', event => {
      remember();
      if (!event.persisted && localAudio) URL.revokeObjectURL(localAudio);
    });
    await window.renderExampleBanksFromData({
      dataUrl: root.dataset.contentSrc, groupAttribute: 'data-listening-bank',
      sourcePage: 'daily_problems.html#tonina-listening', reviewPrefix: 'tonina-listening', numbered: false,
      individualReviewGroups: [], groupViews: { 'tonina-listening-questions': { presentation: 'reading' } }
    });
  }

  async function mixed(root) {
    const banks = await Promise.all(['gender_agreement_exercises.json', 'food_cafe_exercises.json', 'everyday_scenarios_exercises.json'].map(file => load('./assets/data/' + file)));
    const pool = banks.flatMap((bank, bankIndex) => bank.sets.flatMap(set => set.items.map(item => ({
      ...item, id: `${set.id}--${item.id}`, origin: { setId: set.id, itemId: item.id },
      sourcePage: item.sourcePage || set.sourcePage || bank.page || 'gender_agreement.html',
      skill: bankIndex === 0 ? 'gender' : /cafe|coffee|counter/.test(set.id) ? 'coffee' : 'shopping',
      assessmentMode: ['fill-blank', 'order-words'].includes(item.type) ? 'production' : 'recognition'
    }))));
    const history = () => object(state().mixedHistory);
    const panel = root.querySelector('[data-mixed-exercise]');
    const mode = root.querySelector('[data-mixed-mode]');
    const start = root.querySelector('[data-mixed-start]');
    let active = null;
    let finished = true;
    guardSubmission(panel);
    const matches = (entry, item) => entry.itemId === item.id || (entry.setId === item.origin.setId && entry.itemId === item.origin.itemId);
    const weak = item => window.MaltiMistakeStore.getOpen().some(entry => matches(entry, item));
    function statistics() {
      const all = Object.values(history());
      for (const name of ['recognition', 'production']) {
        const entries = all.filter(item => item.mode === name);
        const attempts = entries.reduce((sum, item) => sum + (item.attempts || 0), 0);
        const correct = entries.reduce((sum, item) => sum + (item.correct || 0), 0);
        text(root, `[data-mixed-${name}]`, `${name === 'recognition' ? 'Recognition' : 'Production'}: ${correct} / ${attempts} correct across ${entries.length} practised items`);
      }
      const due = all.filter(item => Number.isFinite(Date.parse(item.dueAt)) && Date.parse(item.dueAt) <= Date.now()).length;
      text(root, '[data-mixed-due]', `${due} items due for another mixed session`);
    }
    function renderSession(session) {
      const items = session.ids.map(id => pool.find(item => item.id === id)).filter(Boolean);
      if (!items.length) return;
      active = { ...session, items };
      mode.value = session.mode;
      finished = false;
      panel.hidden = false;
      const weakCount = items.filter(weak).length;
      text(root, '[data-mixed-status]', `${items.length} tasks · ${weakCount} from open mistakes · ${session.mode}`);
      window.MaltiExerciseRunner.render(panel, {
        id: `everyday-mixed-${session.mode}`, title: session.mode === 'production' ? 'Write and build' : 'Recognise and choose',
        passPercent: 80, items
      });
      start.textContent = 'New selection';
    }
    start.addEventListener('click', () => {
      if (active && !finished && !window.confirm('Replace this unfinished mixed session?')) return;
      const records = history();
      const now = Date.now();
      const rank = item => {
        const previous = records[item.id];
        return weak(item) ? 0 : previous && Date.parse(previous.dueAt) <= now ? 1 : !previous ? 2 : 3;
      };
      const items = ['gender', 'shopping', 'coffee'].flatMap(skill => pool.filter(item => item.skill === skill && item.assessmentMode === mode.value)
        .sort((a, b) => rank(a) - rank(b) || (records[a.id]?.attempts || 0) - (records[b.id]?.attempts || 0) || a.id.localeCompare(b.id)).slice(0, 2));
      const session = { mode: mode.value, ids: items.map(item => item.id) };
      save('mixedSession', session);
      renderSession(session);
      panel.querySelector('h3').tabIndex = -1;
      panel.querySelector('h3').focus();
    });
    window.addEventListener('malti-exercise-complete', event => {
      if (!active || event.detail.setId !== `everyday-mixed-${active.mode}`) return;
      const records = history();
      for (const result of event.detail.results) {
        const item = active.items.find(item => item.id === result.itemId);
        if (!item) continue;
        const old = object(records[item.id]);
        const streak = result.correct ? (old.streak || 0) + 1 : 0;
        records[item.id] = {
          mode: active.mode, attempts: (old.attempts || 0) + 1, correct: (old.correct || 0) + Number(result.correct), streak,
          dueAt: new Date(Date.now() + (result.correct ? Math.min(14, 3 * streak) : 1) * 86400000).toISOString()
        };
        if (result.correct) {
          const source = window.MaltiMistakeStore.getOpen().find(entry => entry.setId === item.origin.setId && entry.itemId === item.origin.itemId);
          if (source) window.MaltiMistakeStore.recordAttempt(source, true);
        }
      }
      finished = true;
      save('mixedHistory', records);
      save('mixedSession', null);
      start.textContent = 'Next session';
      statistics();
    });
    statistics();
    const pending = object(state().mixedSession);
    if (['recognition', 'production'].includes(pending.mode) && Array.isArray(pending.ids)) renderSession(pending);
    start.disabled = false;
  }

  const mount = (selector, initialize) => document.querySelectorAll(selector).forEach(root => {
    initialize(root).catch(error => {
      const status = root.querySelector('[data-practice-error]');
      if (status) status.textContent = error.message;
      console.error(error);
    });
  });
  mount('[data-guided-scenario]', guided);
  mount('[data-open-recall]', recall);
  mount('[data-tonina-listening]', listening);
  mount('[data-mixed-practice]', mixed);
})();
