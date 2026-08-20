const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputFile = path.join(root, "assets", "data", "search-index.json");
const useGitHead = process.argv.includes("--git-head");
const checkOnly = process.argv.includes("--check");
const pageOverrides = {
  colors: "colors_maltese.html",
  food: "food_preferences.html",
  transport: "transport_travel.html",
  verbs_course_bank: "verbs_guide.html",
  verbs_extensions: "verbs_guide.html",
  course_verb_paradigms: "verbs_guide.html",
};
const excluded = new Set([
  "book_coverage_inventory.json",
  "comprehensive_test_bank.json",
  "course_exercises.json",
  "course_milestone_assessments.json",
  "course_path.json",
  "course_source_provenance.json",
  "course_supplemental_content.json",
  "course_target_assessments.json",
  "course_target_bindings.json",
  "course_target_examples.json",
  "course_target_glosses.json",
  "site-map.json",
  "search-index.json",
]);

function readText(relativePath) {
  if (!useGitHead) return fs.readFileSync(path.join(root, relativePath), "utf8");
  try {
    return childProcess.execFileSync("git", ["show", `HEAD:${relativePath.replaceAll("\\", "/")}`], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch (error) {
    return fs.readFileSync(path.join(root, relativePath), "utf8");
  }
}

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase("mt")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[ċ]/g, "c")
    .replace(/[ġ]/g, "g")
    .replace(/[ħ]/g, "h")
    .replace(/[ż]/g, "z")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function pageFor(fileName, data) {
  if (data.page && fs.existsSync(path.join(root, data.page))) return data.page;
  const stem = fileName.replace(/\.json$/, "").replace(/_examples$/, "");
  const page = pageOverrides[stem] || `${stem}.html`;
  return fs.existsSync(path.join(root, page)) ? page : null;
}

function buildIndex() {
  // Navigation changes must be indexable before their commit while --git-head
  // continues to protect generated content from unrelated dirty data files.
  const siteMap = JSON.parse(fs.readFileSync(path.join(root, "assets", "data", "site-map.json"), "utf8"));
  const entries = [];
  const seen = new Set();
  const add = (entry) => {
    if (!entry.title || !entry.href) return;
    const key = [entry.href, entry.kind, normalize(entry.title), normalize(entry.subtitle)].join("::");
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({
      kind: entry.kind,
      title: entry.title,
      subtitle: entry.subtitle || "",
      group: entry.group || "",
      href: entry.href,
      find: entry.find === undefined ? entry.title : entry.find,
      normalized: normalize([entry.title, entry.subtitle, entry.group, entry.keywords].join(" ")),
    });
  };

  siteMap.groups.forEach((group) => group.pages.forEach((page) => add({
    kind: "page",
    title: page.label,
    subtitle: page.description,
    group: group.label,
    href: page.href,
    find: "",
    keywords: page.navLabel || "",
  })));

  const dataFiles = fs.readdirSync(path.join(root, "assets", "data"))
    .filter((file) => file.endsWith(".json") && !excluded.has(file))
    .sort();

  const visit = (value, context, page) => {
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, context, page));
      return;
    }
    if (!value || typeof value !== "object") return;

    const nextContext = {
      group: value.title || value.sectionTitle || context.group || "",
      lemma: value.lemma || context.lemma || "",
      meaning: value.meaning || value.translation || context.meaning || "",
    };
    if (typeof value.maltese === "string" && value.maltese.trim()) {
      add({
        kind: value.maltese.trim().includes(" ") ? "phrase" : "word",
        title: value.maltese,
        subtitle: value.english || value.translation || "",
        group: nextContext.group,
        href: page,
        keywords: [value.example, value.exampleTranslation, value.notes, value.sourceTerms].flat().filter(Boolean).join(" "),
      });
    } else if (typeof value.form === "string" && value.form.trim() && (value.person || value.englishPrompt)) {
      add({
        kind: "verb",
        title: value.form,
        subtitle: value.englishPrompt || [value.person, value.mode].filter(Boolean).join(" · "),
        group: nextContext.lemma || "Verb forms",
        href: page,
        keywords: [nextContext.meaning, value.person, value.mode].filter(Boolean).join(" "),
      });
    } else if (typeof value.lemma === "string" && value.lemma.trim()) {
      add({
        kind: "verb",
        title: value.lemma,
        subtitle: value.meaning || (value.meanings || []).join(" / ") || value.translation || "",
        group: nextContext.group || "Verbs",
        href: page,
        keywords: [value.aliases, value.notes].flat().filter(Boolean).join(" "),
      });
    }
    Object.values(value).forEach((child) => visit(child, nextContext, page));
  };

  dataFiles.forEach((fileName) => {
    const relativePath = `assets/data/${fileName}`;
    const data = JSON.parse(readText(relativePath));
    const page = pageFor(fileName, data);
    if (page) visit(data, { group: data.topic || "", lemma: "", meaning: "" }, page);
  });

  entries.sort((left, right) => left.kind.localeCompare(right.kind) || left.title.localeCompare(right.title, "mt") || left.href.localeCompare(right.href));
  return {
    schemaVersion: 1,
    description: "Generated full-content index for pages, Maltese words, phrases, examples, and verb forms.",
    entryCount: entries.length,
    entries,
  };
}

const output = buildIndex();
const serialized = `${JSON.stringify(output)}\n`;

if (checkOnly) {
  let current;
  try {
    current = JSON.parse(fs.readFileSync(outputFile, "utf8"));
  } catch (error) {
    current = null;
  }
  if (!current || current.schemaVersion !== 1 || !Array.isArray(current.entries) || current.entryCount !== current.entries.length) {
    console.error("fail search index is missing or structurally invalid; run npm run search:build");
    process.exit(1);
  }
  const kinds = new Set(current.entries.map((entry) => entry.kind));
  if (!["page", "word", "phrase", "verb"].every((kind) => kinds.has(kind))) {
    console.error("fail search index must contain pages, words, phrases, and verbs");
    process.exit(1);
  }
  console.log(`ok search index contains ${current.entryCount} entries across ${kinds.size} kinds`);
} else {
  fs.writeFileSync(outputFile, serialized, "utf8");
  console.log(`wrote ${output.entryCount} full-content search entries`);
}
