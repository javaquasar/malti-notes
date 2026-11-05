/* Pure planning and resumable short-session state. Persistence and UI stay with the caller. */
(function (root, factory) {
    const dependency = typeof module === 'object' && module.exports ? require('./b3-practice-core') : root.MaltiB3PracticeCore;
    const api = factory(dependency);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.MaltiStudySessionCore = api;
}(typeof window !== 'undefined' ? window : globalThis, function (b3Core) {
    'use strict';
    const MODES = ['recognition', 'production'];
    const TYPES = ['multiple-choice', 'true-false', 'fill-blank', 'order-words', 'matching'];
    const blocked = new Set(['__proto__', 'prototype', 'constructor']);
    const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    const owns = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
    const key = value => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(value) && !blocked.has(value);
    const text = value => typeof value === 'string' ? value : '';
    const count = value => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    const array = value => Array.isArray(value) ? value : [];
    const copy = value => Array.isArray(value) ? value.map(copy) : object(value)
        ? Object.fromEntries(Object.entries(value).filter(([name]) => !blocked.has(name)).map(([name, child]) => [name, copy(child)])) : value;
    const timestamp = value => {
        const at = value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value || '');
        return Number.isFinite(at) && Number.isFinite(new Date(at).getTime()) ? at : null;
    };
    const now = value => timestamp(value) ?? Date.now();
    const iso = value => new Date(now(value)).toISOString();
    const limit = value => Number.isFinite(value) ? Math.min(6, count(value)) : 6;
    const publishable = item => object(item) && key(item.id) && item.verificationStatus !== 'needs-review'
        && TYPES.includes(item.type) && MODES.includes(item.assessmentMode) && !!text(item.prompt).trim();
    const queueKey = entry => [entry.routeId, entry.chapterId, entry.skillId || entry.itemId, entry.mode].join('::');

    function cleanQueue(raw) {
        const seen = new Set();
        return array(raw).filter(entry => object(entry) && key(entry.routeId) && key(entry.chapterId) && key(entry.itemId)
            && MODES.includes(entry.mode)).filter(entry => {
            const id = queueKey(entry);
            if (seen.has(id)) return false;
            seen.add(id); return true;
        }).map(copy);
    }

    function helpFor(item, supplement, target) {
        const card = item.reviewCard || {};
        const source = supplement || {};
        return {
            explanation: text(item.explanation),
            model: { maltese: text(source.example || card.example || source.maltese || card.maltese),
                english: text(source.exampleTranslation || card.exampleTranslation || source.english || card.english) },
            sourcePage: text(item.sourcePage || target?.contentRef?.page || 'course_chapter.html')
        };
    }

    function selectCourse(entries, progress, pending, at, size) {
        const queued = new Set(cleanQueue(pending).map(queueKey));
        const used = new Set(), skillCounts = new Map(), selected = [];
        const rank = entry => {
            const records = array(entry.item.targetIds).map(id => progress[id] || {});
            if (queued.has(queueKey({ ...entry, itemId: entry.item.id }))) return -1;
            if (records.some(record => record.state === 'review' || (record.dueAt && (timestamp(record.dueAt) === null || timestamp(record.dueAt) <= at)))) return 0;
            if (records.some(record => !count(record.modeStats?.[entry.mode]?.attempts))) return 1;
            if (records.some(record => record.state !== 'mastered')) return 2;
            return 3;
        };
        for (let index = 0; index < size; index += 1) {
            const mode = MODES[index % 2];
            const remaining = entries.filter(entry => !used.has(entry.item.id));
            const preferred = remaining.filter(entry => entry.mode === mode);
            const candidates = preferred.length ? preferred : remaining;
            candidates.sort((a, b) => rank(a) - rank(b)
                || (skillCounts.get(a.skillId) || 0) - (skillCounts.get(b.skillId) || 0)
                || count(progress[a.skillId]?.modeStats?.[a.mode]?.attempts) - count(progress[b.skillId]?.modeStats?.[b.mode]?.attempts)
                || a.order - b.order);
            const entry = candidates[0];
            if (!entry) break;
            used.add(entry.item.id); skillCounts.set(entry.skillId, (skillCounts.get(entry.skillId) || 0) + 1);
            selected.push(copy(entry));
        }
        return selected;
    }

    function planCourse(payload, options) {
        const data = object(payload) ? payload : {}, opts = object(options) ? options : {};
        const course = data.course || {}, routeId = text(opts.levelId || 'b1').toLowerCase();
        const level = array(course.levels).find(item => item.id === routeId);
        const sets = array(Array.isArray(data.assessments) ? data.assessments : data.assessments?.sets);
        const chapters = array(level?.chapters);
        const chapter = chapters.find(item => item.id === opts.chapterId) || (!opts.chapterId ? chapters.find(item => sets.some(set => set.chapterId === item.id)) : null);
        const chapterId = text(chapter?.id || opts.chapterId);
        if (!['b1', 'b2'].includes(routeId) || !chapter) return { routeId, chapterId, title: chapterId, entries: [], catalog: [] };
        const supplements = Array.isArray(data.supplements) ? data.supplements
            : array(data.supplements?.chapters).flatMap(group => array(group.items));
        const targets = new Map(array(data.targets).map(item => [item.id, item]));
        const seen = new Set(), catalog = [];
        sets.filter(set => set.kind === 'checkpoint' && set.chapterId === chapterId && set.verificationStatus !== 'needs-review').forEach(set => {
            array(set.items).forEach(item => {
                // Matching aggregates several chapter targets; the child route keeps one focused task per step.
                if (!publishable(item) || item.type === 'matching' || seen.has(item.id) || !array(item.targetIds).length) return;
                seen.add(item.id);
                const target = targets.get(item.targetIds[0]);
                const supplement = supplements.find(value => item.targetIds.includes(value.id));
                catalog.push({ item: copy(item), canonicalItem: copy(item), routeId, chapterId,
                    chapterTitle: text(chapter?.title || chapterId), originSetId: set.id,
                    skillId: item.targetIds[0], mode: item.assessmentMode,
                    help: helpFor(item, supplement, target), order: catalog.length });
            });
        });
        const entries = ['b1', 'b2'].includes(routeId) && chapter
            ? selectCourse(catalog, object(opts.targetProgress) ? opts.targetProgress : {}, opts.helpQueue, now(opts.now), limit(opts.limit)) : [];
        return { routeId, chapterId, title: text(chapter?.title || chapterId), entries, catalog: copy(catalog) };
    }

    function planB3(bank, raw, options) {
        if (!b3Core) throw new Error('The B3 practice core must be loaded before planning B3 study.');
        const opts = object(options) ? options : {}, routeId = 'b3', catalog = [];
        array(bank?.chapters).forEach(chapter => array(chapter.patterns).forEach(pattern => {
            if (chapter.verificationStatus === 'needs-review' || pattern.verificationStatus === 'needs-review') return;
            [...array(pattern.variants), pattern.transfer].filter(publishable).forEach(item => {
                if (catalog.some(entry => entry.item.id === item.id)) return;
                const canonical = { ...copy(item), chapterId: chapter.id, patternId: pattern.id };
                catalog.push({ item: canonical, canonicalItem: copy(canonical), routeId, chapterId: chapter.id,
                    chapterTitle: text(chapter.title), originSetId: 'b3-pattern-' + pattern.id,
                    skillId: pattern.id, mode: item.assessmentMode,
                    help: { explanation: text(pattern.explanation), model: copy(pattern.model || { maltese: '', english: '' }),
                        contrast: copy(pattern.contrast || null), sourcePage: 'b3_revision.html#' + chapter.id }, order: catalog.length });
            });
        }));
        const planned = opts.chapterId
            ? b3Core.chooseChapterItems(bank, opts.chapterId, raw, { now: opts.now, limit: 30 })
            : b3Core.buildDailyPlan(bank, raw, { now: opts.now, limit: 30 }).items;
        const queued = cleanQueue(opts.helpQueue).filter(entry => entry.routeId === routeId && (!opts.chapterId || entry.chapterId === opts.chapterId));
        const fresh = queued.flatMap(entry => {
            const recovery = b3Core.recoveryFor(bank, entry.skillId, entry.itemId);
            const transfer = recovery?.transfer && catalog.find(value => value.item.id === recovery.transfer.id && value.mode === entry.mode);
            const found = transfer || catalog.find(value => value.skillId === entry.skillId && value.mode === entry.mode && value.item.id !== entry.itemId);
            return found ? [found] : [];
        });
        const selected = [...fresh, ...planned.map(item => catalog.find(entry => entry.item.id === item.id)).filter(Boolean)];
        const used = new Set();
        const entries = selected.filter(entry => { if (used.has(entry.item.id)) return false; used.add(entry.item.id); return true; }).slice(0, limit(opts.limit)).map(copy);
        const chapterId = text(opts.chapterId || entries[0]?.chapterId);
        return { routeId, chapterId, title: text(array(bank?.chapters).find(chapter => chapter.id === chapterId)?.title || 'B3 practice'), entries, catalog: copy(catalog) };
    }

    function createSession(plan, options) {
        const opts = object(options) ? options : {}, entries = array(plan?.entries).filter(entry => publishable(entry.item)).slice(0, 6).map(copy);
        const createdAt = iso(opts.now), id = key(opts.id) ? opts.id : 's' + now(opts.now).toString(36);
        return { schemaVersion: 1, id, routeId: text(plan?.routeId), chapterId: text(plan?.chapterId), title: text(plan?.title),
            entries, index: 0, drafts: {}, results: {}, hints: {}, helpQueue: cleanQueue(opts.helpQueue),
            createdAt, completedAt: entries.length ? null : createdAt };
    }

    function lookup(catalog, id) {
        if (catalog instanceof Map) return catalog.get(id);
        if (Array.isArray(catalog)) return catalog.find(entry => (entry.item?.id || entry.id) === id);
        return object(catalog) && owns(catalog, id) ? catalog[id] : null;
    }

    function resumeSession(raw, itemsById) {
        if (!object(raw) || raw.schemaVersion !== 1 || !key(raw.id) || !['b1', 'b2', 'b3'].includes(raw.routeId)
            || !Array.isArray(raw.entries) || !raw.entries.length || raw.entries.length > 6) return null;
        const seen = new Set(), entries = [];
        for (const saved of raw.entries) {
            const id = saved?.item?.id;
            const current = lookup(itemsById, id);
            if (!key(id) || seen.has(id) || !current || !publishable(current.item) || current.routeId !== raw.routeId
                || current.chapterId !== saved.chapterId) return null;
            seen.add(id); entries.push({ ...copy(current), canonicalItem: copy(current.item) });
        }
        const session = { ...copy(raw), entries, index: Math.min(entries.length, count(raw.index)),
            drafts: object(raw.drafts) ? copy(raw.drafts) : {}, results: object(raw.results) ? copy(raw.results) : {},
            hints: object(raw.hints) ? copy(raw.hints) : {}, helpQueue: cleanQueue(raw.helpQueue) };
        // A persisted index cannot silently skip unsubmitted work.
        for (let index = 0; index < session.index; index += 1) {
            const result = session.results[entries[index].item.id];
            if (!result || (result.checked !== true && result.deferred !== true)) return null;
        }
        session.completedAt = session.index === entries.length ? text(raw.completedAt) || iso() : null;
        return session;
    }

    const currentEntry = session => array(session?.entries)[count(session?.index)] || null;
    const currentId = session => currentEntry(session)?.item.id;
    function updateDraft(session, itemId, answer) {
        const next = copy(session);
        if (itemId !== currentId(next) || next.results[itemId]?.checked || next.results[itemId]?.deferred) return next;
        if (typeof answer === 'string' || typeof answer === 'boolean' || typeof answer === 'number'
            || (Array.isArray(answer) && answer.every(value => typeof value === 'string'))) next.drafts[itemId] = copy(answer);
        return next;
    }

    function useHint(session) {
        const next = copy(session), id = currentId(next);
        if (id && !next.results[id]?.deferred) next.hints[id] = true;
        return next;
    }

    function beginRetry(session) {
        const next = copy(session), id = currentId(next), old = id && next.results[id];
        if (!old?.checked) return next;
        next.hints[id] = true;
        next.results[id] = { ...old, checked: false, correct: null, assisted: true, deferred: false };
        return next;
    }

    function stepSet(session) {
        const entry = currentEntry(session);
        if (!entry) return null;
        const assisted = session.hints[entry.item.id] === true;
        const item = copy(entry.canonicalItem || entry.item);
        // The runner's review-card ID contains its set ID. A short-session set
        // must not create a new saved card for every session or mark a checkpoint passed.
        delete item.reviewCard;
        if (assisted) { item.targetIds = []; item.coverageIds = []; }
        return { id: 'study-item-' + entry.routeId + '-' + item.id + (assisted ? '-helped' : ''),
            title: 'Practice ' + (session.index + 1) + ' of ' + session.entries.length, passPercent: 100, items: [item] };
    }

    function queueHelp(session, entry, reason, at) {
        const pending = { routeId: entry.routeId, chapterId: entry.chapterId, itemId: entry.item.id,
            skillId: entry.skillId, mode: entry.mode, reason, addedAt: iso(at) };
        const id = queueKey(pending);
        session.helpQueue = cleanQueue(session.helpQueue).filter(value => queueKey(value) !== id).concat(pending);
    }

    function recordResult(session, result, options) {
        const next = copy(session), entry = currentEntry(next), opts = object(options) ? options : {};
        if (!entry || !object(result) || result.itemId !== entry.item.id || typeof result.correct !== 'boolean') return next;
        if (result.setId && result.setId !== stepSet(next).id) return next;
        const old = next.results[entry.item.id] || {};
        if (old.deferred || (result.attemptToken && old.attemptToken === result.attemptToken)
            || (old.checked && !result.attemptToken)) return next;
        const assisted = next.hints[entry.item.id] === true || old.assisted === true;
        next.results[entry.item.id] = { checked: true, correct: result.correct, assisted,
            attempts: count(old.attempts) + 1, attemptToken: text(result.attemptToken), checkedAt: iso(opts.now) };
        if (!result.correct || assisted) queueHelp(next, entry, assisted ? 'assisted' : 'incorrect', opts.now);
        else next.helpQueue = cleanQueue(next.helpQueue).filter(value => queueKey(value) !== queueKey({ ...entry, itemId: entry.item.id }));
        return next;
    }

    function advance(session, options) {
        const next = copy(session), id = currentId(next);
        if (!id || (!next.results[id]?.checked && !next.results[id]?.deferred)) return next;
        next.index += 1;
        if (next.index === next.entries.length) next.completedAt = iso(options?.now);
        return next;
    }

    function requestHelp(session, options) {
        const next = useHint(session), entry = currentEntry(next);
        if (!entry) return next;
        queueHelp(next, entry, 'help', options?.now);
        if (!next.results[entry.item.id]?.checked) next.results[entry.item.id] = { checked: false, correct: null, assisted: true, deferred: true, attempts: 0 };
        return advance(next, options);
    }

    function summary(session) {
        const results = array(session?.entries).map(entry => session.results?.[entry.item.id]).filter(Boolean);
        return { total: array(session?.entries).length, index: count(session?.index), remaining: Math.max(0, array(session?.entries).length - count(session?.index)),
            checked: results.filter(result => result.checked).length, correct: results.filter(result => result.checked && result.correct).length,
            independentCorrect: results.filter(result => result.checked && result.correct && !result.assisted).length,
            assisted: results.filter(result => result.assisted).length, deferred: results.filter(result => result.deferred).length,
            complete: count(session?.index) >= array(session?.entries).length, helpCount: cleanQueue(session?.helpQueue).length };
    }

    return Object.freeze({ planCourse, planB3, createSession, resumeSession, updateDraft, useHint, beginRetry, requestHelp, recordResult, advance, stepSet, summary });
}));
