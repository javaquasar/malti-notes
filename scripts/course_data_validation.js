const fs = require("fs");
const path = require("path");

const allowedExerciseTypes = new Set([
  "fill-blank",
  "matching",
  "multiple-choice",
  "order-words",
  "true-false"
]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalized(value) {
  return String(value || "").trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function validateCourseFiles({ root, fail }) {
  const courseFile = "assets/data/course_path.json";
  const exerciseFile = "assets/data/course_exercises.json";

  function read(relativePath) {
    try {
      return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
    } catch (error) {
      return null;
    }
  }

  function requireString(file, owner, field, value) {
    if (!isNonEmptyString(value)) {
      fail(file, `${owner}.${field} must be a non-empty string`);
      return false;
    }
    return true;
  }

  function requireStringArray(file, owner, field, value, minimum = 1) {
    if (!Array.isArray(value) || value.length < minimum) {
      fail(file, `${owner}.${field} must contain at least ${minimum} value(s)`);
      return false;
    }
    value.forEach((item, index) => requireString(file, `${owner}.${field}[${index}]`, "value", item));
    return true;
  }

  const course = read(courseFile);
  const exercises = read(exerciseFile);
  if (!course || !exercises) return;

  const exerciseSets = new Map();
  const exerciseChapterIds = new Set();

  if (!Array.isArray(exercises.sets) || !exercises.sets.length) {
    fail(exerciseFile, "sets must be a non-empty array");
  } else {
    exercises.sets.forEach((set, setIndex) => {
      const owner = `sets[${setIndex}]`;
      if (!isObject(set)) {
        fail(exerciseFile, `${owner} must be an object`);
        return;
      }

      const hasId = requireString(exerciseFile, owner, "id", set.id);
      requireString(exerciseFile, owner, "chapterId", set.chapterId);
      requireString(exerciseFile, owner, "title", set.title);

      if (hasId) {
        if (exerciseSets.has(set.id)) {
          fail(exerciseFile, `duplicate exercise set id: ${set.id}`);
        } else {
          exerciseSets.set(set.id, set);
        }
      }

      if (isNonEmptyString(set.chapterId)) {
        if (exerciseChapterIds.has(set.chapterId)) {
          fail(exerciseFile, `more than one exercise set targets chapter: ${set.chapterId}`);
        }
        exerciseChapterIds.add(set.chapterId);
      }

      if (!Number.isInteger(set.passPercent) || set.passPercent < 1 || set.passPercent > 100) {
        fail(exerciseFile, `${owner}.passPercent must be an integer from 1 to 100`);
      }

      if (!Array.isArray(set.items) || !set.items.length) {
        fail(exerciseFile, `${owner}.items must be a non-empty array`);
        return;
      }

      const itemIds = new Set();
      set.items.forEach((item, itemIndex) => {
        const itemOwner = `${owner}.items[${itemIndex}]`;
        if (!isObject(item)) {
          fail(exerciseFile, `${itemOwner} must be an object`);
          return;
        }

        if (requireString(exerciseFile, itemOwner, "id", item.id)) {
          if (itemIds.has(item.id)) {
            fail(exerciseFile, `${owner} has duplicate item id: ${item.id}`);
          }
          itemIds.add(item.id);
        }

        requireString(exerciseFile, itemOwner, "prompt", item.prompt);
        requireString(exerciseFile, itemOwner, "explanation", item.explanation);
        if (!allowedExerciseTypes.has(item.type)) {
          fail(exerciseFile, `${itemOwner}.type is unsupported: ${item.type}`);
        }

        if (!isObject(item.reviewCard)) {
          fail(exerciseFile, `${itemOwner}.reviewCard must be an object`);
        } else {
          requireString(exerciseFile, `${itemOwner}.reviewCard`, "maltese", item.reviewCard.maltese);
          requireString(exerciseFile, `${itemOwner}.reviewCard`, "english", item.reviewCard.english);
        }

        if (item.listen !== undefined) {
          requireString(exerciseFile, itemOwner, "listen", item.listen);
        }

        if (item.type === "multiple-choice") {
          if (requireStringArray(exerciseFile, itemOwner, "choices", item.choices, 2)) {
            const choices = new Set(item.choices);
            if (choices.size !== item.choices.length) {
              fail(exerciseFile, `${itemOwner}.choices must be unique`);
            }
            if (!choices.has(item.answer)) {
              fail(exerciseFile, `${itemOwner}.answer must be one of choices`);
            }
          }
          requireString(exerciseFile, itemOwner, "answer", item.answer);
        }

        if (item.type === "true-false" && typeof item.answer !== "boolean") {
          fail(exerciseFile, `${itemOwner}.answer must be a boolean`);
        }

        if (item.type === "fill-blank") {
          if (requireString(exerciseFile, itemOwner, "answer", item.answer) &&
              requireStringArray(exerciseFile, itemOwner, "accepted", item.accepted)) {
            const accepted = item.accepted.map(normalized);
            if (!accepted.includes(normalized(item.answer))) {
              fail(exerciseFile, `${itemOwner}.accepted must include answer`);
            }
          }
        }

        if (item.type === "matching") {
          if (!Array.isArray(item.pairs) || item.pairs.length < 2) {
            fail(exerciseFile, `${itemOwner}.pairs must contain at least two pairs`);
          } else {
            const leftValues = new Set();
            const rightValues = new Set();
            item.pairs.forEach((pair, pairIndex) => {
              const pairOwner = `${itemOwner}.pairs[${pairIndex}]`;
              if (!isObject(pair)) {
                fail(exerciseFile, `${pairOwner} must be an object`);
                return;
              }
              if (requireString(exerciseFile, pairOwner, "left", pair.left)) leftValues.add(pair.left);
              if (requireString(exerciseFile, pairOwner, "right", pair.right)) rightValues.add(pair.right);
            });
            if (leftValues.size !== item.pairs.length || rightValues.size !== item.pairs.length) {
              fail(exerciseFile, `${itemOwner}.pairs must have unique left and right values`);
            }
          }
        }

        if (item.type === "order-words") {
          const hasTokens = requireStringArray(exerciseFile, itemOwner, "tokens", item.tokens, 2);
          const hasAnswer = requireString(exerciseFile, itemOwner, "answer", item.answer);
          if (hasTokens && hasAnswer && normalized(item.tokens.join(" ")) !== normalized(item.answer)) {
            fail(exerciseFile, `${itemOwner}.tokens must form answer in their declared order`);
          }
        }
      });
    });
  }

  const siteMap = read("assets/data/site-map.json");
  const registeredPages = new Set(
    (siteMap?.groups || []).flatMap((group) => group.pages || []).map((page) => page.href)
  );
  const usedExerciseSets = new Set();
  const chapterIds = new Set();

  if (!Array.isArray(course.levels) || !course.levels.length) {
    fail(courseFile, "levels must be a non-empty array");
  } else {
    const levelIds = new Set();
    course.levels.forEach((level, levelIndex) => {
      const owner = `levels[${levelIndex}]`;
      if (!isObject(level)) {
        fail(courseFile, `${owner} must be an object`);
        return;
      }

      if (requireString(courseFile, owner, "id", level.id)) {
        if (levelIds.has(level.id)) fail(courseFile, `duplicate level id: ${level.id}`);
        levelIds.add(level.id);
      }
      requireString(courseFile, owner, "label", level.label);
      requireString(courseFile, owner, "summary", level.summary);

      if (!Array.isArray(level.chapters) || !level.chapters.length) {
        fail(courseFile, `${owner}.chapters must be a non-empty array`);
        return;
      }

      level.chapters.forEach((chapter, chapterIndex) => {
        const chapterOwner = `${owner}.chapters[${chapterIndex}]`;
        if (!isObject(chapter)) {
          fail(courseFile, `${chapterOwner} must be an object`);
          return;
        }

        if (requireString(courseFile, chapterOwner, "id", chapter.id)) {
          if (chapterIds.has(chapter.id)) fail(courseFile, `duplicate chapter id: ${chapter.id}`);
          chapterIds.add(chapter.id);
        }
        requireString(courseFile, chapterOwner, "title", chapter.title);
        requireString(courseFile, chapterOwner, "summary", chapter.summary);
        requireString(courseFile, chapterOwner, "exerciseSetId", chapter.exerciseSetId);

        if (chapter.number !== chapterIndex + 1) {
          fail(courseFile, `${chapterOwner}.number must be ${chapterIndex + 1}`);
        }

        const set = exerciseSets.get(chapter.exerciseSetId);
        if (!set) {
          fail(courseFile, `${chapterOwner}.exerciseSetId is missing from ${exerciseFile}`);
        } else {
          usedExerciseSets.add(chapter.exerciseSetId);
          if (set.chapterId !== chapter.id) {
            fail(courseFile, `${chapterOwner}.exerciseSetId targets ${set.chapterId}, expected ${chapter.id}`);
          }
        }

        if (!Array.isArray(chapter.objectives) || !chapter.objectives.length) {
          fail(courseFile, `${chapterOwner}.objectives must be a non-empty array`);
        } else {
          const objectiveIds = new Set();
          chapter.objectives.forEach((objective, objectiveIndex) => {
            const objectiveOwner = `${chapterOwner}.objectives[${objectiveIndex}]`;
            if (!isObject(objective)) {
              fail(courseFile, `${objectiveOwner} must be an object`);
              return;
            }
            if (requireString(courseFile, objectiveOwner, "id", objective.id)) {
              if (objectiveIds.has(objective.id)) {
                fail(courseFile, `${chapterOwner} has duplicate objective id: ${objective.id}`);
              }
              objectiveIds.add(objective.id);
            }
            requireString(courseFile, objectiveOwner, "label", objective.label);
          });
        }

        if (!Array.isArray(chapter.pages) || !chapter.pages.length) {
          fail(courseFile, `${chapterOwner}.pages must be a non-empty array`);
        } else {
          const pageHrefs = new Set();
          chapter.pages.forEach((page, pageIndex) => {
            const pageOwner = `${chapterOwner}.pages[${pageIndex}]`;
            if (!isObject(page)) {
              fail(courseFile, `${pageOwner} must be an object`);
              return;
            }
            if (requireString(courseFile, pageOwner, "href", page.href)) {
              if (pageHrefs.has(page.href)) fail(courseFile, `${chapterOwner} repeats page: ${page.href}`);
              pageHrefs.add(page.href);
              if (!fs.existsSync(path.join(root, page.href))) {
                fail(courseFile, `${pageOwner}.href points to missing file: ${page.href}`);
              }
              if (!registeredPages.has(page.href)) {
                fail(courseFile, `${pageOwner}.href is not registered in assets/data/site-map.json`);
              }
            }
            requireString(courseFile, pageOwner, "label", page.label);
            requireString(courseFile, pageOwner, "focus", page.focus);
          });
        }
      });
    });
  }

  exerciseSets.forEach((set, setId) => {
    if (!usedExerciseSets.has(setId)) {
      fail(exerciseFile, `exercise set is not linked from the course path: ${setId}`);
    }
    if (!chapterIds.has(set.chapterId)) {
      fail(exerciseFile, `exercise set references missing chapter: ${set.chapterId}`);
    }
  });
}

module.exports = { validateCourseFiles };
