#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
COURSE_BANK_PATH = ROOT / "assets" / "data" / "verbs_course_bank.json"
PACK_PATH = ROOT / "assets" / "data" / "generated" / "verb_lookup_pack.json"
REPORT_PATH = ROOT / "verbs_course_unreachable.md"


def maybe_fix_mojibake(value: str) -> str:
    if not value:
        return value
    for source_encoding in ("cp1252", "latin1"):
        try:
            fixed = value.encode(source_encoding).decode("utf-8")
        except UnicodeError:
            continue
        if fixed != value and any(ch in fixed for ch in "għħżġċàèéìòù’"):
            return fixed
    return value


def clean_json(value: Any) -> Any:
    if isinstance(value, dict):
        return {clean_json(key): clean_json(item) for key, item in value.items()}
    if isinstance(value, list):
        return [clean_json(item) for item in value]
    if isinstance(value, str):
        return maybe_fix_mojibake(value)
    return value


def read_json(path: Path) -> Any:
    return clean_json(json.loads(path.read_text(encoding="utf-8")))


def normalize_key(text: str) -> str:
    text = maybe_fix_mojibake(text).strip().lower()
    replacements = {
        "?": "a", "?": "a", "?": "a", "?": "a", "?": "a", "?": "a",
        "?": "e", "?": "e", "?": "e", "?": "e",
        "?": "i", "?": "i", "?": "i", "?": "i",
        "?": "o", "?": "o", "?": "o", "?": "o", "?": "o",
        "?": "u", "?": "u", "?": "u", "?": "u",
        "?": "c", "?": "g", "?": "h", "?": "z",
        "????": "a", "????": "a", "????": "a", "????": "a", "????": "a", "????": "a",
        "????": "e", "????": "e", "????": "e", "????": "e",
        "????": "i", "????": "i", "????": "i", "????": "i",
        "????": "o", "????": "o", "????": "o", "????": "o", "????": "o",
        "????": "u", "????": "u", "????": "u", "????": "u",
        "?????": "c", "????": "g", "????": "h", "????": "z",
        "??": "a", "??": "a", "??": "a", "??": "a", "??": "a", "??": "a",
        "??": "e", "??": "e", "??": "e", "??": "e",
        "??": "i", "??": "i", "??": "i", "??": "i",
        "??": "o", "??": "o", "??": "o", "??": "o", "??": "o",
        "??": "u", "??": "u", "??": "u", "??": "u",
        "??": "c", "??": "g", "??": "h", "??": "z",
        "???": "'", "???": "'", "`": "'",
    }
    return " ".join("".join(replacements.get(ch, ch) for ch in text).split())


def form_variants(form: str) -> list[str]:
    base = normalize_key(form)
    variants = {base}
    if base.startswith("i") and len(base) > 1:
        variants.add(base[1:])
    return [item for item in variants if item]


def has_exact_form_match(pack: dict[str, Any], normalized_form: str) -> bool:
    return bool((pack.get("forms") or {}).get(normalized_form))


def has_alias_match(pack: dict[str, Any], normalized_form: str) -> bool:
    slug = (pack.get("aliases") or {}).get(normalized_form)
    return bool(slug and (pack.get("details") or {}).get(slug))


def has_exact_lemma_match(pack: dict[str, Any], normalized_form: str) -> bool:
    for entry in pack.get("index") or []:
        if normalize_key(str(entry.get("lemma") or "")) == normalized_form:
            slug = str(entry.get("slug") or "")
            if slug and (pack.get("details") or {}).get(slug):
                return True
    return False


def is_reachable(pack: dict[str, Any], item: dict[str, Any]) -> bool:
    slug_hint = str(item.get("slugHint") or "").strip()
    if slug_hint and (pack.get("details") or {}).get(slug_hint):
        return True

    lookup_hint = str(item.get("lookupHint") or "").strip()
    if lookup_hint:
        for variant in form_variants(lookup_hint):
            if has_exact_form_match(pack, variant):
                return True
            if has_alias_match(pack, variant):
                return True
            if has_exact_lemma_match(pack, variant):
                return True

    form = str(item.get("form") or "").strip()
    if not form:
        return False

    for variant in form_variants(form):
        if has_exact_form_match(pack, variant):
            return True
        if has_alias_match(pack, variant):
            return True
        if has_exact_lemma_match(pack, variant):
            return True
    return False


def flatten_course_items(bank: dict[str, Any]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for group in bank.get("groups") or []:
        for item in group.get("items") or []:
            if isinstance(item, dict):
                items.append(item)
    return items


def build_report(items: list[dict[str, Any]], pack: dict[str, Any]) -> str:
    plain: list[dict[str, str]] = []
    phrases: list[dict[str, str]] = []

    for item in items:
        if is_reachable(pack, item):
            continue
        row = {
            "form": str(item.get("form") or "").strip(),
            "meaning": str(item.get("meaning") or "").strip(),
        }
        if str(item.get("type") or "").strip().lower() == "phrase":
            phrases.append(row)
        else:
            plain.append(row)

    plain.sort(key=lambda row: normalize_key(row["form"]))
    phrases.sort(key=lambda row: normalize_key(row["form"]))
    total = len(items)
    unreachable = len(plain) + len(phrases)

    lines = [
        "# Remaining Unreachable Course Verbs",
        "",
        "These entries from `assets/data/verbs_course_bank.json` still do not open a full local verb modal through the current lookup path:",
        "",
        "- `slugHint`",
        "- exact form",
        "- alias",
        "- exact lemma",
        "",
        "## Current Totals",
        "",
        f"- Total entries checked: `{total}`",
        f"- Still unreachable: `{unreachable}`",
        f"- Plain forms: `{len(plain)}`",
        f"- Phrases / multi-word entries: `{len(phrases)}`",
        "",
        "## Plain Forms",
        "",
    ]

    if plain:
        for row in plain:
            lines.append(f"- `{row['form']}` | `{row['meaning']}`")
    else:
        lines.append("- none")

    lines.extend([
        "",
        "## Phrases / Multi-Word Entries",
        "",
    ])

    if phrases:
        for row in phrases:
            lines.append(f"- `{row['form']}` | `{row['meaning']}`")
    else:
        lines.append("- none")

    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate the current unreachable All Course Verbs report from the local verb pack.")
    parser.add_argument("--course-bank", type=Path, default=COURSE_BANK_PATH)
    parser.add_argument("--pack", type=Path, default=PACK_PATH)
    parser.add_argument("--output", type=Path, default=REPORT_PATH)
    args = parser.parse_args()

    bank = read_json(args.course_bank)
    pack = read_json(args.pack)
    items = flatten_course_items(bank)
    report = build_report(items, pack)
    args.output.write_text(report, encoding="utf-8")
    print(f"Wrote report to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
