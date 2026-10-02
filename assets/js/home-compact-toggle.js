document.addEventListener("DOMContentLoaded", () => {
  const button = document.querySelector("[data-home-image-toggle]");
  const root = document.documentElement;
  const storageKey = "homeCompactMode";
  const storage = window.MaltiStorage;

  if (!button) {
    return;
  }

  const update = (compact) => {
    const label = compact ? "Show home images" : "Hide home images";
    root.classList.toggle("home-compact", compact);
    button.textContent = label;
    button.dataset.mobileLabel = compact ? "Show images" : "Hide images";
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", compact ? "true" : "false");
  };

  const saved = storage.getString(storageKey, "false") === "true";
  update(saved);

  button.addEventListener("click", () => {
    const next = !root.classList.contains("home-compact");
    storage.setString(storageKey, String(next));
    update(next);
  });
});
