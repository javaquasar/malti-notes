(() => {
  const initialize = async () => {
    const hero = document.querySelector(".hero");
    if (!hero || document.querySelector("[data-course-context]")) return;

    const currentFile = window.location.pathname.split("/").pop() || "index.html";
    if (currentFile === "course_path.html") return;

    const response = await fetch("./assets/data/course_path.json");
    if (!response.ok) return;
    const data = await response.json();
    const matches = data.levels.flatMap((level) => (
      level.chapters
        .filter((chapter) => chapter.pages.some((page) => page.href === currentFile))
        .map((chapter) => ({ level, chapter }))
    ));
    if (!matches.length) return;

    const section = document.createElement("section");
    const label = document.createElement("strong");
    const links = document.createElement("div");

    section.className = "course-context-bar";
    section.dataset.courseContext = "";
    label.textContent = matches.length === 1 ? "Course chapter" : "Course chapters";
    links.className = "course-context-links";

    matches.forEach(({ level, chapter }) => {
      const link = document.createElement("a");
      link.className = "action-link";
      link.href = `./course_path.html#${chapter.id}`;
      link.textContent = `${level.label} · ${chapter.number}. ${chapter.title}`;
      links.appendChild(link);
    });

    section.append(label, links);
    hero.insertAdjacentElement("afterend", section);
  };

  const start = () => initialize().catch((error) => {
    console.warn("Course context could not be loaded.", error);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
