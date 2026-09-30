const renderedBankCardClasses = new Set([
    "demo-box",
    "dialogue-card",
    "example-card",
    "info-card",
    "pattern-card",
    "study-card"
]);

function resolveBankCardClass(value, fallback) {
    const classes = String(value || fallback)
        .split(/\s+/)
        .filter(Boolean);
    const unsupported = classes.find((className) => !renderedBankCardClasses.has(className));

    if (!classes.length || unsupported) {
        console.warn(`Unsupported bank card class "${unsupported || value}"; using "${fallback}".`);
        return fallback;
    }

    return classes.join(" ");
}

function applyClassList(element, classNames) {
    if (!element || !classNames) {
        return;
    }

    String(classNames)
        .split(/\s+/)
        .filter(Boolean)
        .forEach((className) => element.classList.add(className));
}

function isPublishableBankItem(item) {
    return window.MaltiLearningContent.isPublishable(item);
}

function normalizeBankItem(item, group) {
    return window.MaltiLearningContent.normalizeItem(item, group);
}

function appendQuestionAnswerPart(card, type, label, text, translation) {
    const part = document.createElement("div");
    const labelElement = document.createElement("span");
    const strong = document.createElement("strong");
    const code = document.createElement("code");

    part.className = `qa-pair-part qa-pair-part--${type}`;
    labelElement.className = "qa-pair-label";
    labelElement.textContent = label;
    strong.className = "qa-pair-text";
    code.textContent = text;
    strong.appendChild(code);
    part.append(labelElement, strong);

    if (translation) {
        const small = document.createElement("small");
        small.className = "qa-pair-translation";
        small.textContent = translation;
        part.appendChild(small);
    }

    card.appendChild(part);
}

function appendQuestionAnswerCard(container, normalized, index, numbered) {
    const article = document.createElement("article");
    const questionLabel = numbered ? `${index + 1}. Question` : "Question";

    article.className = "qa-pair-card";
    article.dataset.contentType = "questionAnswer";
    appendQuestionAnswerPart(article, "question", questionLabel, normalized.prompt, normalized.questionTranslation);
    appendQuestionAnswerPart(article, "answer", "Answer", normalized.answer, normalized.answerTranslation);
    container.appendChild(article);
}

