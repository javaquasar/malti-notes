(() => {
    const player = document.querySelector("[data-word-audio-player]");
    const status = document.querySelector("[data-word-audio-status]");
    const template = document.querySelector("[data-word-audio-template]");
    const stage = document.getElementById("review-stage");
    const reviewControls = document.querySelector("[data-review-word-audio]");
    const reviewButton = reviewControls?.querySelector("[data-word-audio-button]");
    const store = window.MaltiReviewStore;
    if (!player || !status || !store) return;

    let playing = null;
    let reviewId = null;

    function showButtonState(button, label, icon) {
        const word = button.dataset.wordAudioLabel;
        button.ariaLabel = word ? label + " for " + word : label;
        button.title = label;
        button.textContent = button.hasAttribute("data-word-audio-icon") ? icon : label;
    }

    function stopPlayback() {
        if (!playing) return;
        const { button } = playing;
        playing = null;
        player.pause();
        player.currentTime = 0;
        showButtonState(button, "Play audio", "🔊");
    }

    async function togglePlayback(button) {
        if (playing?.button === button) {
            stopPlayback();
            return;
        }
        const url = button.dataset.wordAudioButton;
        if (!url) return;

        stopPlayback();
        status.textContent = "";
        const attempt = { button };
        playing = attempt;
        if (player.getAttribute("src") !== url) player.src = url;
        showButtonState(button, "Stop audio", "■");

        try {
            await player.play();
        } catch {
            if (playing !== attempt) return;
            stopPlayback();
            showButtonState(button, "Retry audio", "!");
            status.textContent = "Audio could not be played. Try again.";
        }
    }

    function useRecordings(clips) {
        function clipFor(word) {
            const key = store.normalizeForKey(word).replace(/\s*\/\s*/g, " / ");
            return Object.hasOwn(clips, key) ? clips[key] : "";
        }

        function attachVocabularyControls() {
            const cards = document.querySelectorAll(
                "[data-word-audio-list] .number-line, [data-word-audio-list] figure[data-content-id]"
            );
            for (const card of cards) {
                if (card.querySelector("[data-word-audio-button]")) continue;
                const word = card.querySelector(":scope > .num-word") || card.querySelector(":scope > strong");
                const url = clipFor(word?.textContent);
                if (!url) continue;

                const control = template.content.cloneNode(true);
                const button = control.querySelector("[data-word-audio-button]");
                button.dataset.wordAudioButton = url;
                button.dataset.wordAudioLabel = word.textContent.trim();
                word.lang = "mt";
                showButtonState(button, "Play audio", "🔊");
                card.append(control);
            }
        }

        function syncReviewControl() {
            const card = window.MaltiReviewPronunciation?.();
            const id = card?.id || null;
            const url = clipFor(card?.maltese);
            if (reviewId !== id || !url) {
                stopPlayback();
                status.textContent = "";
                showButtonState(reviewButton, "Play audio", "🔊");
            }
            reviewId = id;
            reviewButton.dataset.wordAudioButton = url;
            reviewControls.hidden = !url;
        }

        if (template) {
            document.addEventListener("malti-vocab-rendered", attachVocabularyControls);
            attachVocabularyControls();
        }
        if (stage && reviewButton) {
            new MutationObserver(syncReviewControl).observe(stage, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ["hidden"]
            });
            syncReviewControl();
        }
    }

    document.addEventListener("click", (event) => {
        const button = event.target.closest?.("[data-word-audio-button]");
        if (button) togglePlayback(button);
    });
    player.addEventListener("ended", stopPlayback);

    fetch("./assets/data/word_pronunciation.json")
        .then((response) => {
            if (!response.ok) throw new Error("Could not load Maltese audio.");
            return response.json();
        })
        .then(({ clips }) => useRecordings(clips))
        .catch(() => { status.textContent = "Maltese audio is unavailable."; });
})();
