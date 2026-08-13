(() => {
  const DATA_URL = "./assets/data/course_path.json";
  const BINDINGS_URL = "./assets/data/course_target_bindings.json";

  const hasChapterView = (bindings, chapterId, pageHref) => bindings.targets.some((target) => (
    target.chapterId === chapterId
      && target.implementationStatus === "implemented"
      && target.contentRef?.page === pageHref
  ));

  const pageUrl = (page, level, chapter, index, bindings, view) => {
    const params = new URLSearchParams({ course: level.id, chapter: chapter.id, step: String(index + 1) });
    if (hasChapterView(bindings, chapter.id, page.href)) params.set("view", view || "chapter");
    return `./${page.href}?${params.toString()}`;
  };

  const createActionLink = (href, label) => {
    const link = document.createElement("a");
    link.className = "action-link";
    link.href = href;
    link.textContent = label;
    return link;
  };

  const createViewToggle = (initialView) => {
    const toggle = document.createElement("div");
    toggle.className = "segmented-toggle course-view-toggle";
    toggle.dataset.courseViewToggle = "";
    toggle.setAttribute("aria-label", "Choose topic scope");

    [
      { value: "chapter", label: "Chapter material" },
      { value: "all", label: "Full topic" }
    ].forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "toggle-chip";
      button.dataset.courseView = option.value;
      button.textContent = option.label;
      button.setAttribute("aria-pressed", String(initialView === option.value));
      button.addEventListener("click", () => {
        const url = new URL(window.location.href);
        url.searchParams.set("view", option.value);
        window.history.replaceState({}, "", url);
        toggle.querySelectorAll("[data-course-view]").forEach((item) => {
          item.setAttribute("aria-pressed", String(item.dataset.courseView === option.value));
        });
        window.dispatchEvent(new CustomEvent("malti-course-view-change", { detail: { view: option.value } }));
      });
      toggle.appendChild(button);
    });
    return toggle;
  };

  const renderExplicitContext = (section, label, links, match, currentFile, params, bindings) => {
    const { level, chapter } = match;
    const pageIndex = chapter.pages.findIndex((page) => page.href === currentFile);
    if (pageIndex < 0) return false;
    const page = chapter.pages[pageIndex];
    const scoped = hasChapterView(bindings, chapter.id, page.href);
    const currentView = scoped && params.get("view") === "all" ? "all" : "chapter";
    label.textContent = `${level.label} · Chapter ${chapter.number}: ${chapter.title}`;
    links.appendChild(createActionLink(`./course_chapter.html?chapter=${encodeURIComponent(chapter.id)}`, "Back to chapter"));
    if (pageIndex < chapter.pages.length - 1) {
      const nextPage = chapter.pages[pageIndex + 1];
      links.appendChild(createActionLink(pageUrl(nextPage, level, chapter, pageIndex + 1, bindings), "Next step"));
    } else {
      links.appendChild(createActionLink(`./course_chapter.html?chapter=${encodeURIComponent(chapter.id)}#chapter-test`, "Chapter test"));
    }
    section.append(label, links);
    if (scoped) section.appendChild(createViewToggle(currentView));
    section.dataset.courseChapter = chapter.id;
    section.dataset.courseView = currentView;
    return true;
  };

  const renderReferenceContext = (section, label, links, matches) => {
    label.textContent = matches.length === 1 ? "Course chapter" : "Course chapters";
    matches.forEach(({ level, chapter }) => {
      links.appendChild(createActionLink(
        `./course_chapter.html?chapter=${encodeURIComponent(chapter.id)}`,
        `${level.label} · ${chapter.number}. ${chapter.title}`
      ));
    });
    section.append(label, links);
  };

  const initialize = async () => {
    const hero = document.querySelector(".hero");
    if (!hero || document.querySelector("[data-course-context]")) return;
    const currentFile = window.location.pathname.split("/").pop() || "index.html";
    if (["course_path.html", "course_chapter.html"].includes(currentFile)) return;

    const [courseResponse, bindingResponse] = await Promise.all([fetch(DATA_URL), fetch(BINDINGS_URL)]);
    if (!courseResponse.ok || !bindingResponse.ok) return;
    const [data, bindings] = await Promise.all([courseResponse.json(), bindingResponse.json()]);
    const matches = data.levels.flatMap((level) => level.chapters
      .filter((chapter) => chapter.pages.some((page) => page.href === currentFile))
      .map((chapter) => ({ level, chapter })));
    if (!matches.length) return;

    const section = document.createElement("section");
    const label = document.createElement("strong");
    const links = document.createElement("div");
    const params = new URLSearchParams(window.location.search);
    const explicit = matches.find(({ level, chapter }) => (
      chapter.id === params.get("chapter") && (!params.get("course") || level.id === params.get("course"))
    ));
    section.className = "course-context-bar";
    section.dataset.courseContext = "";
    links.className = "course-context-links";

    if (!explicit || !renderExplicitContext(section, label, links, explicit, currentFile, params, bindings)) {
      renderReferenceContext(section, label, links, matches);
    }
    hero.insertAdjacentElement("afterend", section);
    window.dispatchEvent(new CustomEvent("malti-course-context-ready", {
      detail: { chapterId: explicit?.chapter.id || null, view: section.dataset.courseView || null }
    }));
  };

  const start = () => initialize().catch((error) => console.warn("Course context could not be loaded.", error));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
