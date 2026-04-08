from __future__ import annotations

import html
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "verbs_guide.html"
TARGET = ROOT / "verbs_course_lessons.md"


BUTTON_SPAN_RE = re.compile(
    r'<button class="verb-trigger" type="button">\s*(.*?)\s*</button>\s*'
    r'<span class="muted">\s*-\s*(.*?)</span>',
    re.S,
)


def normalize_space(value: str) -> str:
    return " ".join(html.unescape(value).split())


def repair_mojibake(value: str) -> str:
    markers = ("Ã", "Ä", "Å", "â€™", "â€œ", "â€")
    if not any(marker in value for marker in markers):
        return value
    try:
        return value.encode("cp1252").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return value


def escape_md(value: str) -> str:
    return value.replace("|", r"\|")


def parse_rows(text: str) -> list[tuple[str, str, str]]:
    rows: list[tuple[str, str, str]] = []
    for form_raw, desc_raw in BUTTON_SPAN_RE.findall(text):
        form = repair_mojibake(normalize_space(form_raw))
        desc = repair_mojibake(normalize_space(desc_raw))
        if "| Lesson" not in desc:
            continue
        visible, lesson = desc.split("| Lesson", 1)
        rows.append((form, visible.strip(), f"Lesson {lesson.strip()}"))
    return rows


def build_markdown(rows: list[tuple[str, str, str]]) -> str:
    lines = [
        "# Verbs Course Lesson Map",
        "",
        "This table exports the lesson/source references hidden from the public verb bank on `verbs_guide.html`.",
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
    text = SOURCE.read_text(encoding="utf-8", errors="replace")
    rows = parse_rows(text)
    TARGET.write_text(build_markdown(rows), encoding="utf-8")
    print(f"Exported {len(rows)} rows to {TARGET}")


if __name__ == "__main__":
    main()
