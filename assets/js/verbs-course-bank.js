(() => {
  const bank = document.querySelector("#course-verb-bank");
  if (!bank) {
    return;
  }

  const entries = bank.querySelectorAll(".verb-trigger + .muted");
  for (const entry of entries) {
    const raw = entry.textContent || "";
    const trimmed = raw.trim();
    if (!trimmed.startsWith("-")) {
      continue;
    }

    const body = trimmed.slice(1).trim();
    const lessonMarker = "| Lesson";
    const markerIndex = body.indexOf(lessonMarker);
    if (markerIndex === -1) {
      continue;
    }

    const visibleText = body.slice(0, markerIndex).trim();
    const lessonText = body.slice(markerIndex + 1).trim();
    if (lessonText) {
      entry.dataset.lessonSource = lessonText;
    }
    entry.textContent = ` - ${visibleText}`;
  }
})();
