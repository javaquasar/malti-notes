function fallbackNormalizeQuery(input) {
  const replacements = {
    à: "a", á: "a", â: "a", ã: "a", ä: "a", å: "a",
    è: "e", é: "e", ê: "e", ë: "e",
    ì: "i", í: "i", î: "i", ï: "i",
    ò: "o", ó: "o", ô: "o", õ: "o", ö: "o",
    ù: "u", ú: "u", û: "u", ü: "u",
    ċ: "c", ġ: "g", ħ: "h", ż: "z",
    À: "a", Á: "a", Â: "a", Ã: "a", Ä: "a", Å: "a",
    È: "e", É: "e", Ê: "e", Ë: "e",
    Ì: "i", Í: "i", Î: "i", Ï: "i",
    Ò: "o", Ó: "o", Ô: "o", Õ: "o", Ö: "o",
    Ù: "u", Ú: "u", Û: "u", Ü: "u",
    Ċ: "c", Ġ: "g", Ħ: "h", Ż: "z",
    "’": "'", "‘": "'", "`": "'"
  };

  return String(input || "")
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
      normalizeQuery: wasm.normalize_query,
      scoreCandidate: wasm.score_candidate,
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
        <button type="button" class="verb-dialog-close" data-verb-dialog-close>Close</button>
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

function renderMetaCard(label, value) {
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

function openVerbDialog(root, pack, slug) {
  const details = pack.details?.[slug];
  if (!details) {
    return;
  }

  const dialog = createDialog(root);
  dialog.querySelector("[data-verb-dialog-title]").textContent = details.lemma || slug;
  dialog.querySelector("[data-verb-dialog-meanings]").textContent = (details.meanings || []).join(" · ");

  const meta = details.meta || {};
  dialog.querySelector("[data-verb-dialog-meta]").innerHTML = `
    <div class="verb-meta-card">
      <div class="verb-meta-list">
        ${[
          renderMetaCard("forma", meta.form),
          renderMetaCard("tip", meta.type),
          renderMetaCard("kategorija", meta.category1),
          renderMetaCard("għerq", meta.root),
          renderMetaCard("kategorija", meta.category2)
        ].join("")}
      </div>
    </div>
  `;

  const tableTitles = {
    present: "Imperfett",
    past: "Perfett",
    imperative: "Imperattiv"
  };

  dialog.querySelector("[data-verb-dialog-tables]").innerHTML = ["present", "past", "imperative"]
    .map((key) => renderTenseTable(tableTitles[key], details.tables?.[key]))
    .join("");

  dialog.showModal();
}

function openFallbackVerbDialog(root, verb, description) {
  const dialog = createDialog(root);
  dialog.querySelector("[data-verb-dialog-title]").textContent = verb || "Verb";
  dialog.querySelector("[data-verb-dialog-meanings]").textContent = description || "Course entry";
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
          `${match.lemma} · ${match.tense} · ${match.person}${match.meaning ? ` · ${match.meaning}` : ""}`,
          match.slug
        )
      ).join("")}
    </div>
  `;
}

function renderFormSuggestions(normalized, pack, helpers, resultsNode) {
  const suggestions = Object.keys(pack.forms)
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
          `${first.lemma} · ${first.tense} · ${first.person}${first.meaning ? ` · ${first.meaning}` : ""}`,
          first.slug
        );
      }).join("")}
    </div>
  `;

  return true;
}

function renderLemmaSuggestions(normalized, pack, helpers, resultsNode) {
  const suggestions = pack.index
    .map((entry) => ({
      ...entry,
      score: helpers.scoreCandidate(normalized, entry.lemma)
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.lemma.localeCompare(b.lemma))
    .slice(0, 8);

  if (!suggestions.length) {
    resultsNode.innerHTML = "<p class=\"mini\">No exact form match yet. Try another form or rebuild the local lookup pack.</p>";
    return;
  }

  resultsNode.innerHTML = `
    <p class="mini">No form match yet. Closest verb entries:</p>
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

function renderMatches(query, pack, helpers, resultsNode) {
  const normalized = helpers.normalizeQuery(query);
  if (!normalized) {
    resultsNode.innerHTML = "<p class=\"mini\">Type a verb form such as <code>għamilt</code>, <code>mort</code>, or <code>niekol</code>.</p>";
    return;
  }

  const exactMatches = findExactMatches(normalized, pack);
  if (exactMatches.length) {
    renderExactMatches(exactMatches, resultsNode);
    return;
  }

  if (renderFormSuggestions(normalized, pack, helpers, resultsNode)) {
    return;
  }

  renderLemmaSuggestions(normalized, pack, helpers, resultsNode);
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

function findExactMatches(normalized, pack) {
  const matches = [];
  const seen = new Set();

  for (const variant of buildNormalizedVariants(normalized)) {
    for (const match of pack.forms[variant] || []) {
      const key = `${match.slug}|${match.tense}|${match.person}|${match.form}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      matches.push(match);
    }
  }

  return matches;
}

function openFromTrigger(verb, root, pack, helpers, inputNode, normalizedNode, resultsNode) {
  const raw = String(verb || "").trim();
  if (!raw) {
    return false;
  }

  const normalized = helpers.normalizeQuery(raw);
  inputNode.value = raw;
  normalizedNode.textContent = normalized || "empty query";
  renderMatches(raw, pack, helpers, resultsNode);

  const exactMatches = normalized ? findExactMatches(normalized, pack) : [];
  if (exactMatches.length) {
    const firstSlug = exactMatches[0]?.slug;
    if (firstSlug) {
      openVerbDialog(root, pack, firstSlug);
      return true;
    }
  }

  const lemmaMatch = (pack.index || []).find((entry) => helpers.normalizeQuery(entry.lemma) === normalized);
  if (lemmaMatch?.slug) {
    openVerbDialog(root, pack, lemmaMatch.slug);
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
