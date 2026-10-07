(async () => {
    const page = location.pathname.split('/').pop();
    if (!['greetings.html', 'polite_phrases.html', 'conversation_help.html', 'getting_to_know.html'].includes(page)) return;
    const root = document.createElement('section');
    root.className = 'lesson-practice';
    root.id = 'speaking-practice';
    document.querySelector('main.content').prepend(root);
    root.textContent = 'Loading speaking practice...';
    try {
        const response = await fetch('./assets/data/lesson01_practice.json');
        if (!response.ok) throw new Error('Practice data unavailable');
        const data = await response.json();
        const core = window.MaltiLessonPracticeCore;
        function markPriorities() {
            const phrases = new Set(data.phrases.map((p) => core.normalize(p.maltese)));
            document.querySelectorAll('[data-lesson01-group] > .study-card, [data-lesson01-group] > .qa-pair-card, [data-lesson01-group] > .qa-disclosure-card').forEach((card) => {
                if (card.querySelector('.lp-priority')) return;
                const text = card.querySelector('strong, .qa-disclosure-prompt')?.textContent || '';
                const tag = document.createElement('small'); tag.className = 'lp-priority';
                tag.textContent = core.normalize(text).includes('bezzjoni') ? 'Traditional' : phrases.has(core.normalize(text)) ? 'Essential' : 'Context / extension';
                card.append(tag);
            });
        }
        window.addEventListener('malti-lesson01-ready', markPriorities); markPriorities();
        const key = 'malti_lesson01_skills_v1';
        const store = window.MaltiStorage;
        const profile = () => store.getJson('malti_about_me_draft_v1', {})?.values || {};
        const story = window.MaltiStoryCore;
        const skills = { greeting: 'Greeting and leaving', reply: 'Responding politely', clarification: 'Asking for clarification', introduction: 'Introducing yourself' };
        const state = () => store.getJson(key, {});
        const el = (tag, text, parent = root) => {
            const node = document.createElement(tag);
            if (text !== undefined) node.textContent = text;
            parent.append(node);
            return node;
        };
        const button = (text, parent, action) => { const node = el('button', text, parent); node.type = 'button'; node.addEventListener('click', action); return node; };
        const select = (title, values, parent) => {
            const label = el('label', title, parent);
            const node = el('select', undefined, label);
            node.setAttribute('aria-label', title);
            values.forEach(([value, text]) => { const option = el('option', text, node); option.value = value; });
            return node;
        };
        const section = (title) => { const node = el('section'); node.className = 'lesson-practice'; el('h2', title, node); return node; };
        const controls = (parent) => { const node = el('div', undefined, parent); node.className = 'lp-controls'; return node; };
        function card(item) {
            const saved = window.MaltiReviewStore.getAllCards().find((c) => c.type === 'sentence-card' && core.normalize(c.maltese) === core.normalize(item.maltese));
            if (saved) return saved;
            for (const container of document.querySelectorAll('[data-lesson01-group]')) {
                const raw = container.previousElementSibling?.querySelector('button[data-items]')?.dataset.items;
                if (!raw) continue;
                try {
                    const match = JSON.parse(raw).find((c) => core.normalize(c.maltese) === core.normalize(item.maltese));
                    if (match) return match;
                } catch (error) { console.warn('Could not read source review identities', error); }
            }
            return { id: 'sentence::lesson01-speaking::' + core.normalize(item.maltese), maltese: item.maltese,
                english: item.english, topic: 'Lesson 01 Speaking', sourcePage: page };
        }
        const save = (item) => window.MaltiReviewStore.addSentence(card(item));
        function record(id, item, given, result, assisted) {
            const all = state();
            const previous = all[id] || {};
            all[id] = { skill: item.skill, correct: result.correct && !result.spelling,
                independent: previous.independent || (result.correct && !assisted && !result.spelling),
                assisted: previous.assisted || (result.correct && assisted), updatedAt: new Date().toISOString() };
            store.setJson(key, all);
            const publicItem = item.publicModel || item;
            const privateAttempt = item.personal || personal.checked;
            window.MaltiMistakeStore.recordAttempt({ id: 'lesson01-speaking-' + id, setId: 'lesson01-speaking', itemId: id,
                prompt: publicItem.english, given: privateAttempt ? '[Personal answer kept in this tab]' : given,
                correctAnswer: publicItem.maltese, explanation: privateAttempt ? 'Practise this pattern using your local story.' : (result.message || item.note || ''),
                sourcePage: page, topic: 'Lesson 01 Speaking', type: 'fill-blank' }, result.correct && !result.spelling);
            if (!result.correct || result.spelling) save(publicItem);
            updateSkills();
        }
        root.replaceChildren();
        el('h2', 'Lesson 01 Speaking Practice');
        const personalLabel = el('label'); personalLabel.className = 'lp-personal';
        const personal = document.createElement('input'); personal.type = 'checkbox'; personalLabel.append(personal, document.createTextNode(' Use my local story'));
        const profileStatus = el('p', '', root); profileStatus.className = 'lp-muted'; profileStatus.setAttribute('role', 'status');
        const builderLink = el('a', 'Edit my story', root); builderLink.href = './about_me.html#builder'; builderLink.className = 'lp-story-link';
        function updateProfileStatus() {
            const available = Object.values(profile()).some((value) => String(value).trim());
            personal.disabled = !available;
            if (!available) personal.checked = false;
            profileStatus.textContent = available ? 'Personal details stay on this device. Shared progress contains only learning results.' : 'No local story saved yet.';
        }
        updateProfileStatus();
        const tabs = controls(root);
        const panes = [];
        const tabButtons = [];
        ['Essential phrases', 'Your turn', 'Role-play', 'Pronunciation', 'Skills'].forEach((title, index) => {
            const b = button(title, tabs, () => open(index));
            const pane = el('div'); pane.hidden = index !== 0;
            pane.id = 'lp-pane-' + index; b.setAttribute('aria-controls', pane.id);
            panes.push(pane); tabButtons.push(b);
        });
        function open(index) { panes.forEach((pane, i) => { pane.hidden = i !== index; tabButtons[i].setAttribute('aria-pressed', String(i === index)); }); }
        open(0);
        const essential = panes[0];
        el('h3', '20 Essential Phrases', essential);
        const filter = select('Phrase selection', [['page', 'This topic'], ['all', 'All 20 phrases']], controls(essential));
        const list = el('ul', undefined, essential); list.className = 'lp-phrases';
        function renderPhrases() {
            list.replaceChildren();
            data.phrases.filter((item) => filter.value === 'all' || item.page === page).forEach((item) => {
                const row = el('li', undefined, list); row.className = 'lp-phrase';
                const content = el('div', undefined, row);
                el('strong', item.maltese, content); el('p', item.english, content);
                el('p', 'Reply: ' + item.reply, content); el('small', item.note, content);
                const b = button('+', row, () => {
                    const sentence = card(item);
                    if (window.MaltiReviewStore.hasCard(sentence.id)) window.MaltiReviewStore.removeCard(sentence.id);
                    else window.MaltiReviewStore.addSentence(sentence);
                    sync();
                });
                b.className = 'lp-save review-add-button review-add-button--icon';
                const sync = () => {
                    const saved = window.MaltiReviewStore.hasCard(card(item).id);
                    b.textContent = '';
                    b.classList.toggle('is-added', saved);
                    b.setAttribute('aria-pressed', String(saved));
                    b.title = (saved ? 'Remove from' : 'Add to') + ' review';
                    b.setAttribute('aria-label', b.title + ': ' + item.maltese);
                };
                sync();
            });
        }
        filter.addEventListener('change', renderPhrases); renderPhrases();
        window.addEventListener('malti-lesson01-ready', renderPhrases);
        const notes = el('details', undefined, essential); el('summary', 'Useful distinctions', notes);
        data.contrasts.forEach((note) => { el('h3', note.title, notes); el('p', note.text, notes); });

        const practice = panes[1];
        el('h3', 'Answer in Maltese', practice);
        const mode = select('Task', [['translate', 'Translate'], ['reply', 'Restore a reply'], ['cloze', 'Complete the phrase'], ['mixed', 'Mixed check'], ['focused', 'Focused practice']], controls(practice));
        const prompt = el('p', undefined, practice); prompt.className = 'lp-prompt';
        const label = el('label', 'Your answer', practice);
        const input = el('input', undefined, label); input.type = 'text'; input.maxLength = 1000; input.className = 'lp-answer'; input.autocomplete = 'off'; input.spellcheck = false;
        const actions = controls(practice);
        const feedback = el('p', '', practice); feedback.className = 'lp-feedback'; feedback.setAttribute('role', 'status');
        let cursor = 0, revealed = false, checked = false, taskQueue = [], sessionCorrect = 0, sessionChecked = 0;
        const bank = data.phrases.filter((item) => item.page === page);
        let practiceFragment = null;
        const fragmentButton = button('Practise this part', actions, () => {
            if (!practiceFragment) return;
            fragmentButton.hidden = true; input.value = ''; checkButton.disabled = false; checked = false; revealed = true;
            prompt.textContent = 'Restore this part: ' + practiceFragment.fragment; feedback.textContent = '';
            practiceFragment.active = true; input.focus({ preventScroll: true });
        }); fragmentButton.hidden = true;
        function personalItems() {
            if (!personal.checked) return [];
            const values = profile();
            return ['name', 'origin', 'hobby', 'work', 'children'].flatMap((id) => {
                const answers = story.personalAnswer(id, values);
                if (!answers.length) return [];
                const model = data.phrases.find((p) => p.id === id) || { id, maltese: id === 'work' ? 'Naħdem bħala għalliem.' : 'Għandi żewġt itfal.', english: id === 'work' ? 'I work as a teacher.' : 'I have two children.', skill: 'introduction' };
                const maltese = id === 'children' ? answers.join(' ') : answers[0];
                return [{ ...model, id: 'personal-' + id, maltese, english: { name: 'Give your name.', origin: 'Say where you are from.', hobby: 'Mention your hobby.', work: 'Say what you do for work.', children: 'Introduce your children, including their names and ages.' }[id],
                    accepted: id === 'children' ? [] : answers.slice(1), personal: true, publicModel: model, taskMode: 'translate' }];
            });
        }
        function resetTasks() {
            cursor = 0; sessionCorrect = 0; sessionChecked = 0;
            const pool = [...data.phrases, ...personalItems()];
            if (mode.value === 'mixed') taskQueue = core.mixed(pool).map((p) => ({ ...p, taskMode: p.personal ? 'translate' : (Math.random() < .5 ? 'reply' : 'translate') }));
            else if (mode.value === 'focused') {
                const weak = core.weakest(state(), Object.keys(skills));
                const pending = Object.entries(state()).flatMap(([id, result]) => {
                    if (result.correct || result.skill !== weak) return [];
                    const phraseMatch = id.match(/^phrase-(.+)-(translate|reply|cloze)$/);
                    if (phraseMatch) {
                        const phrase = pool.find((p) => p.id === phraseMatch[1]);
                        return phrase ? [{ ...phrase, taskMode: phraseMatch[2], assessmentId: id }] : [];
                    }
                    const dialogueMatch = id.match(/^dialogue-(course|neighbor|phone)-(\d+)$/);
                    const turn = dialogueMatch && data.scenarios.find((s) => s.id === dialogueMatch[1])?.turns[Number(dialogueMatch[2])];
                    return turn ? [{ ...turn, id: 'retry-' + id, taskMode: 'translate', assessmentId: id }] : [];
                });
                const extra = core.shuffle(pool.filter((p) => p.skill === weak && !pending.some((item) => item.id === p.id))).map((p) => ({ ...p, taskMode: 'translate' }));
                taskQueue = [...pending, ...extra].slice(0, 3);
            } else taskQueue = [...bank, ...personalItems()];
            showTask();
        }
        const taskMode = () => ['mixed', 'focused'].includes(mode.value) ? taskQueue[cursor]?.taskMode || 'translate' : mode.value;
        function target() {
            const phrase = taskQueue[cursor % taskQueue.length];
            if (phrase.personal) return phrase;
            if (taskMode() !== 'reply') return phrase;
            const answers = personal.checked ? story.personalAnswer(phrase.id, profile()) : [];
            return { ...phrase, maltese: answers[0] || phrase.reply, english: 'Reply to: ' + phrase.maltese,
                accepted: answers.length ? answers.slice(1) : phrase.replyAccepted || [], personal: answers.length > 0,
                publicModel: answers.length ? { ...phrase, maltese: phrase.reply } : null };
        }
        function showTask() {
            revealed = false; checked = false; practiceFragment = null; fragmentButton.hidden = true;
            if (['mixed', 'focused'].includes(mode.value) && cursor >= taskQueue.length) {
                prompt.textContent = `Session complete: ${sessionCorrect}/${sessionChecked} correct. ${sessionChecked < taskQueue.length ? 'Some tasks were skipped.' : ''}`;
                checkButton.disabled = true; input.disabled = true; feedback.textContent = ''; return;
            }
            input.disabled = false;
            modelButton.hidden = mode.value === 'mixed';
            const item = target();
            prompt.textContent = `${cursor % taskQueue.length + 1}/${taskQueue.length}. ` + (!item.personal && taskMode() === 'cloze' ? item.maltese.split(' ').map((word, i) => i === 0 ? '____' : word).join(' ') + ' (' + item.english + ')' : item.english);
            input.value = ''; feedback.textContent = ''; checkButton.disabled = false;
        }
        function checkTask() {
            if (checked || !input.value.trim()) { if (!checked) feedback.textContent = 'Enter an answer first.'; return; }
            const item = target();
            if (practiceFragment?.active) {
                const result = core.check(input.value, [practiceFragment.fragment]);
                feedback.textContent = result.correct ? 'Fragment restored. Try the complete answer again next time.' : 'Check this part: ' + practiceFragment.fragment;
                checkButton.disabled = result.correct; checked = result.correct; return;
            }
            const expected = !item.personal && taskMode() === 'cloze' ? item.maltese.split(' ')[0] : item.maltese;
            const result = core.analyze(input.value, [expected, ...(taskMode() !== 'cloze' || item.personal ? item.accepted : [])]);
            checked = true; checkButton.disabled = true;
            sessionChecked++; if (result.correct && !result.spelling) sessionCorrect++;
            record(item.assessmentId || 'phrase-' + item.id + '-' + taskMode(), item, input.value, result, revealed);
            feedback.textContent = result.correct && !result.spelling ? 'Correct. ' + result.target : result.message + ' Model answer: ' + result.target + ' Added to review.';
            if ((!result.correct || result.spelling) && mode.value !== 'mixed') { practiceFragment = { fragment: result.fragment }; fragmentButton.hidden = false; }
        }
        const checkButton = button('Check answer', actions, checkTask);
        const modelButton = button('Show model', actions, () => { if (input.disabled) return; revealed = true; feedback.textContent = target().maltese; });
        button('Next', actions, () => { cursor++; showTask(); input.focus({ preventScroll: true }); });
        button('New session', actions, resetTasks);
        input.addEventListener('keydown', (event) => { if (event.key === 'Enter') checkTask(); });
        mode.addEventListener('change', () => {
            if (['mixed', 'focused'].includes(mode.value)) resetTasks();
            else { taskQueue = [...bank, ...personalItems()]; cursor %= taskQueue.length; showTask(); }
        }); resetTasks();

        const roleplay = panes[2];
        el('h3', 'A Short Conversation', roleplay);
        const options = controls(roleplay);
        const scenario = select('Situation', data.scenarios.map((s) => [s.id, s.title]), options);
        const role = select('Your role', [], options);
        const hints = select('Mode', [['guided', 'Guided'], ['independent', 'No hints']], options);
        const conversation = el('div', undefined, roleplay);
        const rpLabel = el('label', 'Your next line in Maltese', roleplay);
        const rpInput = el('input', undefined, rpLabel); rpInput.type = 'text'; rpInput.maxLength = 1000; rpInput.className = 'lp-answer'; rpInput.autocomplete = 'off'; rpInput.spellcheck = false;
        const rpActions = controls(roleplay);
        const rpFeedback = el('p', '', roleplay); rpFeedback.className = 'lp-feedback'; rpFeedback.setAttribute('role', 'status');
        let turn = 0, rpRevealed = false, rpChecked = false, rpCorrect = 0, rpTotal = 0;
        function selected() {
            const s = data.scenarios.find((item) => item.id === scenario.value);
            if (!personal.checked || s.id === 'phone') return s;
            const values = profile();
            const name = String(values.name || '').trim();
            const origins = story.personalAnswer('origin', values), jobs = story.personalAnswer('work', values), hobbies = story.personalAnswer('hobby', values);
            return { ...s, turns: s.turns.map((item, index) => {
                let answers = null;
                if (item.role === role.value) {
                    if (s.id === 'course' && index === 0 && name) answers = [`Bonġu! Jisimni ${name}. Kif jismek?`, `Bonġu! Jien ${name}. X'jismek?`];
                    if (s.id === 'course' && index === 1 && name) answers = [`Bonġu! Jien ${name}. Għandi pjaċir niltaqa' miegħek.`, `Bonġu! Jisimni ${name}. Għandi pjaċir.`];
                    if (s.id === 'course' && [3, 4].includes(index) && origins.length) answers = origins.map((line) => line + (index === 3 ? ' U int?' : " X'tagħmel fil-ħajja?"));
                    if (s.id === 'course' && [5, 6].includes(index) && jobs.length) answers = jobs.map((line) => line + (index === 5 ? ' U int?' : ''));
                    if (s.id === 'neighbor' && [2, 3].includes(index)) answers = [values.gender === 'female' ? 'Tajba, grazzi.' : 'Tajjeb, grazzi.'].map((line) => line + (index === 2 ? ' U int?' : ''));
                    if (s.id === 'neighbor' && index === 5 && hobbies.length) answers = hobbies;
                }
                if (!answers) return name && item.role !== role.value ? { ...item, maltese: item.maltese.replace(new RegExp(role.value, 'g'), () => name) } : item;
                return { ...item, maltese: answers[0], accepted: answers.slice(1), personal: true, publicModel: item,
                    english: { 0: 'Greet your partner, give your name and ask theirs.', 1: 'Give your name and say pleased to meet you.', 3: s.id === 'neighbor' ? 'Say how you are.' : 'Answer using your own details and ask: And you?', 4: 'Say where you are from and ask about work.', 5: s.id === 'course' ? 'Mention your work and ask: And you?' : 'Mention your hobby.', 6: 'Mention your work.', 2: 'Say how you are and ask: And you?' }[index] || item.english };
            }) };
        }
        let roleFragment = null;
        const rpFragment = button('Practise this part', rpActions, () => {
            if (!roleFragment) return;
            roleFragment.active = true; rpFragment.hidden = true; rpInput.value = ''; rpCheck.disabled = false;
            rpFeedback.textContent = 'Restore this part: ' + roleFragment.fragment;
        }); rpFragment.hidden = true;
        function showTurn() {
            conversation.replaceChildren(); rpInput.value = ''; rpFeedback.textContent = ''; rpRevealed = false; rpChecked = false;
            roleFragment = null; rpFragment.hidden = true;
            const s = selected();
            while (turn < s.turns.length && s.turns[turn].role !== role.value) {
                const p = el('p', s.turns[turn].role + ': ' + s.turns[turn].maltese, conversation); p.className = 'lp-prompt'; turn++;
            }
            const done = turn >= s.turns.length;
            rpLabel.hidden = done; rpCheck.disabled = done; rpNext.disabled = true; rpModel.disabled = done;
            if (done) { el('p', 'Conversation complete: ' + rpCorrect + '/' + rpTotal + ' correct replies.', conversation); return; }
            el('p', role.value + ': ' + s.turns[turn].english, conversation);
            if (hints.value === 'guided') { el('p', 'Opening: ' + s.turns[turn].maltese.split(' ').slice(0, 2).join(' ') + ' ...', conversation); rpRevealed = true; }
            rpInput.focus({ preventScroll: true });
        }
        function resetDialogue(changeRoles) {
            if (changeRoles) { role.replaceChildren(); selected().roles.forEach((r) => { const o = el('option', r, role); o.value = r; }); }
            turn = 0; rpCorrect = 0; rpTotal = 0; showTurn();
        }
        function checkTurn() {
            if (roleFragment?.active) {
                const result = core.check(rpInput.value, [roleFragment.fragment]);
                rpFeedback.textContent = result.correct ? 'Fragment restored. Continue with the next turn.' : 'Check this part: ' + roleFragment.fragment;
                rpCheck.disabled = result.correct; return;
            }
            if (rpChecked || turn >= selected().turns.length) return;
            if (!rpInput.value.trim()) { rpFeedback.textContent = 'Enter a reply first.'; return; }
            const item = selected().turns[turn];
            const result = core.analyze(rpInput.value, [item.maltese, ...(item.accepted || [])]);
            rpChecked = true; rpCheck.disabled = true; rpNext.disabled = false; rpTotal++; if (result.correct) rpCorrect++;
            record('dialogue-' + selected().id + '-' + turn, item, rpInput.value, result, rpRevealed);
            rpFeedback.textContent = result.correct && !result.spelling ? 'Correct.' : result.message + ' Model reply: ' + result.target + ' Added to review.';
            if (!result.correct || result.spelling) { roleFragment = { fragment: result.fragment }; rpFragment.hidden = false; }
        }
        const rpCheck = button('Check reply', rpActions, checkTurn);
        const rpModel = button('Show model', rpActions, () => { rpRevealed = true; rpFeedback.textContent = selected().turns[turn].maltese; });
        const rpNext = button('Next turn', rpActions, () => { turn++; showTurn(); });
        button('Restart', rpActions, () => resetDialogue(false));
        scenario.addEventListener('change', () => resetDialogue(true)); role.addEventListener('change', () => resetDialogue(false)); hints.addEventListener('change', () => resetDialogue(false));
        rpInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') checkTurn(); }); resetDialogue(true);
        personal.addEventListener('change', () => { resetTasks(); resetDialogue(false); });
        let profileSignature = JSON.stringify(profile());
        function refreshProfile() {
            const next = JSON.stringify(profile());
            if (next === profileSignature) return;
            profileSignature = next; updateProfileStatus(); resetTasks(); resetDialogue(false);
        }
        window.addEventListener('focus', refreshProfile);

        const minute = section('One-Minute Conversation'); roleplay.append(minute);
        const goals = el('ul', undefined, minute); data.minuteGoals.forEach((goal) => el('li', goal, goals));
        const clock = el('p', '01:00', minute); clock.setAttribute('role', 'timer');
        const minuteActions = controls(minute); let interval = null, deadline = 0;
        const start = button('Start', minuteActions, () => {
            if (interval) return; deadline = Date.now() + 60000; start.disabled = true;
            interval = setInterval(() => {
                const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000)); clock.textContent = '00:' + String(seconds).padStart(2, '0');
                if (!seconds) { clearInterval(interval); interval = null; start.disabled = false; clock.textContent = 'Time complete.'; }
            }, 250);
        });
        button('Reset', minuteActions, () => { clearInterval(interval); interval = null; start.disabled = false; clock.textContent = '01:00'; });
        const assessment = select('Self-assessment', [['', 'Not assessed'], ['guided', 'With prompts'], ['independent', 'Without prompts']], controls(minute));
        assessment.addEventListener('change', () => { const all = state(); all.minute = { assessment: assessment.value, updatedAt: new Date().toISOString() }; store.setJson(key, all); });
        assessment.value = state().minute?.assessment || '';

        const audioPane = panes[3]; el('h3', 'Pronunciation References', audioPane);
        const links = el('ul', undefined, audioPane);
        data.audio.forEach((clip) => { const li = el('li', undefined, links); const a = el('a', clip.phrase + ' - ' + clip.speaker + ' (' + clip.location + ')', li); a.href = clip.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; });
        el('p', 'Forvo community recordings. External audio requires an internet connection. Full native dialogue recordings are not available here yet.', audioPane);
        el('h3', 'Your Recording', audioPane);
        const recordingTarget = select('Recording text', [
            ...data.phrases.map((phrase) => ['phrase:' + phrase.id, phrase.maltese]),
            ...data.scenarios.map((s) => ['dialogue:' + s.id, s.title])
        ], controls(audioPane));
        const recordingText = el('p', '', audioPane); recordingText.className = 'lp-prompt';
        function showRecordingText() {
            const [type, id] = recordingTarget.value.split(':');
            recordingText.textContent = type === 'phrase' ? data.phrases.find((p) => p.id === id).maltese
                : data.scenarios.find((s) => s.id === id).turns.map((t) => t.role + ': ' + t.maltese).join('\n');
        }
        recordingTarget.addEventListener('change', showRecordingText); showRecordingText();
        const audioActions = controls(audioPane);
        const audio = el('audio', undefined, audioPane); audio.controls = true; audio.className = 'lp-audio'; audio.hidden = true;
        const speed = select('Playback speed', [['1', 'Normal'], ['0.75', 'Slow']], controls(audioPane));
        speed.addEventListener('change', () => { audio.playbackRate = Number(speed.value); audio.preservesPitch = true; });
        const audioStatus = el('p', 'Recordings stay in this tab and are not uploaded.', audioPane); audioStatus.setAttribute('role', 'status');
        let recorder = null, stream = null, objectUrl = null, recordTimeout = null, disposed = false;
        const release = () => { stream?.getTracks().forEach((track) => track.stop()); stream = null; clearTimeout(recordTimeout); file.disabled = false; };
        function playBlob(blob) {
            audio.pause();
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            objectUrl = URL.createObjectURL(blob); audio.src = objectUrl; audio.hidden = false;
            audio.playbackRate = Number(speed.value); audio.preservesPitch = true;
        }
        const fileLabel = el('label', 'Local audio file (not uploaded)', audioPane);
        const file = el('input', undefined, fileLabel); file.type = 'file'; file.accept = 'audio/*';
        file.addEventListener('change', () => {
            const clip = file.files[0];
            if (!clip) return;
            if (!clip.type.startsWith('audio/') || clip.size > 20 * 1024 * 1024) { audioStatus.textContent = 'Choose an audio file smaller than 20 MB.'; return; }
            playBlob(clip); audioStatus.textContent = 'Local audio ready. Speaker and pronunciation have not been verified.';
        });
        audio.addEventListener('error', () => { audioStatus.textContent = 'This audio format could not be played. Try another file.'; });
        const recordButton = button('Record', audioActions, async () => {
            audio.pause();
            recordButton.disabled = true;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (disposed) { release(); return; }
                recorder = new MediaRecorder(stream); const chunks = [];
                recorder.addEventListener('dataavailable', (event) => { if (event.data.size) chunks.push(event.data); });
                recorder.addEventListener('stop', () => {
                    release(); if (disposed) return;
                    playBlob(new Blob(chunks, { type: recorder.mimeType }));
                    recordButton.disabled = false; stop.disabled = true; audioStatus.textContent = 'Your recording is ready.';
                });
                recorder.addEventListener('error', () => { release(); recordButton.disabled = false; stop.disabled = true; audioStatus.textContent = 'Recording failed. Try again.'; });
                recorder.start(); stop.disabled = false; file.disabled = true; audioStatus.textContent = 'Recording...';
                recordTimeout = setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 90000);
            } catch (error) { release(); recordButton.disabled = false; audioStatus.textContent = 'Microphone unavailable or permission denied. The pronunciation links remain available.'; }
        });
        const stop = button('Stop', audioActions, () => { if (recorder?.state === 'recording') recorder.stop(); }); stop.disabled = true;
        audio.addEventListener('loadedmetadata', () => { file.disabled = false; });
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { recordButton.disabled = true; audioStatus.textContent = 'Recording is unavailable in this browser. Pronunciation links are available online.'; }
        const skillPane = panes[4]; el('h3', 'Speaking Skills', skillPane);
        const nextTask = el('p', '', skillPane); nextTask.className = 'lp-prompt';
        const nextAction = button('Practise next', controls(skillPane), () => { mode.value = 'focused'; resetTasks(); open(1); });
        button('Mixed check', controls(skillPane), () => { mode.value = 'mixed'; resetTasks(); open(1); });
        const skillList = el('div', undefined, skillPane); skillList.className = 'lp-skills';
        function updateSkills() {
            skillList.replaceChildren();
            Object.entries(skills).forEach(([skill, title]) => { const p = core.progress(state(), skill); el('p', title + ': ' + p.independent + ' independent, ' + p.assisted + ' with prompts, ' + p.needsPractice + ' to revisit.', skillList); });
            const weak = core.weakest(state(), Object.keys(skills));
            nextTask.textContent = 'Next: ' + skills[weak] + '. A short session of up to three replies.';
            nextAction.textContent = 'Practise ' + skills[weak].toLowerCase();
        }
        el('p', 'Independent answers use no model or hints and include the Maltese letters. Timed conversation is self-assessed separately.', skillPane);
        updateSkills();
        window.addEventListener('malti-storage-change', (event) => { if (event.detail?.key === key) updateSkills(); });
        window.addEventListener('malti-storage-change', (event) => { if (event.detail?.key === 'malti_review_cards_v2') renderPhrases(); });
        window.addEventListener('storage', (event) => {
            if (event.key === 'malti_about_me_draft_v1' || event.key === null) refreshProfile();
            if (event.key === key || event.key === null) updateSkills();
            if (event.key === 'malti_review_cards_v2' || event.key === null) renderPhrases();
        });
        window.addEventListener('pagehide', () => {
            disposed = true; clearInterval(interval); interval = null; start.disabled = false;
            if (recorder?.state === 'recording') recorder.stop();
            release(); audio.pause(); audio.removeAttribute('src'); audio.hidden = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl); objectUrl = null;
        });
        window.addEventListener('pageshow', () => { disposed = false; recordButton.disabled = !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder; stop.disabled = true; file.disabled = false; });
        const nav = document.querySelector('.sidebar ul');
        if (nav) { const li = document.createElement('li'); const a = el('a', 'Speaking Practice', li); a.href = '#speaking-practice'; nav.prepend(li); }
    } catch (error) {
        console.error('Lesson speaking practice failed', error);
        root.textContent = 'Speaking practice could not be loaded. Please reload the page.'; root.setAttribute('role', 'alert');
    }
})();