async function renderExampleBanksFromData(config) {
    const {
        dataUrl,
        groupAttribute = "data-example-group",
        cardClass = "study-card",
        containerClass = "grid-2",
        numbered = true
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
        const normalized = normalizeBankItem(item, group);
        const key = store
            ? store.normalizeForKey(item.slug || normalized.primary)
            : String(item.slug || normalized.primary || "").toLowerCase();
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
        const normalized = normalizeBankItem(item, group);
        return {
            id: makeSentenceId(item, group),
            type: "sentence-card",
            contentType: normalized.itemType,
            maltese: normalized.primary,
            english: normalized.secondary,
            topic: getSentenceTopic(groupLabel),
            group: groupLabel,
            source: normalized.source,
            sourcePage: config.sourcePage || vocabConfig.sourcePage || window.location.pathname.split("/").pop() || "",
            prompt: normalized.prompt,
            answer: normalized.answer,
            questionTranslation: normalized.questionTranslation || "",
            answerTranslation: normalized.answerTranslation || ""
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
        const contentGroup = Object.assign({ source: data.source || null }, group);
        const selector = `[${groupAttribute}="${group.id}"]`;
        const container = document.querySelector(selector);
        if (!container) {
            return;
        }

        container.innerHTML = "";
        const publishableItems = (group.items || []).filter(isPublishableBankItem);
        const isQuestionAnswerGroup = publishableItems.length > 0 && publishableItems.every((item) => (
            normalizeBankItem(item, contentGroup).itemType === "questionAnswer"
        ));
        if (isQuestionAnswerGroup) {
            container.classList.remove("grid-2", "grid-3", "grid-auto", "stack");
            container.classList.add("qa-pair-grid");
        } else {
            applyClassList(container, group.containerClass || containerClass);
        }

        const sentenceItems = publishableItems.map((item) => toSentenceCard(item, contentGroup, container));
        allSentenceItems.push(...sentenceItems);

        if (getStore()) {
            const previous = container.previousElementSibling;
            if (!previous || !previous.hasAttribute || !previous.hasAttribute("data-sentence-review-row")) {
                const row = document.createElement("div");
                row.className = "toolbar-row";
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

        publishableItems.forEach((item, index) => {
            const normalized = normalizeBankItem(item, contentGroup);
            const shouldNumber = typeof group.numbered === "boolean" ? group.numbered : numbered;

            if (normalized.itemType === "questionAnswer") {
                appendQuestionAnswerCard(container, normalized, index, shouldNumber);
                return;
            }

            const article = document.createElement("article");
            article.className = resolveBankCardClass(group.cardClass || cardClass, "study-card");

            if (item.origin) {
                article.dataset.origin = item.origin;
            }

            const strong = document.createElement("strong");
            const code = document.createElement("code");
            code.textContent = shouldNumber ? `${index + 1}. ${normalized.primary}` : normalized.primary;
            strong.appendChild(code);

            const span = document.createElement("span");
            span.textContent = normalized.secondary;

            article.appendChild(strong);
            article.appendChild(span);

            const supportingText = [item.note, normalized.supportingText].filter(Boolean).join(" ");
            if (supportingText) {
                const note = document.createElement("small");
                note.textContent = supportingText;
                article.appendChild(note);
            }
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

async function renderQuestionBanksFromData(config) {
    const {
        dataUrl,
        groupAttribute = "data-question-group",
        cardClass = "example-card",
        containerClass = "stack",
        listKey = "questions",
        numbered = true
    } = config || {};

    if (!dataUrl) {
        return;
    }

    const response = await fetch(dataUrl);
    if (!response.ok) {
        throw new Error(`Could not load question data from ${dataUrl}`);
    }

    const data = await response.json();
    const groups = Array.isArray(data.groups) ? data.groups : [];

    function getStore() {
        return window.MaltiReviewStore || null;
    }

    function getVocabConfig() {
        return window.MaltiVocabReviewPage || {};
    }

    function getGroupLabel(container, group) {
        const card = container.closest(".card, .content-card");
        const heading = card ? card.querySelector("h2") : null;
        return group.title || (heading ? heading.textContent.trim() : "");
    }

    function getQuestionTopic(groupLabel) {
        const vocabConfig = getVocabConfig();
        const baseTopic = config.defaultTopic || vocabConfig.defaultTopic || "Questions";
        return groupLabel ? (baseTopic + " - " + groupLabel) : baseTopic;
    }

    function makeQuestionId(item, group) {
        const store = getStore();
        const vocabConfig = getVocabConfig();
        const reviewPrefix = config.reviewPrefix || vocabConfig.reviewPrefix || "examples";
        const normalized = normalizeBankItem(item, group);
        const key = store
            ? store.normalizeForKey(item.slug || normalized.primary)
            : String(item.slug || normalized.primary || "").toLowerCase();
        return "sentence::" + reviewPrefix + "-questions::" + key;
    }

    function toQuestionCard(item, group, container) {
        const groupLabel = getGroupLabel(container, group);
        const vocabConfig = getVocabConfig();
        const normalized = normalizeBankItem(item, group);
        return {
            id: makeQuestionId(item, group),
            type: "sentence-card",
            contentType: normalized.itemType,
            maltese: normalized.primary,
            english: normalized.secondary,
            topic: getQuestionTopic(groupLabel),
            group: groupLabel,
            source: normalized.source,
            sourcePage: config.sourcePage || vocabConfig.sourcePage || window.location.pathname.split("/").pop() || "",
            prompt: normalized.prompt,
            answer: normalized.answer
        };
    }

    function syncBulkButton(button) {
        const store = getStore();
        if (!store) {
            return;
        }
        const items = JSON.parse(button.dataset.items || "[]");
        const unsaved = items.filter((item) => !store.hasCard(item.id)).length;
        const label = button.dataset.bulkLabel || "Add question bank to review";
        button.textContent = unsaved === 0 ? "Question bank saved" : label;
        button.disabled = unsaved === 0;

        const status = button.parentElement && button.parentElement.querySelector("[data-section-status]");
        if (status) {
            status.textContent = unsaved === 0 ? (items.length + " saved") : ((items.length - unsaved) + " saved, " + unsaved + " left");
        }
    }

    function addQuestionCards(items, bulkButtons) {
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

    const bulkButtons = [];

    groups.forEach((group) => {
        const selector = `[${groupAttribute}="${group.id}"]`;
        const container = document.querySelector(selector);
        if (!container) {
            return;
        }

        container.innerHTML = "";
        applyClassList(container, containerClass);

        const questionGroup = Object.assign({ source: data.source || null }, group, { itemType: group.questionItemType || "translation" });
        const publishableItems = (group[listKey] || []).filter(isPublishableBankItem);
        const questionItems = publishableItems.map((item) => toQuestionCard(item, questionGroup, container));

        if (getStore()) {
            const previous = container.previousElementSibling;
            if (!previous || !previous.hasAttribute || !previous.hasAttribute("data-question-review-row")) {
                const row = document.createElement("div");
                row.className = "toolbar-row";
                row.setAttribute("data-question-review-row", "true");

                const button = document.createElement("button");
                button.type = "button";
                button.className = "action-button";
                button.dataset.items = JSON.stringify(questionItems);
                button.dataset.bulkLabel = config.bulkLabel || "Add question bank to review";
                button.addEventListener("click", () => addQuestionCards(questionItems, bulkButtons));

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

        publishableItems.forEach((item, index) => {
            const normalized = normalizeBankItem(item, questionGroup);
            const card = document.createElement("div");
            card.className = resolveBankCardClass(cardClass, "example-card");

            const strong = document.createElement("strong");
            strong.textContent = numbered ? `${index + 1}. ${normalized.primary}` : normalized.primary;

            const span = document.createElement("span");
            span.textContent = normalized.secondary;

            card.appendChild(strong);
            card.appendChild(span);
            container.appendChild(card);
        });
    });
}

window.renderExampleBanksFromData = renderExampleBanksFromData;
window.renderQuestionBanksFromData = renderQuestionBanksFromData;
