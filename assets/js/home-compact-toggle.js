document.addEventListener("DOMContentLoaded", () => {
  const button = document.querySelector("[data-home-image-toggle]");
  const root = document.documentElement;
  const storageKey = "homeCompactMode";

  if (!button) {
    return;
  }

  const update = (compact) => {
    root.classList.toggle("home-compact", compact);
    button.textContent = compact ? "Show home images" : "Hide home images";
    button.setAttribute("aria-pressed", compact ? "true" : "false");
  };

  const saved = window.localStorage.getItem(storageKey) === "true";
  update(saved);

  button.addEventListener("click", () => {
    const next = !root.classList.contains("home-compact");
    window.localStorage.setItem(storageKey, String(next));
    update(next);
  });
});
