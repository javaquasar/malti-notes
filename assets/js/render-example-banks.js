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

    groups.forEach((group) => {
        const selector = `[${groupAttribute}="${group.id}"]`;
        const container = document.querySelector(selector);
        if (!container) {
            return;
        }

        container.innerHTML = "";
        container.classList.add("sentence-grid");

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
}

window.renderExampleBanksFromData = renderExampleBanksFromData;
