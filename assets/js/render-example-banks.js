async function renderExampleBanksFromData(config) {
    const {
        dataUrl,
        groupAttribute = "data-example-group",
        cardClass = "sentence-card"
    } = config || {};

    if (!dataUrl) {
        return;
    }

    const response = await fetch(dataUrl);
    if (!response.ok) {
        throw new Error(`Could not load example data from ${dataUrl}`);
    }

    const data = await response.json();
    const groups = Array.isArray(data.groups) ? data.groups : [];

    function getStore() {
        return window.MaltiReviewStore || null;
    }

    function getVocabConfig() {
        return window.MaltiVocabReviewPage || {};
    }

    function makeSentenceId(item, group) {
        const store = getStore();
        const vocabConfig = getVocabConfig();
        const reviewPrefix = config.reviewPrefix || vocabConfig.reviewPrefix || "examples";
        const key = store
            ? store.normalizeForKey(item.slug || item.maltese)
            : String(item.slug || item.maltese || "").toLowerCase();
        return "sentence::" + reviewPrefix + "::" + key;
    }

    function getGroupLabel(container, group) {
        const card = container.closest(".card, .content-card");
        const heading = card ? card.querySelector("h2") : null;
        return group.title || (heading ? heading.textContent.trim() : "");
    }

    function getSentenceTopic(groupLabel) {
        const vocabConfig = getVocabConfig();
        const baseTopic = config.defaultTopic || vocabConfig.defaultTopic || "Sentences";
        return groupLabel ? (baseTopic + " - " + groupLabel) : baseTopic;
    }

    function toSentenceCard(item, group, container) {
        const groupLabel = getGroupLabel(container, group);
        const vocabConfig = getVocabConfig();
        return {
            id: makeSentenceId(item, group),
            type: "sentence-card",
            maltese: item.maltese,
            english: item.english,
            topic: getSentenceTopic(groupLabel),
            group: groupLabel,
            sourcePage: config.sourcePage || vocabConfig.sourcePage || window.location.pathname.split("/").pop() || "",
            prompt: item.maltese,
            answer: item.english
        };
    }

    function syncBulkButton(button) {
        const store = getStore();
        if (!store) {
            return;
        }
        const items = JSON.parse(button.dataset.items || "[]");
        const unsaved = items.filter((item) => !store.hasCard(item.id)).length;
        const label = button.dataset.bulkLabel || "Add sentence bank to review";
        button.textContent = unsaved === 0 ? "Sentence bank saved" : label;
        button.disabled = unsaved === 0;

        const status = button.parentElement && button.parentElement.querySelector("[data-section-status]");
        if (status) {
            status.textContent = unsaved === 0 ? (items.length + " saved") : ((items.length - unsaved) + " saved, " + unsaved + " left");
        }
    }

    function addSentenceCards(items, bulkButtons) {
        const store = getStore();
        if (!store) {
            return;
        }
        items.forEach((item) => {
            if (!store.hasCard(item.id)) {
                store.addSentence(item);
            }
        });
        bulkButtons.forEach(syncBulkButton);
        const summary = document.querySelector("[data-review-summary]");
        if (summary) {
            const stats = store.getStats();
            summary.textContent = stats.total + " saved, " + stats.due + " due";
        }
    }

    const allSentenceItems = [];
    const bulkButtons = [];

    groups.forEach((group) => {
        const selector = `[${groupAttribute}="${group.id}"]`;
        const container = document.querySelector(selector);
        if (!container) {
            return;
        }

        container.innerHTML = "";
        container.classList.add("sentence-grid");

        const sentenceItems = (group.items || []).map((item) => toSentenceCard(item, group, container));
        allSentenceItems.push(...sentenceItems);

        if (getStore()) {
            const previous = container.previousElementSibling;
            if (!previous || !previous.hasAttribute || !previous.hasAttribute("data-sentence-review-row")) {
                const row = document.createElement("div");
                row.className = "source-row";
                row.setAttribute("data-sentence-review-row", "true");

                const button = document.createElement("button");
                button.type = "button";
                button.className = "action-button";
                button.dataset.items = JSON.stringify(sentenceItems);
                button.dataset.bulkLabel = "Add sentence bank to review";
                button.addEventListener("click", () => addSentenceCards(sentenceItems, bulkButtons));

                const status = document.createElement("span");
                status.className = "status-chip";
                status.setAttribute("data-section-status", "");

                row.appendChild(button);
                row.appendChild(status);
                container.parentNode.insertBefore(row, container);
                bulkButtons.push(button);
                syncBulkButton(button);
            }
        }

        (group.items || []).forEach((item, index) => {
            const article = document.createElement("article");
            article.className = cardClass;

            if (item.origin) {
                article.dataset.origin = item.origin;
            }

            const strong = document.createElement("strong");
            const code = document.createElement("code");
            code.textContent = `${index + 1}. ${item.maltese}`;
            strong.appendChild(code);

            const span = document.createElement("span");
            span.textContent = item.english;

            article.appendChild(strong);
            article.appendChild(span);
            container.appendChild(article);
        });
    });

    if (getStore()) {
        const vocabConfig = getVocabConfig();
        const toolbarSelector = config.pageToolbarSelector || vocabConfig.pageToolbarSelector;
        const toolbar = toolbarSelector ? document.querySelector(toolbarSelector) : null;
        if (toolbar && allSentenceItems.length && !toolbar.querySelector("[data-page-sentence-review-add]")) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "action-button";
            button.dataset.pageSentenceReviewAdd = "true";
            button.dataset.bulkLabel = config.pageBulkLabel || "Add all example sentences";
            button.dataset.items = JSON.stringify(allSentenceItems);
            button.addEventListener("click", () => addSentenceCards(allSentenceItems, bulkButtons));
            toolbar.insertBefore(button, toolbar.children[1] || null);
            bulkButtons.push(button);
            syncBulkButton(button);
        }
    }
}

window.renderExampleBanksFromData = renderExampleBanksFromData;
