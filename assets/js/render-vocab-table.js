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

    function createCell(tagName, text, className) {
        var cell = document.createElement(tagName);
        if (className) {
            cell.className = className;
        }
        cell.textContent = text || "";
        return cell;
    }

    function createMalteseCell(text) {
        var cell = document.createElement("th");
        cell.className = "vocab-table-maltese";

        var code = document.createElement("code");
        code.textContent = text || "";
        cell.appendChild(code);

        return cell;
    }

    function createNoteCell(item) {
        var cell = document.createElement("td");
        var notes = getItemNotes(item);

        if (notes.length === 0) {
            cell.textContent = "";
            return cell;
        }

        if (notes.length === 1) {
            var singleCode = document.createElement("code");
            singleCode.textContent = notes[0];
            cell.appendChild(singleCode);
            return cell;
        }

        var list = document.createElement("ul");
        list.className = "vocab-table-notes";
        notes.forEach(function (note) {
            var listItem = document.createElement("li");
            var code = document.createElement("code");
            code.textContent = note;
            listItem.appendChild(code);
            list.appendChild(listItem);
        });
        cell.appendChild(list);
        return cell;
    }

    function hasExampleTranslations(group) {
        return (group.items || []).some(function (item) {
            return Boolean(item.example || item.exampleTranslation);
        });
    }

    function createExampleCell(item) {
        var cell = document.createElement("td");
        var value = item.example || item.note || "";

        if (!value) {
            cell.textContent = "";
            return cell;
        }

        var code = document.createElement("code");
        code.textContent = value;
        cell.appendChild(code);
        return cell;
    }

    function createExampleTranslationCell(item) {
        return createCell("td", item.exampleTranslation || "");
    }

    function renderTableGroup(container, group) {
        var table = document.createElement("table");
        table.className = "table-soft vocab-data-table";
        var richExamples = hasExampleTranslations(group);

        var thead = document.createElement("thead");
        var headRow = document.createElement("tr");
        headRow.appendChild(createCell("th", "Maltese"));
        headRow.appendChild(createCell("th", "English"));
        if (richExamples) {
            headRow.appendChild(createCell("th", "Example"));
            headRow.appendChild(createCell("th", "Example Translation"));
        } else {
            headRow.appendChild(createCell("th", "Example / Note"));
        }
        thead.appendChild(headRow);
        table.appendChild(thead);

        var tbody = document.createElement("tbody");
        (group.items || []).forEach(function (item) {
            var row = document.createElement("tr");
            row.appendChild(createMalteseCell(item.maltese));
            row.appendChild(createCell("td", item.english));
            if (richExamples) {
                row.appendChild(createExampleCell(item));
                row.appendChild(createExampleTranslationCell(item));
            } else {
                row.appendChild(createNoteCell(item));
            }
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        container.innerHTML = "";
        container.appendChild(table);
    }

    window.MaltiVocabTableRenderer = {
        renderTableGroup: renderTableGroup
    };
}());
