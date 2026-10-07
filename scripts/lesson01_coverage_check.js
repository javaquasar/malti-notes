const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "docs/lesson01-source-coverage.json"), "utf8"));
const expected = [
    "common phrases number 1.pdf", "espressjonijiet ta tislim.pdf", "expressions number2.pdf",
    "greetings 3.pdf", "greetings number4.pdf", "insiru nafu lil xulxin-1.pdf",
    "insiru nafu lil xulxin-2.pdf", "jien min jien.pdf", "Tislim-u-Tislijiet.pdf", "useful expressions.pdf"
];
const errors = [];
for (const file of expected) {
    if (!manifest.entries.some((entry) => entry.file === file)) errors.push("Unmapped source: " + file);
}
const cache = new Map();
for (const entry of manifest.entries) {
    const stem = entry.destination.replace(/\.html$/, "");
    if (!cache.has(stem)) cache.set(stem, JSON.parse(fs.readFileSync(path.join(root, "assets/data/" + stem + "_lesson01_examples.json"), "utf8")));
    const item = cache.get(stem).groups.find((group) => group.id === entry.group)?.items.find((item) => item.slug === entry.slug);
    const html = fs.readFileSync(path.join(root, entry.destination), "utf8");
    if (!item || !html.includes('data-lesson01-group="' + entry.group + '"')) errors.push("Unpublished source example: " + JSON.stringify(entry));
}
for (let page = 3; page <= 16; page += 1) {
    if (!manifest.entries.some((entry) => entry.file === "Tislim-u-Tislijiet.pdf" && entry.page === page)) errors.push("Unmapped presentation page: " + page);
}
if (errors.length) throw new Error(errors.join("\n"));
console.log("ok Lesson 01: " + expected.length + " PDFs, " + manifest.entries.length + " source mappings, " + cache.size + " destination pages");
