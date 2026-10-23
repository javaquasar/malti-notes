# UI Unification Audit and Refactoring Backlog

Date: 2026-10-21. Repository baseline: `852be7a`.
Status: source audit; refactoring is proposed, not implemented by this document.

## Executive Summary

The site has a shared style system, but unification is incomplete. The main
remaining problem is not inline HTML styling: it is multiple independently
maintained implementations of the same controls, plus a globally loaded legacy
stylesheet that still owns component surfaces.

- Inspected all 55 root HTML pages, all 24 CSS files and the 57 JavaScript modules
  under `assets/js`, using stylesheet/script inventories and targeted source reads.
- All 55 pages load `theme.css`, `site.css` and `pages.css` (query strings normalized).
- Found no `style` attributes or `<style>` blocks in the root HTML sources.
- Found runtime CSS assignments and HTML templates in JavaScript. Some are
  legitimate geometry/content data; some are obsolete or need a narrower contract.
- Five stylesheets are explicitly exempt from part of the page-composition guard.
- Identified 12 refactoring work packages below. None requires a wholesale rewrite
  of the learning engines or a reset of saved progress.

This is not a fresh visual/accessibility certification of every page and state.
Loading a shared stylesheet does not prove that every element uses shared
components. Likewise, a custom class or a specialized game renderer is not
automatically a defect.

## Classification

- **P1**: prioritize in the next unification pass; duplicated foundational controls
  or a shared surface that can drift across pages.
- **P2**: targeted component consolidation after the foundational work.
- **P3**: cleanup or small consistency improvement; no confirmed current UI failure.
- **Confirmed duplication** means source evidence exists, not necessarily that a
  visible failure was reproduced in every theme.

The contracts used for this audit are the
[component guide](../reference/ui-components.md),
[style architecture](../decisions/0003-layered-style-system.md) and
[authoring workflow](../quality/material-authoring.md).

## Prioritized Refactoring List

| ID | Priority | Pages / scope | Refactor target |
| --- | --- | --- | --- |
| U01 | P1 | `greetings.html`, `polite_phrases.html`, `conversation_help.html`, `getting_to_know.html` | Remaining Speaking Practice fields, buttons, tabs and feedback |
| U02 | P1 | `about_me.html` | Story-builder fields, checks, guided controls and status toggles |
| U03 | P1 | `pronouns_possessives.html`; global cascade exposure on all 55 pages | Duplicate `demo-box` surface in `pages.css` |
| U04 | P1 | Exercise-runner consumers, review forms and game filters | Parallel shared input/choice/token families |
| U05 | P2 | `year4_exam.html` | Independent tabs, vocabulary cards and card rendering |
| U06 | P2 | `health_doctor.html` | Page-local table surface and `!important` override |
| U07 | P2 | `verbs_guide.html`, `imperative_verbs.html` | Verb-table launcher buttons |
| U08 | P2 | `word_search.html`, `memory_game.html`, `word_builder_game.html`; shared game consumers | Non-gameplay command/status surfaces |
| U09 | P2 | Shared example/vocabulary banks, course chapter, Year 4, Speaking Practice | Repeated review-button factories and synchronization |
| U10 | P2 | `colors_maltese.html`, `shopping_clothes.html`, color cards in `review_cards.html` | Arbitrary CSS-string swatch payloads |
| U11 | P3 | `numbers_calendar_time.html` | Redundant bookmark/table-layout rules after shared variants were introduced |
| U12 | P3 | `review_cards.html`; unused legacy CSS candidates | Shadowed renderer and obsolete style definitions |

### U01: Speaking Practice Still Owns Its Controls

Evidence: [lesson01-practice.css](../../assets/css/lesson01-practice.css), lines
4-12, 19-23 and 27-31; [lesson01-practice.js](../../assets/js/lesson01-practice.js),
the `button`, `select`, `controls`, `open` and practice-input builders.

The module defines its own field surfaces, button padding/radius, selected-state
colors, focus outlines, checkbox dimensions and responsive sizes. Excluding
`.review-add-button` fixed a real cascade conflict, but did not migrate the rest
of this independent control system.

