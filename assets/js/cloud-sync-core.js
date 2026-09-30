(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MaltiCloudSyncCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const fnv1a = (value) => {
    const input = String(value ?? "");
    let hash = 0x811c9dc5;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  };

  const checksum = (value) => value === null || value === undefined ? null : fnv1a(value);

  const normalizeRemoteDoc = (entry) => {
    if (!entry) return null;
    if (entry.deleted === true) return { ...entry, value: null, checksum: null };
    if (typeof entry.value !== "string") return null;
    return { ...entry, checksum: entry.checksum || checksum(entry.value) };
  };

  const buildPlan = ({ keys, localData, remoteDocs, sectionMeta }) => {
    const plan = { upload: [], download: [], conflicts: [], unchanged: [] };

    keys.forEach((key) => {
      const localValue = Object.prototype.hasOwnProperty.call(localData, key) ? localData[key] : null;
      const remoteDoc = normalizeRemoteDoc(remoteDocs[key]);
      const remoteValue = remoteDoc?.value ?? null;
      const localChecksum = checksum(localValue);
      const remoteChecksum = checksum(remoteValue);
      const meta = sectionMeta[key] || {};
      const baseChecksum = meta.lastSyncedChecksum ?? null;
      const dirty = meta.dirty === true || localChecksum !== baseChecksum;
      const details = { key, localValue, remoteDoc, localChecksum, remoteChecksum, baseChecksum };

      if (localChecksum === remoteChecksum) {
        plan.unchanged.push(details);
      } else if (dirty && baseChecksum === remoteChecksum) {
        plan.upload.push(details);
      } else if (!dirty) {
        plan.download.push(details);
      } else {
        plan.conflicts.push(details);
      }
    });

    return plan;
  };

  const timestampFor = (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return 0;
    return ["updatedAt", "lastAttemptAt", "lastReviewedAt", "lastSeenAt", "resolvedAt", "addedAt"]
      .map((key) => Date.parse(value[key] || ""))
      .filter(Number.isFinite)
      .reduce((latest, timestamp) => Math.max(latest, timestamp), 0);
  };

  const mergeArrays = (localValue, remoteValue) => {
    const seen = new Set();
    return [...localValue, ...remoteValue].filter((value) => {
      const signature = typeof value === "object" ? JSON.stringify(value) : `${typeof value}:${String(value)}`;
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  };

  const mergeNode = (localValue, remoteValue, preferred = "local") => {
    if (localValue === undefined) return remoteValue;
    if (remoteValue === undefined) return localValue;
    if (Array.isArray(localValue) && Array.isArray(remoteValue)) return mergeArrays(localValue, remoteValue);

    const localObject = localValue && typeof localValue === "object" && !Array.isArray(localValue);
    const remoteObject = remoteValue && typeof remoteValue === "object" && !Array.isArray(remoteValue);
    if (localObject && remoteObject) {
      const localTimestamp = timestampFor(localValue);
      const remoteTimestamp = timestampFor(remoteValue);
      const nextPreferred = remoteTimestamp > localTimestamp ? "remote" : (localTimestamp > remoteTimestamp ? "local" : preferred);
      return Object.fromEntries([...new Set([...Object.keys(localValue), ...Object.keys(remoteValue)])].map((key) => [
        key,
        mergeNode(localValue[key], remoteValue[key], nextPreferred)
      ]));
    }

    if (typeof localValue === "boolean" && typeof remoteValue === "boolean") return localValue || remoteValue;
    if (typeof localValue === "number" && typeof remoteValue === "number") return Math.max(localValue, remoteValue);
    if (typeof localValue === "string" && typeof remoteValue === "string") {
      const localDate = Date.parse(localValue);
      const remoteDate = Date.parse(remoteValue);
      if (Number.isFinite(localDate) && Number.isFinite(remoteDate)) return localDate >= remoteDate ? localValue : remoteValue;
    }
    return preferred === "remote" ? remoteValue : localValue;
  };

  const mergeBestTimes = (localValue, remoteValue) => Object.fromEntries(
    [...new Set([...Object.keys(localValue || {}), ...Object.keys(remoteValue || {})])].map((key) => {
      const values = [localValue?.[key], remoteValue?.[key]].filter((value) => Number.isFinite(value));
      return [key, values.length ? Math.min(...values) : (localValue?.[key] ?? remoteValue?.[key])];
    })
  );

  const localPreferenceKeys = new Set([
    "malti-review-prefs-v1",
    "malti_word_search_sound_v1",
    "malti_vocabulary_games_sound_v1",
    "malti_today_minutes_v1",
    "malti_site_theme",
    "animalsCompactMode",
    "homeCompactMode",
    "transportCompactMode"
  ]);

  const mergeRaw = (key, localRaw, remoteRaw) => {
    if (localRaw === null || localRaw === undefined) return remoteRaw;
    if (remoteRaw === null || remoteRaw === undefined) return localRaw;
    if (localPreferenceKeys.has(key)) return localRaw;

    let localValue;
    let remoteValue;
    try {
      localValue = JSON.parse(localRaw);
      remoteValue = JSON.parse(remoteRaw);
    } catch (error) {
      return localRaw;
    }

    const merged = key === "malti_word_search_best_times_v1"
      ? mergeBestTimes(localValue, remoteValue)
      : mergeNode(localValue, remoteValue);
    return JSON.stringify(merged);
  };

  return { buildPlan, checksum, fnv1a, mergeRaw, normalizeRemoteDoc };
});
