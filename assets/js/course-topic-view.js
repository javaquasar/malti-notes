(() => {
  const BINDINGS_URL = "./assets/data/course_target_bindings.json";
  const params = new URLSearchParams(window.location.search);
  const chapterId = params.get("chapter");
  if (!chapterId) return;

  let view = params.get("view") === "all" ? "all" : "chapter";
  let bindings = null;
  let lastRenderDetail = null;

  const loadBindings = async () => {
    if (bindings) return bindings;
    const response = await fetch(BINDINGS_URL);
    if (!response.ok) throw new Error(`Could not load course bindings (${response.status})`);
    bindings = await response.json();
    return bindings;
  };

  const chapterTargets = () => (bindings?.targets || []).filter((target) => (
    target.chapterId === chapterId && target.role === "core" && target.implementationStatus === "implemented"
  ));

  const updateBulkButton = (button, coreIds, showAll) => {
    if (!button.dataset.courseAllItems) button.dataset.courseAllItems = button.dataset.items || "[]";
    const allItems = JSON.parse(button.dataset.courseAllItems || "[]");
    const visibleItems = showAll ? allItems : allItems.filter((item) => coreIds.has(item.contentId));
    button.dataset.items = JSON.stringify(visibleItems);
    const isPageButton = button.hasAttribute("data-page-review-add");
    button.dataset.bulkLabel = showAll
      ? (isPageButton ? "Add all animal words" : "Add section to review")
      : (isPageButton ? "Add chapter animal words" : "Add chapter section to review");
    button.hidden = visibleItems.length === 0;

    const store = window.MaltiReviewStore;
    const unsaved = store ? visibleItems.filter((item) => !store.hasWord(item.id)).length : visibleItems.length;
    button.textContent = unsaved === 0 && visibleItems.length ? "Section saved" : button.dataset.bulkLabel;
    button.disabled = visibleItems.length === 0 || unsaved === 0;
    const status = button.parentElement?.querySelector("[data-section-status]");
    if (status) {
      status.hidden = visibleItems.length === 0;
      status.textContent = visibleItems.length
        ? `${visibleItems.length - unsaved} saved, ${unsaved} left`
        : "";
    }
  };

  const updateEmptyGroups = (showAll) => {
    document.querySelectorAll("[data-animal-group]").forEach((container) => {
      const visibleCards = Array.from(container.querySelectorAll("[data-content-id]")).filter((card) => !card.hidden);
      const reviewRow = container.previousElementSibling?.hasAttribute("data-section-review-row")
        ? container.previousElementSibling
        : null;
      const heading = reviewRow?.previousElementSibling?.matches("h4") ? reviewRow.previousElementSibling : null;
      container.hidden = !showAll && visibleCards.length === 0;
      if (reviewRow) reviewRow.hidden = container.hidden;
      if (heading) heading.hidden = container.hidden;
    });
  };

  const ensureScopeStatus = (visibleCards, totalCards, targetCount) => {
    const context = document.querySelector("[data-course-context]");
    if (!context) return;
    let status = context.querySelector("[data-course-scope-status]");
    if (!status) {
      status = document.createElement("span");
      status.className = "status-chip course-scope-status";
      status.dataset.courseScopeStatus = "";
      context.appendChild(status);
    }
    status.textContent = view === "all"
      ? `${totalCards} topic cards`
      : `${visibleCards} cards · ${targetCount} chapter targets`;
  };

  const applyView = async () => {
    if (!lastRenderDetail) return;
    await loadBindings();
    const targets = chapterTargets();
    if (!targets.length) return;
    const coreIds = new Set(targets.map((target) => target.contentRef?.itemId).filter(Boolean));
    const cards = Array.from(document.querySelectorAll("[data-content-id]"));
    const showAll = view === "all";
    let visibleCards = 0;

    cards.forEach((card) => {
      const isCore = coreIds.has(card.dataset.contentId);
      card.dataset.courseRole = isCore ? "core" : "extended";
      card.hidden = !showAll && !isCore;
      if (!card.hidden) visibleCards += 1;
    });
    document.body.classList.toggle("course-topic-chapter-view", !showAll);
    document.body.classList.toggle("course-topic-full-view", showAll);
    document.querySelectorAll('[data-course-section-role="extended"], [data-course-nav-role="extended"]')
      .forEach((element) => { element.hidden = !showAll; });
    document.querySelectorAll("[data-items]").forEach((button) => updateBulkButton(button, coreIds, showAll));
    updateEmptyGroups(showAll);
    ensureScopeStatus(visibleCards, cards.length, targets.length);
    window.dispatchEvent(new CustomEvent("malti-course-topic-view-applied", {
      detail: { chapterId, view, visibleCards, totalCards: cards.length, targetCount: targets.length }
    }));
  };

  document.addEventListener("malti-vocab-rendered", (event) => {
    lastRenderDetail = event.detail;
    applyView().catch((error) => console.error("Could not apply course topic view", error));
  });
  window.addEventListener("malti-course-view-change", (event) => {
    view = event.detail?.view === "all" ? "all" : "chapter";
    applyView().catch((error) => console.error("Could not change course topic view", error));
  });
  window.addEventListener("malti-course-context-ready", () => {
    applyView().catch((error) => console.error("Could not update course scope status", error));
  });
})();
