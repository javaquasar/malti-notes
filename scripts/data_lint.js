const fs = require("fs");
const path = require("path");
const { validateCourseFiles } = require("./course_data_validation");

const root = path.resolve(__dirname, "..");
const dataRoot = path.join(root, "assets", "data");

const allowedCardClasses = new Set([
  "demo-box",
  "dialogue-card",
  "example-card",
  "info-card",
  "pattern-card",
  "study-card"
]);

const allowedContainerClasses = new Set([
  "example-dialogue-stack",
  "grid-2",
  "grid-2 example-dialogue-stack",
  "grid-3"
]);

const contentKeys = [
  "answer",
  "english",
  "example",
  "exampleTranslation",
  "form",
  "lemma",
  "maltese",
  "meaning",
  "note",
  "prompt",
  "title",
  "translation"
];

const errors = [];

function normalize(file) {
  return file.replace(/\\/g, "/");
}

function listJsonFiles(dir, files = []) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const abs = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      listJsonFiles(abs, files);
      return;
    }

    if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(abs);
    }
  });

  return files;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasContent(item) {
  return contentKeys.some((key) => isNonEmptyString(item[key]));
}

function fail(file, message) {
  errors.push(`${file}: ${message}`);
}

function validateStringField(file, owner, field, value) {
  if (value !== undefined && !isNonEmptyString(value)) {
    fail(file, `${owner}.${field} must be a non-empty string when present`);
  }
}

function validatePage(file, page) {
  if (page === undefined) {
    return;
  }

  validateStringField(file, "root", "page", page);

  if (isNonEmptyString(page) && !fs.existsSync(path.join(root, page))) {
    fail(file, `page points to missing HTML file: ${page}`);
  }
}

function validateReview(file, groupId, itemIndex, review) {
  const owner = `group ${groupId} item ${itemIndex}.review`;

  if (!isObject(review)) {
    fail(file, `${owner} must be an object`);
    return;
  }

  if (typeof review.enabled !== "boolean") {
    fail(file, `${owner}.enabled must be a boolean`);
  }

  if (review.type !== undefined && review.type !== "word") {
    fail(file, `${owner}.type must be "word" when present`);
  }
}

function validateGroup(file, group, groupIndex, seenGroupIds) {
  if (!isObject(group)) {
    fail(file, `groups[${groupIndex}] must be an object`);
    return;
  }

  const groupLabel = group.id || `groups[${groupIndex}]`;

  if (!isNonEmptyString(group.id)) {
    fail(file, `groups[${groupIndex}].id is required`);
  } else if (seenGroupIds.has(group.id)) {
    fail(file, `duplicate group id: ${group.id}`);
  } else {
    seenGroupIds.add(group.id);
  }

  if (!isNonEmptyString(group.title) && !isNonEmptyString(group.sectionTitle)) {
    fail(file, `group ${groupLabel} has no title or sectionTitle`);
  }

  validateStringField(file, `group ${groupLabel}`, "sectionId", group.sectionId);

  if (group.cardClass !== undefined && !allowedCardClasses.has(group.cardClass)) {
    fail(file, `group ${groupLabel} uses unknown cardClass: ${group.cardClass}`);
  }

  if (group.containerClass !== undefined && !allowedContainerClasses.has(group.containerClass)) {
    fail(file, `group ${groupLabel} uses unknown containerClass: ${group.containerClass}`);
  }

  if (!Array.isArray(group.items)) {
    fail(file, `group ${groupLabel}.items must be an array`);
    return;
  }

  if (!group.items.length) {
    fail(file, `group ${groupLabel} has no items`);
  }

  const seenItemKeys = new Set();

  group.items.forEach((item, itemIndex) => {
    if (!isObject(item)) {
      fail(file, `group ${groupLabel} item ${itemIndex} must be an object`);
      return;
    }

    ["id", "slug", "maltese", "english", "form", "meaning", "lemma"].forEach((field) => {
      validateStringField(file, `group ${groupLabel} item ${itemIndex}`, field, item[field]);
    });

    const uniqueKey = item.id || item.slug;

    if (uniqueKey) {
      if (seenItemKeys.has(uniqueKey)) {
        fail(file, `group ${groupLabel} has duplicate item id/slug: ${uniqueKey}`);
      } else {
        seenItemKeys.add(uniqueKey);
      }
    }

    if (!hasContent(item)) {
      fail(file, `group ${groupLabel} item ${itemIndex} has no recognizable text content`);
    }

    if (item.review !== undefined) {
      validateReview(file, groupLabel, itemIndex, item.review);
    }
  });
}

