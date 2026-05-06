(() => {
  const MALTESE_LETTERS = ["a", "b", "c", "ċ", "d", "e", "è", "f", "ġ", "g", "h", "ħ", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "ż", "z"];
  const SEEN_STORAGE_KEY = "malti_word_search_seen_words_v1";
  const BEST_TIME_STORAGE_KEY = "malti_word_search_best_times_v1";
  const SOUND_STORAGE_KEY = "malti_word_search_sound_v1";
  const DIRECTION_SETS = {
    easy: [
      { row: 0, col: 1 },
      { row: 1, col: 0 }
    ],
    medium: [
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: -1 }
    ],
    hard: [
      { row: 0, col: 1 },
      { row: 0, col: -1 },
      { row: 1, col: 0 },
      { row: -1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: -1 },
      { row: -1, col: 1 },
      { row: -1, col: -1 }
    ]
  };
  const FOUND_COLOR_CLASSES = [
    "found-color-1",
    "found-color-2",
    "found-color-3",
    "found-color-4",
    "found-color-5",
    "found-color-6",
    "found-color-7",
    "found-color-8",
    "found-color-9",
    "found-color-10",
    "found-color-11",
    "found-color-12"
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
  const selectionPreview = document.querySelector("#word-search-selection-preview");
  const topicSelect = document.querySelector("#word-search-topic");
  const sizeSelect = document.querySelector("#word-search-size");
  const directionsSelect = document.querySelector("#word-search-directions");
  const hintsSelect = document.querySelector("#word-search-hints");
  const soundSelect = document.querySelector("#word-search-sound");
  const listCard = document.querySelector("#word-search-list-card");
  const hintButton = document.querySelector("#word-search-hint");
  const newButton = document.querySelector("#word-search-new");
  const printButton = document.querySelector("#word-search-print");
  const resetMemoryButton = document.querySelector("#word-search-reset-memory");
  const progress = document.querySelector("#word-search-progress");
  const progressFill = document.querySelector("#word-search-progress-fill");
  const memoryLabel = document.querySelector("#word-search-memory");
  const status = document.querySelector("#word-search-status");
  const foundCount = document.querySelector("#word-search-found-count");
  const totalLabel = document.querySelector("#word-search-total");
  const timerLabel = document.querySelector("#word-search-timer");
  const bestTimeLabel = document.querySelector("#word-search-best-time");

  if (!board || !list || !topicSelect || !sizeSelect || !newButton) return;

  const state = {
    topic: "all",
    size: 10,
    directionsMode: "medium",
    soundEnabled: true,
    puzzle: null,
    found: new Set(),
    seenWords: new Set(),
    lastPuzzleUsedSeenWords: false,
    startedAt: 0,
    elapsedSeconds: 0,
    completed: false,
    dragging: false,
    startCell: null,
    selectedCells: []
  };
  let audioContext = null;
  let lastTickAt = 0;
  let lastTickCellId = "";
  let timerInterval = 0;
  let hintTimeout = 0;

  const tokenize = (word) => word.toLowerCase().match(/għ|[a-zàèìòùċġħż]/g) || [];
  const wordKey = (word) => tokenize(word).join("");
  const randomItem = (items) => items[Math.floor(Math.random() * items.length)];
  const cellId = (row, col) => `${row}-${col}`;
  const readSoundEnabled = () => {
    try {
      return window.localStorage.getItem(SOUND_STORAGE_KEY) !== "off";
    } catch (error) {
      return true;
    }
  };
  const writeSoundEnabled = () => {
    try {
      window.localStorage.setItem(SOUND_STORAGE_KEY, state.soundEnabled ? "on" : "off");
    } catch (error) {
      // Ignore storage failures.
    }
  };
  const getDirections = () => DIRECTION_SETS[state.directionsMode] || DIRECTION_SETS.medium;
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  };
  const bestTimeKey = () => `${state.topic}|${state.size}|${state.directionsMode}`;

  const readBestTimes = () => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(BEST_TIME_STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  };

  const updateBestTimeLabel = () => {
    if (!bestTimeLabel) return;
    const best = readBestTimes()[bestTimeKey()];
    bestTimeLabel.textContent = best ? `Best: ${formatTime(best)}` : "Best: --";
  };

  const saveBestTime = () => {
    const bestTimes = readBestTimes();
    const key = bestTimeKey();
    const current = state.elapsedSeconds;
    if (!current || (bestTimes[key] && bestTimes[key] <= current)) return;
    bestTimes[key] = current;
    try {
      window.localStorage.setItem(BEST_TIME_STORAGE_KEY, JSON.stringify(bestTimes));
    } catch (error) {
      // Ignore storage failures on restrictive browsers.
    }
    updateBestTimeLabel();
  };

  const updateTimerLabel = () => {
    if (timerLabel) timerLabel.textContent = formatTime(state.elapsedSeconds);
  };

  const stopTimer = () => {
    if (timerInterval) {
      window.clearInterval(timerInterval);
      timerInterval = 0;
    }
  };

  const startTimer = () => {
    stopTimer();
    state.startedAt = Date.now();
    state.elapsedSeconds = 0;
    state.completed = false;
    updateTimerLabel();
    timerInterval = window.setInterval(() => {
      if (state.completed) return;
      state.elapsedSeconds = Math.floor((Date.now() - state.startedAt) / 1000);
      updateTimerLabel();
    }, 500);
  };

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
    if (!state.soundEnabled) return;
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

    if (type === "tick") {
      playTone(176, now, 0.035, "triangle", 0.018);
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

  const scorePlacement = (grid, tokens, row, col, direction, directionUsage) => {
    let intersections = 0;
    let touches = 0;

    for (let index = 0; index < tokens.length; index += 1) {
      const nextRow = row + direction.row * index;
      const nextCol = col + direction.col * index;
      if (nextRow < 0 || nextRow >= grid.length || nextCol < 0 || nextCol >= grid.length) return null;
      if (grid[nextRow][nextCol] && grid[nextRow][nextCol] !== tokens[index]) return null;
      if (grid[nextRow][nextCol] === tokens[index]) intersections += 1;

      for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
        for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
          if (rowOffset === 0 && colOffset === 0) continue;
          const neighbor = grid[nextRow + rowOffset]?.[nextCol + colOffset];
          if (neighbor) touches += 1;
        }
      }
    }

    const directionKey = `${direction.row},${direction.col}`;
    const directionPenalty = (directionUsage[directionKey] || 0) * 7;
    const fullSpanPenalty = tokens.length >= grid.length ? 18 : 0;
    const edgePenalty = (row === 0 || col === 0 || row === grid.length - 1 || col === grid.length - 1) ? 3 : 0;
    const intersectionBonus = intersections > 0 ? 34 + intersections * 16 : 0;

    return {
      row,
      col,
      direction,
      directionKey,
      intersections,
      score: intersectionBonus + touches * 1.5 - directionPenalty - fullSpanPenalty - edgePenalty + Math.random() * 4
    };
  };

  const placeWord = (grid, entry, directionUsage, requireIntersection) => {
    const tokens = tokenize(entry.word);
    const placements = [];

    getDirections().forEach((direction) => {
      for (let row = 0; row < grid.length; row += 1) {
        for (let col = 0; col < grid.length; col += 1) {
          const placement = scorePlacement(grid, tokens, row, col, direction, directionUsage);
          if (!placement) continue;
          if (requireIntersection && placement.intersections === 0) continue;
          placements.push(placement);
        }
      }
    });

    const placement = placements.sort((a, b) => b.score - a.score)[0];
    if (!placement) return null;

    const cells = [];
    tokens.forEach((token, index) => {
      const nextRow = placement.row + placement.direction.row * index;
      const nextCol = placement.col + placement.direction.col * index;
      grid[nextRow][nextCol] = token;
      cells.push(cellId(nextRow, nextCol));
    });

    directionUsage[placement.directionKey] = (directionUsage[placement.directionKey] || 0) + 1;
    return { ...entry, key: wordKey(entry.word), tokens, cells };
  };

  const fillGrid = (grid) => {
    grid.forEach((row) => {
      row.forEach((value, index) => {
        if (!value) row[index] = randomItem(MALTESE_LETTERS);
      });
    });
  };

  const validatePuzzle = (puzzle) => puzzle.words.every((entry) => {
    const value = entry.cells.map((id) => {
      const [row, col] = id.split("-").map(Number);
      return puzzle.grid[row]?.[col] || "";
    }).join("");
    return value === entry.key;
  });

  const generatePuzzleAttempt = () => {
    const targetCount = state.size === 8 ? 7 : state.size === 12 ? 12 : 10;
    const grid = makeGrid(state.size);
    const placed = [];
    const directionUsage = {};
    const maxLength = Math.max(3, state.size - 1);
    const allCandidates = shuffle(getWords())
      .filter((entry) => {
        const length = tokenize(entry.word).length;
        return length >= 2 && length <= maxLength;
      })
      .sort((a, b) => {
        const lengthDelta = tokenize(b.word).length - tokenize(a.word).length;
        return lengthDelta + (Math.random() - 0.5) * 4;
      });
    const freshCandidates = allCandidates.filter((entry) => !state.seenWords.has(wordKey(entry.word)));
    const candidates = freshCandidates.length >= targetCount
      ? freshCandidates
      : freshCandidates.concat(allCandidates.filter((entry) => state.seenWords.has(wordKey(entry.word))));

    state.lastPuzzleUsedSeenWords = freshCandidates.length < targetCount && allCandidates.length > freshCandidates.length;

    candidates.forEach((entry) => {
      if (placed.length >= targetCount) return;
      const placedEntry = placeWord(grid, entry, directionUsage, placed.length >= 2);
      if (placedEntry) placed.push(placedEntry);
    });

    if (placed.length < targetCount) {
      candidates.forEach((entry) => {
        if (placed.length >= targetCount || placed.some((placedEntry) => placedEntry.key === wordKey(entry.word))) return;
        const placedEntry = placeWord(grid, entry, directionUsage, false);
        if (placedEntry) placed.push(placedEntry);
      });
    }

    fillGrid(grid);
    return {
      grid,
      words: placed.sort((a, b) => a.word.localeCompare(b.word, "mt"))
    };
  };

  const generatePuzzle = () => {
    for (let attempt = 0; attempt < 16; attempt += 1) {
      const puzzle = generatePuzzleAttempt();
      if (puzzle.words.length > 0 && validatePuzzle(puzzle)) {
        return puzzle;
      }
    }

    const puzzle = generatePuzzleAttempt();
    return validatePuzzle(puzzle)
      ? puzzle
      : { grid: makeGrid(state.size).map((row) => row.map(() => randomItem(MALTESE_LETTERS))), words: [] };
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

  const playSelectionTick = (cell) => {
    const id = cellId(cell.row, cell.col);
    const now = performance.now();
    if (id === lastTickCellId || now - lastTickAt < 55) return;
    lastTickCellId = id;
    lastTickAt = now;
    playSound("tick");
  };

  const clearSelecting = () => {
    board.querySelectorAll(".is-selecting, .selection-start, .selection-end, .selection-horizontal, .selection-vertical, .selection-diagonal, .selection-diagonal-down, .selection-diagonal-up")
      .forEach((cell) => {
        cell.classList.remove("is-selecting", "selection-start", "selection-end", "selection-horizontal", "selection-vertical", "selection-diagonal", "selection-diagonal-down", "selection-diagonal-up");
      });
  };

  const clearHint = () => {
    window.clearTimeout(hintTimeout);
    hintTimeout = 0;
    board.querySelectorAll(".is-hint").forEach((cell) => cell.classList.remove("is-hint"));
    list.querySelectorAll(".is-hint").forEach((item) => item.classList.remove("is-hint"));
  };

  const showHint = () => {
    if (!state.puzzle) return;
    clearHint();
    const options = state.puzzle.words.filter((entry) => !state.found.has(entry.key));
    const entry = randomItem(options);
    if (!entry) {
      status.textContent = "No hints left. Puzzle complete.";
      return;
    }

    const firstCell = board.querySelector(`[data-cell-id="${entry.cells[0]}"]`);
    const wordItem = list.querySelector(`[data-word-key="${entry.key}"]`);
    firstCell?.classList.add("is-hint");
    wordItem?.classList.add("is-hint");
    status.textContent = `Hint: starts with ${tokenize(entry.word)[0].toUpperCase()}.`;
    playSound("tick");

    hintTimeout = window.setTimeout(clearHint, 1800);
  };

  const updateSelectionPreview = (message) => {
    if (!selectionPreview) return;
    const text = message || (state.selectedCells.length
      ? selectedValue().toUpperCase()
      : "Selected letters will appear here.");
    selectionPreview.textContent = text;
    selectionPreview.classList.toggle("is-active", state.selectedCells.length > 0 || Boolean(message));
  };

  const paintSelection = () => {
    clearSelecting();
    const first = state.selectedCells[0];
    const last = state.selectedCells[state.selectedCells.length - 1];
    let directionClass = "";
    if (first && last) {
      if (first.row === last.row) {
        directionClass = "selection-horizontal";
      } else if (first.col === last.col) {
        directionClass = "selection-vertical";
      } else {
        directionClass = (last.row - first.row) * (last.col - first.col) > 0
          ? "selection-diagonal-down"
          : "selection-diagonal-up";
      }
    }

    state.selectedCells.forEach((cell, index) => {
      const element = board.querySelector(`[data-cell-id="${cellId(cell.row, cell.col)}"]`);
      if (element) {
        element.classList.add("is-selecting");
        if (directionClass) element.classList.add(directionClass);
        if (index === 0) element.classList.add("selection-start");
        if (index === state.selectedCells.length - 1 && state.selectedCells.length > 1) element.classList.add("selection-end");
      }
    });
    updateSelectionPreview();
  };

  const selectedValue = () => state.selectedCells.map((cell) => state.puzzle.grid[cell.row][cell.col]).join("");

  const updateProgress = () => {
    const found = state.found.size;
    const total = state.puzzle.words.length;
    const left = Math.max(total - found, 0);
    progress.textContent = `${found} found, ${left} left`;
    foundCount.textContent = `${found} found`;
    totalLabel.textContent = `${total} words`;
    if (progressFill) {
      progressFill.style.width = total ? `${Math.round((found / total) * 100)}%` : "0%";
    }

    if (total > 0 && found === total) {
      state.completed = true;
      state.elapsedSeconds = Math.max(state.elapsedSeconds, Math.floor((Date.now() - state.startedAt) / 1000));
      stopTimer();
      saveBestTime();
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
        const overlapCount = Number(cell.dataset.overlapCount || "0") + 1;
        cell.dataset.overlapCount = String(overlapCount);
        if (cell.classList.contains("is-found")) {
          cell.classList.add("is-overlap", colorClass.replace("found-color", "overlap-color"));
        } else {
          cell.classList.add("is-found", colorClass);
        }
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

    const selectedElements = state.selectedCells
      .map((cell) => board.querySelector(`[data-cell-id="${cellId(cell.row, cell.col)}"]`))
      .filter(Boolean);
    const value = selectedValue();
    const reverseValue = state.selectedCells.map((cell) => state.puzzle.grid[cell.row][cell.col]).reverse().join("");
    const foundEntry = state.puzzle.words.find((entry) => (
      !state.found.has(entry.key) && (entry.key === value || entry.key === reverseValue)
    ));

    if (foundEntry) {
      markFound(foundEntry);
      selectedElements.forEach((element) => {
        element.classList.remove("is-success-pulse");
        void element.offsetWidth;
        element.classList.add("is-success-pulse");
      });
      updateSelectionPreview(`Found: ${foundEntry.word}`);
      playSound(state.found.size === state.puzzle.words.length ? "victory" : "success");
    } else if (state.selectedCells.length > 1) {
      status.textContent = "Try another line.";
      selectedElements.forEach((element) => {
        element.classList.remove("is-miss-shake");
        void element.offsetWidth;
        element.classList.add("is-miss-shake");
      });
      updateSelectionPreview("Try another line.");
      playSound("miss");
    }

    clearSelecting();
    state.dragging = false;
    state.startCell = null;
    state.selectedCells = [];
    window.setTimeout(() => updateSelectionPreview(), 260);
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
    state.directionsMode = directionsSelect?.value || "medium";
    clearHint();
    state.puzzle = generatePuzzle();
    state.found = new Set();
    state.dragging = false;
    state.startCell = null;
    state.selectedCells = [];
    renderBoard();
    renderList();
    updateBestTimeLabel();
    startTimer();
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
    lastTickCellId = cellId(cell.row, cell.col);
    lastTickAt = performance.now();
    board.setPointerCapture(event.pointerId);
    paintSelection();
  });

  board.addEventListener("pointermove", (event) => {
    if (!state.dragging || !state.startCell) return;
    const cell = getCellFromEvent(event);
    if (!cell) return;
    playSelectionTick(cell);
    state.selectedCells = getLineCells(state.startCell, cell);
    paintSelection();
  });

  board.addEventListener("pointerup", finishSelection);
  board.addEventListener("pointercancel", finishSelection);
  board.addEventListener("animationend", (event) => {
    event.target.classList?.remove("is-success-pulse", "is-miss-shake");
  });
  newButton.addEventListener("click", startPuzzle);
  printButton?.addEventListener("click", () => window.print());
  resetMemoryButton?.addEventListener("click", () => {
    state.seenWords.clear();
    writeSeenWords();
    updateMemoryLabel();
    status.textContent = "Seen word memory reset.";
  });
  topicSelect.addEventListener("change", startPuzzle);
  sizeSelect.addEventListener("change", startPuzzle);
  directionsSelect?.addEventListener("change", startPuzzle);
  hintsSelect?.addEventListener("change", updateListVisibility);
  hintButton?.addEventListener("click", showHint);
  soundSelect?.addEventListener("change", () => {
    state.soundEnabled = soundSelect.value !== "off";
    writeSoundEnabled();
    status.textContent = state.soundEnabled ? "Sound on." : "Sound off.";
  });

  initTopics();
  state.soundEnabled = readSoundEnabled();
  if (soundSelect) soundSelect.value = state.soundEnabled ? "on" : "off";
  state.seenWords = readSeenWords();
  updateMemoryLabel();
  updateListVisibility();
  startPuzzle();
})();
