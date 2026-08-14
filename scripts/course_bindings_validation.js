const fs = require("fs");
const path = require("path");

const allowedRoles = new Set(["core", "supporting", "extended"]);
const allowedStatuses = new Set(["implemented", "evidence-only", "missing"]);
const allowedTypes = new Set(["grammar", "phrase", "verb-form", "vocabulary"]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function collectContentIds(value, ids = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectContentIds(item, ids));
    return ids;
  }
  if (!isObject(value)) return ids;
  if (typeof value.id === "string") ids.add(value.id);
  if (typeof value.slug === "string") ids.add(value.slug);
  Object.values(value).forEach((item) => collectContentIds(item, ids));
  return ids;
}

function validateCourseBindings({ root, fail }) {
  const bindingFile = "assets/data/course_target_bindings.json";
  const inventoryFile = "assets/data/book_coverage_inventory.json";
  const courseFile = "assets/data/course_path.json";
  const exerciseFile = "assets/data/course_exercises.json";
  const targetExerciseFile = "assets/data/course_target_assessments.json";
  const read = (file) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
    } catch (error) {
      fail(file, `could not be read: ${error.message}`);
      return null;
    }
  };

  const bindings = read(bindingFile);
  const inventory = read(inventoryFile);
  const course = read(courseFile);
  const exercises = read(exerciseFile);
  const targetExercises = read(targetExerciseFile);
  if (!bindings || !inventory || !course || !exercises || !targetExercises) return;
  if (bindings.schemaVersion !== 3) fail(bindingFile, "schemaVersion must be 3");
  if (!Array.isArray(bindings.targets)) {
    fail(bindingFile, "targets must be an array");
    return;
  }

  const chapters = new Map();
  course.levels.flatMap((level) => level.chapters).forEach((chapter) => chapters.set(chapter.id, chapter));
  const inventoryByChapter = new Map();
  inventory.chapters.forEach((chapter) => inventoryByChapter.set(chapter.courseChapterId, chapter));
  const exerciseItems = new Map();
  const assessmentIdsByTarget = new Map();
  [
    { file: exerciseFile, data: exercises },
    { file: targetExerciseFile, data: targetExercises }
  ].forEach(({ file, data }) => (data.sets || []).forEach((set) => set.items.forEach((item) => {
    if (exerciseItems.has(item.id)) fail(file, `exercise item id must be globally unique: ${item.id}`);
    exerciseItems.set(item.id, { set, item, file });
    (item.targetIds || []).forEach((targetId) => {
      const ids = assessmentIdsByTarget.get(targetId) || [];
      ids.push(item.id);
      assessmentIdsByTarget.set(targetId, ids);
    });
  })));
  if (targetExercises.schemaVersion !== 2) fail(targetExerciseFile, "schemaVersion must be 2");
  chapters.forEach((chapter, chapterId) => {
    const sets = (targetExercises.sets || []).filter((set) => set.chapterId === chapterId);
    const diagnostics = sets.filter((set) => set.kind === "diagnostic");
    const checkpoints = sets.filter((set) => set.kind === "checkpoint").sort((a, b) => a.sequence - b.sequence);
    if (diagnostics.length !== 1) fail(targetExerciseFile, `${chapterId} must have one entry diagnostic`);
    if (diagnostics[0] && (diagnostics[0].items.length > 10 || diagnostics[0].items.some((item) => item.assessmentMode !== "recognition"))) {
      fail(targetExerciseFile, `${chapterId} diagnostic must contain at most ten recognition items`);
    }
    if (!checkpoints.length) fail(targetExerciseFile, `${chapterId} must have at least one checkpoint`);
    checkpoints.forEach((set, index) => {
      if (set.sequence !== index + 1) fail(targetExerciseFile, `${set.id}.sequence must be ${index + 1}`);
      if (!Number.isInteger(set.targetCount) || set.targetCount < 1 || set.targetCount > 6) {
        fail(targetExerciseFile, `${set.id}.targetCount must be from 1 to 6`);
      }
      const expectedItems = set.targetCount * 2 + (set.targetCount > 1 ? 1 : 0);
      if (set.items.length !== expectedItems) {
        fail(targetExerciseFile, `${set.id} must contain two items per target plus one matching task when possible`);
      }
      const modesByTarget = new Map();
      set.items.forEach((item) => (item.targetIds || []).forEach((targetId) => {
        const modes = modesByTarget.get(targetId) || new Set();
        modes.add(item.assessmentMode);
        modesByTarget.set(targetId, modes);
      }));
      if (modesByTarget.size !== set.targetCount || [...modesByTarget.values()].some((modes) => !modes.has("recognition") || !modes.has("production"))) {
        fail(targetExerciseFile, `${set.id} must assess every checkpoint target in recognition and production modes`);
      }
    });
  });
  const contentCache = new Map();
  const contentIds = (file) => {
    if (!contentCache.has(file)) {
      try {
        const source = fs.readFileSync(path.join(root, file), "utf8");
        if (file.endsWith(".html")) {
          const ids = new Set();
          const pattern = /data-content-id=["']([^"']+)["']/g;
          let match;
          while ((match = pattern.exec(source))) ids.add(match[1]);
          contentCache.set(file, ids);
        } else {
          contentCache.set(file, collectContentIds(JSON.parse(source)));
        }
      } catch (error) {
        contentCache.set(file, null);
      }
    }
    return contentCache.get(file);
  };

  const targetIds = new Set();
  const requirementsByChapter = new Map();
  bindings.targets.forEach((target, index) => {
    const owner = `targets[${index}]`;
    if (!isObject(target)) {
      fail(bindingFile, `${owner} must be an object`);
      return;
    }
    if (typeof target.id !== "string" || !target.id) fail(bindingFile, `${owner}.id is required`);
    if (targetIds.has(target.id)) fail(bindingFile, `duplicate target id: ${target.id}`);
    targetIds.add(target.id);
    if (!chapters.has(target.chapterId)) fail(bindingFile, `${owner} references missing chapter: ${target.chapterId}`);
    if (!allowedTypes.has(target.type)) fail(bindingFile, `${owner}.type is unsupported: ${target.type}`);
    if (!allowedRoles.has(target.role)) fail(bindingFile, `${owner}.role is unsupported: ${target.role}`);
    if (!allowedStatuses.has(target.implementationStatus)) fail(bindingFile, `${owner}.implementationStatus is unsupported: ${target.implementationStatus}`);
    if (typeof target.sourceRequirement !== "string" || !target.sourceRequirement) fail(bindingFile, `${owner}.sourceRequirement is required`);

    const inventoryChapter = inventoryByChapter.get(target.chapterId);
    if (!inventoryChapter || !inventoryChapter.targets.includes(target.sourceRequirement)) {
      fail(bindingFile, `${owner}.sourceRequirement is not in the frozen chapter inventory: ${target.sourceRequirement}`);
    }
    const requirements = requirementsByChapter.get(target.chapterId) || new Set();
    if (requirements.has(target.sourceRequirement)) fail(bindingFile, `${target.chapterId} repeats source requirement: ${target.sourceRequirement}`);
    requirements.add(target.sourceRequirement);
    requirementsByChapter.set(target.chapterId, requirements);

    if (target.implementationStatus === "implemented") {
      if (!isObject(target.contentRef)) {
        fail(bindingFile, `${owner}.contentRef is required for implemented targets`);
      } else {
        const chapter = chapters.get(target.chapterId);
        const isChapterSupplement = target.contentRef.page === "course_chapter.html" &&
          target.contentRef.file === "assets/data/course_supplemental_content.json";
        if (typeof target.contentRef.page !== "string" || (!isChapterSupplement && !chapter?.pages.some((page) => page.href === target.contentRef.page))) {
          fail(bindingFile, `${owner}.contentRef.page is not a study step in ${target.chapterId}: ${target.contentRef.page}`);
        }
        const ids = contentIds(target.contentRef.file);
        if (!ids) fail(bindingFile, `${owner}.contentRef.file is missing or invalid: ${target.contentRef.file}`);
        if (ids && !ids.has(target.contentRef.itemId)) fail(bindingFile, `${owner}.contentRef.itemId was not found: ${target.contentRef.itemId}`);
      }
    } else if (target.contentRef !== null) {
      fail(bindingFile, `${owner}.contentRef must be null unless implementationStatus is implemented`);
    }

    if (Object.prototype.hasOwnProperty.call(target, "assessmentIds")) {
      fail(bindingFile, `${owner}.assessmentIds is derived in chapter payloads and must not be stored in the canonical registry`);
    }
  });

  exerciseItems.forEach(({ item, file }) => (item.targetIds || []).forEach((targetId) => {
    if (!targetIds.has(targetId)) fail(file, `${item.id} references missing target: ${targetId}`);
  }));
  exerciseItems.forEach(({ item, file }) => {
    if ((item.targetIds || []).length && !["recognition", "production"].includes(item.assessmentMode)) {
      fail(file, `${item.id}.assessmentMode must be recognition or production when targetIds are present`);
    }
  });

  bindings.targets.forEach((target) => {
    if (target.implementationStatus !== "implemented") {
      fail(bindingFile, `${target.id} must remain connected to canonical teaching content`);
      return;
    }
    const modes = new Set((assessmentIdsByTarget.get(target.id) || []).map((assessmentId) => exerciseItems.get(assessmentId)?.item.assessmentMode));
    if (!modes.has("recognition") || !modes.has("production")) {
      fail(bindingFile, `${target.id} needs recognition and production assessment coverage`);
    }
  });
  const auditedChapterIds = bindings.fullyAuditedChapterIds || [];
  if (auditedChapterIds.length !== inventory.chapters.length) {
    fail(bindingFile, `fullyAuditedChapterIds must contain all ${inventory.chapters.length} inventory chapters`);
  }
  if (new Set(auditedChapterIds).size !== auditedChapterIds.length) {
    fail(bindingFile, "fullyAuditedChapterIds must not contain duplicates");
  }
  inventory.chapters.forEach((chapter) => {
    if (!auditedChapterIds.includes(chapter.courseChapterId)) {
      fail(bindingFile, `fullyAuditedChapterIds is missing ${chapter.courseChapterId}`);
    }
  });
  auditedChapterIds.forEach((chapterId) => {
    const inventoryChapter = inventoryByChapter.get(chapterId);
    const bound = requirementsByChapter.get(chapterId) || new Set();
    if (!inventoryChapter) {
      fail(bindingFile, `audited chapter is absent from the frozen inventory: ${chapterId}`);
      return;
    }
    const missing = inventoryChapter.targets.filter((target) => !bound.has(target));
    const extra = [...bound].filter((target) => !inventoryChapter.targets.includes(target));
    if (missing.length || extra.length) {
      fail(bindingFile, `${chapterId} bindings differ from inventory (missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"})`);
    }
    const masteryReady = bindings.targets.some((target) => {
      if (target.chapterId !== chapterId || target.implementationStatus !== "implemented") return false;
      const modes = new Set((assessmentIdsByTarget.get(target.id) || []).map((assessmentId) => exerciseItems.get(assessmentId)?.item.assessmentMode));
      return modes.has("recognition") && modes.has("production");
    });
    if (!masteryReady) {
      fail(bindingFile, `${chapterId} needs an implemented target with recognition and production assessments`);
    }
  });
}

module.exports = { validateCourseBindings };
