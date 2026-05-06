(() => {
  const MALTESE_LETTERS = ["a", "b", "c", "ċ", "d", "e", "è", "f", "ġ", "g", "h", "ħ", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "ż", "z"];
  const SEEN_STORAGE_KEY = "malti_word_search_seen_words_v1";
  const DIRECTIONS = [
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: 1, col: -1 }
  ];
  const FOUND_COLOR_CLASSES = [
    "found-color-1",
    "found-color-2",
    "found-color-3",
    "found-color-4",
    "found-color-5",
    "found-color-6",
    "found-color-7",
    "found-color-8"
  ];

  const FALLBACK_TOPICS = [
    {
      id: "house",
      label: "Home",
      words: [
        ["dar", "house"],
        ["bieb", "door"],
        ["tieqa", "window"],
        ["kamra", "room"],
        ["kċina", "kitchen"],
        ["sodda", "bed"],
        ["mejda", "table"],
        ["siġġu", "chair"],
        ["taraġ", "stairs"],
        ["saqaf", "ceiling"],
        ["ħajt", "wall"],
        ["ġnien", "garden"],
        ["gallarija", "balcony"],
        ["garaxx", "garage"],
        ["art", "floor"],
        ["salott", "living room"],
        ["banju", "bathroom"],
        ["sufan", "sofa"],
        ["armarju", "cupboard"],
        ["gwardarobba", "wardrobe"],
        ["tapit", "rug"],
        ["purtiera", "curtain"],
        ["friġġ", "fridge"],
        ["forn", "oven"],
        ["platt", "plate"],
        ["tazza", "cup"],
        ["furketta", "fork"],
        ["sikkina", "knife"],
        ["mgħarfa", "spoon"],
        ["mera", "mirror"],
        ["lampa", "lamp"]
      ]
    },
    {
      id: "animals",
      label: "Animals",
      words: [
        ["kelb", "dog"],
        ["qattus", "cat"],
        ["fenek", "rabbit"],
        ["ħuta", "fish"],
        ["għasfur", "bird"],
        ["żiemel", "horse"],
        ["farfett", "butterfly"],
        ["nemla", "ant"],
        ["qanfud", "hedgehog"],
        ["fekruna", "turtle"],
        ["ħmar", "donkey"],
        ["baqra", "cow"],
        ["pappagall", "parrot"],
        ["mogħża", "goat"],
        ["nagħġa", "sheep"],
        ["ħanżir", "pig"],
        ["tiġieġa", "chicken"],
        ["serduk", "rooster"],
        ["papra", "duck"],
        ["wiżża", "goose"],
        ["naħla", "bee"],
        ["brimba", "spider"],
        ["dubbiena", "fly"],
        ["far", "mouse"],
        ["ljun", "lion"],
        ["tigra", "tiger"],
        ["xadina", "monkey"],
        ["ors", "bear"],
        ["volpi", "fox"],
        ["delfin", "dolphin"]
      ]
    },
    {
      id: "school",
      label: "School",
      words: [
        ["skola", "school"],
        ["ktieb", "book"],
        ["pitazz", "copybook"],
        ["lapes", "pencil"],
        ["gomma", "eraser"],
        ["borża", "bag"],
        ["klassi", "class"],
        ["eżami", "exam"],
        ["qasir", "short"],
        ["twil", "long"],
        ["pinna", "pen"],
        ["riga", "ruler"],
        ["temprina", "sharpener"],
        ["karta", "paper"],
        ["bord", "board"],
        ["għalliem", "teacher"],
        ["għalliema", "teacher"],
        ["student", "student"],
        ["lezzjoni", "lesson"],
        ["mistoqsija", "question"],
        ["tweġiba", "answer"],
        ["aqra", "read"],
        ["ikteb", "write"],
        ["isma", "listen"],
        ["għid", "say"]
      ]
    },
    {
      id: "food",
      label: "Food",
      words: [
        ["ħobż", "bread"],
        ["ilma", "water"],
        ["ħalib", "milk"],
        ["ġobon", "cheese"],
        ["tuffieħa", "apple"],
        ["banana", "banana"],
        ["ħut", "fish"],
        ["soppa", "soup"],
        ["ross", "rice"],
        ["għaġin", "pasta"],
        ["bajda", "egg"],
        ["laħam", "meat"],
        ["tiġieġ", "chicken"],
        ["patata", "potato"],
        ["tadam", "tomato"],
        ["karrotta", "carrot"],
        ["piżelli", "peas"],
        ["frott", "fruit"],
        ["ħaxix", "vegetables"],
        ["insalata", "salad"],
        ["butir", "butter"],
        ["zokkor", "sugar"],
        ["melħ", "salt"],
        ["bżar", "pepper"],
        ["kafè", "coffee"],
        ["te", "tea"],
        ["kejk", "cake"],
        ["torta", "pie"],
        ["frawli", "strawberries"],
        ["larinġa", "orange"]
      ]
    },
    {
      id: "family",
      label: "Family",
      words: [
        ["omm", "mother"],
        ["missier", "father"],
        ["nanna", "grandmother"],
        ["nannu", "grandfather"],
        ["ħu", "brother"],
        ["oħt", "sister"],
        ["zija", "aunt"],
        ["ziju", "uncle"],
        ["familja", "family"],
        ["tarbija", "baby"],
        ["iben", "son"],
        ["bint", "daughter"],
        ["kuġin", "cousin"],
        ["kuġina", "cousin"],
        ["neputi", "nephew"],
        ["neputija", "niece"],
        ["raġel", "man"],
        ["mara", "woman"],
        ["tifel", "boy"],
        ["tifla", "girl"],
        ["tfal", "children"],
        ["ġenituri", "parents"]
      ]
    },
    {
      id: "nature",
      label: "Nature",
      words: [
        ["baħar", "sea"],
        ["xemx", "sun"],
        ["xita", "rain"],
        ["riħ", "wind"],
        ["siġra", "tree"],
        ["fjura", "flower"],
        ["għalqa", "field"],
        ["ġnien", "garden"],
        ["sħab", "clouds"],
        ["qamar", "moon"],
        ["sema", "sky"],
        ["stilla", "star"],
        ["ħamrija", "soil"],
        ["werqa", "leaf"],
        ["għerq", "root"],
        ["żerriegħa", "seed"],
        ["xatt", "shore"],
        ["ramel", "sand"],
        ["għolja", "hill"],
        ["wied", "valley"]
      ]
    },
    {
      id: "body",
      label: "Body",
      words: [
        ["ras", "head"],
        ["xagħar", "hair"],
        ["għajn", "eye"],
        ["widna", "ear"],
        ["imnieħer", "nose"],
        ["ħalq", "mouth"],
        ["sinna", "tooth"],
        ["ilsien", "tongue"],
        ["għonq", "neck"],
        ["spalla", "shoulder"],
        ["driegħ", "arm"],
        ["id", "hand"],
        ["saba", "finger"],
        ["dahar", "back"],
        ["żaqq", "belly"],
        ["riġel", "leg"],
        ["irkoppa", "knee"],
        ["sieq", "foot"],
        ["ġisem", "body"],
        ["qalb", "heart"]
      ]
    },
    {
      id: "time",
      label: "Time",
      words: [
        ["ħin", "time"],
        ["siegħa", "hour"],
        ["minuta", "minute"],
        ["filgħodu", "morning"],
        ["nofsinhar", "noon"],
        ["filgħaxija", "evening"],
        ["lejl", "night"],
        ["illum", "today"],
        ["għada", "tomorrow"],
        ["lbieraħ", "yesterday"],
        ["ġurnata", "day"],
        ["ġimgħa", "week"],
        ["xahar", "month"],
        ["sena", "year"],
        ["rebbiegħa", "spring"],
        ["sajf", "summer"],
        ["ħarifa", "autumn"],
        ["xitwa", "winter"]
      ]
    },
    {
      id: "directions",
      label: "Directions",
      words: [
        ["lemin", "right"],
        ["xellug", "left"],
        ["dritt", "straight"],
        ["quddiem", "in front"],
        ["wara", "behind"],
        ["ħdejn", "near"],
        ["fuq", "on"],
        ["taħt", "under"],
        ["ġewwa", "inside"],
        ["barra", "outside"],
        ["bejn", "between"],
        ["triq", "street"],
        ["kantuniera", "corner"],
        ["qrib", "close"],
        ["bogħod", "far"]
      ]
    },
    {
      id: "town",
      label: "Town",
      words: [
        ["belt", "city"],
        ["raħal", "village"],
        ["ħanut", "shop"],
        ["suq", "market"],
        ["skola", "school"],
        ["knisja", "church"],
        ["sptar", "hospital"],
        ["spiżerija", "pharmacy"],
        ["librerija", "library"],
        ["park", "park"],
        ["pjazza", "square"],
        ["bank", "bank"],
        ["uffiċċju", "office"],
        ["lukanda", "hotel"],
        ["ristorant", "restaurant"],
        ["mużew", "museum"]
      ]
    },
    {
      id: "clothes",
      label: "Clothes",
      words: [
        ["qmis", "shirt"],
        ["flokk", "top"],
        ["qalziet", "trousers"],
        ["dublett", "skirt"],
        ["libsa", "dress"],
        ["ġakketta", "jacket"],
        ["kowt", "coat"],
        ["żarbun", "shoe"],
        ["kalzetti", "socks"],
        ["kappell", "hat"],
        ["xalpa", "scarf"],
        ["ingwanti", "gloves"],
        ["ċinturin", "belt"],
        ["buttuna", "button"],
        ["uniformi", "uniform"]
      ]
    },
    {
      id: "weather",
      label: "Weather",
      words: [
        ["temp", "weather"],
        ["sħun", "hot"],
        ["kiesaħ", "cold"],
        ["frisk", "cool"],
        ["xemxi", "sunny"],
        ["imsaħħab", "cloudy"],
        ["xita", "rain"],
        ["riħ", "wind"],
        ["maltemp", "storm"],
        ["ragħad", "thunder"],
        ["beraq", "lightning"],
        ["ċpar", "fog"],
        ["silġ", "ice"],
        ["qawsalla", "rainbow"]
      ]
    },
    {
      id: "transport",
      label: "Transport",
      words: [
        ["karozza", "car"],
        ["xarabank", "bus"],
        ["rota", "bicycle"],
        ["mutur", "motorbike"],
        ["dgħajsa", "boat"],
        ["vapur", "ship"],
        ["ajruplan", "airplane"],
        ["ferrovija", "train"],
        ["taxi", "taxi"],
        ["triq", "road"],
        ["pont", "bridge"],
        ["port", "harbour"],
        ["waqfa", "stop"],
        ["biljett", "ticket"],
        ["vjaġġ", "journey"]
      ]
    },
    {
      id: "colors",
      label: "Colours",
      words: [
        ["aħmar", "red"],
        ["blu", "blue"],
        ["isfar", "yellow"],
        ["aħdar", "green"],
        ["abjad", "white"],
        ["iswed", "black"],
        ["kannella", "brown"],
        ["roża", "pink"],
        ["vjola", "purple"],
        ["oranġjo", "orange"],
        ["griż", "grey"],
        ["dehbi", "golden"]
      ]
    }
  ];
  const TOPICS = Array.isArray(window.MALTI_WORD_SEARCH_TOPICS)
    ? window.MALTI_WORD_SEARCH_TOPICS
    : FALLBACK_TOPICS;

  const board = document.querySelector("#word-search-board");
  const list = document.querySelector("#word-search-list");
  const topicSelect = document.querySelector("#word-search-topic");
  const sizeSelect = document.querySelector("#word-search-size");
  const hintsSelect = document.querySelector("#word-search-hints");
  const listCard = document.querySelector("#word-search-list-card");
  const newButton = document.querySelector("#word-search-new");
  const resetMemoryButton = document.querySelector("#word-search-reset-memory");
  const progress = document.querySelector("#word-search-progress");
  const memoryLabel = document.querySelector("#word-search-memory");
  const status = document.querySelector("#word-search-status");
  const foundCount = document.querySelector("#word-search-found-count");
  const totalLabel = document.querySelector("#word-search-total");

  if (!board || !list || !topicSelect || !sizeSelect || !newButton) return;

  const state = {
    topic: "all",
    size: 10,
    puzzle: null,
    found: new Set(),
    seenWords: new Set(),
    lastPuzzleUsedSeenWords: false,
    dragging: false,
    startCell: null,
    selectedCells: []
  };
  let audioContext = null;

  const tokenize = (word) => word.toLowerCase().match(/għ|[a-zàèìòùċġħż]/g) || [];
  const wordKey = (word) => tokenize(word).join("");
  const randomItem = (items) => items[Math.floor(Math.random() * items.length)];
  const cellId = (row, col) => `${row}-${col}`;

  const readSeenWords = () => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(SEEN_STORAGE_KEY) || "[]");
      return new Set(Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : []);
    } catch (error) {
      return new Set();
    }
  };

  const writeSeenWords = () => {
    try {
      window.localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify([...state.seenWords]));
    } catch (error) {
      // Ignore storage failures; the in-memory set still works for this page session.
    }
  };

  const updateMemoryLabel = () => {
    if (!memoryLabel) return;
    const count = state.seenWords.size;
    memoryLabel.textContent = `${count} seen ${count === 1 ? "word" : "words"} excluded.`;
  };

  const getAudioContext = () => {
    if (!audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      audioContext = new AudioContext();
    }
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    return audioContext;
  };

  const playTone = (frequency, startTime, duration, type, gainValue) => {
    const context = getAudioContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.03);
  };

  const playSound = (type) => {
    const context = getAudioContext();
    if (!context) return;

    const now = context.currentTime;
    if (type === "success") {
      playTone(523.25, now, 0.16, "sine", 0.055);
      playTone(659.25, now + 0.08, 0.18, "sine", 0.05);
      playTone(783.99, now + 0.16, 0.2, "sine", 0.045);
      return;
    }

    if (type === "refresh") {
      playTone(392, now, 0.1, "sine", 0.035);
      playTone(493.88, now + 0.06, 0.12, "sine", 0.032);
      return;
    }

    if (type === "victory") {
      playTone(523.25, now, 0.14, "sine", 0.055);
      playTone(659.25, now + 0.08, 0.16, "sine", 0.052);
      playTone(783.99, now + 0.16, 0.18, "sine", 0.05);
      playTone(1046.5, now + 0.3, 0.32, "triangle", 0.045);
      playTone(1318.51, now + 0.38, 0.28, "sine", 0.035);
      return;
    }

    playTone(196, now, 0.12, "triangle", 0.045);
    playTone(146.83, now + 0.09, 0.16, "triangle", 0.04);
  };

  const shuffle = (items) => {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const nextIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
    }
    return copy;
  };

  const uniqueWords = (words) => {
    const seen = new Set();
    return words.filter((entry) => {
      const key = wordKey(entry.word);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const getWords = () => {
    const sourceTopics = state.topic === "all"
      ? TOPICS
      : TOPICS.filter((topic) => topic.id === state.topic);

    return uniqueWords(sourceTopics.flatMap((topic) => topic.words.map(([word, translation]) => ({
      word,
      translation,
      topic: topic.label
    }))));
  };

  const makeGrid = (size) => Array.from({ length: size }, () => Array.from({ length: size }, () => null));

  const canPlace = (grid, tokens, row, col, direction) => {
    for (let index = 0; index < tokens.length; index += 1) {
      const nextRow = row + direction.row * index;
      const nextCol = col + direction.col * index;
      if (nextRow < 0 || nextRow >= grid.length || nextCol < 0 || nextCol >= grid.length) return false;
      if (grid[nextRow][nextCol] && grid[nextRow][nextCol] !== tokens[index]) return false;
    }
    return true;
  };

  const placeWord = (grid, entry) => {
    const tokens = tokenize(entry.word);

    for (let attempt = 0; attempt < 180; attempt += 1) {
      const direction = randomItem(DIRECTIONS);
      const row = Math.floor(Math.random() * grid.length);
      const col = Math.floor(Math.random() * grid.length);

      if (!canPlace(grid, tokens, row, col, direction)) continue;

      const cells = [];
      tokens.forEach((token, index) => {
        const nextRow = row + direction.row * index;
        const nextCol = col + direction.col * index;
        grid[nextRow][nextCol] = token;
        cells.push(cellId(nextRow, nextCol));
      });

      return { ...entry, key: wordKey(entry.word), tokens, cells };
    }

    return null;
  };

  const fillGrid = (grid) => {
    grid.forEach((row) => {
      row.forEach((value, index) => {
        if (!value) row[index] = randomItem(MALTESE_LETTERS);
      });
    });
  };

  const generatePuzzle = () => {
    const targetCount = state.size === 8 ? 7 : state.size === 12 ? 12 : 10;
    const grid = makeGrid(state.size);
    const placed = [];
    const allCandidates = shuffle(getWords())
      .filter((entry) => {
        const length = tokenize(entry.word).length;
        return length >= 2 && length <= state.size;
      })
      .sort((a, b) => tokenize(b.word).length - tokenize(a.word).length);
    const freshCandidates = allCandidates.filter((entry) => !state.seenWords.has(wordKey(entry.word)));
    const candidates = freshCandidates.length >= targetCount
      ? freshCandidates
      : freshCandidates.concat(allCandidates.filter((entry) => state.seenWords.has(wordKey(entry.word))));

    state.lastPuzzleUsedSeenWords = freshCandidates.length < targetCount && allCandidates.length > freshCandidates.length;

    candidates.forEach((entry) => {
      if (placed.length >= targetCount) return;
      const placedEntry = placeWord(grid, entry);
      if (placedEntry) placed.push(placedEntry);
    });

    fillGrid(grid);
    return {
      grid,
      words: placed.sort((a, b) => a.word.localeCompare(b.word, "mt"))
    };
  };

  const getLineCells = (start, end) => {
    const rowDelta = end.row - start.row;
    const colDelta = end.col - start.col;
    const straight = rowDelta === 0 || colDelta === 0 || Math.abs(rowDelta) === Math.abs(colDelta);
    if (!straight) return [start];

    const length = Math.max(Math.abs(rowDelta), Math.abs(colDelta));
    const rowStep = rowDelta === 0 ? 0 : rowDelta / Math.abs(rowDelta);
    const colStep = colDelta === 0 ? 0 : colDelta / Math.abs(colDelta);

    return Array.from({ length: length + 1 }, (_, index) => ({
      row: start.row + rowStep * index,
      col: start.col + colStep * index
    }));
  };

  const getCellFromEvent = (event) => {
    let target = event.target.closest?.(".word-search-cell");
    if (!target && typeof document.elementFromPoint === "function") {
      target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".word-search-cell");
    }
    if (!target || !board.contains(target)) return null;
    return {
      row: Number(target.dataset.row),
      col: Number(target.dataset.col)
    };
  };

  const clearSelecting = () => {
    board.querySelectorAll(".is-selecting").forEach((cell) => cell.classList.remove("is-selecting"));
  };

  const paintSelection = () => {
    clearSelecting();
    state.selectedCells.forEach((cell) => {
      const element = board.querySelector(`[data-cell-id="${cellId(cell.row, cell.col)}"]`);
      if (element && !element.classList.contains("is-found")) {
        element.classList.add("is-selecting");
      }
    });
  };

  const selectedValue = () => state.selectedCells.map((cell) => state.puzzle.grid[cell.row][cell.col]).join("");

  const updateProgress = () => {
    const found = state.found.size;
    const total = state.puzzle.words.length;
    const left = Math.max(total - found, 0);
    progress.textContent = `${found} found, ${left} left`;
    foundCount.textContent = `${found} found`;
    totalLabel.textContent = `${total} words`;

    if (total > 0 && found === total) {
      status.textContent = "Puzzle complete. Great work.";
    }
  };

  const markFound = (entry) => {
    const colorClass = FOUND_COLOR_CLASSES[state.found.size % FOUND_COLOR_CLASSES.length];
    state.found.add(entry.key);
    state.seenWords.add(entry.key);
    writeSeenWords();
    updateMemoryLabel();
    entry.cells.forEach((id) => {
      const cell = board.querySelector(`[data-cell-id="${id}"]`);
      if (cell) {
        cell.classList.add("is-found", colorClass);
      }
    });
    const wordItem = list.querySelector(`[data-word-key="${entry.key}"]`);
    if (wordItem) {
      wordItem.classList.add("is-found", colorClass);
    }
    status.textContent = `Found: ${entry.word} (${entry.translation})`;
    updateProgress();
  };

  const finishSelection = () => {
    if (!state.dragging) return;

    const value = selectedValue();
    const reverseValue = tokenize(value).reverse().join("");
    const foundEntry = state.puzzle.words.find((entry) => (
      !state.found.has(entry.key) && (entry.key === value || entry.key === reverseValue)
    ));

    if (foundEntry) {
      markFound(foundEntry);
      playSound(state.found.size === state.puzzle.words.length ? "victory" : "success");
    } else if (state.selectedCells.length > 1) {
      status.textContent = "Try another line.";
      playSound("miss");
    }

    clearSelecting();
    state.dragging = false;
    state.startCell = null;
    state.selectedCells = [];
  };

  const renderBoard = () => {
    board.style.setProperty("--word-search-size", state.size);
    board.innerHTML = "";

    state.puzzle.grid.forEach((row, rowIndex) => {
      row.forEach((letter, colIndex) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "word-search-cell";
        button.dataset.row = String(rowIndex);
        button.dataset.col = String(colIndex);
        button.dataset.cellId = cellId(rowIndex, colIndex);
        button.textContent = letter.toUpperCase();
        board.appendChild(button);
      });
    });
  };

  const renderList = () => {
    list.innerHTML = "";
    state.puzzle.words.forEach((entry) => {
      const item = document.createElement("li");
      item.dataset.wordKey = entry.key;
      item.innerHTML = `
        <span class="word-search-word">${entry.word}</span>
        <span class="word-search-translation">${entry.translation}</span>
      `;
      list.appendChild(item);
    });
  };

  const startPuzzle = () => {
    const animateRefresh = Boolean(state.puzzle);
    if (animateRefresh) {
      board.classList.remove("is-refreshing");
      list.classList.remove("is-refreshing");
      void board.offsetWidth;
      board.classList.add("is-refreshing");
      list.classList.add("is-refreshing");
      playSound("refresh");
    }

    state.topic = topicSelect.value;
    state.size = Number(sizeSelect.value);
    state.puzzle = generatePuzzle();
    state.found = new Set();
    state.dragging = false;
    state.startCell = null;
    state.selectedCells = [];
    renderBoard();
    renderList();
    updateProgress();
    status.textContent = state.lastPuzzleUsedSeenWords
      ? "New puzzle ready. Some seen words were reused because this topic is running low."
      : "New puzzle ready.";
  };

  board.addEventListener("animationend", () => {
    board.classList.remove("is-refreshing");
  });

  list.addEventListener("animationend", () => {
    list.classList.remove("is-refreshing");
  });

  const updateListVisibility = () => {
    if (!hintsSelect || !listCard) return;
    const mode = hintsSelect.value;
    const hidden = mode === "hide-all";
    listCard.classList.toggle("is-hidden", hidden);
    listCard.classList.toggle("hide-maltese", mode === "hide-maltese");
    listCard.setAttribute("aria-hidden", String(hidden));

    if (mode === "hide-all") {
      status.textContent = "All hints hidden. Find words from memory.";
    } else if (mode === "hide-maltese") {
      status.textContent = "Maltese words hidden. Use the English hints.";
    } else {
      status.textContent = "All hints visible.";
    }
  };

  const initTopics = () => {
    TOPICS.forEach((topic) => {
      const option = document.createElement("option");
      option.value = topic.id;
      option.textContent = topic.label;
      topicSelect.appendChild(option);
    });
  };

  board.addEventListener("pointerdown", (event) => {
    const cell = getCellFromEvent(event);
    if (!cell) return;
    state.dragging = true;
    state.startCell = cell;
    state.selectedCells = [cell];
    board.setPointerCapture(event.pointerId);
    paintSelection();
  });

  board.addEventListener("pointermove", (event) => {
    if (!state.dragging || !state.startCell) return;
    const cell = getCellFromEvent(event);
    if (!cell) return;
    state.selectedCells = getLineCells(state.startCell, cell);
    paintSelection();
  });

  board.addEventListener("pointerup", finishSelection);
  board.addEventListener("pointercancel", finishSelection);
  newButton.addEventListener("click", startPuzzle);
  resetMemoryButton?.addEventListener("click", () => {
    state.seenWords.clear();
    writeSeenWords();
    updateMemoryLabel();
    status.textContent = "Seen word memory reset.";
  });
  topicSelect.addEventListener("change", startPuzzle);
  sizeSelect.addEventListener("change", startPuzzle);
  hintsSelect?.addEventListener("change", updateListVisibility);

  initTopics();
  state.seenWords = readSeenWords();
  updateMemoryLabel();
  updateListVisibility();
  startPuzzle();
})();