function validateSiteMap(file, data) {
  const seenHrefs = new Set();
  const seenFeatured = new Set();
  const registeredPages = [];

  function validateSitePage(page, owner) {
    if (!isObject(page)) {
      fail(file, `${owner} must be an object`);
      return;
    }

    ["href", "label", "description"].forEach((field) => {
      validateStringField(file, owner, field, page[field]);
    });
    validateStringField(file, owner, "navLabel", page.navLabel);

    if (isNonEmptyString(page.href)) {
      if (seenHrefs.has(page.href)) {
        fail(file, `duplicate page href: ${page.href}`);
      } else {
        seenHrefs.add(page.href);
        registeredPages.push(page.href);
      }

      if (!fs.existsSync(path.join(root, page.href))) {
        fail(file, `${owner}.href points to missing HTML file: ${page.href}`);
      }
    }

    if (page.featured !== undefined) {
      if (!Number.isInteger(page.featured) || page.featured < 0) {
        fail(file, `${owner}.featured must be a non-negative integer`);
      } else if (seenFeatured.has(page.featured)) {
        fail(file, `duplicate featured order: ${page.featured}`);
      } else {
        seenFeatured.add(page.featured);
      }
    }
  }

  if (!Array.isArray(data.standalone)) {
    fail(file, "standalone must be an array");
  } else {
    data.standalone.forEach((page, index) => validateSitePage(page, `standalone[${index}]`));
  }

  if (!Array.isArray(data.groups)) {
    fail(file, "groups must be an array");
    return;
  }

  const seenGroupIds = new Set();
  data.groups.forEach((group, groupIndex) => {
    const owner = `groups[${groupIndex}]`;
    if (!isObject(group)) {
      fail(file, `${owner} must be an object`);
      return;
    }

    ["id", "label", "heading"].forEach((field) => {
      validateStringField(file, owner, field, group[field]);
    });

    if (isNonEmptyString(group.id)) {
      if (seenGroupIds.has(group.id)) {
        fail(file, `duplicate group id: ${group.id}`);
      }
      seenGroupIds.add(group.id);
    }

    if (!Array.isArray(group.pages) || !group.pages.length) {
      fail(file, `${owner}.pages must be a non-empty array`);
      return;
    }
    group.pages.forEach((page, pageIndex) => validateSitePage(page, `${owner}.pages[${pageIndex}]`));
  });

  const htmlPages = fs.readdirSync(root).filter((name) => name.endsWith(".html")).sort();
  const unregistered = htmlPages.filter((name) => !registeredPages.includes(name));
  if (unregistered.length) {
    fail(file, `HTML pages missing from site map: ${unregistered.join(", ")}`);
  }
}

function validateFile(absFile) {
  const relFile = normalize(path.relative(root, absFile));
  const raw = fs.readFileSync(absFile, "utf8");
  let data;

  try {
    data = JSON.parse(raw);
  } catch (error) {
    fail(relFile, `invalid JSON: ${error.message}`);
    return;
  }

  if (!isObject(data)) {
    fail(relFile, "top-level value must be an object");
    return;
  }

  if (path.basename(absFile) === "site-map.json") {
    validateSiteMap(relFile, data);
    return;
  }

  validatePage(relFile, data.page);
  validateStringField(relFile, "root", "topic", data.topic);

  if (data.groups === undefined) {
    return;
  }

  if (!Array.isArray(data.groups)) {
    fail(relFile, "groups must be an array when present");
    return;
  }

  const seenGroupIds = new Set();
  data.groups.forEach((group, index) => validateGroup(relFile, group, index, seenGroupIds));
}

listJsonFiles(dataRoot).sort().forEach(validateFile);
validateCourseFiles({ root, fail });

if (errors.length) {
  errors.forEach((message) => console.error(`fail ${message}`));
  console.error(`\n${errors.length} data lint error(s) found.`);
  process.exit(1);
}

console.log(`ok checked ${listJsonFiles(dataRoot).length} data files`);
