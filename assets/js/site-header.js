(async () => {
  const scriptBaseUrl = new URL(".", document.currentScript?.src || window.location.href);
  const params = new URLSearchParams(window.location.search);
  if (params.has("chapter") && params.has("view") && !document.querySelector('script[src$="/course-topic-view.js"]')) {
    const courseTopicScript = document.createElement("script");
    courseTopicScript.src = "./assets/js/course-topic-view.js";
    document.body.appendChild(courseTopicScript);
  }

  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "./manifest.webmanifest";
    document.head.appendChild(manifest);
  }

  if ("serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").then((registration) => {
        const showUpdate = (worker) => {
          if (!navigator.serviceWorker.controller || !worker) return;
          let notice = document.querySelector(".site-update-notice");
          if (!notice) {
            notice = document.createElement("div");
            notice.className = "site-update-notice";
            notice.setAttribute("role", "status");
            notice.innerHTML = '<span>New site version is ready.</span><button type="button">Reload</button>';
            notice.querySelector("button").addEventListener("click", () => worker.postMessage({ type: "SKIP_WAITING" }));
            document.body.appendChild(notice);
          }
        };
        if (registration.waiting) showUpdate(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed") showUpdate(worker);
          });
        });
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      }).catch((error) => console.warn("Offline support could not be enabled.", error));
    }, { once: true });
  }

  const syncScrollableRegions = () => {
    document.querySelectorAll("table, #key-verbs > .study-card").forEach((element) => {
      const style = getComputedStyle(element);
      const scrollsHorizontally = ["auto", "scroll"].includes(style.overflowX)
        && element.scrollWidth > element.clientWidth + 1;

      if (scrollsHorizontally && !element.hasAttribute("tabindex")) {
        element.tabIndex = 0;
        element.dataset.scrollFocusManaged = "true";
      } else if (!scrollsHorizontally && element.dataset.scrollFocusManaged === "true") {
        element.removeAttribute("tabindex");
        delete element.dataset.scrollFocusManaged;
      }
    });
  };
  let scrollSyncScheduled = false;
  const scheduleScrollableRegionSync = () => {
    if (scrollSyncScheduled) return;
    scrollSyncScheduled = true;
    requestAnimationFrame(() => {
      scrollSyncScheduled = false;
      syncScrollableRegions();
    });
  };

  scheduleScrollableRegionSync();
  new MutationObserver(scheduleScrollableRegionSync).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("resize", scheduleScrollableRegionSync);

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

  const loadSiteMap = async () => {
    const response = await fetch("./assets/data/site-map.json");
    if (!response.ok) {
      throw new Error(`Could not load site map (${response.status})`);
    }
    return response.json();
  };
  window.MaltiSiteMapReady = window.MaltiSiteMapReady || loadSiteMap();

  let siteMap;
  try {
    siteMap = await window.MaltiSiteMapReady;
  } catch (error) {
    console.error("Could not initialize site navigation", error);
    return;
  }

  const groups = siteMap.groups.map((group) => ({
    ...group,
    items: group.pages.map((page) => ({
      ...page,
      label: page.navLabel || page.label
    }))
  }));

  const currentGroup = groups.find((group) => group.items.some((item) => item.href === currentFile)) || null;
  const currentGroupLabel = currentGroup?.label || null;
  const searchItems = [
    ...siteMap.standalone.map((item) => ({ ...item, group: "Home" })),
    ...groups.flatMap((group) =>
      group.items.map((item) => ({ ...item, group: group.label }))
    )
  ];
  const normalizeSearch = (value) => String(value || "")
    .toLocaleLowerCase("mt")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[ċ]/g, "c")
    .replace(/[ġ]/g, "g")
    .replace(/[ħ]/g, "h")
    .replace(/[ż]/g, "z")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  let contentSearchPromise = null;
  const loadContentSearch = () => {
    if (!contentSearchPromise) {
      contentSearchPromise = fetch("./assets/data/search-index.json")
        .then((response) => {
          if (!response.ok) throw new Error(`Could not load search index (${response.status})`);
          return response.json();
        })
        .then((data) => data.entries || [])
        .catch((error) => {
          console.warn("Full-content search is unavailable.", error);
          return [];
        });
    }
    return contentSearchPromise;
  };

  const linkHtml = (href, label, extraClass = "") => {
    const current = currentFile === href ? " is-current" : "";
    return `<a class="nav-link${current}${extraClass ? ` ${extraClass}` :""}" href="./${href}">${label}</a>`;
  };

  const groupHtml = ({ label, items }) => {
    const hasCurrent = items.some((item) => item.href === currentFile);
    const itemsHtml = items
      .map((item) => {
        const current = currentFile === item.href ? " class=\"is-current\"" : "";
        return `<a href="./${item.href}"${current}>${item.label}</a>`;
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
        <input type="search" role="combobox" data-site-search placeholder="Search site content" aria-label="Search site content" aria-controls="site-search-results" aria-expanded="false" aria-autocomplete="list" autocomplete="off">
        <div class="site-search-results" id="site-search-results" role="listbox" data-site-search-results hidden></div>
      </form>
      <label class="theme-switcher">
        <span>Theme</span>
        <select data-theme-select aria-label="Choose site theme">
          ${themes.map((theme) => `<option value="${theme.value}">${theme.label}</option>`).join("")}
        </select>
      </label>
      <div data-cloud-account-host></div>
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

  const loadScript = (url) => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") resolve();
      else existing.addEventListener("load", resolve, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = url;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.head.appendChild(script);
  });

  const initializeCloudSync = async () => {
    const response = await fetch("./assets/data/firebase-config.json");
    if (!response.ok) throw new Error(`Could not load Firebase configuration (${response.status})`);
    const settings = await response.json();
    if (!settings.enabled) return;

    const required = ["apiKey", "authDomain", "projectId", "appId"];
    if (required.some((key) => !settings.firebaseConfig?.[key])) {
      throw new Error("Firebase sync is enabled but its public configuration is incomplete.");
    }

    if (!window.MaltiProgressBackup) {
      await loadScript(new URL("./progress-backup.js", scriptBaseUrl).href);
    }
    if (!window.MaltiCloudSyncCore) {
      await loadScript(new URL("./cloud-sync-core.js", scriptBaseUrl).href);
    }

    const module = await import(new URL("./firebase-sync.js", scriptBaseUrl).href);
    await module.initializeFirebaseSync({
      firebaseConfig: settings.firebaseConfig,
      host: header.querySelector("[data-cloud-account-host]"),
      backup: window.MaltiProgressBackup,
      storage,
      core: window.MaltiCloudSyncCore
    });
  };

  initializeCloudSync().catch((error) => {
    console.warn("Cloud progress sync is unavailable.", error);
  });

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
    searchInput?.setAttribute("aria-expanded", "false");
  };

  const searchMatches = async (query) => {
    const normalized = normalizeSearch(query);

    if (!normalized) {
      return [];
    }

    const pageEntries = searchItems.map((item) => ({
      kind: "page",
      title: item.label,
      subtitle: item.description || "",
      group: item.group,
      href: item.href,
      find: "",
      normalized: normalizeSearch(`${item.label} ${item.group} ${item.description || ""} ${item.href.replace(/[_-]/g, " ")}`)
    }));
    const contentEntries = normalized.length >= 2 ? await loadContentSearch() : [];
    const unique = new Map();
    [...pageEntries, ...contentEntries].forEach((item) => {
      const title = normalizeSearch(item.title);
      const haystack = item.normalized || normalizeSearch(`${item.title} ${item.subtitle || ""} ${item.group || ""}`);
      let score = 0;
      if (title === normalized) score = 100;
      else if (title.startsWith(normalized)) score = 80;
      else if (haystack.split(" ").some((word) => word.startsWith(normalized))) score = 65;
      else if (haystack.includes(normalized)) score = 45;
      if (!score) return;
      if (item.kind === "page") score += 8;
      const key = `${item.href}::${item.kind}::${title}`;
      const previous = unique.get(key);
      if (!previous || previous.score < score) unique.set(key, { ...item, score });
    });
    return [...unique.values()]
      .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title, "mt"))
      .slice(0, 10);
  };

  let searchRenderId = 0;
  const renderSearch = async () => {
    if (!searchInput || !searchResults) return;
    const renderId = ++searchRenderId;
    const matches = await searchMatches(searchInput.value);
    if (renderId !== searchRenderId) return;
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
      link.href = `./${item.href}${item.find ? `?find=${encodeURIComponent(item.find)}` : ""}`;
      link.setAttribute("role", "option");
      title.textContent = item.title;
      meta.textContent = [item.kind === "page" ? "Page" : item.kind, item.group, item.subtitle].filter(Boolean).join(" · ");
      link.appendChild(title);
      link.appendChild(meta);
      searchResults.appendChild(link);
    });

    searchResults.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");
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

  const revealSearchTarget = () => {
    const term = normalizeSearch(params.get("find"));
    if (!term) return;
    let attempts = 0;
    const locate = () => {
      attempts += 1;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (!node.parentElement || node.parentElement.closest("script, style, .site-header, .site-update-notice")) continue;
        if (!normalizeSearch(node.nodeValue).includes(term)) continue;
        const target = node.parentElement.closest("article, tr, li, .content-card, section") || node.parentElement;
        target.classList.add("is-search-target");
        target.scrollIntoView({ block: "center", behavior: "smooth" });
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        return;
      }
      if (attempts < 20) window.setTimeout(locate, 200);
    };
    window.setTimeout(locate, 0);
  };
  revealSearchTarget();

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
    if (currentFile === "review_cards.html" || currentFile === "index.html" || currentGroup?.id === "course") {
      document.querySelector(".review-fab")?.remove();
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

  if (!document.querySelector('script[data-course-context-script]')) {
    const courseContextScript = document.createElement("script");
    courseContextScript.src = "./assets/js/course-context.js";
    courseContextScript.dataset.courseContextScript = "";
    document.body.appendChild(courseContextScript);
  }
})();
