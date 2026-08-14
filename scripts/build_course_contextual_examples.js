const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const bindingsPath = path.join(root, "assets", "data", "course_target_bindings.json");
const glossesPath = path.join(root, "assets", "data", "course_target_glosses.json");
const examplesPath = path.join(root, "assets", "data", "course_target_examples.json");
const animalsPath = path.join(root, "assets", "data", "animals.json");
const checkOnly = process.argv.includes("--check");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const cleanGloss = (value) => String(value)
  .replace(/\s*\([^)]*\)/g, "")
  .replace(/\s*->.*$/, "")
  .replace(/\.$/, "")
  .split(/\s+\/\s+/)[0]
  .trim();
const result = (maltese, english, pattern) => ({ maltese, english, pattern, review: "reviewed-template" });
const capitalize = (value) => value.charAt(0).toLocaleUpperCase("mt") + value.slice(1);
const makeSet = (value) => new Set(value.split("|"));

const sets = {
  introMasculine: makeSet("ferħan|sportiv|ċajtier"),
  introFeminine: makeSet("ferħana|sportiva|ċajtiera"),
  residenceTransport: makeSet("rota|trakk|ħelikopter|vann|karozza|karozza tal-linja|mutur|vapur|kowċ|ajruplan"),
  residenceBy: makeSet("bil-mixi|bil-mutur|bir-rota|bil-vann|bil-karozza|bil-kowċ"),
  schoolClothes: makeSet("ċoff|qmis|dublett|ingravata|kalzetta|ġlekk|qalziet|żarbuna|uniformi|ilbies"),
  colourMasculine: makeSet("abjad|aħmar|isfar|aħdar|griż|iswed"),
  colourFeminine: makeSet("bajda|ħamra|safra|ħadra|griża|sewda"),
  colourInvariant: makeSet("kannella|oranġjo|roża|vjola|blu"),
  countries: makeSet("Malta|Italja|Ingilterra|Ġermanja|Spanja|Franza|Pakistan|Ukraina|Turkija|Portugall|Filippini|Indja|Ġappun|Libja|Awstralja|Ċina"),
  familyPeople: makeSet("aħwa|ħu|oħt|ġenituri|omm|missier|nanniet|nannu|nanna|ziju|zija|kuġin"),
  familyTimes: makeSet("filgħodu|f'nofsinhar|waranofsinhar|filgħaxija|billejl"),
  familyDays: makeSet("It-Tnejn|It-Tlieta|L-Erbgħa|Il-Ħamis|Il-Ġimgħa|Is-Sibt|Il-Ħadd"),
  familyGreetings: makeSet("Bonġu|Il-waranofsinhar it-tajjeb|Il-lejla t-tajba|Kif inti|Mhux ħażin|Ħu ħsieb"),
  schoolBagMasculine: makeSet("sabiħ|ikrah|kbir|żgħir|ġdid|qadim|modern|antik|ikkulurit|nadif"),
  schoolBagFeminine: makeSet("sabiħa|kerha|kbira|żgħira|ġdida|qadima|moderna|antika|ikkulurita|nadifa|maħmuġa"),
  schoolBagPlural: makeSet("sbieħ|koroh|kbar|żgħar|ġodda|qodma|moderni|antiki|ikkuluriti|nodfa"),
  numbers: makeSet("wieħed|tnejn|tlieta|erbgħa|ħamsa|sitta|sebgħa|tmienja|disgħa|għaxra|ħdax|tnax|tlettax|erbatax|ħmistax|sittax|sbatax|tmintax|dsatax|għoxrin"),
  seasons: makeSet("rebbiegħa|sajf|ħarifa|xitwa"),
  weatherAdjectives: makeSet("xemxi|imsaħħab"),
  recyclingMasculine: makeSet("nadif|maħmuġ|mimli|mormi|miftuħ|mqatta'"),
  recyclingFeminine: makeSet("nadifa|maħmuġa|mimlija|mormija|miftuħa|mqattgħa"),
  recyclingPlural: makeSet("nodfa|maħmuġin|mimlijin|mormijin|miftuħin|mqattgħin")
};

