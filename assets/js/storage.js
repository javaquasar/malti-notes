(() => {
  if (window.MaltiStorage) {
    return;
  }

  const memory = new Map();
  const META_KEY = "malti_storage_meta_v1";
  const SCHEMA_VERSION = 2;

  const readRaw = (key) => {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? memory.get(key) ?? null : value;
    } catch (error) {
      return memory.get(key) ?? null;
    }
  };

  const writeRaw = (key, value) => {
    const text = String(value);
    memory.set(key, text);

    try {
      window.localStorage.setItem(key, text);
      return true;
    } catch (error) {
      return false;
    }
  };

  const remove = (key) => {
    memory.delete(key);

    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      // In-memory fallback has already been cleared.
    }
  };

  const getString = (key, fallback = null) => {
    const value = readRaw(key);
    return value === null || value === undefined ? fallback : value;
  };

  const setString = (key, value) => writeRaw(key, value);

  const getJson = (key, fallback) => {
    const raw = readRaw(key);

    if (!raw) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(raw);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (error) {
      return fallback;
    }
  };

  const setJson = (key, value) => writeRaw(key, JSON.stringify(value));

  const initializeSchema = () => {
    const current = getJson(META_KEY, null);
    const previousVersion = Number.isInteger(current?.schemaVersion) ? current.schemaVersion : 0;
    if (previousVersion >= SCHEMA_VERSION) return current;

    const next = {
      schemaVersion: SCHEMA_VERSION,
      previousVersion,
      migratedAt: new Date().toISOString()
    };
    setJson(META_KEY, next);
    return next;
  };

  window.MaltiStorage = {
    META_KEY,
    SCHEMA_VERSION,
    getJson,
    getString,
    getMeta: () => getJson(META_KEY, null),
    initializeSchema,
    remove,
    setJson,
    setString
  };

  initializeSchema();
})();
