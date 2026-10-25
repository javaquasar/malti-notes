const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const acorn = require('acorn');

const hash = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
function record(kind, file, label, value) {
  const signature = hash(value);
  return { id: `${kind}:${file}:${signature}`, kind, file, label, signature };
}
function walkFiles(root, directory, extension) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const file = path.posix.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(root, file, extension) : file.endsWith(extension) ? [file] : [];
  }).sort();
}

// This function runs in Chromium: CSSOM and DOMParser are the source parsers.
function scanDocuments({ styles, documents, controlClasses }) {
  const findings = [], scripts = [];
  const surface = /^(?:background(?:-.+)?|color|border(?:-.+)?|box-shadow|font(?:-.+)?|outline(?:-.+)?|appearance|opacity|cursor)$/;
  const spacing = /^(?:gap|row-gap|column-gap|padding(?:-.+)?|margin(?:-.+)?|font-size)$/;
  const protectedControl = /(?:\.(?:study-[\w-]+|toggle-chip|action-button|action-link|review-add-button[\w-]*|demo-box)\b|\b(?:button|input|select|textarea)\b)/;
  function css(file, text) {
    const element = document.createElement('style'); element.textContent = text; document.head.append(element);
    const sheet = element.sheet;
    const shared = file.startsWith('assets/css/site/');
    const theme = file === 'assets/css/theme.css' || file.startsWith('assets/css/themes/');
    function visit(rules, context = []) {
      for (const rule of rules) {
        if (rule.type === CSSRule.IMPORT_RULE) findings.push({ kind: 'stylesheet-import', file, label: rule.cssText, value: rule.cssText });
        if (rule.cssRules) visit(rule.cssRules, [...context, rule.cssText.slice(0, rule.cssText.indexOf('{')).trim()]);
        if (!rule.style) continue;
        const selector = rule.selectorText || rule.keyText || rule.cssText.slice(0, rule.cssText.indexOf('{')).trim();
        const regulated = [...rule.style].filter((property) => surface.test(property) ||
          (property.startsWith('padding') && protectedControl.test(selector)) ||
          (spacing.test(property) && /\d+(?:px|rem)/.test(rule.style.getPropertyValue(property).replace(/\b0(?:px|rem)\b/g, '0'))) ||
          property.startsWith('--'));
        if (!regulated.length || theme) continue;
        findings.push({ kind: shared ? 'shared-selector' : 'legacy-css', file, label: [...context, selector].join(' / '), value: shared ? { context, selector } : {
          context, selector, declarations: regulated.sort().map((property) => [property, rule.style.getPropertyValue(property), rule.style.getPropertyPriority(property)])
        } });
      }
    }
    visit(sheet.cssRules);
    element.remove();
  }
  for (const source of styles) css(source.file, source.text);
  for (const { file, text } of documents) {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const standard = ['assets/css/theme.css', 'assets/css/site.css', 'assets/css/pages.css'];
    const links = [...doc.querySelectorAll('link[rel~="stylesheet"]')];
    const localPath = (node) => {
      const url = new URL(node.getAttribute('href') || '', 'https://policy.invalid/');
      return url.origin === 'https://policy.invalid' ? url.pathname.slice(1) : url.href;
    };
    const ordered = links.map(localPath).filter((file) => standard.includes(file));
    if (JSON.stringify(ordered) !== JSON.stringify(standard)) findings.push({ kind: 'stylesheet-import', file, label: 'nonstandard shell stylesheet order', value: ordered });
    for (const node of links) if (!standard.includes(localPath(node)) || (node.media && node.media !== 'all')) findings.push({ kind: 'stylesheet-import', file, label: node.getAttribute('href'), value: node.outerHTML });
    for (const [index, node] of [...doc.querySelectorAll('style')].entries()) css(`${file}#style-${index}`, node.textContent);
    for (const node of doc.querySelectorAll('[style]')) findings.push({ kind: 'legacy-css', file, label: `inline style on ${node.tagName}`, value: node.outerHTML });
    for (const node of doc.querySelectorAll('button,input,select,textarea')) {
      const binary = node.matches('input[type="checkbox"],input[type="radio"]');
      const fieldClasses = ['study-input', 'review-input', 'review-select', 'review-textarea'];
      const command = node.tagName === 'BUTTON' || node.matches('input[type="button"],input[type="submit"],input[type="reset"]');
      const classes = controlClasses.filter((name) => command ? !fieldClasses.includes(name) && name !== 'action-link' : fieldClasses.includes(name));
      const approved = binary ? node.closest('.study-check,.exercise-choice,.course-objective') : classes.some((name) => node.classList.contains(name));
      if (approved || node.matches('input[type="hidden"]')) continue;
      const attributes = [...node.attributes].map((attribute) => [attribute.name, attribute.value]).sort(([a], [b]) => a.localeCompare(b));
      findings.push({ kind: 'legacy-control', file, label: `${node.tagName.toLowerCase()} ${node.id || node.getAttribute('name') || node.className || node.textContent.trim().slice(0, 50)}`, value: { tag: node.tagName, attributes, text: node.textContent.replace(/\s+/g, ' ').trim() } });
    }
    for (const [index, node] of [...doc.querySelectorAll('script:not([src])')].entries()) {
      if (!node.type || ['module', 'text/javascript', 'application/javascript'].includes(node.type)) scripts.push({ file: `${file}#script-${index}`, text: node.textContent });
    }
  }
  return { findings, scripts };
}

