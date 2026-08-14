(function () {
  function makeCell(tagName, text) {
    const cell = document.createElement(tagName);
    cell.textContent = text;
    return cell;
  }

  function renderParadigm(paradigm) {
    const details = document.createElement("details");
    details.className = "course-verb-paradigm";
    details.dataset.courseVerbParadigm = paradigm.id;

    const summary = document.createElement("summary");
    const title = document.createElement("span");
    title.className = "course-verb-paradigm-title";
    title.textContent = paradigm.lemma;
    const meaning = document.createElement("span");
    meaning.className = "muted";
    meaning.textContent = paradigm.meaning;
    summary.append(title, meaning);
    details.appendChild(summary);

    const body = document.createElement("div");
    body.className = "course-verb-paradigm-body";
    const tableWrap = document.createElement("div");
    tableWrap.className = "course-verb-table-wrap";
    const table = document.createElement("table");
    table.className = "table-soft course-verb-table";
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    ["Mode", "Person", "Maltese", "Meaning"].forEach((label) => headRow.appendChild(makeCell("th", label)));
    head.appendChild(headRow);
    table.appendChild(head);

    const tbody = document.createElement("tbody");
    paradigm.forms.forEach(function (form) {
      const row = document.createElement("tr");
      row.dataset.courseVerbForm = form.id;
      row.appendChild(makeCell("td", form.mode));
      row.appendChild(makeCell("td", form.person));
      const formCell = makeCell("td", form.form);
      formCell.className = "course-verb-form";
      row.appendChild(formCell);
      row.appendChild(makeCell("td", form.englishPrompt));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    body.appendChild(tableWrap);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "action-button course-verb-review-button";
    button.textContent = "Add paradigm to review";
    button.addEventListener("click", function () {
      const saved = window.MaltiReviewStore?.addVerbParadigm(paradigm) || [];
      button.textContent = `${saved.length} forms added`;
      button.disabled = true;
      button.classList.add("is-added");
    });
    body.appendChild(button);
    details.appendChild(body);
    return details;
  }

  function setActiveBook(root, book) {
    root.querySelectorAll("[data-course-verb-book]").forEach(function (button) {
      const active = button.dataset.courseVerbBook === book;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    root.querySelectorAll("[data-course-verb-list]").forEach(function (list) {
      list.hidden = list.dataset.courseVerbList !== book;
    });
  }

  async function init() {
    const root = document.querySelector("[data-course-verb-paradigms]");
    if (!root) return;

    const response = await fetch("./assets/data/course_verb_paradigms.json");
    if (!response.ok) throw new Error("Could not load course verb paradigms.");
    const data = await response.json();

    ["B1", "B2"].forEach(function (book) {
      const list = root.querySelector(`[data-course-verb-list="${book}"]`);
      data.paradigms
        .filter((paradigm) => paradigm.book === book)
        .forEach((paradigm) => list.appendChild(renderParadigm(paradigm)));
    });

    root.querySelectorAll("[data-course-verb-book]").forEach(function (button) {
      button.addEventListener("click", function () {
        setActiveBook(root, button.dataset.courseVerbBook);
      });
    });
    setActiveBook(root, "B1");
    root.dataset.ready = "true";
  }

  document.addEventListener("DOMContentLoaded", init);
}());
