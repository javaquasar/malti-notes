(() => {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const REVIEW_STORAGE_KEY = "malti_review_cards_v2";

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
        ["common_mistakes.html", "Common Mistakes"]
      ]
    }
  ];

  const currentGroupLabel =
    groups.find((group) => group.items.some(([href]) => href === currentFile))?.label || null;

  const linkHtml = (href, label, extraClass = "") => {
    const current = currentFile === href ? " is-current" : "";
    return `<a class="nav-link${current}${extraClass ? ` ${extraClass}` : ""}" href="./${href}">${label}</a>`;
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
      <details class="nav-group${hasCurrent ? " is-current-group" : ""}"${hasCurrent ? " open" : ""}>
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
    </div>
  `;

  const toggle = header.querySelector(".site-nav-toggle");
  const panel = header.querySelector(".site-nav-panel");
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

  if (toggle && panel) {
    toggle.addEventListener("click", () => {
      const next = !header.classList.contains("nav-open");
      header.classList.toggle("nav-open", next);
      toggle.setAttribute("aria-expanded", String(next));
    });
  }

  if (currentFile === "index.html" && currentGroupLabel) {
    header.dataset.currentGroup = currentGroupLabel;
  }

  const readReviewStats = () => {
    try {
      const raw = window.localStorage.getItem(REVIEW_STORAGE_KEY);
      if (!raw) {
        return { total: 0, due: 0 };
      }
      const parsed = JSON.parse(raw);
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
    } catch (error) {
      return { total: 0, due: 0 };
    }
  };

  const ensureReviewFab = () => {
    if (currentFile === "review_cards.html") {
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

    const count = fab.querySelector(".review-fab__count");
    const countFull = fab.querySelector(".review-fab__count-full");
    const countShort = fab.querySelector(".review-fab__count-short");
    const stats = readReviewStats();
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
    }
  });

  ensureReviewFab();
  window.addEventListener("storage", ensureReviewFab);
  window.addEventListener("focus", ensureReviewFab);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      ensureReviewFab();
    }
  });
})();
