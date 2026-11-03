/* Pure B3 learning state. UI rendering and persistence belong to the caller. */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.MaltiB3PracticeCore = api;
}(typeof window !== 'undefined' ? window : globalThis, function () {
    'use strict';
    const DAY = 24 * 60 * 60 * 1000;
    const MODES = ['recognition', 'production'];
    const blockedKeys = new Set(['__proto__', 'prototype', 'constructor']);
    const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    const owns = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
    const validKey = value => typeof value === 'string' && value.trim() !== '' && !blockedKeys.has(value);
    const count = value => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    const time = value => {
        const parsed = value instanceof Date ? value.getTime() : typeof value === 'number' ? value : typeof value === 'string' ? Date.parse(value) : NaN;
        return Number.isFinite(parsed) && Number.isFinite(new Date(parsed).getTime()) ? parsed : null;
    };
    const nowTime = value => time(value) ?? Date.now();
    const iso = value => time(value) === null ? null : new Date(time(value)).toISOString();

    // Unknown JSON-compatible metadata is retained, but malformed mode records
    // are repaired before arithmetic. No function below mutates the input.
    function copy(value) {
        if (Array.isArray(value)) return value.map(copy);
        if (!object(value)) return value;
        return Object.fromEntries(Object.entries(value).filter(([key]) => !blockedKeys.has(key)).map(([key, child]) => [key, copy(child)]));
    }

    function cleanMode(raw) {
        const value = object(raw) ? raw : {};
        const attempts = count(value.attempts);
        const correct = Math.min(attempts, count(value.correct));
        const streak = Math.min(correct, count(value.streak));
        const lastAt = iso(value.lastAt);
        return {
            ...copy(value), attempts, correct, streak,
            lastAt,
            dueAt: attempts ? iso(value.dueAt) || lastAt : null,
            lastItemId: validKey(value.lastItemId) ? value.lastItemId : null,
            lastCorrect: attempts ? typeof value.lastCorrect === 'boolean' ? value.lastCorrect : streak > 0 : null,
            spacedSuccesses: Math.min(correct, count(value.spacedSuccesses)),
            lastSpacedSuccessAt: iso(value.lastSpacedSuccessAt)
        };
    }

    function createState(raw) {
        const value = object(raw) ? raw : {};
        const patterns = {};
        if (object(value.patterns)) Object.entries(value.patterns).forEach(([id, record]) => {
            if (!validKey(id) || !object(record)) return;
            patterns[id] = { ...copy(record), recognition: cleanMode(record.recognition), production: cleanMode(record.production) };
        });
        return { ...copy(value), schemaVersion: 1, patterns };
    }

    function recordResults(raw, results, now) {
        const state = createState(raw);
        const at = nowTime(now);
        const seen = new Set();
        (Array.isArray(results) ? results : []).forEach(result => {
            if (!object(result) || !validKey(result.patternId) || !validKey(result.itemId) || !MODES.includes(result.mode) || typeof result.correct !== 'boolean') return;
            const key = [result.patternId, result.mode, result.itemId].join('::');
            if (seen.has(key)) return;
            seen.add(key);
            const record = owns(state.patterns, result.patternId) ? state.patterns[result.patternId] : { recognition: cleanMode(), production: cleanMode() };
            const previous = record[result.mode];
            const effectiveAt = Math.max(at, time(previous.lastAt) || at);
            const correct = result.correct;
            const next = {
                ...previous,
                attempts: previous.attempts + 1,
                correct: previous.correct + (correct ? 1 : 0),
                streak: correct ? previous.streak + 1 : 0,
                lastCorrect: correct,
                lastAt: new Date(effectiveAt).toISOString(),
                lastItemId: result.itemId,
                spacedSuccesses: correct ? previous.spacedSuccesses : 0,
                lastSpacedSuccessAt: correct ? previous.lastSpacedSuccessAt : null
            };
            // Same-session retries do not advance the 1/3/7-day stages. A new
            // spaced success must be at least 24 hours after the last one.
            if (correct && (time(previous.lastSpacedSuccessAt) === null || effectiveAt - time(previous.lastSpacedSuccessAt) >= DAY)) {
                next.spacedSuccesses += 1;
                next.lastSpacedSuccessAt = next.lastAt;
            }
            const interval = correct ? [1, 3, 7][Math.min(2, Math.max(0, next.spacedSuccesses - 1))] : 1;
            next.dueAt = new Date(effectiveAt + interval * DAY).toISOString();
            record[result.mode] = next;
            state.patterns[result.patternId] = record;
        });
        return state;
    }

    function chaptersOf(bank) {
        return (Array.isArray(bank?.chapters) ? bank.chapters : []).filter(chapter => object(chapter) && validKey(chapter.id));
    }

    function patternsOf(chapter) {
        return (Array.isArray(chapter?.patterns) ? chapter.patterns : []).filter(pattern => object(pattern) && validKey(pattern.id));
    }

    function publishableItem(item) {
        return object(item) && validKey(item.id) && item.verificationStatus !== 'needs-review';
    }

    function modeItems(pattern, mode) {
        return (Array.isArray(pattern.variants) ? pattern.variants : []).filter(item => publishableItem(item) && item.assessmentMode === mode);
    }

    function weak(mode) {
        return mode.attempts > 0 && (mode.lastCorrect === false || mode.correct / mode.attempts < 0.7);
    }

    function due(mode, now) {
        return mode.attempts > 0 && (time(mode.dueAt) === null || time(mode.dueAt) <= now);
    }

    function priority(mode, now) {
        if (due(mode, now)) return 0;
        if (weak(mode)) return 1;
        if (!mode.attempts) return 2;
        return 3;
    }

    function variantFor(pattern, mode, record) {
        const items = modeItems(pattern, mode);
        if (!items.length) return null;
        let index = record.attempts % items.length;
        if (items.length > 1 && items[index].id === record.lastItemId) index = (index + 1) % items.length;
        return items[index];
    }

    function candidates(bank, state, now, chapterId, includeScheduled) {
        const entries = [];
        chaptersOf(bank).forEach((chapter, chapterIndex) => {
            if (chapterId && chapter.id !== chapterId) return;
            patternsOf(chapter).forEach((pattern, patternIndex) => {
                MODES.forEach((mode, modeIndex) => {
                    const record = owns(state.patterns, pattern.id) ? state.patterns[pattern.id][mode] : cleanMode();
                    const rank = priority(record, now);
                    const item = variantFor(pattern, mode, record);
                    if (!item || (!includeScheduled && rank === 3)) return;
                    entries.push({ chapter, pattern, mode, record, rank, item, chapterIndex, patternIndex, modeIndex });
                });
            });
        });
        return entries;
    }

    function select(entries, limit) {
        const remaining = entries.slice();
        const selected = [], usedIds = new Set(), chapterCounts = Object.create(null), patternCounts = Object.create(null), modeCounts = Object.create(null);
        while (remaining.length && selected.length < limit) {
            remaining.sort((a, b) => a.rank - b.rank
                || (chapterCounts[a.chapter.id] || 0) - (chapterCounts[b.chapter.id] || 0)
                || (patternCounts[a.pattern.id] || 0) - (patternCounts[b.pattern.id] || 0)
                || (modeCounts[a.mode] || 0) - (modeCounts[b.mode] || 0)
                || a.record.attempts - b.record.attempts
                || a.chapterIndex - b.chapterIndex
                || a.patternIndex - b.patternIndex
                || a.modeIndex - b.modeIndex);
            const entry = remaining.shift();
            if (usedIds.has(entry.item.id)) continue;
            usedIds.add(entry.item.id);
            selected.push(entry);
            chapterCounts[entry.chapter.id] = (chapterCounts[entry.chapter.id] || 0) + 1;
            patternCounts[entry.pattern.id] = (patternCounts[entry.pattern.id] || 0) + 1;
            modeCounts[entry.mode] = (modeCounts[entry.mode] || 0) + 1;
        }
        return selected;
    }

    const requestedLimit = (limit, fallback) => Number.isFinite(limit) ? Math.max(0, Math.min(30, Math.floor(limit))) : fallback;
    const withContext = entry => ({ ...copy(entry.item), chapterId: entry.chapter.id, patternId: entry.pattern.id, assessmentMode: entry.mode });

    function chooseChapterItems(bank, chapterId, raw, options) {
        const opts = object(options) ? options : {};
        const state = createState(raw);
        return select(candidates(bank, state, nowTime(opts.now), chapterId, true), requestedLimit(opts.limit, 6)).map(withContext);
    }

    function buildDailyPlan(bank, raw, options) {
        const opts = object(options) ? options : {};
        const state = createState(raw), at = nowTime(opts.now);
        const selected = select(candidates(bank, state, at, null, false), requestedLimit(opts.limit, 8));
        const summary = summarize(bank, state, at);
        return {
            items: selected.map(withContext),
            reasons: selected.map(entry => ({
                itemId: entry.item.id,
                patternId: entry.pattern.id,
                chapterId: entry.chapter.id,
                mode: entry.mode,
                reason: ['due', 'weak', 'new'][entry.rank],
                label: `${entry.pattern.title || entry.pattern.id}: ${['review due', 'recent mistakes', 'not yet practised'][entry.rank]} (${entry.mode})`
            })),
            weakPatternIds: summary.weakPatternIds,
            duePatternIds: summary.duePatternIds,
            nextDueAt: summary.nextDueAt,
            estimatedMinutes: selected.length ? Math.max(1, Math.ceil(selected.length * 0.8)) : 0
        };
    }

    function summarize(bank, raw, now) {
        const state = createState(raw), at = nowTime(now);
        const allRecords = [], weakIds = new Set(), dueIds = new Set();
        const stats = records => {
            const attempts = records.reduce((sum, record) => sum + record.attempts, 0);
            const correct = records.reduce((sum, record) => sum + record.correct, 0);
            return {
                attempts, correct, accuracy: attempts ? Math.round(correct / attempts * 100) : null,
                practised: records.filter(record => record.attempts > 0).length,
                secure: records.filter(record => record.spacedSuccesses >= 2 && record.lastCorrect !== false).length,
                due: records.filter(record => due(record, at)).length,
                weak: records.filter(weak).length
            };
        };
        const chapters = chaptersOf(bank).map(chapter => {
            const patterns = patternsOf(chapter);
            const records = patterns.map(pattern => {
                const record = owns(state.patterns, pattern.id) ? state.patterns[pattern.id] : { recognition: cleanMode(), production: cleanMode() };
                allRecords.push(record);
                if (MODES.some(mode => weak(record[mode]))) weakIds.add(pattern.id);
                if (MODES.some(mode => due(record[mode], at))) dueIds.add(pattern.id);
                return { id: pattern.id, ...record };
            });
            const recognition = stats(records.map(record => record.recognition));
            const production = stats(records.map(record => record.production));
            const chapterWeak = records.filter(record => MODES.some(mode => weak(record[mode]))).map(record => record.id);
            const chapterDue = records.filter(record => MODES.some(mode => due(record[mode], at))).map(record => record.id);
            const nextAction = chapterDue.length ? `${chapterDue.length} patterns due for review.`
                : chapterWeak.length ? `Revisit ${chapterWeak.length} patterns with recent mistakes.`
                : production.practised < patterns.length ? `Practise writing ${patterns.length - production.practised} patterns.`
                : 'Next review scheduled; try a new example when ready.';
            return { id: chapter.id, title: chapter.title || chapter.id, total: patterns.length, recognition, production, weakPatternIds: chapterWeak, duePatternIds: chapterDue, nextAction };
        });
        const futureDates = allRecords.flatMap(record => MODES.map(mode => time(record[mode].dueAt))).filter(value => value !== null);
        return {
            totalPatterns: chapters.reduce((sum, chapter) => sum + chapter.total, 0),
            recognition: stats(allRecords.map(record => record.recognition)),
            production: stats(allRecords.map(record => record.production)),
            weakPatternIds: [...weakIds], duePatternIds: [...dueIds],
            nextDueAt: futureDates.length ? new Date(Math.min(...futureDates)).toISOString() : null,
            chapters
        };
    }

    function recoveryFor(bank, patternId, failedItemId) {
        for (const chapter of chaptersOf(bank)) {
            const pattern = patternsOf(chapter).find(item => item.id === patternId);
            if (!pattern) continue;
            const alternatives = [pattern.transfer, ...(Array.isArray(pattern.variants) ? pattern.variants : [])]
                .filter(item => publishableItem(item) && item.id !== failedItemId);
            const transfer = alternatives.find(item => item.assessmentMode === 'production') || alternatives[0] || null;
            return {
                patternId, chapterId: chapter.id, title: pattern.title || pattern.id,
                explanation: pattern.explanation || '', contrast: copy(pattern.contrast || null), model: copy(pattern.model || null),
                transfer: transfer ? { ...copy(transfer), patternId, chapterId: chapter.id } : null
            };
        }
        return null;
    }

    return Object.freeze({ createState, recordResults, chooseChapterItems, buildDailyPlan, summarize, recoveryFor });
}));