Target: `study-field`, `study-input`, `study-check`, `action-button`,
`segmented-toggle` / `toggle-chip`, `control-row`, `study-question` and
`study-feedback`. Keep `lp-*` identifiers as behavior/test hooks where needed.
The phrase items already use `study-card` and `stack`; their missing-background
and bookmark-color defects have been fixed and must not be reported as still open.

Acceptance: all four pages, three themes, 320/390/1280px, selected/unselected and
saved/unsaved states; existing task, role-play, recording and progress tests.

### U02: About Me Has a Separate Form Design System

Evidence: [pages.css](../../assets/css/pages.css), lines 324-335, 353-390,
421-477 and 504-511; [about_me.html](../../about_me.html), lines 136-285.

`.about-me-field` and `.about-me-guided-control` independently define borders,
padding, backgrounds, focus behavior and fixed 44px heights. `.about-me-check`
uses its own checkbox sizing. `.about-me-status-control .toggle-chip` overrides
shared control dimensions. This is confirmed duplication, even when colors use
theme tokens.

Target: the shared field/input/check/segmented-control contracts. Retain the
story-specific grids, child fieldsets, preview layout and content wrapping.
Move progress-track appearance to a reusable shared progress component only if
it is consolidated with the other existing progress tracks.

Acceptance: keyboard workflow, guided Back/Skip/Next, child details, copy,
local-only personal data, story drafts and cloud-sync privacy remain intact.

### U03: A Shared Demonstration Surface Is Redefined Globally

Evidence: [pages.css](../../assets/css/pages.css), lines 123-129, versus
[site/components.css](../../assets/css/site/components.css), lines 75-82.
[pronouns_possessives_examples.json](../../assets/data/pronouns_possessives_examples.json)
selects `cardClass: "demo-box"` for three generated groups.

Both layers define the same component's border, radius, padding and background.
`pages.css` loads after `site.css` on every root page, so it becomes a second
surface owner. There is no static `.demo-box` element in root HTML; the confirmed
live consumer is the generated pronoun material. Do not miss this by auditing
HTML classes alone. Token aliases may currently resolve to similar values;
the confirmed issue is ownership duplication, not a measured theme failure.

Target: one `demo-box` surface in the shared layer; retain only genuine page
composition in `pages.css`. Check dynamic pronoun groups and the component catalog.

### U04: Shared Controls Still Have Parallel Contracts

Evidence: [site/exercises.css](../../assets/css/site/exercises.css), lines 44-84
and 123-137; [site/review.css](../../assets/css/site/review.css), `.review-select`
around line 239 and `.review-input` / `.review-textarea` around line 527;
[site/components.css](../../assets/css/site/components.css), `study-input`,
`study-option`, `study-token` and `study-check`.

These are shared files, not forbidden page-local CSS. Nevertheless they maintain
separate input/choice/token surfaces. Exercise inputs specify `min-height: 42px`
while the study contract uses `--control-height` (44px). Review inputs use a
separate radius and padding. Adding `study-input` to an exercise input does not
automatically neutralize the more specific exercise selector.

Target: share the visual primitives and theme tokens underneath the existing
exercise/review semantic classes. Keep specialized radio-choice semantics,
matching layouts and ordering behavior; do not replace the grading engine.

Acceptance: exercise recognition/production/matching/ordering, review creation
and filters, game selectors, disabled/error/focus states and central-token
propagation. The impact is cross-page, not just the particles lesson.

### U05: Year 4 Vocabulary Is Still Independently Rendered

Evidence: [pages.css](../../assets/css/pages.css), lines 698-802 and 898-915;
[year4-exam.js](../../assets/js/year4-exam.js), tab builders near lines 108/129
and vocabulary rendering near lines 178-207.

`.year4-tab` and `.year4-card` own separate surfaces. The JS assembles vocabulary
markup and a bookmark manually, despite using `MaltiVocabRenderer` for study
controls. These classes are generated at runtime and do not appear as rendered
cards in the HTML source.

