const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "assets", "data");

const BASIC_SOURCES = [
  ["animals.json", "Animals"],
  ["colors.json", "Colours"],
  ["numbers_calendar_time.json", "Numbers, Calendar and Time"],
  ["family_home_food.json", "Family, Home and Food"],
  ["home_furniture.json", "Home and Furniture"],
  ["body_appearance.json", "Body and Appearance"],
  ["food.json", "Food"],
  ["shopping_clothes.json", "Shopping and Clothes"],
  ["weather.json", "Weather"],
  ["transport.json", "Transport"],
  ["prepositions_place.json", "Prepositions of Place"],
  ["directions_town.json", "Directions and Town"]
];

const EXTENDED_SOURCES = [
  ["emotions.json", "Emotions"],
  ["places_events.json", "Places and Events"],
  ["pronouns_possessives.json", "Pronouns and Possessives"],
  ["daily_routine.json", "Daily Routine"],
  ["health_doctor.json", "Health and Doctor"],
  ["restaurant_ordering.json", "Restaurant"],
  ["daily_problems.json", "Daily Problems"],
  ["modals_needs.json", "Can, Want and Need"],
  ["comparisons.json", "Comparisons"],
  ["collective_nouns.json", "Collective Nouns"]
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function normalizeKey(value) {
  return String(value).trim().toLowerCase();
}

function hasRealExample(item) {
  return item.example && item.exampleTranslation && item.example.trim().split(/\s+/).length > 1;
}

function simpleExample(item) {
  return {
    example: "Nara " + item.maltese + ".",
    exampleTranslation: "I see " + item.english + "."
  };
}

function collectExamples(file) {
  const examplesFile = file.replace(/\.json$/, "_examples.json");
  const fullPath = path.join(dataDir, examplesFile);
  if (!fs.existsSync(fullPath)) {
    return [];
  }

  const examples = [];
  function walk(value) {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") {
      return;
    }

    const mt = value.maltese || value.mt || value.phrase || value.sentence || value.word;
    const en = value.english || value.en || value.translation || value.meaning || value.gloss;
    if (mt && en && String(mt).trim().split(/\s+/).length > 1) {
      examples.push({ maltese: String(mt).trim(), english: String(en).trim() });
    }
    Object.values(value).forEach(walk);
  }

  walk(readJson(examplesFile));
  return examples;
}

function findExample(item, examples) {
  if (hasRealExample(item)) {
    return {
      example: item.example,
      exampleTranslation: item.exampleTranslation
    };
  }

  const term = normalizeKey(item.maltese);
  const found = examples.find((example) => normalizeKey(example.maltese).includes(term));
  if (found) {
    return {
      example: found.maltese,
      exampleTranslation: found.english
    };
  }

  return simpleExample(item);
}

function extractGroups(file, sourceLabel, tier) {
  const data = readJson(file);
  const examples = collectExamples(file);
  const groups = [];

  function walkGroup(group, parentTitle) {
    if (!group || typeof group !== "object") {
      return;
    }

    if (Array.isArray(group.items)) {
      const groupTitle = group.title || group.sectionTitle || parentTitle || sourceLabel;
      const items = group.items
        .filter((item) => item && item.maltese && item.english)
        .map((item) => {
          const example = findExample(item, examples);
          return {
            slug: item.slug || item.id || slugify(item.maltese),
            maltese: item.maltese,
            english: item.english,
            example: example.example,
            exampleTranslation: example.exampleTranslation,
            exampleSource: hasRealExample(item) ? "topic data" : "site examples",
            notes: item.notes || (item.note ? [item.note] : []),
            sourceLabel,
            sourceFile: file,
            tier,
            review: item.review || { enabled: true, type: "word" }
          };
        });

      if (items.length) {
        groups.push({
          id: slugify(sourceLabel + "-" + (group.id || groupTitle)),
          sectionId: group.sectionId || slugify(sourceLabel),
          sectionTitle: group.sectionTitle || sourceLabel,
          title: sourceLabel + ": " + groupTitle,
          sourceLabel,
          sourceFile: file,
          tier,
          items
        });
      }
    }

    Object.values(group)
      .filter((value) => value && typeof value === "object")
      .forEach((value) => walkGroup(value, group.title || parentTitle));
  }

  walkGroup(data, data.topic || sourceLabel);
  return groups;
}

