from __future__ import annotations

import argparse
import fnmatch
import re
import sys
from dataclasses import dataclass
from pathlib import Path


MOJIBAKE_MARKERS = (
    "\u00c3",
    "\u00c2",
    "\u00c4",
    "\u00c5",
    "\u00e2",
    "\ufffd",
)

MALTESE_CHARS = "\u010b\u0121\u0127\u017c\u010a\u0120\u0126\u017b"

CP1252_CONTROL_REPLACEMENTS = {
    "\x80": "\u20ac",
    "\x82": "\u201a",
    "\x83": "\u0192",
    "\x84": "\u201e",
    "\x85": "\u2026",
    "\x86": "\u2020",
    "\x87": "\u2021",
    "\x88": "\u02c6",
    "\x89": "\u2030",
    "\x8a": "\u0160",
    "\x8b": "\u2039",
    "\x8c": "\u0152",
    "\x8e": "\u017d",
    "\x91": "\u2018",
    "\x92": "\u2019",
    "\x93": "\u201c",
    "\x94": "\u201d",
    "\x95": "\u2022",
    "\x96": "\u2013",
    "\x97": "\u2014",
    "\x98": "\u02dc",
    "\x99": "\u2122",
    "\x9a": "\u0161",
    "\x9b": "\u203a",
    "\x9c": "\u0153",
    "\x9e": "\u017e",
    "\x9f": "\u0178",
}

COMMON_SEQUENCE_REPLACEMENTS = {
    "\u00c3\u00a0": "\u00e0",
    "\u00c3\u00a8": "\u00e8",
    "\u00c3\u00a9": "\u00e9",
    "\u00c3\u00ac": "\u00ec",
    "\u00c3\u00b2": "\u00f2",
    "\u00c3\u00b9": "\u00f9",
    "\u00e2\u20ac\u0153": "\u201c",
    "\u00e2\u20ac\u009d": "\u201d",
    "\u00e2\u20ac\u02dc": "\u2018",
    "\u00e2\u20ac\u2122": "\u2019",
    "\u00e2\u20ac\u201c": "\u2013",
    "\u00e2\u20ac\u201d": "\u2014",
    "\u00e2\u20ac\u00a6": "\u2026",
    "\u00e2\u2020\u2019": "\u2192",
}


@dataclass
class FileReport:
    path: Path
    utf8_ok: bool
    marker_count: int
    replacement_count: int
    numeric_entity_count: int
    maltese_count: int
    changed: bool = False
    notes: str = ""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Check and repair UTF-8 / mojibake issues in project files."
    )
    sub = parser.add_subparsers(dest="command", required=True)

    for name in ("check", "fix"):
        cmd = sub.add_parser(name)
        cmd.add_argument(
            "--root",
            default=r"C:\Workspace\prj\jq\malti-notes",
            help="Project root to scan.",
        )
        cmd.add_argument(
            "--include",
            action="append",
            default=["*.html"],
            help="Glob pattern to include. Can be passed multiple times.",
        )
        cmd.add_argument(
            "--exclude",
            action="append",
            default=["animals - Copy.html"],
            help="File name pattern to exclude. Can be passed multiple times.",
        )
        cmd.add_argument(
            "--max-depth",
            type=int,
            default=3,
            help="Maximum directory depth relative to root.",
        )
        cmd.add_argument(
            "--verbose",
            action="store_true",
            help="Print a line for every scanned file.",
        )

    return parser.parse_args()


def should_include(path: Path, root: Path, includes: list[str], excludes: list[str], max_depth: int) -> bool:
    if path.is_dir():
        return False
    try:
        rel = path.relative_to(root)
    except ValueError:
        return False
    if len(rel.parts) - 1 > max_depth:
        return False
    if any(fnmatch.fnmatch(path.name, pattern) for pattern in excludes):
        return False
    return any(fnmatch.fnmatch(path.name, pattern) for pattern in includes)


def iter_files(root: Path, includes: list[str], excludes: list[str], max_depth: int) -> list[Path]:
    return sorted(
        path
        for path in root.rglob("*")
        if should_include(path, root, includes, excludes, max_depth)
    )


def count_markers(text: str) -> int:
    return sum(text.count(marker) for marker in MOJIBAKE_MARKERS)


def count_maltese(text: str) -> int:
    return sum(text.count(ch) for ch in MALTESE_CHARS)


def count_numeric_html_entities(text: str) -> int:
    return len(re.findall(r"&#(?:x[0-9A-Fa-f]+|\d+);", text))


def read_utf8(path: Path) -> tuple[bool, str]:
    try:
        return True, path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        raw = path.read_bytes()
        return False, raw.decode("utf-8", errors="replace")


def normalize_cp1252_controls(text: str) -> str:
    return "".join(CP1252_CONTROL_REPLACEMENTS.get(ch, ch) for ch in text)


def cleanup_common_sequences(text: str) -> str:
    cleaned = text
    for bad, good in COMMON_SEQUENCE_REPLACEMENTS.items():
        cleaned = cleaned.replace(bad, good)
    return cleaned


