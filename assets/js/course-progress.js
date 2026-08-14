(() => {
  const COURSE_URL = "./assets/data/course_path.json";
  const BINDINGS_URL = "./assets/data/course_target_bindings.json";
  const ASSESSMENTS_URL = "./assets/data/course_target_assessments.json";
  const COURSE_PROGRESS_KEY = "malti_course_progress_v1";
  const storage = window.MaltiStorage;

  const loadJson = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not load ${url} (${response.status})`);
    return response.json();
  };

  const stateCounts = (targets, progress) => targets.reduce((counts, target) => {
    const state = progress[target.id]?.state;
    counts[state === "mastered" || state === "learning" || state === "review" ? state : "new"] += 1;
    return counts;
  }, { mastered: 0, learning: 0, review: 0, new: 0 });

  const isDue = (target) => window.MaltiExerciseRunner?.isTargetDue?.(target) ?? (target?.state === "review");

  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = String(value);
  };

  const chapterUrl = (chapterId) => `./course_chapter.html?chapter=${encodeURIComponent(chapterId)}`;

  const createCell = (label, className = "") => {
    const cell = document.createElement("td");
    cell.dataset.label = label;
    if (className) cell.className = className;
    return cell;
  };

  const createChapterRow = ({ level, chapter, targets, targetProgress, exerciseProgress, assessmentSets, objectiveProgress }) => {
    const row = document.createElement("tr");
    const chapterCell = createCell("Chapter", "course-progress-chapter-cell");
    const masteryCell = createCell("Target mastery");
    const statesCell = createCell("Current states");
    const checkpointCell = createCell("Checkpoints");
    const actionCell = createCell("Action", "course-progress-action-cell");
    const counts = stateCounts(targets, targetProgress);
    const percent = targets.length ? Math.round(counts.mastered / targets.length * 100) : 0;
    const checkpoints = assessmentSets.filter((set) => set.chapterId === chapter.id && set.kind === "checkpoint");
    const passedCheckpoints = checkpoints.filter((set) => exerciseProgress[set.id]?.passed === true).length;
    const objectiveKeys = chapter.objectives.map((objective) => `${chapter.id}::${objective.id}`);
    const completedObjectives = objectiveKeys.filter((key) => objectiveProgress.objectives?.[key] === true).length;
    const dueCount = targets.filter((target) => isDue(targetProgress[target.id])).length;

    const label = document.createElement("span");
    const title = document.createElement("strong");
    const objective = document.createElement("small");
    label.className = "tag";
    label.textContent = `${level.id.toUpperCase()} · ${chapter.number}`;
    title.textContent = chapter.title;
    objective.textContent = `${completedObjectives}/${objectiveKeys.length} objectives`;
    chapterCell.append(label, title, objective);

    const masteryCopy = document.createElement("div");
    const masteryTrack = document.createElement("div");
    const masteryFill = document.createElement("div");
    masteryCopy.className = "course-progress-mastery-copy";
    masteryCopy.innerHTML = `<strong>${counts.mastered}/${targets.length}</strong><span>${percent}%</span>`;
    masteryTrack.className = "course-progress-track";
    masteryTrack.style.setProperty("--course-progress", `${percent}%`);
    masteryTrack.setAttribute("role", "progressbar");
    masteryTrack.setAttribute("aria-label", `${chapter.title} target mastery`);
    masteryTrack.setAttribute("aria-valuemin", "0");
    masteryTrack.setAttribute("aria-valuemax", "100");
    masteryTrack.setAttribute("aria-valuenow", String(percent));
    masteryFill.className = "course-progress-fill";
    masteryTrack.appendChild(masteryFill);
    masteryCell.append(masteryCopy, masteryTrack);

    const stateList = document.createElement("div");
    stateList.className = "course-progress-state-list";
    [["Learning", counts.learning], ["Review", counts.review], ["New", counts.new]].forEach(([name, value]) => {
      const chip = document.createElement("span");
      chip.className = "status-chip";
      chip.textContent = `${name} ${value}`;
      stateList.appendChild(chip);
    });
    statesCell.appendChild(stateList);

    const checkpointStrong = document.createElement("strong");
    const diagnostic = document.createElement("small");
    const diagnosticSet = assessmentSets.find((set) => set.chapterId === chapter.id && set.kind === "diagnostic");
    checkpointStrong.textContent = `${passedCheckpoints}/${checkpoints.length} passed`;
    diagnostic.textContent = exerciseProgress[diagnosticSet?.id]?.attempts ? "Diagnostic attempted" : "Diagnostic open";
    checkpointCell.append(checkpointStrong, diagnostic);

    const action = document.createElement("a");
    const nextCheckpoint = checkpoints.find((set) => exerciseProgress[set.id]?.passed !== true);
    action.className = "action-link";
    action.href = `${chapterUrl(chapter.id)}#chapter-assessments`;
    action.textContent = dueCount
      ? `Review ${dueCount} due`
      : (!exerciseProgress[diagnosticSet?.id]?.attempts
        ? "Start diagnostic"
        : (nextCheckpoint ? `Checkpoint ${nextCheckpoint.sequence}` : (counts.mastered === targets.length ? "Open chapter" : "Continue")));
    actionCell.appendChild(action);

    row.dataset.progressLevel = level.id;
    row.dataset.progressChapter = chapter.id;
    row.append(chapterCell, masteryCell, statesCell, checkpointCell, actionCell);
    return row;
  };

  const initialize = async () => {
    if (!storage) return;
    const [course, bindings, assessments] = await Promise.all([
      loadJson(COURSE_URL), loadJson(BINDINGS_URL), loadJson(ASSESSMENTS_URL)
    ]);
    const targetProgress = window.MaltiExerciseRunner?.getTargetProgress?.() || {};
    const exerciseProgress = window.MaltiExerciseRunner?.getProgress?.() || {};
    const objectiveProgress = storage.getJson(COURSE_PROGRESS_KEY, {}) || {};
    const allTargets = bindings.targets.filter((target) => target.implementationStatus === "implemented");
    const totals = stateCounts(allTargets, targetProgress);
    const dueTotal = allTargets.filter((target) => isDue(targetProgress[target.id])).length;
    setText("[data-progress-mastered]", totals.mastered);
    setText("[data-progress-learning]", totals.learning);
    setText("[data-progress-review]", dueTotal);
    setText("[data-progress-new]", totals.new);
    setText("[data-progress-summary]", `${totals.mastered} of ${allTargets.length} targets mastered · ${dueTotal} due for review`);

    const chapters = course.levels.flatMap((level) => level.chapters.map((chapter) => ({ level, chapter })));
    const body = document.querySelector("[data-progress-chapters]");
    body.replaceChildren(...chapters.map(({ level, chapter }) => createChapterRow({
      level,
      chapter,
      targets: allTargets.filter((target) => target.chapterId === chapter.id),
      targetProgress,
      exerciseProgress,
      assessmentSets: assessments.sets || [],
      objectiveProgress
    })));

    const filters = document.querySelector("[data-progress-filters]");
    const selectLevel = (levelId) => {
      body.querySelectorAll("[data-progress-level]").forEach((row) => {
        row.hidden = levelId !== "all" && row.dataset.progressLevel !== levelId;
      });
      filters.querySelectorAll("button").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.progressFilter === levelId));
      });
    };
    filters.replaceChildren(...[
      { id: "all", label: "All" },
      ...course.levels.map((level) => ({ id: level.id, label: level.label }))
    ].map((filter) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "toggle-chip";
      button.dataset.progressFilter = filter.id;
      button.textContent = filter.label;
      button.addEventListener("click", () => selectLevel(filter.id));
      return button;
    }));
    selectLevel("all");
  };

  const start = () => initialize().catch((error) => {
    console.error("Could not initialize course progress", error);
    const root = document.querySelector("[data-course-progress-root]");
    if (root) root.textContent = "Course progress could not be loaded.";
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
