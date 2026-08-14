(() => {
  const COURSE_URL = "./assets/data/course_path.json";
  const INVENTORY_URL = "./assets/data/book_coverage_inventory.json";
  const BINDINGS_URL = "./assets/data/course_target_bindings.json";
  const TARGET_ASSESSMENTS_URL = "./assets/data/course_target_assessments.json";
  const SUPPLEMENTAL_CONTENT_URL = "./assets/data/course_supplemental_content.json";
  const SOURCE_PROVENANCE_URL = "./assets/data/course_source_provenance.json";
  const TARGET_PROGRESS_KEY = "malti_course_target_progress_v1";

  const loadJson = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not load ${url} (${response.status})`);
    return response.json();
  };

  const findChapter = (course, chapterId) => {
    for (const level of course.levels || []) {
      const index = level.chapters.findIndex((chapter) => chapter.id === chapterId);
      if (index >= 0) return { level, chapter: level.chapters[index], index };
    }
    return null;
  };

  const hasChapterView = (implemented, pageHref) => implemented.some((target) => target.contentRef?.page === pageHref);

  const contextualPageUrl = (page, level, chapter, index, implemented) => {
    const params = new URLSearchParams({ course: level.id, chapter: chapter.id, step: String(index + 1) });
    if (hasChapterView(implemented, page.href)) params.set("view", "chapter");
    return `./${page.href}?${params.toString()}`;
  };

  const chapterUrl = (chapterId) => `./course_chapter.html?chapter=${encodeURIComponent(chapterId)}`;

  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  };

  const updateLearnerMetrics = (implemented) => {
    const progress = window.MaltiStorage?.getJson(TARGET_PROGRESS_KEY, {}) || {};
    const mastered = implemented.filter((target) => progress[target.id]?.state === "mastered").length;
    const review = implemented.filter((target) => progress[target.id]?.state === "review").length;
    setText("[data-course-mastery]", `${mastered} / ${implemented.length}`);
    setText("[data-course-review-count]", String(review));
  };

  const renderNeighbours = (course, match) => {
    const all = course.levels.flatMap((level) => level.chapters.map((chapter) => ({ level, chapter })));
    const current = all.findIndex(({ chapter }) => chapter.id === match.chapter.id);
    const container = document.querySelector("[data-course-chapter-neighbours]");
    const links = [];
    if (current > 0) {
      const previous = document.createElement("a");
      previous.className = "action-link";
      previous.href = chapterUrl(all[current - 1].chapter.id);
      previous.textContent = "Previous chapter";
      links.push(previous);
    }
    if (current < all.length - 1) {
      const next = document.createElement("a");
      next.className = "action-link";
      next.href = chapterUrl(all[current + 1].chapter.id);
      next.textContent = "Next chapter";
      links.push(next);
    }
    container.replaceChildren(...links);
  };

  const renderObjectives = (chapter) => {
    const container = document.querySelector("[data-course-chapter-objectives]");
    container.replaceChildren(...chapter.objectives.map((objective) => {
      const row = document.createElement("div");
      const marker = document.createElement("span");
      const label = document.createElement("span");
      row.className = "course-objective course-objective-static";
      marker.className = "course-objective-marker";
      marker.setAttribute("aria-hidden", "true");
      label.textContent = objective.label;
      row.append(marker, label);
      return row;
    }));
  };

  const renderSteps = (level, chapter, implemented) => {
    const container = document.querySelector("[data-course-chapter-steps]");
    container.replaceChildren(...chapter.pages.map((page, index) => {
      const article = document.createElement("article");
      const number = document.createElement("span");
      const copy = document.createElement("div");
      const link = document.createElement("a");
      const focus = document.createElement("p");
      const status = document.createElement("span");
      article.className = "course-step";
      number.className = "course-step-number";
      number.textContent = String(index + 1);
      link.href = contextualPageUrl(page, level, chapter, index, implemented);
      link.textContent = page.label;
      focus.textContent = page.focus;
      status.className = "status-chip";
      status.textContent = hasChapterView(implemented, page.href) ? "Chapter view ready" : "Course context";
      copy.append(link, focus);
      article.append(number, copy, status);
      return article;
    }));
  };

  const renderMissing = (inventoryChapter, chapterTargets) => {
    const list = document.querySelector("[data-course-missing-targets]");
    const targets = chapterTargets.length
      ? chapterTargets.filter((target) => target.implementationStatus !== "implemented")
        .map((target) => ({ value: target.sourceRequirement, status: target.implementationStatus }))
      : inventoryChapter.baselineMissing.map((value) => ({ value, status: "missing" }));
    list.replaceChildren(...targets.map((target) => {
      const item = document.createElement("li");
      const text = document.createElement("span");
      const status = document.createElement("small");
      text.textContent = target.value;
      status.textContent = target.status === "evidence-only" ? "found, not linked to a lesson card" : "not yet available";
      item.append(text, status);
      return item;
    }));
    if (!targets.length) {
      const item = document.createElement("li");
      item.textContent = "All required targets are linked.";
      list.appendChild(item);
    }
  };

  const renderExercise = async (chapter) => {
    const container = document.querySelector("[data-course-chapter-exercise]");
    container.dataset.exerciseSet = chapter.exerciseSetId;
    container.dataset.exerciseSrc = "./assets/data/course_exercises.json";
    container.dataset.autoSaveMissed = "true";
    if (window.MaltiExerciseRunner) await window.MaltiExerciseRunner.scan(container.parentElement);
  };

  const exerciseContainer = (setId) => {
    const container = document.createElement("div");
    container.dataset.exerciseSet = setId;
    container.dataset.exerciseSrc = TARGET_ASSESSMENTS_URL;
    container.dataset.autoSaveMissed = "true";
    return container;
  };

  const renderAssessmentFlow = async (chapter, targetAssessments) => {
    const chapterSets = (targetAssessments.sets || []).filter((set) => set.chapterId === chapter.id);
    const diagnostic = chapterSets.find((set) => set.kind === "diagnostic");
    const checkpoints = chapterSets.filter((set) => set.kind === "checkpoint").sort((a, b) => a.sequence - b.sequence);
    if (!diagnostic || !checkpoints.length) return;

    const section = document.querySelector("[data-course-assessment-flow]");
    const diagnosticRoot = document.querySelector("[data-course-diagnostic]");
    const checkpointRoot = document.querySelector("[data-course-checkpoints]");
    const diagnosticContainer = exerciseContainer(diagnostic.id);
    diagnosticRoot.replaceChildren(diagnosticContainer);

    checkpointRoot.replaceChildren(...checkpoints.map((set) => {
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      const title = document.createElement("strong");
      const status = document.createElement("span");
      const container = exerciseContainer(set.id);
      const updateStatus = () => {
        const progress = window.MaltiExerciseRunner?.getProgress()?.[set.id];
        status.textContent = progress ? `Best ${progress.bestScore}/${progress.total}` : `${set.targetCount} targets`;
      };
      details.className = "course-checkpoint";
      title.textContent = `Checkpoint ${set.sequence}`;
      status.className = "status-chip";
      summary.append(title, status);
      details.append(summary, container);
      details.addEventListener("toggle", () => {
        if (details.open && window.MaltiExerciseRunner) window.MaltiExerciseRunner.scan(details);
      });
      window.addEventListener("malti-exercise-progress", updateStatus);
      updateStatus();
      return details;
    }));
    section.hidden = false;
    if (window.MaltiExerciseRunner) await window.MaltiExerciseRunner.scan(diagnosticRoot);
  };

  const renderSupplements = (chapter, chapterTargets, supplementalContent) => {
    const supplementIds = new Set(chapterTargets
      .filter((target) => target.contentRef?.file === "assets/data/course_supplemental_content.json")
      .map((target) => target.id));
    const sourceChapter = (supplementalContent.chapters || []).find((item) => item.id === chapter.id);
    const items = (sourceChapter?.items || []).filter((item) => supplementIds.has(item.id));
    if (!items.length) return;

    const section = document.querySelector("[data-course-supplement-section]");
    const grid = document.querySelector("[data-course-supplement-grid]");
    const renderer = window.MaltiVocabRenderer;
    if (!section || !grid || !renderer) return;

    const createReviewButton = (item) => {
      const button = document.createElement("button");
      const reviewId = `word::course-supplement::${item.id}`;
      const sync = () => {
        const saved = window.MaltiReviewStore?.hasWord(reviewId) === true;
        button.textContent = saved ? "Saved for Review" : "Add to Review";
        button.classList.toggle("is-added", saved);
        button.disabled = saved;
      };
      button.type = "button";
      button.className = "review-add-button";
      button.addEventListener("click", () => {
        window.MaltiReviewStore?.addWord({
          id: reviewId,
          contentId: item.id,
          maltese: item.maltese,
          english: item.english,
          topic: `${chapter.title} book supplement`,
          sourcePage: item.sourceLabel || "course_chapter.html",
          example: item.example || item.maltese
        });
        sync();
      });
      sync();
      return button;
    };

    grid.replaceChildren(...items.map((item) => renderer.createFigureCard(item, {
      cardClass: "visual-vocab-card",
      groupId: `${chapter.id}-supplement`,
      reviewButtonFactory: createReviewButton
    })));
    section.hidden = false;
  };

  const initialize = async () => {
    const chapterId = new URLSearchParams(window.location.search).get("chapter");
    if (!chapterId) return;
    const [course, inventory, bindings, targetAssessments, supplementalContent, sourceProvenance] = await Promise.all([
      loadJson(COURSE_URL),
      loadJson(INVENTORY_URL),
      loadJson(BINDINGS_URL),
      loadJson(TARGET_ASSESSMENTS_URL),
      loadJson(SUPPLEMENTAL_CONTENT_URL),
      loadJson(SOURCE_PROVENANCE_URL)
    ]);
    const match = findChapter(course, chapterId);
    const inventoryChapter = inventory.chapters.find((chapter) => chapter.courseChapterId === chapterId);
    if (!match || !inventoryChapter) throw new Error(`Unknown course chapter: ${chapterId}`);

    const chapterTargets = bindings.targets.filter((target) => target.chapterId === chapterId && target.role === "core");
    const implemented = chapterTargets.filter((target) => target.implementationStatus === "implemented");
    const assessed = implemented.filter((target) => target.assessmentIds.length > 0);
    const required = inventoryChapter.targets.length;
    const bookCovered = chapterTargets.filter((target) => target.implementationStatus !== "missing").length;

    document.title = `${match.level.label} ${match.chapter.number}: ${match.chapter.title}`;
    setText("[data-course-chapter-label]", `${match.level.label} · Chapter ${match.chapter.number}`);
    setText("[data-course-chapter-title]", match.chapter.title);
    setText("[data-course-chapter-summary]", match.chapter.summary);
    setText("[data-course-book-coverage]", `${bookCovered} / ${required}`);
    setText("[data-course-guided-coverage]", chapterTargets.length ? `${implemented.length} / ${required}` : "Mapping pending");
    if (chapterTargets.length) updateLearnerMetrics(implemented);
    else {
      setText("[data-course-mastery]", "Not available");
      setText("[data-course-review-count]", "0");
    }
    setText("[data-course-binding-note]", chapterTargets.length
      ? `${implemented.length} targets are connected to canonical lesson cards; ${required - implemented.length} still need teaching content.`
      : "The chapter route is available, while stable target-to-content bindings are still being prepared.");
    setText("[data-course-assessment-coverage]", chapterTargets.length
      ? `${assessed.length} of ${implemented.length} guided targets have linked self-tests with recognition and production modes.`
      : "Detailed assessment coverage will appear after this chapter receives stable target bindings.");

    const sourceChapter = (sourceProvenance.chapters || []).find((chapter) => chapter.chapterId === chapterId);
    const sourceRange = sourceChapter ? `${sourceChapter.book} pp. ${sourceChapter.pageStart}-${sourceChapter.pageEnd}` : "Book source pending";
    const pills = document.querySelector("[data-course-chapter-pills]");
    [`${required} required targets`, `${match.chapter.pages.length} study steps`, `${chapterTargets.length ? implemented.length : 0} guided targets`, sourceRange]
      .forEach((label) => {
        const pill = document.createElement("span");
        pill.className = "pill";
        pill.textContent = label;
        pills.appendChild(pill);
      });

    const pathLink = document.querySelector("[data-course-path-link]");
    pathLink.href = `./course_path.html#${chapterId}`;
    renderNeighbours(course, match);
    renderObjectives(match.chapter);
    renderSteps(match.level, match.chapter, implemented);
    renderMissing(inventoryChapter, chapterTargets);
    renderSupplements(match.chapter, chapterTargets, supplementalContent);
    document.querySelector("[data-course-chapter-empty]").hidden = true;
    document.querySelector("[data-course-chapter-content]").hidden = false;
    window.addEventListener("malti-course-target-progress", () => updateLearnerMetrics(implemented));
    await renderExercise(match.chapter);
    await renderAssessmentFlow(match.chapter, targetAssessments);
  };

  const start = () => initialize().catch((error) => {
    console.error("Could not initialize course chapter", error);
    const empty = document.querySelector("[data-course-chapter-empty]");
    if (empty) empty.querySelector("p").textContent = "This course chapter could not be loaded.";
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
