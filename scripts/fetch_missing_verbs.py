#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import ssl
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
UNREACHABLE_REPORT = ROOT / "verbs_course_unreachable.md"
EXTENSIONS_PATH = ROOT / "assets" / "data" / "verbs_extensions.json"
OUTPUT_DEFAULT = ROOT / "assets" / "data" / "generated" / "missing_verbs_candidates.json"
DRAFT_DEFAULT = ROOT / "assets" / "data" / "generated" / "missing_verbs_draft_extensions.json"

GABRA_BASE = "https://mlrs.research.um.edu.mt/resources/gabra-api/lexemes"
USER_AGENT = "malti-notes-fetch-missing-verbs/1.0"
SSL_CONTEXT = ssl._create_unverified_context()
DRAFT_SCORE_THRESHOLD = 85
ASPECT_MAP = {
    "impf": "present",
    "perf": "past",
    "imp": "imperative",
}
PERSON_SUBJECT_MAP = {
    ("p1", "sg", ""): "jien",
    ("p2", "sg", ""): "int",
    ("p3", "sg", "m"): "huwa",
    ("p3", "sg", "f"): "hija",
    ("p1", "pl", ""): "aħna",
    ("p2", "pl", ""): "intom",
    ("p3", "pl", ""): "huma",
}


def normalize_key(text: str) -> str:
    replacements = {
        "à": "a",
        "á": "a",
        "â": "a",
        "ã": "a",
        "ä": "a",
        "å": "a",
        "è": "e",
        "é": "e",
        "ê": "e",
        "ë": "e",
        "ì": "i",
        "í": "i",
        "î": "i",
        "ï": "i",
        "ò": "o",
        "ó": "o",
        "ô": "o",
        "õ": "o",
        "ö": "o",
        "ù": "u",
        "ú": "u",
        "û": "u",
        "ü": "u",
        "ċ": "c",
        "ġ": "g",
        "ħ": "h",
        "ż": "z",
        "’": "'",
        "‘": "'",
        "`": "'",
    }
    lowered = text.strip().lower()
    return " ".join("".join(replacements.get(ch, ch) for ch in lowered).split())


def clean_json(value: Any) -> Any:
    if isinstance(value, dict):
        return {clean_json(key): clean_json(item) for key, item in value.items()}
    if isinstance(value, list):
        return [clean_json(item) for item in value]
    if isinstance(value, str):
        return value
    return value


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def load_existing_extensions() -> dict[str, Any]:
    if not EXTENSIONS_PATH.exists():
        return {"aliases": {}, "details": {}}
    return read_json(EXTENSIONS_PATH)


def gabra_get(path: str, params: dict[str, str] | None = None) -> Any:
    query = ""
    if params:
        query = "?" + urllib.parse.urlencode(params)
    url = f"{GABRA_BASE}{path}{query}"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30, context=SSL_CONTEXT) as response:
        return json.loads(response.read().decode("utf-8"))


