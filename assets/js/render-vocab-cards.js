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
            var isTransportImage = item.image.indexOf("/transport/") !== -1;
            var isSquareImage = item.image.indexOf("favicon-option-speech.svg") !== -1;
            img.src = item.image;
            if (/\/(openmoji|game-icons)\//.test(item.image)) {
                img.className = 'vocab-image--cutout';
            }
            img.alt = item.imageAlt || item.english || item.maltese;
            img.loading = "lazy";
            img.decoding = "async";
            img.setAttribute("fetchpriority", "low");
            img.width = isSquareImage ? 64 : (isTransportImage ? 220 : 160);
            img.height = isSquareImage ? 64 : (isTransportImage ? 120 : 110);
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
        figure.dataset.contentId = item.id || item.slug || "";
        if (options.groupId) {
            figure.dataset.contentGroup = options.groupId;
        }

        var lead = createVisualLead(item, options || {});
        if (lead) {
            figure.classList.add("vocab-card--has-visual");
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
                if (reviewButton.classList.contains("review-add-button--icon")) {
                    figure.classList.add("vocab-card--review-toggle");
                }
                figure.appendChild(reviewButton);
            }
        }

        return figure;
    }

    function renderFigureGroup(container, group, options) {
        container.innerHTML = "";
        (group.items || []).forEach(function (item) {
            container.appendChild(createFigureCard(item, Object.assign({}, options || {}, { groupId: group.id })));
        });
    }

    function addImageCredits(items) {
        var main = document.querySelector('main');
        if (!main) return;
        var credits = document.getElementById('vocabulary-image-credits');
        if (!credits) {
            credits = document.createElement('footer');
            credits.id = 'vocabulary-image-credits';
            credits.className = 'vocabulary-image-credits';
            main.appendChild(credits);
        }
        var sources = [
            { path: '/openmoji/', name: 'OpenMoji', author: 'HfG Schwabisch Gmund and contributors', url: 'https://openmoji.org/', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
            { path: '/game-icons/', name: 'Game-icons.net', author: 'Delapouite and Caro Asercion', url: 'https://game-icons.net/', license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/' }
        ];
        sources.forEach(function (source) {
            if (credits.querySelector('[data-source="' + source.name + '"]') || !items.some(function (item) { return (item.image || '').includes(source.path); })) return;
            var line = document.createElement('p');
            line.dataset.source = source.name;
            var link = document.createElement('a');
            link.href = source.url;
            link.textContent = source.name;
            var license = document.createElement('a');
            license.href = source.licenseUrl;
            license.textContent = source.license;
            line.append('Illustrations: ', link, ' by ' + source.author + ' (', license, '). Originals, unmodified.');
            credits.appendChild(line);
        });
        credits.hidden = !credits.children.length;
    }

    window.MaltiVocabRenderer = {
        addImageCredits: addImageCredits,
        createFigureCard: createFigureCard,
        renderFigureGroup: renderFigureGroup
    };
}());
