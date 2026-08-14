(() => {
  const store = window.MaltiMistakeStore;
  const root = document.querySelector("[data-mistake-root]");
  if (!store || !root) return;

  let filter = "open";
  let current = null;
  let revealed = false;
  const get = (selector) => root.querySelector(selector);
  const setText = (selector, value) => {
    const element = get(selector) || document.querySelector(selector);
    if (element) element.textContent = String(value);
  };

  function sourceHref(entry) {
    if (!entry.sourcePage) return "./course_path.html";
    return entry.sourcePage.startsWith(".") ? entry.sourcePage : `./${entry.sourcePage}`;
  }

  function renderList(entries) {
    const list = get("[data-mistake-list]");
    const visible = entries.filter((entry) => filter === "all" || entry.status === filter);
    list.innerHTML = "";
    visible.forEach((entry) => {
      const article = document.createElement("article");
      const heading = document.createElement("h3");
      const meta = document.createElement("p");
      const answer = document.createElement("p");
      const link = document.createElement("a");
      article.className = "mistake-entry";
      heading.textContent = entry.prompt;
      meta.className = "mini";
      meta.textContent = `${entry.topic} | ${entry.status === "resolved" ? "Resolved" : `${entry.correctStreak || 0}/2 correct`} | ${entry.wrongCount} missed`;
      answer.textContent = `Correct answer: ${entry.correctAnswer}`;
      link.className = "action-link";
      link.href = sourceHref(entry);
      link.textContent = "Open source practice";
      article.append(heading, meta, answer, link);
      list.appendChild(article);
    });
    get("[data-mistake-empty]").hidden = visible.length > 0;
  }

  function renderPractice(entries) {
    const open = entries.filter((entry) => entry.status === "open");
    if (!current || !open.some((entry) => entry.id === current.id)) current = open[0] || null;
    revealed = false;
    const revealButton = get("[data-mistake-reveal]");
    const againButton = get("[data-mistake-again]");
    const correctButton = get("[data-mistake-correct]");
    const answer = get("[data-mistake-answer]");
    revealButton.hidden = !current;
    againButton.hidden = true;
    correctButton.hidden = true;
    answer.hidden = true;
    setText("[data-mistake-prompt]", current?.prompt || "No open mistakes");
    setText("[data-mistake-topic]", current ? `${current.topic} | ${current.correctStreak || 0}/2 correct attempts` : "Complete a course check to start the journal.");
    setText("[data-mistake-correct-answer]", current?.correctAnswer || "");
    setText("[data-mistake-explanation]", current?.explanation || "");
  }

  function render() {
    const entries = store.getAll();
    const open = entries.filter((entry) => entry.status === "open");
    setText("[data-mistake-open]", open.length);
    setText("[data-mistake-resolved]", entries.length - open.length);
    setText("[data-mistake-attempts]", entries.reduce((total, entry) => total + entry.attempts, 0));
    renderList(entries);
    renderPractice(entries);
  }

  get("[data-mistake-reveal]").addEventListener("click", () => {
    if (!current) return;
    revealed = true;
    get("[data-mistake-answer]").hidden = false;
    get("[data-mistake-reveal]").hidden = true;
    get("[data-mistake-again]").hidden = false;
    get("[data-mistake-correct]").hidden = false;
  });
  get("[data-mistake-again]").addEventListener("click", () => {
    if (current && revealed) store.recordAttempt(current, false);
    render();
  });
  get("[data-mistake-correct]").addEventListener("click", () => {
    if (current && revealed) store.recordAttempt(current, true);
    render();
  });
  root.querySelectorAll("[data-mistake-filter]").forEach((button) => button.addEventListener("click", () => {
    filter = button.dataset.mistakeFilter;
    root.querySelectorAll("[data-mistake-filter]").forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
    renderList(store.getAll());
  }));
  get("[data-mistake-clear]").addEventListener("click", () => {
    store.removeResolved();
    render();
  });
  window.addEventListener("malti-mistake-journal", render);
  render();
})();
