(function () {
    var currentCard = null;
    var queue = [];
    var quickSession = {
        active: false,
        limit: 0,
        deckIds: [],
        completed: false,
        reviewed: 0,
        again: 0,
        good: 0,
        easy: 0,
        label: ""
    };
    var ANIMALS_DATA_URL = "./assets/data/animals.json";
    var COLORS_DATA_URL = "./assets/data/colors.json";
    var REVIEW_PREFS_KEY = "malti-review-prefs-v1";

    function byId(id) {
        return document.getElementById(id);
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function getAllCards() {
        return window.MaltiReviewStore.getAllCards();
    }

    function getDueIds() {
        var lookup = {};
        window.MaltiReviewStore.getDueCards().forEach(function (card) {
            lookup[card.id] = true;
        });
        return lookup;
    }

    function getFilters() {
        return {
            topic: byId("review-topic-filter") ? byId("review-topic-filter").value : "",
            type: byId("review-type-filter") ? byId("review-type-filter").value : "",
            tense: byId("review-tense-filter") ? byId("review-tense-filter").value : "",
            direction: byId("review-direction-filter") ? byId("review-direction-filter").value : "maltese-to-english",
            dueOnly: !!(byId("review-due-only") && byId("review-due-only").checked)
        };
    }

    function getCardLayoutMode() {
        return byId("review-card-layout") ? byId("review-card-layout").value : "classic";
    }

    function getReviewPreferences() {
        var filtersPanel = byId("review-filters-panel");
        return {
            topic: byId("review-topic-filter") ? byId("review-topic-filter").value : "",
            type: byId("review-type-filter") ? byId("review-type-filter").value : "",
            tense: byId("review-tense-filter") ? byId("review-tense-filter").value : "",
            direction: byId("review-direction-filter") ? byId("review-direction-filter").value : "maltese-to-english",
            dueOnly: !!(byId("review-due-only") && byId("review-due-only").checked),
            layout: getCardLayoutMode(),
            showVisual: !!(byId("review-answer-show-visual") && byId("review-answer-show-visual").checked),
            showExample: !(byId("review-answer-show-example")) || !!byId("review-answer-show-example").checked,
            showVerbLemma: !(byId("review-verb-show-lemma")) || !!byId("review-verb-show-lemma").checked,
            filtersOpen: !filtersPanel || !!filtersPanel.open
        };
    }

    function saveReviewPreferences() {
        try {
            window.localStorage.setItem(REVIEW_PREFS_KEY, JSON.stringify(getReviewPreferences()));
        } catch (error) {
            // Ignore storage errors and keep the page usable.
        }
    }

    function loadReviewPreferences() {
        try {
            var raw = window.localStorage.getItem(REVIEW_PREFS_KEY);
            if (!raw) {
                return null;
            }
            return JSON.parse(raw);
        } catch (error) {
            return null;
        }
    }

    function applyReviewPreferences(preferences) {
        if (!preferences) {
            return;
        }

        function setValue(id, value) {
            var element = byId(id);
            if (element && typeof value === "string") {
                element.value = value;
            }
        }

        function setChecked(id, value) {
            var element = byId(id);
            if (element && typeof value === "boolean") {
                element.checked = value;
            }
        }

        setValue("review-topic-filter", preferences.topic || "");
        setValue("review-type-filter", preferences.type || "");
        setValue("review-tense-filter", preferences.tense || "");
        setValue("review-direction-filter", preferences.direction || "maltese-to-english");
        setValue("review-card-layout", preferences.layout || "classic");

        setChecked("review-due-only", !!preferences.dueOnly);
        setChecked("review-answer-show-visual", !!preferences.showVisual);
        if (typeof preferences.showExample === "boolean") {
            setChecked("review-answer-show-example", preferences.showExample);
        }
        if (typeof preferences.showVerbLemma === "boolean") {
            setChecked("review-verb-show-lemma", preferences.showVerbLemma);
        }

        var filtersPanel = byId("review-filters-panel");
        if (filtersPanel && typeof preferences.filtersOpen === "boolean") {
            filtersPanel.open = preferences.filtersOpen;
        }
    }

    function cardMatches(card, filters, dueLookup) {
        if (filters.topic && card.topic !== filters.topic) {
            return false;
        }
        if (filters.type && card.type !== filters.type) {
            return false;
        }
        if (filters.tense) {
            if (card.type !== "verb-form-card") {
                return false;
            }
            if (String(card.tense || "").toLowerCase() !== String(filters.tense).toLowerCase()) {
                return false;
            }
        }
        if (filters.dueOnly && !dueLookup[card.id]) {
            return false;
        }
        return true;
    }

    function formatTenseLabel(value) {
        var tense = String(value || "").trim().toLowerCase();
        if (!tense) {
            return "";
        }
        if (tense === "present") {
            return "Present";
        }
        if (tense === "past") {
            return "Past";
        }
        if (tense === "imperative") {
            return "Imperative";
        }
        return tense.charAt(0).toUpperCase() + tense.slice(1);
    }

    function getFilteredCards() {
        var filters = getFilters();
        var dueLookup = getDueIds();
        return getAllCards().filter(function (card) {
            return cardMatches(card, filters, dueLookup);
        });
    }

    function clearQuickSession() {
        quickSession.active = false;
        quickSession.limit = 0;
        quickSession.deckIds = [];
        quickSession.completed = false;
        quickSession.reviewed = 0;
        quickSession.again = 0;
        quickSession.good = 0;
        quickSession.easy = 0;
        quickSession.label = "";
    }

    function activateQuickSession(limit) {
        quickSession.active = true;
        quickSession.limit = limit;
        quickSession.deckIds = [];
        quickSession.completed = false;
        quickSession.reviewed = 0;
        quickSession.again = 0;
        quickSession.good = 0;
        quickSession.easy = 0;
        quickSession.label = "";
    }

    function buildQuickSessionDeck() {
        return getFilteredCards().slice(0, quickSession.limit).map(function (card) {
            return card.id;
        });
    }

    function getCardsByIds(ids) {
        var lookup = {};
        getAllCards().forEach(function (card) {
            lookup[card.id] = card;
        });
        return ids.map(function (id) {
            return lookup[id];
        }).filter(Boolean);
    }

    function restartQuickSession() {
        if (!quickSession.active || !quickSession.deckIds.length) {
            return;
        }
        quickSession.completed = false;
        quickSession.reviewed = 0;
        quickSession.again = 0;
        quickSession.good = 0;
        quickSession.easy = 0;
        queue = getCardsByIds(quickSession.deckIds);
        renderQuickSessionStatus();
        renderSavedList();
        renderCard();
    }

    function renderStats() {
        var stats = window.MaltiReviewStore.getStats();
        byId("review-stats").textContent = stats.total + " saved, " + stats.due + " due now";
        byId("review-breakdown").textContent = stats.words + " words, " + stats.verbs + " verb forms";
    }

    function buildTopicStats() {
        var dueLookup = getDueIds();
        var topics = {};

        getAllCards().forEach(function (card) {
            var topic = card.topic || "General";
            if (!topics[topic]) {
                topics[topic] = {
                    topic: topic,
                    total: 0,
                    due: 0,
                    words: 0,
                    verbs: 0
                };
            }

            topics[topic].total += 1;
            if (dueLookup[card.id]) {
                topics[topic].due += 1;
            }
            if (card.type === "verb-form-card") {
                topics[topic].verbs += 1;
            } else {
                topics[topic].words += 1;
            }
        });

        return Object.keys(topics)
            .map(function (key) { return topics[key]; })
            .sort(function (a, b) {
                if (b.due !== a.due) {
                    return b.due - a.due;
                }
                if (b.total !== a.total) {
                    return b.total - a.total;
                }
                return String(a.topic).localeCompare(String(b.topic));
            });
    }

    function renderTopicOverview() {
        var container = byId("review-topic-grid");
        if (!container) {
            return;
        }

        var topics = buildTopicStats();
        if (!topics.length) {
            container.innerHTML = "<div class=\"review-topic-empty\">No saved topics yet. Add a few words from vocabulary pages and the topic dashboard will appear here.</div>";
            return;
        }

        function getTopicLoadLabel(topic) {
            if (!topic.due) {
                return { label: "No due cards", level: "clear" };
            }
            if (topic.due >= 8) {
                return { label: "Heavy review", level: "heavy" };
            }
            if (topic.due >= 4) {
                return { label: "Medium review", level: "medium" };
            }
            return { label: "Light review", level: "light" };
        }

        container.innerHTML = topics.map(function (topic) {
            var load = getTopicLoadLabel(topic);
            return "" +
                "<article class=\"review-topic-card review-topic-card--" + load.level + "\">" +
                    "<div class=\"review-topic-top\">" +
                        "<h3>" + escapeHtml(topic.topic) + "</h3>" +
                        "<span class=\"status-chip\">" + topic.due + " due</span>" +
                    "</div>" +
                    "<p class=\"review-topic-total\">" + topic.total + (topic.total === 1 ? " saved card" : " saved cards") + "</p>" +
                    "<div class=\"review-topic-load\">" + escapeHtml(load.label) + "</div>" +
                    "<div class=\"review-topic-breakdown\">" +
                        "<span class=\"review-topic-chip\">" + topic.words + " words</span>" +
                        "<span class=\"review-topic-chip\">" + topic.verbs + " verb forms</span>" +
                    "</div>" +
                    "<div class=\"review-topic-actions\">" +
                        "<button class=\"action-button\" type=\"button\" data-study-topic=\"" + escapeHtml(topic.topic) + "\">Study this topic</button>" +
                        "<button class=\"action-button\" type=\"button\" data-study-topic-due=\"" + escapeHtml(topic.topic) + "\">Study due</button>" +
                    "</div>" +
                "</article>";
        }).join("");

        container.querySelectorAll("[data-study-topic]").forEach(function (button) {
            button.addEventListener("click", function () {
                var select = byId("review-topic-filter");
                if (select) {
                    select.value = button.getAttribute("data-study-topic") || "";
                }
                var dueOnly = byId("review-due-only");
                if (dueOnly) {
                    dueOnly.checked = false;
                }
                saveReviewPreferences();
                refreshAll(true);
                var stage = byId("review-stage");
                if (stage && typeof stage.scrollIntoView === "function") {
                    stage.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            });
        });

        container.querySelectorAll("[data-study-topic-due]").forEach(function (button) {
            button.addEventListener("click", function () {
                var select = byId("review-topic-filter");
                if (select) {
                    select.value = button.getAttribute("data-study-topic-due") || "";
                }
                var dueOnly = byId("review-due-only");
                if (dueOnly) {
                    dueOnly.checked = true;
                }
                saveReviewPreferences();
                refreshAll(true);
                var stage = byId("review-stage");
                if (stage && typeof stage.scrollIntoView === "function") {
                    stage.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            });
        });
    }

    function renderFilterStatus() {
        var filters = getFilters();
        var all = getAllCards();
        var filtered = getFilteredCards();
        var dueLookup = getDueIds();
        var filteredDue = filtered.filter(function (card) { return dueLookup[card.id]; }).length;
        var bits = [];

        if (filters.topic) {
            bits.push("topic: " + filters.topic);
        }
        if (filters.type === "word-card") {
            bits.push("type: words");
        } else if (filters.type === "verb-form-card") {
            bits.push("type: verb forms");
        }
        if (filters.tense) {
            bits.push("tense: " + formatTenseLabel(filters.tense));
        }
        if (filters.direction === "english-to-maltese") {
            bits.push("direction: English -> Maltese");
        } else if (filters.direction === "image-to-maltese") {
            bits.push(filters.type === "verb-form-card"
                ? "direction: Maltese -> English"
                : "direction: Image / Colour -> Maltese");
        } else {
            bits.push("direction: Maltese -> English");
        }
        if (filters.dueOnly) {
            bits.push("due only");
        }

        byId("review-filter-status").textContent = bits.length
            ? (filtered.length + " matching card(s), " + filteredDue + " due now | " + bits.join(" | "))
            : ("All saved cards are included. " + all.length + " total, " + filteredDue + " due now.");
    }

    function renderQuickSessionStatus() {
        var status = byId("review-session-status");
        var repeatButton = byId("review-session-repeat");
        if (!status) {
            return;
        }

        if (!quickSession.active || !quickSession.limit) {
            status.textContent = "No quick session is active.";
            if (repeatButton) {
                repeatButton.hidden = true;
            }
            return;
        }

        var filters = getFilters();
        var sessionCards = quickSession.deckIds.length
            ? getCardsByIds(quickSession.deckIds)
            : getFilteredCards().slice(0, quickSession.limit);
        var mode = filters.dueOnly ? "due cards" : "cards";
        var scope = filters.topic ? (" in " + filters.topic) : "";
        var tense = filters.tense ? (" | " + formatTenseLabel(filters.tense)) : "";
        var progress = quickSession.reviewed
            ? (" Reviewed " + quickSession.reviewed + " | Again " + quickSession.again + " | Good " + quickSession.good + " | Easy " + quickSession.easy + ".")
            : "";
        var label = quickSession.label ? (quickSession.label + " | ") : "";
        status.textContent = label + "Quick session active: up to " + quickSession.limit + " " + mode + scope + tense + ". " + sessionCards.length + " card(s) in this run." + progress;
        if (repeatButton) {
            repeatButton.hidden = !quickSession.deckIds.length;
        }
    }

    function updateTopicOptions() {
        var select = byId("review-topic-filter");
        var savedSelect = byId("review-saved-topic-filter");
        if (!select && !savedSelect) {
            return;
        }

        var current = select ? select.value : "";
        var savedCurrent = savedSelect ? savedSelect.value : "";
        var topics = [];
        var seen = {};

        getAllCards().forEach(function (card) {
            if (!card.topic || seen[card.topic]) {
                return;
            }
            seen[card.topic] = true;
            topics.push(card.topic);
        });

        topics.sort(function (a, b) {
            return String(a).localeCompare(String(b));
        });

        var optionsHtml = topics.map(function (topic) {
            return "<option value=\"" + escapeHtml(topic) + "\">" + escapeHtml(topic) + "</option>";
        }).join("");

        if (select) {
            select.innerHTML = "<option value=\"\">All topics</option>" + optionsHtml;
            if (current && seen[current]) {
                select.value = current;
            }
        }

        if (savedSelect) {
            savedSelect.innerHTML = "<option value=\"\">All saved topics</option>" + optionsHtml;
            if (savedCurrent && seen[savedCurrent]) {
                savedSelect.value = savedCurrent;
            }
        }
    }

    function refillQueue() {
        var cards = getFilteredCards().slice();
        if (quickSession.active && quickSession.limit > 0) {
            if (!quickSession.deckIds.length) {
                quickSession.deckIds = buildQuickSessionDeck();
            }
            cards = getCardsByIds(quickSession.deckIds);
        }
        queue = cards;
    }

    function formatNextReview(card) {
        var dueLookup = getDueIds();
        if (dueLookup[card.id]) {
            return "Due now";
        }
        if (!card.nextReviewAt) {
            return "Not scheduled";
        }
        var next = new Date(card.nextReviewAt);
        if (isNaN(next.getTime())) {
            return "Not scheduled";
        }
        return "Next: " + next.toLocaleString();
    }

    function buildSessionSummary(current, remainingCount) {
        var filters = getFilters();
        var parts = [];

        if (filters.topic) {
            parts.push("Topic: " + filters.topic);
        } else if (current && current.topic) {
            parts.push("Topic: " + current.topic);
        } else {
            parts.push("Topic: All topics");
        }

        if (filters.type === "word-card") {
            parts.push("Mode: Words");
        } else if (filters.type === "verb-form-card") {
            parts.push("Mode: Verb forms");
        } else {
            parts.push("Mode: All cards");
        }
        if (filters.tense) {
            parts.push("Tense: " + formatTenseLabel(filters.tense));
        }

        if (filters.direction === "english-to-maltese") {
            parts.push("Direction: English -> Maltese");
        } else if (filters.direction === "image-to-maltese") {
            if (filters.type === "verb-form-card") {
                parts.push("Direction: Maltese -> English");
            } else {
                parts.push("Direction: Image / Colour -> Maltese");
            }
        } else {
            parts.push("Direction: Maltese -> English");
        }

        if (filters.type === "verb-form-card" && filters.direction === "image-to-maltese") {
            parts.push("Verb forms ignore image mode");
        }

        if (filters.dueOnly) {
            parts.push("Due only");
        }

        if (quickSession.active && quickSession.limit) {
            parts.push("Quick session: " + quickSession.limit);
        }

        parts.push(remainingCount + " remaining after this card");
        return parts.join(" | ");
    }

    function getSavedListFilters() {
        return {
            search: byId("review-saved-search") ? String(byId("review-saved-search").value || "").trim().toLowerCase() : "",
            topic: byId("review-saved-topic-filter") ? byId("review-saved-topic-filter").value : ""
        };
    }

    function getAnswerOptions() {
        return {
            showVisual: !!(byId("review-answer-show-visual") && byId("review-answer-show-visual").checked),
            showExample: !byId("review-answer-show-example") || byId("review-answer-show-example").checked,
            showVerbLemmaFront: !byId("review-verb-show-lemma") || byId("review-verb-show-lemma").checked
        };
    }

    function getSavedListCards() {
        var filters = getSavedListFilters();
        return getFilteredCards().filter(function (card) {
            if (filters.topic && card.topic !== filters.topic) {
                return false;
            }
            if (!filters.search) {
                return true;
            }
            var haystack = [
                card.maltese,
                card.english,
                card.topic,
                card.lemma,
                card.answer,
                card.pronoun,
                card.translation
            ].join(" ").toLowerCase();
            return haystack.indexOf(filters.search) !== -1;
        });
    }

    function renderEmpty() {
        var filters = getFilters();
        var filteredCount = getFilteredCards().length;
        var hasSavedCards = getAllCards().length > 0;
        var title = "No review cards ready";
        var message = "Add custom words, save vocabulary from topic pages, or add a verb drill from the verbs page.";
        var actions = "<p><a class=\"action-link\" href=\"./animals.html\">Open Animals Page</a> <a class=\"action-link\" href=\"./verbs_guide.html\">Open Verbs Page</a></p>";
        var summary = "";

        if (quickSession.active && hasSavedCards && filteredCount > 0) {
            quickSession.completed = true;
            title = filters.dueOnly ? "Quick due session complete" : "Quick session complete";
            message = filters.dueOnly
                ? "You finished this short due-only run. You can restart it, keep studying the full topic, or go back to all topics."
                : "You reached the end of this short review run. You can restart it, continue with the full set, or go back to all topics.";
            summary = "" +
                "<div class=\"review-session-summary-card\">" +
                    "<h3>" + escapeHtml(quickSession.label || "Quick session") + "</h3>" +
                    "<div class=\"review-session-summary-grid\">" +
                        "<span class=\"review-topic-chip\">Reviewed " + quickSession.reviewed + "</span>" +
                        "<span class=\"review-topic-chip\">Again " + quickSession.again + "</span>" +
                        "<span class=\"review-topic-chip\">Good " + quickSession.good + "</span>" +
                        "<span class=\"review-topic-chip\">Easy " + quickSession.easy + "</span>" +
                    "</div>" +
                "</div>";
            actions = "" +
                "<div class=\"review-empty-actions\">" +
                    "<button class=\"action-button\" type=\"button\" id=\"review-restart-quick-session\">Restart quick session</button>" +
                    "<button class=\"action-button\" type=\"button\" id=\"review-turn-off-quick-session\">Continue full study</button>" +
                    "<button class=\"action-button\" type=\"button\" id=\"review-reset-filters\">Back to all topics</button>" +
                "</div>";
        } else if (hasSavedCards && filteredCount === 0) {
            title = filters.dueOnly ? "No due cards in this view" : "No cards match the current filters";
            message = filters.dueOnly
                ? "You finished the due cards for the current topic or mode. You can keep studying the full set or switch to another topic."
                : "The current filters hide all saved cards. Try another topic or reset the filters.";
            actions = "" +
                "<div class=\"review-empty-actions\">" +
                    "<button class=\"action-button\" type=\"button\" id=\"review-reset-filters\">Back to all topics</button>" +
                    (filters.topic ? "<button class=\"action-button\" type=\"button\" id=\"review-study-topic-full\">Study full topic</button>" : "") +
                "</div>";
        }

        byId("review-stage").innerHTML = "<div class=\"review-empty\"><h2>" + escapeHtml(title) + "</h2><p class=\"mini\">" + escapeHtml(message) + "</p>" + summary + actions + "</div>";

        var resetButton = byId("review-reset-filters");
        if (resetButton) {
            resetButton.addEventListener("click", function () {
                var topic = byId("review-topic-filter");
                var type = byId("review-type-filter");
                var dueOnly = byId("review-due-only");
                var direction = byId("review-direction-filter");
                if (topic) {
                    topic.value = "";
                }
                if (type) {
                    type.value = "";
                }
                if (direction) {
                    direction.value = "maltese-to-english";
                }
                if (dueOnly) {
                    dueOnly.checked = false;
                }
                clearQuickSession();
                saveReviewPreferences();
                refreshAll(true);
            });
        }

        var fullTopicButton = byId("review-study-topic-full");
        if (fullTopicButton) {
            fullTopicButton.addEventListener("click", function () {
                var dueOnly = byId("review-due-only");
                if (dueOnly) {
                    dueOnly.checked = false;
                }
                clearQuickSession();
                refreshAll(true);
            });
        }

        var restartQuickButton = byId("review-restart-quick-session");
        if (restartQuickButton) {
            restartQuickButton.addEventListener("click", function () {
                restartQuickSession();
            });
        }

        var turnOffQuickButton = byId("review-turn-off-quick-session");
        if (turnOffQuickButton) {
            turnOffQuickButton.addEventListener("click", function () {
                clearQuickSession();
                refreshAll(true);
            });
        }
    }

    function getWordDirection() {
        var filters = getFilters();
        return filters.direction || "maltese-to-english";
    }

    function getPrimaryVerbMeaning(value) {
        var text = String(value || "").trim();
        if (!text) {
            return "";
        }

        var dotParts = text.split("·").map(function (part) {
            return part.trim();
        }).filter(Boolean);
        if (dotParts.length) {
            return dotParts[0];
        }

        var slashParts = text.split("/").map(function (part) {
            return part.trim();
        }).filter(Boolean);
        if (slashParts.length) {
            return slashParts[0];
        }

        var commaParts = text.split(",").map(function (part) {
            return part.trim();
        }).filter(Boolean);
        if (commaParts.length) {
            return commaParts[0];
        }

        return text;
    }

    function formatVerbPolarity(card) {
        return card.polarity === "negative" ? "Negative" : "Positive";
    }

    function buildVerbMetaStack(card, options) {
        var parts = [];
        if (options && options.showPronoun) {
            parts.push("<div class=\"review-meta\"><code>Pronoun</code>: " + escapeHtml(card.pronoun) + "</div>");
        }
        if (options && options.showTense) {
            parts.push("<div class=\"review-meta\"><code>Tense</code>: " + escapeHtml(card.tense) + "</div>");
        }
        if (options && options.showPolarity) {
            parts.push("<div class=\"review-meta\"><code>Polarity</code>: " + escapeHtml(formatVerbPolarity(card)) + "</div>");
        }
        if (options && options.showLemma) {
            parts.push("<div class=\"review-meta\"><code>Lemma</code>: " + escapeHtml(card.lemma) + "</div>");
        }
        if (options && options.showMeanings) {
            parts.push("<div class=\"review-meta\"><code>Full meanings</code>: " + escapeHtml(card.translation || card.lemma) + "</div>");
        }
        if (options && options.showPrompt) {
            parts.push("<div class=\"review-meta\"><code>Prompt</code>: " + escapeHtml(card.prompt) + "</div>");
        }
        if (options && options.showSource) {
            parts.push("<div class=\"review-meta\"><code>Source</code>: " + escapeHtml(card.sourcePage) + "</div>");
        }
        return "<div class=\"review-meta-stack\">" + parts.join("") + "</div>";
    }

    function getShortVerbMeaning(value) {
        var text = String(value || "").trim();
        if (!text) {
            return "";
        }

        text = text
            .replaceAll("Â·", "·")
            .replaceAll("Ã‚Â·", "·")
            .replaceAll("•", "·");

        var parts = text.split(/[·\/,;|]/).map(function (part) {
            return part.trim();
        }).filter(Boolean);
        if (parts.length) {
            return parts[0];
        }

        return text;
    }

    function isImperativeShortlistCard(card) {
        return card && card.type === "word-card" && card.sourcePage === "imperative_verbs.html";
    }

    function getImperativeReviewMeta(card) {
        var example = String(card.example || "").trim();
        var singularMatch = example.match(/Singular imperative:\s*([^\.]+)\.?/i);
        var pluralMatch = example.match(/Plural imperative:\s*([^\.]+)\.?/i);
        var bits = [];
        if (singularMatch && singularMatch[1]) {
            bits.push("Singular: " + singularMatch[1].trim());
        }
        if (pluralMatch && pluralMatch[1]) {
            bits.push("Plural: " + pluralMatch[1].trim());
        }
        return bits.join(" | ");
    }

    function buildFront(card) {
        var direction = getWordDirection();
        var answerOptions = getAnswerOptions();

        if (card.type === "verb-form-card") {
            if (direction === "english-to-maltese") {
                var primaryMeaning = getShortVerbMeaning(card.translation || card.lemma) || "(meaning to add later)";
                return "" +
                    "<span class=\"tag\">Verb Form | EN -> MT</span>" +
                    buildVerbMetaStack(card, { showPronoun: true, showTense: true, showPolarity: true }) +
                    "<div class=\"review-word\">" + escapeHtml(primaryMeaning) + "</div>" +
                    (answerOptions.showVerbLemmaFront ? buildVerbMetaStack(card, { showLemma: true }) : "");
            }

            return "" +
                "<span class=\"tag\">Verb Form | MT -> EN</span>" +
                buildVerbMetaStack(card, {
                    showPronoun: true,
                    showTense: true,
                    showPolarity: true,
                    showLemma: answerOptions.showVerbLemmaFront
                }) +
                "<div class=\"review-word\">" + escapeHtml(card.answer) + "</div>" +
                "";
        }

        var visualHtml = "";
        if (card.image) {
            visualHtml = "<div class=\"review-image-wrap\"><img class=\"review-image\" src=\"" + escapeHtml(card.image) + "\" alt=\"" + escapeHtml(card.imageAlt || card.english || card.maltese) + "\"></div>";
        } else if (card.swatchStyle) {
            visualHtml = "<div class=\"review-image-wrap\"><div class=\"review-color-swatch\" style=\"" + escapeHtml(card.swatchStyle) + "\" aria-hidden=\"true\"></div></div>";
        }

        var promptWord = escapeHtml(card.maltese);
        var promptMeta = "Topic: " + escapeHtml(card.topic);
        var tag = "MT -> EN";
        var imperativeMeta = isImperativeShortlistCard(card)
            ? escapeHtml(getImperativeReviewMeta(card))
            : "";

        if (direction === "english-to-maltese") {
            promptWord = escapeHtml(card.english || "(translation to add later)");
            promptMeta = "Answer in Maltese | Topic: " + escapeHtml(card.topic);
            tag = isImperativeShortlistCard(card) ? "Imperative Verb | EN -> MT" : "EN -> MT";
        } else if (direction === "image-to-maltese" && visualHtml) {
            promptWord = "<span class=\"review-word review-word--prompt\">What is this in Maltese?</span>";
            promptMeta = "Answer in Maltese | Topic: " + escapeHtml(card.topic);
            tag = "Image / Colour -> MT";
        } else if (direction === "image-to-maltese") {
            promptWord = escapeHtml(card.english || "(translation to add later)");
            promptMeta = "No image on this card, so this prompt falls back to English | Topic: " + escapeHtml(card.topic);
            tag = isImperativeShortlistCard(card) ? "Imperative Verb | EN -> MT" : "EN -> MT";
        }

        return "" +
            "<span class=\"tag\">" + tag + "</span>" +
            visualHtml +
            "<div class=\"review-word\">" + promptWord + "</div>" +
            (imperativeMeta ? ("<div class=\"review-meta\">" + imperativeMeta + "</div>") : "") +
            "<div class=\"review-meta\">" + promptMeta + "</div>";
    }

    function buildAnswer(card) {
        var direction = getWordDirection();
        if (card.type === "verb-form-card") {
            if (direction === "english-to-maltese") {
                return "" +
                    "<h3>" + escapeHtml(card.answer) + "</h3>" +
                    buildVerbMetaStack(card, {
                        showLemma: true,
                        showMeanings: true,
                        showPronoun: true,
                        showTense: true,
                        showPolarity: true,
                        showPrompt: true,
                        showSource: true
                    });
            }

            return "" +
                "<h3>" + escapeHtml(card.translation || "(translation to add later)") + "</h3>" +
                "<div class=\"review-meta-stack\">" +
                    "<div class=\"review-meta\"><code>Answer</code>: " + escapeHtml(card.answer) + "</div>" +
                "</div>" +
                buildVerbMetaStack(card, {
                    showLemma: true,
                    showPolarity: true,
                    showPrompt: true,
                    showSource: true
                });
        }

        var answerOptions = getAnswerOptions();
        var title = escapeHtml(card.english || "(translation to add later)");
        var secondary = "<div class=\"review-meta\">Maltese: " + escapeHtml(card.maltese) + "</div>";
        var visualHtml = "";
        var exampleHtml = "";

        if (direction === "english-to-maltese" || direction === "image-to-maltese") {
            title = escapeHtml(card.maltese);
            secondary = "<div class=\"review-meta\">English: " + escapeHtml(card.english || "(translation to add later)") + "</div>";
        }

        if (isImperativeShortlistCard(card)) {
            secondary += "<div class=\"review-meta\">" + escapeHtml(getImperativeReviewMeta(card) || "Imperative forms to add later.") + "</div>";
        }

        if (answerOptions.showVisual) {
            if (card.image) {
                visualHtml = "<div class=\"review-image-wrap\"><img class=\"review-image\" src=\"" + escapeHtml(card.image) + "\" alt=\"" + escapeHtml(card.imageAlt || card.english || card.maltese) + "\"></div>";
            } else if (card.swatchStyle) {
                visualHtml = "<div class=\"review-image-wrap\"><div class=\"review-color-swatch\" style=\"" + escapeHtml(card.swatchStyle) + "\" aria-hidden=\"true\"></div></div>";
            }
        }

        if (answerOptions.showExample) {
            exampleHtml = "<div class=\"review-meta\">Example: " + escapeHtml(card.example || "No example yet.") + "</div>";
        }

        return "" +
            visualHtml +
            "<h3>" + title + "</h3>" +
            secondary +
            exampleHtml +
            "<div class=\"review-meta\">Source: " + escapeHtml(card.sourcePage || "manual") + "</div>";
    }

    function renderSavedList() {
        var container = byId("review-saved-list");
        var count = byId("review-saved-count");
        if (!container) {
            return;
        }

        var cards = getSavedListCards();
        if (count) {
            count.textContent = cards.length + (cards.length === 1 ? " card" : " cards");
        }
        if (!cards.length) {
            container.innerHTML = "<div class=\"review-saved-empty\">No saved cards match the current filters.</div>";
            return;
        }

        container.innerHTML = cards.map(function (card) {
            var title = card.type === "verb-form-card"
                ? (card.pronoun + " + " + card.lemma)
                : card.maltese;
            var subtitle = card.type === "verb-form-card"
                ? (card.answer + " | " + card.translation + " | " + formatVerbPolarity(card))
                : (card.english || "(translation to add later)");

            return "" +
                "<article class=\"review-saved-item\" data-review-card-id=\"" + escapeHtml(card.id) + "\">" +
                    "<div class=\"review-saved-top\">" +
                        "<div>" +
                            "<div class=\"review-saved-title\">" + escapeHtml(title) + "</div>" +
                            "<div class=\"review-meta\">" + escapeHtml(subtitle) + "</div>" +
                        "</div>" +
                        "<div class=\"review-saved-meta\">" +
                            "<span class=\"review-saved-chip\">" + escapeHtml(card.topic) + "</span>" +
                            "<span class=\"review-saved-chip\">" + escapeHtml(card.type === "verb-form-card" ? "verb form" : "word") + "</span>" +
                            "<span class=\"review-saved-chip\">" + escapeHtml(formatNextReview(card)) + "</span>" +
                        "</div>" +
                    "</div>" +
                    "<div class=\"review-meta\">Source: " + escapeHtml(card.sourcePage || "manual") + "</div>" +
                    "<div class=\"review-saved-actions\">" +
                        "<button class=\"action-button\" type=\"button\" data-remove-review-card=\"" + escapeHtml(card.id) + "\">Remove</button>" +
                    "</div>" +
                "</article>";
        }).join("");

        container.querySelectorAll("[data-remove-review-card]").forEach(function (button) {
            button.addEventListener("click", function () {
                var id = button.getAttribute("data-remove-review-card");
                window.MaltiReviewStore.removeCard(id);
                if (currentCard && currentCard.id === id) {
                    currentCard = null;
                }
                refreshAll(true);
            });
        });
    }

    function renderCurrentCardStage() {
        var sessionSummary = buildSessionSummary(currentCard, queue.length);

        byId("review-stage").innerHTML = `
        <div class="review-session-bar">${escapeHtml(sessionSummary)}</div>

        <div class="session-progress">
            <div class="session-progress-bar" id="session-progress-bar"></div>
        </div>

        <div class="review-card-container">
            <div class="review-card" id="review-card">
                <!-- Front -->
                <div class="review-card-front" id="card-front">
                    <div class="review-meta-info">
                        ${currentCard.type === "verb-form-card"
            ? `${escapeHtml(currentCard.pronoun)} • ${escapeHtml(currentCard.tense)}${currentCard.polarity === "negative" ? " (negative)" : ""}`
            : escapeHtml(currentCard.topic || "Vocabulary")}
                    </div>
                    <div class="maltese-text" id="front-text">
                        ${escapeHtml(currentCard.type === "verb-form-card" ? currentCard.prompt : currentCard.maltese)}
                    </div>
                    <div style="margin-top:20px; font-size:0.95rem; opacity:0.7;">
                        (tap or click to reveal answer)
                    </div>
                </div>

                <!-- Back -->
                <div class="review-card-back" id="card-back">
                    <div class="maltese-text">${escapeHtml(currentCard.type === "verb-form-card" ? currentCard.answer : currentCard.maltese)}</div>
                    
                    <div class="english-text" style="margin-top:24px;">
                        ${escapeHtml(currentCard.english || currentCard.translation || currentCard.meaning || "—")}
                    </div>

                    ${currentCard.example ? `
                    <div style="margin-top:28px; padding:16px; background:rgba(0,0,0,0.04); border-radius:12px; max-width:440px; font-size:1.05rem;">
                        <strong>Example:</strong><br>${escapeHtml(currentCard.example)}
                    </div>` : ''}
                </div>
            </div>
        </div>

        <div class="review-grade-actions" id="review-grade-actions" hidden>
            <button class="action-button" data-grade="again" type="button">Again</button>
            <button class="action-button" data-grade="hard" type="button">Hard</button>
            <button class="action-button" data-grade="good" type="button">Good</button>
            <button class="action-button" data-grade="easy" type="button">Easy</button>
        </div>
    `;

        // === Flip logic ===
        const card = document.getElementById("review-card");
        let flipped = false;

        card.addEventListener("click", () => {
            if (!flipped) {
                card.classList.add("flipped");
                flipped = true;
                document.getElementById("review-grade-actions").hidden = false;
            }
        });

        // Grade buttons
        document.querySelectorAll("#review-grade-actions button").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopImmediatePropagation();
                const grade = btn.dataset.grade;

                if (currentCard && currentCard.id) {
                    window.MaltiReviewStore.reviewCard(currentCard.id, grade);

                    // Update quick session stats if active
                    if (quickSession.active) {
                        quickSession.reviewed++;
                        if (grade === "again") quickSession.again++;
                        else if (grade === "good") quickSession.good++;
                        else if (grade === "easy") quickSession.easy++;
                    }
                }

                // Reset flip for next card
                setTimeout(() => {
                    card.classList.remove("flipped");
                    flipped = false;
                    refreshAll(false);
                }, 280);
            });
        });

        // Update progress bar
        const progressEl = document.getElementById("session-progress-bar");
        if (progressEl) {
            const total = queue.length + (currentCard ? 1 : 0) + reviewedThisSession; // approximate
            const progress = total > 0 ? Math.round(((reviewedThisSession || 0) / (total + 5)) * 100) : 30;
            progressEl.style.width = `${Math.min(progress, 100)}%`;
        }
    }

    function bindVerbOpenHandlers() {
        if (!currentCard || currentCard.type !== "verb-form-card") {
            return;
        }
        byId("review-stage").querySelectorAll("[data-review-open-verb]").forEach(function (node) {
            node.addEventListener("click", function () {
                if (!window.MaltiVerbLookup || !window.MaltiVerbLookup.open) {
                    return;
                }
                window.MaltiVerbLookup.open({
                    verb: currentCard.lemma,
                    lookupHint: currentCard.answer
                });
            });
        });
    }

    function bindGradeButtons() {
        byId("review-grade-actions").querySelectorAll("[data-grade]").forEach(function (button) {
            button.addEventListener("click", function () {
                var grade = button.getAttribute("data-grade");
                window.MaltiReviewStore.reviewCard(currentCard.id, grade);
                if (quickSession.active) {
                    quickSession.reviewed += 1;
                    if (grade === "again") {
                        quickSession.again += 1;
                    } else if (grade === "good") {
                        quickSession.good += 1;
                    } else if (grade === "easy") {
                        quickSession.easy += 1;
                    }
                }
                refreshAll(false);
            });
        });
    }

    function renderClassicCardStage(sessionSummary) {
        var verbCardAttrs = currentCard && currentCard.type === "verb-form-card"
            ? " data-review-open-verb=\"true\" title=\"Click to open the full verb table\""
            : "";

        byId("review-stage").innerHTML = "" +
            "<div class=\"review-session-bar\">" + escapeHtml(sessionSummary) + "</div>" +
            "<div class=\"review-card-body\"" + verbCardAttrs + ">" + buildFront(currentCard) + "</div>" +
            "<div class=\"review-answer\" id=\"review-answer\" hidden" + verbCardAttrs + ">" + buildAnswer(currentCard) + "</div>" +
            "<div class=\"review-actions\"><button class=\"action-button\" id=\"show-answer-button\" type=\"button\">Show answer</button></div>" +
            "<div class=\"review-grade-actions\" id=\"review-grade-actions\" hidden>" +
                "<button class=\"action-button\" data-grade=\"again\" type=\"button\">Again</button>" +
                "<button class=\"action-button\" data-grade=\"good\" type=\"button\">Good</button>" +
                "<button class=\"action-button\" data-grade=\"easy\" type=\"button\">Easy</button>" +
            "</div>";

        byId("show-answer-button").addEventListener("click", function () {
            byId("review-answer").hidden = false;
            byId("review-grade-actions").hidden = false;
            this.hidden = true;
        });

        bindVerbOpenHandlers();
        bindGradeButtons();
    }

    function renderFlipCardStage(sessionSummary) {
        var verbCardAttrs = currentCard && currentCard.type === "verb-form-card"
            ? " data-review-open-verb=\"true\" title=\"Click to open the full verb table\""
            : "";
        var flipCardClasses = "review-flip-card";
        if (currentCard && (currentCard.image || currentCard.swatchStyle)) {
            flipCardClasses += " review-flip-card--visual";
        }

        byId("review-stage").innerHTML = "" +
            "<div class=\"review-session-bar\">" + escapeHtml(sessionSummary) + "</div>" +
            "<div class=\"review-flip-wrap\">" +
                "<div class=\"" + flipCardClasses + "\" id=\"review-flip-card\"" + verbCardAttrs + ">" +
                    "<div class=\"review-flip-face review-flip-face--front\">" +
                        "<div class=\"review-flip-face-inner\">" +
                            buildFront(currentCard) +
                            "<div class=\"review-flip-hint\">Tap or click to reveal the answer</div>" +
                        "</div>" +
                    "</div>" +
                    "<div class=\"review-flip-face review-flip-face--back\"" + verbCardAttrs + ">" +
                        "<div class=\"review-flip-face-inner\">" +
                            buildAnswer(currentCard) +
                        "</div>" +
                    "</div>" +
                "</div>" +
            "</div>" +
            "<div class=\"review-grade-actions\" id=\"review-grade-actions\" hidden>" +
                "<button class=\"action-button\" data-grade=\"again\" type=\"button\">Again</button>" +
                "<button class=\"action-button\" data-grade=\"good\" type=\"button\">Good</button>" +
                "<button class=\"action-button\" data-grade=\"easy\" type=\"button\">Easy</button>" +
            "</div>";

        (function () {
            var flipCard = byId("review-flip-card");
            var flipped = false;
            if (!flipCard) {
                return;
            }
            flipCard.addEventListener("click", function () {
                if (flipped) {
                    flipCard.classList.remove("is-flipped");
                    flipped = false;
                    byId("review-grade-actions").hidden = true;
                    return;
                }
                flipCard.classList.add("is-flipped");
                flipped = true;
                byId("review-grade-actions").hidden = false;
            });
        }());

        bindVerbOpenHandlers();
        bindGradeButtons();
    }

    function renderCurrentCardStage() {
        var sessionSummary = buildSessionSummary(currentCard, queue.length);
        if (getCardLayoutMode() === "flip") {
            renderFlipCardStage(sessionSummary);
            return;
        }
        renderClassicCardStage(sessionSummary);
    }

    function renderCard() {
        renderStats();
        renderFilterStatus();

        if (!queue.length) {
            refillQueue();
        }

        currentCard = queue.shift() || null;
        if (!currentCard) {
            renderEmpty();
            return;
        }

        renderCurrentCardStage();
    }

    function refreshAll(resetQueue) {
        updateTopicOptions();
        if (resetQueue) {
            queue = [];
        }
        renderTopicOverview();
        renderQuickSessionStatus();
        renderSavedList();
        renderCard();
    }

    function wireFilters() {
        ["review-topic-filter", "review-type-filter", "review-tense-filter", "review-direction-filter", "review-due-only"].forEach(function (id) {
            var element = byId(id);
            if (!element) {
                return;
            }
            element.addEventListener("change", function () {
                clearQuickSession();
                saveReviewPreferences();
                refreshAll(true);
            });
        });
    }

    function wireLayoutMode() {
        var element = byId("review-card-layout");
        if (!element) {
            return;
        }
        element.addEventListener("change", function () {
            saveReviewPreferences();
            if (!currentCard) {
                refreshAll(true);
                return;
            }
            renderCurrentCardStage();
        });
    }

    function wireAnswerOptions() {
        ["review-answer-show-visual", "review-answer-show-example", "review-verb-show-lemma"].forEach(function (id) {
            var element = byId(id);
            if (!element) {
                return;
            }
            element.addEventListener("change", function () {
                saveReviewPreferences();
                if (!currentCard) {
                    return;
                }
                renderCurrentCardStage();
            });
        });
    }

    function wireFiltersPanel() {
        var panel = byId("review-filters-panel");
        if (!panel) {
            return;
        }
        panel.addEventListener("toggle", function () {
            saveReviewPreferences();
        });
    }

    function shouldIgnoreReviewHotkeys() {
        var active = document.activeElement;
        if (!active) {
            return false;
        }
        var tag = String(active.tagName || "").toLowerCase();
        return tag === "input" || tag === "textarea" || tag === "select" || tag === "button" || !!active.isContentEditable;
    }

    function clickGradeButton(grade) {
        var container = byId("review-grade-actions");
        if (!container || container.hidden) {
            return false;
        }
        var button = container.querySelector("[data-grade=\"" + grade + "\"]");
        if (!button) {
            return false;
        }
        button.click();
        return true;
    }

    function triggerRevealOrFlip() {
        var showAnswerButton = byId("show-answer-button");
        if (showAnswerButton && !showAnswerButton.hidden) {
            showAnswerButton.click();
            return true;
        }

        var flipCard = byId("review-flip-card");
        if (flipCard) {
            flipCard.click();
            return true;
        }

        return false;
    }

    function wireReviewHotkeys() {
        document.addEventListener("keydown", function (event) {
            if (shouldIgnoreReviewHotkeys() || !currentCard) {
                return;
            }

            var key = String(event.key || "");
            if (key === " " || key === "Enter") {
                if (triggerRevealOrFlip()) {
                    event.preventDefault();
                }
                return;
            }

            if (key === "1") {
                if (clickGradeButton("again")) {
                    event.preventDefault();
                }
                return;
            }

            if (key === "2") {
                if (clickGradeButton("good")) {
                    event.preventDefault();
                }
                return;
            }

            if (key === "3") {
                if (clickGradeButton("easy")) {
                    event.preventDefault();
                }
            }
        });
    }

    function wireQuickSessions() {
        var studyTenAll = byId("review-session-10-all");
        var studyTenDue = byId("review-session-10-due");
        var studyTenWords = byId("review-session-10-words");
        var studyTenVerbs = byId("review-session-10-verbs");
        var repeatQuick = byId("review-session-repeat");

        function scrollToStage() {
            var stage = byId("review-stage");
            if (stage && typeof stage.scrollIntoView === "function") {
                stage.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }

        function setTypeFilter(value) {
            var type = byId("review-type-filter");
            if (type) {
                type.value = value;
            }
        }

        function startQuickSession(label, limit) {
            activateQuickSession(limit);
            quickSession.label = label;
            quickSession.deckIds = buildQuickSessionDeck();
            refreshAll(true);
            scrollToStage();
        }

        if (studyTenAll) {
            studyTenAll.addEventListener("click", function () {
                var dueOnly = byId("review-due-only");
                if (dueOnly) {
                    dueOnly.checked = false;
                }
                setTypeFilter("");
                startQuickSession("Quick session: all cards", 10);
            });
        }

        if (studyTenDue) {
            studyTenDue.addEventListener("click", function () {
                var dueOnly = byId("review-due-only");
                if (dueOnly) {
                    dueOnly.checked = true;
                }
                setTypeFilter("");
                startQuickSession("Quick session: due cards", 10);
            });
        }

        if (studyTenWords) {
            studyTenWords.addEventListener("click", function () {
                var dueOnly = byId("review-due-only");
                if (dueOnly) {
                    dueOnly.checked = false;
                }
                setTypeFilter("word-card");
                startQuickSession("Quick session: words", 10);
            });
        }

        if (studyTenVerbs) {
            studyTenVerbs.addEventListener("click", function () {
                var dueOnly = byId("review-due-only");
                if (dueOnly) {
                    dueOnly.checked = false;
                }
                setTypeFilter("verb-form-card");
                startQuickSession("Quick session: verb forms", 10);
            });
        }

        if (repeatQuick) {
            repeatQuick.addEventListener("click", function () {
                restartQuickSession();
                scrollToStage();
            });
        }
    }

    function wireSavedListTools() {
        var search = byId("review-saved-search");
        var topic = byId("review-saved-topic-filter");
        var removeFiltered = byId("review-remove-saved-filtered");
        var removeVerbs = byId("review-remove-saved-verbs");

        if (search) {
            search.addEventListener("input", function () {
                renderSavedList();
            });
        }

        if (topic) {
            topic.addEventListener("change", function () {
                renderSavedList();
            });
        }

        if (removeFiltered) {
            removeFiltered.addEventListener("click", function () {
                var cards = getSavedListCards();
                if (!cards.length || !window.confirm("Remove the currently shown saved cards?")) {
                    return;
                }
                cards.forEach(function (card) {
                    window.MaltiReviewStore.removeCard(card.id);
                });
                if (currentCard && !getAllCards().some(function (card) { return card.id === currentCard.id; })) {
                    currentCard = null;
                }
                clearQuickSession();
                refreshAll(true);
            });
        }

        if (removeVerbs) {
            removeVerbs.addEventListener("click", function () {
                var cards = getSavedListCards().filter(function (card) {
                    return card.type === "verb-form-card";
                });
                if (!cards.length || !window.confirm("Remove the shown verb-form cards?")) {
                    return;
                }
                cards.forEach(function (card) {
                    window.MaltiReviewStore.removeCard(card.id);
                });
                if (currentCard && !getAllCards().some(function (card) { return card.id === currentCard.id; })) {
                    currentCard = null;
                }
                clearQuickSession();
                refreshAll(true);
            });
        }
    }

    function wireCustomForm() {
        var form = byId("custom-word-form");
        if (!form) {
            return;
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            var maltese = byId("custom-maltese").value;
            var english = byId("custom-english").value;
            var topic = byId("custom-topic").value;
            var example = byId("custom-example").value;

            if (!String(maltese || "").trim()) {
                return;
            }

            window.MaltiReviewStore.addCustomWord({
                maltese: maltese,
                english: english,
                topic: topic,
                example: example,
                sourcePage: "manual"
            });

            form.reset();
            byId("custom-status").textContent = "Custom word saved.";
            refreshAll(true);
        });
    }

    function toAnimalReviewId(item) {
        return "word::animals::" + window.MaltiReviewStore.normalizeForKey(item.slug || item.maltese);
    }

    function backfillAnimalImages() {
        return fetch(ANIMALS_DATA_URL)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("Could not load animals data for review backfill.");
                }
                return response.json();
            })
            .then(function (data) {
                var lookup = {};
                (data.groups || []).forEach(function (group) {
                    (group.items || []).forEach(function (item) {
                        lookup[toAnimalReviewId(item)] = {
                            id: toAnimalReviewId(item),
                            maltese: item.maltese,
                            english: item.english,
                            topic: group.title || "Animals",
                            sourcePage: data.page || "animals.html",
                            example: item.example || ("Nara " + item.maltese + "."),
                            image: item.image || "",
                            imageAlt: item.imageAlt || item.english || item.maltese
                        };
                    });
                });

                var changed = false;
                getAllCards().forEach(function (card) {
                    if (card.type !== "word-card" || card.image) {
                        return;
                    }
                    var animalCard = lookup[card.id];
                    if (!animalCard) {
                        return;
                    }
                    window.MaltiReviewStore.addWord(Object.assign({}, animalCard, {
                        english: card.english || animalCard.english,
                        example: card.example || animalCard.example,
                        topic: card.topic || animalCard.topic,
                        sourcePage: card.sourcePage || animalCard.sourcePage
                    }));
                    changed = true;
                });

                return changed;
            })
            .catch(function (error) {
                console.warn(error);
                return false;
            });
    }

    function toColorReviewId(item) {
        return "word::colors::" + window.MaltiReviewStore.normalizeForKey(item.slug || item.maltese);
    }

    function backfillColorSwatches() {
        return fetch(COLORS_DATA_URL)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("Could not load colors data for review backfill.");
                }
                return response.json();
            })
            .then(function (data) {
                var lookup = {};
                (data.groups || []).forEach(function (group) {
                    (group.items || []).forEach(function (item) {
                        lookup[toColorReviewId(item)] = {
                            id: toColorReviewId(item),
                            maltese: item.maltese,
                            english: item.english,
                            topic: group.title || "Colours",
                            sourcePage: data.page || "colors_maltese.html",
                            example: item.example || ("Dan hu " + item.maltese + "."),
                            swatchStyle: item.swatchStyle || ""
                        };
                    });
                });

                var changed = false;
                getAllCards().forEach(function (card) {
                    if (card.type !== "word-card" || card.swatchStyle) {
                        return;
                    }
                    var colorCard = lookup[card.id];
                    if (!colorCard) {
                        return;
                    }
                    window.MaltiReviewStore.addWord(Object.assign({}, colorCard, {
                        english: card.english || colorCard.english,
                        example: card.example || colorCard.example,
                        topic: card.topic || colorCard.topic,
                        sourcePage: card.sourcePage || colorCard.sourcePage
                    }));
                    changed = true;
                });

                return changed;
            })
            .catch(function (error) {
                console.warn(error);
                return false;
            });
    }

    document.addEventListener("DOMContentLoaded", function () {
        if (!window.MaltiReviewStore) {
            return;
        }

        applyReviewPreferences(loadReviewPreferences());
        wireFilters();
        wireFiltersPanel();
        wireLayoutMode();
        wireAnswerOptions();
        wireReviewHotkeys();
        wireQuickSessions();
        wireSavedListTools();
        wireCustomForm();

        Promise.allSettled([backfillAnimalImages(), backfillColorSwatches()]).finally(function () {
            refreshAll(true);

            byId("clear-review").addEventListener("click", function () {
                getAllCards().forEach(function (card) {
                    window.MaltiReviewStore.removeCard(card.id);
                });
                queue = [];
                currentCard = null;
                refreshAll(true);
            });
        });
    });
}());
