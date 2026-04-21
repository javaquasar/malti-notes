(function () {
    const STORAGE_KEY = "malti_review_cards_v2";

    function loadState() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return {};
            }
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function saveState(state) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function collapseSpaces(value) {
        return String(value || "").replace(/\s+/g, " ").trim();
    }

    function normalizeQuotes(value) {
        return collapseSpaces(value).replace(/[’`´]/g, "'");
    }

    function normalizeForKey(value) {
        return normalizeQuotes(value).toLocaleLowerCase();
    }

    function titleCaseLoose(value) {
        const clean = collapseSpaces(value);
        if (!clean) {
            return "";
        }
        return clean.charAt(0).toUpperCase() + clean.slice(1);
    }

    function toIsoAfterDays(days) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        now.setDate(now.getDate() + days);
        return now.toISOString();
    }

    function normalizeCard(card) {
        const item = Object.assign({}, card);
        item.type = item.type || "word-card";
        item.topic = titleCaseLoose(item.topic || "General");
        item.sourcePage = item.sourcePage || "";
        item.addedAt = item.addedAt || new Date().toISOString();
        item.reviewCount = typeof item.reviewCount === "number" ? item.reviewCount : 0;
        item.box = typeof item.box === "number" ? item.box : 0;
        item.nextReviewAt = item.nextReviewAt || new Date().toISOString();
        item.lastReviewedAt = item.lastReviewedAt || null;

        if (item.type === "verb-form-card") {
            item.lemma = collapseSpaces(item.lemma);
            item.translation = collapseSpaces(item.translation);
            item.tense = collapseSpaces(item.tense);
            item.pronoun = collapseSpaces(item.pronoun);
            item.polarity = collapseSpaces(item.polarity || "positive");
            item.prompt = collapseSpaces(item.prompt || (item.pronoun + " + " + item.lemma + " (" + item.tense + (item.polarity === "negative" ? ", negative" : "") + ")"));
            item.answer = collapseSpaces(item.answer);
            item.example = collapseSpaces(item.example || "");
            item.normalizedKey = item.normalizedKey || [
                normalizeForKey(item.lemma),
                normalizeForKey(item.tense),
                normalizeForKey(item.pronoun),
                normalizeForKey(item.polarity)
            ].join("::");
            item.id = item.id || ("verb::" + item.normalizedKey);
        } else if (item.type === "sentence-card") {
            item.maltese = collapseSpaces(item.maltese);
            item.english = collapseSpaces(item.english || "");
            item.group = collapseSpaces(item.group || "");
            item.displayMaltese = item.displayMaltese || item.maltese;
            item.normalizedMaltese = item.normalizedMaltese || normalizeForKey(item.maltese);
            item.prompt = collapseSpaces(item.prompt || item.maltese);
            item.answer = collapseSpaces(item.answer || item.english);
            item.id = item.id || ("sentence::" + item.topic + "::" + item.normalizedMaltese);
        } else {
            item.maltese = collapseSpaces(item.maltese);
            item.english = collapseSpaces(item.english || "");
            item.example = collapseSpaces(item.example || "");
            item.displayMaltese = item.displayMaltese || item.maltese;
            item.normalizedMaltese = item.normalizedMaltese || normalizeForKey(item.maltese);
            item.id = item.id || ("word::" + item.topic + "::" + item.normalizedMaltese);
        }

        return item;
    }

    function mergeCardData(existing, incoming) {
        const merged = Object.assign({}, existing);

        Object.keys(incoming || {}).forEach(function (key) {
            const value = incoming[key];
            const isEmptyString = typeof value === "string" && !value.trim();
            if (value === undefined || value === null || isEmptyString) {
                return;
            }
            merged[key] = value;
        });

        return merged;
    }

    function getAllCards() {
        const state = loadState();
        return Object.keys(state).map(function (key) {
            return normalizeCard(state[key]);
        }).sort(function (a, b) {
            const left = a.type === "verb-form-card" ? a.prompt : a.maltese;
            const right = b.type === "verb-form-card" ? b.prompt : b.maltese;
            return String(left || "").localeCompare(String(right || ""));
        });
    }

    function getCard(id) {
        const state = loadState();
        return state[id] ? normalizeCard(state[id]) : null;
    }

    function hasCard(id) {
        return !!getCard(id);
    }

    function saveCard(card) {
        const state = loadState();
        const normalized = normalizeCard(card);
        const existing = state[normalized.id] ? normalizeCard(state[normalized.id]) : null;
        state[normalized.id] = existing ? normalizeCard(mergeCardData(existing, normalized)) : normalized;
        saveState(state);
        return normalizeCard(state[normalized.id]);
    }

    function addWord(word) {
        return saveCard(Object.assign({}, word, { type: "word-card" }));
    }

    function addSentence(sentence) {
        return saveCard(Object.assign({}, sentence, { type: "sentence-card" }));
    }

    function addCustomWord(input) {
        return addWord({
            maltese: normalizeQuotes(input.maltese),
            english: collapseSpaces(input.english || ""),
            example: collapseSpaces(input.example || ""),
            topic: input.topic || "Custom",
            sourcePage: input.sourcePage || "manual"
        });
    }

    function addVerbDrill(verb) {
        const saved = [];
        Object.keys(verb.forms || {}).forEach(function (tense) {
            const tenseForms = verb.forms[tense];
            Object.keys(tenseForms).forEach(function (pronoun) {
                saved.push(saveCard({
                    type: "verb-form-card",
                    lemma: verb.lemma,
                    translation: verb.translation,
                    tense: tense,
                    pronoun: pronoun,
                    polarity: "positive",
                    answer: tenseForms[pronoun],
                    prompt: pronoun + " + " + verb.lemma + " (" + tense + ")",
                    topic: verb.topic || "Verb Drill",
                    sourcePage: verb.sourcePage || "verbs_guide.html",
                    example: verb.example || ""
                }));
            });
        });
        return saved;
    }

    function addVerbTables(details, options) {
        const saved = [];
        const tables = details?.tables || {};
        const settings = options || {};
        const translation = collapseSpaces(settings.translation || (details?.meanings || []).join(" / "));

        Object.keys(tables).forEach(function (tense) {
            ["positive", "negative"].forEach(function (polarity) {
                const forms = tables[tense]?.[polarity] || {};
                Object.keys(forms).forEach(function (pronoun) {
                    saved.push(saveCard({
                        type: "verb-form-card",
                        lemma: details.lemma,
                        translation: translation,
                        tense: tense,
                        pronoun: pronoun,
                        polarity: polarity,
                        answer: forms[pronoun],
                        prompt: pronoun + " + " + details.lemma + " (" + tense + (polarity === "negative" ? ", negative" : "") + ")",
                        topic: settings.topic || "Verb Drill",
                        sourcePage: settings.sourcePage || "verbs_guide.html",
                        example: settings.example || ""
                    }));
                });
            });
        });

        return saved;
    }

    function removeCard(id) {
        const state = loadState();
        delete state[id];
        saveState(state);
    }

    function getDueCards() {
        const now = Date.now();
        return getAllCards().filter(function (card) {
            return new Date(card.nextReviewAt).getTime() <= now;
        });
    }

    function reviewCard(id, grade) {
        const state = loadState();
        if (!state[id]) {
            return null;
        }

        const card = normalizeCard(state[id]);
        let nextBox = card.box;
        let nextDays = 0;

        if (grade === "again") {
            nextBox = 0;
            nextDays = 0;
        } else if (grade === "good") {
            nextBox = Math.min(card.box + 1, 4);
            nextDays = [1, 2, 4, 7, 14][nextBox];
        } else if (grade === "easy") {
            nextBox = Math.min(card.box + 2, 5);
            nextDays = [2, 4, 7, 14, 21, 30][nextBox];
        }

        card.box = nextBox;
        card.reviewCount += 1;
        card.lastReviewedAt = new Date().toISOString();
        card.nextReviewAt = grade === "again" ? new Date(Date.now() + 10 * 60 * 1000).toISOString() : toIsoAfterDays(nextDays);

        state[id] = card;
        saveState(state);
        return card;
    }

    function getStats() {
        const all = getAllCards();
        const due = getDueCards();
        const verbCards = all.filter(function (card) { return card.type === "verb-form-card"; }).length;
        const sentenceCards = all.filter(function (card) { return card.type === "sentence-card"; }).length;
        const wordCards = all.length - verbCards - sentenceCards;
        return {
            total: all.length,
            due: due.length,
            words: wordCards,
            verbs: verbCards,
            sentences: sentenceCards
        };
    }

    window.MaltiReviewStore = {
        addWord: addWord,
        addSentence: addSentence,
        addCustomWord: addCustomWord,
        addVerbDrill: addVerbDrill,
        addVerbTables: addVerbTables,
        getAllWords: getAllCards,
        getAllCards: getAllCards,
        getDueWords: getDueCards,
        getDueCards: getDueCards,
        getWord: getCard,
        getCard: getCard,
        hasWord: hasCard,
        hasCard: hasCard,
        removeWord: removeCard,
        removeCard: removeCard,
        reviewWord: reviewCard,
        reviewCard: reviewCard,
        getStats: getStats,
        normalizeQuotes: normalizeQuotes,
        normalizeForKey: normalizeForKey
    };
}());
