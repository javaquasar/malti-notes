(() => {
  const TOPICS = Array.isArray(window.MALTI_WORD_SEARCH_TOPICS)
    ? window.MALTI_WORD_SEARCH_TOPICS
    : [];
  const SOUND_STORAGE_KEY = "malti_vocabulary_games_sound_v1";
  const MEMORY_SEEN_STORAGE_KEY = "malti_memory_game_seen_words_v1";
  const BUILDER_SEEN_STORAGE_KEY = "malti_word_builder_seen_words_v1";

  const normalizePuzzleText = (word) => String(word || "")
    .toLowerCase()
    .normalize("NFC")
    .replace(/[à]/g, "a")
    .replace(/[è]/g, "e")
    .replace(/[ì]/g, "i")
    .replace(/[ò]/g, "o")
    .replace(/[ù]/g, "u");
  const tokenize = (word) => normalizePuzzleText(word).match(/għ|[a-zċġħż]/g) || [];
  const wordKey = (word) => tokenize(word).join("");
  const byId = (id) => document.querySelector(`#${id}`);

  const shuffle = (items) => {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const nextIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
    }
    return copy;
  };

  const topicWords = (topicIds) => {
    const ids = Array.isArray(topicIds) && topicIds.length ? topicIds : ["all"];
    const sourceTopics = ids.includes("all")
      ? TOPICS
      : TOPICS.filter((topic) => ids.includes(topic.id));
    const seen = new Set();
    return sourceTopics.flatMap((topic) => topic.words.map((entry) => ({
      word: entry[0],
      translation: entry[1],
      topic: topic.label
    }))).filter((entry) => {
      const key = wordKey(entry.word);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const displayToken = (token) => token.toUpperCase();
  const readSoundEnabled = () => window.MaltiGameAudio
    ? window.MaltiGameAudio.readEnabled(SOUND_STORAGE_KEY)
    : true;
  const writeSoundEnabled = (enabled) => {
    window.MaltiGameAudio?.writeEnabled(SOUND_STORAGE_KEY, enabled);
  };
  const playSound = (type, enabled) => {
    window.MaltiGameAudio?.play(type, { enabled });
  };
  const refreshElements = (...elements) => {
    elements.filter(Boolean).forEach((element) => {
      element.classList.remove("is-refreshing");
      void element.offsetWidth;
      element.classList.add("is-refreshing");
    });
  };
  const animateTileToAnswer = (sourceButton, targetTile, onComplete) => {
    if (!sourceButton || !targetTile) {
      onComplete?.();
      return;
    }
    const sourceRect = sourceButton.getBoundingClientRect();
    const targetRect = targetTile.getBoundingClientRect();
    if (!sourceRect.width || !targetRect.width) {
      onComplete?.();
      return;
    }

    const flying = document.createElement("div");
    flying.className = "builder-flying-tile";
    flying.textContent = sourceButton.textContent;
    flying.style.left = `${sourceRect.left}px`;
    flying.style.top = `${sourceRect.top}px`;
    flying.style.width = `${sourceRect.width}px`;
    flying.style.height = `${sourceRect.height}px`;
    document.body.appendChild(flying);
    sourceButton.classList.add("is-animating");
    targetTile.classList.add("is-landing");

    const x = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
    const y = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        flying.style.transform = `translate(${x}px, ${y}px) scale(0.96)`;
        flying.style.opacity = "0.28";
      });
    });
    window.setTimeout(() => {
      flying.remove();
      sourceButton.classList.remove("is-animating");
      targetTile.classList.remove("is-landing");
      onComplete?.();
    }, 360);
  };

  const initMemory = () => {
    const board = byId("memory-board");
    const topicSelect = byId("memory-topic");
    const topicChecks = byId("memory-topic-checks");
    const pairSelect = byId("memory-pairs");
    const score = byId("memory-score");
    const movesLabel = byId("memory-moves");
    const status = byId("memory-status");
    const soundSelect = byId("memory-sound");
    const seenLabel = byId("memory-seen-memory");
    const matchedList = byId("memory-matched-list");
    const newButton = byId("memory-new");
    const resetMemoryButton = byId("memory-reset-memory");
    if (!board || !topicSelect || !pairSelect || !newButton) return;

    const state = {
      cards: [],
      flipped: [],
      matched: new Set(),
      matchedPairs: [],
      locked: false,
      moves: 0,
      soundEnabled: true
    };
    let topicPicker = null;
    const seenTracker = window.MaltiSeenWords?.create({
      storageKey: MEMORY_SEEN_STORAGE_KEY,
      label: seenLabel
    });
    let lastUsedSeenWords = false;
    const selectedTopics = () => topicPicker ? topicPicker.selectedIds() : [topicSelect.value || "all"];

    const updateScore = () => {
      const total = Number(pairSelect.value);
      score.textContent = `${state.matched.size} / ${total} matched`;
      movesLabel.textContent = `${state.moves} moves`;
      if (state.matched.size === total) {
        status.textContent = `Complete in ${state.moves} moves.`;
      }
    };

    const renderMatchedPairs = () => {
      if (!matchedList) return;
      matchedList.innerHTML = "";
      if (!state.matchedPairs.length) {
        const item = document.createElement("li");
        item.className = "is-empty";
        item.textContent = "Matched pairs will appear here.";
        matchedList.appendChild(item);
        return;
      }
      state.matchedPairs.forEach((pair) => {
        const item = document.createElement("li");
        item.innerHTML = `<strong>${pair.maltese}</strong><span>${pair.english}</span>`;
        matchedList.appendChild(item);
      });
    };

    const makeCards = () => {
      const count = Number(pairSelect.value);
      const candidates = shuffle(topicWords(selectedTopics()))
        .filter((entry) => tokenize(entry.word).length >= 3)
      const filtered = seenTracker
        ? seenTracker.filterCandidates(candidates, count, (entry) => wordKey(entry.word))
        : { candidates, usedSeen: false };
      lastUsedSeenWords = filtered.usedSeen;
      const words = filtered.candidates
        .slice(0, count);
      return shuffle(words.flatMap((entry, index) => [
        { id: index, kind: "Maltese", text: entry.word },
        { id: index, kind: "English", text: entry.translation }
      ]));
    };

    const render = () => {
      const count = Number(pairSelect.value);
      board.style.setProperty("--memory-columns", count >= 10 ? 5 : 4);
      board.innerHTML = "";
      state.cards.forEach((card, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `memory-card memory-card-${card.kind.toLowerCase()}`;
        button.dataset.cardIndex = String(index);
        button.dataset.pairId = String(card.id);
        if (state.flipped.includes(index)) button.classList.add("is-flipped");
        if (state.matched.has(card.id)) button.classList.add("is-matched");
        button.innerHTML = `
          <span class="memory-card-face">
            <span class="memory-card-kind">${card.kind}</span>
            ${card.text}
          </span>
        `;
        board.appendChild(button);
      });
      renderMatchedPairs();
      updateScore();
    };

    const start = () => {
      state.cards = makeCards();
      state.flipped = [];
      state.matched = new Set();
      state.matchedPairs = [];
      state.locked = false;
      state.moves = 0;
      status.textContent = lastUsedSeenWords
        ? "New game ready. Some seen words were reused because this topic is running low."
        : "Find each Maltese word and its English translation.";
      render();
      refreshElements(board, matchedList);
    };

    [board, matchedList].filter(Boolean).forEach((element) => {
      element.addEventListener("animationend", () => element.classList.remove("is-refreshing"));
    });

    board.addEventListener("click", (event) => {
      const button = event.target.closest("[data-card-index]");
      if (!button || state.locked) return;
      const index = Number(button.dataset.cardIndex);
      const card = state.cards[index];
      if (!card || state.matched.has(card.id) || state.flipped.includes(index)) return;

      state.flipped.push(index);
      playSound("tick", state.soundEnabled);
      render();
      if (state.flipped.length < 2) return;

      state.moves += 1;
      const first = state.cards[state.flipped[0]];
      const second = state.cards[state.flipped[1]];
      if (first.id === second.id) {
        state.matched.add(first.id);
        seenTracker?.add(wordKey(first.kind === "Maltese" ? first.text : second.text));
        state.matchedPairs.push({
          maltese: first.kind === "Maltese" ? first.text : second.text,
          english: first.kind === "English" ? first.text : second.text
        });
        state.flipped = [];
        status.textContent = `Matched: ${first.text} / ${second.text}`;
        playSound("success", state.soundEnabled);
        render();
        return;
      }

      state.locked = true;
      status.textContent = "Not a pair. Try to remember those two.";
      window.setTimeout(() => {
        state.flipped = [];
        state.locked = false;
        render();
      }, 700);
    });

    topicPicker = window.MaltiTopicPicker?.create({
      topics: TOPICS,
      select: topicSelect,
      checks: topicChecks,
      onChange: start
    });
    state.soundEnabled = readSoundEnabled();
    if (soundSelect) soundSelect.value = state.soundEnabled ? "on" : "off";
    soundSelect?.addEventListener("change", () => {
      state.soundEnabled = soundSelect.value !== "off";
      writeSoundEnabled(state.soundEnabled);
      status.textContent = state.soundEnabled ? "Sound on." : "Sound off.";
    });
    if (!topicPicker) topicSelect.addEventListener("change", start);
    pairSelect.addEventListener("change", start);
    newButton.addEventListener("click", start);
    resetMemoryButton?.addEventListener("click", () => {
      seenTracker?.reset();
      status.textContent = "Seen word memory reset.";
    });
    start();
  };

  const initBuilder = () => {
    const topicSelect = byId("builder-topic");
    const topicChecks = byId("builder-topic-checks");
    const countSelect = byId("builder-count");
    const translation = byId("builder-translation");
    const answer = byId("builder-answer");
    const bank = byId("builder-bank");
    const rounds = byId("builder-rounds");
    const stage = document.querySelector(".builder-stage");
    const score = byId("builder-score");
    const status = byId("builder-status");
    const soundSelect = byId("builder-sound");
    const seenLabel = byId("builder-seen-memory");
    const checkButton = byId("builder-check");
    const hintButton = byId("builder-hint");
    const clearButton = byId("builder-clear");
    const skipButton = byId("builder-skip");
    const newButton = byId("builder-new");
    const resetMemoryButton = byId("builder-reset-memory");
    if (!topicSelect || !countSelect || !translation || !answer || !bank || !rounds) return;

    const state = {
      words: [],
      index: 0,
      answer: [],
      letterTiles: [],
      usedTiles: new Set(),
      done: new Set(),
      soundEnabled: true
    };
    let topicPicker = null;
    const seenTracker = window.MaltiSeenWords?.create({
      storageKey: BUILDER_SEEN_STORAGE_KEY,
      label: seenLabel
    });
    let lastUsedSeenWords = false;
    const selectedTopics = () => topicPicker ? topicPicker.selectedIds() : [topicSelect.value || "all"];

    const current = () => state.words[state.index];

    const makeWords = () => {
      const count = Number(countSelect.value);
      const candidates = shuffle(topicWords(selectedTopics())).filter((entry) => {
        const length = tokenize(entry.word).length;
        return length >= 3 && length <= 11;
      });
      const filtered = seenTracker
        ? seenTracker.filterCandidates(candidates, count, (entry) => wordKey(entry.word))
        : { candidates, usedSeen: false };
      lastUsedSeenWords = filtered.usedSeen;
      return filtered.candidates.slice(0, count);
    };

    const prepareLetterTiles = () => {
      const entry = current();
      state.letterTiles = shuffle(tokenize(entry.word).map((token, sourceIndex) => ({ token, sourceIndex })));
    };

    const renderRounds = () => {
      rounds.innerHTML = "";
      state.words.forEach((entry, index) => {
        const item = document.createElement("li");
        if (state.done.has(index)) item.classList.add("is-done");
        item.innerHTML = `<span>${entry.translation}</span><strong>${state.done.has(index) ? entry.word : index + 1}</strong>`;
        rounds.appendChild(item);
      });
    };

    const render = () => {
      const entry = current();
      const tokens = tokenize(entry.word);
      translation.textContent = entry.translation;
      answer.innerHTML = "";
      tokens.forEach((_, index) => {
        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = `builder-answer-tile${state.answer[index] ? " is-filled" : ""}`;
        tile.dataset.answerIndex = String(index);
        tile.textContent = state.answer[index] ? displayToken(state.answer[index].token) : "";
        answer.appendChild(tile);
      });
      bank.innerHTML = "";
      state.letterTiles.forEach((tile) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "builder-letter-tile";
        button.dataset.sourceIndex = String(tile.sourceIndex);
        button.textContent = displayToken(tile.token);
        button.disabled = state.usedTiles.has(tile.sourceIndex);
        bank.appendChild(button);
      });
      score.textContent = `${state.done.size} / ${state.words.length} complete`;
      renderRounds();
    };

    const resetAnswer = () => {
      state.answer = [];
      state.usedTiles = new Set();
      render();
    };

    const nextRound = (message = "Build the Maltese word.") => {
      const next = state.words.findIndex((_, index) => !state.done.has(index) && index > state.index);
      state.index = next === -1
        ? Math.max(0, state.words.findIndex((_, index) => !state.done.has(index)))
        : next;
      if (state.index === -1) state.index = 0;
      prepareLetterTiles();
      resetAnswer();
      status.textContent = message;
    };

    const start = () => {
      state.words = makeWords();
      state.index = 0;
      state.answer = [];
      state.letterTiles = [];
      state.usedTiles = new Set();
      state.done = new Set();
      prepareLetterTiles();
      status.textContent = lastUsedSeenWords
        ? "New game ready. Some seen words were reused because this topic is running low."
        : "Build the Maltese word from the tiles.";
      render();
      refreshElements(stage, rounds);
    };

    [stage, rounds].filter(Boolean).forEach((element) => {
      element.addEventListener("animationend", () => element.classList.remove("is-refreshing"));
    });

    bank.addEventListener("click", (event) => {
      const button = event.target.closest("[data-source-index]");
      if (!button || button.disabled) return;
      const entry = current();
      const tokens = tokenize(entry.word);
      if (state.answer.length >= tokens.length) return;
      const sourceIndex = Number(button.dataset.sourceIndex);
      if (state.usedTiles.has(sourceIndex)) return;
      const answerIndex = state.answer.length;
      const targetTile = answer.querySelector(`[data-answer-index="${answerIndex}"]`);
      state.answer.push({ token: tokens[sourceIndex], sourceIndex });
      state.usedTiles.add(sourceIndex);
      button.disabled = true;
      button.classList.add("is-animating");
      targetTile?.classList.add("is-landing");
      playSound("tick", state.soundEnabled);
      animateTileToAnswer(button, targetTile, () => {
        render();
      });
    });

    answer.addEventListener("click", (event) => {
      const button = event.target.closest("[data-answer-index]");
      if (!button) return;
      const tile = state.answer[Number(button.dataset.answerIndex)];
      if (!tile) return;
      state.usedTiles.delete(tile.sourceIndex);
      state.answer.splice(Number(button.dataset.answerIndex), 1);
      playSound("tick", state.soundEnabled);
      render();
    });

    checkButton.addEventListener("click", () => {
      const entry = current();
      const built = state.answer.map((tile) => tile.token).join("");
      if (built !== wordKey(entry.word)) {
        status.textContent = "Almost. Check the order and try again.";
        playSound("miss", state.soundEnabled);
        return;
      }
      state.done.add(state.index);
      seenTracker?.add(wordKey(entry.word));
      if (state.done.size === state.words.length) {
        render();
        status.textContent = "All words complete.";
        playSound("victory", state.soundEnabled);
        return;
      }
      playSound("success", state.soundEnabled);
      nextRound(`Correct: ${entry.word}. Next word.`);
    });

    hintButton.addEventListener("click", () => {
      const entry = current();
      const first = tokenize(entry.word)[0];
      resetAnswer();
      state.answer.push({ token: first, sourceIndex: 0 });
      state.usedTiles.add(0);
      status.textContent = `Hint added: first tile is ${displayToken(first)}.`;
      playSound("tick", state.soundEnabled);
      render();
    });

    clearButton.addEventListener("click", () => {
      resetAnswer();
      status.textContent = "Cleared.";
    });

    skipButton.addEventListener("click", () => nextRound("Skipped. Try this one."));

    topicPicker = window.MaltiTopicPicker?.create({
      topics: TOPICS,
      select: topicSelect,
      checks: topicChecks,
      onChange: start
    });
    state.soundEnabled = readSoundEnabled();
    if (soundSelect) soundSelect.value = state.soundEnabled ? "on" : "off";
    soundSelect?.addEventListener("change", () => {
      state.soundEnabled = soundSelect.value !== "off";
      writeSoundEnabled(state.soundEnabled);
      status.textContent = state.soundEnabled ? "Sound on." : "Sound off.";
    });
    if (!topicPicker) topicSelect.addEventListener("change", start);
    countSelect.addEventListener("change", start);
    newButton?.addEventListener("click", start);
    resetMemoryButton?.addEventListener("click", () => {
      seenTracker?.reset();
      status.textContent = "Seen word memory reset.";
    });
    start();
  };

  if (document.body.dataset.game === "memory") initMemory();
  if (document.body.dataset.game === "builder") initBuilder();
})();