Target: shared tabs and a documented vocabulary-card variant, preferably through
`MaltiVocabRenderer`. Preserve translation hiding/reveal, image handling, examples,
collection metadata, keyboard focus and existing review IDs.

### U06: Health's Attached-Pronoun Table Overrides the Shared Surface

Evidence: [health_doctor.html](../../health_doctor.html), lines 85-86;
[pages.css](../../assets/css/pages.css), `.attached-pattern-panel` and
`.attached-pattern-table` around lines 803-815.

The table combines `table-soft` with an independently declared background using
`!important`, a border and a fixed 20px radius. This overrides the shared surface
instead of selecting a documented semantic variant.

Target: keep `table-soft`, the semantic table and its column composition. If a
distinct surface is necessary, define a reusable shared table variant and catalog
it. Do not restore the previously removed nested outer frame.

### U07: Verb Launchers Need a Shared Variant, Not a Local Button Surface

Evidence: [pages.css](../../assets/css/pages.css), lines 248-271 and the mobile
`.verb-trigger` block; [render-verbs-course-bank.js](../../assets/js/render-verbs-course-bank.js),
line 66; [render-imperative-verbs-page.js](../../assets/js/render-imperative-verbs-page.js),
line 118.

`verb-trigger` defines its own fill, border, hover/focus treatment and dimensions;
the focus rule also removes the outline. Its compact inline-code presentation is
legitimate, but should be an explicit shared launcher variant with accessible
focus, rather than an incidental rule in the global page stylesheet.

Target: a cataloged shared command/link-like variant; keep the existing
`verb-trigger` delegation hook, popup lookup and narrow-table wrapping behavior.

### U08: Consolidate Game Chrome, Not Gameplay Tiles

Evidence: [word-search.css](../../assets/css/word-search.css), lines 5-43;
[vocabulary-games.css](../../assets/css/vocabulary-games.css), `.round-list` and
`.matched-pair-list`; [site/games.css](../../assets/css/site/games.css), lines 12-96.

Word-search commands redefine their backgrounds/borders separately. Timers and
status/result lists have independently maintained panel/list surfaces. Field and
checkbox contracts are also separate from the study controls.

Target: shared command variants, fields/checks and a reusable status/list surface
where the semantics match. The memory grid, letter board, selection/found states,
flying tiles and puzzle geometry should remain game-specific. Reusing an
`action-button` for every letter cell would not be a useful unification.

`topic-picker.css` currently contains only a compatibility comment; it is not an
active duplicate surface. Do not list it as a confirmed rendering defect merely
because it appears in the legacy allowlist.

### U09: Review-Button Behavior Is Repeated Across Controllers

Evidence: [render-example-banks.js](../../assets/js/render-example-banks.js),
`createSentenceReviewButton` / `createQuestionReviewButton`;
[vocab-review-page.js](../../assets/js/vocab-review-page.js), lines 60 and 124;
[course-chapter.js](../../assets/js/course-chapter.js), line 258;
[year4-exam.js](../../assets/js/year4-exam.js), line 200;
[lesson01-practice.js](../../assets/js/lesson01-practice.js), lines 103-120.

The surface is shared, but factories independently manage labels, text content,
saved-state classes, event subscriptions and store operations. The earlier
grid/text centering defect illustrates why identical CSS classes alone do not
constitute a complete reusable component.

Target: one shared review-action factory that receives the already normalized
card identity and store operation, supports inline/card placement and updates
`aria-label`, `title` and `aria-pressed`. Preserve word versus sentence identities,
legacy migrations, bulk controls and storage-change synchronization.

### U10: Color Swatches Accept Arbitrary Style Strings

Evidence: [render-vocab-cards.js](../../assets/js/render-vocab-cards.js), line 43;
[review-cards.js](../../assets/js/review-cards.js), line 895;
[colors.json](../../assets/data/colors.json) and
[shopping_clothes.json](../../assets/data/shopping_clothes.json), `swatchStyle`.

