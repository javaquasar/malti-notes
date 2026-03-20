const STORAGE_KEY = "animalsCompactMode";

function applyCompactMode(enabled) {
  document.body.classList.toggle("compact-animals", enabled);
  document.querySelectorAll("[data-animal-toggle]").forEach((button) => {
    button.textContent = enabled ? "Show animal images" : "Hide animal images";
    button.setAttribute("aria-pressed", String(enabled));
  });
}

function initAnimalCompactToggle() {
  const buttons = document.querySelectorAll("[data-animal-toggle]");
  if (!buttons.length) {
    return;
  }

  const saved = window.localStorage.getItem(STORAGE_KEY) === "1";
  applyCompactMode(saved);

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextState = !document.body.classList.contains("compact-animals");
      window.localStorage.setItem(STORAGE_KEY, nextState ? "1" : "0");
      applyCompactMode(nextState);
    });
  });
}

initAnimalCompactToggle();
