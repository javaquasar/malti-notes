from __future__ import annotations

import argparse
import fnmatch
import sys
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path


SVG_NS = "http://www.w3.org/2000/svg"
XLINK_NS = "http://www.w3.org/1999/xlink"
HIDE_ATTR = "data-hide-on-review"
DEFAULT_ROOT = Path(r"C:\Workspace\prj\jq\malti-notes\assets\img")

ET.register_namespace("", SVG_NS)
ET.register_namespace("xlink", XLINK_NS)


@dataclass
class SvgReport:
    path: Path
    output_path: Path
    removed_count: int
    written: bool
    skipped: bool = False
    note: str = ""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate *.review.svg variants by removing nodes marked with data-hide-on-review=\"true\"."
    )
    parser.add_argument(
        "--root",
        default=str(DEFAULT_ROOT),
        help="Root directory to scan recursively for SVG files.",
    )
    parser.add_argument(
        "--include",
        action="append",
        default=["*.svg"],
        help="Glob pattern to include. Can be passed multiple times.",
    )
    parser.add_argument(
        "--exclude",
        action="append",
        default=["*.review.svg"],
        help="Glob pattern to exclude. Can be passed multiple times.",
    )
    parser.add_argument(
        "--attr",
        default=HIDE_ATTR,
        help="Attribute name used to mark nodes that should be hidden in review SVGs.",
    )
    parser.add_argument(
        "--value",
        default="true",
        help="Attribute value that marks nodes for removal.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be generated without writing files.",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Print one line per processed file.",
    )
    return parser.parse_args()


def should_include(path: Path, includes: list[str], excludes: list[str]) -> bool:
    if not path.is_file():
        return False
    if any(fnmatch.fnmatch(path.name, pattern) for pattern in excludes):
        return False
    return any(fnmatch.fnmatch(path.name, pattern) for pattern in includes)


def iter_svg_files(root: Path, includes: list[str], excludes: list[str]) -> list[Path]:
    return sorted(path for path in root.rglob("*") if should_include(path, includes, excludes))


def local_name(tag: str) -> str:
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


def remove_marked_nodes(root: ET.Element, attr_name: str, attr_value: str) -> int:
    removed = 0
    stack: list[ET.Element] = [root]

    while stack:
        parent = stack.pop()
        children = list(parent)
        for child in children:
            if child.get(attr_name) == attr_value:
                parent.remove(child)
                removed += 1
                continue
            stack.append(child)

    return removed


def pretty_indent(tree_root: ET.Element) -> None:
    try:
        ET.indent(tree_root)  # type: ignore[attr-defined]
    except AttributeError:
        return


def output_path_for(path: Path) -> Path:
    return path.with_name(path.stem + ".review.svg")


def process_svg(path: Path, attr_name: str, attr_value: str, dry_run: bool) -> SvgReport:
    output_path = output_path_for(path)

    try:
        tree = ET.parse(path)
    except ET.ParseError as error:
        return SvgReport(path=path, output_path=output_path, removed_count=0, written=False, skipped=True, note=f"parse error: {error}")

    root = tree.getroot()
    if local_name(root.tag) != "svg":
        return SvgReport(path=path, output_path=output_path, removed_count=0, written=False, skipped=True, note="not an svg root")

    removed_count = remove_marked_nodes(root, attr_name, attr_value)
    pretty_indent(root)

    if dry_run:
        return SvgReport(path=path, output_path=output_path, removed_count=removed_count, written=False, note="dry-run")

    tree.write(output_path, encoding="utf-8", xml_declaration=True)
    return SvgReport(path=path, output_path=output_path, removed_count=removed_count, written=True)


def format_report(report: SvgReport, root: Path) -> str:
    rel = report.path.relative_to(root)
    out_rel = report.output_path.relative_to(root)
    if report.skipped:
        status = "SKIP "
    elif report.written:
        status = "WRITE"
    else:
        status = "SCAN "
    details = f"{status} {rel} -> {out_rel} | removed={report.removed_count}"
    if report.note:
        details += f" | {report.note}"
    return details


def main() -> int:
    args = parse_args()
    root = Path(args.root)
    if not root.exists():
        print(f"Root does not exist: {root}", file=sys.stderr)
        return 2

    files = iter_svg_files(root, args.include, args.exclude)
    if not files:
        print("No SVG files matched.")
        return 0

    written = 0
    skipped = 0
    touched = 0

    for path in files:
        report = process_svg(path, args.attr, args.value, args.dry_run)
        if report.skipped:
            skipped += 1
        if report.removed_count > 0:
            touched += 1
        if report.written:
            written += 1
        if args.verbose or report.removed_count > 0 or report.skipped:
            print(format_report(report, root))

    action = "would generate" if args.dry_run else "generated"
    print(
        f"\nScanned {len(files)} svg file(s); {action} {written} review svg(s); "
        f"{touched} source file(s) had removable nodes; skipped {skipped}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
