from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "data" / "verbs_course_bank.json"
TARGET = ROOT / "verbs_course_lessons.md"


def escape_md(value: str) -> str:
    return value.replace("|", r"\|")


def parse_rows(data: dict) -> list[tuple[str, str, str]]:
    rows: list[tuple[str, str, str]] = []
    for group in data.get("groups", []):
        for item in group.get("items", []):
            lesson = (item.get("lessonSource") or "").strip()
            if not lesson:
                continue
            rows.append(
                (
                    (item.get("form") or "").strip(),
                    (item.get("meaning") or "").strip(),
                    lesson,
                )
            )
    return rows


def build_markdown(rows: list[tuple[str, str, str]]) -> str:
    lines = [
        "# Verbs Course Lesson Map",
        "",
        "This table exports the lesson/source references hidden from the public verb bank in `assets/data/verbs_course_bank.json`.",
        "",
        f"Total entries: {len(rows)}",
        "",
        "| Form | Meaning / Public Label | Lesson Source |",
        "| --- | --- | --- |",
    ]
    for form, visible, lesson in rows:
        lines.append(
            f"| {escape_md(form)} | {escape_md(visible)} | {escape_md(lesson)} |"
        )
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    rows = parse_rows(data)
    TARGET.write_text(build_markdown(rows), encoding="utf-8")
    print(f"Exported {len(rows)} rows to {TARGET}")


if __name__ == "__main__":
    main()
