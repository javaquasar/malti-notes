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

## Routine Project Check

Run the same source-content check used by GitHub Actions:

```powershell
npm run encoding:check
```

It scans HTML, JSON, CSS, and JavaScript while excluding dependencies, generated
visual artifacts, temporary folders, and the two runtime files that intentionally
contain mojibake recovery tables. Any invalid UTF-8 bytes, replacement characters,
or suspicious encoding markers fail the command.

If `--root` is omitted, the script resolves the project root from its own location,
so it also works from a different current directory.

## Basic Commands

### 1. Check All HTML Pages

```powershell
python scripts\utf8_mojibake_tool.py check --include *.html
```

### 2. Check With Verbose Output

This prints one line for every scanned file.

```powershell
python scripts\utf8_mojibake_tool.py check --include *.html --verbose
```

### 3. Fix All HTML Pages

```powershell
python scripts\utf8_mojibake_tool.py fix --include *.html
```

### 4. Fix With Verbose Output

```powershell
python scripts\utf8_mojibake_tool.py fix --include *.html --verbose
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
python scripts\utf8_mojibake_tool.py check --include *.html --include *.css
```

## Excluding Files

By default the script excludes:

```text
animals - Copy.html
.git/
.idea/
node_modules/
visual-regression/
tmp_*/
target/
```

You can add more exclusions:

```powershell
--exclude wasm_demo.html
--exclude review_cards.html
--exclude-dir imported-content
```

Example:

```powershell
python scripts\utf8_mojibake_tool.py check --include *.html --exclude wasm_demo.html
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
python scripts\utf8_mojibake_tool.py check --include *.html
python scripts\utf8_mojibake_tool.py fix --include *.html --verbose
python scripts\utf8_mojibake_tool.py check --include *.html
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

For this site, use the CI-equivalent command:

```powershell
npm run encoding:check
```

And when needed:

```powershell
python scripts\utf8_mojibake_tool.py fix --include *.html --verbose
```
