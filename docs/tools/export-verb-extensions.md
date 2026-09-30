# Export Local Verb Extensions Back To `verb.mt`

This helper prepares or writes local extension verbs from:

- `assets\data\verbs_extensions.json`

back into a `verb.mt`-compatible folder structure:

- `index.json`
- `by-slug\<letter_slug>\<slug>.json`

It is intentionally safe by default:

- without `--apply` it only prints what it would export
- it does not touch the external `verb` dataset unless you opt in

## Source folder

The script uses the same environment variable as the pack builder:

```text
MALTI_VERB_MT_SOURCE
```

This should point to:

```text
...\verb\data\verbs
```

You can also pass the path explicitly with `--target`.

## What gets exported

The script only exports entries from:

```text
assets\data\verbs_extensions.json
```

whose meta type is:

```text
local extension
```

Each exported entry is converted into a structure compatible with the current external dataset:

- `slug`
- `letter_slug`
- `lemma`
- `meanings`
- `meta`
- `sections`
- `notes`

It also updates `index.json` with matching rows for the exported slugs.

## Dry run

Preview what would be exported:

```powershell
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\export_verbs_extensions_to_verb_mt.py
```

Preview only specific slugs:

```powershell
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\export_verbs_extensions_to_verb_mt.py --slug ieqaf-course --slug sajjar-course
```

## Apply changes

Actually write into the external `verb.mt` dataset:

```powershell
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\export_verbs_extensions_to_verb_mt.py --apply
```

Or with an explicit target:

```powershell
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\export_verbs_extensions_to_verb_mt.py --target C:\Users\ArturBuzov\Dropbox\Library\Lang\Maltese\verb\data\verbs --apply
```

## Recommended workflow

1. Improve or add local extension verbs in `assets\data\verbs_extensions.json`.
2. Rebuild and verify the local lookup pack.
3. Run this exporter in dry-run mode.
4. If the generated slugs and paths look correct, rerun with `--apply`.
5. Review the updated `verb.mt` files before committing there.

## Notes

- The script does not run automatically.
- It currently exports local extension entries as-is; it does not rewrite their slugs into canonical external lexeme slugs.
- For course-only helper slugs such as `ieqaf-course`, you may still want to rename or curate the entry manually in the external dataset after export.
