(function () {
    var currentCard = null;
    var queue = [];

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

        return "" +
            "<span class=\"tag\">Word Card</span>" +
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

    document.addEventListener("DOMContentLoaded", function () {
        if (!window.MaltiReviewStore) {
            return;
        }

        refillQueue();
        renderCard();
        wireCustomForm();

        byId("clear-review").addEventListener("click", function () {
            window.MaltiReviewStore.getAllCards().forEach(function (card) {
                window.MaltiReviewStore.removeCard(card.id);
            });
            queue = [];
            renderCard();
        });
    });
}());
