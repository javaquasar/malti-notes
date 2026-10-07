(function (root) {
    const clean = (value) => String(value || '').trim().replace(/[.!?]+$/, '');
    const childCount = (value) => value === 'two' ? 2 : ['one', 'son', 'daughter'].includes(value) ? 1 : 0;
    function children(values) {
        const count = childCount(values.children);
        if (!count) return values.children === 'none' ? ["M'għandix tfal."] : [];
        const firstGender = values.child1Gender || (values.children === 'daughter' ? 'female' : 'male');
        const lines = [count === 2 ? 'Għandi żewġt itfal.' : firstGender === 'female' ? 'Għandi tifla waħda.' : 'Għandi tifel wieħed.'];
        for (let i = 1; i <= count; i++) {
            const female = (values['child' + i + 'Gender'] || (i === 1 ? firstGender : 'female')) === 'female';
            const name = clean(values['child' + i + 'Name']);
            const rawAge = String(values['child' + i + 'Age'] ?? '').trim();
            const age = /^\d{1,3}$/.test(rawAge) && Number(rawAge) <= 120 ? Number(rawAge) : null;
            if (name) lines.push(`${female ? 'Binti jisimha' : 'Ibni jismu'} ${name}.`);
            if (age !== null) lines.push(`${name ? (female ? 'Għandha' : 'Għandu') : (female ? 'Binti għandha' : 'Ibni għandu')} ${age === 1 ? 'sena' : age + ' snin'}.`);
        }
        return lines;
    }
    function personalAnswer(id, values) {
        const name = clean(values.name), origin = clean(values.origin), occupation = clean(values.occupation), hobbies = clean(values.hobbies);
        const originLine = origin ? (/^m(?:inn|ill-|ir-|is-|it-|ix-)/i.test(origin) ? `Jien ${origin}.` : `Jien minn ${origin}.`) : '';
        return {
            name: name ? [`Jisimni ${name}.`, `Jien ${name}.`, `Jien jisimni ${name}.`] : [],
            origin: originLine ? [originLine, originLine.replace(/^Jien /, '')] : [],
            hobby: hobbies ? [`Inħobb ${hobbies}.`, `Jien inħobb ${hobbies}.`, `Fil-ħin liberu tiegħi nħobb ${hobbies}.`] : [],
            work: occupation ? [`Naħdem bħala ${occupation}.`, `Jien naħdem bħala ${occupation}.`] : [],
            children: children(values)
        }[id] || [];
    }
    const units = ['żero', 'wieħed', 'tnejn', 'tlieta', 'erbgħa', 'ħamsa', 'sitta', 'sebgħa', 'tmienja', 'disgħa', 'għaxra', 'ħdax', 'tnax', 'tlettax', 'erbatax', 'ħmistax', 'sittax', 'sbatax', 'tmintax', 'dsatax'];
    const tens = ['', '', 'għoxrin', 'tletin', 'erbgħin', 'ħamsin', 'sittin', 'sebgħin', 'tmenin', 'disgħin'];
    function numberWords(value) {
        const n = Number(value);
        if (!Number.isInteger(n) || n < 0 || n > 100) return String(value);
        if (n < 20) return units[n];
        if (n === 100) return 'mija';
        return (n % 10 ? units[n % 10] + ' u ' : '') + tens[Math.floor(n / 10)];
    }
    function yearPhrase(value, spelled) {
        const n = Number(value);
        if (n === 0) return spelled ? 'żero snin' : '0 snin';
        if (n === 1) return 'sena';
        if (!spelled || n > 100) return `${n} ${n >= 11 ? 'sena' : 'snin'}`;
        if (n === 2) return 'sentejn';
        if (n >= 3 && n <= 10) return ['', '', '', 'tliet', "erba'", 'ħames', 'sitt', "seba'", 'tmien', "disa'", 'għaxar'][n] + ' snin';
        if (n >= 11 && n <= 19) return numberWords(n) + '-il sena';
        return (n === 100 ? 'mitt' : numberWords(n)) + ' sena';
    }
    const reasons = {
        home: ["Irrid nitgħallem il-Malti għax noqgħod Malta.", 'I want to learn Maltese because I live in Malta.'],
        people: ["Irrid nitgħallem il-Malti biex nitkellem man-nies.", 'I want to learn Maltese to talk to people.'],
        work: ["Irrid nitgħallem il-Malti għax naħdem Malta.", 'I want to learn Maltese because I work in Malta.']
    };
    function rows(v, options = {}) {
        const result = [], short = v.storyVersion === 'short', spelled = v.numberWords === true;
        const included = (field) => v[field] !== false;
        const add = (id, topic, maltese, english, question, questionEnglish) => result.push({ id, topic, maltese, english, question, questionEnglish });
        const lookup = (group, field) => clean(v[field + 'English']) || (options[group] || []).find((x) => x.phrase === clean(v[field]))?.label || '';
        const validNumber = (value) => /^\d{1,3}$/.test(String(value)) && Number(value) <= 120;
        const name = clean(v.name), feminine = v.gender === 'female';
        if (name) add('name', 'name', `Jisimni ${name}.`, `My name is ${name}.`, "X'jismek?", 'What is your name?');
        if (validNumber(v.age)) add('age', 'age', `Għandi ${yearPhrase(v.age, spelled)}.`, `I am ${Number(v.age)} ${Number(v.age) === 1 ? 'year' : 'years'} old.`, 'Kemm għandek żmien?', 'How old are you?');
        if (clean(v.origin)) {
            const english = lookup('countries', 'origin');
            add('origin', 'origin', personalAnswer('origin', v)[0], english ? `I am from ${english}.` : '', 'Minn fejn int?', 'Where are you from?');
        }
        if (clean(v.residence)) {
            const english = lookup('places', 'residence');
            add('residence', 'residence', `Noqgħod ${clean(v.residence)}.`, english ? `I live in ${english}.` : '', 'Fejn toqgħod?', 'Where do you live?');
        }
        if (!short && included('includeDuration') && validNumber(v.years)) add('duration', 'duration', `Ilni noqgħod f'Malta għal ${yearPhrase(v.years, spelled)}.`, `I have been living in Malta for ${Number(v.years)} ${Number(v.years) === 1 ? 'year' : 'years'}.`, 'Kemm ilek toqgħod Malta?', 'How long have you lived in Malta?');
        if (clean(v.occupation)) {
            const english = clean(v.occupationEnglish) || (options.occupations || []).find((x) => [x.male, x.female].includes(clean(v.occupation)))?.label;
            const article = /^[aeiou]/i.test(english || '') ? 'an' : 'a';
            add('occupation', 'occupation', `Naħdem bħala ${clean(v.occupation)}.`, english ? `I work as ${article} ${english.toLowerCase()}.` : '', "X'tagħmel fil-ħajja?", 'What do you do for work?');
        }
        if (!short && included('includeDuties') && clean(v.workDetail)) add('duties', 'duties', `Fuq ix-xogħol ${clean(v.workDetail)}.`, clean(v.workDetailEnglish) ? `At work, ${clean(v.workDetailEnglish)}.` : '', "X'tagħmel fuq ix-xogħol?", 'What do you do at work?');
        if (included('includeFamily')) {
            if (['married', 'not-married'].includes(v.relationship)) add('family', 'family', `${v.relationship === 'married' ? 'Jien' : "M'iniex"} ${feminine ? 'miżżewġa' : 'miżżewweġ'}.`, `I am ${v.relationship === 'married' ? '' : 'not '}married.`, feminine ? 'Int miżżewġa?' : 'Int miżżewweġ?', 'Are you married?');
            if (!short && v.relationship === 'married' && clean(v.spouseName)) add('spouse', 'family', `${feminine ? 'Żewġi jismu' : 'Marti jisimha'} ${clean(v.spouseName)}.`, `My ${feminine ? 'husband' : 'wife'} is called ${clean(v.spouseName)}.`, feminine ? "X'jismu żewġek?" : "X'jisimha martek?", `What is your ${feminine ? 'husband' : 'wife'}'s name?`);
            const count = childCount(v.children), childLines = children(v);
            if (childLines.length) add('children', 'children', childLines[0], count ? `I have ${count === 2 ? 'two children' : (v.child1Gender === 'female' ? 'a daughter' : 'a son')}.` : 'I do not have children.', 'Għandek tfal?', 'Do you have children?');
            if (!short && included('includeChildDetails')) for (let i = 1; i <= count; i++) {
                const girl = v['child' + i + 'Gender'] === 'female', childName = clean(v['child' + i + 'Name']), age = v['child' + i + 'Age'];
                if (childName) add(`child${i}Name`, 'children', `${girl ? 'Binti jisimha' : 'Ibni jismu'} ${childName}.`, `My ${girl ? 'daughter' : 'son'} is called ${childName}.`, girl ? "X'jisimha bintek?" : "X'jismu ibnek?", `What is your ${girl ? 'daughter' : 'son'}'s name?`);
                if (validNumber(age)) add(`child${i}Age`, 'children', `${childName ? (girl ? 'Għandha' : 'Għandu') : (girl ? 'Binti għandha' : 'Ibni għandu')} ${yearPhrase(age, spelled)}.`, `${childName || ('My ' + (girl ? 'daughter' : 'son'))} is ${Number(age)} ${Number(age) === 1 ? 'year' : 'years'} old.`, girl ? 'Kemm għandha żmien bintek?' : 'Kemm għandu żmien ibnek?', `How old is ${childName || ('your ' + (girl ? 'daughter' : 'son'))}?`);
            }
            if (!short && v.childrenSchool && count) add('school', 'children', count === 2 ? 'It-tfal tiegħi jmorru l-iskola.' : v.child1Gender === 'female' ? 'Binti tmur l-iskola.' : 'Ibni jmur l-iskola.', count === 2 ? 'My children go to school.' : `My ${v.child1Gender === 'female' ? 'daughter' : 'son'} goes to school.`, 'It-tfal tiegħek imorru l-iskola?', 'Do your children go to school?');
            if (!short && v.familyLikesMalta) add('likesMalta', 'family', 'Il-familja tiegħi tħobb Malta.', 'My family likes Malta.', 'Il-familja tiegħek tħobb Malta?', 'Does your family like Malta?');
        }
        if (included('includeHobbies') && clean(v.hobbies)) add('hobbies', 'hobbies', `Fil-ħin liberu tiegħi nħobb ${clean(v.hobbies)}.`, clean(v.hobbiesEnglish) ? `In my free time, I like to ${clean(v.hobbiesEnglish)}.` : '', "X'tħobb tagħmel fil-ħin liberu tiegħek?", 'What do you like doing in your free time?');
        if (!short && reasons[v.learningReason]) add('motivation', 'origin', ...reasons[v.learningReason], 'Għaliex trid titgħallem il-Malti?', 'Why do you want to learn Maltese?');
        return result;
    }
    function copyText(storyRows, bilingual) {
        if (bilingual && storyRows.some((row) => !row.english)) throw new Error('Add the missing English translations before copying with translation.');
        return storyRows.map((row) => bilingual ? `${row.maltese}\n${row.english}` : row.maltese).join(bilingual ? '\n\n' : '\n');
    }
    const api = { childCount, children, personalAnswer, numberWords, yearPhrase, rows, copyText };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.MaltiStoryCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
