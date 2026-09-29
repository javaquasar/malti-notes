const fs = require("fs");
const path = require("path");
const learningContent = require("../assets/js/learning-content");

const root = path.resolve(__dirname, "..");
const dataRoot = path.join(root, "assets", "data");
const uncertaintyMarker = /\[(?:UNCERTAIN|overview-based)\]/i;
const allowedStatuses = new Set(["verified", "needs-review"]);
const allowedPendingClaims = new Set(["plural"]);
const errors = [];
const verificationIds = new Set();
const quarantined = [];
let pendingClaimCount = 0;
let verifiedClaimCount = 0;
let quarantinedHtmlCount = 0;

function relative(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function fail(file, location, message) {
  errors.push(`${relative(file)}:${location} ${message}`);
}

function listJsonFiles(directory, files = []) {
  fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== "generated") listJsonFiles(absolute, files);
    if (entry.isFile() && entry.name.endsWith(".json")) files.push(absolute);
  });
  return files;
}

function walk(file, value, location, document) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(file, item, `${location}[${index}]`, document));
    return;
  }
  if (!value || typeof value !== "object") return;

  if (value.verificationStatus !== undefined) {
    if (!allowedStatuses.has(value.verificationStatus)) {
      fail(file, location, `has unsupported verificationStatus ${value.verificationStatus}`);
    }
    if (value.verificationStatus === "needs-review") {
      if (typeof value.verificationId !== "string" || !value.verificationId.trim()) {
        fail(file, location, "needs-review content requires verificationId");
      } else if (verificationIds.has(value.verificationId)) {
        fail(file, location, `duplicates verificationId ${value.verificationId}`);
      } else {
        verificationIds.add(value.verificationId);
      }
      if (value.review?.enabled === true) fail(file, location, "needs-review content cannot enable review");
      const normalized = learningContent.normalizeItem(value);
      quarantined.push({ file, location, maltese: normalized.primary, english: normalized.secondary });
    }
  }

  if (value.pendingClaims !== undefined) {
    if (!Array.isArray(value.pendingClaims) || !value.pendingClaims.length) {
      fail(file, location, "pendingClaims must be a non-empty array");
    } else {
      value.pendingClaims.forEach((claim) => {
        pendingClaimCount += 1;
        if (!allowedPendingClaims.has(claim)) fail(file, location, `has unsupported pending claim ${claim}`);
        if ((value.notes || []).some((note) => new RegExp(`^${claim}:`, "i").test(note))) {
          fail(file, location, `publishes pending ${claim} claim in notes`);
        }
      });
    }
  }

  if (value.verifiedClaims !== undefined) {
    if (!value.verifiedClaims || typeof value.verifiedClaims !== "object" || Array.isArray(value.verifiedClaims)) {
      fail(file, location, "verifiedClaims must be an object");
    } else {
      Object.entries(value.verifiedClaims).forEach(([claim, details]) => {
        verifiedClaimCount += 1;
        if (!details?.value || !details?.source) fail(file, location, `${claim} verification requires value and source`);
        if (!document.verificationSources?.[details?.source]) fail(file, location, `${claim} references unknown source ${details?.source}`);
        if (!(value.notes || []).includes(`${claim}: ${details?.value}`)) {
          fail(file, location, `${claim} verified value is not published in notes`);
        }
      });
    }
  }

  Object.entries(value).forEach(([key, child]) => walk(file, child, `${location}.${key}`, document));
}

const files = listJsonFiles(dataRoot).sort();
files.forEach((file) => {
  const raw = fs.readFileSync(file, "utf8");
  if (uncertaintyMarker.test(raw)) fail(file, "root", "contains a text uncertainty marker; use structured verification metadata");
  let document;
  try {
    document = JSON.parse(raw);
  } catch (error) {
    fail(file, "root", `is invalid JSON: ${error.message}`);
    return;
  }
  walk(file, document, "root", document);
});

fs.readdirSync(root).filter((name) => name.endsWith(".html")).sort().forEach((name) => {
  const file = path.join(root, name);
  const raw = fs.readFileSync(file, "utf8");
  if (uncertaintyMarker.test(raw)) fail(file, "root", "contains a text uncertainty marker; use structured verification metadata");
  const quarantinedTags = raw.match(/<[^>]+data-verification-status="needs-review"[^>]*>/g) || [];
  quarantinedTags.forEach((tag, index) => {
    quarantinedHtmlCount += 1;
    if (!/\shidden(?:\s|>)/.test(tag)) fail(file, `quarantine[${index}]`, "needs-review HTML must be hidden");
    if (!/data-verification-id="[^"]+"/.test(tag)) fail(file, `quarantine[${index}]`, "needs-review HTML requires data-verification-id");
  });
});

const searchIndex = JSON.parse(fs.readFileSync(path.join(dataRoot, "search-index.json"), "utf8"));
const year4 = JSON.parse(fs.readFileSync(path.join(dataRoot, "year4_revision_vocabulary.json"), "utf8"));
const coverage = JSON.parse(fs.readFileSync(path.join(dataRoot, "comprehensive_test_bank.json"), "utf8"));
const year4Items = (year4.groups || []).flatMap((group) => group.items || []);

quarantined.forEach((item) => {
  if ((searchIndex.entries || []).some((entry) => entry.title === item.maltese && entry.subtitle === item.english)) {
    fail(item.file, item.location, "needs-review pair leaked into search-index.json");
  }
  if (year4Items.some((entry) => (
    (entry.maltese === item.maltese && entry.english === item.english)
    || (entry.example === item.maltese && entry.exampleTranslation === item.english)
  ))) {
    fail(item.file, item.location, "needs-review pair leaked into year4_revision_vocabulary.json");
  }
  if ((coverage.targets || []).some((entry) => entry.maltese === item.maltese && entry.english === item.english)) {
    fail(item.file, item.location, "needs-review pair leaked into comprehensive_test_bank.json");
  }
});

if (errors.length) {
  errors.forEach((error) => console.error(`fail verification ${error}`));
  process.exit(1);
}

console.log(`ok content verification: ${verifiedClaimCount} sourced claims, ${pendingClaimCount} pending claims, ${quarantined.length + quarantinedHtmlCount} quarantined examples`);
