(function () {
    var DATA_URL = "./assets/data/animals.json";
    var SOURCE_PAGE = "animals.html";
    var reviewButtons = [];
    var bulkButtons = [];
    var allAnimalItems = [];

    function getStore() {
        return window.MaltiReviewStore || null;
    }

    function getRenderer() {
        return window.MaltiVocabRenderer || null;
    }

    function updateSummary() {
        var summary = document.querySelector("[data-review-summary]");
        var store = getStore();
        if (!summary || !store) {
            return;
        }
        var stats = store.getStats();
        summary.textContent = stats.total + " saved, " + stats.due + " due";
    }

    function createExample(item) {
        return item.example || ("Nara " + item.maltese + ".");
    }

    function makeReviewId(item) {
        var store = getStore();
        var key = store ? store.normalizeForKey(item.slug || item.maltese) : String(item.slug || item.maltese || "").toLowerCase();
        return "word::animals::" + key;
    }

    function toReviewWord(item, group) {
        return {
            id: makeReviewId(item),
            maltese: item.maltese,
            english: item.english,
            topic: group.title || "Animals",
            sourcePage: SOURCE_PAGE,
            example: createExample(item),
            image: item.image || "",
            imageAlt: item.imageAlt || item.english || item.maltese
        };
    }

    function syncReviewButton(button) {
        var store = getStore();
        if (!store) {
            return;
        }
        var exists = store.hasWord(button.dataset.reviewId);
        button.textContent = exists ? "Saved for Review" : "Add to Review";
        button.classList.toggle("is-added", !!exists);
        button.disabled = !!exists;
    }

    function syncBulkButton(button) {
        var store = getStore();
        if (!store) {
            return;
        }
        var items = JSON.parse(button.dataset.items || "[]");
        var unsaved = items.filter(function (item) {
            return !store.hasWord(item.id);
        }).length;
        var label = button.dataset.bulkLabel || "Add section to review";
        button.textContent = unsaved === 0 ? "Section saved" : label;
        button.disabled = unsaved === 0;

        var status = button.parentElement && button.parentElement.querySelector("[data-section-status]");
        if (status) {
            status.textContent = unsaved === 0 ? items.length + " saved" : (items.length - unsaved) + " saved, " + unsaved + " left";
        }
    }

    function refreshReviewUi() {
        reviewButtons.forEach(syncReviewButton);
        bulkButtons.forEach(syncBulkButton);
        updateSummary();
    }

    function addWords(words) {
        var store = getStore();
        if (!store) {
            return;
        }
        words.forEach(function (word) {
            if (!store.hasWord(word.id)) {
                store.addWord(word);
            }
        });
        refreshReviewUi();
    }

    function createReviewButton(item, group) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "review-add-button";
        button.dataset.reviewId = makeReviewId(item);
        button.addEventListener("click", function () {
            addWords([toReviewWord(item, group)]);
        });
        reviewButtons.push(button);
        return button;
    }

    function createBulkActionRow(label, words) {
        var row = document.createElement("div");
        row.className = "source-row";

        var button = document.createElement("button");
        button.type = "button";
        button.className = "action-button";
        button.dataset.items = JSON.stringify(words);
        button.dataset.bulkLabel = label;
        button.addEventListener("click", function () {
            addWords(words);
        });

        var status = document.createElement("span");
        status.className = "status-chip";
        status.setAttribute("data-section-status", "");

        row.appendChild(button);
        row.appendChild(status);
        bulkButtons.push(button);
        syncBulkButton(button);
        return row;
    }

    function injectPageBulkButton(words) {
        var toolbar = document.querySelector("#domestic .toolbar-row");
        if (!toolbar || toolbar.querySelector("[data-page-review-add]")) {
            return;
        }

        var button = document.createElement("button");
        button.type = "button";
        button.className = "action-button";
        button.dataset.pageReviewAdd = "true";
        button.dataset.items = JSON.stringify(words);
        button.dataset.bulkLabel = "Add all animal words";
        button.addEventListener("click", function () {
            addWords(words);
        });

        toolbar.insertBefore(button, toolbar.children[1] || null);
        bulkButtons.push(button);
        syncBulkButton(button);
    }

    function renderGroups(data) {
        var renderer = getRenderer();
        if (!renderer) {
            return;
        }

        allAnimalItems = [];

        (data.groups || []).forEach(function (group) {
            var container = document.querySelector('[data-animal-group="' + group.id + '"]');
            if (!container) {
                return;
            }

            var words = group.items.map(function (item) {
                var word = toReviewWord(item, group);
                allAnimalItems.push(word);
                return word;
            });

            var previous = container.previousElementSibling;
            if (!previous || !previous.classList.contains("source-row")) {
                container.parentNode.insertBefore(createBulkActionRow("Add section to review", words), container);
            }

            renderer.renderFigureGroup(container, group, {
                cardClass: "animal-figure-card",
                reviewButtonFactory: function (item) {
                    return createReviewButton(item, group);
                }
            });
        });

        injectPageBulkButton(allAnimalItems);
        refreshReviewUi();
    }

    function loadAnimalData() {
        fetch(DATA_URL)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("Could not load animal data.");
                }
                return response.json();
            })
            .then(renderGroups)
            .catch(function (error) {
                console.error(error);
            });
    }

    document.addEventListener("DOMContentLoaded", function () {
        if (!getStore() || !getRenderer()) {
            return;
        }
        loadAnimalData();
    });
}());
