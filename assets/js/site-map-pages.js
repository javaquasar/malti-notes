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

  ready.then((siteMap) => {
    const featured = [...siteMap.standalone, ...siteMap.groups.flatMap((group) => group.pages)]
      .filter((page) => Number.isFinite(page.featured))
      .sort((a, b) => a.featured - b.featured);

    renderCards(document.querySelector("[data-site-map-featured]"), featured);

    siteMap.groups.forEach((group) => {
      renderCards(document.querySelector(`[data-site-map-group="${group.id}"]`), group.pages);
    });
  }).catch((error) => {
    console.error("Could not render the site directory", error);
  });
})();