function pairs(rows) {
  return Object.fromEntries(rows.map(([key, maltese, english]) => [key, [maltese, english]]));
}

const imperativeExamples = pairs([
  ["qum", "Qum kmieni.", "Get up early."],
  ["qumu", "Qumu kmieni.", "Get up early, everyone."],
  ["poġġi", "Poġġi bilqiegħda.", "Sit down."],
  ["poġġu", "Poġġu bilqiegħda.", "Sit down, everyone."],
  ["ikteb", "Ikteb ismek.", "Write your name."],
  ["iktbu", "Iktbu isimkom.", "Write your names."],
  ["agħlaq", "Agħlaq il-bieb.", "Close the door."],
  ["agħlqu", "Agħlqu l-bieb.", "Close the door, everyone."],
  ["oħroġ", "Oħroġ barra.", "Go outside."],
  ["oħorġu", "Oħorġu barra.", "Go outside, everyone."],
  ["idħol", "Idħol fil-klassi.", "Enter the classroom."],
  ["idħlu", "Idħlu fil-klassi.", "Enter the classroom, everyone."],
  ["daħħal", "Daħħal il-ktieb fil-basket.", "Put the book in the bag."],
  ["daħħlu", "Daħħlu l-kotba fil-basket.", "Put the books in the bag."],
  ["aqra", "Aqra l-paġna.", "Read the page."],
  ["aqraw", "Aqraw il-paġna.", "Read the page, everyone."],
  ["iftaħ", "Iftaħ il-ktieb.", "Open the book."],
  ["iftħu", "Iftħu l-kotba.", "Open the books."],
  ["isimgħu", "Isimgħu lill-għalliem.", "Listen to the teacher."],
  ["staqsi", "Staqsi mistoqsija.", "Ask a question."],
  ["tkellem", "Tkellem bil-mod.", "Speak slowly."],
  ["agħmel", "Agħmel l-eżerċizzju.", "Do the exercise."]
]);

const hobbyVerbExamples = pairs([
  ["libes", "Ilbieraħ libes ġakketta.", "Yesterday he wore a jacket."],
  ["ilbes", "Ilbes ġakketta.", "Wear a jacket."],
  ["ilbsu", "Ilbsu l-ġkieket.", "Wear the jackets, everyone."],
  ["għamel", "Ilbieraħ għamel l-eżerċizzju.", "Yesterday he did the exercise."],
  ["agħmel", "Agħmel l-eżerċizzju.", "Do the exercise."],
  ["agħmlu", "Agħmlu l-eżerċizzju.", "Do the exercise, everyone."],
  ["uża", "Uża l-kalkulatur.", "Use the calculator."],
  ["użaw", "Użaw il-kalkulatur.", "Use the calculator, everyone."],
  ["għum", "Għum fil-pixxina.", "Swim in the pool."],
  ["imxi", "Imxi sal-pjazza.", "Walk to the square."],
  ["orqod", "Orqod kmieni.", "Sleep early."],
  ["qum", "Qum kmieni.", "Get up early."],
  ["ilgħab", "Ilgħab it-tenis.", "Play tennis."],
  ["ara", "Ara dan il-film.", "Watch this film."],
  ["oħroġ", "Oħroġ mal-ħbieb.", "Go out with friends."]
]);

const townDirections = pairs([
  ["Aqsam it-triq", "Aqsam it-triq bir-reqqa.", "Cross the road carefully."],
  ["Dur fuq ix-xellug", "Dur fuq ix-xellug ħdejn il-knisja.", "Turn left by the church."],
  ["Dur mal-kantuniera", "Dur mal-kantuniera u kompli miexi.", "Turn around the corner and keep walking."],
  ["Ieqaf", "Ieqaf ħdejn il-pjazza.", "Stop by the square."],
  ["Dur fuq il-lemin", "Dur fuq il-lemin ħdejn il-lukanda.", "Turn right by the hotel."],
  ["Imxi dritt", "Imxi dritt sal-pjazza.", "Go straight to the square."],
  ["Itla' 'l fuq", "Itla' 'l fuq sat-tieni sular.", "Go up to the second floor."],
  ["Inżel 'l isfel", "Inżel 'l isfel sal-pjan terran.", "Go down to the ground floor."]
]);