function scriptFactories(file, text) {
  let tree;
  try { tree = acorn.parse(text, { ecmaVersion: 'latest', sourceType: 'module' }); }
  catch { tree = acorn.parse(text, { ecmaVersion: 'latest', sourceType: 'script' }); }
  const factories = new Set();
  const names = new Map([[tree, 'top-level factory']]);
  const property = (node) => node?.type === 'MemberExpression' ? node.computed ? node.property.value : node.property.name : null;
  function visit(node, scope = tree, parent = null) {
    if (!node || typeof node !== 'object') return;
    if (/^(?:FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/.test(node.type)) {
      scope = node;
      names.set(scope, node.id?.name || parent?.id?.name || parent?.key?.name || 'anonymous factory');
    }
    const method = property(node.callee);
    const literal = node.type === 'Literal' && typeof node.value === 'string' ? node.value : node.type === 'TemplateElement' ? node.value.cooked || '' : '';
    if ((node.type === 'MemberExpression' && ['style', 'classList', 'adoptedStyleSheets'].includes(property(node))) ||
      (node.type === 'AssignmentExpression' && ['innerHTML', 'outerHTML', 'className'].includes(property(node.left))) ||
      (node.type === 'CallExpression' && (['createElement', 'createElementNS', 'insertAdjacentHTML', 'insertRule', 'replaceSync', 'setAttribute', 'write', 'writeln'].includes(method) ||
        ['button', 'input', 'select', 'textarea', 'style'].includes(node.arguments[0]?.value) || node.callee?.name === 'eval')) ||
      (node.type === 'NewExpression' && ['Function', 'CSSStyleSheet'].includes(node.callee?.name)) ||
      /<\s*(?:button|input|select|textarea|style)\b|\bstyle\s*=/i.test(literal)) factories.add(scope);
    for (const [key, value] of Object.entries(node)) {
      if (key === 'start' || key === 'end') continue;
      if (Array.isArray(value)) value.forEach((child) => { if (child?.type) visit(child, scope, node); });
      else if (value?.type) visit(value, scope, node);
    }
  }
  visit(tree);
  function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !['start', 'end', 'loc', 'raw'].includes(key)).map(([key, child]) => [key, canonical(child)]));
    return value;
  }
  return [...factories].map((node) => record('script-factory', file, names.get(node), canonical(node)));
}

async function inventory(root, page, controls) {
  const read = (file) => ({ file, text: fs.readFileSync(path.join(root, file), 'utf8') });
  const result = await page.evaluate(scanDocuments, {
    styles: walkFiles(root, 'assets/css', '.css').map(read),
    documents: fs.readdirSync(root).filter((file) => file.endsWith('.html')).sort().map(read),
    controlClasses: controls
  });
  const payloads = [];
  function dataStyles(file, value, pointer = '') {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      const label = `${pointer}/${key}`;
      if (/style$/i.test(key) && typeof child === 'string' && child.trim()) payloads.push(record('style-payload', file, label, child));
      else dataStyles(file, child, label);
    }
  }
  for (const file of walkFiles(root, 'assets/data', '.json')) dataStyles(file, JSON.parse(read(file).text));
  return [...result.findings.map(({ kind, file, label, value }) => record(kind, file, label, value)), ...payloads,
    ...[...walkFiles(root, 'assets/js', '.js').map(read), ...result.scripts].flatMap(({ file, text }) => scriptFactories(file, text))]
    .sort((a, b) => a.id.localeCompare(b.id));
}
module.exports = { hash, record, scanDocuments, scriptFactories, inventory };
