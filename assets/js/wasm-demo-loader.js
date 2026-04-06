const SAMPLE_WORDS = [
  "għamel",
  "qagħad",
  "żamżam",
  "ċempel",
  "ħabb",
  "kanta",
  "mar",
  "tkellem"
];

function renderMatches(query, normalize, score, summary) {
  const normalized = normalize(query);
  return SAMPLE_WORDS
    .map((word) => ({
      word,
      score: score(normalized, word),
      summary: summary(normalized, word)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.word.localeCompare(b.word))
    .slice(0, 5)
    .map((item) => `<li><code>${item.word}</code> - ${item.summary} (${item.score})</li>`)
    .join("") || "<li>No matches in the demo list yet.</li>";
}

async function initWasmDemo() {
  const status = document.querySelector("[data-wasm-status]");
  const input = document.querySelector("[data-wasm-input]");
  const normalized = document.querySelector("[data-wasm-normalized]");
  const results = document.querySelector("[data-wasm-results]");

  if (!status || !input || !normalized || !results) {
    return;
  }

  try {
    const wasm = await import("../wasm/malti_notes_wasm.js");
    await wasm.default();

    const update = () => {
      const value = input.value;
      const normalizedValue = wasm.normalize_query(value);
      normalized.textContent = normalizedValue || "empty query";
      results.innerHTML = renderMatches(
        value,
        wasm.normalize_query,
        wasm.score_candidate,
        wasm.match_summary
      );
    };

    status.textContent = "WASM module loaded successfully.";
    status.dataset.state = "ready";
    input.disabled = false;
    input.addEventListener("input", update);
    update();
  } catch (error) {
    status.textContent = "WASM build not found yet. The page is ready for GitHub Actions output, but the local demo is in fallback mode.";
    status.dataset.state = "fallback";
    normalized.textContent = "fallback mode";
    results.innerHTML = SAMPLE_WORDS.map((word) => `<li><code>${word}</code></li>`).join("");
    console.warn("WASM demo loader fallback:", error);
  }
}

initWasmDemo();
