# Malti Notes

Static Maltese study notes, review pages, and vocabulary practice tools.

## B1/B2 Course

The site exposes a chapter-based route at `course_path.html`. Curriculum alignment lives in `assets/data/course_path.json`; original quick checks live in `assets/data/course_exercises.json` and are rendered by the shared `assets/js/exercise-runner.js` runtime.

Course objectives and exercise scores are stored locally and are included in the all-progress export on `review_cards.html`. Topic pages listed in the course data automatically receive links back to their chapters.

The course data validator enforces chapter, page, objective, and exercise-set references. Run the complete fast validation set with:

```powershell
npm run style:lint
npm run data:lint
npm run content:lint
npm run links:lint
npm run theme:a11y
npm run visual:smoke
```

GitHub Actions also runs the Playwright functional and visual suites before publishing the static site.

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

This checks key pages, CSS links, theme imports, CSS token declarations, shared CSS layers, and game CSS modularity.

For style-system changes, also run:

```powershell
npm run style:lint
npm run theme:a11y
```

`style:lint` checks CSS brace balance, verifies that `site.css` imports all shared layers, and prevents direct `hex`, `rgb/rgba`, and `color-mix()` values outside theme files. `theme:a11y` checks key foreground/background contrast pairs for `classic`, `forest`, and `contrast`.

### Generate Screenshots

```powershell
npm run visual:screenshots
```

Screenshots are saved to:

```text
visual-regression/screenshots/<timestamp>/
```

The workflow captures:

- Pages: every entry in `scripts/visual_config.js`, including the course path and the four dedicated B1/B2 topic pages.
- Themes: `classic`, `forest`, `contrast`.
- Viewports: desktop and mobile.

Each screenshot gets an isolated browser context, a deterministic `Math.random()` seed, and a cleared `localStorage` state so games and generated puzzles can be compared consistently.

### How To Use The Screenshots

1. Run `npm run visual:screenshots` before or after a major style change.
2. Open the newest folder under `visual-regression/screenshots/`.
3. Compare the new timestamp folder with the previous known-good folder.
4. Check spacing, card widths, tables, mobile navigation, theme switcher, word-search board, and dialogue/card alignment.

Generated screenshot folders are ignored by git. Keep only code, scripts, and docs in commits.

### Compare Two Screenshot Runs

After generating a new screenshot folder, compare it with a previous known-good folder:

```powershell
npm run visual:diff -- --baseline visual-regression/screenshots/<old-timestamp> --current visual-regression/screenshots/<new-timestamp>
```

Diff output is saved to:

```text
visual-regression/diffs/<timestamp>/
```

The diff folder contains:

- `summary.json` with per-file diff counts and ratios.
- `*__diff.png` images for screenshots with pixel differences.

Useful environment knobs:

```powershell
$env:VISUAL_DIFF_THRESHOLD="0.1"
$env:VISUAL_DIFF_MAX_RATIO="0.002"
```

### Promote A Baseline

When a screenshot run is visually approved, promote it as the local baseline:

```powershell
npm run visual:baseline -- --from visual-regression/screenshots/<approved-timestamp>
```

This copies screenshots into:

```text
visual-regression/baseline/
```

Then compare future runs against the baseline:

```powershell
npm run visual:diff:baseline -- --current visual-regression/screenshots/<new-timestamp>
```

The baseline folder is ignored by git. Commit the workflow scripts and docs, not generated PNG artifacts.

For the manual checklist, see `VISUAL_REGRESSION_CHECKLIST.md`.
