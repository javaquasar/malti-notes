const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const htmlFiles = fs.readdirSync(root)
  .filter((name) => name.endsWith(".html"))
  .sort();
const errors = [];
const htmlCache = new Map();
const groupCache = new Map();
const exerciseSetCache = new Map();

function normalize(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function lineAt(source, index) {
  return source.slice(0, index).split("\n").length;
}

function fail(file, source, index, message) {
  errors.push(`${normalize(file)}:${lineAt(source, index)} ${message}`);
}

function readHtml(file) {
  if (!htmlCache.has(file)) {
    htmlCache.set(file, fs.readFileSync(file, "utf8"));
  }
  return htmlCache.get(file);
}

function collectAttribute(source, attribute) {
  const pattern = new RegExp(`\\b${attribute}\\s*=\\s*(["'])(.*?)\\1`, "gi");
  return Array.from(source.matchAll(pattern), (match) => ({
    index: match.index,
    value: match[2]
  }));
}

function collectAnchors(file) {
  const source = readHtml(file);
  const anchors = new Set();
  const seenIds = new Map();

  collectAttribute(source, "id").forEach(({ index, value }) => {
    if (seenIds.has(value)) {
      fail(file, source, index, `duplicate id "${value}" (first seen on line ${seenIds.get(value)})`);
      return;
    }
    seenIds.set(value, lineAt(source, index));
    anchors.add(value);
  });

  collectAttribute(source, "name").forEach(({ value }) => anchors.add(value));
  return anchors;
}

function readGroups(jsonFile, ownerFile, ownerSource, ownerIndex) {
  if (groupCache.has(jsonFile)) {
    return groupCache.get(jsonFile);
  }

  if (!fs.existsSync(jsonFile)) {
    fail(ownerFile, ownerSource, ownerIndex, `references missing data file "${normalize(jsonFile)}"`);
    groupCache.set(jsonFile, new Set());
    return groupCache.get(jsonFile);
  }

  try {
    const data = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
    const groups = new Set((data.groups || []).map((group) => group && group.id).filter(Boolean));
    groupCache.set(jsonFile, groups);
  } catch (error) {
    fail(ownerFile, ownerSource, ownerIndex, `cannot read data file "${normalize(jsonFile)}": ${error.message}`);
    groupCache.set(jsonFile, new Set());
  }

  return groupCache.get(jsonFile);
}

function readExerciseSets(jsonFile) {
  if (exerciseSetCache.has(jsonFile)) {
    return exerciseSetCache.get(jsonFile);
  }

  if (!fs.existsSync(jsonFile)) {
    exerciseSetCache.set(jsonFile, new Set());
    return exerciseSetCache.get(jsonFile);
  }

  try {
    const data = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
    exerciseSetCache.set(jsonFile, new Set((data.sets || []).map((set) => set && set.id).filter(Boolean)));
  } catch (error) {
    exerciseSetCache.set(jsonFile, new Set());
  }

  return exerciseSetCache.get(jsonFile);
}

function collectDataGroupAttributes(source) {
  const attributes = [];
  Array.from(source.matchAll(/<[a-z][^>]*>/gi)).forEach((tagMatch) => {
    const tag = tagMatch[0];
    const pattern = /\b(data-[a-z0-9-]+-group)\s*=\s*(["'])(.*?)\2/gi;
    Array.from(tag.matchAll(pattern)).forEach((match) => {
      attributes.push({ attribute: match[1], value: match[3], index: tagMatch.index + match.index });
    });
  });
  return attributes;
}

function checkHref(file, source, href, index, anchorCache) {
  if (!href || href === "#" || /^(?:https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(href)) {
    return;
  }

  const hashIndex = href.indexOf("#");
  const rawPath = (hashIndex >= 0 ? href.slice(0, hashIndex) : href).split("?")[0];
  const rawAnchor = hashIndex >= 0 ? href.slice(hashIndex + 1) : "";
  let targetPath;
  let anchor;

  try {
    targetPath = decodeURIComponent(rawPath);
    anchor = decodeURIComponent(rawAnchor);
  } catch (error) {
    fail(file, source, index, `has invalid URL encoding in href "${href}"`);
    return;
  }

  const targetFile = targetPath ? path.resolve(path.dirname(file), targetPath) : file;
  const relativeTarget = path.relative(root, targetFile);

  if (relativeTarget.startsWith("..") || path.isAbsolute(relativeTarget)) {
    fail(file, source, index, `href "${href}" points outside the site`);
    return;
  }

  if (!fs.existsSync(targetFile)) {
    fail(file, source, index, `href "${href}" points to missing file "${normalize(targetFile)}"`);
    return;
  }

  if (anchor && path.extname(targetFile).toLowerCase() === ".html") {
    if (!anchorCache.has(targetFile)) {
      anchorCache.set(targetFile, collectAnchors(targetFile));
    }
    if (!anchorCache.get(targetFile).has(anchor)) {
      fail(file, source, index, `href "${href}" points to missing anchor "${anchor}"`);
    }
  }
}

const anchorCache = new Map();

htmlFiles.forEach((name) => {
  const file = path.join(root, name);
  const source = readHtml(file);
  anchorCache.set(file, collectAnchors(file));

  collectAttribute(source, "href").forEach(({ value, index }) => {
    checkHref(file, source, value.trim(), index, anchorCache);
  });

  const dataFiles = Array.from(source.matchAll(/["']([^"']+\.json)["']/gi))
    .filter((match) => /^(?:\.\.\/|\.\/|assets\/)/i.test(match[1]))
    .map((match) => ({
      file: path.resolve(path.dirname(file), match[1]),
      index: match.index
    }));

  collectAttribute(source, "src")
    .filter(({ value }) => value.endsWith(".js"))
    .forEach(({ value, index }) => {
      const scriptFile = path.resolve(path.dirname(file), value);
      if (!fs.existsSync(scriptFile)) return;
      const scriptSource = fs.readFileSync(scriptFile, "utf8");
      Array.from(scriptSource.matchAll(/["']([^"']+\.json)["']/gi))
        .filter((match) => /^(?:\.\.\/|\.\/|assets\/)/i.test(match[1]))
        .forEach((match) => dataFiles.push({
          file: path.resolve(path.dirname(file), match[1]),
          index
        }));
    });

  const availableGroups = new Set();
  const availableExerciseSets = new Set();

  dataFiles.forEach((entry) => {
    readGroups(entry.file, file, source, entry.index).forEach((group) => availableGroups.add(group));
    readExerciseSets(entry.file).forEach((setId) => availableExerciseSets.add(setId));
  });

  collectDataGroupAttributes(source).forEach(({ attribute, value, index }) => {
    if (!availableGroups.has(value)) {
      fail(file, source, index, `${attribute} "${value}" is missing from the page's JSON data`);
    }
  });

  collectAttribute(source, "data-exercise-set").forEach(({ value, index }) => {
    if (!availableExerciseSets.has(value)) {
      fail(file, source, index, `data-exercise-set "${value}" is missing from the page's JSON data`);
    }
    if (!source.includes("assets/js/exercise-runner.js")) {
      fail(file, source, index, "exercise container requires assets/js/exercise-runner.js");
    }
  });
});

if (errors.length) {
  errors.forEach((message) => console.error(`fail ${message}`));
  console.error(`\n${errors.length} link lint error(s) found.`);
  process.exit(1);
}

console.log(`ok checked links and data groups in ${htmlFiles.length} HTML files`);
