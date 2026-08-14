(() => {
  const COURSE_URL = "./assets/data/course_path.json";
  const MANIFEST_URL = "./assets/data/course/manifest.json";
  const TARGET_PROGRESS_KEY = "malti_course_target_progress_v1";
  const EXERCISE_PROGRESS_KEY = "malti_exercise_progress_v1";
  const MINUTES_KEY = "malti_today_minutes_v1";
  const storage = window.MaltiStorage;
  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = String(value);
  };
  const setLink = (selector, href, label) => {
    const link = document.querySelector(selector);
    if (!link) return;
    link.href = href;
    if (label) link.textContent = label;
  };
  const loadJson = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not load ${url} (${response.status})`);
    return response.json();
  };
  const isDue = (target) => window.MaltiExerciseRunner?.isTargetDue?.(target) ?? target?.state === "review";
  const chapterHref = (id) => `./course_chapter.html?chapter=${encodeURIComponent(id)}#chapter-assessments`;

  function chooseNextChapter(course, manifest, targetProgress, exerciseProgress) {
    const chapters = course.levels.flatMap((level) => level.chapters.map((chapter) => ({ level, chapter })));
    return chapters.map(({ level, chapter }) => {
      const summary = manifest.chapters.find((item) => item.id === chapter.id);
      const due = summary.targetIds.filter((id) => isDue(targetProgress[id])).length;
      const mastered = summary.targetIds.filter((id) => targetProgress[id]?.state === "mastered").length;
      const diagnosticAttempted = Boolean(exerciseProgress[summary.diagnostic?.id]?.attempts);
      const nextCheckpoint = summary.checkpoints.find((checkpoint) => exerciseProgress[checkpoint.id]?.passed !== true);
      let priority = 4;
      let status = "Chapter complete";
      if (due) { priority = 0; status = `${due} targets due`; }
      else if (!diagnosticAttempted) { priority = 1; status = "Entry diagnostic"; }
      else if (nextCheckpoint) { priority = 2; status = `Checkpoint ${nextCheckpoint.sequence}`; }
      else if (mastered < summary.targetIds.length) { priority = 3; status = `${mastered}/${summary.targetIds.length} mastered`; }
      return { level, chapter, summary, due, mastered, priority, status };
    }).sort((left, right) => left.priority - right.priority || left.level.id.localeCompare(right.level.id) || left.chapter.number - right.chapter.number)[0];
  }

  function wireDuration(update) {
    const buttons = [...document.querySelectorAll("[data-today-duration] button")];
    let minutes = Number(storage.getString(MINUTES_KEY, "20"));
    if (![10, 20, 30].includes(minutes)) minutes = 20;
    const select = (next) => {
      minutes = next;
      storage.setString(MINUTES_KEY, String(minutes));
      buttons.forEach((button) => button.setAttribute("aria-pressed", String(Number(button.dataset.minutes) === minutes)));
      update(minutes);
    };
    buttons.forEach((button) => button.addEventListener("click", () => select(Number(button.dataset.minutes))));
    select(minutes);
  }

  async function initialize() {
    const [course, manifest] = await Promise.all([loadJson(COURSE_URL), loadJson(MANIFEST_URL)]);
    const reviewDue = window.MaltiReviewStore.getDueCards();
    const targetProgress = storage.getJson(TARGET_PROGRESS_KEY, {}) || {};
    const exerciseProgress = storage.getJson(EXERCISE_PROGRESS_KEY, {}) || {};
    const allTargetIds = manifest.chapters.flatMap((chapter) => chapter.targetIds);
    const dueTargetIds = allTargetIds.filter((id) => isDue(targetProgress[id]));
    const mastered = allTargetIds.filter((id) => targetProgress[id]?.state === "mastered").length;
    const next = chooseNextChapter(course, manifest, targetProgress, exerciseProgress);
    const dueChapter = manifest.chapters
      .map((chapter) => ({ chapter, due: chapter.targetIds.filter((id) => dueTargetIds.includes(id)).length }))
      .sort((left, right) => right.due - left.due)[0];

    setText("[data-today-ready]", reviewDue.length + dueTargetIds.length);
    setText("[data-today-mastered]", mastered);
    setText("[data-today-review-count]", `${reviewDue.length} due`);
    setText("[data-today-review-detail]", reviewDue.length
      ? reviewDue.slice(0, 3).map((card) => card.maltese || card.prompt).join(" · ")
      : "No saved cards are due right now.");
    setText("[data-today-target-count]", `${dueTargetIds.length} due`);
    setText("[data-today-target-detail]", dueTargetIds.length
      ? `${dueChapter.due} due in ${dueChapter.chapter.title}`
      : "No book targets are due right now.");
    if (dueTargetIds.length) setLink("[data-today-target-link]", chapterHref(dueChapter.chapter.id), "Review chapter");

    setText("[data-today-chapter-title]", next.chapter.title);
    setText("[data-today-chapter-status]", `${next.level.label} · ${next.status}`);
    setText("[data-today-chapter-detail]", next.chapter.summary);
    setLink("[data-today-chapter-link]", chapterHref(next.chapter.id), next.priority === 1 ? "Start diagnostic" : "Continue chapter");

    wireDuration((minutes) => {
      const reviewLimit = Math.max(5, Math.round(minutes / 2));
      const reviewHref = `./review_cards.html?quick=due&limit=${reviewLimit}#review-stage`;
      setLink("[data-today-review-link]", reviewDue.length ? reviewHref : "./review_cards.html", reviewDue.length ? `Study up to ${reviewLimit}` : "Open review");
      if (reviewDue.length) {
        setText("[data-today-title]", `Review ${Math.min(reviewLimit, reviewDue.length)} due cards`);
        setText("[data-today-detail]", `Start with spaced review, then continue ${next.chapter.title} if time remains.`);
        setLink("[data-today-primary]", reviewHref, "Start session");
      } else if (dueTargetIds.length) {
        setText("[data-today-title]", `Review ${dueChapter.chapter.title}`);
        setText("[data-today-detail]", `${dueChapter.due} book targets are ready for another attempt.`);
        setLink("[data-today-primary]", chapterHref(dueChapter.chapter.id), "Start course review");
      } else {
        setText("[data-today-title]", `Continue ${next.chapter.title}`);
        setText("[data-today-detail]", `${minutes} minutes is enough for the next ${next.status.toLocaleLowerCase()}.`);
        setLink("[data-today-primary]", chapterHref(next.chapter.id), next.priority === 1 ? "Start diagnostic" : "Continue chapter");
      }
    });
  }

  const start = () => initialize().catch((error) => {
    console.error("Could not build today's study session", error);
    setText("[data-today-title]", "Today's session could not be prepared");
    setText("[data-today-detail]", "Open the learning path or shared review to continue studying.");
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
