(function () {
    function getConfig() {
        return window.MaltiImperativeVerbPage || null;
    }

    function getStore() {
        return window.MaltiReviewStore || null;
    }

    function makeReviewId(item) {
        var config = getConfig();
        var store = getStore();
        var key = store
            ? store.normalizeForKey(item.lemma || "")
            : String(item.lemma || "").toLowerCase();
        return "word::" + config.reviewPrefix + "::" + key;
    }

    function toReviewWord(item, group) {
        var config = getConfig();
        return {
            id: makeReviewId(item),
            maltese: item.lemma,
            english: item.english,
            topic: group.title || config.defaultTopic || "Imperative Verbs",
            sourcePage: config.sourcePage,
            example: "Singular imperative: " + item.imperativeSingular + ". Plural imperative: " + item.imperativePlural + "."
        };
    }

    function createPageController() {
        var config = getConfig();
        var reviewButtons = [];
        var bulkButtons = [];
        var allWords = [];

        function updateSummary() {
            var summary = document.querySelector("[data-review-summary]");
            var store = getStore();
            if (!summary || !store) {
                return;
            }
            var stats = store.getStats();
            summary.textContent = stats.total + " saved, " + stats.due + " due";
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
            button.textContent = unsaved === 0
                ? "Section saved"
                : (button.dataset.bulkLabel || "Add section to review");
            button.disabled = unsaved === 0;

            var status = button.parentElement && button.parentElement.querySelector("[data-section-status]");
            if (status) {
                status.textContent = unsaved === 0
                    ? items.length + " saved"
                    : (items.length - unsaved) + " saved, " + unsaved + " left";
            }
        }

        function syncPageButtons() {
            reviewButtons.forEach(syncBulkButton);
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
            syncPageButtons();
        }

        function createBulkRow(label, words, extraClass) {
            var row = document.createElement("div");
            row.className = extraClass || "source-row";

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
            return row;
        }

        function buildVerbButton(item) {
            var button = document.createElement("button");
            button.type = "button";
            button.className = "verb-trigger";
            button.textContent = item.lemma || "";
            button.dataset.verb = item.lemma || "";
            button.dataset.meaning = item.english || "";
            if (item.lookupHint) {
                button.dataset.lookupHint = item.lookupHint;
            }
            if (item.slugHint) {
                button.dataset.slugHint = item.slugHint;
            }
            button.title = "Click to view forms for: " + (item.lemma || "");
            return button;
        }

        function renderGroups(data) {
            var root = document.querySelector(config.rootSelector || "#imperative-shortlist");
            if (!root) {
                return;
            }

            var grid = root.querySelector("[data-imperative-grid]");
            if (!grid) {
                return;
            }

            grid.innerHTML = "";
            allWords = [];

            (data.groups || []).forEach(function (group) {
                var words = (group.items || []).map(function (item) {
                    var word = toReviewWord(item, group);
                    allWords.push(word);
                    return word;
                });

                var card = document.createElement("div");
                card.className = "box";

                var heading = document.createElement("h3");
                heading.textContent = group.title || "Verb Group";
                card.appendChild(heading);

                if (group.description) {
                    var description = document.createElement("p");
                    description.className = "muted";
                    description.textContent = group.description;
                    card.appendChild(description);
                }

                card.appendChild(createBulkRow("Add section to review", words, "source-row"));

                var table = document.createElement("table");
                table.className = "table-soft imperative-shortlist-table";
                table.innerHTML = "" +
                    "<thead><tr>" +
                        "<th>Verb</th>" +
                        "<th>English</th>" +
                        "<th>Imperative</th>" +
                    "</tr></thead>";

                var tbody = document.createElement("tbody");

                (group.items || []).forEach(function (item) {
                    var row = document.createElement("tr");

                    var lemmaCell = document.createElement("td");
                    lemmaCell.appendChild(buildVerbButton(item));

                    var englishCell = document.createElement("td");
                    englishCell.textContent = item.english || "";

                    var imperativeCell = document.createElement("td");
                    imperativeCell.className = "imperative-pair-cell";
                    imperativeCell.innerHTML = "" +
                        "<div class=\"imperative-pair-row\">" +
                            "<span class=\"imperative-pair-label\">Singular</span>" +
                            "<code>" + String(item.imperativeSingular || "") + "</code>" +
                        "</div>" +
                        "<div class=\"imperative-pair-row\">" +
                            "<span class=\"imperative-pair-label\">Plural</span>" +
                            "<code>" + String(item.imperativePlural || "") + "</code>" +
                        "</div>";

                    row.appendChild(lemmaCell);
                    row.appendChild(englishCell);
                    row.appendChild(imperativeCell);
                    tbody.appendChild(row);
                });

                table.appendChild(tbody);

                var tableWrap = document.createElement("div");
                tableWrap.className = "imperative-shortlist-wrap";
                tableWrap.appendChild(table);

                card.appendChild(tableWrap);
                grid.appendChild(card);
            });

            var pageToolbar = root.querySelector("[data-page-imperative-toolbar]");
            if (pageToolbar && !pageToolbar.querySelector("[data-page-review-add]")) {
                var pageButton = document.createElement("button");
                pageButton.type = "button";
                pageButton.className = "action-button";
                pageButton.dataset.pageReviewAdd = "true";
                pageButton.dataset.items = JSON.stringify(allWords);
                pageButton.dataset.bulkLabel = config.pageBulkLabel || "Add all verbs to review";
                pageButton.addEventListener("click", function () {
                    addWords(allWords);
                });
                pageToolbar.insertBefore(pageButton, pageToolbar.children[2] || null);
                reviewButtons.push(pageButton);
            }

            syncPageButtons();
        }

        function loadData() {
            fetch(config.dataUrl)
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("Could not load imperative verb shortlist data.");
                    }
                    return response.json();
                })
                .then(renderGroups)
                .catch(function (error) {
                    console.error(error);
                });
        }

        return {
            loadData: loadData
        };
    }

    document.addEventListener("DOMContentLoaded", function () {
        var config = getConfig();
        if (!config || !getStore()) {
            return;
        }
        createPageController().loadData();
    });
}());
