(async () => {
    const dataUrl = document.currentScript.dataset.lesson01Src;
    if (!document.querySelector("[data-lesson01-group]")) return;
    const page = window.location.pathname.split("/").pop();
    const stem = page.replace(/\.html$/, "");
    try {
        await window.renderExampleBanksFromData({
            dataUrl,
            groupAttribute: "data-lesson01-group",
            cardClass: "study-card",
            sourcePage: page,
            defaultTopic: "MQF 2 Lesson 01",
            reviewPrefix: "lesson01-" + stem,
            numbered: false
        });
        window.dispatchEvent(new CustomEvent("malti-lesson01-ready"));
    } catch (error) {
        console.error("Could not load Lesson 01 examples.", error);
        document.querySelectorAll("[data-lesson01-group]").forEach((region) => {
            region.textContent = "Examples could not be loaded. Please reload the page.";
            region.setAttribute("role", "alert");
        });
    }
})();
