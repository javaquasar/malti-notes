# About Me Component Migration

Work package U02 from the [UI unification audit](ui-unification-audit.md).

## Changes

The static story form, guided story, dynamically generated child controls and recall answer now use `study-field` and `study-input`. Story preferences and detail checkboxes use `study-check`. Coverage states retain the existing `segmented-toggle` and `toggle-chip` components without page-specific padding, font size or minimum-height overrides, including mobile rules.

The page stylesheet retains composition: full-width form controls, story columns, child fieldsets, textarea resizing, preview separation and wrapping status groups. Guided child details span the control grid. Native input attributes, names, IDs, data hooks and all storage keys are unchanged. The custom progress track remains unchanged: U02 does not create another shared progress variant without consolidating the site's other tracks.

Guided controls now have visible shared labels, including the ready-made form selector. Existing question-based accessible names remain intact. Keyboard activation of the local-story preference is covered by the adaptive scenario, avoiding an unrelated pointer interception by the site's navigation menu.

## Verification

- `node scripts/about_me_builder_check.js`: number wording, English rows, full/short story, family options, personal prompts, both copy formats, missing-translation guard, local save/reload/clear and desktop/mobile layout.
- `node scripts/lesson01_adaptive_check.js`: guided child details, accepted variants, personal role-play, persistence and privacy. Personal names must not leak into non-draft storage.
- `npm run functional:test -- --suite progress-storage`: backup, reconciliation and cloud progress behavior.
- `npm run ui:runtime:check`: all ten guided steps, Back, child-field regeneration, draft restore, three themes at desktop/mobile sizes, shared fields/checks/status controls and deliberate appearance mutations. About Me states additionally reject horizontal overflow.
- `A11Y_PAGES=about_me.html npm run a11y:check`: desktop/mobile accessibility; use the current shell's environment-variable syntax.
- `npm run theme:a11y` and `npm run materials:check`: palette contrast and mandatory content/style/offline gates.

Browser artifacts are retained under ignored `tmp_ui/about-me-*.png` and `visual-regression/screenshots/about-me-builder/`. The known pre-existing full-catalog baseline height drift is not approved or overwritten by this migration.
