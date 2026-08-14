(() => {
  if (window.MaltiMistakeStore) return;

  const STORAGE_KEY = "malti_mistake_journal_v1";
  const SCHEMA_VERSION = 2;
  const storage = window.MaltiStorage;
  const emptyState = () => ({ schemaVersion: SCHEMA_VERSION, entries: {} });

  function load() {
    const value = storage?.getJson(STORAGE_KEY, null);
    if (!value || typeof value !== "object" || Array.isArray(value.entries)) return emptyState();
    return {
      schemaVersion: SCHEMA_VERSION,
      entries: value.entries && typeof value.entries === "object"
        ? Object.fromEntries(Object.entries(value.entries).map(([id, entry]) => [id, {
          ...entry,
          category: entry.category || "general",
          ruleId: entry.ruleId || ""
        }]))
        : {}
    };
  }

  function save(state) {
    storage?.setJson(STORAGE_KEY, state);
    window.dispatchEvent(new CustomEvent("malti-mistake-journal"));
  }

  function recordAttempt(details, correct) {
    if (!details?.id) return null;
    const state = load();
    const previous = state.entries[details.id];
    if (correct && !previous) return null;
    const now = new Date().toISOString();
    const next = {
      ...(previous || {}),
      id: details.id,
      setId: details.setId || previous?.setId || "",
      itemId: details.itemId || previous?.itemId || "",
      prompt: details.prompt || previous?.prompt || "",
      given: correct ? (previous?.given || "") : String(details.given ?? ""),
      correctAnswer: details.correctAnswer || previous?.correctAnswer || "",
      explanation: details.explanation || previous?.explanation || "",
      targetIds: Array.isArray(details.targetIds) ? details.targetIds : (previous?.targetIds || []),
      sourcePage: details.sourcePage || previous?.sourcePage || "",
      topic: details.topic || previous?.topic || "Practice",
      type: details.type || previous?.type || "exercise",
      category: details.category || previous?.category || "general",
      ruleId: details.ruleId || previous?.ruleId || "",
      status: correct ? previous.status : "open",
      attempts: (previous?.attempts || 0) + 1,
      wrongCount: (previous?.wrongCount || 0) + (correct ? 0 : 1),
      correctStreak: correct ? (previous?.correctStreak || 0) + 1 : 0,
      firstWrongAt: previous?.firstWrongAt || now,
      lastAttemptAt: now,
      lastWrongAt: correct ? previous?.lastWrongAt : now,
      resolvedAt: previous?.resolvedAt || null
    };
    if (correct && next.correctStreak >= 2) {
      next.status = "resolved";
      next.resolvedAt = now;
    } else if (!correct) {
      next.resolvedAt = null;
    }
    state.entries[next.id] = next;
    save(state);
    return next;
  }

  function getAll() {
    return Object.values(load().entries).sort((left, right) => {
      if (left.status !== right.status) return left.status === "open" ? -1 : 1;
      return String(right.lastAttemptAt).localeCompare(String(left.lastAttemptAt));
    });
  }

  function removeResolved() {
    const state = load();
    Object.keys(state.entries).forEach((id) => {
      if (state.entries[id].status === "resolved") delete state.entries[id];
    });
    save(state);
  }

  window.MaltiMistakeStore = {
    getAll,
    getOpen: () => getAll().filter((entry) => entry.status === "open"),
    recordAttempt,
    removeResolved,
    storageKey: STORAGE_KEY
  };
})();
