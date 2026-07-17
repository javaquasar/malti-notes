(() => {
  const ready = window.MaltiSiteMapReady;
  if (!ready) return;

  const createCard = (page) => {
    const article = document.createElement("article");
    const heading = document.createElement("h3");
    const link = document.createElement("a");
    const description = document.createElement("p");

    article.className = "page-card";
    link.href = `./${page.href}`;
    link.textContent = page.label;
    description.textContent = page.description;
    heading.appendChild(link);
    article.appendChild(heading);
    article.appendChild(description);
    return article;
  };

  const renderCards = (container, pages) => {
    if (!container) return;
    container.replaceChildren(...pages.map(createCard));
  };

  const createCluster = (group) => {
    const section = document.createElement("section");
    const tag = document.createElement("span");
    const heading = document.createElement("h2");
    const grid = document.createElement("div");

    section.className = "section";
    section.id = `${group.id}-cluster`;
    tag.className = "tag";
    tag.textContent = group.label;
    heading.textContent = group.heading;
    grid.className = "home-page-grid";
    grid.replaceChildren(...group.pages.map(createCard));
    section.append(tag, heading, grid);
    return section;
  };

  const createJump = (group) => {
    const link = document.createElement("a");
    link.className = "action-link";
    link.href = `#${group.id}-cluster`;
    link.textContent = group.label;
    return link;
  };

  ready.then((siteMap) => {
    const featured = [...siteMap.standalone, ...siteMap.groups.flatMap((group) => group.pages)]
      .filter((page) => Number.isFinite(page.featured))
      .sort((a, b) => a.featured - b.featured);

    renderCards(document.querySelector("[data-site-map-featured]"), featured);

    const jumps = document.querySelector("[data-site-map-jumps]");
    if (jumps) jumps.replaceChildren(...siteMap.groups.map(createJump));

    const directory = document.querySelector("[data-site-map-directory]");
    if (directory) directory.replaceChildren(...siteMap.groups.map(createCluster));

    siteMap.groups.forEach((group) => {
      renderCards(document.querySelector(`[data-site-map-group="${group.id}"]`), group.pages);
    });
  }).catch((error) => {
    console.error("Could not render the site directory", error);
  });
})();
