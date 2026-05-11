(() => {
  const defaultOptions = {
    allLabel: "All topics",
    checkContainerClass: "topic-picker-checks",
    checkClass: "topic-picker-check"
  };

  const create = (options) => {
    const config = { ...defaultOptions, ...options };
    const topics = Array.isArray(config.topics) ? config.topics : [];
    const select = config.select;
    const checks = config.checks;
    const onChange = typeof config.onChange === "function" ? config.onChange : () => {};

    const selectedIds = () => {
      const checked = checks
        ? [...checks.querySelectorAll("input[type='checkbox']:checked")].map((input) => input.value)
        : [];
      if (checked.includes("all")) return ["all"];
      if (checked.length) return checked;
      return select?.value === "all" ? ["all"] : [select?.value || "all"];
    };

    const label = () => {
      const ids = selectedIds();
      if (ids.includes("all")) return config.allLabel;
      return ids
        .map((id) => topics.find((topic) => topic.id === id)?.label)
        .filter(Boolean)
        .join(" + ") || config.allLabel;
    };

    const syncSelectFromChecks = () => {
      if (!select) return;
      const ids = selectedIds();
      select.value = ids.length === 1 && !ids.includes("all") ? ids[0] : "all";
    };

    const syncChecksFromSelect = () => {
      if (!checks || !select) return;
      checks.querySelectorAll("input[type='checkbox']").forEach((input) => {
        input.checked = select.value === "all"
          ? input.value === "all"
          : input.value === select.value;
      });
    };

    const ensureOneChecked = () => {
      if (!checks) return;
      const checked = [...checks.querySelectorAll("input[type='checkbox']:checked")];
      if (checked.length) return;
      const allInput = checks.querySelector('input[value="all"]');
      if (allInput) allInput.checked = true;
    };

    const render = () => {
      if (select) {
        select.innerHTML = "";
        const allOption = document.createElement("option");
        allOption.value = "all";
        allOption.textContent = config.allLabel;
        select.appendChild(allOption);
        topics.forEach((topic) => {
          const option = document.createElement("option");
          option.value = topic.id;
          option.textContent = topic.label;
          select.appendChild(option);
        });
      }

      if (checks) {
        checks.classList.add(config.checkContainerClass);
        checks.innerHTML = "";
        const allLabel = document.createElement("label");
        allLabel.className = `${config.checkClass} is-all`;
        allLabel.innerHTML = `
          <input type="checkbox" value="all" checked>
          <span>${config.allLabel}</span>
        `;
        checks.appendChild(allLabel);

        topics.forEach((topic) => {
          const labelElement = document.createElement("label");
          labelElement.className = config.checkClass;
          labelElement.innerHTML = `
            <input type="checkbox" value="${topic.id}">
            <span>${topic.label}</span>
          `;
          checks.appendChild(labelElement);
        });
      }
    };

    select?.addEventListener("change", () => {
      syncChecksFromSelect();
      onChange(selectedIds());
    });

    checks?.addEventListener("change", (event) => {
      const changed = event.target;
      if (changed?.matches?.('input[value="all"]') && changed.checked) {
        checks.querySelectorAll('input[type="checkbox"]:not([value="all"])').forEach((input) => {
          input.checked = false;
        });
      } else if (changed?.matches?.('input[type="checkbox"]') && changed.value !== "all" && changed.checked) {
        const allInput = checks.querySelector('input[value="all"]');
        if (allInput) allInput.checked = false;
      }
      ensureOneChecked();
      syncSelectFromChecks();
      onChange(selectedIds());
    });

    render();

    return {
      selectedIds,
      label,
      syncChecksFromSelect,
      syncSelectFromChecks
    };
  };

  window.MaltiTopicPicker = { create };
})();
