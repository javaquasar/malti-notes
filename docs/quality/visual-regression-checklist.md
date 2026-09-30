# Visual Regression Checklist

Run after broad CSS/theme changes.

## Command

```powershell
npm run visual:smoke
```

Generate screenshots with the installed system Chrome:

```powershell
npm run visual:screenshots
```

Compare two screenshot folders:

```powershell
npm run visual:diff -- --baseline visual-regression/screenshots/<old-timestamp> --current visual-regression/screenshots/<new-timestamp>
```

Promote an approved screenshot folder to the local baseline:

```powershell
npm run visual:baseline -- --from visual-regression/screenshots/<approved-timestamp>
```

Compare a new run against the baseline:

```powershell
npm run visual:diff:baseline -- --current visual-regression/screenshots/<new-timestamp>
```

## Pages

- `index.html`
- `verbs_guide.html`
- `pronouns_possessives.html`
- `picture_description.html`
- `collective_nouns.html`
- `word_search.html`
- `memory_game.html`
- `word_builder_game.html`
- `shopping_clothes.html`
- `daily_problems.html`

## Themes

- `classic`
- `forest`
- `contrast`

## Viewports

- desktop width around `1280px`
- mobile width around `390px`

## What To Check

- Header navigation and theme switcher fit without overlap.
- Cards keep vertical and horizontal spacing.
- Tables do not overflow unexpectedly.
- Review buttons and status chips stay aligned.
- `word_search.html` board, word list, found states, and print controls still read clearly.
- `picture_description.html` keeps two-column intent where expected.
- `shopping_clothes.html` dialogue bubbles keep alternating alignment.
- `daily_problems.html` keeps shared nav arrows and review action buttons styled.
