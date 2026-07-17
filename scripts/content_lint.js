const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dataRoot = path.join(root, "assets", "data");
const errors = [];
const missingExamples = new Map();
const maxLengths = {
  maltese: 140,
  english: 180,
  translation: 180,
  example: 160,
  exampleTranslation: 200
};

function listJsonFiles(dir, files = []) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "generated") listJsonFiles(absolute, files);
    if (entry.isFile() && entry.name.endsWith(".json")) files.push(absolute);
  });
  return files;
}

function relative(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalize(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en")
    .replace(/[\u2018\u2019\u00b4]/g, "'")
    .replace(/\s+/g, " ");
}

function fail(file, location, message) {
  errors.push(`${relative(file)}:${location} ${message}`);
}

function translationOf(item) {
  return item.english || item.translation || item.meaning || item.answer || "";
}

function validateText(file, location, field, value) {
  if (/[\u2018\u2019\u00b4]/.test(value)) {
    fail(file, `${location}.${field}`, "uses a typographic apostrophe; use a straight apostrophe");
  }
  if (/[\ufffd\u00c3\u00c2\u00c4\u00c5]/.test(value)) {
    fail(file, `${location}.${field}`, "contains a replacement or likely mojibake character");
  }

  const limit = maxLengths[field];
  if (limit && value.length > limit) {
    fail(file, `${location}.${field}`, `is ${value.length} characters; maximum card length is ${limit}`);
  }
}

function validatePair(file, location, item) {
  if (Object.prototype.hasOwnProperty.call(item, "maltese")) {
    if (!hasText(item.maltese)) {
      fail(file, `${location}.maltese`, "must be a non-empty string");
    } else if (!hasText(translationOf(item))) {
      fail(file, location, "has Maltese text without an English translation or meaning");
    }
  }

  if (Object.prototype.hasOwnProperty.call(item, "english")) {
    if (!hasText(item.english)) {
      fail(file, `${location}.english`, "must be a non-empty string");
    } else if (![item.maltese, item.form, item.lemma, item.answer].some(hasText)) {
      fail(file, location, "has English text without a Maltese form or answer");
    }
  }
}

function validateDuplicates(file, location, items) {
  const seen = new Map();

  items.forEach((item, index) => {
    if (!isObject(item) || !hasText(item.maltese) || !hasText(translationOf(item))) return;
    const key = `${normalize(item.maltese)}|${normalize(translationOf(item))}`;
    if (seen.has(key)) {
      fail(file, `${location}[${index}]`, `duplicates ${location}[${seen.get(key)}]`);
    } else {
      seen.set(key, index);
    }
  });
}

function validateValue(file, location, value) {
  if (Array.isArray(value)) {
    validateDuplicates(file, location, value);
    value.forEach((item, index) => validateValue(file, `${location}[${index}]`, item));
    return;
  }
  if (!isObject(value)) return;

  validatePair(file, location, value);
  if (value.review?.enabled === true && !hasText(value.example)) {
    const name = relative(file);
    missingExamples.set(name, (missingExamples.get(name) || 0) + 1);
  }

  Object.entries(value).forEach(([field, child]) => {
    if (typeof child === "string") validateText(file, location, field, child);
    if (typeof child === "object" && child !== null) validateValue(file, `${location}.${field}`, child);
  });
}

const files = listJsonFiles(dataRoot).sort();
files.forEach((file) => {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(file, "root", `is invalid JSON: ${error.message}`);
    return;
  }
  validateValue(file, "root", data);
});

missingExamples.forEach((count, file) => {
  console.warn(`warn ${file}: ${count} review-enabled item(s) have no example sentence`);
});

if (errors.length) {
  errors.forEach((message) => console.error(`fail ${message}`));
  console.error(`\n${errors.length} content lint error(s) found.`);
  process.exit(1);
}

const warningCount = [...missingExamples.values()].reduce((sum, count) => sum + count, 0);
console.log(`ok checked learning content in ${files.length} data files (${warningCount} example warning(s))`);
