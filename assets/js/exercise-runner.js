(() => {
  if (window.MaltiExerciseRunner) return;

  const STORAGE_KEY = "malti_exercise_progress_v1";
  const DEFAULT_DATA_URL = "./assets/data/course_exercises.json";
  const dataCache = new Map();
  const storage = window.MaltiStorage;

  const normalize = (value) => String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/[\u2018\u2019\u00b4`]/g, "'")
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ");

  const loadProgress = () => {
    const value = storage?.getJson(STORAGE_KEY, {});
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  };

  const saveProgress = (progress) => {
    storage?.setJson(STORAGE_KEY, progress);
    window.dispatchEvent(new CustomEvent("malti-exercise-progress"));
  };

  const loadData = async (url) => {
    if (!dataCache.has(url)) {
      dataCache.set(url, fetch(url).then((response) => {
        if (!response.ok) throw new Error(`Could not load exercises (${response.status})`);
        return response.json();
      }));
    }
    return dataCache.get(url);
  };

  const createButton = (label, className = "action-button") => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    return button;
  };

  const speak = (text) => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const malteseVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("mt"));
    utterance.lang = malteseVoice?.lang || "mt-MT";
    if (malteseVoice) utterance.voice = malteseVoice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const createQuestionHeader = (item) => {
    const header = document.createElement("div");
    const heading = document.createElement("h4");
    header.className = "exercise-question-header";
    heading.textContent = item.prompt;
    header.appendChild(heading);

    if (item.listen) {
      const listenButton = createButton("Listen", "action-button exercise-listen-button");
      listenButton.disabled = !("speechSynthesis" in window);
      listenButton.title = "Listen to the Maltese phrase";
      listenButton.addEventListener("click", () => speak(item.listen));
      header.appendChild(listenButton);
    }
    return header;
  };

  const renderChoices = (item, itemElement, values) => {
    const group = document.createElement("div");
    group.className = "exercise-choices";
    group.setAttribute("role", "radiogroup");
    group.setAttribute("aria-label", item.prompt);

    values.forEach((value) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      const text = document.createElement("span");
      input.type = "radio";
      input.name = `exercise-${itemElement.dataset.exerciseKey}`;
      input.value = String(value);
      text.textContent = String(value);
      label.className = "exercise-choice";
      label.append(input, text);
      group.appendChild(label);
    });
    itemElement.appendChild(group);
  };

  const renderFillBlank = (item, itemElement) => {
    const label = document.createElement("label");
    const text = document.createElement("span");
    const input = document.createElement("input");
    label.className = "exercise-input-label";
    text.textContent = "Your answer";
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.dataset.exerciseAnswer = "";
    label.append(text, input);
    itemElement.appendChild(label);
  };

  const renderMatching = (item, itemElement) => {
    const list = document.createElement("div");
    const options = item.pairs.map((pair) => pair.right);
    list.className = "exercise-matching";

    item.pairs.forEach((pair, index) => {
      const label = document.createElement("label");
      const left = document.createElement("span");
      const select = document.createElement("select");
      const placeholder = document.createElement("option");
      label.className = "exercise-match-row";
      left.textContent = pair.left;
      placeholder.value = "";
      placeholder.textContent = "Choose...";
      select.appendChild(placeholder);
      options.forEach((option) => {
        const optionElement = document.createElement("option");
        optionElement.value = option;
        optionElement.textContent = option;
        select.appendChild(optionElement);
      });
      select.dataset.matchIndex = String(index);
      select.setAttribute("aria-label", `Match ${pair.left}`);
      label.append(left, select);
      list.appendChild(label);
    });
    itemElement.appendChild(list);
  };

  const renderOrderWords = (item, itemElement) => {
    const bank = document.createElement("div");
    const answer = document.createElement("div");
    const selected = [];
    bank.className = "exercise-order-bank";
    answer.className = "exercise-order-answer";
    bank.setAttribute("aria-label", "Available words");
    answer.setAttribute("aria-label", "Selected sentence");
    answer.setAttribute("aria-live", "polite");

    const renderState = () => {
      bank.innerHTML = "";
      answer.innerHTML = "";

      item.tokens.forEach((token, index) => {
        if (selected.includes(index)) return;
        const button = createButton(token, "exercise-token");
        button.addEventListener("click", () => {
          selected.push(index);
          renderState();
        });
        bank.appendChild(button);
      });

      selected.forEach((index) => {
        const button = createButton(item.tokens[index], "exercise-token is-selected");
        button.title = "Remove from answer";
        button.addEventListener("click", () => {
          selected.splice(selected.indexOf(index), 1);
          renderState();
        });
        answer.appendChild(button);
      });

      if (!selected.length) {
        const placeholder = document.createElement("span");
        placeholder.className = "mini";
        placeholder.textContent = "Choose the words in order.";
        answer.appendChild(placeholder);
      }
    };

    itemElement.getExerciseAnswer = () => selected.map((index) => item.tokens[index]).join(" ");
    renderState();
    itemElement.append(bank, answer);
  };

  const createItem = (set, item, index) => {
    const section = document.createElement("section");
    const feedback = document.createElement("p");
    section.className = "exercise-item";
    section.dataset.exerciseItem = item.id;
    section.dataset.exerciseKey = `${set.id}-${index}`;
    section.appendChild(createQuestionHeader(item));

    if (item.type === "multiple-choice") {
      renderChoices(item, section, item.choices);
    } else if (item.type === "true-false") {
      renderChoices(item, section, ["True", "False"]);
    } else if (item.type === "fill-blank") {
      renderFillBlank(item, section);
    } else if (item.type === "matching") {
      renderMatching(item, section);
    } else if (item.type === "order-words") {
      renderOrderWords(item, section);
    }

    feedback.className = "exercise-feedback";
    feedback.hidden = true;
    feedback.setAttribute("role", "status");
    section.appendChild(feedback);
    return section;
  };

  const answerFor = (itemElement, item) => {
    if (item.type === "multiple-choice" || item.type === "true-false") {
      return itemElement.querySelector('input[type="radio"]:checked')?.value ?? "";
    }
    if (item.type === "fill-blank") {
      return itemElement.querySelector("[data-exercise-answer]")?.value ?? "";
    }
    if (item.type === "matching") {
      return Array.from(itemElement.querySelectorAll("select")).map((select) => select.value);
    }
    if (item.type === "order-words") {
      return itemElement.getExerciseAnswer?.() ?? "";
    }
    return "";
  };

  const isCorrect = (item, answer) => {
    if (item.type === "matching") {
      return item.pairs.every((pair, index) => normalize(answer[index]) === normalize(pair.right));
    }
    if (item.type === "true-false") {
      return normalize(answer) === String(item.answer).toLowerCase();
    }
    if (item.type === "fill-blank") {
      return (item.accepted || [item.answer]).some((accepted) => normalize(answer) === normalize(accepted));
    }
    return normalize(answer) === normalize(item.answer);
  };

  const correctAnswerText = (item) => {
    if (item.type === "matching") {
      return item.pairs.map((pair) => `${pair.left} → ${pair.right}`).join("; ");
    }
    if (item.type === "true-false") return item.answer ? "True" : "False";
    return String(item.answer);
  };

  const toReviewCard = (set, item) => ({
    id: `sentence::course-exercise::${set.id}::${item.id}`,
    type: "sentence-card",
    maltese: item.reviewCard.maltese,
    english: item.reviewCard.english,
    topic: set.title,
    group: "Course quick checks",
    sourcePage: window.location.pathname.split("/").pop() || "course_path.html",
    prompt: item.reviewCard.maltese,
    answer: item.reviewCard.english
  });

  const saveMissedToReview = (set, missedItems) => {
    const store = window.MaltiReviewStore;
    if (!store) return 0;
    let saved = 0;
    missedItems.filter((item) => item.reviewCard).forEach((item) => {
      const card = toReviewCard(set, item);
      if (!store.hasCard(card.id)) {
        store.addSentence(card);
        saved += 1;
      }
    });
    return saved;
  };

  const updateBestStatus = (status, set) => {
    const result = loadProgress()[set.id];
    status.textContent = result
      ? `Best ${result.bestScore}/${result.total}${result.passed ? " · passed" : ""}`
      : "Not attempted";
  };

  const renderSet = (container, set) => {
    const header = document.createElement("header");
    const heading = document.createElement("h3");
    const best = document.createElement("span");
    const form = document.createElement("form");
    const actions = document.createElement("div");
    const checkButton = createButton("Check answers");
    const retryButton = createButton("Try again");
    const saveButton = createButton("Add missed answers to review");
    const result = document.createElement("p");

    container.innerHTML = "";
    container.classList.add("exercise-set");
    container.dataset.exerciseRendered = "true";
    header.className = "exercise-set-header";
    heading.textContent = set.title;
    best.className = "status-chip";
    updateBestStatus(best, set);
    header.append(heading, best);
    form.className = "exercise-form";
    set.items.forEach((item, index) => form.appendChild(createItem(set, item, index)));
    actions.className = "toolbar-row exercise-actions";
    checkButton.type = "submit";
    retryButton.hidden = true;
    saveButton.hidden = true;
    result.className = "exercise-result";
    result.setAttribute("role", "status");
    actions.append(checkButton, retryButton, saveButton);
    form.append(actions, result);
    container.append(header, form);

    retryButton.addEventListener("click", () => renderSet(container, set));

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      let score = 0;
      const missed = [];

      set.items.forEach((item) => {
        const itemElement = form.querySelector(`[data-exercise-item="${item.id}"]`);
        const feedback = itemElement.querySelector(".exercise-feedback");
        const correct = isCorrect(item, answerFor(itemElement, item));
        itemElement.classList.toggle("is-correct", correct);
        itemElement.classList.toggle("is-incorrect", !correct);
        feedback.hidden = false;

        if (correct) {
          score += 1;
          feedback.textContent = `Correct. ${item.explanation}`;
        } else {
          missed.push(item);
          feedback.textContent = `Not yet. Correct answer: ${correctAnswerText(item)}. ${item.explanation}`;
        }
      });

      const total = set.items.length;
      const required = Math.max(1, Math.round(total * (set.passPercent || 70) / 100));
      const passed = score >= required;
      const progress = loadProgress();
      const previous = progress[set.id] || { attempts: 0, bestScore: 0 };
      progress[set.id] = {
        attempts: previous.attempts + 1,
        bestScore: Math.max(previous.bestScore || 0, score),
        lastScore: score,
        total,
        passed: previous.passed === true || passed,
        updatedAt: new Date().toISOString()
      };
      saveProgress(progress);
      updateBestStatus(best, set);

      result.textContent = passed
        ? `${score}/${total}. Quick check passed.`
        : `${score}/${total}. Review the feedback and try again.`;
      result.dataset.state = passed ? "passed" : "review";
      checkButton.hidden = true;
      retryButton.hidden = false;
      saveButton.hidden = !missed.some((item) => item.reviewCard) || !window.MaltiReviewStore;

      saveButton.onclick = () => {
        const saved = saveMissedToReview(set, missed);
        saveButton.textContent = saved ? `${saved} saved to review` : "Missed answers already saved";
        saveButton.disabled = true;
      };
    });
  };

  const renderContainer = async (container) => {
    if (container.dataset.exerciseRendered === "true") return;
    const url = container.dataset.exerciseSrc || DEFAULT_DATA_URL;
    const setId = container.dataset.exerciseSet;
    const data = await loadData(url);
    const set = (data.sets || []).find((item) => item.id === setId);
    if (!set) throw new Error(`Exercise set not found: ${setId}`);
    renderSet(container, set);
  };

  const scan = async (root = document) => {
    const containers = Array.from(root.querySelectorAll("[data-exercise-set]"));
    await Promise.all(containers.map((container) => renderContainer(container).catch((error) => {
      console.error(error);
      container.textContent = "This quick check could not be loaded.";
    })));
  };

  window.MaltiExerciseRunner = {
    getProgress: loadProgress,
    scan,
    storageKey: STORAGE_KEY
  };

  const start = () => scan();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
