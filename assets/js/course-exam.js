(() => {
  const DATA_URL = "./assets/data/course_milestone_assessments.json";
  const root = document.querySelector("[data-course-exam-root]");
  if (!root) return;
  const stage = root.querySelector("[data-course-exam-stage]");
  let data = null;

  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = String(value);
  };

  async function selectSet(setId) {
    const set = data.sets.find((candidate) => candidate.id === setId);
    if (!set) return;
    root.querySelectorAll("[data-exam-set]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.examSet === setId)));
    setText("[data-exam-items]", set.itemCount);
    setText("[data-exam-chapters]", set.chapterCount);
    setText("[data-exam-targets]", set.targetCount);
    setText("[data-exam-balance]", `${set.modeCounts.recognition} recognition and ${set.modeCounts.production} production questions.`);
    stage.removeAttribute("data-exercise-rendered");
    stage.dataset.exerciseSet = set.id;
    stage.dataset.exerciseSrc = DATA_URL;
    stage.dataset.autoSaveMissed = "true";
    stage.replaceChildren();
    await window.MaltiExerciseRunner.scan(root);
  }

  async function initialize() {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`Could not load milestone tests (${response.status})`);
    data = await response.json();
    root.querySelectorAll("[data-exam-set]").forEach((button) => button.addEventListener("click", () => selectSet(button.dataset.examSet)));
    await selectSet("course-milestone-b1");
  }

  initialize().catch((error) => {
    console.error(error);
    stage.textContent = "Milestone tests could not be loaded.";
  });
})();
