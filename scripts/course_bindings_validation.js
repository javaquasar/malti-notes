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
  if (!bindings || !inventory || !course || !exercises) return;
  if (bindings.schemaVersion !== 1) fail(bindingFile, "schemaVersion must be 1");
  if (!Array.isArray(bindings.targets)) {
    fail(bindingFile, "targets must be an array");
    return;
  }

  const chapters = new Map();
  course.levels.flatMap((level) => level.chapters).forEach((chapter) => chapters.set(chapter.id, chapter));
  const inventoryByChapter = new Map();
  inventory.chapters.forEach((chapter) => inventoryByChapter.set(chapter.courseChapterId, chapter));
  const exerciseItems = new Map();
  exercises.sets.forEach((set) => set.items.forEach((item) => {
    if (exerciseItems.has(item.id)) fail(exerciseFile, `exercise item id must be globally unique: ${item.id}`);
    exerciseItems.set(item.id, { set, item });
  }));
  const contentCache = new Map();
  const contentIds = (file) => {
    if (!contentCache.has(file)) {
      try {
        contentCache.set(file, collectContentIds(JSON.parse(fs.readFileSync(path.join(root, file), "utf8"))));
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
        const ids = contentIds(target.contentRef.file);
        if (!ids) fail(bindingFile, `${owner}.contentRef.file is missing or invalid: ${target.contentRef.file}`);
        if (ids && !ids.has(target.contentRef.itemId)) fail(bindingFile, `${owner}.contentRef.itemId was not found: ${target.contentRef.itemId}`);
      }
    } else if (target.contentRef !== null) {
      fail(bindingFile, `${owner}.contentRef must be null unless implementationStatus is implemented`);
    }

    if (!Array.isArray(target.assessmentIds)) {
      fail(bindingFile, `${owner}.assessmentIds must be an array`);
    } else {
      target.assessmentIds.forEach((assessmentId) => {
        const exercise = exerciseItems.get(assessmentId);
        if (!exercise) {
          fail(bindingFile, `${owner} references missing assessment: ${assessmentId}`);
        } else if (exercise.set.chapterId !== target.chapterId) {
          fail(bindingFile, `${owner} assessment ${assessmentId} belongs to ${exercise.set.chapterId}`);
        } else if (!Array.isArray(exercise.item.targetIds) || !exercise.item.targetIds.includes(target.id)) {
          fail(bindingFile, `${owner} assessment ${assessmentId} does not link back to ${target.id}`);
        }
      });
    }
  });

  exerciseItems.forEach(({ item }) => (item.targetIds || []).forEach((targetId) => {
    if (!targetIds.has(targetId)) fail(exerciseFile, `${item.id} references missing target: ${targetId}`);
  }));
  exerciseItems.forEach(({ item }) => {
    if ((item.targetIds || []).length && !["recognition", "production"].includes(item.assessmentMode)) {
      fail(exerciseFile, `${item.id}.assessmentMode must be recognition or production when targetIds are present`);
    }
  });
  (bindings.pilotChapterIds || []).forEach((chapterId) => {
    const inventoryChapter = inventoryByChapter.get(chapterId);
    const bound = requirementsByChapter.get(chapterId) || new Set();
    if (!inventoryChapter) {
      fail(bindingFile, `pilot chapter is absent from the frozen inventory: ${chapterId}`);
      return;
    }
    const missing = inventoryChapter.targets.filter((target) => !bound.has(target));
    const extra = [...bound].filter((target) => !inventoryChapter.targets.includes(target));
    if (missing.length || extra.length) {
      fail(bindingFile, `${chapterId} pilot bindings differ from inventory (missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"})`);
    }
  });
}

module.exports = { validateCourseBindings };
