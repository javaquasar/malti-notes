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
    const api = { childCount, children, personalAnswer };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.MaltiStoryCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
