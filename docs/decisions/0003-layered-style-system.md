# Decision 0003: Layered Style System

- Status: Accepted
- Date: 2026-09-30

## Context

Page-local CSS and overlapping component classes repeatedly caused missing borders, fills, spacing, and inconsistent theme behavior.

## Decision

1. `assets/css/site.css` is the single page entry point and imports the shared layers in a stable order.
2. Theme files own color values. Shared and page CSS consume semantic custom properties instead of declaring direct colors.
3. Repeated learning surfaces use shared component contracts for cards, framed groups, tables, rules, questions, and translations.
4. Page-specific CSS may define composition unique to a page, but it must not duplicate shared visual contracts.
5. Classic, forest, and contrast themes are first-class and must pass automated contrast checks.
6. UI component screenshots, framed-group baselines, and full-page visual shards protect the common style system.
7. Legacy class aliases may remain only as documented migration bridges and should be removed after usage reaches zero.

## Consequences

- A shared token change can affect the whole site and therefore requires visual and accessibility verification.
- New component variants belong in the shared catalog before broad page adoption.
- Inline style declarations and direct color values outside theme files are rejected by style checks.
- The manual visual workflow remains documented in [Visual Regression Checklist](../quality/visual-regression-checklist.md).

## Shared Study Controls

For component descriptions, selection rules and implementation examples, see
[UI Components and Usage](../reference/ui-components.md).

The numbers-page migration applies the same ownership rule to interactive study
surfaces. `site/components.css` owns these contracts:

| Component | Shared classes |
| --- | --- |
| Fields and checkboxes | `study-field`, `study-input`, `study-check` |
| Responsive control groups | `control-row`, `control-row--responsive` |
| Choices and builder words | `study-option`, `study-token`, `study-token--selected`, `study-token--removable` |
| Compact actions | `study-icon-button`, `study-link-button` |
| Collapsible examples | `study-disclosure`, `study-disclosure-body`; combine with `study-card` for a framed question |
| Prompt, result and comparison | `study-question`, `study-feedback`, `study-contrast`, `study-progress-status` |
| Announcements | `study-live-status` |
| Printable worksheet | `print-sheet`, `print-sheet-section`; `printing-sheet` on the body |

Control heights, radii, padding, gaps, checkbox size, disabled opacity and prompt
sizes are semantic tokens in `theme.css`. Theme styles remain the only color
owners. Print behavior belongs in `site/print.css`; `no-print` hides controls.

`numbers-*` classes retained on these elements are behavioral/test hooks, not
legacy visual aliases. The local numbers stylesheet only owns composition,
number diagrams, grouping separators and table-column sizing. Its explicit
surface exceptions are recorded in `scripts/style_contract_check.js`.

`npm run style:lint` includes a native CSSOM ownership check. It rejects local
redefinitions of the new shared surfaces, page-local appearance rules and raw
spacing/font-size values in migrated/new page styles, including nested rules.
Five pre-existing page stylesheets remain a documented migration backlog, not a
precedent for new page CSS. Negative tests prove that renamed controls and
overrides inside media queries are rejected. Do not expand the exception list to
silence a duplicate component.
The guard also scans HTML style blocks, rejects inline style attributes, and
prevents page-local overrides of shared control tokens.

The component catalog includes enabled/disabled fields, checks, choices,
selected/returned words, open/closed disclosures, nested questions, comparisons
and a worksheet. `npm run numbers:style:check` compares real-page controls with
the catalog, mutates central tokens to verify propagation, checks three themes
at desktop/mobile widths, audits accessibility and verifies worksheet printing
and progress persistence. The CI workflow runs this check alongside catalog
visual regression; Linux and Windows catalog baselines are generated natively.