const recyclingVerbs = pairs([
  ["armi", "Armi l-karta fil-kontenitur.", "Throw the paper into the container."],
  ["armu", "Armu l-karta fil-kontenitur.", "Throw the paper into the container, everyone."],
  ["għażel", "Ilbieraħ għażel il-kontenitur it-tajjeb.", "Yesterday he chose the correct container."],
  ["agħżel", "Agħżel il-kontenitur it-tajjeb.", "Choose the correct container."],
  ["agħżlu", "Agħżlu l-kontenitur it-tajjeb.", "Choose the correct container, everyone."],
  ["waddab", "Waddab il-flixkun fil-kontenitur.", "Throw the bottle into the container."],
  ["waddbu", "Waddbu l-fliexken fil-kontenitur.", "Throw the bottles into the container, everyone."],
  ["issepara", "Issepara l-plastik mill-karta.", "Separate the plastic from the paper."],
  ["isseparaw", "Isseparaw il-plastik mill-karta.", "Separate the plastic from the paper, everyone."],
  ["ħareġ", "Ħareġ il-borża tal-iskart.", "He took out the rubbish bag."],
  ["oħroġ", "Oħroġ il-borża tal-iskart.", "Take out the rubbish bag."],
  ["oħorġu", "Oħorġu l-boroż tal-iskart.", "Take out the rubbish bags, everyone."]
]);

