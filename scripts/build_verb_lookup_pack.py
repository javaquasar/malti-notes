#!/usr/bin/env python3
from __future__ import annotations

import argparse
import gzip
import json
import os
import struct
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE_ENV = "MALTI_VERB_MT_SOURCE"
DEFAULT_OUTPUT_ENV = "MALTI_VERB_LOOKUP_OUTPUT"
DEFAULT_OUTPUT = ROOT / "assets" / "data" / "generated"

TENSE_MAP = {
    "imperfett": "present",
    "perfett": "past",
    "imperattiv": "imperative",
}

PERSON_MAP = {
    "jiena": "jien",
    "inti": "int",
    "huwa": "huwa",
    "hija": "hija",
    "aħna": "aħna",
    "intom": "intom",
    "huma": "huma",
}

MOJIBAKE_MARKERS = ("Ã", "Ä", "Å", "â", "�")


def maybe_fix_mojibake(value: str) -> str:
    if not value or not any(marker in value for marker in MOJIBAKE_MARKERS):
        return value

    for source_encoding in ("cp1252", "latin1"):
        try:
            fixed = value.encode(source_encoding).decode("utf-8")
        except UnicodeError:
            continue
        if fixed != value:
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


def normalize_key(text: str) -> str:
    text = maybe_fix_mojibake(text).strip().lower()
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
    normalized_chars = [replacements.get(ch, ch) for ch in text]
    return " ".join("".join(normalized_chars).split())


def read_json(path: Path) -> Any:
    return clean_json(json.loads(path.read_text(encoding="utf-8")))


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
        f"Missing source folder. Set {DEFAULT_SOURCE_ENV} or pass --source."
    )


def resolve_output_root(cli_value: Path | None) -> Path:
    if cli_value:
        return cli_value
    env_value = os.environ.get(DEFAULT_OUTPUT_ENV)
    if env_value:
        return Path(env_value)
    return DEFAULT_OUTPUT


def map_people_table(values: dict[str, str]) -> dict[str, str]:
    mapped: dict[str, str] = {}
    for person, form in values.items():
        if not isinstance(form, str) or not form.strip():
            continue
        mapped[PERSON_MAP.get(person, person)] = form
    return mapped


def build_pack(source_root: Path) -> dict[str, Any]:
    index_path = source_root / "index.json"
    slug_root = source_root / "by-slug"
    index_data = read_json(index_path)

    compact_index: list[dict[str, Any]] = []
    forms_index: dict[str, list[dict[str, Any]]] = defaultdict(list)
    tables: dict[str, dict[str, Any]] = {}
    details: dict[str, dict[str, Any]] = {}

    for row in index_data:
        slug = row.get("slug")
        letter_slug = row.get("letter_slug")
        if not slug or not letter_slug:
            continue

        lemma = row.get("lemma") or slug
        meanings = row.get("meanings") or []
        compact_index.append(
            {
                "slug": slug,
                "letterSlug": letter_slug,
                "lemma": lemma,
                "meanings": meanings[:3],
                "form": row.get("forma") or "",
                "type": row.get("tip") or "",
                "root": row.get("għerq") or row.get("g\u0127erq") or "",
            }
        )

        verb_path = slug_root / letter_slug / f"{slug}.json"
        if not verb_path.exists():
            continue

        verb_data = read_json(verb_path)
        sections = verb_data.get("sections") or {}
        meta = verb_data.get("meta") or {}
        table_entry: dict[str, Any] = {}

        details[slug] = {
            "slug": slug,
            "letterSlug": letter_slug,
            "lemma": verb_data.get("lemma") or lemma,
            "meanings": verb_data.get("meanings") or meanings,
            "meta": {
                "form": meta.get("forma") or row.get("forma") or "",
                "type": meta.get("tip") or row.get("tip") or "",
                "category1": meta.get("kategorija_1") or "",
                "root": meta.get("għerq") or meta.get("g\u0127erq") or row.get("għerq") or row.get("g\u0127erq") or "",
                "category2": meta.get("kategorija_2") or "",
            },
            "tables": {},
        }

        for source_tense, public_tense in TENSE_MAP.items():
            section = sections.get(source_tense) or {}
            columns = section.get("columns") or {}
            positive = map_people_table(columns.get("pożittiv") or {})
            negative = map_people_table(columns.get("negattiv") or {})

            if not positive and not negative:
                continue

            details[slug]["tables"][public_tense] = {
                "positive": positive,
                "negative": negative,
            }

            if positive:
                table_entry[public_tense] = positive

                for person, form in positive.items():
                    normalized = normalize_key(form)
                    if not normalized:
                        continue
                    forms_index[normalized].append(
                        {
                            "slug": slug,
                            "letterSlug": letter_slug,
                            "lemma": lemma,
                            "meaning": meanings[0] if meanings else "",
                            "tense": public_tense,
                            "person": person,
                            "form": form,
                        }
                    )

        if table_entry:
            tables[slug] = table_entry

    forms_index = dict(sorted(forms_index.items()))
    compact_index.sort(key=lambda item: normalize_key(item["lemma"]))

    return {
        "meta": {
            "version": 3,
            "generatedAt": datetime.now(UTC).isoformat(),
            "verbCount": len(compact_index),
            "lookupFormCount": len(forms_index),
            "format": "msgpack+gzip",
        },
        "index": compact_index,
        "forms": forms_index,
        "tables": tables,
        "details": details,
    }


