# Exercise Field Unification

## Scope

U04 partial migration: the shared exercise runner now renders fill-blank inputs
and matching selects with `study-input`. Text-answer labels also use `study-field`.
Existing data attributes, names, answer collection, grading and storage keys are
unchanged. All consumers of the runner receive the same field component.

## Ownership

`assets/css/site/components.css` owns field appearance and state styling.
`assets/css/site/exercises.css` retains width, matching columns, label spacing and
exercise-specific layout. The old 42px input/select surface and label color skin
are removed. `responsive.css` no longer imposes a separate exercise field height.
This allows central height, padding and radius tokens to propagate on mobile too.

The exact UI registry removes two obsolete exercise surface selectors and records
the three changed AST signatures (two field factories and their containing
closure). No new exception, component or page-local surface is introduced.

## Verification

`npm run ui:runtime:check` includes a deterministic exercise fixture in classic,
forest and contrast themes at 1280px and 390px. It compares all three generated
fields with an independent shared reference, including keyboard focus and disabled
appearance. It changes central control tokens, checks overflow, submits incorrect
and correct answers, retries through rebuilt controls and checks attempt storage.
Screenshots are written to `tmp_ui/exercise-fields-<theme>-<width>.png`.

The existing mobile smoke contract now requires shared token ownership instead of
the deleted responsive override. The full material gate still enforces the exact
registry and English description. No visual baseline is automatically promoted.

### Results (2026-10-25)

- Passed: material preflight and final material gate, exact UI policy, theme
  contrast, all 10 course functional tests and four accessibility page/viewport
  combinations (numbers and particles, desktop/mobile).
- Passed: 540 runtime appearance states, including 48 exercise fixture states;
  mobile screenshot inspected without clipping or overlap.
- `visual:smoke` passes the migrated field contract but remains blocked by its
  existing CSS-link resolver treating `site.css?v=bank-views-3` as a filename.
- `visual:catalog` still reports six full-page baseline size mismatches. Baselines
  were not replaced; this is not a claim that the visual comparison passed.

## Remaining Work

U04 stays in progress. Review input/select/textarea skins and exercise choices and
word tokens still need separate migrations and behavior coverage. This change
does not claim that all shared control families have been unified.
