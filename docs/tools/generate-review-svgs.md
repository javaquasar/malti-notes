# Generate Review SVGs

This tool creates clean `*.review.svg` variants for study/review mode by removing any SVG elements marked with:

```xml
data-hide-on-review="true"
```

Typical use case:

- normal site card uses `ant.svg`
- review page uses `ant.review.svg`
- the review version hides labels or helper text that should not appear during study

## Marker to add inside SVG files

Example:

```svg
<text
  x="160"
  y="182"
  text-anchor="middle"
  font-size="24"
  font-family="Georgia, serif"
  fill="#17352f"
  data-hide-on-review="true"
>
  nemla / ant
</text>
```

Any element with that attribute will be removed from the generated review SVG.

## Script location

- [generate_review_svgs.py](C:\Workspace\prj\jq\malti-notes\scripts\generate_review_svgs.py)

## Default behavior

By default the script:

- scans `C:\Workspace\prj\jq\malti-notes\assets\img`
- walks all subdirectories recursively
- includes `*.svg`
- excludes `*.review.svg`
- writes a sibling file like:
  - `dog.svg` -> `dog.review.svg`

## Dry run

Use this first to see what would happen without writing files:

```powershell
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\generate_review_svgs.py --dry-run --verbose
```

## Generate review SVGs

Run the real generation:

```powershell
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\generate_review_svgs.py --verbose
```

## Scan a different folder

Example:

```powershell
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\generate_review_svgs.py --root C:\Workspace\prj\jq\malti-notes\assets\img\animals --verbose
```

## Custom marker or value

If needed, you can override the attribute name or value:

```powershell
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\generate_review_svgs.py --attr data-hide-on-review --value true
```

## Recommended workflow

1. Add `data-hide-on-review="true"` to text or helper elements inside the original SVG.
2. Run the script with `--dry-run`.
3. Run the real generation.
4. Use `*.review.svg` on the review page when available.

## Notes

- The original SVG files are not modified.
- The script removes marked nodes from the generated review copy only.
- If nothing is marked, the script still scans files but reports `removed=0`.
