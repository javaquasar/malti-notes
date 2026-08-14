(() => {
  const DATA_URL = "./assets/data/grammar_targets.json";
  const root = document.querySelector("[data-grammar-path-root]");
  if (!root) return;

  const targetGrid = root.querySelector("[data-grammar-targets]");
  const status = root.querySelector("[data-grammar-status]");
  const params = new URLSearchParams(window.location.search);
  const chapterId = params.get("chapter");
  let data = null;
  let level = "all";

  const create = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  const practiceSet = (target) => ({
    id: `${target.id}-focused-practice`,
    chapterId: target.chapterId,
    kind: "grammar-practice",
    category: "grammar",
    ruleId: target.id,
    title: `${target.title} Practice`,
    passPercent: 75,
    items: ["recognition", "production"].map((mode) => ({
      ...target.assessment[mode],
      id: `${target.id}-focused-${mode}`,
      assessmentMode: mode,
      targetIds: [target.id],
      category: "grammar",
      ruleId: target.id,
      reviewCard: {
        maltese: target.pattern,
        english: target.summary,
        example: target.examples[0].maltese
      }
    }))
  });

  const progressLabel = (targetId) => {
    const progress = window.MaltiExerciseRunner?.getTargetProgress?.()[targetId];
    if (!progress) return "Not started";
    if (progress.state === "mastered") return "Mastered";
    if (progress.state === "review") return "Review due";
    return "Learning";
  };

  const sourceLabel = (target) => target.sourceRef.kind === "book-grammar-topic"
    ? `${target.book} book topic`
    : "Site extension";

  const buildTarget = (target) => {
    const article = create("article", "grammar-target");
    const header = create("header", "grammar-target-header");
    const headingCopy = create("div");
    const tag = create("span", "tag", sourceLabel(target));
    const heading = create("h3", "", target.title);
    const summary = create("p", "muted", target.summary);
    const progress = create("span", "status-chip", progressLabel(target.id));
    const rule = create("div", "grammar-rule-box");
    const ruleLabel = create("strong", "", "Rule");
    const ruleText = create("p", "", target.rule);
    const pattern = create("code", "grammar-pattern", target.pattern);
    const examples = create("div", "grammar-example-list");
    const mistake = create("p", "grammar-mistake");
    const practice = create("details", "grammar-practice");
    const practiceSummary = create("summary", "", "Check recognition and production");
    const practiceRoot = create("div");

    article.id = target.id;
    article.dataset.contentId = target.id;
    article.dataset.grammarBook = target.book;
    progress.dataset.grammarProgress = target.id;
    headingCopy.append(tag, heading, summary);
    header.append(headingCopy, progress);
    rule.append(ruleLabel, ruleText, pattern);
    target.examples.forEach((example) => {
      const row = create("div", "grammar-example-row");
      const maltese = create("code", "", example.maltese);
      const copy = create("span", "");
      const english = create("strong", "", example.english);
      const note = create("small", "", example.note);
      copy.append(english, note);
      row.append(maltese, copy);
      examples.appendChild(row);
    });
    mistake.innerHTML = `<strong>Watch for:</strong> ${target.commonMistake}`;
    practiceRoot.dataset.autoSaveMissed = "true";
    practice.append(practiceSummary, practiceRoot);
    practice.addEventListener("toggle", () => {
      if (!practice.open || practiceRoot.dataset.exerciseRendered === "true") return;
      window.MaltiExerciseRunner?.render(practiceRoot, practiceSet(target));
    });
    article.append(header, rule, examples, mistake, practice);
    return article;
  };

  const visibleTargets = () => data.targets.filter((target) => (
    chapterId ? target.chapterId === chapterId : (level === "all" || target.book === level)
  ));

  const render = () => {
    const targets = visibleTargets();
    targetGrid.replaceChildren(...targets.map(buildTarget));
    status.textContent = chapterId
      ? `${targets.length} tracked grammar target for this course chapter.`
      : `${targets.length} tracked grammar targets shown.`;
    root.querySelector("[data-grammar-levels]").hidden = Boolean(chapterId);
    window.dispatchEvent(new CustomEvent("malti-vocab-rendered"));
    const requested = window.location.hash ? document.querySelector(window.location.hash) : null;
    requested?.scrollIntoView({ block: "start" });
  };

  const updateProgress = () => {
    root.querySelectorAll("[data-grammar-progress]").forEach((chip) => {
      chip.textContent = progressLabel(chip.dataset.grammarProgress);
    });
  };

  root.querySelectorAll("[data-grammar-level]").forEach((button) => button.addEventListener("click", () => {
    level = button.dataset.grammarLevel;
    root.querySelectorAll("[data-grammar-level]").forEach((candidate) => {
      candidate.setAttribute("aria-pressed", String(candidate === button));
    });
    render();
  }));
  window.addEventListener("malti-course-target-progress", updateProgress);

  fetch(DATA_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`Could not load grammar targets (${response.status})`);
      return response.json();
    })
    .then((value) => {
      data = value;
      const bookCount = data.targets.filter((target) => target.sourceRef.kind === "book-grammar-topic").length;
      document.querySelector("[data-grammar-count]").textContent = String(data.targets.length);
      document.querySelector("[data-grammar-book-count]").textContent = String(bookCount);
      document.querySelector("[data-grammar-extension-count]").textContent = String(data.targets.length - bookCount);
      render();
    })
    .catch((error) => {
      console.error(error);
      status.textContent = "Grammar targets could not be loaded.";
    });
})();
