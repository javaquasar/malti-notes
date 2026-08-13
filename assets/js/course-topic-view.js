(() => {
  const BINDINGS_URL = "./assets/data/course_target_bindings.json";
  const params = new URLSearchParams(window.location.search);
  const chapterId = params.get("chapter");
  if (!chapterId) return;

  const currentFile = window.location.pathname.split("/").pop() || "index.html";
  let view = params.get("view") === "all" ? "all" : "chapter";
  let bindings = null;

  const loadBindings = async () => {
    if (bindings) return bindings;
    const response = await fetch(BINDINGS_URL);
    if (!response.ok) throw new Error(`Could not load course bindings (${response.status})`);
    bindings = await response.json();
    return bindings;
  };

  const chapterTargets = () => (bindings?.targets || []).filter((target) => (
    target.chapterId === chapterId
      && target.role === "core"
      && target.implementationStatus === "implemented"
      && target.contentRef?.page === currentFile
  ));

  const parseItems = (button, name) => {
    try {
      return JSON.parse(button.dataset[name] || "[]");
    } catch (error) {
      console.warn("Could not read review items for course scope", error);
      return [];
    }
  };

  const updateBulkButton = (button, coreIds, showAll) => {
    if (!button.dataset.courseAllItems) button.dataset.courseAllItems = button.dataset.items || "[]";
    if (!button.dataset.courseDefaultLabel) button.dataset.courseDefaultLabel = button.dataset.bulkLabel || "Add section to review";
    const allItems = parseItems(button, "courseAllItems");
    const visibleItems = showAll ? allItems : allItems.filter((item) => coreIds.has(item.contentId));
    const isPageButton = button.hasAttribute("data-page-review-add");
    const label = showAll
      ? button.dataset.courseDefaultLabel
      : (isPageButton ? "Add chapter words to review" : "Add chapter section to review");

    button.dataset.items = JSON.stringify(visibleItems);
    button.dataset.bulkLabel = label;
    button.hidden = !showAll && visibleItems.length === 0;

    const store = window.MaltiReviewStore;
    const unsaved = store ? visibleItems.filter((item) => !store.hasWord(item.id)).length : visibleItems.length;
    button.textContent = unsaved === 0 && visibleItems.length ? "Section saved" : label;
    button.disabled = visibleItems.length === 0 || unsaved === 0;
    const status = button.parentElement?.querySelector("[data-section-status]");
    if (status) {
      status.hidden = !showAll && visibleItems.length === 0;
      status.textContent = visibleItems.length ? `${visibleItems.length - unsaved} saved, ${unsaved} left` : "";
    }
  };

  const updateContentGroups = (showAll) => {
    document.querySelectorAll("[data-course-content-group], [data-course-static-scope]").forEach((container) => {
      const items = Array.from(container.querySelectorAll("[data-content-id]"));
      if (!items.length) return;
      const hasVisibleItem = items.some((item) => !item.hidden);
      container.hidden = !showAll && !hasVisibleItem;

      const reviewRow = container.previousElementSibling?.hasAttribute("data-section-review-row")
        ? container.previousElementSibling
        : null;
      const heading = reviewRow?.previousElementSibling?.matches("h3, h4")
        ? reviewRow.previousElementSibling
        : (container.previousElementSibling?.matches("h3, h4") ? container.previousElementSibling : null);
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
      ? `${totalCards} topic items`
      : `${visibleCards} items · ${targetCount} chapter targets`;
  };

  const applyView = async () => {
    await loadBindings();
    const targets = chapterTargets();
    if (!targets.length) return;

    const coreIds = new Set(targets.map((target) => target.contentRef?.itemId).filter(Boolean));
    const cards = Array.from(document.querySelectorAll("[data-content-id]"));
    const showAll = view === "all";
    cards.forEach((card) => {
      const isCore = coreIds.has(card.dataset.contentId);
      card.dataset.courseRole = isCore ? "core" : "extended";
      card.hidden = !showAll && !isCore;
    });

    const allIds = new Set(cards.map((card) => card.dataset.contentId).filter(Boolean));
    const visibleIds = new Set(cards.filter((card) => !card.hidden).map((card) => card.dataset.contentId).filter(Boolean));
    document.body.classList.toggle("course-topic-chapter-view", !showAll);
    document.body.classList.toggle("course-topic-full-view", showAll);
    document.querySelectorAll('[data-course-section-role="extended"], [data-course-nav-role="extended"]')
      .forEach((element) => { element.hidden = !showAll; });
    document.querySelectorAll("[data-items]").forEach((button) => updateBulkButton(button, coreIds, showAll));
    updateContentGroups(showAll);
    ensureScopeStatus(visibleIds.size, allIds.size, targets.length);
    window.dispatchEvent(new CustomEvent("malti-course-topic-view-applied", {
      detail: {
        chapterId,
        page: currentFile,
        view,
        visibleCards: visibleIds.size,
        totalCards: allIds.size,
        targetCount: targets.length
      }
    }));
  };

  const applySafely = () => applyView().catch((error) => console.error("Could not apply course topic view", error));
  document.addEventListener("malti-vocab-rendered", applySafely);
  document.addEventListener("malti-vocab-table-rendered", applySafely);
  window.addEventListener("malti-course-view-change", (event) => {
    view = event.detail?.view === "all" ? "all" : "chapter";
    applySafely();
  });
  window.addEventListener("malti-course-context-ready", applySafely);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", applySafely, { once: true });
  else applySafely();
})();
