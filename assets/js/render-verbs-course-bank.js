function deriveMainVerbFromPhrase(text) {
  const value = String(text || "").trim();
  if (!value) {
    return "";
  }

  const firstVariant = value.split("/")[0].trim();
  const words = firstVariant.split(/\s+/).filter(Boolean);
  if (!words.length) {
    return "";
  }

  const skipWords = new Set(["se", "qed", "ma"]);
  const candidate = words.find((word) => !skipWords.has(word.toLowerCase()));
  return candidate || words[0];
}

async function renderVerbsCourseBank(config) {
  const { dataUrl, rootSelector = "#course-verb-bank" } = config || {};
  if (!dataUrl) {
    return;
  }

  const root = document.querySelector(rootSelector);
  if (!root) {
    return;
  }

  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error(`Could not load course verb bank data from ${dataUrl}`);
  }

  const data = await response.json();
  const groups = Array.isArray(data.groups) ? data.groups : [];

  for (const group of groups) {
    const container = root.querySelector(`[data-course-verb-group="${group.id}"]`);
    if (!container) {
      continue;
    }

    container.innerHTML = "";

    const box = document.createElement("div");
    box.className = "box full-span";

    const heading = document.createElement("h3");
    heading.textContent = group.title || "Verb Bank";
    box.appendChild(heading);

    if (group.description) {
      const description = document.createElement("p");
      description.className = "muted";
      description.textContent = group.description;
      box.appendChild(description);
    }

    const list = document.createElement("ul");
    list.className = group.id === "base-verbs" ? "compact-list compact-3" : "compact-list";

    for (const item of group.items || []) {
      const li = document.createElement("li");

      const button = document.createElement("button");
      button.className = "verb-trigger";
      button.type = "button";
      button.textContent = item.form || "";
      button.dataset.verb = item.form || "";
      if (item.type) {
        button.dataset.verbType = item.type;
      }
      if (item.meaning) {
        button.dataset.meaning = item.meaning;
      }
      if (item.type === "phrase") {
        const mainVerb = item.mainVerb || deriveMainVerbFromPhrase(item.form || "");
        if (mainVerb) {
          button.dataset.mainVerb = mainVerb;
        }
      }
      if (item.lookupHint) {
        button.dataset.lookupHint = item.lookupHint;
      }
      if (item.slugHint) {
        button.dataset.slugHint = item.slugHint;
      }
      if (item.lessonSource) {
        button.dataset.lessonSource = item.lessonSource;
      }
      button.title = item.type === "phrase"
        ? `Click to view this phrase: ${item.form || ""}`
        : `Click to view forms for: ${item.form || ""}`;

      const muted = document.createElement("span");
      muted.className = "muted";
      muted.textContent = ` - ${item.meaning || ""}`;
      if (item.lessonSource) {
        muted.dataset.lessonSource = item.lessonSource;
      }
      if (item.type) {
        muted.dataset.verbType = item.type;
      }

      li.appendChild(button);
      li.appendChild(muted);
      list.appendChild(li);
    }

    box.appendChild(list);
    container.appendChild(box);
  }
}

window.renderVerbsCourseBank = renderVerbsCourseBank;
