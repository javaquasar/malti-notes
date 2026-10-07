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
    const api = { normalize, check, progress };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.MaltiLessonPracticeCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
