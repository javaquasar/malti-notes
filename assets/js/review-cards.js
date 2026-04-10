(function () {
    var currentCard = null;
    var queue = [];
    var ANIMALS_DATA_URL = "./assets/data/animals.json";
    var COLORS_DATA_URL = "./assets/data/colors.json";

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
            dueOnly: !!(byId("review-due-only") && byId("review-due-only").checked)
        };
    }

    function cardMatches(card, filters, dueLookup) {
        if (filters.topic && card.topic !== filters.topic) {
            return false;
        }
        if (filters.type && card.type !== filters.type) {
            return false;
        }
        if (filters.dueOnly && !dueLookup[card.id]) {
            return false;
        }
        return true;
    }

    function getFilteredCards() {
        var filters = getFilters();
        var dueLookup = getDueIds();
        return getAllCards().filter(function (card) {
            return cardMatches(card, filters, dueLookup);
        });
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

        container.innerHTML = topics.map(function (topic) {
            return "" +
                "<article class=\"review-topic-card\">" +
                    "<div class=\"review-topic-top\">" +
                        "<h3>" + escapeHtml(topic.topic) + "</h3>" +
                        "<span class=\"status-chip\">" + topic.due + " due</span>" +
                    "</div>" +
                    "<p class=\"review-topic-total\">" + topic.total + (topic.total === 1 ? " saved card" : " saved cards") + "</p>" +
                    "<div class=\"review-topic-breakdown\">" +
                        "<span class=\"review-topic-chip\">" + topic.words + " words</span>" +
                        "<span class=\"review-topic-chip\">" + topic.verbs + " verb forms</span>" +
                    "</div>" +
                    "<div class=\"review-topic-actions\">" +
                        "<button class=\"action-button\" type=\"button\" data-study-topic=\"" + escapeHtml(topic.topic) + "\">Study this topic</button>" +
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
        if (filters.dueOnly) {
            bits.push("due only");
        }

        byId("review-filter-status").textContent = bits.length
            ? (filtered.length + " matching card(s), " + filteredDue + " due now | " + bits.join(" | "))
            : ("All saved cards are included. " + all.length + " total, " + filteredDue + " due now.");
    }

    function updateTopicOptions() {
        var select = byId("review-topic-filter");
        if (!select) {
            return;
        }

        var current = select.value;
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

        select.innerHTML = "<option value=\"\">All topics</option>" + topics.map(function (topic) {
            return "<option value=\"" + escapeHtml(topic) + "\">" + escapeHtml(topic) + "</option>";
        }).join("");

        if (current && seen[current]) {
            select.value = current;
        }
    }

    function refillQueue() {
        queue = getFilteredCards().slice();
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

    function renderEmpty() {
        var filteredCount = getFilteredCards().length;
        var hasSavedCards = getAllCards().length > 0;
        var message = hasSavedCards && filteredCount === 0
            ? "No cards match the current filters."
            : "Add custom words, save vocabulary from topic pages, or add a verb drill from the verbs page.";

        byId("review-stage").innerHTML = "<div class=\"review-empty\"><h2>No review cards ready</h2><p class=\"mini\">" + escapeHtml(message) + "</p><p><a class=\"action-link\" href=\"./animals.html\">Open Animals Page</a> <a class=\"action-link\" href=\"./verbs_guide.html\">Open Verbs Page</a></p></div>";
    }

    function buildFront(card) {
        if (card.type === "verb-form-card") {
            return "" +
                "<span class=\"tag\">Verb Form</span>" +
                "<div class=\"review-meta\">Tense: " + escapeHtml(card.tense) + "</div>" +
                "<div class=\"review-word\">" + escapeHtml(card.pronoun) + "</div>" +
                "<div class=\"review-meta\">Lemma: " + escapeHtml(card.lemma) + " | " + escapeHtml(card.translation) + "</div>";
        }

        var visualHtml = "";
        if (card.image) {
            visualHtml = "<div class=\"review-image-wrap\"><img class=\"review-image\" src=\"" + escapeHtml(card.image) + "\" alt=\"" + escapeHtml(card.imageAlt || card.english || card.maltese) + "\"></div>";
        } else if (card.swatchStyle) {
            visualHtml = "<div class=\"review-image-wrap\"><div class=\"review-color-swatch\" style=\"" + escapeHtml(card.swatchStyle) + "\" aria-hidden=\"true\"></div></div>";
        }

        return "" +
            "<span class=\"tag\">Word Card</span>" +
            visualHtml +
            "<div class=\"review-word\">" + escapeHtml(card.maltese) + "</div>" +
            "<div class=\"review-meta\">Topic: " + escapeHtml(card.topic) + "</div>";
    }

    function buildAnswer(card) {
        if (card.type === "verb-form-card") {
            return "" +
                "<h3>" + escapeHtml(card.answer) + "</h3>" +
                "<div class=\"review-meta\">Prompt: " + escapeHtml(card.prompt) + "</div>" +
                "<div class=\"review-meta\">Source: " + escapeHtml(card.sourcePage) + "</div>";
        }

        return "" +
            "<h3>" + escapeHtml(card.english || "(translation to add later)") + "</h3>" +
            "<div class=\"review-meta\">Example: " + escapeHtml(card.example || "No example yet.") + "</div>" +
            "<div class=\"review-meta\">Source: " + escapeHtml(card.sourcePage || "manual") + "</div>";
    }

    function renderSavedList() {
        var container = byId("review-saved-list");
        var count = byId("review-saved-count");
        if (!container) {
            return;
        }

        var cards = getFilteredCards();
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
                ? (card.answer + " | " + card.translation)
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

        byId("review-stage").innerHTML = "" +
            buildFront(currentCard) +
            "<div class=\"review-answer\" id=\"review-answer\" hidden>" + buildAnswer(currentCard) + "</div>" +
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

        byId("review-grade-actions").querySelectorAll("[data-grade]").forEach(function (button) {
            button.addEventListener("click", function () {
                window.MaltiReviewStore.reviewCard(currentCard.id, button.getAttribute("data-grade"));
                refreshAll(false);
            });
        });
    }

    function refreshAll(resetQueue) {
        updateTopicOptions();
        if (resetQueue) {
            queue = [];
        }
        renderTopicOverview();
        renderSavedList();
        renderCard();
    }

    function wireFilters() {
        ["review-topic-filter", "review-type-filter", "review-due-only"].forEach(function (id) {
            var element = byId(id);
            if (!element) {
                return;
            }
            element.addEventListener("change", function () {
                refreshAll(true);
            });
        });
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

        wireFilters();
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
