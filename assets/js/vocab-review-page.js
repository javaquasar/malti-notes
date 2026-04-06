(function () {
    function getConfig() {
        return window.MaltiVocabReviewPage || null;
    }

    function getStore() {
        return window.MaltiReviewStore || null;
    }

    function getRenderer() {
        return window.MaltiVocabRenderer || null;
    }

    function getGroupSelector(groupId) {
        const config = getConfig();
        return "[" + config.groupAttribute + '="' + groupId + '"]';
    }

    function makeReviewId(item) {
        const config = getConfig();
        const store = getStore();
        const key = store ? store.normalizeForKey(item.slug || item.maltese) : String(item.slug || item.maltese || "").toLowerCase();
        return "word::" + config.reviewPrefix + "::" + key;
    }

    function createExample(item, fallbackPrefix) {
        return item.example || (fallbackPrefix + " " + item.maltese + ".");
    }

    function createPageController() {
        const config = getConfig();
        const reviewButtons = [];
        const bulkButtons = [];
        let allItems = [];

        function updateSummary() {
            const summary = document.querySelector("[data-review-summary]");
            const store = getStore();
            if (!summary || !store) {
                return;
            }
            const stats = store.getStats();
            summary.textContent = stats.total + " saved, " + stats.due + " due";
        }

        function toReviewWord(item, group) {
            return {
                id: makeReviewId(item),
                maltese: item.maltese,
                english: item.english,
                topic: group.title || config.defaultTopic || "General",
                sourcePage: config.sourcePage,
                example: createExample(item, config.examplePrefix || "Nara"),
                image: item.image || "",
                imageAlt: item.imageAlt || item.english || item.maltese
            };
        }

        function syncReviewButton(button) {
            const store = getStore();
            if (!store) {
                return;
            }
            const exists = store.hasWord(button.dataset.reviewId);
            button.textContent = exists ? "Saved for Review" : "Add to Review";
            button.classList.toggle("is-added", !!exists);
            button.disabled = !!exists;
        }

        function syncBulkButton(button) {
            const store = getStore();
            if (!store) {
                return;
            }
            const items = JSON.parse(button.dataset.items || "[]");
            const unsaved = items.filter(function (item) {
                return !store.hasWord(item.id);
            }).length;
            const label = button.dataset.bulkLabel || "Add section to review";
            button.textContent = unsaved === 0 ? "Section saved" : label;
            button.disabled = unsaved === 0;

            const status = button.parentElement && button.parentElement.querySelector("[data-section-status]");
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
            const store = getStore();
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
            const button = document.createElement("button");
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
            const row = document.createElement("div");
            row.className = "source-row";

            const button = document.createElement("button");
            button.type = "button";
            button.className = "action-button";
            button.dataset.items = JSON.stringify(words);
            button.dataset.bulkLabel = label;
            button.addEventListener("click", function () {
                addWords(words);
            });

            const status = document.createElement("span");
            status.className = "status-chip";
            status.setAttribute("data-section-status", "");

            row.appendChild(button);
            row.appendChild(status);
            bulkButtons.push(button);
            syncBulkButton(button);
            return row;
        }

        function injectPageBulkButton(words) {
            const toolbar = document.querySelector(config.pageToolbarSelector);
            if (!toolbar || toolbar.querySelector("[data-page-review-add]")) {
                return;
            }

            const button = document.createElement("button");
            button.type = "button";
            button.className = "action-button";
            button.dataset.pageReviewAdd = "true";
            button.dataset.items = JSON.stringify(words);
            button.dataset.bulkLabel = config.pageBulkLabel || "Add all words";
            button.addEventListener("click", function () {
                addWords(words);
            });

            toolbar.insertBefore(button, toolbar.children[1] || null);
            bulkButtons.push(button);
            syncBulkButton(button);
        }

        function renderGroups(data) {
            const renderer = getRenderer();
            if (!renderer) {
                return;
            }

            allItems = [];

            (data.groups || []).forEach(function (group) {
                const container = document.querySelector(getGroupSelector(group.id));
                if (!container) {
                    return;
                }

                const words = group.items.map(function (item) {
                    const word = toReviewWord(item, group);
                    allItems.push(word);
                    return word;
                });

                const previous = container.previousElementSibling;
                if (!previous || !previous.classList.contains("source-row")) {
                    container.parentNode.insertBefore(createBulkActionRow("Add section to review", words), container);
                }

                renderer.renderFigureGroup(container, group, {
                    cardClass: config.cardClass || "visual-vocab-card",
                    reviewButtonFactory: function (item) {
                        return createReviewButton(item, group);
                    }
                });
            });

            injectPageBulkButton(allItems);
            refreshReviewUi();
        }

        function loadData() {
            fetch(config.dataUrl)
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("Could not load vocab data.");
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
        const config = getConfig();
        if (!config || !getStore() || !getRenderer()) {
            return;
        }
        createPageController().loadData();
    });
}());
