(() => {
  const storage = window.MaltiStorage;

  const create = ({ storageKey, label, itemLabel = "word" }) => {
    let seen = new Set();

    const read = () => {
      const parsed = storage.getJson(storageKey, []);
      seen = new Set(Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : []);
      updateLabel();
      return seen;
    };

    const write = () => {
      storage.setJson(storageKey, [...seen]);
      updateLabel();
    };

    const count = () => seen.size;
    const has = (key) => seen.has(key);

    const add = (key) => {
      if (!key) return;
      seen.add(key);
      write();
    };

    const reset = () => {
      seen.clear();
      write();
    };

    const updateLabel = () => {
      if (!label) return;
      const size = count();
      label.textContent = `${size} seen ${size === 1 ? itemLabel : `${itemLabel}s`} excluded.`;
    };

    const filterCandidates = (candidates, targetCount, keyFn) => {
      const fresh = candidates.filter((entry) => !has(keyFn(entry)));
      const old = candidates.filter((entry) => has(keyFn(entry)));
      return {
        candidates: fresh.length >= targetCount ? fresh : fresh.concat(old),
        usedSeen: fresh.length < targetCount && old.length > 0
      };
    };

    read();

    return {
      add,
      count,
      filterCandidates,
      has,
      read,
      reset,
      updateLabel,
      write
    };
  };

  window.MaltiSeenWords = { create };
})();
