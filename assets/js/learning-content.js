(function (root, factory) {
    const api = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.MaltiLearningContent = api;
    }
}(typeof window !== "undefined" ? window : globalThis, function () {
    const ITEM_TYPES = Object.freeze([
        "translation",
        "questionAnswer",
        "rule",
        "example"
    ]);

    function clean(value) {
        return typeof value === "string" ? value.trim() : "";
    }

    function resolveItemType(item, group) {
        const explicitType = item?.itemType || group?.itemType;
        if (ITEM_TYPES.includes(explicitType)) {
            return explicitType;
        }
        if (item?.question && typeof item.question === "object" && item?.answer && typeof item.answer === "object") {
            return "questionAnswer";
        }
        if (item?.rule) {
            return "rule";
        }
        return "example";
    }

    function normalizeItem(item, group) {
        const value = item || {};
        const itemType = resolveItemType(value, group);

        if (itemType === "questionAnswer") {
            const question = value.question || {};
            const answer = value.answer || {};
            const questionTranslation = clean(question.english);
            const answerTranslation = clean(answer.english);
            return {
                itemType,
                primary: clean(question.maltese),
                secondary: clean(answer.maltese),
                prompt: clean(question.maltese),
                answer: clean(answer.maltese),
                questionTranslation,
                answerTranslation,
                supportingText: [questionTranslation, answerTranslation].filter(Boolean).join(" "),
                source: value.source || group?.source || null,
                verificationStatus: value.verificationStatus || ""
            };
        }

        if (itemType === "rule") {
            const title = clean(value.title);
            const rule = clean(value.rule);
            return {
                itemType,
                primary: title || rule,
                secondary: title ? rule : clean(value.pattern),
                prompt: title || clean(value.pattern),
                answer: rule,
                supportingText: clean(value.pattern),
                source: value.source || group?.source || null,
                verificationStatus: value.verificationStatus || ""
            };
        }

        return {
            itemType,
            primary: clean(value.maltese),
            secondary: clean(value.english || value.translation || value.meaning),
            prompt: clean(value.maltese),
            answer: clean(value.english || value.translation || value.meaning),
            supportingText: "",
            source: value.source || group?.source || null,
            verificationStatus: value.verificationStatus || ""
        };
    }

    function isPublishable(item) {
        return !!item && item.verificationStatus !== "needs-review";
    }

    return {
        ITEM_TYPES,
        isPublishable,
        normalizeItem,
        resolveItemType
    };
}));
