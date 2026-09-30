from __future__ import annotations

import argparse
import json
import os
import pathlib
import re
from collections import defaultdict
from pypdf import PdfReader

PROJECT = pathlib.Path(__file__).resolve().parents[1]
DEFAULT_BANK_PATH = PROJECT / "assets" / "js" / "word-search-bank.js"
DEFAULT_REPORT_PATH = PROJECT / "docs" / "analysis" / "word-search-pdf-coverage.md"

IGNORE = {
    "level", "key", "vocabulary", "list", "english", "primary", "department", "malta",
    "page", "year", "unit", "topic", "topics", "word", "words", "final", "name", "class",
}

# English token aliases. Left side is a PDF token; right side is the bank gloss token it should count as.
ALIASES = {
    # spelling / simple variants
    "caf": "cafe",
    "yogurt": "yoghurt",
    "jewelry": "jewellery",
    "practice": "practise",
    "soccer": "football",
    "t-shirt": "shirt",
    "pc": "computer",
    "cd": "disc",
    "dvd": "cd",
    "tv": "television",
    "bike": "bicycle",
    "refrigerator": "fridge",
    "store": "shop",
    "bookshop": "shop",
    "earring": "earrings",
    "bookstore": "bookshop",
    "cafeteria": "cafe",
    "chef": "cook",
    "chemist": "pharmacy",
    "hippo": "hippopotamus",
    "tortoise": "turtle",
    "mice": "mouse",
    "men": "man",
    "women": "woman",
    "grandad": "grandfather",
    "grandpa": "grandfather",
    "grandma": "grandmother",
    "granny": "grandmother",
    "grandchild": "child",
    "granddaughter": "daughter",
    "grandson": "son",
    "grown-up": "adult",
    "kid": "child",
    "teenager": "teen",
    "child": "boy",
    "guy": "boy",
    "wife": "mother",
    "husband": "father",
    # near synonyms already in the bank
    "ache": "pain",
    "bath": "bathroom",
    "bathing": "swimsuit",
    "bat": "racket",
    "candy": "sweet",
    "carpet": "rug",
    "caged": "cage",
    "cloud": "cloudy",
    "clothes": "clothing",
    "classroom": "class",
    "cost": "price",
    "cupboard": "wardrobe",
    "danger": "dangerous",
    "directions": "direction",
    "fine": "good",
    "dressed": "dress",
    "entertainment": "show",
    "exercise": "practice",
    "favourite": "favorite",
    "feelings": "feeling",
    "furniture": "chair",
    "furry": "fur",
    "gas": "petrol",
    "grandchild": "son",
    "grilled": "roast",
    "hobbies": "hobby",
    "holidays": "holiday",
    "home": "house",
    "instructions": "instruction",
    "interested": "interesting",
    "jewellery": "earrings",
    "jewelry": "earrings",
    "job": "work",
    "kitten": "cat",
    "leisure": "hobby",
    "licence": "passport",
    "lift": "elevator",
    "luggage": "suitcase",
    "mathematics": "maths",
    "maths": "mathematics",
    "meal": "food",
    "motorbike": "motorcycle",
    "occupation": "work",
    "occupations": "work",
    "online": "web",
    "opinions": "opinion",
    "panto": "pantomime",
    "parent": "mother",
    "people": "person",
    "performance": "show",
    "pet": "animal",
    "piece": "slice",
    "photography": "photograph",
    "plane": "airplane",
    "places": "place",
    "pop": "music",
    "postcard": "card",
    "public": "services",
    "pupil": "student",
    "recycled": "recycling",
    "ride": "riding",
    "rubber": "eraser",
    "science": "subject",
    "services": "service",
    "shoes": "shoe",
    "shopping": "shop",
    "sick": "ill",
    "sitting": "seat",
    "skate": "skateboard",
    "skiing": "ski",
    "snowboarding": "snowboard",
    "sock": "socks",
    "sports": "sport",
    "spot": "spotted",
    "stripe": "striped",
    "studies": "study",
    "temperature": "fever",
    "text": "textbook",
    "town": "city",
    "trainers": "shoes",
    "transport": "bus",
    "tub": "bathroom",
    "vegetable": "vegetables",
    "wheel": "bike",
    "wood": "tree",
    "wool": "sheep",
    "x-ray": "doctor",
    # word families where the single word-search form is enough for this report
    "boiled": "boil",
    "brighten": "light",
    "driving": "drive",
    "fishing": "fish",
    "fried": "fry",
    "riding": "ride",
    "sailing": "sail",
    "surfboarding": "surfboard",
    "windsurfing": "surf",
}

LOW_VALUE = {
    "aero", "and", "at", "by", "dr", "dy", "etc", "for", "into", "mp", "mr", "mrs", "ms",
    "my", "st", "there", "through", "us", "versus",
}


def tokens_from_text(text: str) -> list[str]:
    return re.findall(r"[A-Za-z]+(?:[-'][A-Za-z]+)?", text.lower())


def normalize_token(token: str) -> str:
    return token.strip("-'").lower()


def simple_aliases(token: str) -> set[str]:
    forms = {token}
    if token.endswith("ies") and len(token) > 4:
        forms.add(token[:-3] + "y")
    if token.endswith("es") and len(token) > 3:
        forms.add(token[:-2])
    if token.endswith("s") and len(token) > 3 and not token.endswith(("ss", "us", "ews")):
        forms.add(token[:-1])
    # Avoid broad -ing stemming here: words like earring/news can create false matches.
    if token.endswith("ed") and len(token) > 4:
        stem = token[:-2]
        forms.add(stem)
        if len(stem) > 1 and stem[-1] == stem[-2]:
            forms.add(stem[:-1])
    return forms


