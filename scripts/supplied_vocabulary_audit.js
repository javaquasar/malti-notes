const fs = require('node:fs');
const path = require('node:path');
const acorn = require('acorn');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const file = 'docs/analysis/supplied-vocabulary-audit.json';
const inventory = JSON.parse(fs.readFileSync(path.join(root, 'docs/analysis/supplied-vocabulary-inventory.json'), 'utf8'));
const normalize = text => String(text).normalize('NFKC').toLocaleLowerCase('mt').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const contains = (text, term) => (` ${normalize(text)} `).includes(` ${normalize(term)} `);
const excluded = /^(?:book_coverage_inventory|search-index|site-map|content_verification_sources|vocabulary_review_catalog|comprehensive_test_bank|teaching_depth_report)\.json$/;
const textKeys = new Set(['maltese', 'example', 'rule', 'pattern', 'prompt', 'answer', 'choices', 'options', 'accepted', 'tokens', 'note', 'notes', 'left', 'right', 'form', 'lemma', 'positive', 'negative']);

async function corpus() {
  const texts = [];
  const add = (text, location, kind) => { if (text?.trim()) texts.push({ text, normalized: ` ${normalize(text)} `, location, kind }); };
  function walk(value, location, active = false, headword = false) {
    if (typeof value === 'string') { if (active) add(value, location, headword ? 'headword' : 'context'); return; }
    if (!value || typeof value !== 'object' || value.verificationStatus === 'needs-review') return;
    if (Array.isArray(value)) { value.forEach((child, index) => walk(child, `${location}/${index}`, active, headword)); return; }
    for (const [key, child] of Object.entries(value)) walk(child, `${location}/${key}`, active || textKeys.has(key), key === 'maltese');
  }
  const walkFiles = directory => fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => {
    const name = `${directory}/${entry.name}`;
    return entry.isDirectory() ? (entry.name === 'generated' ? [] : walkFiles(name)) : name.endsWith('.json') ? [name] : [];
  });
  for (const name of walkFiles('assets/data')) {
    if (!excluded.test(path.basename(name))) walk(JSON.parse(fs.readFileSync(path.join(root, name), 'utf8')), name);
  }
  // Decode the game's literal data through an AST; never execute source files.
  const gameFile = 'assets/js/word-search-bank.js';
  const tree = acorn.parse(fs.readFileSync(path.join(root, gameFile), 'utf8'), { ecmaVersion: 'latest' });
  const literal = node => {
    if (node.type === 'Literal') return node.value;
    if (node.type === 'ArrayExpression') return node.elements.map(literal);
    if (node.type === 'ObjectExpression') return Object.fromEntries(node.properties.map(p => [p.key.name || p.key.value, literal(p.value)]));
    throw new Error(`Non-literal game data: ${node.type}`);
  };
  const topics = literal(tree.body.find(n => n.type === 'ExpressionStatement' && n.expression.type === 'AssignmentExpression').expression.right);
  for (const topic of topics) for (const [mt] of topic.words) add(mt, `${gameFile}#${topic.id}`, 'game');
  const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await chromium.launch(fs.existsSync(chrome) ? { executablePath: chrome } : {});
  try {
    const page = await browser.newPage();
    const pages = fs.readdirSync(root).filter(name => name.endsWith('.html')).map(name => [name, fs.readFileSync(path.join(root, name), 'utf8')]);
    const parsed = await page.evaluate(files => files.map(([name, html]) => {
      const document = new DOMParser().parseFromString(html, 'text/html');
      document.querySelectorAll('script, style, template, [hidden], [data-verification-status="needs-review"]').forEach(element => element.remove());
      return [name, document.body.textContent];
    }), pages);
    for (const [name, text] of parsed) add(text, name, 'html');
  } finally { await browser.close(); }
  return texts;
}