function contextualExample(target, gloss) {
  const word = target.sourceRequirement;
  const meaning = cleanGloss(gloss);
  switch (target.chapterId) {
    case "b1-introductions":
      if (sets.introMasculine.has(word)) return result(`Mario huwa ${word}.`, `Mario is ${meaning}.`, "person-adjective-masculine");
      if (sets.introFeminine.has(word)) return result(`Marija hija ${word}.`, `Marija is ${meaning}.`, "person-adjective-feminine");
      if (word === "huma") return result("Huma studenti.", "They are students.", "pronoun");
      if (word === "lemin" || word === "xellug") return result(`Dawwar lejn il-${word}.`, `Turn to the ${meaning}.`, "direction");
      if (word === "erbgħa") return result("In-numru tat-tweġiba huwa erbgħa.", "The answer number is four.", "number");
      if (word === "ieħor") return result("Nixtieq ktieb ieħor.", "I would like another book.", "adjective");
      if (word === "verità") return result("Din hija l-verità.", "This is the truth.", "abstract-noun");
      if (word === "waqfa") return result("Nieħu waqfa qasira.", "I take a short break.", "activity");
      return result(`Nara ${word} fl-istampa.`, `I see the ${meaning} in the picture.`, "picture-object");
    case "b1-residence":
      if (sets.residenceBy.has(word)) return result(`Immur ix-xogħol ${word}.`, `I go to work ${meaning}.`, "transport-method");
      if (sets.residenceTransport.has(word)) return result(`Nara ${word} fit-triq.`, `I see the ${meaning} in the street.`, "transport-object");
      return result(`Hemm ${word} qrib id-dar.`, `The ${meaning} is near the house.`, "place-near-home");
    case "b1-school":
      if (sets.schoolClothes.has(word)) return result(`Nilbes ${word} l-iskola.`, `I wear ${meaning} at school.`, "school-clothing");
      return result(`Hemm ${word} fil-bini.`, `The ${meaning} is in the building.`, "school-place");
    case "b1-animals":
      return result(`Nara ${word} fil-ġnien.`, `I see the ${meaning} in the garden.`, "animal-in-garden");
    case "b1-colours":
      if (sets.colourMasculine.has(word)) return result(`Il-flokk huwa ${word}.`, `The shirt is ${meaning}.`, "colour-masculine");
      if (sets.colourFeminine.has(word)) return result(`Il-kaxxa hija ${word}.`, `The box is ${meaning}.`, "colour-feminine");
      if (sets.colourInvariant.has(word)) return result(`Il-basket huwa ${word}.`, `The bag is ${meaning}.`, "colour-invariant");
      if (sets.countries.has(word)) return result(`Nitkellmu dwar ${word}.`, `We are talking about ${meaning}.`, "country");
      if (word === "bandiera") return result("Din hija bandiera.", "This is a flag.", "shape-object");
      if (word === "pajjiż") return result("Dan huwa pajjiż żgħir.", "This is a small country.", "shape-object");
      return result(`Nara ${word} fuq il-karta.`, `I see the ${meaning} on the paper.`, "shape-on-paper");
    case "b1-food":
      return result(`Nixtieq ${word}, jekk jogħġbok.`, `I would like the ${meaning}, please.`, "food-order");
    case "b1-family":
      if (sets.familyPeople.has(word)) return result(`Għandi ${word} fil-familja.`, `My family includes the ${meaning}.`, "family-member");
      if (sets.familyTimes.has(word)) return result(`Naħdem ${word}.`, `I work ${meaning}.`, "daily-time");
      if (word === "kmieni" || word === "tard") return result(`Inqum ${word}.`, `I get up ${meaning}.`, "routine-time");
      if (sets.familyDays.has(word)) return result(`Il-jum huwa ${word}.`, `The day is ${meaning}.`, "weekday");
      if (sets.familyGreetings.has(word)) return result(`Ngħid: “${word}”`, `I say: “${meaning}”`, "greeting");
      if (word === "tmiem il-ġimgħa") return result("Nistrieħ fi tmiem il-ġimgħa.", "I rest at the weekend.", "weekend");
      if (["tenis", "passeġġata", "żfin"].includes(word)) return result(`Inħobb ${word}.`, `I like ${meaning}.`, "family-activity");
      return result(`Hemm ${word} qrib id-dar.`, `The ${meaning} is near the house.`, "family-place");
    case "b2-school-bag":
      if (sets.schoolBagMasculine.has(word)) return result(`Il-ktieb huwa ${word}.`, `The book is ${meaning}.`, "object-adjective-masculine");
      if (sets.schoolBagFeminine.has(word)) return result(`Il-karta hija ${word}.`, `The paper is ${meaning}.`, "object-adjective-feminine");
      if (sets.schoolBagPlural.has(word)) return result(`Il-kotba huma ${word}.`, `The books are ${meaning}.`, "object-adjective-plural");
      return result(`Hemm ${word} fil-basket tal-iskola.`, `The school bag contains the ${meaning}.`, "school-bag-object");
    case "b2-imperative": {
      const command = imperativeExamples[word];
      if (command) return result(command[0], command[1], "classroom-command");
      if (sets.numbers.has(word)) return result(`In-numru huwa ${word}.`, `The number is ${meaning}.`, "number");
      break;
    }
    case "b2-weather":
      if (word === "temperatura") return result("It-temperatura hija għoxrin grad.", "The temperature is twenty degrees.", "temperature");
      if (word === "istaġun") return result("Istaġun ġdid jibda dalwaqt.", "A new season starts soon.", "season");
      if (word === "staġuni") return result("Hemm erba' staġuni.", "There are four seasons.", "seasons");
      if (sets.seasons.has(word)) return result(`L-istaġun favorit tiegħi huwa ${word}.`, `My favourite season is ${meaning}.`, "named-season");
      if (sets.weatherAdjectives.has(word)) return result(`It-temp huwa ${word}.`, `The weather is ${meaning}.`, "weather-adjective");
      if (word === "l-ogħla temperatura") return result("L-ogħla temperatura hija tletin grad.", "The highest temperature is thirty degrees.", "temperature-range");
      if (word === "l-inqas temperatura") return result("L-inqas temperatura hija għaxar gradi.", "The lowest temperature is ten degrees.", "temperature-range");
      return result(`Illum hemm ħafna ${word}.`, `Today there is a lot of ${meaning}.`, "weather-today");
    case "b2-clothes":
      if (sets.numbers.has(word)) return result(`In-numru huwa ${word}.`, `The number is ${meaning}.`, "number");
      return result(`Illum se nilbes ${word}.`, `Today I will wear the ${meaning}.`, "clothing-choice");
    case "b2-hobbies": {
      const verb = hobbyVerbExamples[word];
      if (verb) return result(verb[0], verb[1], "hobby-verb");
      if (word.startsWith("se ")) return result(`${capitalize(word)} għada.`, `${capitalize(meaning)} tomorrow.`, "future-plan");
      break;
    }
    case "b2-town": {
      const direction = townDirections[word];
      if (direction) return result(direction[0], direction[1], "town-direction");
      if (word.startsWith("pastizz")) return result(`Nixtieq ${word}, jekk jogħġbok.`, `I would like the ${meaning}, please.`, "town-order");
      return result(`Hemm ${word} fil-pjazza.`, `The ${meaning} is in the square.`, "town-place");
    }
    case "b2-recycling": {
      const verb = recyclingVerbs[word];
      if (verb) return result(verb[0], verb[1], "recycling-action");
      if (word === "jinten") return result("Il-kontenitur jinten.", "The container stinks.", "recycling-state");
      if (word === "tinten") return result("Il-borża tinten.", "The bag stinks.", "recycling-state");
      if (word === "jintnu") return result("Il-kontenituri jintnu.", "The containers stink.", "recycling-state");
      if (sets.recyclingMasculine.has(word)) return result(`Il-kontenitur huwa ${word}.`, `The container is ${meaning}.`, "recycling-adjective-masculine");
      if (sets.recyclingFeminine.has(word)) return result(`Il-borża hija ${word}.`, `The bag is ${meaning}.`, "recycling-adjective-feminine");
      if (sets.recyclingPlural.has(word)) return result(`Il-kontenituri huma ${word}.`, `The containers are ${meaning}.`, "recycling-adjective-plural");
      return result(`Hemm ${word} fil-kontenitur.`, `The container contains the ${meaning}.`, "recycling-material");
    }
    default:
      break;
  }
  throw new Error(`No contextual example pattern for ${target.chapterId}::${word}`);
}

