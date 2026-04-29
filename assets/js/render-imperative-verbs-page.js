(function () {
    function getConfig() {
        return window.MaltiImperativeVerbPage || null;
    }

    function getStore() {
        return window.MaltiReviewStore || null;
    }

    function makeReviewId(item, prefixOverride) {
        var config = getConfig();
        var store = getStore();
        var prefix = prefixOverride || config.reviewPrefix;
        var key = store
            ? store.normalizeForKey(item.lemma || "")
            : String(item.lemma || "").toLowerCase();
        return "word::" + prefix + "::" + key;
    }

    function toReviewWord(item, group, prefixOverride, topicOverride) {
        var config = getConfig();
        return {
            id: makeReviewId(item, prefixOverride),
            maltese: item.lemma,
            english: item.english,
            topic: topicOverride || group.title || config.defaultTopic || "Imperative Verbs",
            sourcePage: config.sourcePage,
            example: "Singular imperative: " + item.imperativeSingular + ". Plural imperative: " + item.imperativePlural + ".",
            readingHint: item.readingHint || ""
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

        function formatImperativeForm(form, readingHint) {
            var text = String(form || "");
            if (readingHint) {
                text += " [ " + String(readingHint) + " ]";
            }
            return text;
        }

        function renderLesson23(data) {
            var lesson = data.lesson23 || {};

            var buildStepsRoot = document.querySelector("[data-imperative-build-steps]");
            if (buildStepsRoot) {
                buildStepsRoot.innerHTML = "";
                (lesson.buildSteps || []).forEach(function (step) {
                    var card = document.createElement("div");
                    card.className = "box imperative-mini-box";
                    card.innerHTML = "<h3>" + step.title + "</h3><p>" + step.text + "</p>";
                    buildStepsRoot.appendChild(card);
                });
            }

            var buildExamplesRoot = document.querySelector("[data-imperative-build-examples]");
            if (buildExamplesRoot) {
                buildExamplesRoot.innerHTML = "";
                (lesson.buildExamples || []).forEach(function (item) {
                    var card = document.createElement("div");
                    card.className = "box imperative-example-box";
                    card.innerHTML =
                        "<div class=\"imperative-flow\">" +
                            "<div><span class=\"imperative-flow-label\">Present (inti)</span><code>" + item.presentSingular + "</code></div>" +
                            "<div><span class=\"imperative-flow-arrow\">-></span></div>" +
                            "<div><span class=\"imperative-flow-label\">Command</span><code>" + item.imperativeSingular + "</code></div>" +
                        "</div>" +
                        "<div class=\"imperative-flow imperative-flow-plural\">" +
                            "<div><span class=\"imperative-flow-label\">Present (intom)</span><code>" + item.presentPlural + "</code></div>" +
                            "<div><span class=\"imperative-flow-arrow\">-></span></div>" +
                            "<div><span class=\"imperative-flow-label\">Command</span><code>" + item.imperativePlural + "</code></div>" +
                        "</div>";
                    buildExamplesRoot.appendChild(card);
                });
            }

            var politeRoot = document.querySelector("[data-imperative-polite-notes]");
            if (politeRoot) {
                politeRoot.innerHTML = "";
                (lesson.politeNotes || []).forEach(function (item) {
                    var card = document.createElement("div");
                    card.className = "box imperative-polite-box";
                    card.innerHTML =
                        "<h3><code>" + item.term + "</code></h3>" +
                        "<p class=\"muted\">" + item.meaning + "</p>" +
                        "<p><code>" + item.example + "</code></p>";
                    politeRoot.appendChild(card);
                });
            }

            var drillRoot = document.querySelector("[data-imperative-drills]");
            if (drillRoot) {
                drillRoot.innerHTML = "";
                (lesson.drills || []).forEach(function (item, index) {
                    var card = document.createElement("details");
                    card.className = "box imperative-drill-box";
                    card.innerHTML =
                        "<summary>" +
                            "<span class=\"imperative-drill-number\">" + (index + 1) + ".</span>" +
                            "<span class=\"imperative-drill-prompt\">" +
                                "<span><strong>Inti:</strong> <code>" + item.presentSingular + "</code></span>" +
                                "<span><strong>Intom:</strong> <code>" + item.presentPlural + "</code></span>" +
                            "</span>" +
                            "<span class=\"imperative-drill-toggle\">Show answer</span>" +
                        "</summary>" +
                        "<div class=\"imperative-drill-answer\">" +
                            "<div class=\"imperative-pair-row\">" +
                                "<span class=\"imperative-pair-label\">Singular command</span>" +
                                "<code>" + item.imperativeSingular + "</code>" +
                            "</div>" +
                            "<div class=\"imperative-pair-row\">" +
                                "<span class=\"imperative-pair-label\">Plural command</span>" +
                                "<code>" + item.imperativePlural + "</code>" +
                            "</div>" +
                        "</div>";
                    drillRoot.appendChild(card);
                });
            }

            var trickyRoot = document.querySelector("[data-imperative-tricky-items]");
            var trickyToolbar = document.querySelector("[data-imperative-tricky-toolbar]");
            if (trickyRoot) {
                trickyRoot.innerHTML = "";
                var trickyWords = (lesson.trickyItems || []).map(function (item) {
                    return toReviewWord(
                        item,
                        { title: "Irregular / Tricky Imperatives" },
                        "imperative-tricky",
                        "Irregular / Tricky Imperatives"
                    );
                });

                if (trickyToolbar && !trickyToolbar.querySelector("[data-imperative-tricky-add]")) {
                    var bulkRow = createBulkRow("Add tricky verbs to review", trickyWords, "source-row");
                    bulkRow.querySelector(".action-button").dataset.imperativeTrickyAdd = "true";
                    trickyToolbar.appendChild(bulkRow);
                }

                (lesson.trickyItems || []).forEach(function (item) {
                    var card = document.createElement("div");
                    card.className = "box imperative-tricky-box";

                    var header = document.createElement("div");
                    header.className = "imperative-tricky-header";
                    header.appendChild(buildVerbButton(item));

                    var meaning = document.createElement("p");
                    meaning.className = "muted";
                    meaning.textContent = item.english || "";

                    var present = document.createElement("div");
                    present.className = "imperative-tricky-line";
                    present.innerHTML = "<span class=\"imperative-pair-label\">Present</span><code>" + item.presentSingular + "</code><code>" + item.presentPlural + "</code>";

                    var imperative = document.createElement("div");
                    imperative.className = "imperative-tricky-line";
                    imperative.innerHTML = "<span class=\"imperative-pair-label\">Imperative</span><code>" + item.imperativeSingular + "</code><code>" + item.imperativePlural + "</code>";

                    card.appendChild(header);
                    card.appendChild(meaning);
                    card.appendChild(present);
                    card.appendChild(imperative);
                    trickyRoot.appendChild(card);
                });
            }
        }

        function renderGroups(data) {
            var root = document.querySelector(config.rootSelector || "#imperative-shortlist");
            if (!root) {
                return;
            }

            renderLesson23(data);

            var layout = root.querySelector("[data-imperative-grid]");
            var mainColumn = root.querySelector("[data-imperative-main]");
            var sideColumn = root.querySelector("[data-imperative-side]");
            if (!layout || !mainColumn || !sideColumn) {
                return;
            }

            mainColumn.innerHTML = "";
            sideColumn.innerHTML = "";
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
                            "<code>" + formatImperativeForm(item.imperativeSingular, item.readingHintSingular) + "</code>" +
                        "</div>" +
                        "<div class=\"imperative-pair-row\">" +
                            "<span class=\"imperative-pair-label\">Plural</span>" +
                            "<code>" + formatImperativeForm(item.imperativePlural, item.readingHintPlural) + "</code>" +
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
                if ((group.id || "") === "fil-mamma") {
                    mainColumn.appendChild(card);
                } else {
                    sideColumn.appendChild(card);
                }
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
