(() => {
  const DATA_URL = "./assets/data/comprehensive_test_bank.json";
  const STORAGE_KEY = "malti_comprehensive_coverage_v1";
  const root = document.querySelector("[data-coverage-test-root]");
  if (!root) return;

  const stage = root.querySelector("[data-coverage-test-stage]");
  const categoryList = root.querySelector("[data-coverage-category-list]");
  const status = root.querySelector("[data-coverage-session-status]");
  const storage = window.MaltiStorage;
  const labels = {
    grammar: "Grammar rules",
    pronouns: "Pronouns",
    verbs: "Verb forms",
    "numbers-time": "Numbers and time",
    adjectives: "Adjectives",
    vocabulary: "Vocabulary and phrases"
  };
  let data = null;
  let currentSession = null;
  let scope = "All";
  let size = 20;

  const hash = (value) => Array.from(String(value)).reduce(
    (total, character) => Math.imul(total ^ character.charCodeAt(0), 16777619) >>> 0,
    2166136261
  );

  const loadState = () => {
    const saved = storage?.getJson(STORAGE_KEY, {});
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return { schemaVersion: 1, counter: 0, targets: {}, lastSessionIds: [] };
    return {
      schemaVersion: 1,
      counter: Number.isInteger(saved.counter) ? saved.counter : 0,
      targets: saved.targets && typeof saved.targets === "object" && !Array.isArray(saved.targets) ? saved.targets : {},
      lastSessionIds: Array.isArray(saved.lastSessionIds) ? saved.lastSessionIds : []
    };
  };

  let progress = loadState();
  const saveState = () => storage?.setJson(STORAGE_KEY, progress);
  const selectedCategories = () => new Set(Array.from(categoryList.querySelectorAll("input:checked")).map((input) => input.value));
  const eligibleTargets = () => {
    const categories = selectedCategories();
    return data.targets.filter((target) => (scope === "All" || target.level === scope) && categories.has(target.category));
  };

  const modeRecord = (targetId, mode) => progress.targets[targetId]?.modes?.[mode] || { attempts: 0, correct: 0 };
  const chooseMode = (target, counter) => {
    const recognition = modeRecord(target.id, "recognition");
    const production = modeRecord(target.id, "production");
    if (!recognition.attempts && !production.attempts) return (hash(target.id) + counter) % 2 ? "recognition" : "production";
    if (!recognition.attempts) return "recognition";
    if (!production.attempts) return "production";
    if (recognition.attempts !== production.attempts) return recognition.attempts < production.attempts ? "recognition" : "production";
    return (hash(target.id) + counter) % 2 ? "recognition" : "production";
  };

  const priorityFor = (target) => {
    const recognition = modeRecord(target.id, "recognition");
    const production = modeRecord(target.id, "production");
    const attemptedModes = Number(recognition.attempts > 0) + Number(production.attempts > 0);
    return attemptedModes * 100000 + recognition.attempts + production.attempts;
  };

  const seededOrder = (targets, seed) => targets.slice().sort((left, right) => {
    const priority = priorityFor(left) - priorityFor(right);
    return priority || hash(`${seed}:${left.id}`) - hash(`${seed}:${right.id}`);
  });

  const shuffledChoices = (item, seed) => {
    if (item.type !== "multiple-choice") return item;
    return {
      ...item,
      choices: item.choices.slice().sort((left, right) => hash(`${seed}:${left}`) - hash(`${seed}:${right}`))
    };
  };

  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = String(value);
  };

  const updateProgressSummary = () => {
    if (!data) return;
    const eligible = eligibleTargets();
    let started = 0;
    let complete = 0;
    let mastered = 0;
    let attemptedModes = 0;
    eligible.forEach((target) => {
      const recognition = modeRecord(target.id, "recognition");
      const production = modeRecord(target.id, "production");
      const modes = Number(recognition.attempts > 0) + Number(production.attempts > 0);
      attemptedModes += modes;
      if (modes) started += 1;
      if (modes === 2) complete += 1;
      if (recognition.correct > 0 && production.correct > 0) mastered += 1;
    });
    const percent = eligible.length ? Math.round(attemptedModes / (eligible.length * 2) * 100) : 0;
    setText("[data-coverage-available]", eligible.length);
    setText("[data-coverage-started]", started);
    setText("[data-coverage-complete]", complete);
    setText("[data-coverage-mastered]", mastered);
    setText("[data-coverage-percent]", `${percent}%`);
    const fill = document.querySelector("[data-coverage-progress-fill]");
    if (fill) fill.style.setProperty("--course-progress", `${percent}%`);
  };

  const createSession = () => {
    const eligible = eligibleTargets();
    if (!eligible.length) {
      currentSession = null;
      stage.replaceChildren();
      status.textContent = "Select at least one category with available targets.";
      updateProgressSummary();
      return;
    }

    progress.counter += 1;
    const seed = `${Date.now()}:${progress.counter}`;
    const lastIds = new Set(progress.lastSessionIds);
    const freshPool = eligible.length - lastIds.size >= Math.min(size, eligible.length)
      ? eligible.filter((target) => !lastIds.has(target.id))
      : eligible;
    const selected = seededOrder(freshPool, seed).slice(0, Math.min(size, freshPool.length));
    const items = selected.map((target) => {
      const mode = chooseMode(target, progress.counter);
      return shuffledChoices({ ...target.items[mode] }, seed);
    });
    currentSession = {
      id: `comprehensive-session-${progress.counter}`,
      title: `Coverage Test ${progress.counter}`,
      category: "coverage",
      passPercent: 70,
      items,
      targetIds: selected.map((target) => target.id),
      categories: selected.map((target) => target.category)
    };
    progress.lastSessionIds = currentSession.targetIds.slice();
    saveState();
    stage.replaceChildren();
    window.MaltiExerciseRunner.render(stage, currentSession);
    const unseenCount = selected.filter((target) => priorityFor(target) === 0).length;
    status.textContent = `${items.length} fresh questions ready. ${unseenCount} targets have not been tested before.`;
    updateProgressSummary();
  };

  const renderCategories = () => {
    categoryList.replaceChildren();
    Object.entries(labels).forEach(([category, label]) => {
      const wrapper = document.createElement("label");
      const input = document.createElement("input");
      const copy = document.createElement("span");
      input.type = "checkbox";
      input.value = category;
      input.checked = true;
      copy.innerHTML = `<strong>${label}</strong><small>${data.categoryCounts[category] || 0} targets</small>`;
      wrapper.className = "coverage-category-option";
      wrapper.append(input, copy);
      input.addEventListener("change", () => {
        if (!categoryList.querySelector("input:checked")) input.checked = true;
        createSession();
      });
      categoryList.appendChild(wrapper);
    });
  };

  const bindSegmentedControl = (selector, dataKey, onSelect) => {
    root.querySelectorAll(`${selector} button`).forEach((button) => button.addEventListener("click", () => {
      root.querySelectorAll(`${selector} button`).forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
      onSelect(button.dataset[dataKey]);
      createSession();
    }));
  };

  const recordSession = (results) => {
    results.forEach((result) => {
      (result.coverageIds || []).forEach((targetId) => {
        const target = progress.targets[targetId] || { modes: {} };
        const mode = result.assessmentMode === "production" ? "production" : "recognition";
        const previous = target.modes[mode] || { attempts: 0, correct: 0 };
        target.modes[mode] = {
          attempts: previous.attempts + 1,
          correct: previous.correct + Number(result.correct),
          lastResult: result.correct ? "correct" : "incorrect",
          updatedAt: new Date().toISOString()
        };
        target.lastSeenAt = new Date().toISOString();
        progress.targets[targetId] = target;
      });
    });
    saveState();
    updateProgressSummary();
  };

  async function initialize() {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`Could not load coverage bank (${response.status})`);
    data = await response.json();
    setText("[data-coverage-total]", data.targetCount);
    setText("[data-coverage-modes]", data.modeCount);
    setText("[data-coverage-categories]", Object.keys(data.categoryCounts).length);
    renderCategories();
    bindSegmentedControl("[data-coverage-scope]", "scope", (value) => { scope = value; });
    bindSegmentedControl("[data-coverage-size]", "size", (value) => { size = Number(value); });
    root.querySelector("[data-coverage-new]").addEventListener("click", createSession);
    window.addEventListener("malti-exercise-complete", (event) => {
      if (currentSession && event.detail?.setId === currentSession.id) recordSession(event.detail.results || []);
    });
    createSession();
  }

  window.MaltiCoverageTest = {
    getCurrentSession: () => currentSession ? JSON.parse(JSON.stringify(currentSession)) : null,
    getProgress: () => JSON.parse(JSON.stringify(progress)),
    storageKey: STORAGE_KEY
  };

  initialize().catch((error) => {
    console.error(error);
    status.textContent = "Coverage tests could not be loaded.";
  });
})();