function buildExamples() {
  const targets = readJson(bindingsPath).targets;
  const glosses = readJson(glossesPath).glosses;
  const examples = {};
  targets.forEach((target) => {
    const key = `${target.chapterId}::${target.sourceRequirement}`;
    examples[key] = contextualExample(target, glosses[key]);
  });
  return {
    schemaVersion: 1,
    generatedFrom: ["assets/data/course_target_bindings.json", "assets/data/course_target_glosses.json"],
    description: "Short authored contexts for every audited B1/B2 course target.",
    examples
  };
}

function buildAnimals() {
  const animals = readJson(animalsPath);
  animals.groups.forEach((group) => group.items.forEach((item) => {
    item.example = `Nara ${item.maltese} fil-ġnien.`;
    item.exampleTranslation = `I see the ${cleanGloss(item.english)} in the garden.`;
  }));
  return animals;
}

const serializedExamples = `${JSON.stringify(buildExamples(), null, 2)}\n`;
const serializedAnimals = `${JSON.stringify(buildAnimals(), null, 2)}\n`;
if (checkOnly) {
  const errors = [];
  if (!fs.existsSync(examplesPath) || fs.readFileSync(examplesPath, "utf8") !== serializedExamples) errors.push("course_target_examples.json");
  if (fs.readFileSync(animalsPath, "utf8") !== serializedAnimals) errors.push("animals.json");
  if (errors.length) {
    console.error(`Contextual examples are stale: ${errors.join(", ")}. Run npm run course:examples:build.`);
    process.exit(1);
  }
  console.log("Contextual examples are synchronized: 462 course targets and 60 animal cards.");
} else {
  fs.writeFileSync(examplesPath, serializedExamples, "utf8");
  fs.writeFileSync(animalsPath, serializedAnimals, "utf8");
  console.log("Wrote contextual examples for 462 course targets and 60 animal cards.");
}
