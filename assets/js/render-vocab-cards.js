(function () {
    function getItemNotes(item) {
        if (Array.isArray(item.notes)) {
            return item.notes;
        }

        if (typeof item.note === "string" && item.note.trim()) {
            return [item.note.trim()];
        }

        return [];
    }

    function createNotes(container, notes) {
        (notes || []).forEach(function (note) {
            var small = document.createElement("small");
            small.textContent = note;
            container.appendChild(small);
        });
    }

    function createVisualLead(item, options) {
        if (item.image) {
            var img = document.createElement("img");
            img.src = item.image;
            img.alt = item.imageAlt || item.english || item.maltese;
            return img;
        }

        if (item.swatchStyle) {
            var swatch = document.createElement("div");
            swatch.className = options.swatchClass || "color-swatch";
            swatch.setAttribute("style", item.swatchStyle);
            swatch.setAttribute("aria-hidden", "true");
            return swatch;
        }

        return null;
    }

    function createFigureCard(item, options) {
        var figure = document.createElement("figure");
        figure.className = options.cardClass || "visual-vocab-card";

        var lead = createVisualLead(item, options || {});
        if (lead) {
            figure.appendChild(lead);
        }

        var strong = document.createElement("strong");
        strong.textContent = item.maltese;
        figure.appendChild(strong);

        var span = document.createElement("span");
        span.textContent = item.english;
        figure.appendChild(span);

        createNotes(figure, getItemNotes(item));

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
