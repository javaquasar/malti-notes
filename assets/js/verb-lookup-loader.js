function fallbackNormalizeQuery(input) {
  const replacements = {
    "à": "a", "á": "a", "â": "a", "ã": "a", "ä": "a", "å": "a",
    "è": "e", "é": "e", "ê": "e", "ë": "e",
    "ì": "i", "í": "i", "î": "i", "ï": "i",
    "ò": "o", "ó": "o", "ô": "o", "õ": "o", "ö": "o",
    "ù": "u", "ú": "u", "û": "u", "ü": "u",
    "ċ": "c", "ġ": "g", "ħ": "h", "ż": "z",
    "À": "a", "Á": "a", "Â": "a", "Ã": "a", "Ä": "a", "Å": "a",
    "È": "e", "É": "e", "Ê": "e", "Ë": "e",
    "Ì": "i", "Í": "i", "Î": "i", "Ï": "i",
    "Ò": "o", "Ó": "o", "Ô": "o", "Õ": "o", "Ö": "o",
    "Ù": "u", "Ú": "u", "Û": "u", "Ü": "u",
    "Ċ": "c", "Ġ": "g", "Ħ": "h", "Ż": "z",
    "’": "'", "‘": "'", "`": "'"
  };

  return String(input || "")
    .replaceAll("ÃƒÂ ", "à")
    .replaceAll("ÃƒÂ¨", "è")
    .replaceAll("ÃƒÂ©", "é")
    .replaceAll("ÃƒÂ¬", "ì")
    .replaceAll("ÃƒÂ²", "ò")
    .replaceAll("ÃƒÂ¹", "ù")
    .replaceAll("Ã¢â‚¬Ëœ", "‘")
    .replaceAll("Ã¢â‚¬â„¢", "’")
    .split("")
    .map((char) => replacements[char] || char.toLowerCase())
    .join("")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

async function loadWasmHelpers() {
  try {
    const wasm = await import("../wasm/malti_notes_wasm.js");
    await wasm.default();
    return {
      normalizeQuery(input) {
        return fallbackNormalizeQuery(wasm.normalize_query(input));
      },
      scoreCandidate(query, candidate) {
        const normalizedQuery = fallbackNormalizeQuery(wasm.normalize_query(query));
        const normalizedCandidate = fallbackNormalizeQuery(wasm.normalize_query(candidate));
        if (!normalizedQuery || !normalizedCandidate) {
          return 0;
        }
        if (normalizedQuery === normalizedCandidate) {
          return 100;
        }
        if (normalizedCandidate.startsWith(normalizedQuery)) {
          return 75;
        }
        if (normalizedCandidate.includes(normalizedQuery)) {
          return 50;
        }
        return 0;
      },
      decodePack(bytes) {
        return JSON.parse(wasm.decode_msgpack_to_json(bytes));
      }
    };
  } catch (error) {
    throw new Error(`WASM bundle is required for msgpack decoding: ${error}`);
  }
}

async function fetchGzipBytes(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  if (!("DecompressionStream" in window)) {
    throw new Error("DecompressionStream is not available in this browser.");
  }

  const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

async function loadVerbLookupPack(helpers) {
  const bytes = await fetchGzipBytes("./assets/data/generated/verb_lookup_pack.msgpack.gz");
  return helpers.decodePack(bytes);
}

function createDialog(root) {
  let dialog = root.querySelector("[data-verb-dialog]");
  if (dialog) {
    return dialog;
  }

  dialog = document.createElement("dialog");
  dialog.className = "verb-dialog";
  dialog.setAttribute("data-verb-dialog", "true");
  dialog.innerHTML = `
    <div class="verb-dialog-shell">
      <div class="verb-dialog-top">
        <div>
          <h3 data-verb-dialog-title>Verb</h3>
          <p class="mini" data-verb-dialog-meanings></p>
        </div>
        <div class="verb-dialog-top-actions">
          <button type="button" class="verb-dialog-open-main" data-verb-dialog-add-review>Add all forms to review</button>
          <button type="button" class="verb-dialog-close" data-verb-dialog-close>Close</button>
        </div>
      </div>
      <div class="verb-meta-grid" data-verb-dialog-meta></div>
      <div class="verb-table-grid" data-verb-dialog-tables></div>
    </div>
  `;

  dialog.querySelector("[data-verb-dialog-close]").addEventListener("click", () => {
    dialog.close();
  });

  root.appendChild(dialog);
  return dialog;
}

function renderMetaRow(label, value) {
  if (!value) {
    return "";
  }

  return `
    <div class="verb-meta-row">
      <strong>${label}</strong>
      <span>${value}</span>
    </div>
  `;
}

function isLocalExtensionMeta(meta) {
  return String(meta?.type || "").trim().toLowerCase() === "local extension";
}

function buildMetaRows(meta) {
  if (isLocalExtensionMeta(meta)) {
    return [
      renderMetaRow("għerq", meta.root)
    ].filter(Boolean);
  }

  return [
    renderMetaRow("forma", meta.form),
    renderMetaRow("tip", meta.type),
    renderMetaRow("kategorija", meta.category1),
    renderMetaRow("għerq", meta.root),
    renderMetaRow("kategorija", meta.category2)
  ].filter(Boolean);
}

const PERSON_ORDER = ["jien", "int", "huwa", "hija", "aħna", "intom", "huma"];

function formatPersonLabel(person) {
  const value = String(person || "").trim();
  if (!value) {
    return "";
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function orderedPeople(table) {
  const keys = new Set([
    ...Object.keys(table?.positive || {}),
    ...Object.keys(table?.negative || {}),
  ]);

  return [
    ...PERSON_ORDER.filter((person) => keys.has(person)),
    ...[...keys].filter((person) => !PERSON_ORDER.includes(person)).sort((a, b) => a.localeCompare(b)),
  ];
}

function renderTenseTable(title, table) {
  if (!table || (!Object.keys(table.positive || {}).length && !Object.keys(table.negative || {}).length)) {
    return "";
  }

  const hasNegative = Object.keys(table.negative || {}).length > 0;
  const people = orderedPeople(table);
  return `
    <div class="verb-table-card verb-table-card--compact">
      <h4>${title}</h4>
      <table>
        <thead>
          <tr>
            <th>person</th>
            <th>positive</th>
            ${hasNegative ? "<th>negative</th>" : ""}
          </tr>
        </thead>
        <tbody>
          ${people.map((person) => `
            <tr>
              <th>${formatPersonLabel(person)}</th>
              <td>${table.positive?.[person] ? `<code>${table.positive[person]}</code>` : ""}</td>
              ${hasNegative ? `<td>${table.negative?.[person] ? `<code>${table.negative[person]}</code>` : ""}</td>` : ""}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function getVerbDetails(pack, slug) {
  return pack.details?.[slug] || null;
}

function countVerbForms(details) {
  var total = 0;
  Object.keys(details?.tables || {}).forEach(function (tense) {
    ["positive", "negative"].forEach(function (polarity) {
      total += Object.keys(details?.tables?.[tense]?.[polarity] || {}).length;
    });
  });
  return total;
}

function syncAddAllFormsButton(button, details) {
  if (!button) {
    return;
  }

  if (!window.MaltiReviewStore || !details) {
    button.hidden = true;
    return;
  }

  button.hidden = false;
  button.disabled = false;
  button.textContent = "Add all forms to review";
  button.dataset.verbSlug = details.slug || "";
  button.dataset.addCount = String(countVerbForms(details));
}

function openVerbDialog(root, pack, slug) {
  const details = getVerbDetails(pack, slug);
  if (!details) {
    return;
  }

  const dialog = createDialog(root);
  dialog.querySelector("[data-verb-dialog-title]").textContent = details.lemma || slug;
  dialog.querySelector("[data-verb-dialog-meanings]").textContent = (details.meanings || []).join(" · ");
  syncAddAllFormsButton(dialog.querySelector("[data-verb-dialog-add-review]"), Object.assign({ slug: slug }, details));

  const meta = details.meta || {};
  const metaRows = buildMetaRows(meta);
  dialog.querySelector("[data-verb-dialog-meta]").innerHTML = metaRows.length ? `
    <div class="verb-meta-card">
      <div class="verb-meta-list">
        ${metaRows.join("")}
      </div>
    </div>
  ` : "";

  const tableTitles = {
    present: "Imperfett",
    past: "Perfett",
    imperative: "Imperattiv"
  };

  dialog.querySelector("[data-verb-dialog-tables]").innerHTML = ["present", "past", "imperative"]
    .map((key) => renderTenseTable(tableTitles[key], details.tables?.[key]))
    .join("");

  var addAllButton = dialog.querySelector("[data-verb-dialog-add-review]");
  if (addAllButton) {
    addAllButton.onclick = function () {
      if (!window.MaltiReviewStore?.addVerbTables) {
        return;
      }
      var saved = window.MaltiReviewStore.addVerbTables(details, {
        topic: "Verb Drill",
        sourcePage: "verbs_guide.html"
      });
      addAllButton.disabled = true;
      addAllButton.textContent = saved.length + " forms added";
    };
  }

  dialog.showModal();
}

function openFallbackVerbDialog(root, verb, description) {
  const dialog = createDialog(root);
  dialog.querySelector("[data-verb-dialog-title]").textContent = verb || "Verb";
  dialog.querySelector("[data-verb-dialog-meanings]").textContent = description || "Course entry";
  var addAllButton = dialog.querySelector("[data-verb-dialog-add-review]");
  if (addAllButton) {
    addAllButton.hidden = true;
    addAllButton.onclick = null;
  }
  dialog.querySelector("[data-verb-dialog-meta]").innerHTML = `
    <div class="verb-meta-card">
      <div class="verb-meta-list">
        <div class="verb-meta-row">
          <strong>status</strong>
          <span>No local full table is available for this course entry yet.</span>
        </div>
      </div>
    </div>
  `;
  dialog.querySelector("[data-verb-dialog-tables]").innerHTML = "";
  dialog.showModal();
}

function openPhraseDialog(root, phrase, description, lessonSource, mainVerb, mainLookupHint, mainSlugHint) {
  const dialog = createDialog(root);
  dialog.querySelector("[data-verb-dialog-title]").textContent = phrase || "Phrase";
  dialog.querySelector("[data-verb-dialog-meanings]").textContent = description || "Course phrase";
  var addAllButton = dialog.querySelector("[data-verb-dialog-add-review]");
  if (addAllButton) {
    addAllButton.hidden = true;
    addAllButton.onclick = null;
  }

  const metaRows = [
    renderMetaRow("type", "course phrase"),
    renderMetaRow("use", "Study and reuse this expression as a whole chunk."),
    renderMetaRow("lesson", lessonSource || ""),
  ].filter(Boolean);

  dialog.querySelector("[data-verb-dialog-meta]").innerHTML = `
    <div class="verb-meta-card">
      <div class="verb-meta-list">
        ${metaRows.join("")}
      </div>
    </div>
  `;

  dialog.querySelector("[data-verb-dialog-tables]").innerHTML = `
    <div class="verb-table-card phrase-dialog-card">
      <h4>Phrase</h4>
      <p class="phrase-dialog-line"><code>${phrase || ""}</code></p>
      <p class="mini phrase-dialog-note">This entry is stored as a ready-made course phrase, not as one single verb lexeme.</p>
      ${mainVerb ? `
        <div class="phrase-dialog-actions">
          <button
            type="button"
            class="verb-dialog-open-main"
            data-open-main-verb="${mainVerb}"
            data-open-main-lookup-hint="${mainLookupHint || ""}"
            data-open-main-slug-hint="${mainSlugHint || ""}"
          >Open main verb forms</button>
        </div>
      ` : ""}
    </div>
  `;
  const openMainButton = dialog.querySelector("[data-open-main-verb]");
  if (openMainButton) {
    openMainButton.addEventListener("click", () => {
      const targetVerb = openMainButton.dataset.openMainVerb || "";
      const targetLookupHint = openMainButton.dataset.openMainLookupHint || "";
      const targetSlugHint = openMainButton.dataset.openMainSlugHint || "";
      dialog.close();
      if (window.MaltiVerbLookup?.open) {
        window.MaltiVerbLookup.open({
          verb: targetVerb,
          lookupHint: targetLookupHint,
          slugHint: targetSlugHint,
        });
      }
    });
  }
  dialog.showModal();
}

function renderMatchButton(label, subtitle, slug) {
  return `
    <button type="button" class="verb-match-button" data-verb-open="${slug}">
      <strong><code>${label}</code></strong>
      <span>${subtitle}</span>
    </button>
  `;
}

function renderExactMatches(matches, resultsNode) {
  resultsNode.innerHTML = `
    <div class="list">
      ${matches.slice(0, 8).map((match) =>
        renderMatchButton(
          match.form,
          `${match.lemma} · ${match.tense} · ${formatPersonLabel(match.person)}${match.meaning ? ` · ${match.meaning}` : ""}`,
          match.slug
        )
      ).join("")}
    </div>
  `;
}

function renderAliasMatch(details, slug, label) {
  return renderMatchButton(
    label || details.lemma || slug,
    `${details.lemma || slug}${details.meanings?.[0] ? ` · ${details.meanings[0]}` : ""}`,
    slug
  );
}

function renderFormSuggestions(normalized, pack, helpers, resultsNode) {
  const suggestions = Object.keys(pack.forms || {})
    .map((formKey) => ({
      formKey,
      score: helpers.scoreCandidate(normalized, formKey),
      matches: pack.forms[formKey]
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.formKey.localeCompare(b.formKey))
    .slice(0, 6);

  if (!suggestions.length) {
    return false;
  }

  resultsNode.innerHTML = `
    <p class="mini">No exact match yet. Closest known verb forms:</p>
    <div class="list">
      ${suggestions.map((entry) => {
        const first = entry.matches[0];
        return renderMatchButton(
          entry.formKey,
          `${first.lemma} · ${first.tense} · ${formatPersonLabel(first.person)}${first.meaning ? ` · ${first.meaning}` : ""}`,
          first.slug
        );
      }).join("")}
    </div>
  `;

  return true;
}

function renderEnglishMatches(normalized, pack, helpers, resultsNode) {
  const exact = pack.englishIndex?.[normalized] || [];
  if (exact.length) {
    resultsNode.innerHTML = `
      <p class="mini">English meaning matches:</p>
      <div class="list">
        ${exact.slice(0, 8).map((entry) =>
          renderMatchButton(
            entry.lemma,
            `${entry.meaning} · lemma`,
            entry.slug
          )
        ).join("")}
      </div>
    `;
    return true;
  }

  const suggestions = Object.keys(pack.englishIndex || {})
    .map((key) => ({
      key,
      score: helpers.scoreCandidate(normalized, key),
      entries: pack.englishIndex[key]
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key))
    .slice(0, 8);

  if (!suggestions.length) {
    return false;
  }

  resultsNode.innerHTML = `
    <p class="mini">Closest English meanings:</p>
    <div class="list">
      ${suggestions.map((entry) => {
        const first = entry.entries[0];
        return renderMatchButton(
          first.lemma,
          `${entry.key} · ${first.meaning}`,
          first.slug
        );
      }).join("")}
    </div>
  `;
  return true;
}

function renderLemmaSuggestions(normalized, pack, helpers, resultsNode) {
  const suggestions = (pack.index || [])
    .map((entry) => ({
      ...entry,
      score: helpers.scoreCandidate(normalized, entry.lemma)
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.lemma.localeCompare(b.lemma))
    .slice(0, 8);

  if (!suggestions.length) {
    resultsNode.innerHTML = "<p class=\"mini\">No local verb match yet. Try another Maltese form or an English meaning.</p>";
    return;
  }

  resultsNode.innerHTML = `
    <p class="mini">Closest verb entries:</p>
    <div class="list">
      ${suggestions.map((entry) =>
        renderMatchButton(
          entry.lemma,
          (entry.meanings || []).slice(0, 2).join(", "),
          entry.slug
        )
      ).join("")}
    </div>
  `;
}

function buildNormalizedVariants(normalized) {
  const variants = new Set();
  if (normalized) {
    variants.add(normalized);
  }
  if (normalized && normalized.startsWith("i") && normalized.length > 1) {
    variants.add(normalized.slice(1));
  }
  return [...variants];
}

function normalizeOpenPayload(entry) {
  if (typeof entry === "string") {
    return {
      verb: entry,
      lookupHint: "",
      slugHint: "",
      description: ""
    };
  }

  if (!entry || typeof entry !== "object") {
    return {
      verb: "",
      lookupHint: "",
      slugHint: "",
      description: ""
    };
  }

  return {
    verb: String(entry.verb || "").trim(),
    lookupHint: String(entry.lookupHint || "").trim(),
    slugHint: String(entry.slugHint || "").trim(),
    description: String(entry.description || "").trim()
  };
}

function findExactMatches(normalized, pack) {
  const matches = [];
  const seen = new Set();

  for (const variant of buildNormalizedVariants(normalized)) {
    for (const match of pack.forms?.[variant] || []) {
      const key = `${match.slug}|${match.tense}|${match.person}|${match.form}|${match.polarity || "positive"}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      matches.push(match);
    }
  }

  return matches;
}

function findAliasSlug(normalized, pack) {
  for (const variant of buildNormalizedVariants(normalized)) {
    const slug = pack.aliases?.[variant];
    if (slug) {
      return slug;
    }
  }
  return "";
}

function renderMatches(query, pack, helpers, resultsNode) {
  const normalized = helpers.normalizeQuery(query);
  if (!normalized) {
    resultsNode.innerHTML = "<p class=\"mini\">Type a Maltese verb form such as <code>għamilt</code>, <code>mort</code>, <code>niekol</code>, or an English meaning like <code>pay</code>.</p>";
    return;
  }

  const exactMatches = findExactMatches(normalized, pack);
  if (exactMatches.length) {
    renderExactMatches(exactMatches, resultsNode);
    return;
  }

  const aliasSlug = findAliasSlug(normalized, pack);
  if (aliasSlug) {
    const details = getVerbDetails(pack, aliasSlug);
    if (details) {
      resultsNode.innerHTML = `
        <div class="list">
          ${renderAliasMatch(details, aliasSlug, query)}
        </div>
      `;
      return;
    }
  }

  if (renderEnglishMatches(normalized, pack, helpers, resultsNode)) {
    return;
  }

  if (renderFormSuggestions(normalized, pack, helpers, resultsNode)) {
    return;
  }

  renderLemmaSuggestions(normalized, pack, helpers, resultsNode);
}

function openFromTrigger(entry, root, pack, helpers, inputNode, normalizedNode, resultsNode) {
  const payload = normalizeOpenPayload(entry);
  const raw = payload.verb;
  if (!raw) {
    return false;
  }

  const searchQuery = payload.lookupHint || raw;
  const normalized = helpers.normalizeQuery(searchQuery);
  inputNode.value = raw;
  normalizedNode.textContent = normalized || "empty query";
  renderMatches(searchQuery, pack, helpers, resultsNode);

  if (payload.slugHint && getVerbDetails(pack, payload.slugHint)) {
    openVerbDialog(root, pack, payload.slugHint);
    return true;
  }

  const exactMatches = normalized ? findExactMatches(normalized, pack) : [];
  if (exactMatches.length) {
    const firstSlug = exactMatches[0]?.slug;
    if (firstSlug) {
      openVerbDialog(root, pack, firstSlug);
      return true;
    }
  }

  const aliasSlug = normalized ? findAliasSlug(normalized, pack) : "";
  if (aliasSlug) {
    openVerbDialog(root, pack, aliasSlug);
    return true;
  }

  const lemmaMatch = (pack.index || []).find((item) => helpers.normalizeQuery(item.lemma) === normalized);
  if (lemmaMatch?.slug) {
    openVerbDialog(root, pack, lemmaMatch.slug);
    return true;
  }

  const englishMatch = pack.englishIndex?.[normalized]?.[0];
  if (englishMatch?.slug) {
    openVerbDialog(root, pack, englishMatch.slug);
    return true;
  }

  return false;
}

async function initVerbLookup() {
  const root = document.querySelector("[data-verb-lookup]");
  if (!root) {
    return;
  }

  const statusNode = root.querySelector("[data-verb-lookup-status]");
  const inputNode = root.querySelector("[data-verb-lookup-input]");
  const normalizedNode = root.querySelector("[data-verb-lookup-normalized]");
  const resultsNode = root.querySelector("[data-verb-lookup-results]");

  if (!statusNode || !inputNode || !normalizedNode || !resultsNode) {
    return;
  }

  try {
    const helpers = await loadWasmHelpers();
    const pack = await loadVerbLookupPack(helpers);

    inputNode.disabled = false;

    const update = () => {
      const normalized = helpers.normalizeQuery(inputNode.value);
      normalizedNode.textContent = normalized || "empty query";
      renderMatches(inputNode.value, pack, helpers, resultsNode);
    };

    window.MaltiVerbLookup = {
      open(verb) {
        return openFromTrigger(verb, root, pack, helpers, inputNode, normalizedNode, resultsNode);
      },
      openPhrase(payload) {
        openPhraseDialog(
          root,
          payload?.phrase || "",
          payload?.description || "",
          payload?.lessonSource || "",
          payload?.mainVerb || "",
          payload?.mainLookupHint || "",
          payload?.mainSlugHint || "",
        );
        return true;
      },
      openFallback(verb, description) {
        openFallbackVerbDialog(root, verb, description);
        return true;
      }
    };

    inputNode.addEventListener("input", update);
    resultsNode.addEventListener("click", (event) => {
      const button = event.target.closest("[data-verb-open]");
      if (!button) {
        return;
      }
      openVerbDialog(root, pack, button.dataset.verbOpen);
    });

    update();
  } catch (error) {
    window.MaltiVerbLookup = {
      open() {
        return false;
      },
      openPhrase(payload) {
        openPhraseDialog(
          root,
          payload?.phrase || "",
          payload?.description || "",
          payload?.lessonSource || "",
          payload?.mainVerb || "",
          payload?.mainLookupHint || "",
          payload?.mainSlugHint || "",
        );
        return true;
      },
      openFallback(verb, description) {
        openFallbackVerbDialog(root, verb, description);
        return true;
      }
    };
    normalizedNode.textContent = "pack missing";
    resultsNode.innerHTML = "<p class=\"mini\">The page is ready for local verb-pack lookup, but no generated pack is available yet.</p>";
    console.warn("Verb lookup loader fallback:", error);
  }
}

initVerbLookup();

