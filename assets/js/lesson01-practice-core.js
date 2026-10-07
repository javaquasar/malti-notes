(function (root) {
    const normalize = (value) => String(value || '').normalize('NFC').toLowerCase()
        .replace(/[\u2018\u2019`]/g, "'").replace(/[.!?,:;]/g, '').replace(/\s+/g, ' ').trim();
    const letters = (value) => normalize(value).replace(/\u0127/g, 'h').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    function check(value, answers) {
        const exact = answers.some((answer) => normalize(value) === normalize(answer));
        const correct = exact || answers.some((answer) => letters(value) === letters(answer));
        return { correct, spelling: correct && !exact };
    }
    function progress(items, skill) {
        const entries = Object.values(items || {}).filter((item) => item.skill === skill);
        return { independent: entries.filter((item) => item.independent).length,
            assisted: entries.filter((item) => item.assisted && !item.independent).length,
            needsPractice: entries.filter((item) => !item.correct).length };
    }
    function distance(a, b) {
        a = a.slice(0, 500); b = b.slice(0, 500);
        let row = Array.from({ length: b.length + 1 }, (_, i) => i);
        for (let i = 0; i < a.length; i++) {
            const next = [i + 1];
            for (let j = 0; j < b.length; j++) next.push(Math.min(next[j] + 1, row[j + 1] + 1, row[j] + (a[i] === b[j] ? 0 : 1)));
            row = next;
        }
        return row[b.length];
    }
    function analyze(value, answers) {
        const result = check(value, answers);
        const target = answers.slice().sort((a, b) => distance(normalize(value), normalize(a)) - distance(normalize(value), normalize(b)))[0];
        if (!target) return { ...result, category: 'wording', message: 'No model answer available.', fragment: '' };
        if (result.correct && !result.spelling) return { ...result, category: 'correct', message: 'Correct.', fragment: '', target };
        const givenWords = normalize(value).split(' '), targetWords = normalize(target).split(' ');
        let start = 0, end = targetWords.length, givenEnd = givenWords.length;
        while (start < end && start < givenEnd && targetWords[start] === givenWords[start]) start++;
        while (end > start && givenEnd > start && targetWords[end - 1] === givenWords[givenEnd - 1]) { end--; givenEnd--; }
        const fragment = targetWords.slice(start, end).join(' ') || normalize(target);
        const actual = givenWords.slice(start, givenEnd).join(' ') || '(missing)';
        let category = 'wording', message = `Compare this part: ${actual} → ${fragment}.`;
        if (result.spelling) { category = 'spelling'; message = `Check the Maltese letters: ${actual} → ${fragment}.`; }
        else if (targetWords.some((word) => /^(il-|it-|ir-|is-|ix-|iż-|id-|in-|l-)/.test(word) && givenWords.includes(word.replace(/^[^-]+-/, '')))) {
            category = 'article'; message = `Keep the article attached to the noun: ${fragment}.`;
        } else {
            const pairs = [['tajjeb', 'tajba'], ['għandu', 'għandha'], ['jismu', 'jisimha'], ['għalliem', 'għalliema'], ['naħdem', 'taħdem'], ['nħobb', 'tħobb'], ['inħobb', 'tħobb'], ['nifhimx', 'nifhem']];
            if (pairs.some(([a, b]) => (givenWords.includes(a) && targetWords.includes(b)) || (givenWords.includes(b) && targetWords.includes(a)))) {
                category = 'form'; message = `Check the person or gender of this form: ${actual} → ${fragment}.`;
            }
        }
        return { ...result, category, message, fragment, target };
    }
    function shuffle(items, random = Math.random) {
        const result = items.slice();
        for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
        return result;
    }
    function mixed(phrases, random = Math.random) {
        const skills = [...new Set(phrases.map((p) => p.skill))];
        return shuffle(skills.flatMap((skill) => shuffle(phrases.filter((p) => p.skill === skill), random).slice(0, 2)), random);
    }
    function weakest(items, skills) {
        return skills.slice().sort((a, b) => {
            const pa = progress(items, a), pb = progress(items, b);
            return pb.needsPractice - pa.needsPractice || pa.independent - pb.independent || skills.indexOf(a) - skills.indexOf(b);
        })[0];
    }
    const api = { normalize, check, analyze, progress, shuffle, mixed, weakest };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.MaltiLessonPracticeCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
