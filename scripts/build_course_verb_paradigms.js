const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const inventoryPath = path.join(root, "assets", "data", "book_coverage_inventory.json");
const outputPath = path.join(root, "assets", "data", "course_verb_paradigms.json");
const checkOnly = process.argv.includes("--check");

const meanings = {
  "b1-qaghad": "to live / stay",
  "b1-gie": "to come",
  "b1-ra": "to see",
  "b1-ghandu": "to have",
  "b1-kiel": "to eat",
  "b1-habb": "to love / like",
  "b1-qam": "to get up",
  "b1-raqad": "to sleep",
  "b1-laghba": "to play",
  "b1-mar": "to go",
  "b2-libes": "to wear / get dressed",
  "b2-ghamel": "to do / make",
  "b2-uza": "to use",
  "b2-rema": "to throw away",
  "b2-ghazel": "to choose",
  "b2-waddab": "to throw",
  "b2-issepara": "to separate",
  "b2-hareg": "to go out"
};

const presentPeople = [
  ["jien", "I"],
  ["int", "you (singular)"],
  ["hu", "he"],
  ["aħna", "we"],
  ["intom", "you (plural)"],
  ["huma", "they"]
];

const havePeople = [
  ["jien", "I"],
  ["int", "you (singular)"],
  ["hu", "he"],
  ["hi", "she"],
  ["aħna", "we"],
  ["intom", "you (plural)"],
  ["huma", "they"]
];

const pastFirst = new Set(["b2-rema", "b2-ghazel"]);
const imperativeLast = new Set([
  "b2-ghamel",
  "b2-uza",
  "b2-rema",
  "b2-ghazel",
  "b2-waddab",
  "b2-issepara",
  "b2-hareg"
]);

function thirdPersonPhrase(phrase) {
  const [verb, ...rest] = phrase.split(" ");
  let conjugated = verb;
  if (verb === "have") conjugated = "has";
  else if (verb === "do") conjugated = "does";
  else if (verb.endsWith("y") && !/[aeiou]y$/.test(verb)) conjugated = `${verb.slice(0, -1)}ies`;
  else if (/(s|sh|ch|x|z|o)$/.test(verb)) conjugated = `${verb}es`;
  else conjugated = `${verb}s`;
  return [conjugated, ...rest].join(" ");
}

function conjugatedMeaning(subject, meaning) {
  const phrases = meaning.replace(/^to\s+/, "").split(" / ");
  const conjugated = subject === "he" || subject === "she"
    ? phrases.map(thirdPersonPhrase)
    : phrases;
  return `${subject} ${conjugated.join(" / ")}`;
}

function makeForms(paradigm) {
  const meaning = meanings[paradigm.id];
  if (!meaning) throw new Error(`Missing meaning for ${paradigm.id}`);

  const sourceForms = [...paradigm.forms];
  const forms = [];
  if (pastFirst.has(paradigm.id)) {
    forms.push({
      form: sourceForms.shift(),
      mode: "past",
      person: "hu / hi",
      englishPrompt: `past form: ${meaning}`
    });
  }

  const imperativeForms = imperativeLast.has(paradigm.id) ? sourceForms.splice(-2) : [];
  const people = paradigm.id === "b1-ghandu" ? havePeople : presentPeople;
  if (sourceForms.length !== people.length) {
    throw new Error(`${paradigm.id}: expected ${people.length} present forms, found ${sourceForms.length}`);
  }

  sourceForms.forEach((form, index) => {
    const [person, subject] = people[index];
    forms.push({
      form,
      mode: "present",
      person,
      englishPrompt: conjugatedMeaning(subject, meaning)
    });
  });

  imperativeForms.forEach((form, index) => {
    forms.push({
      form,
      mode: "imperative",
      person: index === 0 ? "int" : "intom",
      englishPrompt: `${meaning.replace(/^to\s+/, "")} (${index === 0 ? "singular" : "plural"} command)`
    });
  });

  return forms.map((form, index) => ({
    id: `${paradigm.id}-${form.mode}-${index + 1}`,
    ...form
  }));
}

function build() {
  const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
  const sourceProvenance = JSON.parse(fs.readFileSync(path.join(root, "assets", "data", "course_source_provenance.json"), "utf8"));
  const paradigms = inventory.verbParadigms.map((paradigm) => {
    const source = sourceProvenance.verbParadigms[paradigm.id];
    if (!source?.primaryPage) throw new Error(`Missing book source page for ${paradigm.id}`);
    return {
      id: paradigm.id,
      book: paradigm.book,
      lemma: paradigm.lemma,
      meaning: meanings[paradigm.id],
      sourceInventory: "book_coverage_inventory.json",
      source: {
        book: source.book,
        chapterId: source.chapterId,
        page: source.primaryPage,
        pages: source.pages
      },
      sourceLabel: `${source.book}, p. ${source.primaryPage}`,
      forms: makeForms(paradigm)
    };
  });

  const formCount = paradigms.reduce((total, paradigm) => total + paradigm.forms.length, 0);
  if (paradigms.length !== 18 || formCount !== 125) {
    throw new Error(`Expected 18 paradigms and 125 forms, found ${paradigms.length} and ${formCount}`);
  }

  return {
    schemaVersion: 1,
    generatedFrom: "assets/data/book_coverage_inventory.json",
    paradigmCount: paradigms.length,
    formCount,
    paradigms
  };
}

const next = `${JSON.stringify(build(), null, 2)}\n`;
if (checkOnly) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== next) {
    console.error("Course verb paradigms are stale. Run npm run course:verbs:build.");
    process.exit(1);
  }
  console.log("Course verb paradigms are synchronized: 18 paradigms, 125 forms.");
} else {
  fs.writeFileSync(outputPath, next, "utf8");
  console.log(`Wrote ${path.relative(root, outputPath)} with 18 paradigms and 125 forms.`);
}