def normalize_api_rows(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [row for row in payload if isinstance(row, dict)]
    if isinstance(payload, dict):
        results = payload.get("results")
        if isinstance(results, list):
            return [row for row in results if isinstance(row, dict)]
        if all(key in payload for key in ("_id", "lemma")):
            return [payload]
    return []


def subject_to_person(subject: dict[str, Any]) -> str:
    person = as_text(subject.get("person"))
    number = as_text(subject.get("number"))
    gender = as_text(subject.get("gender"))
    return PERSON_SUBJECT_MAP.get((person, number, gender), "")


def fetch_wordforms(lexeme_id: str) -> list[dict[str, Any]]:
    if not lexeme_id:
        return []
    payload = gabra_get(f"/wordforms/{lexeme_id}")
    if isinstance(payload, list):
        return [row for row in payload if isinstance(row, dict)]
    return []


def build_tables_from_wordforms(wordforms: list[dict[str, Any]]) -> dict[str, Any]:
    tables: dict[str, dict[str, dict[str, str]]] = {}
    for row in wordforms:
        public_tense = ASPECT_MAP.get(as_text(row.get("aspect")))
        if not public_tense:
            continue
        polarity = "negative" if as_text(row.get("polarity")) == "neg" else "positive"
        person = subject_to_person(row.get("subject") or {})
        surface_form = as_text(row.get("surface_form")).strip()
        if not person or not surface_form:
            continue

        if polarity == "negative" and public_tense != "imperative" and not surface_form.startswith("ma "):
            surface_form = f"ma {surface_form}"

        tense_tables = tables.setdefault(
            public_tense,
            {
                "positive": {},
                "negative": {},
            },
        )
        tense_tables[polarity][person] = surface_form
    return tables


def as_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        for key in ("lemma", "value", "surface_form", "form", "name", "_id"):
            inner = value.get(key)
            if isinstance(inner, str):
                return inner
        if isinstance(value.get("gloss"), str):
            return value["gloss"]
        if isinstance(value.get("radicals"), str):
            return value["radicals"]
        return json.dumps(value, ensure_ascii=False, sort_keys=True)
    if isinstance(value, list):
        return ", ".join(as_text(item) for item in value if as_text(item))
    return str(value)


def slugify_lemma(text: str) -> str:
    normalized = normalize_key(text)
    normalized = normalized.replace("'", "")
    normalized = re.sub(r"[^a-z0-9]+", "-", normalized)
    return normalized.strip("-")


def normalize_lemma_shape(text: str) -> str:
    value = normalize_key(text)
    return value.strip("!?.,;:()[]{}\"")


def form_variants(form: str) -> list[str]:
    base = normalize_lemma_shape(form)
    variants = {base}
    if base.startswith("i") and len(base) > 1:
        variants.add(base[1:])
    return [item for item in variants if item]


def common_prefix_len(a: str, b: str) -> int:
    count = 0
    for ch_a, ch_b in zip(a, b):
        if ch_a != ch_b:
            break
        count += 1
    return count


def simplify_meaning_query(meaning_hint: str) -> list[str]:
    value = meaning_hint.strip()
    if not value:
        return []

    queries: list[str] = []
    lowered = value.lower()
    queries.append(lowered)

    if lowered.startswith("to "):
        queries.append(lowered[3:].strip())

    for part in re.split(r"[/,;]", lowered):
        piece = part.strip()
        if not piece:
            continue
        queries.append(piece)
        if piece.startswith("to "):
            queries.append(piece[3:].strip())

    pronoun_prefixes = [
        "i ",
        "he ",
        "she ",
        "we ",
        "you ",
        "they ",
        "my name is / ",
        "my name is ",
    ]
    for query in list(queries):
        for prefix in pronoun_prefixes:
            if query.startswith(prefix):
                queries.append(query[len(prefix):].strip())

    cleaned = []
    seen = set()
    for query in queries:
        query = query.strip()
        if not query or query in seen:
            continue
        seen.add(query)
        cleaned.append(query)
    return cleaned


def parse_unreachable_plain_forms(report_path: Path) -> list[dict[str, str]]:
    text = report_path.read_text(encoding="utf-8")
    lines = text.splitlines()
    results: list[dict[str, str]] = []
    in_plain = False
    bullet_pattern = re.compile(r"^- `?(?P<form>[^|`]+?)`?\s*\|\s*`?(?P<meaning>.+?)`?\s*$")

    for line in lines:
        if line.strip().startswith("## Plain Forms"):
            in_plain = True
            continue
        if in_plain and line.startswith("## "):
            break
        if not in_plain:
            continue
        match = bullet_pattern.match(line)
        if not match:
            continue
        results.append(
            {
                "form": match.group("form").strip(),
                "meaning_hint": match.group("meaning").strip(),
            }
        )
    return results


def score_result(form: str, meaning_hint: str, item: dict[str, Any]) -> tuple[int, list[str]]:
    reasons: list[str] = []
    score = 0

    lemma = str(item.get("lemma") or "")
    glosses = [str(gloss).strip() for gloss in item.get("glosses") or [] if str(gloss).strip()]
    pos = str(item.get("pos") or "").upper()
    form_norm = normalize_lemma_shape(form)
    lemma_norm = normalize_lemma_shape(lemma)
    meaning_norm = normalize_key(meaning_hint)
    sources = {str(source) for source in item.get("sources") or []}
    variants = form_variants(form)

    if lemma_norm and any(lemma_norm == variant for variant in variants):
        score += 90
        reasons.append("lemma exact")
    elif lemma_norm and any(lemma_norm.startswith(variant) for variant in variants):
        score += 45
        reasons.append("lemma prefix")
    elif lemma_norm and any(variant.startswith(lemma_norm) for variant in variants):
        score += 35
        reasons.append("form starts with lemma")

    prefix_bonus = max((common_prefix_len(lemma_norm, variant) for variant in variants), default=0)
    if prefix_bonus >= 4:
        score += min(prefix_bonus * 5, 30)
        reasons.append(f"prefix:{prefix_bonus}")

    if " " in lemma_norm:
        score -= 25
        reasons.append("multiword lemma")

    if any(char in lemma for char in "!?"):
        score -= 10
        reasons.append("punctuated lemma")

    for gloss in glosses:
        gloss_norm = normalize_key(gloss)
        if not meaning_norm:
            continue
        if gloss_norm == meaning_norm:
            score += 40
            reasons.append("gloss exact")
        elif meaning_norm in gloss_norm or gloss_norm in meaning_norm:
            score += 20
            reasons.append("gloss partial")

    if item.get("root"):
        score += 5
        reasons.append("has root")

    if pos == "VERB":
        score += 40
        reasons.append("verb")
    elif pos:
        score -= 10
        reasons.append(f"non-verb:{pos.lower()}")

    if "lemmatise" in sources:
        score += 20
        reasons.append("lemmatise")
    if "search" in sources:
        score += 10
        reasons.append("search")
    if sources == {"search_gloss"}:
        score -= 15
        reasons.append("gloss-only")

    return score, reasons


def collect_candidates(form: str, meaning_hint: str, pause_ms: int) -> dict[str, Any]:
    search_rows: list[dict[str, Any]] = []
    suggest_rows: list[dict[str, Any]] = []
    gloss_rows: list[dict[str, Any]] = []
    lemma_rows: list[dict[str, Any]] = []

    try:
        search_rows = normalize_api_rows(gabra_get("/search", {"s": form}))
    except Exception as error:  # noqa: BLE001
        search_rows = [{"error": f"search failed: {error}"}]

    time.sleep(pause_ms / 1000)

    try:
        suggest_rows = normalize_api_rows(gabra_get("/search_suggest", {"s": form}))
    except Exception as error:  # noqa: BLE001
        suggest_rows = [{"error": f"search_suggest failed: {error}"}]

    time.sleep(pause_ms / 1000)

    try:
        gloss_rows = []
        for query in simplify_meaning_query(meaning_hint):
            gloss_rows.extend(normalize_api_rows(gabra_get("/search_gloss", {"s": query})))
    except Exception as error:  # noqa: BLE001
        gloss_rows = [{"error": f"search_gloss failed: {error}"}]

    time.sleep(pause_ms / 1000)

    try:
        lemma_rows = normalize_api_rows(gabra_get("/lemmatise", {"s": form}))
    except Exception as error:  # noqa: BLE001
        lemma_rows = [{"error": f"lemmatise failed: {error}"}]

    merged: dict[str, dict[str, Any]] = {}
    for source_name, rows in (
        ("search", search_rows),
        ("search_suggest", suggest_rows),
        ("search_gloss", gloss_rows),
        ("lemmatise", lemma_rows),
    ):
        for row in rows:
            if not isinstance(row, dict):
                continue
            if "error" in row:
                continue
            lexeme = row.get("lexeme") if isinstance(row.get("lexeme"), dict) else row
            slug = as_text(lexeme.get("slug") or lexeme.get("_id") or lexeme.get("id") or "")
            if not slug:
                slug = slugify_lemma(as_text(lexeme.get("lemma") or lexeme.get("lexeme") or "")) or f"{source_name}-unknown"
            entry = merged.setdefault(
                slug,
                {
                    "slug": slug,
                    "lexeme_id": as_text(lexeme.get("_id") or lexeme.get("id") or ""),
                    "lemma": as_text(lexeme.get("lemma") or lexeme.get("lexeme") or ""),
                    "glosses": [],
                    "root": as_text(lexeme.get("root") or ""),
                    "pos": as_text(lexeme.get("pos") or ""),
                    "sources": set(),
                    "raw": {},
                },
            )
            entry["sources"].add(source_name)
            if isinstance(lexeme.get("glosses"), list):
                entry["glosses"].extend(as_text(gloss) for gloss in lexeme["glosses"])
            if lexeme.get("gloss"):
                entry["glosses"].append(as_text(lexeme["gloss"]))
            if not entry["lexeme_id"] and (lexeme.get("_id") or lexeme.get("id")):
                entry["lexeme_id"] = as_text(lexeme.get("_id") or lexeme.get("id"))
            if not entry["root"] and lexeme.get("root"):
                entry["root"] = as_text(lexeme.get("root"))
            if not entry["pos"] and lexeme.get("pos"):
                entry["pos"] = as_text(lexeme.get("pos"))
            entry["raw"][source_name] = row

    candidates: list[dict[str, Any]] = []
    for entry in merged.values():
        deduped_glosses = sorted({gloss.strip() for gloss in entry["glosses"] if gloss.strip()})
        score, reasons = score_result(
            form,
            meaning_hint,
            {
                "lemma": entry["lemma"],
                "glosses": deduped_glosses,
                "root": entry["root"],
                "pos": entry["pos"],
                "sources": sorted(entry["sources"]),
            },
        )
        candidates.append(
            {
                "slug": entry["slug"],
                "lexeme_id": entry["lexeme_id"],
                "lemma": entry["lemma"],
                "glosses": deduped_glosses,
                "root": entry["root"],
                "pos": entry["pos"],
                "sources": sorted(entry["sources"]),
                "score": score,
                "reasons": reasons,
            }
        )

    candidates.sort(key=lambda item: (-item["score"], item["lemma"], item["slug"]))
    return {
        "form": form,
        "meaning_hint": meaning_hint,
        "candidates": candidates,
    }


def build_draft_extensions(
    items: list[dict[str, Any]],
    existing_extensions: dict[str, Any],
    pause_ms: int,
) -> dict[str, Any]:
    existing_aliases = existing_extensions.get("aliases") or {}
    existing_details = existing_extensions.get("details") or {}

    draft_aliases: dict[str, str] = {}
    draft_details: dict[str, Any] = {}

    for item in items:
        form = item["form"]
        candidates = item.get("candidates") or []
        if not candidates:
            continue
        viable = [candidate for candidate in candidates if int(candidate.get("score") or 0) >= DRAFT_SCORE_THRESHOLD]
        fallback_viable = [candidate for candidate in candidates if int(candidate.get("score") or 0) >= 60]
        pool = viable or fallback_viable
        if not pool:
            continue
        best = pool[0]
        wordforms: list[dict[str, Any]] = []
        for candidate in pool[:8]:
            candidate_lexeme_id = str(candidate.get("lexeme_id") or "").strip()
            candidate_wordforms = fetch_wordforms(candidate_lexeme_id)
            time.sleep(pause_ms / 1000)
            if candidate_wordforms:
                best = candidate
                wordforms = candidate_wordforms
                break
            if candidate is pool[0]:
                best = candidate
        if not wordforms and viable and fallback_viable:
            viable_ids = {id(candidate) for candidate in viable}
            for candidate in [item for item in fallback_viable[:8] if id(item) not in viable_ids]:
                candidate_lexeme_id = str(candidate.get("lexeme_id") or "").strip()
                candidate_wordforms = fetch_wordforms(candidate_lexeme_id)
                time.sleep(pause_ms / 1000)
                if candidate_wordforms:
                    best = candidate
                    wordforms = candidate_wordforms
                    break

        slug = str(best.get("slug") or "").strip()
        lexeme_id = str(best.get("lexeme_id") or "").strip()
        lemma = str(best.get("lemma") or "").strip()
        if not slug or not lemma:
            continue

        existing_slug = existing_aliases.get(form) or next(
            (
                existing_slug
                for existing_slug, detail in existing_details.items()
                if normalize_key(str(detail.get("lemma") or "")) == normalize_key(lemma)
            ),
            "",
        )
        if existing_slug:
            slug = existing_slug

        if not wordforms:
            wordforms = fetch_wordforms(lexeme_id)
            time.sleep(pause_ms / 1000)
        generated_tables = build_tables_from_wordforms(wordforms)

        existing_detail = clean_json(existing_details.get(slug) or {})
        existing_tables = existing_detail.get("tables") or {}
        merged_tables = clean_json(existing_tables)
        for tense_name, tense_data in generated_tables.items():
            target_tense = merged_tables.setdefault(
                tense_name,
                {
                    "positive": {},
                    "negative": {},
                },
            )
            for polarity_name in ("positive", "negative"):
                target_tense.setdefault(polarity_name, {})
                target_tense[polarity_name].update(tense_data.get(polarity_name) or {})

        normalized_form = normalize_key(form)
        normalized_lemma = normalize_key(lemma)
        if normalized_form and normalized_form != normalized_lemma and normalized_form not in existing_aliases:
            draft_aliases[form] = slug

        existing_meta = existing_detail.get("meta") or {}
        draft_details[slug] = {
            "lemma": lemma,
            "meanings": best.get("glosses") or [item["meaning_hint"]],
            "meta": {
                "form": existing_meta.get("form") or "gabra-supported",
                "type": existing_meta.get("type") or "draft extension",
                "category1": existing_meta.get("category1") or "needs review",
                "root": best.get("root") or "",
                "category2": "full tables from wordforms" if generated_tables else (existing_meta.get("category2") or "no tables yet"),
            },
            "tables": merged_tables,
            "_draft": {
                "source": "gabra-api",
                "from_form": form,
                "meaning_hint": item["meaning_hint"],
                "lexeme_id": lexeme_id,
                "score": best.get("score", 0),
                "reasons": best.get("reasons") or [],
                "candidate_sources": best.get("sources") or [],
                "wordform_count": len(wordforms),
            }
        }

    return {
        "aliases": draft_aliases,
        "details": draft_details,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Query Ġabra API for currently unreachable course verbs, save candidate lexemes, and generate draft extension entries."
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=UNREACHABLE_REPORT,
        help="Path to verbs_course_unreachable.md",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=OUTPUT_DEFAULT,
        help="Output JSON file for fetched candidates",
    )
    parser.add_argument(
        "--draft-output",
        type=Path,
        default=DRAFT_DEFAULT,
        help="Output JSON file for draft extension entries",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=25,
        help="Only fetch the first N plain forms from the report",
    )
    parser.add_argument(
        "--pause-ms",
        type=int,
        default=250,
        help="Pause between API calls in milliseconds",
    )
    args = parser.parse_args()

    missing = parse_unreachable_plain_forms(args.report)
    if args.limit > 0:
        missing = missing[: args.limit]

    output_items = []
    for item in missing:
        output_items.append(
            collect_candidates(
                form=item["form"],
                meaning_hint=item["meaning_hint"],
                pause_ms=args.pause_ms,
            )
        )

    payload = {
        "generated_from": str(args.report),
        "count": len(output_items),
        "items": output_items,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    draft_extensions = build_draft_extensions(output_items, load_existing_extensions(), args.pause_ms)
    args.draft_output.parent.mkdir(parents=True, exist_ok=True)
    args.draft_output.write_text(json.dumps(draft_extensions, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Wrote {len(output_items)} candidate rows to {args.output}")
    print(
        f"Wrote {len(draft_extensions['details'])} draft extension rows "
        f"and {len(draft_extensions['aliases'])} draft aliases to {args.draft_output}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