def convert_numeric_html_entities(text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        token = match.group(0)
        body = token[2:-1]
        try:
            if body.lower().startswith("x"):
                codepoint = int(body[1:], 16)
            else:
                codepoint = int(body, 10)
            if 0 <= codepoint <= 0x10FFFF:
                return chr(codepoint)
        except ValueError:
            return token
        return token

    return re.sub(r"&#(?:x[0-9A-Fa-f]+|\d+);", repl, text)


def attempt_cp1252_roundtrip(text: str) -> str | None:
    try:
        normalized = normalize_cp1252_controls(text)
        return cleanup_common_sequences(normalized.encode("cp1252").decode("utf-8"))
    except (UnicodeEncodeError, UnicodeDecodeError):
        return None


def attempt_latin1_roundtrip(text: str) -> str | None:
    try:
        normalized = normalize_cp1252_controls(text)
        return cleanup_common_sequences(normalized.encode("latin1").decode("utf-8"))
    except (UnicodeEncodeError, UnicodeDecodeError):
        return None


def choose_best_fix(original: str) -> str | None:
    original_markers = count_markers(original)
    original_maltese = count_maltese(original)
    candidates = []

    for label, fixer in (
        ("cp1252->utf8", attempt_cp1252_roundtrip),
        ("latin1->utf8", attempt_latin1_roundtrip),
    ):
        fixed = fixer(original)
        if not fixed or fixed == original:
            continue
        markers = count_markers(fixed)
        maltese = count_maltese(fixed)
        score = (original_markers - markers) * 100 + (maltese - original_maltese)
        candidates.append((score, markers, -maltese, label, fixed))

    if not candidates:
        return None

    candidates.sort(reverse=True)
    best_score, best_markers, _, _, best_text = candidates[0]
    if best_score <= 0:
        return None
    if best_markers > original_markers:
        return None
    return best_text


def analyze_file(path: Path) -> FileReport:
    utf8_ok, text = read_utf8(path)
    marker_count = count_markers(text)
    replacement_count = text.count("\ufffd")
    numeric_entity_count = count_numeric_html_entities(text)
    maltese_count = count_maltese(text)
    notes = []
    if not utf8_ok:
        notes.append("invalid utf-8 bytes")
    if marker_count:
        notes.append("suspicious mojibake markers")
    if replacement_count:
        notes.append("replacement characters")
    if numeric_entity_count:
        notes.append("numeric html entities")
    return FileReport(
        path=path,
        utf8_ok=utf8_ok,
        marker_count=marker_count,
        replacement_count=replacement_count,
        numeric_entity_count=numeric_entity_count,
        maltese_count=maltese_count,
        notes=", ".join(notes),
    )


def format_report(report: FileReport, root: Path) -> str:
    rel = report.path.relative_to(root)
    status = "OK"
    if not report.utf8_ok or report.marker_count or report.replacement_count:
        status = "WARN"
    if report.changed:
        status = "FIXED"
    return (
        f"{status:5} {rel} | utf8_ok={report.utf8_ok} "
        f"markers={report.marker_count} replacement={report.replacement_count} "
        f"entities={report.numeric_entity_count} "
        f"maltese={report.maltese_count}"
        + (f" | {report.notes}" if report.notes else "")
    )


def run_check(root: Path, files: list[Path], verbose: bool) -> int:
    issues = 0
    for path in files:
        report = analyze_file(path)
        has_issue = (not report.utf8_ok) or report.marker_count > 0 or report.replacement_count > 0
        if verbose or has_issue:
            print(format_report(report, root))
        if has_issue:
            issues += 1
    print(f"\nScanned {len(files)} file(s); issues found in {issues}.")
    return 1 if issues else 0


def run_fix(root: Path, files: list[Path], verbose: bool) -> int:
    fixed_count = 0
    remaining_issues = 0

    for path in files:
        _utf8_ok, original = read_utf8(path)
        changed = False
        normalized = convert_numeric_html_entities(cleanup_common_sequences(original))
        fixed = choose_best_fix(normalized)
        final_text = fixed if fixed is not None else normalized

        if final_text != original:
            path.write_text(final_text, encoding="utf-8", newline="")
            changed = True
            fixed_count += 1

        report = analyze_file(path)
        report.changed = changed
        has_issue = (not report.utf8_ok) or report.marker_count > 0 or report.replacement_count > 0

        if verbose or changed or has_issue:
            print(format_report(report, root))

        if has_issue:
            remaining_issues += 1

    print(f"\nScanned {len(files)} file(s); fixed {fixed_count}; remaining issues in {remaining_issues}.")
    return 1 if remaining_issues else 0


def main() -> int:
    args = parse_args()
    root = Path(args.root)
    if not root.exists():
        print(f"Root does not exist: {root}", file=sys.stderr)
        return 2

    files = iter_files(root, args.include, args.exclude, args.max_depth)
    if not files:
        print("No files matched.")
        return 0

    if args.command == "check":
        return run_check(root, files, args.verbose)
    return run_fix(root, files, args.verbose)


if __name__ == "__main__":
    raise SystemExit(main())
