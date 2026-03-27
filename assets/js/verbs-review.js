(function () {
    var DRILL_SET = [
        {
            lemma: "għamel",
            translation: "to do / make",
            topic: "Verb Drill",
            sourcePage: "verbs_guide.html",
            forms: {
                present: {
                    jien: "nagħmel",
                    int: "tagħmel",
                    huwa: "jagħmel",
                    hija: "tagħmel",
                    aħna: "nagħmlu",
                    intom: "tagħmlu",
                    huma: "jagħmlu"
                },
                past: {
                    jien: "għamilt",
                    int: "għamilt",
                    huwa: "għamel",
                    hija: "għamlet",
                    aħna: "għamilna",
                    intom: "għamiltu",
                    huma: "għamlu"
                }
            }
        },
        {
            lemma: "kien",
            translation: "to be / was",
            topic: "Verb Drill",
            sourcePage: "verbs_guide.html",
            forms: {
                past: {
                    jien: "kont",
                    int: "kont",
                    huwa: "kien",
                    hija: "kienet",
                    aħna: "konna",
                    intom: "kontu",
                    huma: "kienu"
                }
            }
        },
        {
            lemma: "mar",
            translation: "to go",
            topic: "Verb Drill",
            sourcePage: "verbs_guide.html",
            forms: {
                present: {
                    jien: "immur",
                    int: "tmur",
                    huwa: "imur",
                    hija: "tmur",
                    aħna: "mmorru",
                    intom: "tmorru",
                    huma: "imorru"
                },
                past: {
                    jien: "mort",
                    int: "mort",
                    huwa: "mar",
                    hija: "marret",
                    aħna: "morna",
                    intom: "mortu",
                    huma: "marru"
                }
            }
        },
        {
            lemma: "ġie",
            translation: "to come",
            topic: "Verb Drill",
            sourcePage: "verbs_guide.html",
            forms: {
                present: {
                    jien: "niġi",
                    int: "tiġi",
                    huwa: "jiġi",
                    hija: "tiġi",
                    aħna: "niġu",
                    intom: "tiġu",
                    huma: "jiġu"
                },
                past: {
                    jien: "ġejt",
                    int: "ġejt",
                    huwa: "ġie",
                    hija: "ġiet",
                    aħna: "ġejna",
                    intom: "ġejtu",
                    huma: "ġew"
                }
            }
        },
        {
            lemma: "kiel",
            translation: "to eat",
            topic: "Verb Drill",
            sourcePage: "verbs_guide.html",
            forms: {
                present: {
                    jien: "niekol",
                    int: "tiekol",
                    huwa: "jiekol",
                    hija: "tiekol",
                    aħna: "nieklu",
                    intom: "tieklu",
                    huma: "jieklu"
                },
                past: {
                    jien: "kilt",
                    int: "kilt",
                    huwa: "kiel",
                    hija: "kielet",
                    aħna: "kilna",
                    intom: "kiltu",
                    huma: "kielu"
                }
            }
        }
    ];

    function syncButton(button, count) {
        button.textContent = count + " cards added";
        button.disabled = true;
        button.classList.add("is-added");
    }

    document.addEventListener("DOMContentLoaded", function () {
        if (!window.MaltiReviewStore) {
            return;
        }

        document.querySelectorAll("[data-verb-drill]").forEach(function (button) {
            button.addEventListener("click", function () {
                var lemma = button.getAttribute("data-verb-drill");
                var found = DRILL_SET.find(function (verb) {
                    return verb.lemma === lemma;
                });
                if (!found) {
                    return;
                }
                var saved = window.MaltiReviewStore.addVerbDrill(found);
                syncButton(button, saved.length);
            });
        });
    });
}());
