const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const allowedColorFiles = new Set([
  "assets/css/theme.css",
  "assets/css/themes/forest.css",
  "assets/css/themes/contrast.css"
]);

function normalize(file) {
  return file.replace(/\\/g, "/");
}

function listFiles(dir, ext, files = []) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const abs = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "target" || entry.name === "visual-regression") {
        return;
      }

      listFiles(abs, ext, files);
      return;
    }

    if (entry.isFile() && entry.name.endsWith(ext)) {
      files.push(abs);
    }
  });

  return files;
}

function count(text, pattern) {
  return (text.match(pattern) || []).length;
}

function report(message) {
  failures.push(message);
  console.error(`fail ${message}`);
}

const failures = [];
const cssFiles = listFiles(path.join(root, "assets", "css"), ".css")
  .map((file) => normalize(path.relative(root, file)))
  .sort();
const legacyClassTokens = ["box", "item", "pair", "pattern", "phrase-card"];

const framedGroupClassTokens = [
  "content-group",
  "open-group",
  "example-bank-section",
  "shopping-dialogue-bank",
  "grammar-contrast-card",
  "wide-box"
];
const framedGroupModifiers = new Map([
  ["modals-open-group", "open-group"]
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function selectorHasClass(selector, token) {
  return new RegExp(`\\.${escapeRegExp(token)}(?=[\\s,.#:{>+~\\[])`).test(selector);
}

function lineNumber(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function reportLegacyClass(file, text, token, index) {
  report(`${file}:${lineNumber(text, index)}: legacy .${token} class token should use a semantic card class`);
}

cssFiles.forEach((file) => {
  const text = fs.readFileSync(path.join(root, file), "utf8");

  if (count(text, /\{/g) !== count(text, /\}/g)) {
    report(`${file}: unbalanced braces`);
  }

  if (/,\s*$/.test(text)) {
    report(`${file}: file ends with a dangling selector comma`);
  }

  if (!allowedColorFiles.has(file)) {
    const lines = text.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (/(#[0-9a-fA-F]{3,8}\b|rgba?\(|color-mix\()/i.test(line)) {
        report(`${file}:${index + 1}: direct color value should be a theme token`);
      }
    });
  }

  legacyClassTokens.forEach((token) => {
    const selectorPattern = new RegExp(`\\.${escapeRegExp(token)}(?=[\\s,.#:{>+~\\[])`, "g");
    let match;

    while ((match = selectorPattern.exec(text)) !== null) {
      reportLegacyClass(file, text, token, match.index);
    }
  });

  const cssRulePattern = /([^{}]+)\{([^{}]*)\}/g;
  const visualResetPattern = /(?:^|;)\s*(?:padding(?:-[\w-]+)?\s*:\s*0(?:px)?|border(?:-[\w-]+)?\s*:\s*(?:none|0(?:px)?)|background(?:-color)?\s*:\s*transparent|border-radius\s*:\s*0(?:px)?)(?:\s*!important)?\s*(?:;|$)/i;
  let ruleMatch;

  while ((ruleMatch = cssRulePattern.exec(text)) !== null) {
    const selector = ruleMatch[1].trim();
    const declarations = ruleMatch[2];
    const protectedToken = [
      ...framedGroupClassTokens,
      ...framedGroupModifiers.keys()
    ].find((token) => selectorHasClass(selector, token));

    if (protectedToken && visualResetPattern.test(declarations)) {
      report(`${file}:${lineNumber(text, ruleMatch.index)}: .${protectedToken} must not reset its framed visual contract`);
    }
  }
});

const framedContractFile = "assets/css/site/components.css";
const framedContractText = fs.readFileSync(path.join(root, framedContractFile), "utf8");
const framedContractRule = [...framedContractText.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .find((match) => selectorHasClass(match[1], "content-group"));

if (!framedContractRule) {
  report(`${framedContractFile}: missing shared .content-group contract`);
} else {
  const selector = framedContractRule[1];
  const declarations = framedContractRule[2];
  const contractLine = lineNumber(framedContractText, framedContractRule.index);
  const requiredDeclarations = [
    ["min-width", /min-width\s*:\s*0/],
    ["border", /border\s*:\s*1px\s+solid\s+var\(--color-accent-border\)/],
    ["border-radius", /border-radius\s*:\s*var\(--component-panel-radius\)/],
    ["padding", /padding\s*:\s*var\(--space-3xl\)/],
    ["background", /background\s*:\s*var\(--color-surface-muted\)/]
  ];

  framedGroupClassTokens.forEach((token) => {
    if (!selectorHasClass(selector, token)) {
      report(`${framedContractFile}:${contractLine}: shared contract is missing .${token}`);
    }
  });

  requiredDeclarations.forEach(([property, pattern]) => {
    if (!pattern.test(declarations)) {
      report(`${framedContractFile}:${contractLine}: shared contract is missing ${property}`);
    }
  });
}

listFiles(root, ".html")
  .map((file) => normalize(path.relative(root, file)))
  .sort()
  .forEach((file) => {
    const text = fs.readFileSync(path.join(root, file), "utf8");
    const classPattern = /class\s*=\s*["']([^"']+)["']/g;
    let match;

    while ((match = classPattern.exec(text)) !== null) {
      const classes = match[1].split(/\s+/);
      const legacyToken = legacyClassTokens.find((token) => classes.includes(token));

      if (legacyToken) {
        reportLegacyClass(file, text, legacyToken, match.index);
      }

      framedGroupModifiers.forEach((baseToken, modifierToken) => {
        if (classes.includes(modifierToken) && !classes.includes(baseToken)) {
          report(`${file}:${lineNumber(text, match.index)}: .${modifierToken} requires .${baseToken}`);
        }
      });
    }

    [
      /className\s*=\s*["']([^"']+)["']/g,
      /cardClass\s*[:=]\s*["']([^"']+)["']/g
    ].forEach((pattern) => {
      let inlineMatch;

      while ((inlineMatch = pattern.exec(text)) !== null) {
        const classes = inlineMatch[1].split(/\s+/);
        const legacyToken = legacyClassTokens.find((token) => classes.includes(token));

        if (legacyToken) {
          reportLegacyClass(file, text, legacyToken, inlineMatch.index);
        }
      }
    });
  });

listFiles(path.join(root, "assets", "js"), ".js")
  .map((file) => normalize(path.relative(root, file)))
  .sort()
  .forEach((file) => {
    const text = fs.readFileSync(path.join(root, file), "utf8");
    const patterns = [
      /className\s*=\s*["']([^"']+)["']/g,
      /cardClass\s*[:=]\s*["']([^"']+)["']/g
    ];

    patterns.forEach((pattern) => {
      let match;

      while ((match = pattern.exec(text)) !== null) {
        const classes = match[1].split(/\s+/);
        const legacyToken = legacyClassTokens.find((token) => classes.includes(token));

        if (legacyToken) {
          reportLegacyClass(file, text, legacyToken, match.index);
        }
      }
    });
  });

const siteEntry = fs.readFileSync(path.join(root, "assets/css/site.css"), "utf8");
[
  "base.css",
  "review.css",
  "layout.css",
  "components.css",
  "verbs.css",
  "imperative.css",
  "games.css",
  "learning.css",
  "navigation.css",
  "responsive.css",
  "print.css"
].forEach((file) => {
  if (!siteEntry.includes(`@import url("./site/${file}")`)) {
    report(`assets/css/site.css: missing ${file} import`);
  }
});

if (failures.length) {
  console.error(`\n${failures.length} style lint issue(s) found.`);
  process.exit(1);
}

console.log(`ok checked ${cssFiles.length} css files`);
