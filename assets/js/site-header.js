(() => {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const REVIEW_STORAGE_KEY = "malti_review_cards_v2";
  const THEME_STORAGE_KEY = "malti_site_theme";
  const storage = window.MaltiStorage;
  const themes = [
    { value: "classic", label: "Classic" },
    { value: "forest", label: "Forest" },
    { value: "contrast", label: "Contrast" }
  ];
  const desktopReviewMedia = window.matchMedia("(min-width: 981px)");

  const getStoredTheme = () => {
    const stored = storage.getString(THEME_STORAGE_KEY, "classic");
    return themes.some((theme) => theme.value === stored) ? stored : "classic";
  };

  const applyTheme = (theme) => {
    const safeTheme = themes.some((item) => item.value === theme) ? theme : "classic";
    document.documentElement.dataset.theme = safeTheme;
    storage.setString(THEME_STORAGE_KEY, safeTheme);
  };

  applyTheme(getStoredTheme());

  const currentFile = (() => {
    const pathname = window.location.pathname || "";
    const clean = pathname.split("/").pop() || "index.html";
    return clean === "" ? "index.html" : clean;
  })();

  const groups = [
    {
      label: "Grammar",
      items: [
        ["verbs_guide.html", "Verbs"],
        ["pronouns_possessives.html", "Pronouns"],
        ["sentence_builder.html", "Sentence Builder"],
        ["modals_needs.html", "Modals"],
        ["prepositions_place.html", "Prepositions"],
        ["comparisons.html", "Comparisons"],
        ["collective_nouns.html", "Collective"],
        ["numbers_calendar_time.html", "Numbers and Time"],
        ["imperative_verbs.html", "Imperative Verbs"]
      ]
    },
    {
      label: "Vocabulary",
      items: [
        ["animals.html", "Animals"],
        ["colors_maltese.html", "Colours"],
        ["home_furniture.html", "Home and Furniture"],
        ["family_home_food.html", "Family, Home and Food"],
        ["food_preferences.html", "Food"],
        ["body_appearance.html", "Body and Appearance"],
        ["emotions.html", "Emotions"],
        ["weather.html", "Weather"]
      ]
    },
    {
      label: "Speaking",
      items: [
        ["picture_description.html", "Picture Description"],
        ["daily_routine.html", "Daily Routine"],
        ["directions_town.html", "Directions"],
        ["places_events.html", "Places and Events"],
        ["transport_travel.html", "Transport and Travel"],
        ["restaurant_ordering.html", "Restaurant"],
        ["shopping_clothes.html", "Shopping and Clothes"],
        ["health_doctor.html", "Health and Doctor"],
        ["daily_problems.html", "Daily Problems"],
        ["impactful_people.html", "Impactful People"]
      ]
    },
    {
      label: "Review",
      items: [
        ["review_cards.html", "Review Cards"],
        ["word_search.html", "Word Search"],
        ["memory_game.html", "Memory Game"],
        ["word_builder_game.html", "Word Builder"],
        ["common_mistakes.html", "Common Mistakes"]
      ]
    }
  ];

  const currentGroupLabel =
    groups.find((group) => group.items.some(([href]) => href === currentFile))?.label || null;
  const searchItems = [
    { href: "index.html", label: "Home", group: "Home" },
    ...groups.flatMap((group) =>
      group.items.map(([href, label]) => ({ href, label, group: group.label }))
    ),
    { href: "all_pages.html", label: "All Pages", group: "Home" }
  ];
  const normalizeSearch = (value) => String(value || "").trim().toLowerCase();

  const linkHtml = (href, label, extraClass = "") => {
    const current = currentFile === href ? " is-current" : "";
    return `<a class="nav-link${current}${extraClass ? ` ${extraClass}` :""}" href="./${href}">${label}</a>`;
  };

  const groupHtml = ({ label, items }) => {
    const hasCurrent = items.some(([href]) => href === currentFile);
    const itemsHtml = items
      .map(([href, text]) => {
        const current = currentFile === href ? " class=\"is-current\"" : "";
        return `<a href="./${href}"${current}>${text}</a>`;
      })
      .join("");

    return `
      <details class="nav-group${hasCurrent ?" is-current-group" : ""}"${hasCurrent ? " open" : ""}>
        <summary>${label}</summary>
        <div class="nav-menu">
          ${itemsHtml}
        </div>
      </details>
    `;
  };

  header.classList.add("nav-managed");
  header.innerHTML = `
    <a class="site-brand" href="./index.html">Maltese Study Site</a>
    <button class="site-nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav-panel">Menu</button>
    <div class="site-nav-panel" id="site-nav-panel">
      <nav class="site-nav site-nav-compact" aria-label="Primary">
        ${linkHtml("index.html", "Home")}
        ${groups.map(groupHtml).join("")}
        ${linkHtml("all_pages.html", "All Pages")}
      </nav>
      <form class="site-search" role="search" data-site-search-form>
        <input type="search" data-site-search placeholder="Search pages" aria-label="Search pages" autocomplete="off">
        <div class="site-search-results" data-site-search-results hidden></div>
      </form>
      <label class="theme-switcher">
        <span>Theme</span>
        <select data-theme-select aria-label="Choose site theme">
          ${themes.map((theme) => `<option value="${theme.value}">${theme.label}</option>`).join("")}
        </select>
      </label>
    </div>
  `;

  const toggle = header.querySelector(".site-nav-toggle");
  const panel = header.querySelector(".site-nav-panel");
  const themeSelect = header.querySelector("[data-theme-select]");
  const searchForm = header.querySelector("[data-site-search-form]");
  const searchInput = header.querySelector("[data-site-search]");
  const searchResults = header.querySelector("[data-site-search-results]");
  const detailsList = Array.from(header.querySelectorAll(".nav-group"));
  const menuLinks = Array.from(header.querySelectorAll(".nav-menu a, .site-nav-compact > .nav-link"));
  const closeTimers = new WeakMap();
  const desktopHoverMedia = window.matchMedia("(hover: hover) and (pointer: fine)");

  const isDesktopHover = () => desktopHoverMedia.matches;

  const clearCloseTimer = (details) => {
    const timer = closeTimers.get(details);
    if (timer) {
      window.clearTimeout(timer);
      closeTimers.delete(details);
    }
  };

  const scheduleClose = (details, delay = 180) => {
    clearCloseTimer(details);
    const timer = window.setTimeout(() => {
      details.open = false;
      closeTimers.delete(details);
    }, delay);
    closeTimers.set(details, timer);
  };

  const closeSearch = () => {
    if (!searchResults) return;
    searchResults.hidden = true;
    searchResults.innerHTML = "";
  };

  const searchMatches = (query) => {
    const normalized = normalizeSearch(query);

    if (!normalized) {
      return [];
    }

    return searchItems
      .filter((item) => {
        const haystack = normalizeSearch(`${item.label} ${item.group} ${item.href.replace(/[_-]/g, " ")}`);
        return haystack.includes(normalized);
      })
      .slice(0, 8);
  };

  const renderSearch = () => {
    if (!searchInput || !searchResults) return;
    const matches = searchMatches(searchInput.value);
    searchResults.innerHTML = "";

    if (!matches.length) {
      searchResults.hidden = true;
      return;
    }

    matches.forEach((item) => {
      const link = document.createElement("a");
      const title = document.createElement("strong");
      const meta = document.createElement("span");

      link.className = "site-search-result";
      link.href = `./${item.href}`;
      title.textContent = item.label;
      meta.textContent = item.group;
      link.appendChild(title);
      link.appendChild(meta);
      searchResults.appendChild(link);
    });

    searchResults.hidden = false;
  };

  if (toggle && panel) {
    toggle.addEventListener("click", () => {
      const next = !header.classList.contains("nav-open");
      header.classList.toggle("nav-open", next);
      toggle.setAttribute("aria-expanded", String(next));
    });
  }

  if (themeSelect) {
    themeSelect.value = document.documentElement.dataset.theme || "classic";
    themeSelect.addEventListener("change", () => {
      applyTheme(themeSelect.value);
    });
  }

  if (searchForm && searchInput && searchResults) {
    searchInput.addEventListener("input", renderSearch);
    searchInput.addEventListener("focus", renderSearch);
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeSearch();
        searchInput.blur();
      }
    });
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const first = searchResults.querySelector("a");
      if (first) {
        window.location.href = first.href;
      }
    });
  }

  if (currentFile === "index.html" && currentGroupLabel) {
    header.dataset.currentGroup = currentGroupLabel;
  }

  const readReviewStats = () => {
    const parsed = storage.getJson(REVIEW_STORAGE_KEY, null);
    if (!parsed || typeof parsed !== "object") {
      return { total: 0, due: 0 };
    }
    const cards = Object.values(parsed);
    const now = Date.now();
    const due = cards.filter((card) => {
      const nextReviewAt = card && card.nextReviewAt ? new Date(card.nextReviewAt).getTime() : 0;
      return Number.isFinite(nextReviewAt) && nextReviewAt <= now;
    }).length;
    return { total: cards.length, due };
  };

  const ensureReviewFab = () => {
    if (currentFile === "review_cards.html" || currentFile === "index.html") {
      return;
    }

    let fab = document.querySelector(".review-fab");
    if (!fab) {
      fab = document.createElement("a");
      fab.className = "review-fab";
      fab.href = "./review_cards.html";
      fab.setAttribute("aria-label", "Open review cards");
      fab.innerHTML = `
        <span class="review-fab__label">
          <span class="review-fab__label-full">Review</span>
          <span class="review-fab__label-short">R</span>
        </span>
        <span class="review-fab__count" hidden>
          <span class="review-fab__count-full"></span>
          <span class="review-fab__count-short"></span>
        </span>
      `;
      document.body.appendChild(fab);
    }

    const stats = readReviewStats();
    const sidebar = desktopReviewMedia.matches ? document.querySelector(".sidebar") : null;
    if (sidebar && fab) {
      const rect = sidebar.getBoundingClientRect();
      fab.classList.add("is-sidebar-aligned");
      fab.style.left = `${Math.round(rect.left)}px`;
      fab.style.top = `${Math.round(rect.bottom + 14)}px`;
      fab.style.width = `${Math.round(rect.width)}px`;
      fab.style.right = "auto";
      fab.style.bottom = "auto";
    } else if (fab) {
      fab.classList.remove("is-sidebar-aligned");
      fab.style.left = "";
      fab.style.top = "";
      fab.style.width = "";
      fab.style.right = "";
      fab.style.bottom = "";
    }

    if (fab) {
      const count = fab.querySelector(".review-fab__count");
      const countFull = fab.querySelector(".review-fab__count-full");
      const countShort = fab.querySelector(".review-fab__count-short");
      if (!count || !countFull || !countShort) return;

      if (stats.due > 0) {
        count.hidden = false;
        countFull.textContent = `${stats.due} due`;
        countShort.textContent = String(stats.due);
      } else if (stats.total > 0) {
        count.hidden = false;
        countFull.textContent = `${stats.total} saved`;
        countShort.textContent = String(stats.total);
      } else {
        count.hidden = true;
        countFull.textContent = "";
        countShort.textContent = "";
      }
    }
  };

  detailsList.forEach((details) => {
    details.addEventListener("toggle", () => {
      if (!details.open) return;
      clearCloseTimer(details);
      detailsList.forEach((other) => {
        if (other !== details) other.open = false;
      });
    });

    details.addEventListener("pointerenter", () => {
      if (!isDesktopHover()) return;
      clearCloseTimer(details);
    });

    details.addEventListener("focusout", (event) => {
      if (!isDesktopHover()) return;
      const nextTarget = event.relatedTarget;
      if (nextTarget && details.contains(nextTarget)) return;
      details.open = false;
    });

    details.addEventListener("mouseleave", () => {
      if (!isDesktopHover()) return;
      scheduleClose(details);
    });
  });

  menuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      detailsList.forEach((details) => {
        details.open = false;
      });
      header.classList.remove("nav-open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) {
      detailsList.forEach((details) => {
        details.open = false;
      });
      header.classList.remove("nav-open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
      closeSearch();
    }
  });

  ensureReviewFab();
  window.addEventListener("storage", ensureReviewFab);
  window.addEventListener("focus", ensureReviewFab);
  desktopReviewMedia.addEventListener("change", ensureReviewFab);
  window.addEventListener("resize", ensureReviewFab);
  window.addEventListener("scroll", ensureReviewFab, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      ensureReviewFab();
    }
  });
})();
