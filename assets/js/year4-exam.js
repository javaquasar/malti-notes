(function () {
    var state = { data: null, collection: "exam", active: "all", hideEnglish: false, groupsExpanded: false, visible: [] };
    var grid = document.getElementById("year4-grid");
    var collectionTabs = document.getElementById("year4-collection-tabs");
    var tabs = document.getElementById("year4-tabs");
    var topicToggle = document.getElementById("year4-topic-toggle");
    var topicSummary = document.getElementById("year4-topic-summary");
    var search = document.getElementById("year4-search");
    var toggle = document.getElementById("year4-toggle");
    var count = document.getElementById("year4-count");
    var reviewSummary = document.getElementById("year4-review-summary");
    var addVisibleButton = document.getElementById("year4-add-visible");
    var prompt = document.getElementById("year4-prompt");
    var answer = document.getElementById("year4-answer");
    var feedback = document.getElementById("year4-feedback");
    var currentWord = null;

    function activeCollections() {
        if (state.collection === "all") return state.data.collections;
        return state.data.collections.filter(function (collection) { return collection.id === state.collection; });
    }

    function activeGroups() {
        return activeCollections().flatMap(function (collection) {
            return collection.groups.map(function (group) {
                return Object.assign({ collectionTitle: collection.title, collectionId: collection.id }, group);
            });
        });
    }

    function allItems() {
        var items = activeGroups().flatMap(function (group) {
            return group.items.map(function (item) {
                return Object.assign({
                    groupTitle: group.title,
                    groupId: group.id,
                    collectionTitle: group.collectionTitle,
                    collectionId: group.collectionId
                }, item);
            });
        });
        if (state.collection !== "all") return items;
        var seen = new Set();
        return items.filter(function (item) {
            var key = item.maltese.toLocaleLowerCase("mt");
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    function reviewId(item) {
        return "word::year-4-exam::" + window.MaltiReviewStore.normalizeForKey(item.slug || item.maltese);
    }

    function toReviewWord(item) {
        return {
            id: reviewId(item),
            contentId: item.slug || "",
            maltese: item.maltese,
            english: item.english || "",
            example: item.example || "",
            topic: "Year 4 - " + item.groupTitle,
            sourcePage: "year4_exam.html"
        };
    }

    function addToReview(items) {
        items.forEach(function (item) {
            if (!window.MaltiReviewStore.hasWord(reviewId(item))) {
                window.MaltiReviewStore.addWord(toReviewWord(item));
            }
        });
        render();
    }

    function updateReviewSummary() {
        var saved = state.visible.filter(function (item) { return window.MaltiReviewStore.hasWord(reviewId(item)); }).length;
        var left = state.visible.length - saved;
        reviewSummary.textContent = saved + " visible words saved, " + left + " left";
        addVisibleButton.textContent = left ? "Add visible to review" : "Visible words saved";
        addVisibleButton.disabled = left === 0;
    }

    function renderCollectionTabs() {
        var collections = state.data.collections.map(function (collection) {
            return { id: collection.id, title: collection.title };
        }).concat([{ id: "all", title: "All" }]);
        collectionTabs.innerHTML = "";
        collections.forEach(function (collection) {
            var button = document.createElement("button");
            button.className = "year4-tab year4-collection-tab";
            button.type = "button";
            button.setAttribute("role", "tab");
            button.textContent = collection.title;
            button.setAttribute("aria-selected", String(state.collection === collection.id));
            button.addEventListener("click", function () {
                state.collection = collection.id;
                state.active = "all";
                render();
            });
            collectionTabs.appendChild(button);
        });
    }

    function renderTabs() {
        var groups = [{ id: "all", title: "All Topics" }].concat(activeGroups().map(function (group) {
            return { id: group.id, title: group.title };
        }));
        tabs.innerHTML = "";
        groups.forEach(function (group) {
            var button = document.createElement("button");
            button.className = "year4-tab";
            button.type = "button";
            button.setAttribute("role", "tab");
            button.textContent = group.title;
            button.setAttribute("aria-selected", String(state.active === group.id));
            button.addEventListener("click", function () {
                state.active = group.id;
                render();
            });
            tabs.appendChild(button);
        });
        tabs.hidden = !state.groupsExpanded;
        topicToggle.textContent = state.groupsExpanded ? "Hide Topic Filters" : "Show Topic Filters";
        topicToggle.setAttribute("aria-expanded", String(state.groupsExpanded));
        var activeGroup = groups.find(function (group) { return group.id === state.active; });
        topicSummary.textContent = activeGroup ? activeGroup.title : "All Topics";
    }

    function bindCardReveal(card) {
        var revealTimer = null;
        function revealTranslation() { if (state.hideEnglish) card.classList.add("is-translation-revealed"); }
        function hideTranslation() {
            window.clearTimeout(revealTimer);
            revealTimer = null;
            card.classList.remove("is-translation-revealed");
        }
        card.addEventListener("pointerenter", function (event) { if (event.pointerType === "mouse") revealTranslation(); });
        card.addEventListener("pointerleave", hideTranslation);
        card.addEventListener("pointerdown", function (event) {
            if (!state.hideEnglish) return;
            if (event.pointerType === "mouse") return revealTranslation();
            window.clearTimeout(revealTimer);
            revealTimer = window.setTimeout(revealTranslation, 450);
        });
        card.addEventListener("pointerup", function (event) { if (event.pointerType !== "mouse") hideTranslation(); });
        card.addEventListener("pointercancel", hideTranslation);
    }

    function render() {
        var query = search.value.trim().toLocaleLowerCase("mt");
        state.visible = allItems().filter(function (item) {
            var inGroup = state.active === "all" || item.groupId === state.active;
            var haystack = [item.maltese, item.english, item.sourceLabel].join(" ").toLocaleLowerCase("mt");
            return inGroup && (!query || haystack.includes(query));
        });
        grid.innerHTML = "";
        state.visible.forEach(function (item) {
            var card = document.createElement("article");
            var isSaved = window.MaltiReviewStore.hasWord(reviewId(item));
            card.className = "year4-card" + (state.hideEnglish ? " hide-english" : "");
            card.tabIndex = 0;
            card.innerHTML = "<code></code><p class='english'></p><p class='mini'></p><div class='year4-example'><strong>Example</strong><span class='example-text'></span><strong>English</strong><span class='example-translation'></span></div>";
            card.querySelector("code").textContent = item.maltese;
            card.querySelector(".english").textContent = item.english || "translation pending";
            card.querySelector(".mini").textContent = item.collectionTitle + " - " + (item.sourceLabel || item.groupTitle);
            card.querySelector(".example-text").textContent = item.example || item.maltese;
            card.querySelector(".example-translation").textContent = item.exampleTranslation || item.english || "";
            var reviewButton = document.createElement("button");
            reviewButton.type = "button";
            reviewButton.className = "review-add-button" + (isSaved ? " is-added" : "");
            reviewButton.textContent = isSaved ? "Saved for Review" : "Add to Review";
            reviewButton.disabled = isSaved;
            reviewButton.addEventListener("click", function () { addToReview([item]); });
            card.appendChild(reviewButton);
            bindCardReveal(card);
            grid.appendChild(card);
        });
        count.textContent = state.visible.length + " visible words";
        renderCollectionTabs();
        renderTabs();
        updateReviewSummary();
    }

    function newPracticeWord() {
        var words = allItems().filter(function (item) { return item.english; });
        currentWord = words[Math.floor(Math.random() * words.length)];
        prompt.textContent = currentWord.english;
        answer.value = "";
        feedback.textContent = "";
        answer.focus();
    }

    function normalizeText(value) { return value.trim().toLocaleLowerCase("mt"); }

    function checkPracticeWord() {
        if (!currentWord) return newPracticeWord();
        var correct = normalizeText(answer.value) === normalizeText(currentWord.maltese);
        if (window.MaltiMistakeStore) {
            window.MaltiMistakeStore.recordAttempt({
                id: "year4::" + (currentWord.slug || normalizeText(currentWord.maltese)),
                itemId: currentWord.slug || currentWord.maltese,
                prompt: currentWord.english,
                given: answer.value,
                correctAnswer: currentWord.maltese,
                explanation: currentWord.example || "",
                sourcePage: "year4_exam.html",
                topic: "Year 4 - " + currentWord.groupTitle,
                type: "spelling",
                category: "vocabulary",
                ruleId: "spelling"
            }, correct);
        }
        feedback.textContent = correct
            ? "Correct: " + currentWord.maltese
            : "Answer: " + currentWord.maltese;
    }

    fetch("./assets/data/year4_revision_vocabulary.json")
        .then(function (response) {
            if (!response.ok) throw new Error("Could not load Year 4 vocabulary.");
            return response.json();
        })
        .then(function (data) {
            state.data = data;
            render();
            newPracticeWord();
        })
        .catch(function (error) {
            console.error(error);
            count.textContent = "Year 4 vocabulary could not be loaded.";
        });

    search.addEventListener("input", render);
    toggle.addEventListener("click", function () {
        state.hideEnglish = !state.hideEnglish;
        toggle.textContent = state.hideEnglish ? "Show English" : "Hide English";
        render();
    });
    topicToggle.addEventListener("click", function () {
        state.groupsExpanded = !state.groupsExpanded;
        renderTabs();
    });
    addVisibleButton.addEventListener("click", function () { addToReview(state.visible); });
    document.getElementById("year4-new").addEventListener("click", newPracticeWord);
    document.getElementById("year4-check").addEventListener("click", checkPracticeWord);
    answer.addEventListener("keydown", function (event) { if (event.key === "Enter") checkPracticeWord(); });

    window.MaltiYear4Exam = { getVisibleItems: function () { return state.visible.slice(); } };
}());