function evidence(texts, term) {
  const needle = ` ${normalize(term)} `;
  const matches = texts.filter(row => row.normalized.includes(needle));
  const direct = matches.find(row => row.kind === 'headword' && (normalize(row.text) === normalize(term) || row.text.split('/').some(part => normalize(part) === normalize(term))));
  const game = matches.find(row => row.kind === 'game');
  const hit = direct || matches.find(row => row.kind !== 'game') || game;
  return {
    status: direct ? 'direct' : matches.some(row => row.kind !== 'game') ? 'context-only' : game ? 'game-only' : 'absent',
    evidence: hit ? { location: hit.location, sample: hit.text.replace(/\s+/g, ' ').trim().slice(0, 180) } : null
  };
}

async function main() {
  const texts = await corpus();
  const terms = new Map();
  for (const group of inventory.groups) for (const term of group.terms) {
    const key = normalize(term);
    const row = terms.get(key) || { term, sources: [] };
    row.sources = [...new Set([...row.sources, ...group.sources])];
    terms.set(key, row);
  }
  const target = path.join(root, file);
  if (process.argv.includes('--capture-before')) {
    if (fs.existsSync(target)) throw new Error('Baseline already exists; do not replace before-evidence with an after snapshot.');
    const rows = [...terms.values()].map(row => ({ ...row, before: evidence(texts, row.term) }));
    fs.writeFileSync(target, JSON.stringify({ date: inventory.date, scope: inventory.scope, methodology: 'Unicode word/phrase boundaries retaining Maltese letters; apostrophe and hyphen clitics separated. Exact textual coverage is not automatic lemmatization or sense verification. Learner data, inert DOM-parsed HTML and literal game data; no generated search/catalog evidence.', records: rows }, null, 2) + '\n');
    const counts = rows.reduce((all, row) => ({ ...all, [row.before.status]: (all[row.before.status] || 0) + 1 }), {});
    console.log(`Captured ${rows.length} distinct source forms/expressions: ${JSON.stringify(counts)}`);
    for (const row of rows.filter(row => row.before.status === 'absent')) console.log(`absent: ${row.term}`);
    return;
  }
  const audit = JSON.parse(fs.readFileSync(target, 'utf8'));
  const decisions = JSON.parse(fs.readFileSync(path.join(root, 'docs/analysis/supplied-vocabulary-decisions.json'), 'utf8'));
  const selected = new Map(Object.entries(decisions.decisions).map(([term, decision]) => [normalize(term), decision]));
  const failures = [];
  let added = 0;
  for (const record of audit.records) {
    const row = { ...record, ...(selected.get(normalize(record.term)) || {}) };
    const before = decisions.coverageCorrections[record.term] || record.before;
    const after = evidence(texts, row.term);
    if (before.status !== 'absent' && after.status === 'absent') failures.push(`Previously covered source form disappeared: ${row.term}`);
    if (row.action === 'covered-by-form') {
      if (!row.reason || !row.coveredBy || !row.destination || !texts.some(text => text.location.startsWith(row.destination) && contains(text.text, row.coveredBy))) failures.push(`Unsupported inflection/construction coverage: ${row.term}`);
    }
    if (row.action === 'add' || row.action === 'promote' || row.action === 'alias') {
      if (after.status === 'absent') failures.push(`Unpublished selected entry: ${row.term}`);
      if (!row.destination || !fs.existsSync(path.join(root, row.destination))) failures.push(`Missing destination for ${row.term}`);
      const current = texts.filter(text => text.location.startsWith(row.destination));
      if (!current.some(text => contains(text.text, row.term))) failures.push(`Wrong destination for ${row.term}`);
      added++;
    }
    if (before.status === 'absent' && !row.action) failures.push(`Undisposed source gap: ${row.term}`);
    if (row.action === 'hold' && !row.reason) failures.push(`Missing hold reason: ${row.term}`);
  }
  if (failures.length) throw new Error(failures.join('\n'));
  console.log(`PASS: ${audit.records.length} baseline records retained; ${added} additions/promotions/aliases reach their intended learning data; every absent form has a disposition.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
