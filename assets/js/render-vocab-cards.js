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
            if (/\/(openmoji|game-icons|mdi|cc0)\//.test(item.image)) {
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
        span.className = 'vocab-english';
        span.textContent = item.english;
        figure.appendChild(span);

        createNotes(figure, getItemNotes(item));
        if (item.example && item.exampleTranslation) {
            var example = document.createElement('div');
            example.className = 'vocab-example';
            var sentence = document.createElement('p');
            sentence.lang = 'mt';
            sentence.textContent = item.example;
            var translation = document.createElement('p');
            translation.className = 'vocab-english';
            translation.lang = 'en';
            translation.textContent = item.exampleTranslation;
            example.append(sentence, translation);
            figure.appendChild(example);
        }

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
        addStudyControls(container);
        container.innerHTML = "";
        (group.items || []).forEach(function (item) {
            container.appendChild(createFigureCard(item, Object.assign({}, options || {}, { groupId: group.id })));
        });
    }

    function addStudyControls(container, imagesOnly) {
        if (container.dataset.studyControls) return;
        container.dataset.studyControls = 'true';
        var key = 'vocab-study::' + location.pathname + '::' + (container.id || Object.values(container.dataset).join('-'));
        var storage = window.MaltiStorage;
        var saved = storage ? storage.getJson(key, {}) : {};
        var controls = document.createElement('div');
        controls.className = 'vocab-study-controls';
        (imagesOnly ? ['Images'] : ['Images', 'English']).forEach(function (label) {
            var setting = label.toLowerCase();
            var wrapper = document.createElement('label');
            var input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = saved[setting] !== false;
            function apply() {
                container.classList.toggle('vocab-hide-' + setting, !input.checked);
                saved[setting] = input.checked;
                if (storage) storage.setJson(key, saved);
            }
            apply();
            input.addEventListener('change', apply);
            wrapper.append(input, ' ' + label);
            controls.appendChild(wrapper);
        });
        container.before(controls);
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
            { path: '/game-icons/', name: 'Game-icons.net', author: 'Delapouite and Caro Asercion', url: 'https://game-icons.net/', license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/' },
            { path: '/mdi/', name: 'Pictogrammers', author: 'Google, Simran and GreenTurtwig', url: 'https://pictogrammers.com/library/mdi/', license: 'Apache 2.0', licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0' },
            { path: '/cc0/', name: 'Openclipart and SVG Repo', author: 'cactus cowboy, Juhele / publicdomainq.net and SVG Repo uploaders', url: './docs/vocabulary-images/cc0-assets.json', license: 'CC0 1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' }
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
        addStudyControls: addStudyControls,
        createFigureCard: createFigureCard,
        renderFigureGroup: renderFigureGroup
    };
}());