These are active runtime style paths. Literal red/blue/etc. are educational
content and must not be replaced with a theme accent. However, passing an entire
CSS declaration string through `setAttribute("style", ...)` or an HTML template
is broader than the required content-color contract.

Target: structured, validated swatch data and one shared swatch renderer. Permit
only the necessary color/gradient values; keep card surface/radius/spacing in
shared CSS. Retain compatibility with saved cards carrying `swatchStyle` until
an explicit migration exists. This is an ownership/data-contract finding, not
evidence of an exploited security vulnerability.

### U11: Numbers Has Small Redundant Review-Layout Rules

Evidence: [numbers-expansion.css](../../assets/css/numbers-expansion.css), lines
14-21; shared [review-inline.css](../../assets/css/site/review-inline.css).

The numbers bookmark repeats static positioning, dimensions and the removed
glyph transform. Its reference table has a separate review-column alignment
contract now partly covered by the shared `review-table` variant.

Target: assess reuse of `review-add-button--inline` and `review-table`; keep the
numbers-specific 44px desktop target if intentional through a documented shared
size option, not an accidental shrink. Preserve narrow mobile table padding and
diagram layout. This is low-priority duplication, not a confirmed current bug.

### U12: Remove Shadowed Rendering and Verify Dead CSS Before Deleting

Evidence: [review-cards.js](../../assets/js/review-cards.js), two declarations of
`renderCurrentCardStage` near lines 1177 and 1394. The earlier declaration embeds
inline spacing, a raw `rgba(...)` background and a 12px radius near lines
1199-1213. The later declaration dispatches to `renderClassicCardStage` and
`renderFlipCardStage`.

Because these declarations share the same function scope, the later function
replaces the earlier one. Do not report the old inline example block as a proven
active UI defect. Remove the obsolete implementation after checking that no
associated identifiers/handlers remain in use.

Also review `.demo-form input` in `pages.css` around line 314: no root HTML or
`assets/js` consumer was found. Remove only after verifying dynamic/external
consumers. Do not remove `.demo-box`: it has confirmed JSON-driven consumers.

## Coverage of Pages

The following 15 pages have a directly identified page/module refactoring target:

| Page | Work packages |
| --- | --- |
| `about_me.html` | U02; shared fields under U04 |
| `conversation_help.html` | U01, U09 |
| `getting_to_know.html` | U01, U09 |
| `greetings.html` | U01, U09 |
| `polite_phrases.html` | U01, U09 |
| `pronouns_possessives.html` | U03 |
| `health_doctor.html` | U06 |
| `year4_exam.html` | U05, U09; gameplay/layout distinction under U08 |
| `imperative_verbs.html` | U07 |
| `verbs_guide.html` | U07 |
| `review_cards.html` | U04, U10, U12 |
| `numbers_calendar_time.html` | U11; shared exercise controls under U04 |
| `memory_game.html` | U08; shared selectors under U04 |
| `word_builder_game.html` | U08; shared selectors under U04 |
| `word_search.html` | U08; shared selectors under U04 |

The remaining 40 root pages were included in the stylesheet/script inventory:

`all_pages.html`, `animals.html`, `body_appearance.html`, `collective_nouns.html`,
`colors_maltese.html`, `common_mistakes.html`, `comparisons.html`,
`course_chapter.html`, `course_exam.html`, `course_path.html`,
`course_progress.html`, `coverage_test.html`, `daily_problems.html`,
`daily_routine.html`, `directions_town.html`, `emotions.html`,
`environment_recycling.html`, `family_home_food.html`, `food_preferences.html`,
`grammar_path.html`, `hobbies_future.html`, `home_furniture.html`,
`impactful_people.html`, `index.html`, `introductions_alphabet.html`,
`knowledge_map.html`, `mistakes.html`, `modals_needs.html`,
`particles_prepositions.html`, `picture_description.html`, `places_events.html`,
`prepositions_place.html`, `reading_red_cave.html`, `restaurant_ordering.html`,
`school_classroom.html`, `sentence_builder.html`, `shopping_clothes.html`,
`today.html`, `transport_travel.html`, `weather.html`.

