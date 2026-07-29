(() => {
  const DATA_URL = "./assets/data/course_path.json";
  const STORAGE_KEY = "malti_course_progress_v1";
  const storage = window.MaltiStorage;

  const loadProgress = () => {
    const value = storage.getJson(STORAGE_KEY, {});
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  };

  const saveProgress = (progress) => {
    storage.setJson(STORAGE_KEY, progress);
    window.dispatchEvent(new CustomEvent("malti-course-progress"));
  };

  const objectiveKey = (chapterId, objectiveId) => `${chapterId}::${objectiveId}`;

  const createLink = (page) => {
    const article = document.createElement("article");
    const link = document.createElement("a");
    const description = document.createElement("span");

    article.className = "course-page-link";
    link.href = `./${page.href}`;
    link.textContent = page.label;
    description.textContent = page.focus;
    article.append(link, description);
    return article;
  };

  const createObjective = (chapter, objective, progress, onChange) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const text = document.createElement("span");
    const key = objectiveKey(chapter.id, objective.id);

    label.className = "course-objective";
    input.type = "checkbox";
    input.checked = progress.objectives?.[key] === true;
    input.dataset.objectiveKey = key;
    text.textContent = objective.label;
    input.addEventListener("change", () => onChange(key, input.checked));
    label.append(input, text);
    return label;
  };

  const chapterObjectiveStats = (chapter, progress) => {
    const completed = chapter.objectives.filter((objective) => (
      progress.objectives?.[objectiveKey(chapter.id, objective.id)] === true
    )).length;
    return { completed, total: chapter.objectives.length };
  };

  const createChapter = (level, chapter, progress, onObjectiveChange) => {
    const article = document.createElement("article");
    const header = document.createElement("header");
    const titleWrap = document.createElement("div");
    const eyebrow = document.createElement("span");
    const title = document.createElement("h3");
    const status = document.createElement("span");
    const summary = document.createElement("p");
    const objectiveHeading = document.createElement("h4");
    const objectives = document.createElement("div");
    const pagesHeading = document.createElement("h4");
    const pages = document.createElement("div");
    const stats = chapterObjectiveStats(chapter, progress);

    article.className = "course-chapter content-group";
    article.id = chapter.id;
    article.dataset.courseChapter = chapter.id;
    header.className = "course-chapter-header";
    eyebrow.className = "tag";
    eyebrow.textContent = `${level.label} · Chapter ${chapter.number}`;
    title.textContent = chapter.title;
    status.className = "status-chip course-chapter-status";
    status.dataset.chapterStatus = chapter.id;
    status.textContent = `${stats.completed}/${stats.total} objectives`;
    summary.className = "course-chapter-summary";
    summary.textContent = chapter.summary;
    objectiveHeading.textContent = "Learning objectives";
    objectives.className = "course-objectives";
    chapter.objectives.forEach((objective) => {
      objectives.appendChild(createObjective(chapter, objective, progress, onObjectiveChange));
    });
    pagesHeading.textContent = "Study pages";
    pages.className = "course-page-links";
    pages.replaceChildren(...chapter.pages.map(createLink));

    titleWrap.append(eyebrow, title);
    header.append(titleWrap, status);
    article.append(header, summary, objectiveHeading, objectives, pagesHeading, pages);
    return article;
  };

  const createLevel = (level, progress, onObjectiveChange) => {
    const section = document.createElement("section");
    const intro = document.createElement("div");
    const title = document.createElement("h2");
    const summary = document.createElement("p");
    const chapters = document.createElement("div");

    section.className = "course-level";
    section.dataset.courseLevel = level.id;
    section.hidden = true;
    intro.className = "course-level-intro";
    title.textContent = level.label;
    summary.textContent = level.summary;
    chapters.className = "course-chapter-list";
    chapters.replaceChildren(...level.chapters.map((chapter) => (
      createChapter(level, chapter, progress, onObjectiveChange)
    )));
    intro.append(title, summary);
    section.append(intro, chapters);
    return section;
  };

  const allObjectives = (data) => data.levels.flatMap((level) => (
    level.chapters.flatMap((chapter) => (
      chapter.objectives.map((objective) => objectiveKey(chapter.id, objective.id))
    ))
  ));

  const levelObjectiveKeys = (level) => level.chapters.flatMap((chapter) => (
    chapter.objectives.map((objective) => objectiveKey(chapter.id, objective.id))
  ));

  const updateSummary = (data, progress, activeLevelId) => {
    const keys = allObjectives(data);
    const completed = keys.filter((key) => progress.objectives?.[key] === true).length;
    const percent = keys.length ? Math.round((completed / keys.length) * 100) : 0;
    const overall = document.querySelector("[data-course-progress]");
    const overallLabel = document.querySelector("[data-course-progress-label]");
    const level = data.levels.find((item) => item.id === activeLevelId);
    const levelKeys = level ? levelObjectiveKeys(level) : [];
    const levelCompleted = levelKeys.filter((key) => progress.objectives?.[key] === true).length;
    const levelStatus = document.querySelector("[data-course-level-status]");

    if (overall) {
      overall.style.setProperty("--course-progress", `${percent}%`);
      overall.setAttribute("aria-valuenow", String(percent));
    }
    if (overallLabel) {
      overallLabel.textContent = `${completed} of ${keys.length} objectives complete`;
    }
    if (levelStatus && level) {
      levelStatus.textContent = `${level.label}: ${levelCompleted}/${levelKeys.length}`;
    }

    data.levels.forEach((item) => {
      item.chapters.forEach((chapter) => {
        const status = document.querySelector(`[data-chapter-status="${chapter.id}"]`);
        const stats = chapterObjectiveStats(chapter, progress);
        if (status) status.textContent = `${stats.completed}/${stats.total} objectives`;
      });
    });
  };

  const selectLevel = (levelId, data, progress) => {
    document.querySelectorAll("[data-course-level]").forEach((section) => {
      section.hidden = section.dataset.courseLevel !== levelId;
    });
    document.querySelectorAll("[data-course-level-button]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.courseLevelButton === levelId));
    });
    updateSummary(data, progress, levelId);
  };

  const initialize = async () => {
    const root = document.querySelector("[data-course-path]");
    const tabs = document.querySelector("[data-course-level-tabs]");
    if (!root || !tabs || !storage) return;

    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`Could not load course path (${response.status})`);
    const data = await response.json();
    const progress = loadProgress();
    progress.objectives = progress.objectives || {};

    const activeFromHash = data.levels.find((level) => (
      level.chapters.some((chapter) => `#${chapter.id}` === window.location.hash)
    ))?.id;
    let activeLevelId = activeFromHash || data.levels[0]?.id;

    const onObjectiveChange = (key, checked) => {
      progress.objectives[key] = checked;
      progress.updatedAt = new Date().toISOString();
      saveProgress(progress);
      updateSummary(data, progress, activeLevelId);
    };

    root.replaceChildren(...data.levels.map((level) => createLevel(level, progress, onObjectiveChange)));
    tabs.replaceChildren(...data.levels.map((level) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "toggle-chip";
      button.dataset.courseLevelButton = level.id;
      button.setAttribute("aria-pressed", "false");
      button.textContent = level.label;
      button.addEventListener("click", () => {
        activeLevelId = level.id;
        selectLevel(activeLevelId, data, progress);
      });
      return button;
    }));

    selectLevel(activeLevelId, data, progress);

    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) window.requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
    }
  };

  const start = () => initialize().catch((error) => {
    console.error("Could not initialize the course path", error);
    const root = document.querySelector("[data-course-path]");
    if (root) root.textContent = "The course path could not be loaded.";
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
