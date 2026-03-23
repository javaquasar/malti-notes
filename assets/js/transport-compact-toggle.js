const TRANSPORT_STORAGE_KEY = "transportCompactMode";

function applyTransportCompactMode(enabled) {
  document.body.classList.toggle("compact-transport", enabled);
  document.querySelectorAll("[data-transport-toggle]").forEach((button) => {
    button.textContent = enabled ? "Show transport images" : "Hide transport images";
    button.setAttribute("aria-pressed", String(enabled));
  });
}

function initTransportCompactToggle() {
  const buttons = document.querySelectorAll("[data-transport-toggle]");
  if (!buttons.length) {
    return;
  }

  const saved = window.localStorage.getItem(TRANSPORT_STORAGE_KEY) === "1";
  applyTransportCompactMode(saved);

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextState = !document.body.classList.contains("compact-transport");
      window.localStorage.setItem(TRANSPORT_STORAGE_KEY, nextState ? "1" : "0");
      applyTransportCompactMode(nextState);
    });
  });
}

initTransportCompactToggle();