def load_pdf_tokens(pdf_path: pathlib.Path) -> list[str]:
    text = "\n".join(page.extract_text() or "" for page in PdfReader(str(pdf_path)).pages)
    return sorted({t for raw in tokens_from_text(text) if (t := normalize_token(raw)) and len(t) > 1 and t not in IGNORE})


def load_bank(bank_path: pathlib.Path) -> tuple[list[dict], dict[str, list[tuple[str, str]]]]:
    src = bank_path.read_text(encoding="utf-8")
    match = re.search(r"window\.MALTI_WORD_SEARCH_TOPICS\s*=\s*(\[.*\]);\s*$", src, re.S)
    if not match:
        raise RuntimeError("Cannot parse word-search bank")
    topics = json.loads(match.group(1))
    by_gloss: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for topic in topics:
        for mt, en in topic["words"]:
            gloss = str(en).lower().replace("same", str(mt).lower())
            for token in tokens_from_text(gloss):
                by_gloss[normalize_token(token)].append((topic["label"], mt))
    return topics, by_gloss


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Compare a vocabulary PDF with the word-search bank.")
    parser.add_argument(
        "--pdf",
        type=pathlib.Path,
        default=pathlib.Path(os.environ["MALTI_WORD_SEARCH_SOURCE"]) if os.environ.get("MALTI_WORD_SEARCH_SOURCE") else None,
        help="Source PDF path (or set MALTI_WORD_SEARCH_SOURCE)",
    )
    parser.add_argument("--bank", type=pathlib.Path, default=DEFAULT_BANK_PATH, help="Word-search bank JavaScript file")
    parser.add_argument("--output", type=pathlib.Path, default=DEFAULT_REPORT_PATH, help="Generated Markdown report")
    parser.add_argument("--check", action="store_true", help="Fail if the committed report differs from generated output")
    args = parser.parse_args()
    if args.pdf is None:
        parser.error("--pdf is required unless MALTI_WORD_SEARCH_SOURCE is set")
    return args


def build_report(pdf_path: pathlib.Path, bank_path: pathlib.Path) -> tuple[str, dict[str, int]]:
    pdf_tokens = load_pdf_tokens(pdf_path)
    _, by_gloss = load_bank(bank_path)
    bank_tokens = set(by_gloss)

    exact = []
    alias = []
    low_value = []
    missing = []

    for token in pdf_tokens:
        if token in bank_tokens:
            exact.append(token)
            continue

        candidates = []
        if token in ALIASES:
            candidates.append(ALIASES[token])
        candidates.extend(sorted(simple_aliases(token) - {token}))

        matched = None
        for candidate in candidates:
            if candidate in bank_tokens:
                matched = candidate
                break
            if candidate in ALIASES and ALIASES[candidate] in bank_tokens:
                matched = ALIASES[candidate]
                break
        if matched:
            alias.append((token, matched, by_gloss[matched][0]))
        elif token in LOW_VALUE:
            low_value.append(token)
        else:
            missing.append(token)

    lines = [
        "# Smart Word Search Coverage Against Level 5 English PDF",
        "",
        f"- PDF unique English word tokens: {len(pdf_tokens)}",
        f"- Covered exactly by current bank English glosses: {len(exact)}",
        f"- Covered by alias/synonym/word-family matching: {len(alias)}",
        f"- Excluded as low-value function/header tokens: {len(low_value)}",
        f"- Still not covered: {len(missing)}",
        "",
        "This report checks English tokens from the PDF against the Maltese word-search bank. Alias coverage is intentionally conservative: it only counts common spelling variants, plurals, gerunds, and explicit school-vocabulary synonyms.",
        "",
        "## Covered By Alias",
        "",
    ]
    if alias:
        for token, matched, (topic, mt) in alias:
            lines.append(f"- {token} -> {matched} (`{mt}`, {topic})")
    else:
        lines.append("- None")

    lines.extend(["", "## Still Not Covered", ""])
    lines.extend(f"- {token}" for token in missing)

    lines.extend(["", "## Low-Value Tokens Excluded From Missing Count", ""])
    lines.extend(f"- {token}" for token in low_value)

    lines.extend(["", "## Covered Exactly", ""])
    lines.extend(f"- {token}" for token in exact)
    lines.append("")

    report = "\n".join(lines)
    counts = {
        "exact": len(exact),
        "alias": len(alias),
        "low_value": len(low_value),
        "missing": len(missing),
        "pdf": len(pdf_tokens),
    }
    return report, counts


def main() -> None:
    args = parse_args()
    pdf_path = args.pdf.resolve()
    bank_path = args.bank.resolve()
    output_path = args.output.resolve()
    if not pdf_path.is_file():
        raise SystemExit(f"Source PDF does not exist: {pdf_path}")
    if not bank_path.is_file():
        raise SystemExit(f"Word-search bank does not exist: {bank_path}")

    report, counts = build_report(pdf_path, bank_path)
    if args.check:
        current = output_path.read_text(encoding="utf-8") if output_path.exists() else ""
        if current != report:
            raise SystemExit(f"Report is stale: {output_path}")
        action = "checked"
    else:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(report, encoding="utf-8")
        action = "wrote"

    summary = " ".join(f"{key}={value}" for key, value in counts.items())
    print(f"{action} {output_path} {summary}")


if __name__ == "__main__":
    main()