This does not certify those 40 pages as defect-free. In particular U04/U09 affect
their shared infrastructure, U10 directly concerns the color/clothes pages, and
the global `pages.css` cascade reaches all 55 pages. The particles and Red Cave
blocks already use shared bank presentations; they do not need another local
renderer rewrite.

## Custom Styling That Should Remain

- Fraction segments, numeric grouping and number-builder composition in
  `numbers-expansion.css`: domain visuals, not replacement input/card surfaces.
- Word-search board sizing/selection geometry and memory/builder gameplay states:
  legitimate specialized UI, provided they keep semantic tokens and catalog/tests.
- Runtime progress values: `about-me.js:392`, `course-path.js:176`,
  `course-progress.js:67`, `coverage-test.js:107`, `knowledge-map.js:132` and
  `word-search-game.js:1000`. Consolidating progress markup is useful; assigning
  the current percentage is not itself an illegal visual theme override.
- Runtime FAB positioning in `site-header.js:483-494` and flying-tile geometry in
  `vocabulary-games.js:80-93`: measured positioning/animation, not custom skins.
- Search, flip cards, diagrams and specialized tables may need shared semantic
  variants; they should not be flattened into one universal card.

## Why Existing Checks Do Not Prove Full Unification

1. `scripts/style_contract_check.js:8` exempts `pages.css`,
   `lesson01-practice.css`, `topic-picker.css`, `vocabulary-games.css` and
   `word-search.css` from the generic page-surface/composition test. Other checks
   still apply; these are not blanket exemptions from every rule.
2. Shared study-selector ownership is checked, but independent `.about-me-field`,
   `.year4-tab` or `.lesson-practice button` families can still duplicate the same
   visual concepts without using protected `study-*` selectors.
3. HTML-source scans do not see all markup/styles produced by JavaScript or JSON
   `cardClass` metadata. Swatches are an example of an active runtime escape path.
4. A snapshot containing only an empty icon button does not cover the renderer's
   text-bearing button or paragraph-first grid layout. Both states are required.

Any future tightening of guard allowlists/validator scope is **policy maintenance**
and needs explicit authorization under `AGENTS.md`. This audit does not change,
disable or weaken a validator.

## Implementation Order and Completion Criteria

1. Inventory and freeze behavior/storage IDs for U01/U02/U04/U09; add missing
   shared variants to the component guide/catalog before migrating consumers.
2. Migrate U01 and U02 in separate changes. Remove old surface rules only after
   their actual native/generated controls use the shared classes.
3. Consolidate U04 and U09 with broader cross-page regression tests. Preserve all
   review IDs, grading semantics, privacy boundaries and event synchronization.
4. Resolve U03/U05/U06/U07, then game chrome U08 and swatch contract U10.
5. Clean up U11/U12 and identify which legacy exceptions can be retired through
   an explicitly authorized policy-maintenance change.

For each package: compare real controls to catalog specimens in classic, forest
and contrast themes; test desktop and 320/390px mobile widths; cover hover, focus,
disabled, selected, saved/unsaved and disclosure states. Verify persisted drafts,
review toggling, copy/print and offline behavior where applicable. Review genuine
visual changes before updating native Windows/Linux baselines; never use one
platform's images to stand in for the other.

## Verification Record and Limits

- `npm run materials:preflight`: passed during this audit, including style lint,
  typed content, links and search/offline freshness.
- Root HTML/style/script inventory and targeted CSS/JS/JSON inspection completed.
- DOMParser checks confirmed static versus generated uses for selected classes.
- No new full-site screenshot run, exhaustive computed-style comparison or
  full-page accessibility sweep was performed for this documentation-only audit.
- Existing catalog baselines were already reported out of sync in earlier work;
  this audit does not promote screenshots or claim that comparison now passes.
- No website, data, renderer, storage, hook or validator behavior changed here.
