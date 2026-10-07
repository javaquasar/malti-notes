(() => {
  const DRAFT_KEY = "malti_about_me_draft_v1";
  const PROGRESS_KEY = "malti_about_me_progress_v1";
  const form = document.querySelector("[data-about-me-form]");
  const output = document.querySelector("[data-about-me-output]");
  const builderStatus = document.querySelector("[data-about-me-builder-status]");
  const storage = window.MaltiStorage;
  const fields = [
    "name", "age", "origin", "residence", "years", "occupation",
    "workDetail", "gender", "relationship", "spouseName", "children", "hobbies",
    "child1Name", "child1Gender", "child1Age", "child2Name", "child2Gender", "child2Age",
    "storyVersion", "copyFormat", "showEnglish", "numberWords", "includeDuration", "includeDuties",
    "includeFamily", "includeChildDetails", "includeHobbies", "originEnglish", "residenceEnglish",
    "occupationEnglish", "workDetailEnglish", "hobbiesEnglish", "childrenSchool", "familyLikesMalta", "learningReason"
  ];
  const topics = [
    { id: "name", label: "Name", field: "name", question: "What is your name?", help: "Use Jisimni followed by your name.", placeholder: "Alex" },
    { id: "age", label: "Age", field: "age", question: "How old are you?", help: "Enter your age as a number. The story builder supplies the sentence pattern.", type: "number", placeholder: "35" },
    { id: "origin", label: "Origin", field: "origin", question: "Where are you from?", help: "Choose a ready-made form or enter the phrase that follows Jien.", optionGroup: "countries", placeholder: "mill-Italja" },
    { id: "residence", label: "Home", field: "residence", question: "Where do you live?", help: "Choose a Maltese place form or enter the phrase that follows Noqgħod.", optionGroup: "places", placeholder: "il-Mosta" },
    { id: "duration", label: "Time in Malta", field: "years", question: "How long have you lived in Malta?", help: "Enter the number of years.", type: "number", placeholder: "5" },
    { id: "occupation", label: "Occupation", field: "occupation", question: "What do you do for work?", help: "Choose a ready-made form or enter the occupation after Naħdem bħala.", optionGroup: "occupations", placeholder: "għalliem" },
    { id: "duties", label: "Work duties", field: "workDetail", question: "What do you do at work?", help: "Begin with a verb in the first person.", placeholder: "ngħallem il-Malti u nipprepara l-lezzjonijiet" },
    { id: "family", label: "Family status", field: "relationship", question: "Would you like to mention your relationship status?", help: "The builder changes the Maltese ending with the speaker form.", choices: [["", "Skip this detail"], ["married", "Married"], ["not-married", "Not married"]] },
    { id: "children", label: "Children", field: "children", question: "Would you like to mention children?", help: "Choose the number of children and their details.", choices: [["", "Skip this detail"], ["none", "No children"], ["one", "One child"], ["two", "Two children"]] },
    { id: "hobbies", label: "Hobbies", field: "hobbies", question: "What do you like doing in your free time?", help: "Enter one or more verbs after nħobb.", placeholder: "naqra u nimxi ħdejn il-baħar" }
  ];
  const itemTopic = {
    name: "name", age: "age", origin: "origin", residence: "residence", duration: "duration",
    occupation: "occupation", "work-duties": "duties", "marital-status": "family",
    children: "children", hobbies: "hobbies"
  };
  let optionData = { countries: [], places: [], occupations: [] };
  let selectedOccupation = "";
  let personalIndex = 0;
  let personalRevealed = false;

  function clean(value) {
    return String(value || "").trim().replace(/[.!?]+$/, "");
  }

  function valuesFromForm() {
    return Object.fromEntries(fields.map((name) => {
      const field = form?.elements[name];
      return [name, field?.type === "checkbox" ? field.checked : field?.value || ""];
    }));
  }

  function applyValues(values) {
    if (!form || !values) return;
    if (values.children === "son" || values.children === "daughter") {
      values = { ...values, children: "one", child1Gender: values.child1Gender || (values.children === "daughter" ? "female" : "male") };
    }
    fields.forEach((name) => {
      const field = form.elements[name];
      if (!field || values[name] === undefined) return;
      if (field.type === "checkbox") field.checked = values[name] === true;
      else field.value = values[name];
    });
  }

  function buildStory(values) {
    return window.MaltiStoryCore.rows(values, optionData).map((row) => row.maltese);
  }

  function renderPersonalPractice(reset = false) {
    const panel = document.querySelector("[data-personal-practice]");
    if (!panel) return;
    const rows = window.MaltiStoryCore.rows(valuesFromForm(), optionData);
    if (reset) { personalIndex = 0; personalRevealed = false; }
    personalIndex = rows.length ? personalIndex % rows.length : 0;
    const row = rows[personalIndex];
    panel.querySelector("[data-personal-position]").textContent = row ? `${personalIndex + 1} / ${rows.length}` : "Add details to your story first.";
    panel.querySelector("[data-personal-question]").textContent = row?.question || "";
    panel.querySelector("[data-personal-translation]").textContent = row?.questionEnglish || "";
    const support = panel.querySelector("[data-personal-support]").value;
    const answer = panel.querySelector("[data-personal-answer]");
    answer.textContent = row ? (personalRevealed || support === "model" ? row.maltese : support === "keywords" ? row.maltese.split(/\s+/).filter((_, index) => index % 3 === 0).join(" / ") : "") : "";
    answer.hidden = !answer.textContent;
    panel.querySelector("[data-personal-reveal]").disabled = !row || personalRevealed || support === "model";
    panel.querySelector("[data-personal-next]").disabled = !row;
  }

  function renderStory() {
    if (!output || !form) return;
    const count = window.MaltiStoryCore.childCount(form.elements.children.value);
    form.querySelectorAll("[data-child-fields]").forEach((fieldset) => {
      fieldset.hidden = Number(fieldset.dataset.childFields) > count;
      fieldset.disabled = fieldset.hidden;
    });
    const values = valuesFromForm();
    const lines = window.MaltiStoryCore.rows(values, optionData);
    const words = lines.reduce((total, row) => total + row.maltese.split(/\s+/).length, 0);
    document.querySelector("[data-story-length]").textContent = `${lines.length} sentences · ${words} words · about ${Math.max(1, Math.round(words / 100 * 60))} seconds at 100 words/min`;
    renderPersonalPractice(true);
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
      paragraph.lang = "mt";
      paragraph.textContent = line.maltese;
      if (values.showEnglish) {
        const translation = document.createElement("span");
        translation.lang = "en";
        translation.className = "about-me-story-english";
        translation.textContent = line.english || "English translation needed.";
        paragraph.appendChild(translation);
      }
      output.appendChild(paragraph);
    });
  }

  function setBuilderStatus(message) {
    if (builderStatus) builderStatus.textContent = message;
  }

  function loadSample() {
    applyValues({
      name: "Alex", age: "35", origin: "mill-Italja", residence: "il-Mosta", years: "5",
      occupation: "għalliem", workDetail: "ngħallem il-Malti u nipprepara l-lezzjonijiet",
      gender: "male", relationship: "married", spouseName: "Sara", children: "two",
      child1Name: "Luca", child1Gender: "male", child1Age: "9", child2Name: "Maya", child2Gender: "female", child2Age: "6",
      hobbies: "naqra u nimxi ħdejn il-baħar",
      originEnglish: "", residenceEnglish: "", occupationEnglish: "",
      workDetailEnglish: "I teach Maltese and prepare lessons", hobbiesEnglish: "read and walk by the sea"
    });
    selectedOccupation = "teacher";
    syncSmartControls();
    renderStory();
    setBuilderStatus("Sample loaded. Replace any details with your own Maltese phrases.");
  }

  async function copyStory() {
    try {
      const values = valuesFromForm();
      const text = window.MaltiStoryCore.copyText(window.MaltiStoryCore.rows(values, optionData), values.copyFormat === "bilingual");
      if (!text) return setBuilderStatus("Add at least one detail before copying.");
      await navigator.clipboard.writeText(text);
      setBuilderStatus(values.copyFormat === "bilingual" ? "Story copied with English translation." : "Maltese story copied.");
    } catch (error) {
      setBuilderStatus(error.message.startsWith("Add the missing") ? error.message : "Copy is unavailable in this browser. Select the story text instead.");
    }
  }

  document.querySelector("[data-personal-support]")?.addEventListener("change", () => { personalRevealed = false; renderPersonalPractice(); });
  document.querySelector("[data-personal-reveal]")?.addEventListener("click", () => { personalRevealed = true; renderPersonalPractice(); });
  document.querySelector("[data-personal-next]")?.addEventListener("click", () => { personalIndex++; personalRevealed = false; renderPersonalPractice(); });

  function defaultProgress() {
    return {
      schemaVersion: 1,
      topics: Object.fromEntries(topics.map(({ id }) => [id, { status: "not-practised", attempts: 0, successes: 0, updatedAt: "" }])),
      practice: { question: 0, translation: 0, keywords: 0, timed: 0 },
      updatedAt: ""
    };
  }

  let progress = defaultProgress();

  function loadProgress() {
    const saved = storage?.getJson(PROGRESS_KEY, null);
    if (!saved || typeof saved !== "object") return;
    topics.forEach(({ id }) => {
      if (saved.topics?.[id]) progress.topics[id] = { ...progress.topics[id], ...saved.topics[id] };
    });
    progress.practice = { ...progress.practice, ...(saved.practice || {}) };
    progress.updatedAt = saved.updatedAt || "";
  }

  function saveProgress() {
    progress.updatedAt = new Date().toISOString();
    storage?.setJson(PROGRESS_KEY, progress);
    window.dispatchEvent(new CustomEvent("malti-progress-change"));
  }

  function updateTopic(id, status, result) {
    const topic = progress.topics[id];
    if (!topic) return;
    if (result) {
      topic.attempts += 1;
      if (result === "correct") topic.successes += 1;
      if (result === "incorrect") topic.status = "learning";
      if (result === "correct" && topic.successes >= 2) topic.status = "confident";
      if (result === "correct" && topic.status === "not-practised") topic.status = "learning";
    } else {
      topic.status = status;
    }
    topic.updatedAt = new Date().toISOString();
    saveProgress();
    renderCoverage();
  }

  function renderCoverage() {
    const container = document.querySelector("[data-about-me-coverage]");
    if (!container) return;
    container.innerHTML = "";
    topics.forEach(({ id, label }) => {
      const state = progress.topics[id];
      const row = document.createElement("div");
      row.className = "about-me-coverage-row";
      row.dataset.coverageTopic = id;
      const copy = document.createElement("div");
      const strong = document.createElement("strong");
      const meta = document.createElement("span");
      strong.textContent = label;
      meta.textContent = `${state.attempts} ${state.attempts === 1 ? "attempt" : "attempts"}`;
      copy.append(strong, meta);
      const control = document.createElement("div");
      control.className = "segmented-toggle about-me-status-control";
      control.setAttribute("aria-label", `${label} status`);
      [["not-practised", "Not practised"], ["learning", "Learning"], ["confident", "Confident"]].forEach(([value, text]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "toggle-chip";
        button.textContent = text;
        button.dataset.coverageStatus = value;
        button.setAttribute("aria-pressed", String(state.status === value));
        button.addEventListener("click", () => updateTopic(id, value));
        control.appendChild(button);
      });
      row.append(copy, control);
      container.appendChild(row);
    });
  }

  function fillSelect(select, items) {
    if (!select) return;
    const firstText = select.options[0]?.textContent || "Choose a ready-made form";
    select.innerHTML = "";
    select.add(new Option(firstText, ""));
    items.forEach((item) => select.add(new Option(item.label, item.id)));
  }

  function occupationPhrase(item) {
    return item?.[form?.elements.gender?.value === "female" ? "female" : "male"] || "";
  }

  function syncSmartControls() {
    const origin = document.querySelector("[data-smart-origin]");
    const residence = document.querySelector("[data-smart-residence]");
    const occupation = document.querySelector("[data-smart-occupation]");
    if (origin) origin.value = optionData.countries.find((item) => item.phrase === form?.elements.origin?.value)?.id || "";
    if (residence) residence.value = optionData.places.find((item) => item.phrase === form?.elements.residence?.value)?.id || "";
    if (occupation) occupation.value = selectedOccupation;
  }

  function setupSmartControls() {
    const origin = document.querySelector("[data-smart-origin]");
    const residence = document.querySelector("[data-smart-residence]");
    const occupation = document.querySelector("[data-smart-occupation]");
    fillSelect(origin, optionData.countries);
    fillSelect(residence, optionData.places);
    fillSelect(occupation, optionData.occupations);
    [[origin, "origin", optionData.countries], [residence, "residence", optionData.places]].forEach(([select, field, items]) => {
      select?.addEventListener("change", () => {
        const item = items.find(({ id }) => id === select.value);
        if (item) form.elements[field].value = item.phrase;
        renderStory();
      });
    });
    occupation?.addEventListener("change", () => {
      selectedOccupation = occupation.value;
      const item = optionData.occupations.find(({ id }) => id === selectedOccupation);
      if (item) form.elements.occupation.value = occupationPhrase(item);
      renderStory();
    });
    form?.elements.gender?.addEventListener("change", () => {
      const item = optionData.occupations.find(({ id }) => id === selectedOccupation);
      if (item) form.elements.occupation.value = occupationPhrase(item);
      renderStory();
    });
    syncSmartControls();
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
      selectedOccupation = "";
      storage?.remove(DRAFT_KEY);
      syncSmartControls();
      renderStory();
      setBuilderStatus("Draft cleared from this browser.");
    });
    renderStory();
  }

  loadProgress();
  renderCoverage();

  const guided = document.querySelector("[data-about-me-guided]");
  let guidedIndex = 0;

  function optionPhrase(group, item) {
    return group === "occupations" ? occupationPhrase(item) : item.phrase;
  }

  function updateGuidedPreview() {
    if (!guided) return;
    const topic = topics[guidedIndex];
    const nextValues = { ...valuesFromForm(), [topic.field]: guided.querySelector("[data-guided-input]")?.value || "" };
    const preview = guided.querySelector("[data-guided-preview]");
    preview.textContent = buildStory(nextValues).join(" ") || "Your introduction will appear here as you add details.";
  }

  function renderGuided() {
    if (!guided) return;
    const topic = topics[guidedIndex];
    guided.querySelector("[data-guided-step]").textContent = `Step ${guidedIndex + 1} of ${topics.length}`;
    guided.querySelector("[data-guided-question]").textContent = topic.question;
    guided.querySelector("[data-guided-help]").textContent = topic.help;
    const control = guided.querySelector("[data-guided-control]");
    control.innerHTML = "";
    let input;
    if (topic.choices) {
      input = document.createElement("select");
      topic.choices.forEach(([value, label]) => input.add(new Option(label, value)));
    } else {
      input = document.createElement("input");
      input.type = topic.type || "text";
      if (input.type === "number") {
        input.min = "1";
        input.max = topic.id === "age" ? "120" : "99";
      }
      input.placeholder = topic.placeholder || "";
    }
    input.dataset.guidedInput = "";
    input.setAttribute("aria-label", topic.question);
    input.value = form?.elements[topic.field]?.value || "";
    if (topic.optionGroup) {
      const select = document.createElement("select");
      select.dataset.guidedOptions = topic.optionGroup;
      select.add(new Option("Choose a ready-made form", ""));
      optionData[topic.optionGroup].forEach((item) => select.add(new Option(item.label, item.id)));
      select.addEventListener("change", () => {
        const item = optionData[topic.optionGroup].find(({ id }) => id === select.value);
        if (item) input.value = optionPhrase(topic.optionGroup, item);
        updateGuidedPreview();
      });
      control.append(select);
    }
    control.append(input);
    input.addEventListener("input", updateGuidedPreview);
    input.addEventListener("change", updateGuidedPreview);
    if (topic.id === "children") {
      const childControls = document.createElement("div");
      childControls.className = "about-me-form-grid";
      control.append(childControls);
      const renderChildren = () => {
        childControls.replaceChildren();
        const count = window.MaltiStoryCore.childCount(input.value);
        for (let index = 1; index <= count; index++) {
          [["Name", "text"], ["Gender", "select"], ["Age", "number"]].forEach(([suffix, type]) => {
            const field = `child${index}${suffix}`;
            const label = document.createElement("label"); label.className = "about-me-field"; label.textContent = `Child ${index} ${suffix.toLowerCase()}`;
            const childInput = document.createElement(type === "select" ? "select" : "input");
            if (type === "select") { childInput.add(new Option("Boy", "male")); childInput.add(new Option("Girl", "female")); }
            else { childInput.type = type; if (type === "number") { childInput.min = "0"; childInput.max = "120"; childInput.step = "1"; } }
            childInput.value = form.elements[field].value;
            childInput.setAttribute("aria-label", label.textContent);
            const update = () => { form.elements[field].value = childInput.value; updateGuidedPreview(); };
            childInput.addEventListener("input", update); childInput.addEventListener("change", update);
            label.append(childInput); childControls.append(label);
          });
        }
      };
      input.addEventListener("change", renderChildren); renderChildren();
    }
    guided.querySelector("[data-guided-back]").disabled = guidedIndex === 0;
    guided.querySelector("[data-guided-next]").textContent = guidedIndex === topics.length - 1 ? "Finish Story" : "Save and Continue";
    guided.querySelector("[data-guided-builder]").hidden = true;
    const progressBar = guided.querySelector("[data-guided-progress]");
    progressBar.setAttribute("aria-valuenow", String(guidedIndex));
    guided.querySelector("[data-guided-progress-bar]").style.width = `${(guidedIndex / topics.length) * 100}%`;
    updateGuidedPreview();
  }

  function commitGuidedStep(skip = false) {
    const topic = topics[guidedIndex];
    const value = skip ? "" : guided.querySelector("[data-guided-input]")?.value || "";
    if (form?.elements[topic.field]) form.elements[topic.field].value = value;
    if (!skip && value) updateTopic(topic.id, "learning");
    renderStory();
    if (guidedIndex < topics.length - 1) {
      guidedIndex += 1;
      renderGuided();
      guided.querySelector("[data-guided-status]").textContent = skip ? "Step skipped. You can return to it later." : `${topic.label} added to your story.`;
    } else {
      const progressBar = guided.querySelector("[data-guided-progress]");
      progressBar.setAttribute("aria-valuenow", String(topics.length));
      guided.querySelector("[data-guided-progress-bar]").style.width = "100%";
      guided.querySelector("[data-guided-builder]").hidden = false;
      guided.querySelector("[data-guided-status]").textContent = "Your guided story is ready. Continue in the full builder to refine or save it locally.";
    }
  }

  if (guided) {
    const gender = guided.querySelector("[data-guided-gender]");
    gender.value = form?.elements.gender?.value || "male";
    gender.addEventListener("change", () => {
      form.elements.gender.value = gender.value;
      form.elements.gender.dispatchEvent(new Event("change", { bubbles: true }));
      renderGuided();
    });
    guided.querySelector("[data-guided-back]").addEventListener("click", () => {
      if (guidedIndex > 0) guidedIndex -= 1;
      renderGuided();
    });
    guided.querySelector("[data-guided-skip]").addEventListener("click", () => commitGuidedStep(true));
    guided.querySelector("[data-guided-next]").addEventListener("click", () => commitGuidedStep(false));
    renderGuided();
  }

  const practice = document.querySelector("[data-about-me-practice]");
  if (!practice) return;
  const practiceCard = practice.querySelector("[data-practice-card]");
  const timedPanel = practice.querySelector("[data-practice-timed]");
  const practiceLabel = practice.querySelector("[data-practice-label]");
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
  const modeButtons = [...document.querySelectorAll("[data-practice-mode]")];
  let items = [];
  let queue = [];
  let current = null;
  let mode = "question";
  let timerDuration = 30;
  let timerRemaining = 30;
  let timerId = null;

  function shuffle(values) {
    const result = values.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  function promptFor(item) {
    if (mode === "translation") return { label: "English to Maltese", prompt: item.answer.english, help: "Say the complete sentence in Maltese." };
    if (mode === "keywords") return { label: "Keywords", prompt: item.keywords || item.answer.english, help: "Build a natural Maltese sentence from these ideas." };
    return { label: "Question", prompt: item.question.maltese, help: item.question.english || "" };
  }

  function nextQuestion() {
    if (!items.length) return;
    if (!queue.length) queue = shuffle(items.map((_, index) => index));
    current = items[queue.shift()];
    const prompt = promptFor(current);
    practiceLabel.textContent = prompt.label;
    question.textContent = prompt.prompt;
    translation.textContent = prompt.help;
    answer.value = "";
    model.hidden = true;
    nextButton.hidden = true;
    assessmentButtons.forEach((button) => { button.hidden = true; });
    revealButton.hidden = false;
    status.textContent = "Say the answer aloud or write your own version, then reveal the model.";
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
    const idSuffix = mode === "question" ? current.slug : `${mode}::${current.slug}`;
    window.MaltiMistakeStore?.recordAttempt({
      id: `about-me::${idSuffix}`,
      setId: `about-me-${mode}`,
      itemId: idSuffix,
      prompt: question.textContent,
      given: answer.value,
      correctAnswer: current.answer.maltese,
      explanation: "Build a personal answer with the same safe pattern; details may differ.",
      sourcePage: "about_me.html",
      topic: "Talking About Yourself",
      type: "speaking-self-assessment",
      category: "speaking",
      ruleId: "about-me"
    }, correct);
    progress.practice[mode] += 1;
    updateTopic(itemTopic[current.slug], null, correct ? "correct" : "incorrect");
    assessmentButtons.forEach((button) => { button.hidden = true; });
    nextButton.hidden = false;
    status.textContent = correct ? "Recorded. Two successful attempts mark this topic confident." : "Added to the Mistake Journal for another attempt.";
  }

  function setMode(nextMode) {
    mode = nextMode;
    modeButtons.forEach((button) => {
      const active = button.dataset.practiceMode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const timed = mode === "timed";
    practiceCard.hidden = timed;
    timedPanel.hidden = !timed;
    queue = [];
    if (!timed) nextQuestion();
    if (timed) resetTimer();
  }

  function timerTopics() {
    const count = timerDuration === 30 ? 5 : timerDuration === 60 ? 9 : 10;
    return topics.slice(0, count);
  }

  function formatTime(seconds) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function renderTimer() {
    practice.querySelector("[data-timer-display]").textContent = formatTime(timerRemaining);
    const checklist = practice.querySelector("[data-timer-checklist]");
    checklist.innerHTML = "";
    timerTopics().forEach((topic) => {
      const item = document.createElement("li");
      item.textContent = topic.label;
      checklist.appendChild(item);
    });
  }

  function stopTimer(finished = false) {
    if (timerId) clearInterval(timerId);
    timerId = null;
    practice.querySelector("[data-timer-start]").disabled = false;
    practice.querySelector("[data-timer-stop]").disabled = true;
    [...practice.querySelectorAll("[data-timer-result]")].forEach((button) => { button.hidden = !finished; });
    if (finished) status.textContent = "Time is up. Mark whether you completed the story.";
  }

  function resetTimer() {
    stopTimer(false);
    timerRemaining = timerDuration;
    renderTimer();
    status.textContent = "Use the checklist as prompts, then start when you are ready.";
  }

  function startTimer() {
    if (timerId) return;
    if (timerRemaining <= 0) timerRemaining = timerDuration;
    practice.querySelector("[data-timer-start]").disabled = true;
    practice.querySelector("[data-timer-stop]").disabled = false;
    [...practice.querySelectorAll("[data-timer-result]")].forEach((button) => { button.hidden = true; });
    status.textContent = "Speak now. Keep moving even if one detail is imperfect.";
    timerId = setInterval(() => {
      timerRemaining -= 1;
      renderTimer();
      if (timerRemaining <= 0) stopTimer(true);
    }, 1000);
  }

  function recordTimedResult(correct) {
    progress.practice.timed += 1;
    saveProgress();
    [...practice.querySelectorAll("[data-timer-result]")].forEach((button) => { button.hidden = true; });
    status.textContent = correct ? "Timed story completed and recorded." : "Attempt recorded. Shorten the story or practise one missing topic, then try again.";
  }

  revealButton.addEventListener("click", revealModel);
  nextButton.addEventListener("click", nextQuestion);
  assessmentButtons.forEach((button) => button.addEventListener("click", () => recordResult(button.dataset.practiceResult === "correct")));
  modeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.practiceMode)));
  practice.querySelector("[data-timer-start]").addEventListener("click", startTimer);
  practice.querySelector("[data-timer-stop]").addEventListener("click", () => stopTimer(true));
  practice.querySelector("[data-timer-reset]").addEventListener("click", resetTimer);
  [...practice.querySelectorAll("[data-timer-duration]")].forEach((button) => {
    button.addEventListener("click", () => {
      timerDuration = Number(button.dataset.timerDuration);
      [...practice.querySelectorAll("[data-timer-duration]")].forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle("is-active", active);
        candidate.setAttribute("aria-pressed", String(active));
      });
      resetTimer();
    });
  });
  [...practice.querySelectorAll("[data-timer-result]")].forEach((button) => button.addEventListener("click", () => recordTimedResult(button.dataset.timerResult === "correct")));

  Promise.all([
    fetch("./assets/data/about_me_examples.json").then((response) => {
      if (!response.ok) throw new Error("Could not load the self-check bank.");
      return response.json();
    }),
    fetch("./assets/data/about_me_options.json").then((response) => {
      if (!response.ok) throw new Error("Could not load the ready-made forms.");
      return response.json();
    })
  ]).then(([data, options]) => {
    items = data.groups.find((group) => group.id === "about-me-questions")?.items || [];
    if (!items.length) throw new Error("The self-check bank is empty.");
    optionData = options;
    setupSmartControls();
    renderStory();
    renderGuided();
    nextQuestion();
    practice.dataset.aboutMeReady = "true";
  }).catch((error) => {
    status.textContent = error.message;
    revealButton.disabled = true;
    answer.disabled = true;
  });

  window.MaltiAboutMe = {
    getProgress: () => JSON.parse(JSON.stringify(progress)),
    getStory: () => buildStory(valuesFromForm()),
    getStoryRows: () => window.MaltiStoryCore.rows(valuesFromForm(), optionData),
    finishTimer: () => {
      timerRemaining = 0;
      renderTimer();
      stopTimer(true);
    }
  };
})();
