#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE_ENV = "MALTI_VERB_MT_SOURCE"
EXTENSIONS_PATH = ROOT / "assets" / "data" / "verbs_extensions.json"
PERSON_EXPORT_ORDER = ["jiena", "inti", "huwa", "hija", "aħna", "intom", "huma"]
PERSON_EXPORT_MAP = {
    "jien": "jiena",
    "int": "inti",
    "huwa": "huwa",
    "hija": "hija",
    "aħna": "aħna",
    "intom": "intom",
    "huma": "huma",
}
TENSE_EXPORT_MAP = {
    "present": "imperfett",
    "past": "perfett",
    "imperative": "imperattiv",
}


def load_dotenv(dotenv_path: Path) -> None:
    if not dotenv_path.exists():
        return
    for raw_line in dotenv_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        os.environ.setdefault(key, value)


def resolve_source_root(cli_value: Path | None) -> Path:
    if cli_value:
        return cli_value
    env_value = os.environ.get(DEFAULT_SOURCE_ENV)
    if env_value:
        return Path(env_value)
    raise SystemExit(
        f"Missing source folder. Set {DEFAULT_SOURCE_ENV} or pass --target."
    )


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def letter_slug_for(slug: str) -> str:
    lowered = slug.lower()
    if lowered.startswith("gh"):
        return "gh"
    if lowered.startswith("ie"):
        return "ie"
    return lowered[:1] or "_"


def export_people(forms: dict[str, str], allowed_people: list[str]) -> dict[str, str]:
    exported: dict[str, str] = {}
    for person in allowed_people:
        source_person = PERSON_EXPORT_MAP.get(person, person)
        value = forms.get(person) or forms.get(source_person)
        if value:
            exported[source_person] = value
    return exported


def export_section(public_tense: str, table: dict[str, Any]) -> tuple[str, dict[str, Any]] | None:
    source_tense = TENSE_EXPORT_MAP.get(public_tense)
    if not source_tense:
        return None

    is_imperative = public_tense == "imperative"
    allowed_people = ["int", "intom"] if is_imperative else ["jien", "int", "huwa", "hija", "aħna", "intom", "huma"]
    persons = [PERSON_EXPORT_MAP[person] for person in allowed_people]
    positive = export_people(table.get("positive") or {}, allowed_people)
    negative = export_people(table.get("negative") or {}, allowed_people)

    if not positive and not negative:
        return None

    return (
        source_tense,
        {
            "persons": persons,
            "columns": {
                "pożittiv": positive,
                "negattiv": negative,
            },
            "raw_items": [],
        },
    )


def build_export_entry(slug: str, detail: dict[str, Any]) -> dict[str, Any]:
    letter_slug = letter_slug_for(slug)
    meta = detail.get("meta") or {}
    tables = detail.get("tables") or {}

    sections: dict[str, Any] = {}
    for public_tense in ("present", "past", "imperative"):
        exported = export_section(public_tense, tables.get(public_tense) or {})
        if exported:
            source_tense, payload = exported
            sections[source_tense] = payload

    return {
        "slug": slug,
        "letter_slug": letter_slug,
        "url": "",
        "lemma": detail.get("lemma") or slug,
        "meanings": detail.get("meanings") or [],
        "meta": {
            "forma": meta.get("form") or "",
            "tip": meta.get("type") or "",
            "kategorija_1": meta.get("category1") or "",
            "għerq": meta.get("root") or "",
            "kategorija_2": meta.get("category2") or "",
            "mudell": meta.get("pattern") or "",
        },
        "sections": sections,
        "notes": detail.get("notes") or [],
        "scraped_at": "",
    }


def build_index_row(entry: dict[str, Any]) -> dict[str, Any]:
    return {
        "slug": entry["slug"],
        "letter_slug": entry["letter_slug"],
        "lemma": entry["lemma"],
        "url": entry.get("url") or "",
        "meanings": entry.get("meanings") or [],
        "forma": entry.get("meta", {}).get("forma") or "",
        "tip": entry.get("meta", {}).get("tip") or "",
        "għerq": entry.get("meta", {}).get("għerq") or "",
    }


def should_export_slug(slug: str, detail: dict[str, Any], selected: set[str]) -> bool:
    if selected and slug not in selected:
        return False
    meta = detail.get("meta") or {}
    return str(meta.get("type") or "").strip().lower() == "local extension"


def upsert_index_rows(index_rows: list[dict[str, Any]], new_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    existing_by_slug = {row.get("slug"): row for row in index_rows if isinstance(row, dict) and row.get("slug")}
    for row in new_rows:
        existing_by_slug[row["slug"]] = row
    merged = list(existing_by_slug.values())
    merged.sort(key=lambda row: str(row.get("lemma") or row.get("slug") or "").lower())
    return merged


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Export local verbs_extensions entries into a verb.mt-compatible folder structure."
    )
    parser.add_argument(
        "--target",
        type=Path,
        default=None,
        help=f"Path to verb.mt data\\verbs folder. Overrides {DEFAULT_SOURCE_ENV}.",
    )
    parser.add_argument(
        "--slug",
        action="append",
        default=[],
        help="Only export this extension slug. Can be passed multiple times.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually write files into the target verb.mt folder. Without this flag the script performs a dry run.",
    )
    args = parser.parse_args()

    load_dotenv(ROOT / ".env")
    target_root = resolve_source_root(args.target)
    extensions = read_json(EXTENSIONS_PATH)
    details = extensions.get("details") or {}
    selected = {item.strip() for item in args.slug if item.strip()}

    exports: list[dict[str, Any]] = []
    index_rows: list[dict[str, Any]] = []
    for slug, detail in details.items():
        if not should_export_slug(slug, detail, selected):
            continue
        entry = build_export_entry(slug, detail)
        exports.append(entry)
        index_rows.append(build_index_row(entry))

    if not exports:
        print("No matching local extension verbs to export.")
        return 0

    print(f"Prepared {len(exports)} verb.mt-compatible extension entries.")
    for entry in exports:
        print(f"- {entry['slug']} -> by-slug\\{entry['letter_slug']}\\{entry['slug']}.json")

    if not args.apply:
        print("Dry run only. Re-run with --apply to write files.")
        return 0

    by_slug_root = target_root / "by-slug"
    for entry in exports:
        target_path = by_slug_root / entry["letter_slug"] / f"{entry['slug']}.json"
        write_json(target_path, entry)

    index_path = target_root / "index.json"
    existing_index = read_json(index_path) if index_path.exists() else []
    merged_index = upsert_index_rows(existing_index, index_rows)
    write_json(index_path, merged_index)

    print(f"Wrote {len(exports)} entry files and updated {index_path}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