def encode_msgpack(value: Any) -> bytes:
    if value is None:
        return b"\xc0"
    if value is False:
        return b"\xc2"
    if value is True:
        return b"\xc3"
    if isinstance(value, int):
        if 0 <= value <= 0x7F:
            return bytes([value])
        if -32 <= value < 0:
            return struct.pack("b", value)
        if 0 <= value <= 0xFF:
            return b"\xcc" + struct.pack(">B", value)
        if 0 <= value <= 0xFFFF:
            return b"\xcd" + struct.pack(">H", value)
        if 0 <= value <= 0xFFFFFFFF:
            return b"\xce" + struct.pack(">I", value)
        if -128 <= value <= 127:
            return b"\xd0" + struct.pack(">b", value)
        if -32768 <= value <= 32767:
            return b"\xd1" + struct.pack(">h", value)
        if -2147483648 <= value <= 2147483647:
            return b"\xd2" + struct.pack(">i", value)
        return b"\xd3" + struct.pack(">q", value)
    if isinstance(value, str):
        data = value.encode("utf-8")
        length = len(data)
        if length <= 31:
            return bytes([0xA0 | length]) + data
        if length <= 0xFF:
            return b"\xd9" + struct.pack(">B", length) + data
        if length <= 0xFFFF:
            return b"\xda" + struct.pack(">H", length) + data
        return b"\xdb" + struct.pack(">I", length) + data
    if isinstance(value, list):
        length = len(value)
        payload = b"".join(encode_msgpack(item) for item in value)
        if length <= 15:
            return bytes([0x90 | length]) + payload
        if length <= 0xFFFF:
            return b"\xdc" + struct.pack(">H", length) + payload
        return b"\xdd" + struct.pack(">I", length) + payload
    if isinstance(value, dict):
        items = list(value.items())
        length = len(items)
        payload = b"".join(encode_msgpack(str(key)) + encode_msgpack(item) for key, item in items)
        if length <= 15:
            return bytes([0x80 | length]) + payload
        if length <= 0xFFFF:
            return b"\xde" + struct.pack(">H", length) + payload
        return b"\xdf" + struct.pack(">I", length) + payload
    raise TypeError(f"Unsupported type for msgpack encoding: {type(value)!r}")


def write_outputs(pack: dict[str, Any], output_root: Path, emit_json: bool) -> None:
    output_root.mkdir(parents=True, exist_ok=True)
    manifest_path = output_root / "verb_lookup_manifest.json"
    gz_path = output_root / "verb_lookup_pack.msgpack.gz"

    manifest = {
        "version": pack["meta"]["version"],
        "generatedAt": pack["meta"]["generatedAt"],
        "verbCount": pack["meta"]["verbCount"],
        "lookupFormCount": pack["meta"]["lookupFormCount"],
        "packPath": "./assets/data/generated/verb_lookup_pack.msgpack.gz",
        "format": "msgpack+gzip",
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    msgpack_bytes = encode_msgpack(pack)
    with gzip.open(gz_path, "wb", compresslevel=9) as fh:
        fh.write(msgpack_bytes)

    if emit_json:
        (output_root / "verb_lookup_pack.json").write_text(
            json.dumps(pack, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )


def main() -> int:
    parser = argparse.ArgumentParser(description="Build a local compressed verb lookup pack from verb.mt data.")
    parser.add_argument(
        "--source",
        type=Path,
        default=None,
        help=f"Path to verb.mt data\\verbs folder. Overrides {DEFAULT_SOURCE_ENV}.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help=f"Output folder for generated pack files. Overrides {DEFAULT_OUTPUT_ENV}.",
    )
    parser.add_argument("--emit-json", action="store_true", help="Also emit an uncompressed JSON copy for debugging")
    args = parser.parse_args()

    load_dotenv(ROOT / ".env")
    source_root = resolve_source_root(args.source)
    output_root = resolve_output_root(args.output)

    pack = build_pack(source_root)
    write_outputs(pack, output_root, args.emit_json)
    print(
        f"Built verb lookup pack: verbs={pack['meta']['verbCount']}, "
        f"lookup_forms={pack['meta']['lookupFormCount']}, output={output_root}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
