const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const themes = [
  { name: "classic", file: "assets/css/theme.css", selector: ':root[data-theme="classic"]' },
  { name: "forest", file: "assets/css/themes/forest.css", selector: ':root[data-theme="forest"]' },
  { name: "contrast", file: "assets/css/themes/contrast.css", selector: ':root[data-theme="contrast"]' }
];

const pairs = [
  ["body text", "--color-text", "--color-surface", 4.5],
  ["muted text", "--color-text-muted", "--color-surface", 4.5],
  ["brand text", "--color-brand", "--color-surface", 3],
  ["accent text", "--color-accent", "--color-surface", 3],
  ["danger text", "--color-danger", "--color-surface", 4.5],
  ["success text", "--color-success", "--color-surface", 4.5],
  ["print text", "--print-text", "--print-page-bg", 7]
];

function parseVars(text, selector) {
  const selectorStart = text.indexOf(selector);

  if (selectorStart === -1) {
    throw new Error(`${selector} block is missing`);
  }

  const start = text.indexOf("{", selectorStart);
  const end = text.indexOf("\n}", start);
  const block = text.slice(start, end);
  const vars = new Map();

  [...block.matchAll(/(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g)].forEach((match) => {
    vars.set(match[1], match[2].trim());
  });

  return vars;
}

function hexToRgb(value) {
  const match = value.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);

  if (!match) {
    return null;
  }

  let hex = match[1];

  if (hex.length === 3) {
    hex = hex.split("").map((char) => char + char).join("");
  }

  const int = parseInt(hex, 16);

  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255
  };
}

function luminance({ r, g, b }) {
  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return (0.2126 * channel(r)) + (0.7152 * channel(g)) + (0.0722 * channel(b));
}

function contrast(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  const light = Math.max(a, b);
  const dark = Math.min(a, b);

  return (light + 0.05) / (dark + 0.05);
}

const failures = [];
const baseVars = parseVars(fs.readFileSync(path.join(root, "assets/css/theme.css"), "utf8"), ":root,");

themes.forEach((theme) => {
  const text = fs.readFileSync(path.join(root, theme.file), "utf8");
  const vars = new Map([...baseVars, ...parseVars(text, theme.selector)]);

  pairs.forEach(([label, fgToken, bgToken, minimum]) => {
    const fgValue = vars.get(fgToken);
    const bgValue = vars.get(bgToken);
    const fg = fgValue && hexToRgb(fgValue);
    const bg = bgValue && hexToRgb(bgValue);

    if (!fg || !bg) {
      failures.push(`${theme.name} ${label}: ${fgToken}/${bgToken} must be hex tokens for contrast check`);
      return;
    }

    const ratio = contrast(fg, bg);

    if (ratio < minimum) {
      failures.push(`${theme.name} ${label}: ${ratio.toFixed(2)} < ${minimum}`);
    } else {
      console.log(`ok ${theme.name} ${label}: ${ratio.toFixed(2)}`);
    }
  });
});

if (failures.length) {
  failures.forEach((failure) => console.error(`fail ${failure}`));
  console.error(`\n${failures.length} theme accessibility issue(s) found.`);
  process.exit(1);
}

console.log("\nAll theme accessibility checks passed.");
