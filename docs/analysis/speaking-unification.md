# Speaking Practice Component Migration

Work package: U01 from the [UI unification audit](ui-unification-audit.md).

## Scope

The shared `lesson01-practice.js` controller serves Greetings, Polite Phrases, Conversation Help and Getting to Know Someone. It now composes the existing components rather than declaring independent visual controls:

| Element | Shared component |
| --- | --- |
| Practice section | `content-card` |
| Commands | `action-button` |
| Story navigation | `action-link` |
| View selector | `segmented-toggle` and `toggle-chip` with `aria-pressed` |
| Labels and inputs, including the local audio picker | `study-field` and `study-input` |
| Local-story checkbox | `study-check` |
| Optional distinctions | `study-disclosure` and `study-disclosure-body` |
| Main task | `study-question` |
| Dialogue, recording and recommended-task text | `study-contrast` |
| Task and dialogue results | `study-feedback` |
| Phrase collections and review bookmarks | Existing `stack`, `study-card` and shared review actions |

`lesson01-practice.css` retains only composition: grid tracks, wrapping, spacing tokens, media width, scroll targets and mobile stacking. It no longer owns any control surface, font, local color, disabled opacity, selected appearance, focus outline, checkbox size or section background. This migration introduces no new component variant or catalog baseline.

## Preserved Behavior

Review identities and all storage keys are unchanged, including `malti_lesson01_skills_v1` and the local profile integration. Grading, assisted/independent results, mistakes, role-play, timing, audio recording, file playback and privacy behavior remain in the existing controller. Native buttons, labels, disabled states and disclosure semantics are preserved.

## Verification

- `node scripts/lesson01_practice_check.js`: all four pages at 1280, 390 and 320 pixels; all 20 phrases, review toggles, task modes, dialogue roles, timer, microphone failure, local recording/playback, file upload and persistence. Shared controls are additionally compared against independent references in Classic, Forest and Contrast. Theme transitions settle before appearance comparison.
- `npm run ui:runtime:check`: live review and input contracts after tabs, disclosures, focus and saved-state reload. Deliberate control mutations must still fail.
- `npm run theme:a11y`: all three token palettes.
- `A11Y_PAGES=greetings.html,polite_phrases.html,conversation_help.html,getting_to_know.html npm run a11y:check`: eight desktop/mobile page audits; set the environment variable using the current shell's syntax.
- `npm run style:lint`, `npm run materials:check`, and `npm run release:check`: ownership, content gates and publication/offline integration.

Screenshots are retained in the ignored `visual-regression/screenshots/lesson01-practice/` directory. Desktop and mobile views are inspected before delivery. Existing unrelated full-catalog baseline height drift remains documented in [UI unification checks](../quality/ui-unification-checks.md); this migration does not promote or overwrite those references.
