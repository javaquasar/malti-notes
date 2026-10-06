(() => {
  const DRAFT_KEY = "malti_about_me_draft_v1";
  const form = document.querySelector("[data-about-me-form]");
  const output = document.querySelector("[data-about-me-output]");
  const builderStatus = document.querySelector("[data-about-me-builder-status]");
  const storage = window.MaltiStorage;
  const fields = [
    "name", "age", "origin", "residence", "years", "occupation",
    "workDetail", "gender", "relationship", "spouseName", "children", "hobbies"
  ];

  function clean(value) {
    return String(value || "").trim().replace(/[.!?]+$/, "");
  }

  function sentence(value) {
    const text = clean(value);
    return text ? `${text}.` : "";
  }

  function valuesFromForm() {
    return Object.fromEntries(fields.map((name) => [name, form?.elements[name]?.value || ""]));
  }

  function applyValues(values) {
    if (!form || !values) return;
    fields.forEach((name) => {
      if (form.elements[name] && values[name] !== undefined) form.elements[name].value = values[name];
    });
  }

  function buildStory(values) {
    const lines = [];
    const name = clean(values.name);
    const age = clean(values.age);
    const origin = clean(values.origin);
    const residence = clean(values.residence);
    const years = clean(values.years);
    const occupation = clean(values.occupation);
    const workDetail = clean(values.workDetail);
    const spouseName = clean(values.spouseName);
    const hobbies = clean(values.hobbies);
    const feminine = values.gender === "female";

    if (name) lines.push(`Jisimni ${name}.`);
    if (age) lines.push(`Għandi ${age} sena.`);
    if (origin) {
      const originLine = /^m(?:inn|ill-|ir-|is-|it-|ix-)/i.test(origin)
        ? `Jien ${origin}`
        : `Jien minn ${origin}`;
      lines.push(sentence(originLine));
    }
    if (residence) lines.push(`Noqgħod ${residence}.`);
    if (years) lines.push(`Ilni noqgħod f'Malta għal ${years} ${years === "1" ? "sena" : "snin"}.`);
    if (occupation) lines.push(`Naħdem bħala ${occupation}.`);
    if (workDetail) lines.push(sentence(`Fuq ix-xogħol ${workDetail}`));

    if (values.relationship === "married") {
      lines.push(`Jien ${feminine ? "miżżewġa" : "miżżewweġ"}.`);
      if (spouseName) lines.push(feminine ? `Żewġi jismu ${spouseName}.` : `Marti jisimha ${spouseName}.`);
    } else if (values.relationship === "not-married") {
      lines.push(`M'iniex ${feminine ? "miżżewġa" : "miżżewweġ"}.`);
    }

    const childrenLines = {
      none: "M'għandix tfal.",
      son: "Għandi tifel wieħed.",
      daughter: "Għandi tifla waħda.",
      two: "Għandi żewġt itfal."
    };
    if (childrenLines[values.children]) lines.push(childrenLines[values.children]);
    if (hobbies) lines.push(sentence(`Fil-ħin liberu tiegħi nħobb ${hobbies}`));
    return lines;
  }

  function renderStory() {
    if (!output || !form) return;
    const lines = buildStory(valuesFromForm());
    output.innerHTML = "";
    if (!lines.length) {
      const placeholder = document.createElement("p");
      placeholder.className = "mini";
      placeholder.textContent = "Fill in any useful fields or load the sample. Empty fields are skipped.";
      output.appendChild(placeholder);
      return;
    }
    lines.forEach((line) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = line;
      output.appendChild(paragraph);
    });
  }

  function setBuilderStatus(message) {
    if (builderStatus) builderStatus.textContent = message;
  }

  function loadSample() {
    applyValues({
      name: "Alex",
      age: "35",
      origin: "mill-Italja",
      residence: "il-Mosta",
      years: "5",
      occupation: "għalliem",
      workDetail: "ngħallem il-Malti u nipprepara l-lezzjonijiet",
      gender: "male",
      relationship: "married",
      spouseName: "Sara",
      children: "two",
      hobbies: "naqra u nimxi ħdejn il-baħar"
    });
    renderStory();
    setBuilderStatus("Sample loaded. Replace any details with your own Maltese phrases.");
  }

  async function copyStory() {
    const text = buildStory(valuesFromForm()).join(" ");
    if (!text) {
      setBuilderStatus("Add at least one detail before copying.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setBuilderStatus("Story copied.");
    } catch (error) {
      setBuilderStatus("Copy is unavailable in this browser. Select the story text instead.");
    }
  }

  if (form) {
    const saved = storage?.getJson(DRAFT_KEY, null);
    if (saved?.values) {
      applyValues(saved.values);
      setBuilderStatus("Local draft restored on this device.");
    }
    form.addEventListener("input", renderStory);
    form.addEventListener("change", renderStory);
    form.querySelector("[data-about-me-sample]")?.addEventListener("click", loadSample);
    form.querySelector("[data-about-me-copy]")?.addEventListener("click", copyStory);
    form.querySelector("[data-about-me-save]")?.addEventListener("click", () => {
      storage?.setJson(DRAFT_KEY, { values: valuesFromForm(), savedAt: new Date().toISOString() });
      setBuilderStatus("Draft saved only in this browser. It is not included in cloud progress sync.");
    });
    form.querySelector("[data-about-me-clear]")?.addEventListener("click", () => {
      form.reset();
      storage?.remove(DRAFT_KEY);
      renderStory();
      setBuilderStatus("Draft cleared from this browser.");
    });
    renderStory();
  }

  const practice = document.querySelector("[data-about-me-practice]");
  if (!practice) return;

  const question = practice.querySelector("[data-practice-question]");
  const translation = practice.querySelector("[data-practice-translation]");
  const answer = practice.querySelector("[data-practice-answer]");
  const model = practice.querySelector("[data-practice-model]");
  const modelText = practice.querySelector("[data-practice-model-text]");
  const modelTranslation = practice.querySelector("[data-practice-model-translation]");
  const status = practice.querySelector("[data-practice-status]");
  const revealButton = practice.querySelector("[data-practice-reveal]");
  const nextButton = practice.querySelector("[data-practice-next]");
  const assessmentButtons = [...practice.querySelectorAll("[data-practice-result]")];
  let items = [];
  let queue = [];
  let current = null;

  function shuffle(values) {
    const result = values.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  function nextQuestion() {
    if (!queue.length) queue = shuffle(items.map((_, index) => index));
    current = items[queue.shift()];
    question.textContent = current.question.maltese;
    translation.textContent = current.question.english || "";
    answer.value = "";
    model.hidden = true;
    nextButton.hidden = true;
    assessmentButtons.forEach((button) => { button.hidden = true; });
    revealButton.hidden = false;
    status.textContent = "Say the answer aloud or write your own version, then reveal the model.";
    answer.focus();
  }

  function revealModel() {
    if (!current) return;
    modelText.textContent = current.answer.maltese;
    modelTranslation.textContent = current.answer.english || "";
    model.hidden = false;
    revealButton.hidden = true;
    assessmentButtons.forEach((button) => { button.hidden = false; });
    status.textContent = "Compare meaning and grammar, not exact wording.";
  }

  function recordResult(correct) {
    if (!current) return;
    window.MaltiMistakeStore?.recordAttempt({
      id: `about-me::${current.slug}`,
      setId: "about-me-self-check",
      itemId: current.slug,
      prompt: current.question.maltese,
      given: answer.value,
      correctAnswer: current.answer.maltese,
      explanation: "Build a personal answer with the same safe pattern; details may differ.",
      sourcePage: "about_me.html",
      topic: "Talking About Yourself",
      type: "speaking-self-assessment",
      category: "speaking",
      ruleId: "about-me"
    }, correct);
    assessmentButtons.forEach((button) => { button.hidden = true; });
    nextButton.hidden = false;
    status.textContent = correct
      ? "Marked as answered. Open mistakes still need two successful retries to resolve."
      : "Added to the Mistake Journal for another attempt.";
  }

  revealButton.addEventListener("click", revealModel);
  nextButton.addEventListener("click", nextQuestion);
  assessmentButtons.forEach((button) => {
    button.addEventListener("click", () => recordResult(button.dataset.practiceResult === "correct"));
  });

  fetch("./assets/data/about_me_examples.json")
    .then((response) => {
      if (!response.ok) throw new Error("Could not load the self-check bank.");
      return response.json();
    })
    .then((data) => {
      items = data.groups.find((group) => group.id === "about-me-questions")?.items || [];
      if (!items.length) throw new Error("The self-check bank is empty.");
      nextQuestion();
    })
    .catch((error) => {
      status.textContent = error.message;
      revealButton.disabled = true;
      answer.disabled = true;
    });
})();
