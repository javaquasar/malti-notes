# Review Field Unification

## Scope

U04 partial migration replaces the independent review field surface with
`study-input` on all 26 existing consumers:

| Page | Fields |
| --- | ---: |
| Review Cards | 12 |
| Memory | 3 |
| Word Builder | 3 |
| Word Search | 6 |
| Year 4 Exam | 2 |

IDs, option values, labels, event handlers and storage keys are unchanged. This
is a presentation migration, not a new review or game implementation.

## Ownership

`site/components.css` owns field surfaces, padding, minimum height, focus and
disabled state. `review-select`, `review-input` and `review-textarea` are retained
as width/resize layout hooks only; new fields should use `study-input` directly.
The custom example textarea uses native `rows="4"` rather than a separate minimum
height. The component catalog now includes a multiline shared field.

Two obsolete surface-owner entries are removed from the exact UI registry. No
new exception is added and no validator is weakened. The remaining review card,
checkbox, disclosure and feedback surfaces are outside this field-only change.

## Verification

`npm run ui:runtime:check` visits all five pages in classic, forest and contrast
themes at 1280px and 390px. It asserts all 26 consumers use the shared class,
compares visible fields against independent shared references, focuses each
visible field, tests disabled appearance and changes central height/padding/radius
tokens. It checks horizontal overflow and browser errors and writes screenshots
to `tmp_ui/review-fields-<page>-<theme>-<width>.png`; the custom form has additional
dedicated captures.

`npm run functional:test -- --suite review-games` protects review and game
behavior. The material gate verifies documentation, policy and generated offline
assets. Accessibility checks cover all five changed pages on desktop and mobile.
Visual baselines are not automatically promoted.

### Results (2026-10-25)

- Passed: preflight and final material gate, exact UI policy and theme contrast.
- Passed: 786 runtime appearance states, including the five migrated pages in
  three themes and two viewport widths; the mobile custom-form capture was
  inspected without clipping or overlap.
- Passed: all 13 review/game functional tests and 10 accessibility combinations.
- A separate isolated mobile-browser check passed custom-card creation, saved
  search filtering and unchanged review-store contents after reload.
- `visual:catalog` still reports six full-page size mismatches against existing
  baselines. The catalog also intentionally gains a textarea example in this
  change. No baseline was promoted and the visual comparison is not passed.

## Remaining Work

U04 remains in progress: exercise choices/tokens and remaining review controls
still need migrations. This does not mark the entire game chrome, Year 4 renderer
or review factory backlog as complete.
