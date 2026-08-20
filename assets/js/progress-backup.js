(() => {
  if (window.MaltiProgressBackup) return;

  const storage = window.MaltiStorage;
  const FORMAT = "malti-progress-backup-v2";
  const LEGACY_FORMAT = "malti-progress-backup-v1";
  const keyRules = {
    malti_review_cards_v2: "object",
    "malti-review-prefs-v1": "object",
    malti_word_search_seen_words_v1: "array",
    malti_word_search_best_times_v1: "object",
    malti_word_search_sound_v1: "string",
    malti_memory_game_seen_words_v1: "array",
    malti_word_builder_seen_words_v1: "array",
    malti_vocabulary_games_sound_v1: "string",
    malti_course_progress_v1: "object",
    malti_exercise_progress_v1: "object",
    malti_course_target_progress_v1: "object",
    malti_comprehensive_coverage_v1: "object",
    malti_mistake_journal_v1: "object",
    malti_today_minutes_v1: "string",
    malti_site_theme: "string",
    animalsCompactMode: "string",
    homeCompactMode: "string",
    transportCompactMode: "string"
  };
  const keys = Object.keys(keyRules);

  const checksum = (data) => {
    const input = JSON.stringify(data);
    let hash = 0x811c9dc5;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  };

  const validateRawValue = (key, raw) => {
    if (typeof raw !== "string") {
      throw new Error(`Progress value for ${key} must be a string.`);
    }
    if (raw.length > 5 * 1024 * 1024) {
      throw new Error(`Progress value for ${key} is too large.`);
    }

    const expected = keyRules[key];
    if (expected === "string") return;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(`Progress value for ${key} is not valid JSON.`);
    }

    if (expected === "array" && !Array.isArray(parsed)) {
      throw new Error(`Progress value for ${key} must contain an array.`);
    }
    if (expected === "object" && (!parsed || typeof parsed !== "object" || Array.isArray(parsed))) {
      throw new Error(`Progress value for ${key} must contain an object.`);
    }
  };

  const exportBackup = () => {
    const data = {};
    keys.forEach((key) => {
      const value = storage.getString(key, null);
      if (value !== null) data[key] = value;
    });

    const payload = {
      format: FORMAT,
      schemaVersion: storage.SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data
    };
    payload.checksum = checksum(payload.data);
    return payload;
  };

  const previewBackup = (payload) => {
    if (!payload || ![FORMAT, LEGACY_FORMAT].includes(payload.format) || !payload.data || typeof payload.data !== "object") {
      throw new Error("This is not a supported Maltese study progress backup.");
    }
    const entries = Object.entries(payload.data);
    entries.forEach(([key, value]) => {
      if (!Object.prototype.hasOwnProperty.call(keyRules, key)) {
        throw new Error(`Unknown progress key: ${key}`);
      }
      validateRawValue(key, value);
    });
    if (payload.format === FORMAT && payload.checksum !== checksum(payload.data)) {
      throw new Error("The progress backup checksum does not match its contents.");
    }
    return {
      format: payload.format,
      exportedAt: payload.exportedAt || null,
      importedKeys: entries.length,
      legacy: payload.format === LEGACY_FORMAT,
      schemaVersion: payload.schemaVersion || 1
    };
  };

  const importBackup = (payload, options = {}) => {
    const preview = previewBackup(payload);
    const entries = Object.entries(payload.data);

    if (options.mode !== "merge") {
      keys.forEach((key) => storage.remove(key));
    }
    entries.forEach(([key, value]) => storage.setString(key, value));
    storage.initializeSchema();
    window.dispatchEvent(new CustomEvent("malti-progress-change"));

    return { ...preview, importedKeys: entries.length };
  };

  const clearAll = () => {
    keys.forEach((key) => storage.remove(key));
    window.dispatchEvent(new CustomEvent("malti-progress-change"));
  };

  window.MaltiProgressBackup = {
    FORMAT,
    LEGACY_FORMAT,
    clearAll,
    exportBackup,
    importBackup,
    previewBackup,
    keys: keys.slice()
  };
})();
