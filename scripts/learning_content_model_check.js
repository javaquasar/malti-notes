const fs = require("fs");
const path = require("path");
const contentModel = require("../assets/js/learning-content");

const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "assets", "data");
const errors = [];
let groupCount = 0;
let itemCount = 0;
const typeCounts = Object.fromEntries(contentModel.ITEM_TYPES.map((type) => [type, 0]));
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(file, location, message) {
  errors.push(`${file}:${location} ${message}`);
}

function normalizeReviewKey(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[’`´]/g, "'")
    .toLocaleLowerCase();
}

function reviewSignature(normalized) {
  return JSON.stringify({
    contentType: normalized.itemType,
    primary: normalized.primary,
    secondary: normalized.secondary,
    prompt: normalized.prompt,
    answer: normalized.answer
  });
}

function registerReviewIdentity(file, group, item, location, namespace, identities) {
  const normalized = contentModel.normalizeItem(item, group);
  const key = normalizeReviewKey(item.slug || normalized.primary);
  const signature = reviewSignature(normalized);
  const previous = identities.get(`${namespace}::${key}`);

  if (item.slug && !slugPattern.test(item.slug)) {
    fail(file, location, `slug must use lowercase kebab-case: ${item.slug}`);
  }
  if (previous && previous.signature !== signature) {
    fail(
      file,
      location,
      `review identity collides with ${previous.location}; add distinct slugs or harmonize equivalent content`
    );
  } else if (!previous) {
    identities.set(`${namespace}::${key}`, { location, signature });
  }
}

function validateItem(file, group, item, location, namespace, identities) {
  const type = contentModel.resolveItemType(item, group);
  const normalized = contentModel.normalizeItem(item, group);
  typeCounts[type] += 1;
  itemCount += 1;

  if (!normalized.primary || !normalized.secondary) {
    fail(file, location, `${type} must provide both prompt and answer text`);
  }
  if (type === "questionAnswer") {
    if (!item.question || !item.answer) {
      fail(file, location, "questionAnswer must use separate question and answer objects");
    }
    if (Object.prototype.hasOwnProperty.call(item, "maltese") || Object.prototype.hasOwnProperty.call(item, "english")) {
      fail(file, location, "questionAnswer must not overload maltese/english fields");
    }
  }
  if (item.verificationStatus === "needs-review" && !item.verificationId) {
    fail(file, location, "needs-review item requires verificationId");
  }
  registerReviewIdentity(file, group, item, location, namespace, identities);
}

const files = fs.readdirSync(dataDir)
  .filter((file) => file.endsWith("_examples.json") && file !== "course_target_examples.json")
  .sort();

files.forEach((file) => {
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
  const identities = new Map();
  if (data.schemaVersion !== 2) fail(file, "root", "schemaVersion must be 2");
  if (!data.source || !data.source.kind) fail(file, "root", "source metadata is required");
  if (data.source?.kind === "site" && !fs.existsSync(path.join(root, data.source.page || ""))) {
    fail(file, "root", `source page does not exist: ${data.source.page || "(missing)"}`);
  }
  if (data.page && data.page !== data.source?.page) {
    fail(file, "root", "page must match source.page when both are present");
  }

  const owningPage = data.page || data.source?.page || "";
  const pagePath = path.join(root, owningPage);
  const html = owningPage && fs.existsSync(pagePath) ? fs.readFileSync(pagePath, "utf8") : "";
  if (html && !html.includes(`./assets/data/${file}`)) {
    fail(file, "root", `source page does not load ${file}`);
  }

  (data.groups || []).forEach((group, groupIndex) => {
    groupCount += 1;
    if (!contentModel.ITEM_TYPES.includes(group.itemType)) {
      fail(file, `groups[${groupIndex}]`, `unsupported itemType ${group.itemType || "(missing)"}`);
    }
    if ((group.items || []).length && !html.includes(`data-example-group="${group.id}"`)) {
      fail(file, `groups[${groupIndex}]`, `source page has no data-example-group target for ${group.id}`);
    }
    if ((group.questions || []).length && !html.includes(`data-question-group="${group.id}"`)) {
      fail(file, `groups[${groupIndex}]`, `source page has no data-question-group target for ${group.id}`);
    }

    (group.items || []).forEach((item, itemIndex) => validateItem(
      file,
      group,
      item,
      `groups[${groupIndex}].items[${itemIndex}]`,
      "examples",
      identities
    ));
    const questionGroup = { ...group, itemType: group.questionItemType || "translation" };
    (group.questions || []).forEach((item, itemIndex) => validateItem(
      file,
      questionGroup,
      item,
      `groups[${groupIndex}].questions[${itemIndex}]`,
      "questions",
      identities
    ));
  });
});

if (!typeCounts.example || !typeCounts.questionAnswer || !typeCounts.translation) {
  fail("all example banks", "types", `expected example, questionAnswer and translation content; got ${JSON.stringify(typeCounts)}`);
}

const grammar = JSON.parse(fs.readFileSync(path.join(dataDir, "grammar_targets.json"), "utf8"));
grammar.targets.forEach((target, index) => {
  if (target.itemType !== "rule") fail("grammar_targets.json", `targets[${index}]`, "grammar target must declare itemType rule");
  typeCounts.rule += 1;
  itemCount += 1;
});

if (errors.length) {
  errors.forEach((error) => console.error(`fail ${error}`));
  process.exit(1);
}

console.log(`ok typed ${itemCount} learning items in ${groupCount} groups (${Object.entries(typeCounts).map(([type, count]) => `${type}=${count}`).join(", ")})`);
