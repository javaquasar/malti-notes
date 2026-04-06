# UTF-8 Mojibake Tool

This document explains how to use:

- [utf8_mojibake_tool.py](/C:/Workspace/prj/jq/malti-notes/scripts/utf8_mojibake_tool.py)

The script helps detect and repair common text-encoding problems in the site files, especially:

- broken UTF-8 / mojibake sequences such as `Ã`, `Â`, `Ä`, `Å`
- replacement characters `�`
- files that should be readable as UTF-8

## What The Script Does

It supports two modes:

- `check`
  - scans files
  - reports possible encoding problems
  - does not change anything

- `fix`
  - tries to repair common mojibake patterns
  - writes the repaired file back as proper UTF-8
  - re-checks the file after repair

## Default Root

If you do not provide a root manually, the script uses:

```text
C:\Workspace\prj\jq\malti-notes
```

## Basic Commands

### 1. Check All HTML Pages

```powershell
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\utf8_mojibake_tool.py check --root C:\Workspace\prj\jq\malti-notes --include *.html
```

### 2. Check With Verbose Output

This prints one line for every scanned file.

```powershell
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\utf8_mojibake_tool.py check --root C:\Workspace\prj\jq\malti-notes --include *.html --verbose
```

### 3. Fix All HTML Pages

```powershell
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\utf8_mojibake_tool.py fix --root C:\Workspace\prj\jq\malti-notes --include *.html
```

### 4. Fix With Verbose Output

```powershell
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\utf8_mojibake_tool.py fix --root C:\Workspace\prj\jq\malti-notes --include *.html --verbose
```

## Narrowing The Scope

You can scan or repair only specific file types or patterns.

### Only HTML

```powershell
--include *.html
```

### Only CSS

```powershell
--include *.css
```

### Multiple Include Patterns

```powershell
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\utf8_mojibake_tool.py check --root C:\Workspace\prj\jq\malti-notes --include *.html --include *.css
```

## Excluding Files

By default the script excludes:

```text
animals - Copy.html
```

You can add more exclusions:

```powershell
--exclude wasm_demo.html
--exclude review_cards.html
```

Example:

```powershell
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\utf8_mojibake_tool.py check --root C:\Workspace\prj\jq\malti-notes --include *.html --exclude wasm_demo.html
```

## Depth Control

The script scans recursively, but limits directory depth.

Default:

```text
--max-depth 3
```

You can increase it if needed:

```powershell
--max-depth 5
```

## Recommended Workflow

### Safe Workflow

1. Run `check`
2. Review the reported files
3. Run `fix`
4. Run `check` again to confirm the result

Example:

```powershell
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\utf8_mojibake_tool.py check --root C:\Workspace\prj\jq\malti-notes --include *.html
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\utf8_mojibake_tool.py fix --root C:\Workspace\prj\jq\malti-notes --include *.html --verbose
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\utf8_mojibake_tool.py check --root C:\Workspace\prj\jq\malti-notes --include *.html
```

## Output Meaning

Typical output looks like this:

```text
WARN  food_preferences.html | utf8_ok=True markers=245 replacement=0 maltese=0 | suspicious mojibake markers
```

Fields:

- `WARN`
  - file may contain encoding problems
- `utf8_ok=True`
  - file can be read as UTF-8
- `markers=245`
  - number of suspicious mojibake marker characters
- `replacement=0`
  - number of replacement characters `�`
- `maltese=0`
  - count of Maltese-specific characters found in the file

After repair you may see:

```text
FIXED pronouns_possessives.html | utf8_ok=True markers=0 replacement=0 maltese=112
```

## Important Notes

- The tool is designed for common mojibake patterns, not every possible encoding issue.
- It is best used on text-based project files such as:
  - `.html`
  - `.css`
  - `.js`
  - `.md`
- Always review changes if many files are repaired at once.
- If a file already contains correct UTF-8 text, the script tries not to change it.

## Suggested Use In This Project

For this site, the most useful command is:

```powershell
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\utf8_mojibake_tool.py check --root C:\Workspace\prj\jq\malti-notes --include *.html
```

And when needed:

```powershell
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\utf8_mojibake_tool.py fix --root C:\Workspace\prj\jq\malti-notes --include *.html --verbose
```
