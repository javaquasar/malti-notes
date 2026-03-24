(function () {
    var currentWord = null;
    var queue = [];

    function byId(id) {
        return document.getElementById(id);
    }

    function renderStats() {
        var stats = window.MaltiReviewStore.getStats();
        byId("review-stats").textContent = stats.total + " saved, " + stats.due + " due now";
    }

    function refillQueue() {
        queue = window.MaltiReviewStore.getDueWords();
        if (!queue.length) {
            queue = window.MaltiReviewStore.getAllWords();
        }
    }

    function renderEmpty() {
        byId("review-stage").innerHTML = "<div class=\"review-empty\"><h2>No review words yet</h2><p class=\"mini\">Go to the animals page, save a few words, and come back here.</p><p><a class=\"action-link\" href=\"./animals.html\">Open Animals Page</a></p></div>";
    }

    function renderWord() {
        renderStats();
        if (!queue.length) {
            refillQueue();
        }
        currentWord = queue.shift() || null;
        if (!currentWord) {
            renderEmpty();
            return;
        }

        byId("review-stage").innerHTML = "" +
            "<span class=\"tag\">Review Card</span>" +
            "<div class=\"review-word\">" + currentWord.maltese + "</div>" +
            "<div class=\"review-meta\">Topic: " + currentWord.topic + "</div>" +
            "<div class=\"review-answer\" id=\"review-answer\" hidden>" +
                "<h3>" + currentWord.english + "</h3>" +
                "<div class=\"review-meta\">Example: " + currentWord.example + "</div>" +
                "<div class=\"review-meta\">Source: " + currentWord.sourcePage + "</div>" +
            "</div>" +
            "<div class=\"review-actions\">" +
                "<button class=\"action-button\" id=\"show-answer-button\" type=\"button\">Show answer</button>" +
            "</div>" +
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
                window.MaltiReviewStore.reviewWord(currentWord.id, button.getAttribute("data-grade"));
                renderWord();
            });
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        if (!window.MaltiReviewStore) {
            return;
        }

        refillQueue();
        renderWord();

        byId("clear-review").addEventListener("click", function () {
            window.MaltiReviewStore.getAllWords().forEach(function (word) {
                window.MaltiReviewStore.removeWord(word.id);
            });
            queue = [];
            renderWord();
        });
    });
}());
