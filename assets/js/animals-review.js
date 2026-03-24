(function () {
    function makeId(topic, maltese) {
        return [topic, maltese].join("::");
    }

    function createExample(maltese) {
        return "Nara " + maltese + ".";
    }

    function updateSummary() {
        var summary = document.querySelector("[data-review-summary]");
        if (!summary || !window.MaltiReviewStore) {
            return;
        }
        var stats = window.MaltiReviewStore.getStats();
        summary.textContent = stats.total + " saved, " + stats.due + " due";
    }

    function decorateCard(card, topicLabel) {
        var malteseEl = card.querySelector("strong");
        var englishEl = card.querySelector("span");
        if (!malteseEl || !englishEl) {
            return;
        }

        var maltese = malteseEl.textContent.trim();
        var english = englishEl.textContent.trim();
        var id = makeId(topicLabel, maltese);

        var button = document.createElement("button");
        button.type = "button";
        button.className = "review-add-button";

        function syncButton() {
            var exists = window.MaltiReviewStore && window.MaltiReviewStore.hasWord(id);
            button.textContent = exists ? "Saved for Review" : "Add to Review";
            button.classList.toggle("is-added", !!exists);
            button.disabled = !!exists;
        }

        button.addEventListener("click", function () {
            if (!window.MaltiReviewStore) {
                return;
            }
            window.MaltiReviewStore.addWord({
                id: id,
                maltese: maltese,
                english: english,
                topic: topicLabel,
                sourcePage: "animals.html",
                example: createExample(maltese)
            });
            syncButton();
            updateSummary();
        });

        card.appendChild(button);
        syncButton();
    }

    document.addEventListener("DOMContentLoaded", function () {
        if (!window.MaltiReviewStore) {
            return;
        }

        document.querySelectorAll(".animal-card-grid").forEach(function (grid) {
            var heading = grid.previousElementSibling;
            var topicLabel = heading ? heading.textContent.trim() : "Animals";
            grid.querySelectorAll(".animal-figure-card").forEach(function (card) {
                decorateCard(card, topicLabel);
            });
        });

        updateSummary();
    });
}());
