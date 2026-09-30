(() => {
  const COURSE_URL = "./assets/data/course_path.json";
  const MANIFEST_URL = "./assets/data/course/manifest.json";
  const GRAMMAR_URL = "./assets/data/grammar_targets.json";
  const COURSE_PROGRESS_KEY = "malti_course_progress_v1";
  const root = document.querySelector("[data-knowledge-map-root]");
  if (!root) return;

  const storage = window.MaltiStorage;
  const create = (tag, className = "", text = "") => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };
  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = String(value);
  };
  const loadJson = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not load ${url} (${response.status})`);
    return response.json();
  };
  const isDue = (target) => window.MaltiExerciseRunner?.isTargetDue?.(target) ?? target?.state === "review";
  const chapterHref = (id) => `./course_chapter.html?chapter=${encodeURIComponent(id)}#chapter-assessments`;

  const countStates = (targetIds, progress) => targetIds.reduce((counts, id) => {
    const state = progress[id]?.state;
    counts[state === "mastered" || state === "learning" || state === "review" ? state : "new"] += 1;
    return counts;
  }, { mastered: 0, learning: 0, review: 0, new: 0 });

  const mistakesForTargets = (mistakes, targetIds) => {
    const ids = new Set(targetIds);
    return mistakes.filter((mistake) => mistake.targetIds?.some((id) => ids.has(id)));
  };

  const createFocusItem = ({ title, detail, href }) => {
    const item = create("li");
    const copy = create("div");
    const heading = href ? create("a", "", title) : create("strong", "", title);
    const note = create("small", "", detail);
    if (href) heading.href = href;
    copy.append(heading, note);
    item.appendChild(copy);
    return item;
  };

  const cardTitle = (card) => {
    if (card.type === "verb-form-card") return card.answer || card.prompt;
    return card.maltese || card.prompt || "Review item";
  };

  const renderVocabulary = (cards) => {
    const list = root.querySelector("[data-knowledge-vocabulary]");
    const empty = root.querySelector("[data-knowledge-vocabulary-empty]");
    const now = Date.now();
    const weak = cards
      .filter((card) => Date.parse(card.nextReviewAt) <= now || (card.reviewCount > 0 && card.box <= 1))
      .sort((left, right) => {
        const dueDifference = Date.parse(left.nextReviewAt) - Date.parse(right.nextReviewAt);
        return dueDifference || left.box - right.box || cardTitle(left).localeCompare(cardTitle(right));
      })
      .slice(0, 5);
    list.replaceChildren(...weak.map((card) => createFocusItem({
      title: cardTitle(card),
      detail: `${card.topic} · ${Date.parse(card.nextReviewAt) <= now ? "due now" : `box ${card.box}`} · ${card.english || card.translation || card.answer || "practice saved"}`,
      href: "./review_cards.html?quick=due#review-stage"
    })));
    empty.hidden = weak.length > 0;
  };

  const renderGrammar = (grammarTargets, targetProgress, mistakes) => {
    const list = root.querySelector("[data-knowledge-grammar]");
    const empty = root.querySelector("[data-knowledge-grammar-empty]");
    const ranked = grammarTargets.map((target) => {
      const progress = targetProgress[target.id];
      const mistakeCount = mistakes.filter((mistake) => mistake.ruleId === target.id || mistake.targetIds?.includes(target.id)).length;
      const due = isDue(progress);
      const rank = mistakeCount ? 0 : (due ? 1 : (progress?.state === "learning" ? 2 : (progress?.state === "mastered" ? 4 : 3)));
      const detail = mistakeCount
        ? `${mistakeCount} open mistake${mistakeCount === 1 ? "" : "s"}`
        : (due ? "Review due" : (progress?.state === "learning" ? "Learning" : (progress?.state === "mastered" ? "Mastered" : "Not started")));
      return { target, rank, detail };
    }).filter((entry) => entry.rank < 4)
      .sort((left, right) => left.rank - right.rank || left.target.title.localeCompare(right.target.title))
      .slice(0, 5);
    list.replaceChildren(...ranked.map(({ target, detail }) => createFocusItem({
      title: target.title,
      detail: `${detail} · ${target.book}`,
      href: `./grammar_path.html#${encodeURIComponent(target.id)}`
    })));
    empty.hidden = ranked.length > 0;
  };

  const renderMistakes = (mistakes) => {
    const list = root.querySelector("[data-knowledge-mistake-list]");
    const empty = root.querySelector("[data-knowledge-mistakes-empty]");
    list.replaceChildren(...mistakes.slice(0, 5).map((mistake) => createFocusItem({
      title: mistake.prompt || mistake.correctAnswer || "Practice mistake",
      detail: `${mistake.topic} · ${mistake.wrongCount || 1} wrong · ${mistake.correctStreak || 0}/2 correct retries`,
      href: "./mistakes.html"
    })));
    empty.hidden = mistakes.length > 0;
  };

  const createCell = (label, className = "") => {
    const cell = create("td", className);
    cell.dataset.label = label;
    return cell;
  };

  const createAreaRow = (area) => {
    const row = create("tr");
    row.dataset.knowledgeArea = area.chapter.id;
    row.dataset.knowledgeLevel = area.level.id;

    const areaCell = createCell("Knowledge area", "course-progress-chapter-cell");
    const tag = create("span", "tag", `${area.level.id.toUpperCase()} · ${area.chapter.number}`);
    const title = create("strong", "", area.chapter.title);
    const summary = create("small", "", area.chapter.summary);
    areaCell.append(tag, title, summary);

    const masteryCell = createCell("Mastery");
    const masteryCopy = create("div", "course-progress-mastery-copy");
    const masteryStrong = create("strong", "", `${area.counts.mastered}/${area.targetIds.length}`);
    const masteryPercent = create("span", "", `${area.percent}%`);
    const track = create("div", "course-progress-track");
    const fill = create("div", "course-progress-fill");
    masteryCopy.append(masteryStrong, masteryPercent);
    track.style.setProperty("--course-progress", `${area.percent}%`);
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-label", `${area.chapter.title} target mastery`);
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    track.setAttribute("aria-valuenow", String(area.percent));
    track.appendChild(fill);
    masteryCell.append(masteryCopy, track);

    const attentionCell = createCell("Needs attention");
    const attention = create("div", "course-progress-state-list");
    [["Due", area.due], ["Mistakes", area.mistakes], ["Learning", area.counts.learning]].forEach(([label, count]) => {
      const chip = create("span", "status-chip", `${label} ${count}`);
      attention.appendChild(chip);
    });
    attentionCell.appendChild(attention);

    const activityCell = createCell("Learning activity");
    const activityStrong = create("strong", "", `${area.completedObjectives}/${area.objectiveTotal} objectives`);
    const activityNote = create("small", "", `${area.passedCheckpoints}/${area.checkpointTotal} checkpoints passed`);
    activityCell.append(activityStrong, activityNote);

    const actionCell = createCell("Action", "course-progress-action-cell");
    const action = create("a", "action-link", area.due ? `Review ${area.due} due` : (area.mistakes ? "Fix mistakes" : "Open chapter"));
    action.href = area.mistakes ? "./mistakes.html" : chapterHref(area.chapter.id);
    actionCell.appendChild(action);
    row.append(areaCell, masteryCell, attentionCell, activityCell, actionCell);
    return row;
  };

  const renderAreas = (areas, levels) => {
    const body = root.querySelector("[data-knowledge-areas]");
    const filters = root.querySelector("[data-knowledge-filters]");
    body.replaceChildren(...areas.map(createAreaRow));
    const selectLevel = (levelId) => {
      body.querySelectorAll("[data-knowledge-level]").forEach((row) => {
        row.hidden = levelId !== "all" && row.dataset.knowledgeLevel !== levelId;
      });
      filters.querySelectorAll("button").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.knowledgeFilter === levelId));
      });
    };
    filters.replaceChildren(...[
      { id: "all", label: "All" },
      ...levels.map((level) => ({ id: level.id, label: level.label }))
    ].map((filter) => {
      const button = create("button", "toggle-chip", filter.label);
      button.type = "button";
      button.dataset.knowledgeFilter = filter.id;
      button.addEventListener("click", () => selectLevel(filter.id));
      return button;
    }));
    selectLevel("all");
  };

  const recommend = ({ mistakes, dueCards, dueTargets, areas, exerciseProgress }) => {
    if (mistakes.length) {
      return {
        title: `Resolve ${mistakes.length} open mistake${mistakes.length === 1 ? "" : "s"}`,
        detail: "Recent errors are the strongest signal of what will improve your next answer.",
        href: "./mistakes.html",
        label: "Practise mistakes"
      };
    }
    if (dueCards.length) {
      const limit = Math.min(10, dueCards.length);
      return {
        title: `Review ${limit} due card${limit === 1 ? "" : "s"}`,
        detail: "These saved words and phrases have reached their scheduled review time.",
        href: `./review_cards.html?quick=due&limit=${limit}#review-stage`,
        label: "Start due review"
      };
    }
    if (dueTargets.length) {
      const area = [...areas].sort((left, right) => right.due - left.due || left.percent - right.percent)[0];
      return {
        title: `Review ${area.chapter.title}`,
        detail: `${area.due} course target${area.due === 1 ? " is" : "s are"} due in this chapter.`,
        href: chapterHref(area.chapter.id),
        label: "Open chapter review"
      };
    }
    const next = [...areas].sort((left, right) => {
      const leftDiagnostic = exerciseProgress[left.diagnosticId]?.attempts ? 1 : 0;
      const rightDiagnostic = exerciseProgress[right.diagnosticId]?.attempts ? 1 : 0;
      return leftDiagnostic - rightDiagnostic || left.percent - right.percent || left.chapter.number - right.chapter.number;
    })[0];
    return {
      title: `Continue ${next.chapter.title}`,
      detail: exerciseProgress[next.diagnosticId]?.attempts
        ? `${next.counts.new} targets remain new in this knowledge area.`
        : "Its entry diagnostic is the next unfinished course step.",
      href: chapterHref(next.chapter.id),
      label: exerciseProgress[next.diagnosticId]?.attempts ? "Continue chapter" : "Start diagnostic"
    };
  };

  const renderRecommendation = (recommendation, signals) => {
    setText("[data-knowledge-next-title]", recommendation.title);
    setText("[data-knowledge-next-detail]", recommendation.detail);
    const link = root.querySelector("[data-knowledge-next-link]");
    link.href = recommendation.href;
    link.textContent = recommendation.label;
    const reasons = root.querySelector("[data-knowledge-next-reasons]");
    reasons.replaceChildren(...signals.map((signal) => create("li", "", signal)));
  };

  const initialize = async () => {
    const [course, manifest, grammar] = await Promise.all([
      loadJson(COURSE_URL), loadJson(MANIFEST_URL), loadJson(GRAMMAR_URL)
    ]);
    const targetProgress = window.MaltiExerciseRunner?.getTargetProgress?.() || {};
    const exerciseProgress = window.MaltiExerciseRunner?.getProgress?.() || {};
    const objectiveProgress = storage?.getJson(COURSE_PROGRESS_KEY, {}) || {};
    const cards = window.MaltiReviewStore?.getAllCards?.() || [];
    const dueCards = window.MaltiReviewStore?.getDueCards?.() || [];
    const mistakes = window.MaltiMistakeStore?.getOpen?.() || [];
    const chaptersById = new Map(manifest.chapters.map((chapter) => [chapter.id, chapter]));
    const areas = course.levels.flatMap((level) => level.chapters.map((chapter) => {
      const summary = chaptersById.get(chapter.id);
      const targetIds = summary.targetIds;
      const counts = countStates(targetIds, targetProgress);
      const chapterMistakes = mistakesForTargets(mistakes, targetIds).length;
      const due = targetIds.filter((id) => isDue(targetProgress[id])).length;
      const completedObjectives = chapter.objectives.filter((objective) => objectiveProgress.objectives?.[`${chapter.id}::${objective.id}`]).length;
      const passedCheckpoints = summary.checkpoints.filter((checkpoint) => exerciseProgress[checkpoint.id]?.passed === true).length;
      return {
        level,
        chapter,
        targetIds,
        counts,
        due,
        mistakes: chapterMistakes,
        percent: targetIds.length ? Math.round(counts.mastered / targetIds.length * 100) : 0,
        completedObjectives,
        objectiveTotal: chapter.objectives.length,
        passedCheckpoints,
        checkpointTotal: summary.checkpoints.length,
        diagnosticId: summary.diagnostic?.id || ""
      };
    }));
    const allTargetIds = areas.flatMap((area) => area.targetIds);
    const totals = countStates(allTargetIds, targetProgress);
    const dueTargets = allTargetIds.filter((id) => isDue(targetProgress[id]));
    const activeChapters = areas.filter((area) => area.counts.new < area.targetIds.length || area.completedObjectives || area.passedCheckpoints).length;
    const dueTotal = dueCards.length + dueTargets.length;

    setText("[data-knowledge-mastered]", totals.mastered);
    setText("[data-knowledge-due]", dueTotal);
    setText("[data-knowledge-mistakes]", mistakes.length);
    setText("[data-knowledge-metric-mastered]", totals.mastered);
    setText("[data-knowledge-metric-mastered-detail]", `${Math.round(totals.mastered / allTargetIds.length * 100)}% of ${allTargetIds.length} course targets`);
    setText("[data-knowledge-learning]", totals.learning);
    setText("[data-knowledge-metric-due]", dueTotal);
    setText("[data-knowledge-metric-mistakes]", mistakes.length);
    setText("[data-knowledge-active]", activeChapters);
    setText("[data-knowledge-summary]", `${totals.mastered} of ${allTargetIds.length} targets mastered · ${dueTargets.length} course targets due · ${mistakes.length} open mistakes`);

    renderVocabulary(cards);
    renderGrammar(grammar.targets, targetProgress, mistakes);
    renderMistakes(mistakes);
    renderAreas(areas, course.levels);
    const next = recommend({ mistakes, dueCards, dueTargets, areas, exerciseProgress });
    const signals = [
      `${mistakes.length} unresolved mistake${mistakes.length === 1 ? "" : "s"}`,
      `${dueCards.length} saved review card${dueCards.length === 1 ? "" : "s"} due`,
      `${dueTargets.length} course target${dueTargets.length === 1 ? "" : "s"} due`
    ];
    renderRecommendation(next, signals);
  };

  const start = () => initialize().catch((error) => {
    console.error("Could not initialize knowledge map", error);
    setText("[data-knowledge-next-title]", "Knowledge map could not be loaded");
    setText("[data-knowledge-next-detail]", "Open Today or Course Progress to continue studying.");
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
