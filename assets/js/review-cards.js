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

    function renderStats() {
        var stats = window.MaltiReviewStore.getStats();
        byId("review-stats").textContent = stats.total + " saved, " + stats.due + " due now";
        byId("review-breakdown").textContent = stats.words + " words, " + stats.verbs + " verb forms";
    }

    function refillQueue() {
        queue = window.MaltiReviewStore.getDueCards();
        if (!queue.length) {
            queue = window.MaltiReviewStore.getAllCards();
        }
    }

    function renderEmpty() {
        byId("review-stage").innerHTML = "<div class=\"review-empty\"><h2>No review cards yet</h2><p class=\"mini\">Add custom words, save animal vocabulary, or add a verb drill from the verbs page.</p><p><a class=\"action-link\" href=\"./animals.html\">Open Animals Page</a> <a class=\"action-link\" href=\"./verbs_guide.html\">Open Verbs Page</a></p></div>";
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

    function renderCard() {
        renderStats();
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
                renderCard();
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
            refillQueue();
            renderStats();
            byId("custom-status").textContent = "Custom word saved.";
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
                window.MaltiReviewStore.getAllCards().forEach(function (card) {
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

                if (changed) {
                    refillQueue();
                }
            })
            .catch(function (error) {
                console.warn(error);
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
                window.MaltiReviewStore.getAllCards().forEach(function (card) {
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

                if (changed) {
                    refillQueue();
                }
            })
            .catch(function (error) {
                console.warn(error);
            });
    }

    document.addEventListener("DOMContentLoaded", function () {
        if (!window.MaltiReviewStore) {
            return;
        }
        wireCustomForm();
        Promise.allSettled([backfillAnimalImages(), backfillColorSwatches()]).finally(function () {
            refillQueue();
            renderCard();

            byId("clear-review").addEventListener("click", function () {
                window.MaltiReviewStore.getAllCards().forEach(function (card) {
                    window.MaltiReviewStore.removeCard(card.id);
                });
                queue = [];
                renderCard();
            });
        });
    });
}());
