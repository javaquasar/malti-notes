(function () {
    function createNotes(container, notes) {
        (notes || []).forEach(function (note) {
            var small = document.createElement("small");
            small.textContent = note;
            container.appendChild(small);
        });
    }

    function createFigureCard(item, options) {
        var figure = document.createElement("figure");
        figure.className = options.cardClass || "visual-vocab-card";

        var img = document.createElement("img");
        img.src = item.image;
        img.alt = item.imageAlt || item.english || item.maltese;
        figure.appendChild(img);

        var strong = document.createElement("strong");
        strong.textContent = item.maltese;
        figure.appendChild(strong);

        var span = document.createElement("span");
        span.textContent = item.english;
        figure.appendChild(span);

        createNotes(figure, item.notes);

        if (typeof options.reviewButtonFactory === "function") {
            var reviewButton = options.reviewButtonFactory(item);
            if (reviewButton) {
                figure.appendChild(reviewButton);
            }
        }

        return figure;
    }

    function renderFigureGroup(container, group, options) {
        container.innerHTML = "";
        (group.items || []).forEach(function (item) {
            container.appendChild(createFigureCard(item, options || {}));
        });
    }

    window.MaltiVocabRenderer = {
        createFigureCard: createFigureCard,
        renderFigureGroup: renderFigureGroup
    };
}());
