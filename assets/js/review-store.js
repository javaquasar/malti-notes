(function () {
    var STORAGE_KEY = "malti_review_words_v1";

    function loadState() {
        try {
            var raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return {};
            }
            var parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function saveState(state) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function toIsoAfterDays(days) {
        var now = new Date();
        now.setHours(0, 0, 0, 0);
        now.setDate(now.getDate() + days);
        return now.toISOString();
    }

    function normalizeWord(word) {
        var item = Object.assign({}, word);
        item.id = item.id || [item.topic || "General", item.maltese || "", item.english || ""].join("::");
        item.topic = item.topic || "General";
        item.sourcePage = item.sourcePage || "";
        item.example = item.example || "";
        item.addedAt = item.addedAt || new Date().toISOString();
        item.reviewCount = typeof item.reviewCount === "number" ? item.reviewCount : 0;
        item.box = typeof item.box === "number" ? item.box : 0;
        item.nextReviewAt = item.nextReviewAt || new Date().toISOString();
        item.lastReviewedAt = item.lastReviewedAt || null;
        return item;
    }

    function getAllWords() {
        var state = loadState();
        return Object.keys(state).map(function (key) {
            return normalizeWord(state[key]);
        }).sort(function (a, b) {
            return (a.maltese || "").localeCompare(b.maltese || "");
        });
    }

    function getWord(id) {
        var state = loadState();
        return state[id] ? normalizeWord(state[id]) : null;
    }

    function hasWord(id) {
        return !!getWord(id);
    }

    function addWord(word) {
        var state = loadState();
        var normalized = normalizeWord(word);
        if (!state[normalized.id]) {
            state[normalized.id] = normalized;
            saveState(state);
        }
        return normalizeWord(state[normalized.id] || normalized);
    }

    function removeWord(id) {
        var state = loadState();
        delete state[id];
        saveState(state);
    }

    function getDueWords() {
        var now = Date.now();
        return getAllWords().filter(function (word) {
            return new Date(word.nextReviewAt).getTime() <= now;
        });
    }

    function reviewWord(id, grade) {
        var state = loadState();
        if (!state[id]) {
            return null;
        }

        var word = normalizeWord(state[id]);
        var nextBox = word.box;
        var nextDays = 0;

        if (grade === "again") {
            nextBox = 0;
            nextDays = 0;
        } else if (grade === "good") {
            nextBox = Math.min(word.box + 1, 4);
            nextDays = [1, 2, 4, 7, 14][nextBox];
        } else if (grade === "easy") {
            nextBox = Math.min(word.box + 2, 5);
            nextDays = [2, 4, 7, 14, 21, 30][nextBox];
        }

        word.box = nextBox;
        word.reviewCount += 1;
        word.lastReviewedAt = new Date().toISOString();
        word.nextReviewAt = grade === "again" ? new Date(Date.now() + 10 * 60 * 1000).toISOString() : toIsoAfterDays(nextDays);

        state[id] = word;
        saveState(state);
        return word;
    }

    function getStats() {
        var all = getAllWords();
        var due = getDueWords();
        return {
            total: all.length,
            due: due.length
        };
    }

    window.MaltiReviewStore = {
        addWord: addWord,
        getAllWords: getAllWords,
        getDueWords: getDueWords,
        getWord: getWord,
        hasWord: hasWord,
        removeWord: removeWord,
        reviewWord: reviewWord,
        getStats: getStats
    };
}());
