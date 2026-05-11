# Malti Notes

Static Maltese study notes, review pages, and vocabulary practice tools.

## Visual Regression Workflow

Use this workflow after broad CSS, layout, or theme changes.

### Install

```powershell
npm install
```

The screenshot script uses the system Chrome by default:

```powershell
C:\Program Files\Google\Chrome\Application\chrome.exe
```

If Chrome is installed elsewhere, override it:

```powershell
$env:CHROME_PATH="C:\Path\To\chrome.exe"
```

### Smoke Check

Run the fast structural checks:

```powershell
npm run visual:smoke
```

This checks key pages, CSS links, theme imports, CSS token declarations, and the word-search CSS split.

### Generate Screenshots

```powershell
npm run visual:screenshots
```

Screenshots are saved to:

```text
visual-regression/screenshots/<timestamp>/
```

The workflow captures:

- Pages: `index`, `verbs_guide`, `pronouns_possessives`, `picture_description`, `collective_nouns`, `word_search`, `shopping_clothes`.
- Themes: `classic`, `forest`, `contrast`.
- Viewports: desktop and mobile.

### How To Use The Screenshots

1. Run `npm run visual:screenshots` before or after a major style change.
2. Open the newest folder under `visual-regression/screenshots/`.
3. Compare the new timestamp folder with the previous known-good folder.
4. Check spacing, card widths, tables, mobile navigation, theme switcher, word-search board, and dialogue/card alignment.

Generated screenshot folders are ignored by git. Keep only code, scripts, and docs in commits.

For the manual checklist, see `VISUAL_REGRESSION_CHECKLIST.md`.
