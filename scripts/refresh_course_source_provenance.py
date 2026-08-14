import argparse
import hashlib
import json
import re
import unicodedata
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
INVENTORY_PATH = ROOT / "assets" / "data" / "book_coverage_inventory.json"
BINDINGS_PATH = ROOT / "assets" / "data" / "course_target_bindings.json"
OUTPUT_PATH = ROOT / "assets" / "data" / "course_source_provenance.json"

CHAPTER_RANGES = {
    "b1-introductions": (3, 14),
    "b1-residence": (15, 31),
    "b1-school": (32, 45),
    "b1-animals": (46, 64),
    "b1-colours": (65, 80),
    "b1-food": (81, 100),
    "b1-family": (101, 123),
    "b2-school-bag": (3, 13),
    "b2-imperative": (14, 26),
    "b2-weather": (27, 36),
    "b2-clothes": (37, 54),
    "b2-hobbies": (55, 73),
    "b2-town": (74, 96),
    "b2-recycling": (97, 108),
}


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def normalize(value):
    text = unicodedata.normalize("NFKC", value or "").lower().replace("’", "'")
    return " ".join(re.findall(r"[\w]+", text, flags=re.UNICODE))


def fold(value):
    value = value.replace("għ", "gh")
    replacements = str.maketrans({"ċ": "c", "ġ": "g", "ħ": "h", "ż": "z"})
    return "".join(
        character for character in unicodedata.normalize("NFD", value.translate(replacements))
        if unicodedata.category(character) != "Mn"
    )


def contains(page_text, target):
    needle = f" {normalize(target)} "
    haystack = f" {page_text} "
    if needle in haystack:
        return "text-exact"
    if f" {fold(normalize(target))} " in f" {fold(page_text)} ":
        return "text-folded"
    return None


def load_pages(pdf_path):
    reader = PdfReader(str(pdf_path))
    return [normalize(page.extract_text() or "") for page in reader.pages]


def hits_in_range(pages, target, page_start, page_end):
    exact = []
    folded = []
    for printed_page in range(page_start, page_end + 1):
        # Printed page 3 is PDF page 4, so its zero-based PDF index is 3.
        match = contains(pages[printed_page], target)
        if match == "text-exact":
            exact.append(printed_page)
        elif match == "text-folded":
            folded.append(printed_page)
    return (exact, "text-exact") if exact else (folded, "text-folded")


def chapter_for_page(book, page):
    prefix = book.lower()
    for chapter_id, (start, end) in CHAPTER_RANGES.items():
        if chapter_id.startswith(prefix) and start <= page <= end:
            return chapter_id
    return None


def main():
    parser = argparse.ArgumentParser(description="Refresh persisted book page provenance from the full text PDFs.")
    parser.add_argument("--b1", type=Path, required=True, help="Path to Maltese B1.pdf")
    parser.add_argument("--b2", type=Path, required=True, help="Path to M B2.pdf")
    args = parser.parse_args()

    inventory = json.loads(INVENTORY_PATH.read_text(encoding="utf-8"))
    bindings = json.loads(BINDINGS_PATH.read_text(encoding="utf-8"))
    pdf_paths = {"B1": args.b1, "B2": args.b2}
    expected_hashes = {
        source["book"]: source["sha256"]
        for source in inventory["sources"]
        if source["kind"] == "full-text-pdf"
    }
    pages_by_book = {}
    sources = []
    for book, pdf_path in pdf_paths.items():
        actual_hash = sha256(pdf_path)
        if actual_hash != expected_hashes[book]:
            raise ValueError(f"{book} PDF hash changed: expected {expected_hashes[book]}, found {actual_hash}")
        pages_by_book[book] = load_pages(pdf_path)
        sources.append({
            "book": book,
            "fileName": pdf_path.name,
            "sha256": actual_hash,
            "pdfPageCount": len(pages_by_book[book]),
            "printedPageOffset": 1,
        })

    inventory_by_chapter = {chapter["courseChapterId"]: chapter for chapter in inventory["chapters"]}
    chapters = []
    for chapter_id, (page_start, page_end) in CHAPTER_RANGES.items():
        chapter = inventory_by_chapter[chapter_id]
        chapters.append({
            "chapterId": chapter_id,
            "book": chapter["book"],
            "chapterNumber": chapter["number"],
            "chapterTitle": chapter["title"],
            "pageStart": page_start,
            "pageEnd": page_end,
        })

    targets = {}
    for target in bindings["targets"]:
        chapter = inventory_by_chapter[target["chapterId"]]
        page_start, page_end = CHAPTER_RANGES[target["chapterId"]]
        hits, match = hits_in_range(
            pages_by_book[target["book"]], target["sourceRequirement"], page_start, page_end
        )
        targets[target["id"]] = {
            "book": target["book"],
            "chapterId": target["chapterId"],
            "chapterNumber": chapter["number"],
            "chapterTitle": chapter["title"],
            "pageRange": [page_start, page_end],
            "primaryPage": hits[0] if hits else None,
            "pages": hits,
            "match": match if hits else "chapter-range",
        }

    verb_provenance = {}
    for paradigm in inventory["verbParadigms"]:
        book_pages = pages_by_book[paradigm["book"]]
        form_pages = {}
        all_hits = set()
        for form in paradigm["forms"]:
            hits, match = hits_in_range(book_pages, form, 3, len(book_pages) - 2)
            form_pages[form] = {"pages": hits, "match": match if hits else "not-found"}
            all_hits.update(hits)
        ordered_hits = sorted(all_hits)
        primary_page = ordered_hits[0] if ordered_hits else None
        verb_provenance[paradigm["id"]] = {
            "book": paradigm["book"],
            "lemma": paradigm["lemma"],
            "primaryPage": primary_page,
            "pages": ordered_hits,
            "chapterId": chapter_for_page(paradigm["book"], primary_page) if primary_page else None,
            "forms": form_pages,
        }

    output = {
        "schemaVersion": 1,
        "generatedAt": "2026-08-14",
        "description": "Persisted target-to-book provenance. Normal builds validate this file and do not parse source PDFs.",
        "method": {
            "pageNumbering": "Printed book pages; printed page 3 is PDF page 4.",
            "targetMatch": "First exact normalized text hit within the audited chapter; folded OCR match is used only when exact text is absent.",
            "fallback": "chapter-range means OCR did not expose an exact target token; the audited chapter range remains authoritative.",
            "refreshRule": "Run the manual refresh only when a full-text source PDF hash changes or the frozen inventory is revised.",
        },
        "sources": sources,
        "chapters": chapters,
        "targets": targets,
        "verbParadigms": verb_provenance,
    }
    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    exact_count = sum(1 for item in targets.values() if item["match"] != "chapter-range")
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)}: {exact_count}/{len(targets)} targets have OCR page hits.")


if __name__ == "__main__":
    main()
