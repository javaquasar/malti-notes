const assert = require("assert");
const core = require("../assets/js/cloud-sync-core.js");

const raw = (value) => JSON.stringify(value);
const section = (value, deleted = false) => ({
  value: deleted ? "" : value,
  checksum: deleted ? null : core.checksum(value),
  deleted
});
const plan = ({ local = {}, remote = {}, meta = {}, keys = ["progress"] }) => core.buildPlan({
  keys,
  localData: local,
  remoteDocs: remote,
  sectionMeta: meta
});

const localOnly = plan({ local: { progress: raw({ score: 2 }) } });
assert.deepStrictEqual(localOnly.upload.map((item) => item.key), ["progress"]);

const remoteOnlyValue = raw({ score: 3 });
const remoteOnly = plan({ remote: { progress: section(remoteOnlyValue) } });
assert.deepStrictEqual(remoteOnly.download.map((item) => item.key), ["progress"]);

const base = raw({ score: 1 });
const localChanged = raw({ score: 2 });
const localWinsPlan = plan({
  local: { progress: localChanged },
  remote: { progress: section(base) },
  meta: { progress: { lastSyncedChecksum: core.checksum(base), dirty: true } }
});
assert.strictEqual(localWinsPlan.upload.length, 1);

const cloudChanged = raw({ score: 4 });
const cloudWinsPlan = plan({
  local: { progress: base },
  remote: { progress: section(cloudChanged) },
  meta: { progress: { lastSyncedChecksum: core.checksum(base), dirty: false } }
});
assert.strictEqual(cloudWinsPlan.download.length, 1);

const conflictPlan = plan({
  local: { progress: localChanged },
  remote: { progress: section(cloudChanged) },
  meta: { progress: { lastSyncedChecksum: core.checksum(base), dirty: true } }
});
assert.strictEqual(conflictPlan.conflicts.length, 1);

const deletionPlan = plan({
  remote: { progress: section(base) },
  meta: { progress: { lastSyncedChecksum: core.checksum(base), dirty: true } }
});
assert.strictEqual(deletionPlan.upload.length, 1);
assert.strictEqual(deletionPlan.upload[0].localValue, null);

const mergedSeen = JSON.parse(core.mergeRaw(
  "malti_word_search_seen_words_v1",
  raw(["kelb", "qattus"]),
  raw(["qattus", "għasfur"])
));
assert.deepStrictEqual(mergedSeen, ["kelb", "qattus", "għasfur"]);

const mergedTimes = JSON.parse(core.mergeRaw(
  "malti_word_search_best_times_v1",
  raw({ animals: 42, food: 55 }),
  raw({ animals: 37, travel: 61 })
));
assert.deepStrictEqual(mergedTimes, { animals: 37, food: 55, travel: 61 });

const mergedProgress = JSON.parse(core.mergeRaw(
  "malti_exercise_progress_v1",
  raw({ lesson: { attempts: 2, bestScore: 3, updatedAt: "2026-01-01T10:00:00.000Z" } }),
  raw({ lesson: { attempts: 4, bestScore: 2, updatedAt: "2026-01-02T10:00:00.000Z" } })
));
assert.strictEqual(mergedProgress.lesson.attempts, 4);
assert.strictEqual(mergedProgress.lesson.bestScore, 3);
assert.strictEqual(mergedProgress.lesson.updatedAt, "2026-01-02T10:00:00.000Z");

console.log("Cloud sync reconciliation passed (upload, download, delete, conflict, and merge policies).");