function dedupeGroups(groups, existingKeys) {
  const seen = new Set(existingKeys);
  return groups
    .map((group) => {
      const items = group.items.filter((item) => {
        const key = normalizeKey(item.maltese);
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
      return Object.assign({}, group, { items });
    })
    .filter((group) => group.items.length);
}

function annotateExam(data) {
  return data.groups.map((group) => Object.assign({}, group, {
    sourceLabel: "Exam materials",
    sourceFile: "year4_vocabulary.json",
    tier: "exam",
    items: group.items.map((item) => Object.assign({}, item, {
      sourceLabel: "Exam materials",
      sourceFile: "year4_vocabulary.json",
      tier: "exam"
    }))
  }));
}

const exam = readJson("year4_vocabulary.json");
const examGroups = annotateExam(exam);
const examKeys = examGroups.flatMap((group) => group.items).map((item) => normalizeKey(item.maltese));

const basicGroups = dedupeGroups(
  BASIC_SOURCES.flatMap(([file, sourceLabel]) => extractGroups(file, sourceLabel, "basics")),
  examKeys
);
const basicKeys = basicGroups.flatMap((group) => group.items).map((item) => normalizeKey(item.maltese));
const extendedGroups = dedupeGroups(
  EXTENDED_SOURCES.flatMap(([file, sourceLabel]) => extractGroups(file, sourceLabel, "extended")),
  examKeys.concat(basicKeys)
);

const output = {
  page: "year4_exam.html",
  topic: "Year 4 Revision Vocabulary",
  source: "Exam OCR list plus existing site vocabulary grouped for Year 4 revision",
  collections: [
    {
      id: "exam",
      title: "Exam Words",
      description: "Words extracted from the Year 4 Lisa materials.",
      groups: examGroups
    },
    {
      id: "basics",
      title: "Basics",
      description: "Core vocabulary already present on the site: animals, colours, calendar, home, food, weather, transport and place words.",
      groups: basicGroups
    },
    {
      id: "extended",
      title: "Extended",
      description: "Useful extra revision categories: emotions, places, pronouns, routines, health, restaurant, problems, modals and comparisons.",
      groups: extendedGroups
    }
  ],
  counts: {
    exam: examGroups.reduce((total, group) => total + group.items.length, 0),
    basics: basicGroups.reduce((total, group) => total + group.items.length, 0),
    extended: extendedGroups.reduce((total, group) => total + group.items.length, 0)
  }
};

fs.writeFileSync(
  path.join(dataDir, "year4_revision_vocabulary.json"),
  JSON.stringify(output, null, 2) + "\n",
  "utf8"
);

function revisionTopicWords() {
  const seen = new Set();
  return output.collections
    .flatMap((collection) => collection.groups)
    .flatMap((group) => group.items)
    .filter((item) => {
      const key = normalizeKey(item.maltese);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .map((item) => [item.maltese, item.english]);
}

function writeRevisionTopic() {
  const topic = {
    id: "year4-revision",
    label: "Year 4 Revision",
    words: revisionTopicWords()
  };
  const script = [
    "// Generated by scripts/build_year4_revision_data.js.",
    "(function () {",
    "  window.MALTI_WORD_SEARCH_TOPICS = Array.isArray(window.MALTI_WORD_SEARCH_TOPICS)",
    "    ? window.MALTI_WORD_SEARCH_TOPICS",
    "    : [];",
    "  window.MALTI_WORD_SEARCH_TOPICS = window.MALTI_WORD_SEARCH_TOPICS",
    "    .filter(function (topic) { return topic.id !== \"year4-revision\"; })",
    "    .concat(" + JSON.stringify(topic, null, 2).replace(/\n/g, "\n    ") + ");",
    "}());",
    ""
  ].join("\n");
  fs.writeFileSync(path.join(root, "assets", "js", "year4-revision-topic.js"), script, "utf8");
}

writeRevisionTopic();

console.log(output.counts);
