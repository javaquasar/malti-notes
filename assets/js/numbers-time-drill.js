(() => {
  const root = document.querySelector("[data-number-time-drill]");
  if (!root || !window.MaltiStorage) return;

  const STORAGE_KEY = "malti_numbers_time_drill_v1";
  const DATA_URL = "./assets/data/numbers_time_drills.json";
  const storage = window.MaltiStorage;
  const modeButtons = Array.from(root.querySelectorAll("[data-drill-mode]"));
  const direction = root.querySelector("[data-drill-direction]");
  const challenge = root.querySelector("[data-drill-challenge]");
  const form = root.querySelector("[data-drill-form]");
  const input = root.querySelector("[data-drill-answer]");
  const checkButton = root.querySelector("[data-drill-check]");
  const nextButton = root.querySelector("[data-drill-next]");
  const feedback = root.querySelector("[data-drill-feedback]");
  const seen = root.querySelector("[data-drill-seen]");
  const accuracy = root.querySelector("[data-drill-accuracy]");
  let pools = { numbers: [], clock: [] };
  let current = null;
  let state = null;

  const normalize = (value) => String(value || "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/[\u2018\u2019\u00b4`]/g, "'")
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ");

  const loadState = () => {
    const stored = storage.getJson(STORAGE_KEY, {});
    return {
      activeMode: stored.activeMode === "clock" ? "clock" : "numbers",
      numbers: stored.numbers && typeof stored.numbers === "object" ? stored.numbers : { results: {} },
      clock: stored.clock && typeof stored.clock === "object" ? stored.clock : { results: {} },
      updatedAt: stored.updatedAt || null
    };
  };

  const saveState = () => {
    state.updatedAt = new Date().toISOString();
    storage.setJson(STORAGE_KEY, state);
  };

  const numberForms = (data) => {
    const known = new Map(data.numbers.forms.map((item) => [item.value, item.maltese]));
    const forms = [];
    for (let value = data.numbers.minimum; value <= data.numbers.maximum; value += 1) {
      const direct = known.get(value);
      const unit = value % 10;
      const ten = value - unit;
      const maltese = direct || `${known.get(unit)} u ${known.get(ten)}`;
      forms.push({ value, maltese });
    }
    return forms;
  };

  const clockForms = (data) => {
    const hours = new Map(data.clock.hours.map((item) => [item.value, item.maltese]));
    const forms = [];
    data.clock.hours.forEach((hour) => {
      data.clock.pastMinutes.forEach((minute) => {
        forms.push({
          value: `${hour.value}:${String(minute.value).padStart(2, "0")}`,
          maltese: minute.value ? `${hour.maltese} u ${minute.maltese}` : hour.maltese
        });
      });
      if (hours.has(hour.value + 1)) {
        data.clock.toMinutes.forEach((minute) => forms.push({
          value: `${hour.value}:${String(minute.value).padStart(2, "0")}`,
          maltese: `${hours.get(hour.value + 1)} neqsin ${minute.maltese}`
        }));
      }
    });
    return forms;
  };

  const makeChallenges = (mode, forms) => forms.flatMap((item) => [
    {
      id: `${mode}-${item.value}-to-maltese`,
      mode,
      direction: mode === "numbers" ? "Write this number in Maltese" : "Write this time in Maltese",
      prompt: String(item.value),
      answer: item.maltese,
      accepted: mode === "clock"
        ? [item.maltese, `hija ${item.maltese}`, `huwa ${item.maltese}`, `huma ${item.maltese}`]
        : [item.maltese]
    },
    {
      id: `${mode}-${item.value}-from-maltese`,
      mode,
      direction: mode === "numbers" ? "Write this value in digits" : "Write this time in digits",
      prompt: item.maltese,
      answer: String(item.value),
      accepted: [String(item.value)]
    }
  ]);

  const modeState = (mode) => {
    state[mode].results = state[mode].results && typeof state[mode].results === "object"
      ? state[mode].results
      : {};
    return state[mode];
  };

  const updateStats = () => {
    const mode = state.activeMode;
    const results = modeState(mode).results;
    const answered = Object.values(results).filter((item) => item.attempts > 0);
    const attempts = answered.reduce((total, item) => total + item.attempts, 0);
    const correct = answered.reduce((total, item) => total + item.correct, 0);
    seen.textContent = `${answered.length} / ${pools[mode].length} answered`;
    accuracy.textContent = attempts ? `${Math.round((correct / attempts) * 100)}% correct` : "No answers yet";
  };

  const pickChallenge = () => {
    const mode = state.activeMode;
    const progress = modeState(mode);
    const pool = pools[mode];
    const attemptsFor = (item) => progress.results[item.id]?.attempts || 0;
    const minimumAttempts = Math.min(...pool.map(attemptsFor));
    let candidates = pool.filter((item) => attemptsFor(item) === minimumAttempts && item.id !== progress.lastShown);
    if (!candidates.length) candidates = pool.filter((item) => attemptsFor(item) === minimumAttempts);
    current = candidates[Math.floor(Math.random() * candidates.length)];
    progress.lastShown = current.id;
    saveState();
  };

  const renderChallenge = () => {
    pickChallenge();
    direction.textContent = current.direction;
    challenge.textContent = current.prompt;
    input.value = "";
    input.disabled = false;
    checkButton.hidden = false;
    nextButton.hidden = true;
    feedback.hidden = true;
    feedback.dataset.state = "";
    feedback.textContent = "";
    modeButtons.forEach((button) => {
      const active = button.dataset.drillMode === state.activeMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    updateStats();
    input.focus({ preventScroll: true });
  };

  const recordMistake = (correct, given) => {
    window.MaltiMistakeStore?.recordAttempt({
      id: `numbers-time::${current.id}`,
      setId: `numbers-time-${current.mode}`,
      itemId: current.id,
      prompt: `${current.direction}: ${current.prompt}`,
      given,
      correctAnswer: current.answer,
      explanation: "Review the matching number or clock pattern on the topic page.",
      sourcePage: "numbers_calendar_time.html#self-test",
      topic: current.mode === "numbers" ? "Number drill" : "Clock drill",
      type: "fill-blank",
      category: "numbers-time"
    }, correct);
  };

  const checkAnswer = () => {
    const given = input.value;
    const correct = current.accepted.some((answer) => normalize(answer) === normalize(given));
    const progress = modeState(current.mode);
    const previous = progress.results[current.id] || { attempts: 0, correct: 0 };
    progress.results[current.id] = {
      attempts: previous.attempts + 1,
      correct: previous.correct + (correct ? 1 : 0),
      lastResult: correct ? "correct" : "incorrect",
      lastAttemptAt: new Date().toISOString()
    };
    saveState();
    recordMistake(correct, given);
    input.disabled = true;
    checkButton.hidden = true;
    nextButton.hidden = false;
    feedback.hidden = false;
    feedback.dataset.state = correct ? "correct" : "incorrect";
    feedback.textContent = correct ? "Correct." : `Correct answer: ${current.answer}`;
    updateStats();
    nextButton.focus({ preventScroll: true });
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!input.disabled) checkAnswer();
  });
  nextButton.addEventListener("click", renderChallenge);
  modeButtons.forEach((button) => button.addEventListener("click", () => {
    if (state.activeMode === button.dataset.drillMode) return;
    state.activeMode = button.dataset.drillMode;
    renderChallenge();
  }));

  fetch(DATA_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`Could not load number and time drills (${response.status})`);
      return response.json();
    })
    .then((data) => {
      pools = {
        numbers: makeChallenges("numbers", numberForms(data)),
        clock: makeChallenges("clock", clockForms(data))
      };
      state = loadState();
      root.dataset.drillReady = "true";
      window.MaltiNumbersTimeDrill = {
        getCurrent: () => current ? { ...current } : null,
        getPoolSizes: () => ({ numbers: pools.numbers.length, clock: pools.clock.length })
      };
      renderChallenge();
    })
    .catch((error) => {
      feedback.hidden = false;
      feedback.dataset.state = "incorrect";
      feedback.textContent = "The drill could not be loaded.";
      console.error(error);
    });
})();
