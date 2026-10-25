# Enforced UI Unification Contract

Generated from `scripts/ui_unification_contract.json` by `npm run ui:policy:describe`. Both files must change together when this contract changes. The check never accepts a new inventory automatically.

## Rules

### UI-01: Shared Surface Ownership

Shared backgrounds, borders, typography, focus and control padding have registered stylesheet owners. A new selector or owner is rejected until the registry and this description are reviewed together.

### UI-02: Exact Legacy Exceptions

Legacy CSS is not exempt by filename. Existing regulated declarations, priorities and nested conditions are frozen individually. Additions, edits and removals require an explicit list/description update; migrated pages cannot regain an undocumented local skin.

### UI-03: Native Controls

New static fields, commands and binary preferences use the listed shared components. Existing nonstandard native controls are exact exceptions; new unclassified controls fail without an explicitly described exception.

### UI-04: Runtime Factories

DOM, markup, class and style factories are parsed with Acorn and registered by normalized AST. A changed or new factory needs explicit registry and description review, even if the change is likely compliant. Formatting and comments do not require a signature update.

### UI-05: Theme And Composition

Colors and shared control values belong to theme owners. Page composition may use existing tokens for layout. Existing style lint additionally rejects hardcoded colors, local shared-token overrides and undocumented component duplication.

### UI-06: Stylesheet Dependencies

Root pages load theme.css, site.css and pages.css once in that order. Nonstandard links and CSS imports are individually registered; direct shared-layer or external stylesheet additions cannot silently bypass ownership.

### UI-07: Inline Styles And Content

HTML inline styles and inline style blocks are not a new authoring path. Dynamic style sinks require factory review. Existing non-empty data CSS strings are frozen under the swatch migration backlog; arbitrary new strings need a described exception.

### UI-08: Documentation Coupling

This complete rule list, ownership list and exception description is generated deterministically from the versioned JSON registry. Missing descriptions, stale prose, duplicate entries and count mismatches fail. Inventory collection never accepts source changes into the policy.

### UI-09: Required Verification

The exact-tree pre-commit/pre-push material gate and CI require this contract, existing style checks and required component references. Runtime, accessibility and reviewed visual checks remain mandatory for affected features; no automatic visual approval is introduced.

### UI-10: Policy Changes And Limits

Changing these rules is policy maintenance and requires an explained registry/documentation diff plus independent review. Repository checks cannot stop an administrator who edits the checks or bypasses protections; GitHub required checks and code-owner review must be configured separately.

## Standard Native Controls

`action-button`, `action-link`, `review-add-button`, `toggle-chip`, `study-input`, `study-option`, `study-token`, `study-icon-button`, `study-link-button`, `toggle-images`, `home-toggle`, `review-input`, `review-select`, `review-textarea`

Fields use `study-input`, `review-input`, `review-select` or `review-textarea`; commands use the command classes, not field classes. `action-link` is for navigation, not an input/button shortcut. Checkboxes and radios use native inputs inside `study-check`, `exercise-choice` or `course-objective`. Hidden inputs are not visual controls.

## Registered Ownership And Exceptions

Each entry below is exact, file-bound and count-bound. CSS selector ownership is registered separately from its values so central theme/design edits remain possible. Legacy CSS freezes regulated declarations, including nested conditions and priorities. Legacy HTML controls freeze their attributes and content. JavaScript factory signatures use parsed ASTs, excluding formatting/comments/locations. New or changed factories require an explicit registry and description review.

| File | Kind | Entries | Description |
| --- | --- | ---: | --- |
| imperative_verbs.html | legacy-control | 1 | Unmigrated native controls in imperative_verbs.html, retained for U04/U07/U08 behavior compatibility. Their exact markup is frozen until a documented migration removes these entries. |
| mistakes.html | legacy-control | 1 | Unmigrated native controls in mistakes.html, retained for U04/U07/U08 behavior compatibility. Their exact markup is frozen until a documented migration removes these entries. |
| review_cards.html | legacy-control | 5 | Unmigrated native controls in review_cards.html, retained for U04/U07/U08 behavior compatibility. Their exact markup is frozen until a documented migration removes these entries. |
| verbs_guide.html | legacy-control | 1 | Unmigrated native controls in verbs_guide.html, retained for U04/U07/U08 behavior compatibility. Their exact markup is frozen until a documented migration removes these entries. |
| assets/css/numbers-expansion.css | legacy-css | 15 | Exact existing number-diagram, separator and responsive table exceptions; U11 remains under review. This does not authorize a new local control surface. |
| assets/css/pages.css | legacy-css | 70 | Frozen remaining legacy surfaces and raw spacing in pages.css; see the UI audit backlog. Only these exact declarations/conditions are retained, not a whole-file exemption. |
| assets/css/vocabulary-games.css | legacy-css | 24 | Frozen remaining legacy surfaces and raw spacing in vocabulary-games.css; see the UI audit backlog. Only these exact declarations/conditions are retained, not a whole-file exemption. |
| assets/css/word-search.css | legacy-css | 90 | Frozen remaining legacy surfaces and raw spacing in word-search.css; see the UI audit backlog. Only these exact declarations/conditions are retained, not a whole-file exemption. |
| assets/js/about-me.js | script-factory | 14 | Existing DOM/class/style factory implementation in about-me.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/animal-compact-toggle.js | script-factory | 3 | Existing DOM/class/style factory implementation in animal-compact-toggle.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/course-chapter.js | script-factory | 10 | Existing DOM/class/style factory implementation in course-chapter.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/course-context.js | script-factory | 5 | Existing DOM/class/style factory implementation in course-context.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/course-exam.js | script-factory | 1 | Existing DOM/class/style factory implementation in course-exam.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/course-path.js | script-factory | 7 | Existing DOM/class/style factory implementation in course-path.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/course-progress.js | script-factory | 7 | Existing DOM/class/style factory implementation in course-progress.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/course-topic-view.js | script-factory | 2 | Existing DOM/class/style factory implementation in course-topic-view.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/coverage-test.js | script-factory | 3 | Existing DOM/class/style factory implementation in coverage-test.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/exercise-runner.js | script-factory | 14 | U04 field migration: renderFillBlank now uses study-field/study-input and renderMatching uses study-input. Only these factories and their containing closure change; grading, IDs and progress remain unchanged. See docs/analysis/exercise-fields-unification.md. |
| assets/js/firebase-sync.js | script-factory | 5 | Existing DOM/class/style factory implementation in firebase-sync.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/grammar-path.js | script-factory | 3 | Existing DOM/class/style factory implementation in grammar-path.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/home-compact-toggle.js | script-factory | 2 | Existing DOM/class/style factory implementation in home-compact-toggle.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/knowledge-map.js | script-factory | 5 | Existing DOM/class/style factory implementation in knowledge-map.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/lesson01-practice.js | script-factory | 11 | Existing DOM/class/style factory implementation in lesson01-practice.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/lesson01-supplements.js | script-factory | 1 | Existing DOM/class/style factory implementation in lesson01-supplements.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/mistakes.js | script-factory | 4 | Existing DOM/class/style factory implementation in mistakes.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/numbers-expansion.js | script-factory | 8 | Existing DOM/class/style factory implementation in numbers-expansion.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/numbers-helper.js | script-factory | 2 | Existing DOM/class/style factory implementation in numbers-helper.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/numbers-learning.js | script-factory | 5 | Existing DOM/class/style factory implementation in numbers-learning.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/numbers-practice.js | script-factory | 8 | Existing DOM/class/style factory implementation in numbers-practice.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/numbers-time-drill.js | script-factory | 1 | Existing DOM/class/style factory implementation in numbers-time-drill.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/numbers-tools.js | script-factory | 6 | Existing DOM/class/style factory implementation in numbers-tools.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/particles-study.js | script-factory | 11 | Existing DOM/class/style factory implementation in particles-study.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/render-course-verb-paradigms.js | script-factory | 5 | Existing DOM/class/style factory implementation in render-course-verb-paradigms.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/render-example-banks.js | script-factory | 19 | Existing DOM/class/style factory implementation in render-example-banks.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/render-imperative-verbs-page.js | script-factory | 11 | Existing DOM/class/style factory implementation in render-imperative-verbs-page.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/render-verbs-course-bank.js | script-factory | 1 | Existing DOM/class/style factory implementation in render-verbs-course-bank.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/render-vocab-cards.js | script-factory | 9 | Existing DOM/class/style factory implementation in render-vocab-cards.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/render-vocab-table.js | script-factory | 7 | Existing DOM/class/style factory implementation in render-vocab-table.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/review-cards.js | script-factory | 15 | Existing DOM/class/style factory implementation in review-cards.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/site-header.js | script-factory | 11 | Existing DOM/class/style factory implementation in site-header.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/site-map-pages.js | script-factory | 3 | Existing DOM/class/style factory implementation in site-map-pages.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/today.js | script-factory | 1 | Existing DOM/class/style factory implementation in today.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/topic-picker.js | script-factory | 3 | Existing DOM/class/style factory implementation in topic-picker.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/transport-compact-toggle.js | script-factory | 3 | Existing DOM/class/style factory implementation in transport-compact-toggle.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/verb-lookup-loader.js | script-factory | 11 | Existing DOM/class/style factory implementation in verb-lookup-loader.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/verbs-review.js | script-factory | 1 | Existing DOM/class/style factory implementation in verbs-review.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/vocab-review-page.js | script-factory | 6 | Existing DOM/class/style factory implementation in vocab-review-page.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/vocab-view-toggle.js | script-factory | 1 | Existing DOM/class/style factory implementation in vocab-view-toggle.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/vocabulary-games.js | script-factory | 15 | Existing DOM/class/style factory implementation in vocabulary-games.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/word-search-game.js | script-factory | 28 | Existing DOM/class/style factory implementation in word-search-game.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/js/year4-exam.js | script-factory | 9 | Existing DOM/class/style factory implementation in year4-exam.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved. |
| assets/css/site/base.css | shared-selector | 23 | Registered shared surface owner: base.css. Selectors remain centralized here; adding or moving a surface requires a described component/ownership change. |
| assets/css/site/components.css | shared-selector | 71 | Registered shared surface owner: components.css. Selectors remain centralized here; adding or moving a surface requires a described component/ownership change. |
| assets/css/site/exercises.css | shared-selector | 25 | U04 field migration removes the exercise-input-label surface and legacy input/select skin. components.css now owns field appearance; this sheet retains exercise composition, choice/token debt and feedback contracts. See docs/analysis/exercise-fields-unification.md. |
| assets/css/site/games.css | shared-selector | 11 | Registered shared surface owner: games.css. Selectors remain centralized here; adding or moving a surface requires a described component/ownership change. |
| assets/css/site/imperative.css | shared-selector | 27 | Registered shared surface owner: imperative.css. Selectors remain centralized here; adding or moving a surface requires a described component/ownership change. |
| assets/css/site/layout.css | shared-selector | 32 | Registered shared surface owner: layout.css. Selectors remain centralized here; adding or moving a surface requires a described component/ownership change. |
| assets/css/site/learning.css | shared-selector | 74 | Registered shared surface owner: learning.css. Selectors remain centralized here; adding or moving a surface requires a described component/ownership change. |
| assets/css/site/navigation.css | shared-selector | 47 | Registered shared surface owner: navigation.css. Selectors remain centralized here; adding or moving a surface requires a described component/ownership change. |
| assets/css/site/print.css | shared-selector | 6 | Registered shared surface owner: print.css. Selectors remain centralized here; adding or moving a surface requires a described component/ownership change. |
| assets/css/site/responsive.css | shared-selector | 9 | Registered shared surface owner: responsive.css. Selectors remain centralized here; adding or moving a surface requires a described component/ownership change. |
| assets/css/site/review.css | shared-selector | 82 | U04 review field migration removes review-select and review-input/review-textarea surface ownership. All 26 consumers across Review, Memory, Word Builder, Word Search and Year 4 use study-input; retained review classes own width/resize only. Other review surfaces remain registered debt. See docs/analysis/review-fields-unification.md. |
| assets/css/site/verbs.css | shared-selector | 48 | Registered shared surface owner: verbs.css. Selectors remain centralized here; adding or moving a surface requires a described component/ownership change. |
| assets/data/colors.json | style-payload | 12 | Existing content swatch CSS in colors.json, retained under U10. New or changed non-empty CSS payloads require explicit documentation until structured swatches replace these strings. |
| assets/data/shopping_clothes.json | style-payload | 6 | Existing content swatch CSS in shopping_clothes.json, retained under U10. New or changed non-empty CSS payloads require explicit documentation until structured swatches replace these strings. |
| assets/data/vocabulary_review_catalog.json | style-payload | 12 | Existing content swatch CSS in vocabulary_review_catalog.json, retained under U10. New or changed non-empty CSS payloads require explicit documentation until structured swatches replace these strings. |
| assets/data/year4_revision_vocabulary.json | style-payload | 12 | Existing content swatch CSS in year4_revision_vocabulary.json, retained under U10. New or changed non-empty CSS payloads require explicit documentation until structured swatches replace these strings. |
| assets/css/site.css | stylesheet-import | 13 | Existing stylesheet dependency in site.css. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered. |
| assets/css/theme.css | stylesheet-import | 2 | Existing stylesheet dependency in theme.css. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered. |
| conversation_help.html | stylesheet-import | 1 | Existing stylesheet dependency in conversation_help.html. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered. |
| getting_to_know.html | stylesheet-import | 1 | Existing stylesheet dependency in getting_to_know.html. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered. |
| greetings.html | stylesheet-import | 1 | Existing stylesheet dependency in greetings.html. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered. |
| memory_game.html | stylesheet-import | 2 | Existing stylesheet dependency in memory_game.html. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered. |
| numbers_calendar_time.html | stylesheet-import | 1 | Existing stylesheet dependency in numbers_calendar_time.html. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered. |
| polite_phrases.html | stylesheet-import | 1 | Existing stylesheet dependency in polite_phrases.html. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered. |
| word_builder_game.html | stylesheet-import | 2 | Existing stylesheet dependency in word_builder_game.html. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered. |
| word_search.html | stylesheet-import | 2 | Existing stylesheet dependency in word_search.html. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered. |
| year4_exam.html | stylesheet-import | 1 | Existing stylesheet dependency in year4_exam.html. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered. |

## imperative_verbs.html (legacy-control)

Unmigrated native controls in imperative_verbs.html, retained for U04/U07/U08 behavior compatibility. Their exact markup is frozen until a documented migration removes these entries.

| Registered element | Count | Signature |
| --- | ---: | --- |
| input verb-form-input | 1 | `93176edd5752ef1587bb3a6e2650a34f974966aef456c96fc7bd8f95e1830f94` |

## mistakes.html (legacy-control)

Unmigrated native controls in mistakes.html, retained for U04/U07/U08 behavior compatibility. Their exact markup is frozen until a documented migration removes these entries.

| Registered element | Count | Signature |
| --- | ---: | --- |
| select All categories | 1 | `4398cb7c1821f424aea849f5dc6e8746001fa5685da755b608fcd5fe51206c11` |

## review_cards.html (legacy-control)

Unmigrated native controls in review_cards.html, retained for U04/U07/U08 behavior compatibility. Their exact markup is frozen until a documented migration removes these entries.

| Registered element | Count | Signature |
| --- | ---: | --- |
| input review-answer-show-example | 1 | `5168504f58560f8df4d771fded086854622682de5175680c3c2ff170104e4ad0` |
| input review-verb-show-lemma | 1 | `6d49c54086a3aee07ba62745a003f19acaad789fe62c325804b599f37f168c53` |
| input review-due-only | 1 | `94d19325f21035e7d63f542b5be79e7781fe697e999ae943cab57dea0d77c67f` |
| input review-backup-file | 1 | `9e80c5841a2fb243f2012727cbc4797d9c3cf96f8f31fa280825fa5e628e1b52` |
| input review-answer-show-visual | 1 | `e0c184105a746fdb8b855d7add1585f538b6248827e51dec270fac464454edc4` |

## verbs_guide.html (legacy-control)

Unmigrated native controls in verbs_guide.html, retained for U04/U07/U08 behavior compatibility. Their exact markup is frozen until a documented migration removes these entries.

| Registered element | Count | Signature |
| --- | ---: | --- |
| input verb-form-input | 1 | `93176edd5752ef1587bb3a6e2650a34f974966aef456c96fc7bd8f95e1830f94` |

## assets/css/numbers-expansion.css (legacy-css)

Exact existing number-diagram, separator and responsive table exceptions; U11 remains under review. This does not authorize a new local control surface.

| Registered element | Count | Signature |
| --- | ---: | --- |
| @media (max-width: 600px) / .numbers-session-summary th | 1 | `277ba742f34cce85a5fe9ab2e718317361a4041f7c07eb8d8118d7cc62e0ee21` |
| .numbers-reference-subgroup | 1 | `36e71375460f604d32bf93cced3cda36b3aefd22d4a36cb554280505faaefc7d` |
| @media (max-width: 600px) / .numbers-forms-table th, .numbers-forms-table td | 1 | `495af118233e33d1cc4aa1f40c9d703df781791e334caadcf6b62670aa37788f` |
| .numbers-fraction-parts > span | 1 | `4fbf71d71c1c2e0c0fea7be6e6fa2c9ce8e1dafc948487003ae3b2457e876732` |
| .numbers-explorer-result > p:first-child | 1 | `50a8aea9d3a2ebd2e46973b31c4a5aadf4560147d65a120cec133e58bf8ebf08` |
| .numbers-builder-answer | 1 | `59bde66ad972ac0acd2c735622dadc3f890d8950049de2a04ff412115cc4247b` |
| @media (max-width: 600px) / .numbers-session-summary th, .numbers-session-summary td | 1 | `637a6ba731b335700aec32c997d210a6767ed8614fba5171a7d5c730f4bb1190` |
| .numbers-builder-group-label | 1 | `7f4f448d32cbbc9d8ba8240f6a9a200f32bda6ebf112506813a285ffa5650ab9` |
| .numbers-fraction-parts | 1 | `80ede83698de94b8834b61c595507bd81c507b537604a787d59ef24814d03025` |
| @media (max-width: 600px) / .numbers-builder-group + .numbers-builder-group | 1 | `820d277634514eecb9a783175e68cf36e3168113064567464d56234e2c144e7f` |
| .numbers-builder-group + .numbers-builder-group | 1 | `b47b542bd7cc2ed16d657883f0ceca91f16216bca1c0b392d9399d06bbfb6bb1` |
| .numbers-breakdown | 1 | `bc177b810eb68b33cbf0681f4ec2d8980b64ef0c86609b599780d4aaaf2edca2` |
| .numbers-forms-table caption | 1 | `d871f341c014d84f535f249129ba545ce10a009d7878566d3c5b91e534cef39d` |
| .numbers-fraction-parts > .is-filled | 1 | `dd202ff944be8fac8e2c2f1faaca7870996044ef9655f810d20384d31baddd70` |
| .numbers-nav-heading | 1 | `f617528f24e0dab721c4362b3b5f8163e3ec976ce1773cef48ec5bbb253c9d01` |

## assets/css/pages.css (legacy-css)

Frozen remaining legacy surfaces and raw spacing in pages.css; see the UI audit backlog. Only these exact declarations/conditions are retained, not a whole-file exemption.

| Registered element | Count | Signature |
| --- | ---: | --- |
| .swatch-ending | 1 | `01c1fdd269666f5487ce429be7b3ae38077edbcb7608d657983a6cb51dd8f19a` |
| @media (max-width: 720px) / .home-toggle-row > [data-mobile-label] | 1 | `068144a61571649f93f6ff7cd5daf3acbd5818ae9db93c4fd7e54937d97de23c` |
| .year4-card.hide-english:hover .english, .year4-card.hide-english.is-translation-revealed .english, .year4-card.hide-english:hover .example-translation, .year4-card.hide-english.is-translation-revealed .example-translation | 1 | `0b5ac565ac90234eea9900fce128ed8d052d15a2856691070d5160ab0cbfb527` |
| .verb-visual .rootline | 1 | `0cf13850b79dd8afee72f4a3cd487d5f9c7110b630324af21e36964f742c6bcd` |
| .year4-card.hide-english .english, .year4-card.hide-english .example-translation | 1 | `0e8e045ccc21437873a76bd55396dd626e48bc0b0218369ec6f93720c17a9daa` |
| .visual-row | 1 | `0ef1b3880bee4531f6546e59b2b1f5c05935b206f3536002af7d83c33c77c7f5` |
| .num-root | 1 | `0f6c8eee0c7822cc9180c0d399216647f29f60970ae0ceb66a9e35894288d42f` |
| .about-me-timer-checklist | 1 | `111dff1cb6d763facbec459db0017ab49a8d005b691d87367af6cc5894b8b9af` |
| .about-me-personal-practice | 1 | `12e1a9c49fe86a22d836b70fd7ff181be7a19e6e6ff156c052db5cdce1ccbcf5` |
| .transport-figure-card small | 1 | `13662fae21c2f8d1844bd3087b387daed7d088ea2302cad7fc3848914bfd387c` |
| .attached-pattern-panel | 1 | `1705631455f2c448dd608173a7e92009df11f0978f3241df97054770c83fdbec` |
| .year4-example | 1 | `1709bfabb0faa30355f1eed59d23073c7c495ddcd4faec95e1a18f8932e9b3fb` |
| .about-me-tool | 1 | `199552f8f6b3f78ec771f9771c238f8cec2cf00818343258148959a3511eff30` |
| .route-list | 1 | `1c65621d306ed930ded926986087891d5e127872480a7047aa151edecfb22113` |
| .year4-card | 1 | `24c6a2594c8091e10c270125932ac04512b6ebfc8d36e013a553fb493933e102` |
| .number-line | 1 | `2772d02c40f22c88b78679f802bb55f826292fb5f00beeb31d35f4b10b18980d` |
| .visual-row:first-child | 1 | `27d11e0e15e020d508c393c347051ce50216ce6177f0e659c93ef0097d4d6a05` |
| .number-line strong | 1 | `29b4884af17f99283c3b23201427bae9695df08056f98a118d78b03f0c7cefb2` |
| .study-card ul | 1 | `2a44c43115d19aac0152792ff7882af0651c4195f8c4fc7df31a5624f8c2fcab` |
| .about-me-story-english | 1 | `2fb3b3e804ab11b56995a3106c5592ca91aac16c69c5a794230ad3641ce25fc5` |
| .about-me-coverage-row > div:first-child span | 1 | `362646b63564a77f045152bdb944de3bbb3cbb08ebb411e92a78e9f96992d123` |
| .about-me-coverage | 1 | `36e100083ccc44245484b705d4f9cf13e6fd70584f911e52f7e3b4a58561990c` |
| @media (max-width: 720px) / .about-me-timer-display | 1 | `3a9de4479fb0e4155e5ee5b9e8952d8218d0b8e765093b5172c7052b3ecea7a1` |
| .num-word | 1 | `3eceea2ee4c0e20e1a6134925d0f21d36652bf2c4906e8d4fe15c115b2282eec` |
| @media (max-width: 720px) / .about-me-preview | 1 | `405c86250682790c856e31faf7e58319d979c29fc8f9633f6ced0cd84c41ba4d` |
| .about-me-coverage-row | 1 | `41f219b02540bcbebe4244ec6730946b208603b629aa81d624a9fa26ad012d8b` |
| .swatch-stem | 1 | `42e2e3da9ff00dbe9bc60bfc2974553a81ec9ee5bda0dd706836bbea7f1a378c` |
| .about-me-details | 1 | `44251082355b71f29a082f2164ed18d9cdeadaa6e84163258b10796d255a999d` |
| .story-line:first-child | 1 | `4535e333cd5ded187f6065c181adf365bf896f0d0b96a4a4ed0690ea4688d8ac` |
| .about-me-progress-track | 1 | `4ae346ad3534f51a86f57662b76099693087253f07bc73ffacc264344bb46cb9` |
| .story-line | 1 | `4eaee4997870d0a51716d537b002bfee5c4ebfdc2d9462fa706a9aacec7001c2` |
| @media (max-width: 720px) / .home-toggle-row > [data-mobile-label]::after | 1 | `548891cb7f0bc22b2314d507a4fbcafca1731022d43faf00ac11e302bf5e67bf` |
| .about-me-output | 1 | `5ade6ddedb8c2294c7ff93c383043ca948f7131534afadd960a4595672720562` |
| @media (max-width: 720px) / .home-toggle-row > .home-toggle, .home-toggle-row > .action-button, .home-toggle-row > .action-link | 1 | `7380d16c4d79c059f50d7174682ae042d6366ec2da76c27eb43ea9818e468e1d` |
| .about-me-child-fields legend | 1 | `75cd710b8d7e9b7170ac590b80d9a953d82dd1107d441290cfed20e765f8cfd0` |
| .change-part | 1 | `797d4b676ae8e6a69720a7667f8fd059d39224e6d010edd148e7888b078420e0` |
| .root-part | 1 | `7bbfb2cad731ed8117c3a4209a09ed862ebf769ea90151bb25bc5a31e24d97f6` |
| .ending-part | 1 | `7c04dea215611eb9f77ffd90712380f287e30f501af065d3e0c7ea798ddb4418` |
| .about-me-details legend | 1 | `91d0f649c807d883528b03f831a1b9136a0ff06a561494c5d6c083072202d8b9` |
| .verb-trigger | 1 | `920927990892c0030cb839cdd95c2c895af2ee3b8fb07b5b14d6304965ff007e` |
| @media (max-width: 720px) / .attached-pattern-table td | 1 | `9534f2cc22529ac4c049f3cb4098c10b7e0fa9f5f4fd5c719734606dc1267168` |
| .about-me-guided, .about-me-practice | 1 | `957bce459d8def76904dedb4b94e3891b764db382da17274b088dc3eed8c36ea` |
| .swatch-change | 1 | `9afa6211e3020b505077cc10704c4bf88ef8284c6f6d2022660ee2a6850c521a` |
| .example-dialogue-stack.grid-2 | 1 | `9c26d9799c6de642bce5be60c6e0b11382b1c9cf74d752469aef7c1a5be0f28e` |
| .about-me-preview | 1 | `9e0e0ce4d0d965c551df1656b8f942d266572475780bc6bdb417c6690e92ae13` |
| .year4-card code | 1 | `a0b4ee61642620aaa4c0285c694630a28ac4c58addccfefa21f9b7a286ef65fe` |
| @media (max-width: 720px) / .open-group-grid | 1 | `a5eea9d14cd1f5819bed3d8ce182916f17a0df77ec5fd618435a5638c96e58dd` |
| .verb-trigger:hover, .verb-trigger:focus-visible | 1 | `a7757fa0c615737e882b21b85173289ac1ef05d25b30ca2c2231694c7764e832` |
| .demo-form label | 1 | `b065674abf874b6859f41308862c7bb11a696ed6e8b657afda9eee50a46679fd` |
| .route-list li + li, .study-card li + li | 1 | `b3d198395448bc54e264cdbb55727e937cbef2af0226b5238f220dcd71da09ad` |
| @media (max-width: 720px) / .attached-pattern-table td::before | 1 | `b3fa1987e3bb36a416f5a4b049254e525bf01e90aedaaf8aa8dbed6d9c757cde` |
| .year4-tab[aria-selected="true"] | 1 | `befbbfc41dee826599b51e0b4f74ad5ddcbff686c057c71b5ab6a0690f279ded` |
| .about-me-timer-display | 1 | `bf35f21644984316c952900ecf34f469938d5eb3bbd1d43e6d2aca385383a8f0` |
| .stem-part | 1 | `bfb75845cde15820cba361ebf809f98c7cf4077864b04ce4c56972670ce39e22` |
| .story-line .mt | 1 | `c36192ddba868e5aa396fa463b2be43f6241d0e792ad89ac1c25a61da3025e67` |
| .year4-tab | 1 | `cf90ba02045ccde4cbb37996ea2f73c4be97832d73fdc3ba62b3559b257721de` |
| @media (max-width: 720px) / .attached-pattern-table tr:not(:last-child) | 1 | `d8c7baebcf59612a6c91639e1b5def0031a4dd8594dec7fdd21f61dabbbbaaab` |
| .year4-card .english | 1 | `e1ba70fb89b9551395b41714e5b6e3d4f6413f6ec6a489d73c0e0f8a15e87cc0` |
| .demo-form input | 1 | `e285061c235923ec10001247d148add55a92164ed1aafae6a697355cc7edbcd5` |
| .year4-collection-tab | 1 | `ebfa88ccc9b2d712fdd54df9fff9b053bfab01e626cb1204cc3e42c977e4fb67` |
| .story-line .en | 1 | `ef83e85e4e671366b63f1cb8da4efa87e0fcd2e7d683eb3b7567c3350c73347f` |
| .transport-figure-card img | 1 | `f22b18f12453db8e7fac5823b15f89c486f1069ecced34e5d8a2e0ccf7742780` |
| .home-toggle-row | 1 | `f5b15f495810afd1918c275f93712ab0a631a5b78c26e928a532ee0969059a3f` |
| .compact-list | 1 | `f7662fa556b7fbb93abc65dd87f1b82b5c82eea03d1bcf183999542e1bed39b1` |
| .attached-pattern-table | 1 | `fa623d9b5fcf531dfd178f9696cb506391fd1e635316d8659063ab3a2a078f3a` |
| .about-me-practice-label | 1 | `fa70449917996c2952b00d2a67f4ec77edde7d85c57129e6501572a7e3268ffa` |
| .color-swatch | 1 | `fb4fa33309935014c88ba2dadb4b66cca0ef990e122f75be96c995a273c254fc` |
| .pron-part | 1 | `fbd99747029e6e473015d2beaf0c639ab24d34272e41d06342dc4b164f271188` |
| .about-me-child-fields | 1 | `fbf9ae8c8d100c0d92f6f753bf82c55894c22e753df8f8732b102db9f16e8dea` |
| .about-me-progress-track span | 1 | `fc48bb4c1511461b1132e556d64254fd7b6a09af50285d0550efe68d9d801384` |

## assets/css/vocabulary-games.css (legacy-css)

Frozen remaining legacy surfaces and raw spacing in vocabulary-games.css; see the UI audit backlog. Only these exact declarations/conditions are retained, not a whole-file exemption.

| Registered element | Count | Signature |
| --- | ---: | --- |
| .builder-answer-tile, .builder-letter-tile | 1 | `016fffad605321ac4f4997603c2880156a6e0df317945b8cc3c6f3247e920ed1` |
| .builder-answer-tile.is-landing | 1 | `0dc46a7a494a7666318c2670d4ff59928cfaf8aeecb0e83af9bed6d48eb641bb` |
| .matched-pair-list span | 1 | `11ee21b236cfe03039f6d5e0648802218c4446a47ee32510957fbc76666d16f7` |
| .matched-pair-list li | 1 | `19d2e8300c007e624990911ff692f725d3790e7505a4479d9f4225756eb3c695` |
| .round-list li | 1 | `277f372d5e083b636f6a87567e0f8064b611c83baec35f770295180d1d12bfa0` |
| .matched-pair-list strong | 1 | `2dc827ae39680731d1cfff6ee53edfb2398935360a806772dafa50f4d58275b8` |
| .memory-card.is-flipped | 1 | `483fca05edb461c751b9626663066d454d114b4e400f15eb17f57fc1a9570449` |
| .memory-card.is-matched | 1 | `52a401573887119a0965ee7a27ff88db26549b19f3590e7a424c29df5bfea532` |
| .memory-card-kind | 1 | `53a9394bbfb74672cd15ea80492e61f630332874859fa85c1960103bfde9d9ee` |
| .matched-pair-list li.is-empty | 1 | `61e29d3c8b8e84607da7872a67209fee5f8a5ea8f0461e7746a905f6ff39c229` |
| .memory-card:not(.is-flipped):not(.is-matched)::before | 1 | `631c0ff594a43141cc273618c1a36420983374671d42a8a8d05578d2582f0625` |
| .memory-card:not(.is-flipped):not(.is-matched) | 1 | `7db71a4f8b4ae6e1ab065d56c197408b3fef506043d9c22f2d9c7d547b8097f5` |
| .builder-flying-tile | 1 | `8372c1dc6152bd6ce158aef57694a110cf4a782366ca8ec858cd7d4eb12f8089` |
| .memory-card | 1 | `8acf96f8d6310d008f37643bbad38529a8e48048e47d91eb28e390069ecbe85b` |
| .memory-card-maltese | 1 | `8f5a0cd101883427981b351de32a87a4c5585d4d16dd90ed90c659c4af7426fb` |
| .builder-translation | 1 | `9fe4cdf1d5bdb4e9599f1bd534744c28a67d3449bb53683c45001b29d757e0f9` |
| .builder-answer-tile.is-filled | 1 | `af237fdbbeb1a8e3900a92ce3f561b9e5a252fcdb2697e4d45c55faf19980e44` |
| .memory-card:hover | 1 | `af54dd5b9f656c37f2d354d2414c4a7b7080f6a5bcad441ae457e2973e3c3bb0` |
| .round-list li.is-done | 1 | `b8eec179e65ebcaf6d15c7e1265018c7616d76cfe18c0f2d52503c2d7f150c43` |
| .builder-letter-tile:disabled | 1 | `c40a7f365931be141cd2cda5b17e4c3962a4be3bf5d873840bbff303b2a8c7ee` |
| .builder-prompt-label | 1 | `d00f316b00ac31eb40908fd2b325b8f25b9d30d5bca63802826ad1a002d6184d` |
| .builder-prompt | 1 | `e0a51e7a221618f2dc1425ab3f286b0d47c3a9a1383d705de480513afa7054d0` |
| .memory-card-english | 1 | `ee05f6f499f19838ddb277def6349662a64b874e098392a93ee9c281f8ad40f5` |
| .builder-answer-tile | 1 | `f25557eb54ecc63e77309daa37426b5170ac5b6e08d8468725beb239a30c1cef` |

## assets/css/word-search.css (legacy-css)

Frozen remaining legacy surfaces and raw spacing in word-search.css; see the UI audit backlog. Only these exact declarations/conditions are retained, not a whole-file exemption.

| Registered element | Count | Signature |
| --- | ---: | --- |
| .word-search-cell.overlap-color-2 | 1 | `013428a0dc34088b1f4dd1cc27c71166aa98e8f1df07d9adc16f4ca7e08969d9` |
| .word-search-cell.overlap-color-8 | 1 | `06ad9493ab8196daab828c739c0944ae105fe6dd554ee16f0aa36c03d6d05319` |
| @media print / .word-search-print-header div | 1 | `100a2ea9e68c0754f16a7bb0e254f9897240199d8ade06d4ea529c8debcf0dfa` |
| .word-search-cell.found-color-3, .word-search-list li.found-color-3 | 1 | `166bb9075aa1e69fef9e1e123d19ebb9ad559d64b0a2cd9e0941db6674d0a72c` |
| @media print / .word-search-board-wrap | 1 | `17775fad0bc5464e7c751a820cd180ccc7f042667b15677fe5b6b9e470b29c22` |
| .word-search-board | 1 | `17ce46d3c8b7eddc6e4dc6054e789230ad2f643c76c2b806f95736011603ea7c` |
| .word-search-board-wrap | 1 | `18595f40733a4e1a0a9b90f144597661fe3940c922b12c5f0aaf4af9687bb964` |
| .word-search-cell.is-selecting::before | 1 | `192d226a1cd1862df6952681c8782638293c774ebe92ea39798c862011b63e04` |
| .word-search-cell.overlap-color-3 | 1 | `194e32fe1bd0a443ac0bef59cdfbd298c6f4676c135f094e38746d3824bba221` |
| .word-search-completion-grid strong | 1 | `19e5b2a51babdbb7c049aaf10e6dc65fef575928fb1a0d9185fb8ef0456d4582` |
| .word-search-cell.overlap-color-9 | 1 | `1cbb6d61e2f479020a35a6f6d43dc7faf60303ed9ae2bce8bbfd3267244c3d07` |
| @media print / .word-search-print-header span | 1 | `1cdbbb0a9227c9623ad51ed73f6c50ed606cd03bc9992454f32ff4ba47364d9e` |
| @keyframes word-search-refresh / 100% | 1 | `1e93d297c40ca8ccdc494a3d2095bd1b76f69612912e9f64746e1ac0884bc09a` |
| .word-search-list li.is-hint | 1 | `21c1cbfb1e924924b73235aada9f17ca4798e5b3917e0e184c86928e28b3cc94` |
| .word-search-cell.is-selecting | 1 | `25f9166fd1523ef588056043571b61ed51533b08f057bcae56b624965deefc12` |
| .word-search-cell.overlap-color-7 | 1 | `26460f9d7f324edf9fba71b8171ed818177a1f24682d7798b6d40ff76ec2d61b` |
| .word-search-cell.found-color-6, .word-search-list li.found-color-6 | 1 | `270eca871543316006a5b5a9ebfbd094d6db2b0baf7b108890f81a7a6603bbb1` |
| @media (max-width: 480px) / .word-search-board-wrap | 1 | `278dec0bb7c3496a1cd2525af95fd1050c63f6b53638cbfec84accd51e21bbf5` |
| .word-search-cell.is-overlap | 1 | `282ff0b2451c6a773b955952ac8ef0ba167fdf4107ca1579ce0c18aa4c1c4184` |
| .word-search-cell.found-color-5, .word-search-list li.found-color-5 | 1 | `28cb21449435b6b24b886aabd64c606f3874d12b0d8312954dbb8beab33c9e5f` |
| @media print / .word-search-game-card | 1 | `2cc24c4cd987864cfac8c905548e7ee89030f51d4969c037a10987a561dc1c4a` |
| @media print / .word-search-topline | 1 | `31c9f9e328bd4e6e60ccefb8cc327b6d0df95c733e81fdbcc1e6140af311c5af` |
| @media print / .word-search-topline h2 | 1 | `32447d24d82a2d31b5ebfe11b704e09e48d60374c001eff34a0c540f03d47762` |
| .word-search-cell.overlap-color-11 | 1 | `34e884ff82283a2acbce6c6ec05ad379b27159c94c1740bfbbe144b07890c337` |
| .word-search-print | 1 | `35dccdf42bdd0f4b9b9d211ed786f3d5958801a310e3065c94a68a5209e03277` |
| .word-search-list li | 1 | `37e086fdaa6d38be216880890a5472ae53dc0cec4838330e0ada977b904e7b13` |
| @media print / .content, .content-card, .word-search-game-card, .word-search-list-card | 1 | `398dc82934eeac399a33fa74d71f77048a3c96177ca0da79c398b108075296de` |
| .word-search-completion | 1 | `3bc3954b13a2ac259bf6860a4574d325d6b7f982afd0f9188810af5e634887ee` |
| .word-search-selection-preview | 1 | `3c00e88cc0596a798c10319a5e29f116fa5118d6fd2ed30c085d98332a7f00c4` |
| @media print / .word-search-board | 1 | `3d07d3ae0f30b84118f107b105079be63392fceb004aebd91cf2bd37bb6a7f01` |
| @media print / .word-search-list li | 1 | `3d164d61376a13dd7b43f33e1c2f76cbb8dbd5784ab514dff572fb9febbe8f6e` |
| .word-search-progress-track | 1 | `456eac237f5453e5b93040cb517e1a3f935c7a2f751a0bd66822785dc2a1915d` |
| .word-search-cell.found-color-2, .word-search-list li.found-color-2 | 1 | `4aeaaef4e0931c09f1a0de29b1e118a340a8db577b176a2498e3e9d730670195` |
| .word-search-cell.found-color-12, .word-search-list li.found-color-12 | 1 | `4ce0c1e4c5262aba1021af6044779792d98ae0ee1476fff87a8c2777e9971f9b` |
| @media print / .word-search-list-card | 1 | `509580100fdc9aa90a60075d03892a8293ead65aaea076ba7712970a9c2d7ab6` |
| @keyframes word-search-success-pulse / 45% | 1 | `50ec63418bb6707fd734c553bc164ab8f93216052a31493a7c602a7eea11aad6` |
| .word-search-list-card.hide-maltese .word-search-word::after | 1 | `511f78734f6600ccefe6fb79aeb5fcd06b0e27002e75ee143f9413471c59d778` |
| @media print / .word-search-word, .word-search-translation, .word-search-list-card.hide-maltese .word-search-word, .word-search-list-card.hide-all .word-search-word, .word-search-list-card.hide-all .word-search-translation | 1 | `5128c8c6cd44e62ff11c3ca53377ff3887fb9cb312fd36da1f51172b07b1fd2b` |
| @media print / body | 1 | `5693c61034f796eccb341e682ed55f5f44f900cf3161b3a11e5c2f9c33ae8ec0` |
| .word-search-cell:hover | 1 | `5ffc96c4035fc810a047515f88ba824c1884768af05161287f63523e959e13af` |
| @keyframes word-search-hint-pulse / 0%, 100% | 1 | `63467014ff51e0ef0bcb2eb67a853ef672b061867da318d9ac31f4c096d85e53` |
| @keyframes word-search-hint-pulse / 50% | 1 | `647cc5f8f777fe03740facbd14f066b5a0a352ec769fd3f6c3be2a81c0664a3a` |
| @media print / .word-search-print-header | 1 | `6cfc2831564fced6110220687e796097975765ed92f0f80bb95d3f20e0db0cef` |
| .word-search-progress-fill | 1 | `730ee5e4bf79dd1ec3902dbcaf8a8c417a5b24033361fda52cf48d51a0f2d335` |
| .word-search-cell.overlap-color-5 | 1 | `739c7d0bc7fd0d07f78e72259bc135a1c8723fd86ab5dfd54c1912671d70a172` |
| @media print / .word-search-translation | 1 | `75dd0d89e982f40c0b8c993022fb9e06a47431a6f720ccbdd84cad19d1f985cb` |
| @media print / .word-search-print-header h1 | 1 | `76487160f2dab3f83fe0cc667cc5fe6e5a0a53eef919eeab6fd52b5ec16dd041` |
| .word-search-cell | 1 | `7fe6bedc133a4f99ae50baffea9034f7dba49a07a899c625e14ade3b6321253d` |
| @media print / .word-search-cell, .word-search-list li | 1 | `83e5a95be928a727e8dcb969593db223c1753c7e038246b8512f12510182df92` |
| .word-search-cell.is-hint | 1 | `88b59459af149308143475d687a1671af606e9ff5e63f5cbcde240a2238d2778` |
| .word-search-cell.found-color-11, .word-search-list li.found-color-11 | 1 | `8937acd6ff8b3b49905d1ae106e83ae7bbf28f108d02891b1d076a687147248f` |
| .word-search-cell.found-color-4, .word-search-list li.found-color-4 | 1 | `8d297e98cdf443fac5e6920feadec8e5d7e14dc1e069e7db931f5c4b88f523cc` |
| .word-search-cell.overlap-color-4 | 1 | `9a568f98a0699450f3bf7d1b3cc429c44d1a4aa564bb54a2ff2ec6da0742f716` |
| .word-search-cell.found-color-8, .word-search-list li.found-color-8 | 1 | `9b7d81e080b5e7e28eeeb1b7793bcf335dd2fd587eed6216eb7334a52dc008a9` |
| .word-search-cell.found-color-1, .word-search-list li.found-color-1 | 1 | `9bf22b2165f6ee7c26cadeb7564af6d65cc7a0ac6597c115ef7e9ab86787c158` |
| @keyframes word-search-refresh / 0% | 1 | `9f3a8fe7b2e5d791b8d4492143c09d68b1115128cb1b39a45cabde58d62be4b1` |
| .word-search-timer-panel | 1 | `a049a169faf390b9c337f77c1b1c6d9c66297ca3927f98619cf2a483a0abe7df` |
| .word-search-cell.found-color-7, .word-search-list li.found-color-7 | 1 | `a1a5df67da6bc7a596ced93c2d78384d80eefacb8da90d29aed9dba9b17d68b9` |
| .word-search-list li.is-found .word-search-word | 1 | `b0d22771c6c4826ae35c7154a4b2337809a090c36edcd039f6af86393d7db89d` |
| .word-search-cell.found-color-10, .word-search-list li.found-color-10 | 1 | `b50c7a9b3b2d2ed696ea1bd3d6e89359f2dd93aff347c32c4506c2f4f947855b` |
| @media print / .word-search-print-header strong | 1 | `b5ef59ffb9a4effa68ae938e638ec0c2ae3f7b2b7b63a8331c10165f051a7cb6` |
| .word-search-hint-button | 1 | `b6ba5883953d9e67adfbf8895f328af67532f5f4653021d448a669c6bae081bf` |
| .word-search-cell.is-found | 1 | `bd4272f09aa262f8a120e13802d88b23c0e3828485ba6b686c72befa968a414b` |
| .word-search-cell.overlap-color-1 | 1 | `c435b3d40e8dacd81030fb1d4097641d16db4020ff9c18bf39d5a5e371e192ae` |
| @keyframes word-search-completion-in / 100% | 1 | `c65b149e0e386bb88a44fc207753132ca70299947f004e9f1d0f72a8619a006e` |
| .word-search-list li.is-found | 1 | `cb28cd8fdaa0f15b25830c844a1b95a7b8298124cbaf546d110b4c7bd42e5372` |
| .word-search-cell.overlap-color-6 | 1 | `cbba25f2298ee467c69d6de9c3d141e211e71c4430e083f181b00bc9c8b0a20d` |
| .word-search-completion-grid div | 1 | `d139ce80a9a5f7316543485c103790406cf1915e24ce0f830cc9b26a16675a00` |
| .word-search-selection-preview.is-active | 1 | `d684e400b116882e5e047efa46116dd6d9c37f5b07849a0f3bc63ff2e17ba6ba` |
| .word-search-cell[data-overlap-count="3"], .word-search-cell[data-overlap-count="4"], .word-search-cell[data-overlap-count="5"] | 1 | `d6d31aaee713ded460032c7ed255563f4b90d9d6d7d2cd1a96188929c7be6fde` |
| @media print / .word-search-list-card h2 | 1 | `d7029022094ad5cb0805dba136833507a15d6d55b03a8c548b0c37021fe43090` |
| .word-search-cell.overlap-color-12 | 1 | `d848c9b48a299d34cd974c4cd6d316366d68ec79d933f7ed76766c29553429c5` |
| @media print / .word-search-list | 1 | `d956058083ec68a9ea179e6dfda1221c0276704be9fee3b135560bf7b4b979e5` |
| @media print / .content-card | 1 | `d99b79b928e2b143741af9f7e291fddcb86718e02cc0d996fac5751f3228cdc6` |
| .word-search-completion-grid span | 1 | `dc4f560192ab98cf46ac092eb9b616cd0064fc2264008703984c2f3b0f4a676c` |
| .word-search-word | 1 | `dc8999c1572d67e3bad842b5948b6b0e2d76d852b9a19e999d327da311284f08` |
| .word-search-timer-panel small | 1 | `e042917f899a1952b77ec09c6128457acc79bfe3882cd2cbcb98ee91e87dc8f9` |
| .word-search-cell.is-found[class*="found-color-"] | 1 | `e80d08d890467124700610c7824b24d7564dea9598fbaecee2c468211d724cdd` |
| .word-search-list-card.hide-maltese .word-search-word | 1 | `e861b36beb23799f28c98279670071b5f7cf00ac27f6858fbff1c26a5c3548aa` |
| .word-search-list-card.hide-maltese .word-search-list li.is-found .word-search-word::after | 1 | `ebfac3dfabd1fef50275186c6dc6706e23b181a654d17709ebac5dce3f2adea1` |
| @media print / body[data-word-search-print="answer-key"] .word-search-list li.is-print-answer | 1 | `ee34ed37539e41e7307d3ea10796d84be4d8038e1e8f689b20d029c76c6c4c54` |
| @keyframes word-search-completion-in / 0% | 1 | `f0c17744470b97ea31849b0d381e3da265000ed968a9f524fa5a556718e7229e` |
| .word-search-timer-panel span | 1 | `f323e9146f1f31bd1577fc6dadc943278fc655178affa9eb61d9cdfb90345801` |
| .word-search-cell.overlap-color-10 | 1 | `f32f7922cae8b051c59c4575aa6bc4b8fd51c3515ff74d0da8de91ed2696c42b` |
| @media print / .word-search-cell | 1 | `f4c449733570e2248899258ab783c0d8763bd80f13e7256bf364b7ca53201dbf` |
| .word-search-cell.selection-start::after, .word-search-cell.selection-end::after | 1 | `f632d81ba9429941f7b777d0a29d2a755345fa608969d9513c181d3bdca6abfa` |
| .word-search-translation | 1 | `f7734f662a0231c3f01b3bc3dc96c943e932111cc29d2d3cbb0670f945c6b612` |
| .word-search-cell.found-color-9, .word-search-list li.found-color-9 | 1 | `fa59449bd038841cef6e9cc410ecdd690b847af5b4dd5fc2f6ffb809a1ef425a` |
| @media print / body[data-word-search-print="answer-key"] .word-search-cell.is-print-answer | 1 | `faf5cdd8cbf4c84a901457870a45d6780a51229e55afb51c120577bd3590e956` |
| .word-search-reset-memory | 1 | `fcc32cd2a1a7fc13eab62c443d41c9652873622814d4285a9934662d810f5914` |

## assets/js/about-me.js (script-factory)

Existing DOM/class/style factory implementation in about-me.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| renderGuided | 1 | `05c26f0a522908b2686352b4814b2d9ca0f7af26c512d868bb5095654536008a` |
| renderCoverage | 1 | `27730ae3a46aa885c34e14d98a37528b946be3b6d16a7df91c3b8fff9bfba491` |
| anonymous factory | 1 | `2aa0e0a50b419f4056530d62f7741ae868449466e460f31685ab7181798134a5` |
| renderTimer | 1 | `2f057f612df02d23bfb5c11357aa295c9d2a915a0796a63c53bab668c885fd41` |
| anonymous factory | 1 | `32626584c9a98fa98a68a8852a53de2602e84024884ebfd8eddf269043df411e` |
| anonymous factory | 1 | `522507ca3b1656009675b4c3f367a1ffb9447155b24b92182a8e0f2275e9a5a0` |
| commitGuidedStep | 1 | `74b7894eec53f5f240f4175ca37f2f9bb9594e6b381a67b7e580d159d8b46178` |
| renderStory | 1 | `831115f139613a1105a4e72c0e889f31eeb971f091ead84ae0dd9e416b9370e0` |
| anonymous factory | 1 | `880581daaedd43e5c80b54c62511f4a09751684e33df4a7ce0fb3b104bc30884` |
| anonymous factory | 1 | `8d34b138571fb4f46aecbce2ee7b53f928049bba8b67bcd9724e292c6e9887db` |
| fillSelect | 1 | `ae6a47c89fabbf439b16b5adf1c21b174ebba25c996fd89676f486963352964d` |
| anonymous factory | 1 | `d0e1aad8406d1fcbe66801118db29f4c44a1a17c57e00041dab091132fe773d9` |
| anonymous factory | 1 | `d77d7efa5a721ede633abe3861e910524b93ccdc3f748f69643e2d305382afaa` |
| anonymous factory | 1 | `db587db42948f36d97a244f6193160fcfd011614ac9931e2969faf8a679d2fb7` |

## assets/js/animal-compact-toggle.js (script-factory)

Existing DOM/class/style factory implementation in animal-compact-toggle.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| applyCompactMode | 1 | `91177134928b0e5ff9d1c300ce70f81d29ecf6d4c8fc71df6c208e44abf350e6` |
| anonymous factory | 1 | `cbbf99373129ce054f227d4e47394129de243547dc78ae0a4b37e5fc61aa7836` |
| anonymous factory | 1 | `d6a52ce122cfadd2796aca0ec6f7acbc38cad5a191d6d52993085ff33311e449` |

## assets/js/course-chapter.js (script-factory)

Existing DOM/class/style factory implementation in course-chapter.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| anonymous factory | 1 | `13c3c70efdaa9d9764371656f4b08ec70ded70212e0d8306795ce390f6f8ed87` |
| createReviewButton | 1 | `2a4b7a5add2db773e1c1b13cd6eeecedfbee7f6e77d8999ae15d78ad4285bc1b` |
| anonymous factory | 1 | `3e78c2e7bf7eb6ee84e82fe0f5edef14d4b6626edce092617e1b497dcaaa8b5b` |
| anonymous factory | 1 | `79c5eb465b0a9c3d4e1f5a19d574c2942f8260389b5f80b14b4270d22db32a46` |
| renderMissing | 1 | `82fc60d3234806bbdc9a994d652a47701845bd0482de5e70ec989c5b0724d144` |
| renderNeighbours | 1 | `86754ae07a20c0129311d117a07acfafff8de4db8830f29379f85a896d239d7a` |
| anonymous factory | 1 | `a4ca83cb66aac41c3123cd9b5e4c8c05004e5d8053c9ef812450c1107ed32e0c` |
| exerciseContainer | 1 | `aa22c345aab4ec6dd94d73a7524fc11dbf81e137424ec2d79c892c116ff75039` |
| anonymous factory | 1 | `e36f0fcdbe37ef4d8920d0016dfdcf654b2eb940980fa2a4a512b9e97d18118e` |
| sync | 1 | `f1f335d838167558223cc283f76f497ff906265348c3ff7d243304db34c391bb` |

## assets/js/course-context.js (script-factory)

Existing DOM/class/style factory implementation in course-context.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| createActionLink | 1 | `8997fa37b6d38870d81d87d57a712eb1da48f2412f2bc07b27042b438a047ddc` |
| anonymous factory | 1 | `ad026256fbcca3a8ed9ff6076b5840d1447ff9849f9eb75ef0e9b156bdacc153` |
| anonymous factory | 1 | `bfb5efabf3175076b94af15093f5c98fbd39f053c0dcbbe44c77df78cfbd4b53` |
| createViewToggle | 1 | `dc3e57da298047bb6b775532314e1240b1154c86abf633d9572e011a87d3396b` |
| initialize | 1 | `dc659b47d0f1c9cd5123148bb1e6ae9215f872654f71ae52bb43ef1bd737e15a` |

## assets/js/course-exam.js (script-factory)

Existing DOM/class/style factory implementation in course-exam.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| anonymous factory | 1 | `cbfe1be980e5b822f2ec3a4e21e1b41e306bc9f282db136c7eb0a37c32e72e6d` |

## assets/js/course-path.js (script-factory)

Existing DOM/class/style factory implementation in course-path.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| createLevel | 1 | `3aff80f3bfc3a8058a23ac2019fd0df06a987c0bdef7fb81a6fbb79cb24859ee` |
| updateSummary | 1 | `6a41cd2c2e2f176868b36b8d0c1a69a0b19e60c11cf600801c96a05ba866f273` |
| anonymous factory | 1 | `737a8c163f13acd5be27e01d5fedd9a9339b7d48d2bad04e9e643e1f1239c043` |
| createLink | 1 | `8aca4e8f6ea92aa0c681ca23100e98507e8ff8535fdbcec812dcde52209a0183` |
| anonymous factory | 1 | `b0b2d3f9524d63b56a6f44c31ec470b5184c0d657b39e2d31a18520afc4ddcb7` |
| createObjective | 1 | `d3d416cf9654ac76d414759dea2529717e5651f36368ea5440ab5e8ea3a4162e` |
| createChapter | 1 | `fc94a54db7efe1495c98119a9ab175a76c1da0ff6c43ec6356453f0db282ca7a` |

## assets/js/course-progress.js (script-factory)

Existing DOM/class/style factory implementation in course-progress.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| anonymous factory | 1 | `43c3ff5a70216c14fb6d499751abce7ad5b53606a8dcd9b2b1996d2c6028b904` |
| createChapterRow | 1 | `706ed31b737e5a43ee6cc6fba139a68688e231e4b32c606e98957223eb9264bc` |
| anonymous factory | 1 | `855cda7ad56a48b4b5e416ebb66552da56de75686cad47091a47dcf0a8b744d7` |
| createCell | 1 | `d9e75a71e69491e429a9ec1b3988f0e6a09de1542d0534a65b6b5d6788dbf9f8` |
| selectLevel | 1 | `f3cc248c6aa0d93202d8f3b0a611881ec0843af67bd39cb4f16ba4837bc09565` |
| anonymous factory | 1 | `f8759d8f5e255a5e4a3dfc74d2534faba26b2df7e429df3296b4d853b6ea1991` |
| anonymous factory | 1 | `fe0980b703e50523f49b66c0b36e08259a935f750bff689f6b566dc0f4100190` |

## assets/js/course-topic-view.js (script-factory)

Existing DOM/class/style factory implementation in course-topic-view.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| ensureScopeStatus | 1 | `43b66175ec39b6ca94c672f3eca68e858ed8f17e73c6864578b8f093f19763ba` |
| applyView | 1 | `fb15d4671ec9d874109cd172365d099550dc8b03535357c05cbb88b36283881e` |

## assets/js/coverage-test.js (script-factory)

Existing DOM/class/style factory implementation in coverage-test.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| anonymous factory | 1 | `3217f36a460a199508bc7c3c679ff24478b1cdcf74d76c37b7cd8c6962aa0d48` |
| anonymous factory | 1 | `9647ed7409681a99d8ec168898e639cf911cd085554b8e658b2bc9900b6bf7e3` |
| updateProgressSummary | 1 | `cfcba3e295d71c8917cd6ebf32adb0e4049bbc9fc5592c042a1c7a9b94c3128d` |

## assets/js/exercise-runner.js (script-factory)

U04 field migration: renderFillBlank now uses study-field/study-input and renderMatching uses study-input. Only these factories and their containing closure change; grading, IDs and progress remain unchanged. See docs/analysis/exercise-fields-unification.md.

| Registered element | Count | Signature |
| --- | ---: | --- |
| createQuestionHeader | 1 | `1fc1088415a33a56fd577cc2936d82ad07a4f89d6274b1aab704e0aaff521e6d` |
| anonymous factory | 1 | `2b44cb732421c1f30150185f7c68e4cbb5e596d6f0e663eed6427934a627e01a` |
| renderSet | 1 | `330a96a35e97f84f52cdafbd2c7d3d9e1202c41ddd9e14e0596ba131f8c4c855` |
| renderState | 1 | `449fbb1e0f21b51370e18f06bb00eb440ef0986a092051d92460cfc6a96003ca` |
| answerFor | 1 | `564470f6fbe932272bb7c78098c0bab091a23db9e594a74a32c7c362ae3fdcd3` |
| renderOrderWords | 1 | `79d0c98562c2612e63ef4bb65d48f401a9d2c0314f869e9456afbf9dcd47d0f0` |
| anonymous factory | 1 | `7f296528e6c8bcd98289e30bdfbcf1a5974496184181b237b8f31ee447849749` |
| createButton | 1 | `840e0d192a103439f24ded69e81f5db260c6a7c5d4fcf54f1bbe89db5a4a8d1c` |
| renderFillBlank | 1 | `881e0a35076be6759e7a74a5905c3526b4edbc80c82006aa6d1a7206f5dfc5a0` |
| renderChoices | 1 | `ab8517240bd8a866e2889f83f5c738cb77841c580d36c87087bf0ab272570f73` |
| renderMatching | 1 | `d3db4577c8009f0f2ff5c806350495ec34d494f3695f177aca16d5e92203a06e` |
| anonymous factory | 1 | `d454fd955ddb6d8f0fe527fb597265d5fbf1e5864c0d4f30f82be242d1bdf2db` |
| anonymous factory | 1 | `e4a1a8e8066c6d70a0c6524fcc301074d10dcb38c220ead632302583874ba14d` |
| createItem | 1 | `f49019e6b0b4208493f4db3670f5009297c14ebdbe4f2c0c59cdf4a0eae01525` |

## assets/js/firebase-sync.js (script-factory)

Existing DOM/class/style factory implementation in firebase-sync.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| anonymous factory | 1 | `6fcf4cc68554d6ff31844d0c789d8df887d01e0264bbe8c6741e877b3e5e73c2` |
| anonymous factory | 1 | `7646628facc12270cfc187bf64dc6a252bb7f5fd32e2d83fd88c538b95d8ee4d` |
| createConflictDialog | 1 | `76b2f4ec14d0b29896adf50028eb0e3a28d771bca34105ff9feb617d958ba26e` |
| createElement | 1 | `a5ba780bafa3db01f07363475a6abf2099c9b2da83c15c1d8010ba30edd370ec` |
| createAccountUi | 1 | `f22ecdc85d109cdd48755c449f7d0a6ff6cd20fd6404ff5f060dd451ab10a62b` |

## assets/js/grammar-path.js (script-factory)

Existing DOM/class/style factory implementation in grammar-path.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| anonymous factory | 1 | `4fa9a46ba39896a096999ad5ac5b5a96ba9ec6dc8b8bfeba5a39509ae78b242e` |
| buildTarget | 1 | `76230d7cb5617a15be0faa72ef54bcd48877207caf7edc304f982f5dd95c6dfd` |
| create | 1 | `a5ba780bafa3db01f07363475a6abf2099c9b2da83c15c1d8010ba30edd370ec` |

## assets/js/home-compact-toggle.js (script-factory)

Existing DOM/class/style factory implementation in home-compact-toggle.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| update | 1 | `09d5174f8882cef76c3e308841fca5e2035d7d9f52e858302f577d0fb36fba9b` |
| anonymous factory | 1 | `596356d334706465ac750ceebfebc06a6788d85f696c21c8535f5104524c4a96` |

## assets/js/knowledge-map.js (script-factory)

Existing DOM/class/style factory implementation in knowledge-map.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| selectLevel | 1 | `36f972e2d4079d8b4e125ab0a8ef347c30bd5619632d788d5f88a651d6cf48d4` |
| create | 1 | `8e08c6ca7971a529efae7913f374e9c1c808a57d005fb9a5c1768bf6a16535ce` |
| createAreaRow | 1 | `d1545cf9179aa4762687dfce8fd92a9acce4bde5adfdc50923733a1fcba73dc8` |
| anonymous factory | 1 | `db1676a6d62215eb871fd4f5043e08012018b53de016a15927a360e660bc19a4` |
| anonymous factory | 1 | `fa78ba8d70ccf77a58a21eff5d582085de3926813967216a0c608f869753294b` |

## assets/js/lesson01-practice.js (script-factory)

Existing DOM/class/style factory implementation in lesson01-practice.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| section | 1 | `3571351079fae40139bcfbd4c6dbbe0f36a0836eab901b36dfde4ecf970c0ec8` |
| anonymous factory | 1 | `459ece1c3a002c64f5ffcd63de65e7f5a6658b07b83bd99ac38247bacf811ff4` |
| sync | 1 | `654d57116008291cca49b9acc30c10d3f1d38443e0952b042c286200e23cc4c1` |
| anonymous factory | 1 | `68c62e62f7de3cf7498770064214c945f42b6f3ab80de8f537b6c8ac38f098d5` |
| showTurn | 1 | `75aadf7bbdd2cba94cd4957dd729272e453bce8dea5fb7f45232086fdf6e215a` |
| el | 1 | `890b8a7d5ce192924cda1c29365b95f36746c70f466000e87713a916ea0b1af4` |
| select | 1 | `8b455edf4b0cc7e8ae652bbf1e32b60f71f463ce8c280983a47283784c7e92db` |
| controls | 1 | `af8114aee7f3641ed919204f8b269e581696fa7a4ff811fa017317ebed766c06` |
| button | 1 | `bd9979745c37b07596667768900e2ee9850e38510492ccb3660823ab9e82f1be` |
| anonymous factory | 1 | `be19fea617c12b7542ceca7b7c5278c8f75b14d8433db362a69a46c4e55e8c22` |
| anonymous factory | 1 | `c6c6f44d5ac0aca9276960a8bb3d4cfb2fae59b428454bd1dc455a7603238872` |

## assets/js/lesson01-supplements.js (script-factory)

Existing DOM/class/style factory implementation in lesson01-supplements.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| anonymous factory | 1 | `9ff5b81a4603921e0f0ed2ccbdc102c6a9ee2e25426903111bbf6081275e7ceb` |

## assets/js/mistakes.js (script-factory)

Existing DOM/class/style factory implementation in mistakes.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| anonymous factory | 1 | `3217f36a460a199508bc7c3c679ff24478b1cdcf74d76c37b7cd8c6962aa0d48` |
| anonymous factory | 1 | `69c0c6503c0d1558f8b5d06f4f3678f114a3f922c32717ebe1e2228c8ef2ec6a` |
| renderList | 1 | `8d4bb71d3ae5a8787d7a95cfe40aad025986c1adffac657049d3d973ab38bb7a` |
| anonymous factory | 1 | `eb8a1f662c06b56167c1a7a12d5079d3439d6aa9d6a87289cb6ddbda63d6d36a` |

## assets/js/numbers-expansion.js (script-factory)

Existing DOM/class/style factory implementation in numbers-expansion.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| anonymous factory | 1 | `26e2975c5b75cafdb7b4d72238da383a88aca80e15f8ec3003d162c19178e87c` |
| anonymous factory | 1 | `6436c668754106010b290ecffd0753267c31208e5cebe514e5950aa40d7619d7` |
| copy | 1 | `8346c824a5e566598b62805f075b25bf1cafbdf193b2135803e5925592283b47` |
| renderBuilder | 1 | `a9207230222922bc2276339ec0bcea034ae09796aba9eb43a6f43a568f5df6e8` |
| button | 1 | `c3167bdd84007f131536b9572b29b686f98ef34c589200dc4547245a863943f5` |
| sync | 1 | `d81ab248a70e25b7d665798663c36c44d30b73c12c7ad7d4ab1997bd1d7063ab` |
| fractionPicture | 1 | `e77d4c1117059f6a4cda0368d753ae19e1f1afce1433bc14d4bb816536792977` |
| el | 1 | `e992e9e031ec5dfd7c4eb886a5f7ed887a3b24dd4cc6f4a1da8fa6e64e14d3be` |

## assets/js/numbers-helper.js (script-factory)

Existing DOM/class/style factory implementation in numbers-helper.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| update | 1 | `8c67f7285ab14427ec672213384ef22f7fab19bce96e5b7913fe17da101b6889` |
| mount | 1 | `e0562623b511cb3063ebb233edc2d0ba96c921408b08019592ccf444ac579998` |

## assets/js/numbers-learning.js (script-factory)

Existing DOM/class/style factory implementation in numbers-learning.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| anonymous factory | 1 | `53e17ecc448777c036bddfeff0c31a9f2afe32df8d33b73fc17e9a033e674412` |
| anonymous factory | 1 | `a1ea2b1ae6f05f60ed0ce7d516fc388daea4b9a95ef5e27099ba8c27d3f64aec` |
| anonymous factory | 1 | `a42d2bdd28b39add85b682094880eee7821af27a51cfa097dcfcf77d6d62d34f` |
| el | 1 | `c08e676245d76bf077a2a480ce2e2ccd6e7f3aea3534ff240b77651895506305` |
| mountViews | 1 | `ffb2157048dd1e0f56b1f7da3b59a9f20aac641a487bc777cdf30c6918bedfab` |

## assets/js/numbers-practice.js (script-factory)

Existing DOM/class/style factory implementation in numbers-practice.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| anonymous factory | 1 | `1b2bce5fafda4f8ecb4fce3f5e771e8be03144c87252cc6944cc9cc054f66c0e` |
| anonymous factory | 1 | `5e4d14ee34e59a5f51c13a93a1770cd729dc4f2c807fa6661bd5e5acd3842ca9` |
| anonymous factory | 1 | `72253f36878ec9bbfa0804e401d0065f8df4eb2d925eeb8ac81ed9a255917b85` |
| mount | 1 | `8798a147b33dac495eb4b5eb1ed829cafde55855578fad46761f1ad203f483be` |
| button | 1 | `9adb56b47218b8775f443c42954bf1186df489b54fe0611a8792af50f958de8b` |
| el | 1 | `c08e676245d76bf077a2a480ce2e2ccd6e7f3aea3534ff240b77651895506305` |
| select | 1 | `d80c662674aafdab68c8661cf29d0ee5fb89a502f4ffed725fc9399815183d45` |
| anonymous factory | 1 | `f34654924e89d0c44cdc9842a315bceb3600b5e0062ff011e0fd905bceb2f33b` |

## assets/js/numbers-time-drill.js (script-factory)

Existing DOM/class/style factory implementation in numbers-time-drill.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| anonymous factory | 1 | `cab54a8abee6e66e5287408f4caa7760093341881664ab8bef0293302fdebab1` |

## assets/js/numbers-tools.js (script-factory)

Existing DOM/class/style factory implementation in numbers-tools.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| anonymous factory | 1 | `08bbf0888a0b38c888c85ad8087e95fd4967605890faaba14d6785312461a846` |
| anonymous factory | 1 | `13715920da582af50d5719f8b85a575ce31f024ad0a7224ebe8bd737bf4048c8` |
| select | 1 | `8149aa3e6cd73efb9105dab23bb29b0001a69ada3e7f7ed114dfec5ec263ad55` |
| button | 1 | `9adb56b47218b8775f443c42954bf1186df489b54fe0611a8792af50f958de8b` |
| mount | 1 | `bb6a253029550423ca5a80065283f43fbbec3c87a06a0e75ad710f9c778645f0` |
| el | 1 | `c08e676245d76bf077a2a480ce2e2ccd6e7f3aea3534ff240b77651895506305` |

## assets/js/particles-study.js (script-factory)

Existing DOM/class/style factory implementation in particles-study.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| anonymous factory | 1 | `29c43d8cff3e8348a956fb97cfbe2b3c110f836f46b1adb213e2d5c6479a1937` |
| select | 1 | `39b69b4cb40dbf709273ed8c9164118e5d0f25c2e5d0777080af6c362d55c70c` |
| directions | 1 | `7b3fbb0c85bc04b25022966bbded0d35998669e578202d0b63f898256a77ed8d` |
| mountPractice | 1 | `8777848ae2eeac23fac6eb32ffdd63a1a995aa8c126739846bcc6bcaac63ddca` |
| button | 1 | `9adb56b47218b8775f443c42954bf1186df489b54fe0611a8792af50f958de8b` |
| anonymous factory | 1 | `a97b2e4cf803ed3f75e2ef2d632f62f6696e62cdc883e4dcfcef45b782ece9eb` |
| el | 1 | `c08e676245d76bf077a2a480ce2e2ccd6e7f3aea3534ff240b77651895506305` |
| anonymous factory | 1 | `c6599cedc6a0b6a00faa7af5edfb85987405e5bed1b5d00f55d33f06442836a6` |
| field | 1 | `c7cf7594409280d4fc99cf2e962c027916d533d69a8eebad255fafc63bcfd501` |
| copy | 1 | `da822d724667f20d61b63efa14df8ee67ab1e3fabf2cbec897b5d8089e8026e0` |
| anonymous factory | 1 | `e9d2d5fd6d7ae9af98d347c60c27622d9b1723f287ac6e642437a6bd3a26a0d0` |

## assets/js/render-course-verb-paradigms.js (script-factory)

Existing DOM/class/style factory implementation in render-course-verb-paradigms.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| anonymous factory | 1 | `002f4482550f645bbb9b1feb2af984c683fd53703516933a3b9f3ae06a0bfd6e` |
| anonymous factory | 1 | `3cc50e83effe8c208b8b73ce02ce096cb7c1cd6b1f31f7d2a12bba5cbfe4b164` |
| makeCell | 1 | `6543e0410c269906bc6b539b31910d09a5b75862f21ce81199c711ab17445bf4` |
| renderParadigm | 1 | `c90ef9cc04e1e5ba994e9a866c0de6f9f7085d9d7634a03383967a154abab1c2` |
| anonymous factory | 1 | `df97e84762bdaee1758c8ca5b7764599041c3dbf461a913eb60d06bbbbf60115` |

## assets/js/render-example-banks.js (script-factory)

Existing DOM/class/style factory implementation in render-example-banks.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| command | 1 | `0a7395aae16479f3c81d4d7fe972aa0167d75a6623750760ee511f3fab98f7aa` |
| appendDisclosureQuestionAnswerCard | 1 | `1333a0067fb78bc7468d68821967ee442ec31fbda87cb85ec2134f9b5a7448c0` |
| anonymous factory | 1 | `1a99f27f4d786db012c357b0e1df8f5dc5f60d5fb7a691c53a5f583baa5981ff` |
| syncBulkButton | 1 | `2f723cfbdf28e506516b1f60b38c51d2643edb66fb3ac9926310a892f04e3bcf` |
| anonymous factory | 1 | `3e5dbe34b9c2fbcec0be95aa5298f240efabc89354d9a9499c718e612101f88f` |
| createQuestionReviewButton | 1 | `53b41ca03106b5baedf7dfaa9f60b64a67e4d53b81af5e84d58144e14476386e` |
| createSentenceReviewButton | 1 | `619ded9bb738bafd200c9029e45f592e6bbcc0996f25c52471c95b6daddaacb5` |
| appendQuestionAnswerCard | 1 | `67caae37080498cf0880b61dfd66fb713bc7ed98e5e82e396a0d384e6eb7ff3d` |
| appendQuestionAnswerPart | 1 | `7b8f7e9d265a06343c5d28724bed400d99549181aae14941cd3042fb40f3a798` |
| anonymous factory | 1 | `7c353c072a6bec4186420a2b74711b1dfca7cce3f18d026a2ce8bd0c19e79fec` |
| anonymous factory | 1 | `7d03d627c01682f5e4102d3fd7adcea9edde7e6d8ceb74b6e007ec2a3801b2d4` |
| anonymous factory | 1 | `8443d7740a272a0c70039dbaa2cfc02a43fa73c00f68112c168bbc6dc9cc7014` |
| syncQuestionButton | 1 | `84c1a0853c75c0f85094b41ffb558a200ed30d418d6ce8733e63f5b1a3986b29` |
| appendBankPresentation | 1 | `ae137f569e1c7a87c93d79b1ff954e53f4e32fbba395cd7554f272fe58b012b5` |
| node | 1 | `afefb591788e60565860a0f91a5cf1dfe6e538a55dd61b87e41acb0556fa14e5` |
| renderExampleBanksFromData | 1 | `b733259566724223b7280d83c36b0d8d284bd1a4441f14c0644eb332ab6ac8e7` |
| syncSentenceButton | 1 | `bf1d75c045a528dc4447f58738c4972fc98c20fcf2454b4c137feb01281bad3f` |
| anonymous factory | 1 | `c49d0102e2ecfa3a0d6285c544a0d2d119039a525a6e87c6a35095a26ae308ff` |
| rate | 1 | `f1085a3361b1d534da6164e0b49b20ddeecaa0ab6edde9b855230b9238d10ce8` |

## assets/js/render-imperative-verbs-page.js (script-factory)

Existing DOM/class/style factory implementation in render-imperative-verbs-page.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| renderGroups | 1 | `186ba9378be13d955d2240e3eb931b17992c53c01d08f7769df43c0709d55689` |
| buildVerbButton | 1 | `251d46241f5b4fe4a2326ce17b3e32652b2b1646a64e0b458e9a83e33f18372d` |
| anonymous factory | 1 | `577ae0eb4589b7946424b5d5e505b77b264d54e0abe0c4fc7576712ae9bdb739` |
| anonymous factory | 1 | `57b4c0a1c55a130a497b9983e95fa3c0137b9493034c45bf4f60ed108bb9aa0c` |
| anonymous factory | 1 | `64712025214ed56dce8ed3c6b98f151f55b7d24651990db036d547cb5150e4c8` |
| renderLesson23 | 1 | `8c20c51ab536cfc1df66ddec0ac97c49946d66fe38f3ef8c56258738b7a22524` |
| anonymous factory | 1 | `a82091d5a94a6ef80ad1e5ba8508d2e7c8c1441ff71596488d1ef14f48be5c61` |
| anonymous factory | 1 | `ae3c5e61a906a2b855f41cb02aa5f66b9c6dcc36981f8fc45267d787583901db` |
| createBulkRow | 1 | `b1889b2e81f8de57f48e73049425087b2d297dc4332077cd61fa75be64c54f28` |
| anonymous factory | 1 | `c1281583ee864254eb61c42bda1fa3106024d58ca1c8b37f6a99bd15147d9ba9` |
| anonymous factory | 1 | `e40046b8303abf4520c12a7524a9aaed154a61430cf18b7968d8445823fdc365` |

## assets/js/render-verbs-course-bank.js (script-factory)

Existing DOM/class/style factory implementation in render-verbs-course-bank.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| renderVerbsCourseBank | 1 | `0d4d5b78fbbcedf4417ee3a70130aebab507fa8998b78bcc9045ce4d7bf4a554` |

## assets/js/render-vocab-cards.js (script-factory)

Existing DOM/class/style factory implementation in render-vocab-cards.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| addImageCredits | 1 | `0df5c001ff9dac74ceaf0dbc650caa79df5b724e7eeed31fed17a71ac28e67ac` |
| anonymous factory | 1 | `12507efc7a8a8e3bd01e55943731d9614e15bda12699218db169799249a71bf4` |
| renderFigureGroup | 1 | `6fc00cbc01ed95516fe750bf4e685acc10fcd26c9b3be5531a7c0e1a3e28de78` |
| anonymous factory | 1 | `8f410a822b5cddc7ab35dfa002a956ba432579346fe8dd3a5bd8e515dc3715ac` |
| anonymous factory | 1 | `8fcfd63a1c97e2b23688c9984dfed001f602a9a16f55568c7393b057ac5682fd` |
| addStudyControls | 1 | `a8510843fb40ae9baf65f19b7f19463a3a591f200ace157e9136436780778030` |
| createVisualLead | 1 | `c39b41a06441e5ede952cce6501c619d407104300fbe1f24d8ba6a7f81ae8d14` |
| apply | 1 | `ce54b6c92148ca038f3cb4a85ed55974dfdd626daf72544fd8f7e716346a0c31` |
| createFigureCard | 1 | `de8685794029ba838ac8ae180422a51c925b3cd2d9553b3b5e7bef1d0f3ad273` |

## assets/js/render-vocab-table.js (script-factory)

Existing DOM/class/style factory implementation in render-vocab-table.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| createNoteCell | 1 | `48c0c297f3934a640c424879b7072bc2c55e3263d76f6aefcafe48442ae795f8` |
| createExampleCell | 1 | `7a47fd0a846637a1519441abc744d0703c16139ef2e2bd5977e0f27822a12ecf` |
| createCell | 1 | `934e36438b4d1703899b89454bed15b80c9e24d9e25c5c269a03943ddf6cdbce` |
| anonymous factory | 1 | `9372a8e3e7598326190c30f27888c680399ca2afef0eb079feb6886811cc7e92` |
| renderTableGroup | 1 | `a2e54f216e38d64ca04b79447cc454fce2641fd5079b72987ae3bfc8ee11851e` |
| createMalteseCell | 1 | `a519a54b2b7abaeed4155da508e8373329c9a1f456c5c685f728bec60197a2eb` |
| anonymous factory | 1 | `c46d7c2ce02b2e23e5c6cb5d1bbbce5e7476762192d5d276ad4e5391139d2abf` |

## assets/js/review-cards.js (script-factory)

Existing DOM/class/style factory implementation in review-cards.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| renderSavedList | 1 | `140f5760e69312b5c4a1bf242bfad28c0a7559df14429fbe1c3f1c94e8ff6c73` |
| updateTopicOptions | 1 | `1b64459c324efac78c4955c756f655678fd194e1a2a97e9ec960b2b4cd808155` |
| wireSavedListTools | 1 | `43dcc6d8a5260c9223acc562a166832074b910a48bd70786627add0bbd114049` |
| anonymous factory | 1 | `4a7b9371ba57613c90487677ac19ff503ee0f2e11a25a5607d0d1914ee26e180` |
| downloadReviewBackup | 1 | `60b6e18f2f3f7651fc8f99c397fdd9a7f8630d7101ffadf6895bbe1e6317d074` |
| buildWordCardVisual | 1 | `6dd592fa96fd044bfe084205971b857b9626707b8a08dca4ec48596b94303e58` |
| anonymous factory | 1 | `85a728d0cdafbdb5eb602b5b1445748e3213234b8835197ed10f6266c00220ff` |
| renderClassicCardStage | 1 | `88e4e307edbe814c450a10e67a398572bbd6bea693807c1f6626f63b1176c0d5` |
| renderFlipCardStage | 1 | `92c781db80a5e0376a0c0d1754981336793e2b8bbe56a2d0f90128cf46f7116e` |
| renderEmpty | 1 | `960267c63596ceb8844a5ea48d62fbab9352213973698411b45599fbb378b5bb` |
| anonymous factory | 1 | `9ba8367cd96474f55cd9e08ac8aa915e4acd800e33372202564fe758844af169` |
| anonymous factory | 1 | `ae808c5e916a052ad43a8c92f48dbb98fafcf89c6141cf21e8011d5513524e42` |
| renderTopicOverview | 1 | `d3c2e5e6b55ff43df1c7844eb9cebfa910f18c78a1d6d463d746eb9e4cad05d2` |
| anonymous factory | 1 | `f7e7569c737281d5d6c37b94b00e68ddf3eb5d923bc8ffe2fbb9e42bebe3837b` |
| renderCurrentCardStage | 1 | `fba77167e4857fbe409cb36419772c240219c6b2c02bce1d77361a0a1ea55dc9` |

## assets/js/site-header.js (script-factory)

Existing DOM/class/style factory implementation in site-header.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| anonymous factory | 1 | `0a339f677be75a29cbf326d9b7706b1dceeeffe2c1c0ada903cef5c332359df3` |
| renderSearch | 1 | `0bd35383ab1f3ec3a8c228e4dc98fb15326a4cc7b590d7740f697fb00781212b` |
| anonymous factory | 1 | `2089fd28799c3673daa7831b9990a63e5462fac3d31b82022af3a24c4178bf00` |
| anonymous factory | 1 | `76fc47cecfc20b07e536fe9e98c77c4e3fe9d500101863716c80edf09adeef80` |
| anonymous factory | 1 | `926e0a412cb952924238bb20051f6f06f78712b493f520e3a9bf3eebeb7070c0` |
| showUpdate | 1 | `9d63687ae48018606d2a5062f5460ae2f5fdcdada43dd4e30aa555234aa6e53e` |
| ensureReviewFab | 1 | `b612f7abe71f8683ebf9b50427f6203b100064e23afdd0c3e90976353241ae2b` |
| anonymous factory | 1 | `cb11a346523a5cc54727f85fa05637f5b11f592192d76b8d5fd48f68f92ec040` |
| locate | 1 | `d2bb4502d0003d6b62148fb7b6c02e44baba1d7374771aa48a293a470eec8914` |
| closeSearch | 1 | `dff9631e55a4cdc3cd7bbdbe390424be363578e7dec14c50f95ec4e205de280b` |
| anonymous factory | 1 | `eb8a52ef5e37fdd03e738f4460313fd33cd6ee1d961bc8378e03ef45a2b66814` |

## assets/js/site-map-pages.js (script-factory)

Existing DOM/class/style factory implementation in site-map-pages.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| createCluster | 1 | `417f4d1ac85ffda4abe9c758892d7fb836c7bed137bfa486a8decc56b1fdd0ce` |
| createCard | 1 | `456b99ff1c7018db3fe57260de9f3a6ec5d62e2d4dafdf83eaa4f382bfa1d4b4` |
| createJump | 1 | `639ca5ff46541f37523261d46de2f822fea9bcaf376318e1908084979d72e1f9` |

## assets/js/today.js (script-factory)

Existing DOM/class/style factory implementation in today.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| anonymous factory | 1 | `8fcad0705bf772b2da410d0e7c46a9dfca585556356ec95454175f563227d4a2` |

## assets/js/topic-picker.js (script-factory)

Existing DOM/class/style factory implementation in topic-picker.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| anonymous factory | 1 | `6c1c25be44a28d30772d19fc7774e4f35056177108aaebcdbaf7fa286bea9f38` |
| render | 1 | `8bb34dd3220e1cf57692e75064675cde4c31f2d9eb99ee244adb84144e2a6b3b` |
| anonymous factory | 1 | `e23d4af016187e2f2d46661b1e50680f0f96451b12a57682475e048e5828a205` |

## assets/js/transport-compact-toggle.js (script-factory)

Existing DOM/class/style factory implementation in transport-compact-toggle.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| applyTransportCompactMode | 1 | `0f653bdd9cbca652a1baca27ce266f8ad434de80881af87a61ceb36163e1c9ab` |
| anonymous factory | 1 | `1b944095e8dd06b50c2d94f11c99277fe7fea76c59b07a07b134a11ca09ef393` |
| anonymous factory | 1 | `46f3d3e64238b22281aaaff7d94a7bc8e6693c5f1a33df97b7314b3dcb1d80c3` |

## assets/js/verb-lookup-loader.js (script-factory)

Existing DOM/class/style factory implementation in verb-lookup-loader.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| renderEnglishMatches | 1 | `1e58ea4a7f19dbf09fc6ea1612fd9275a4a836348abbfc66fc038d6384fea998` |
| openFallbackVerbDialog | 1 | `5262ab5231a0fd9daa76c2643b99fc4545ad8623fc1006da98053fac238bad01` |
| renderExactMatches | 1 | `5d8862de306cbbf8ab6909737c74204b3ac1dd21b96dda615fe78c450c2e8a66` |
| openVerbDialog | 1 | `5f121f7d430caa0ac6a5ea9d604bfad93cdd20ec7e3ac3de311eeb3cd2aa42b7` |
| renderMatchButton | 1 | `88b4012edc96cdbbce8349eb6754474138fc97f9d630700a4ed5edec0a1935e9` |
| renderFormSuggestions | 1 | `a6cbb792b2f30e22ed3250676bc8642ff71a7b62433d864c684a600ee554a22b` |
| initVerbLookup | 1 | `a7e221d335c4c34e0f20d3b777ed5be6360b029ae7dc35277e81190bb7be479b` |
| renderMatches | 1 | `b880bb8cac8b1646f33663e5bace3e31338442154fe529332b3d67cf10dba186` |
| openPhraseDialog | 1 | `c3a04395a66fe3c4295b05301b37bc36edf9304c41f231e918704e1301e0bae4` |
| createDialog | 1 | `fe62adb294092f24b8ef826649d6634760949d862b0dc9a6d30389018c61d521` |
| renderLemmaSuggestions | 1 | `fedf5baad5a3cb32b8df8bffc3df5a78ffecfc76dcfaa5959bbb08febc3feab3` |

## assets/js/verbs-review.js (script-factory)

Existing DOM/class/style factory implementation in verbs-review.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| syncButton | 1 | `075ef6ae8d698c3f6f080fa58427271daacfc0760cbaa3e2a1380a4403522c1b` |

## assets/js/vocab-review-page.js (script-factory)

Existing DOM/class/style factory implementation in vocab-review-page.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| createBulkActionRow | 1 | `055501a6e23667e4df2ab83b3f49a7459fe4c6b40b7f1f35b5272753cd3a22e0` |
| injectPageBulkButton | 1 | `18489189d8820be3a472d77a79b698def23319936032a0a01f66c2373bb165b5` |
| anonymous factory | 1 | `a1725a228927cbba9882c6380c3da470bec7765dee6f60029384545c09dd63fd` |
| syncReviewButton | 1 | `d9521b5684b000b468aee589cd6dd45a572f90ad9f82e355af90b64522e7fdfd` |
| createReviewButton | 1 | `f844dcb32d11cefd23b671593f607873382ce7b13d3ee5d064fb99dcce2fb55f` |
| syncBulkButton | 1 | `fe2f31e1216b1e8e4e746cfaaf3982691f480c3d57cacdcc88898644a3a42ac3` |

## assets/js/vocab-view-toggle.js (script-factory)

Existing DOM/class/style factory implementation in vocab-view-toggle.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| anonymous factory | 1 | `d1dbd975f3afd9a5ba326b46300a75739f2e1c0b81b2b7a695baa1808375b09c` |

## assets/js/vocabulary-games.js (script-factory)

Existing DOM/class/style factory implementation in vocabulary-games.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| render | 1 | `026324675cd872f440ecf33b9b88653d3da822ceca57f3ef061556d8f3f5abf4` |
| anonymous factory | 2 | `13357ee449fde7a4a72327def95594f3ece6c8465cae583c8ce37c5b1cf7cb80` |
| anonymous factory | 1 | `1c17f9afd28c092beee14c71a801cd6e3d501f9ae948bdd831f39c058be0e428` |
| anonymous factory | 1 | `2acd7231f2a157750e67ea0e8fe43e46c357056fb38e554bb97046047fb8c652` |
| renderMatchedPairs | 1 | `3267b682756b8da8c0f07c3c7db6af747f06b900c2d5af010c50c569d27d5944` |
| render | 1 | `4e5d24e2009ed8ac1843f7889f03f0a4a484495e300865d793bfa8075f390eb0` |
| anonymous factory | 1 | `614d75ee2c318d0dc6aca69682ad82409de8fb5b57f9476096ef96206ff225d1` |
| renderRounds | 1 | `694e2a113d2d3a22cc4744111b5c6cf92c9c1dd21c5a6b44056c69e6b98150bc` |
| anonymous factory | 1 | `71f5395695e9c122348e15ed2262b3ccca44aa3cc8f7bec7654316c8829cf2ce` |
| anonymous factory | 1 | `80dd8b4edd72d8e4d070d4e936a6155e0388400bd3d0a38b83b3393a89cbee0e` |
| anonymous factory | 1 | `a88f9e099279dc6bbcda2b7f76053dcbe90fa5ad84c220679c40e7aed19bef3e` |
| animateTileToAnswer | 1 | `b6871bcc69e168f826eaff4e517dbd2b680e8da148c0277bbb2ed89570cab4f6` |
| anonymous factory | 1 | `ed0ad06a84d73b0fdfea98096ebea9e1c116e95d598d3ebe701b6d4bf967cdee` |
| anonymous factory | 1 | `eddcbbb68ebf3cdedb4d9a2cf361fe11a34269e16d493ce6111ccae621e1cfca` |
| anonymous factory | 1 | `f014a99cca2b8ab88ef2cbd5a267c40c06ad772c461db223ca228c0b9f12ab02` |

## assets/js/word-search-game.js (script-factory)

Existing DOM/class/style factory implementation in word-search-game.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| anonymous factory | 1 | `029eb4582fbb57cac8e0a24c01d400edd06e7b93b60053d62b77f5bcb75cc885` |
| anonymous factory | 1 | `05dcaf41108231272dc32769e476dc3c9890cbbe96ec746401fd24bb8561e1e7` |
| renderBoard | 1 | `0b95603a3fc7260e4bafa847ab8af24cbc44c97c3e3900f2a6f8bb822a8bb241` |
| anonymous factory | 1 | `1a605c2096abfe84c4904e2d200768a05c79ee045a7bc24b80a5c71c6925d5fe` |
| showCompletionPanel | 1 | `1cca0374e5922f816671bbab5b60fe2c28c3e617ceb4cf3acc841c6471969904` |
| anonymous factory | 1 | `20d16dfe581cb2c57bd03d3b8e921253816b00fccdde9f4615dfab956c87b528` |
| startPuzzle | 1 | `2ec120a3eae18205273e6da0ee49794ee1b76f0825424d2c1066d48c95df6c22` |
| anonymous factory | 1 | `39168b5ace91fbca747fe6b06972f9f141029fbca9f5c68bd2b6dc15de267d56` |
| showHint | 1 | `4704c96c3f37ccd4bbbb61a7c8e8e0704a12f89d7406ff94c1e137b52d87fe59` |
| anonymous factory | 1 | `5f608203fc416b806ca8e29057ff9b1f7244f87cc89232c4aeb72723d9821754` |
| updateSelectionPreview | 1 | `6afecd9020fb1752d4168292a02d6d988fd6ce583b7cad3a04db12413c0d42a6` |
| anonymous factory | 1 | `6dfa6d5ceee70eb7f447127142539fe62d3b884a3c2539b4d9a7bcb38d9aeb7f` |
| anonymous factory | 1 | `7116453e3a41ada44853a2d3a5736db77e335fe37f723a3f8b42a94a9ac479f5` |
| updateProgress | 1 | `7910b24da8633738eeb04863e4899d796c5f4553aa54c9fa6b773a4ca696c62a` |
| anonymous factory | 1 | `7953488895463cb35c01e69ed5f69b9d6bd9f05a3c4f78b32d3eb8ff6613d67b` |
| anonymous factory | 1 | `7b4692a0d0865179d1ce5b2478fc9f057f79e0f47d8e61056801179865b327c0` |
| anonymous factory | 1 | `82c42bf911f2d293f505f1dd65cba39b7689842909ca23c39f1074ee6a4a776e` |
| writeSeenWords | 1 | `a11f413fbce61be2d25f44a2805e26f87786cbfbb260aa30a7f0f3224237adae` |
| anonymous factory | 1 | `b6c6702844ee02757da58dfff40ae82a6e471d38dfe4427a548c8d5620e46f09` |
| anonymous factory | 1 | `b83666006805e3869db5d95455a9d8e71ab319c28e3e94aa8755cfbe95dfae92` |
| anonymous factory | 1 | `bac570303d45ef5551cee9a7b949f4826a841554e67106e66673946e59287150` |
| markFound | 1 | `bd7b6c051a669e148a3b4b682963c3921462db366eadd9121c348713bf9ce576` |
| initTopics | 1 | `c67c3dc90199566840207d02f0034ca0c1ab3de8f6f6928e841c32a4d5941b30` |
| anonymous factory | 1 | `d4c45849c3af05d138fe0072a0b1c2cd990b28b72eca3e69852b001c07d89075` |
| renderList | 1 | `e631f00766d653fe9d56291e83f43f0b2117880bb1d702efee3891682d0303ca` |
| anonymous factory | 1 | `e6f76d2a40778be1f8715ee94b5c39ac638d08d233ab6cde5158c6790392af5c` |
| anonymous factory | 1 | `ec46fea7852ed0ea49bdf09248523e17a5ca476df9ff954ec07a9858d6ab2295` |
| updateListVisibility | 1 | `fe2f1f26518c21f7d59f04152de18dfb5b6be7059e69ece370c6ce89d23d011d` |

## assets/js/year4-exam.js (script-factory)

Existing DOM/class/style factory implementation in year4-exam.js. Parsed function signatures are frozen for review, including geometry and legacy surfaces; registration is not a claim that legacy debt is resolved.

| Registered element | Count | Signature |
| --- | ---: | --- |
| renderTabs | 1 | `1bd8215095538f787af97816485fb9575c746595213506626d592b2381b1cd02` |
| render | 1 | `1fe204afdb904efc2bbb26af5a5341e97bca3aef256d91f024104f2494d04552` |
| anonymous factory | 1 | `24a27d1e76d9cfe5c7fd220db8340d32e976642ca0b1603668b6e8b26d35d7de` |
| anonymous factory | 1 | `5df96bc8faef0af52bba4057836bf209d13e3a4ad2523c624d9523fa9c23b270` |
| revealTranslation | 1 | `77e511c8e350a1739f882213cfe9f6187367e7ec19616b715a461e017252edfa` |
| anonymous factory | 1 | `affba87cde3b1b5f15b29467133d5b800b746f2d39fb0ab55874ca2ceb73fc72` |
| renderCollectionTabs | 1 | `b28837b09ff353d97f927aead7cb3e86071ae8654c1c29e78aa82deb9b1a735f` |
| hideTranslation | 1 | `d8c5c9abebde16745b66546475547a011a11a7f13765bd26556be4b87021786a` |
| anonymous factory | 1 | `f41a633985c0e1fe69fafcfde2d7268ccdcf0599064ea0ca01387f3583d3f01b` |

## assets/css/site/base.css (shared-selector)

Registered shared surface owner: base.css. Selectors remain centralized here; adding or moving a surface requires a described component/ownership change.

| Registered element | Count | Signature |
| --- | ---: | --- |
| body | 1 | `00720dd27c96b716b7f85e8ec206d5a151fc47328b3a4788b2ec2d0b07e21b9e` |
| .page-card a, .resource-card a, .top-home a | 1 | `013f0a5160d716ca0db7f62c58a6fc48e5717399f8f19a60a5da3fcf48caf0a2` |
| .page-card, .resource-card | 1 | `0ae1f71ad7bd6f80788292c888422dc041d40424fe27c351b62d448b2b932218` |
| h1, h2, h3 | 1 | `29ca8d91d722c332a88d28aa3666367e5fbc398b33dcec6f0cb323fcefbacbb0` |
| h3 | 1 | `456d1710f28af0b0b03a7ae92254e9f4e22aba2c84d9c7a230428806fed365d4` |
| .page-card p, .resource-card p | 1 | `510c0732d71de3037af457e11336f04cb45bb9f2630ddcdc37eb6347097acbe3` |
| .note ul, .hero-note ul | 1 | `66076caea3a8340f97066a4093502785ab370cf649437981f44335b2c4ed9772` |
| .sidebar ul | 1 | `7055745e4daeb767b5e39099ba27e28fe921377b7a6afc9753d67c259d7c2d91` |
| .visually-hidden | 1 | `7edc2915054eff320dede6d70863abe48fe23b10b6cc992f2485d249d4624438` |
| .sidebar a:hover | 1 | `97ccaba7914e7f16842a0995e266119a46b1c521eebc6caedc80792dd754466b` |
| .hero, .sidebar, .card, .content-card, .section, .resource-card, .page-card | 1 | `984bffb74fe8552c614b86a30e86ddb34e21c4d6ffa86866c13ed06f768fe14d` |
| .note p, .hero-note p | 1 | `9ca1cb9ec5d1dd2c36d06aeeae3a64c176b57109cc85cc60e37e26dedac180f5` |
| .sidebar a | 1 | `a891460da3e367dce206ff65addef72b0d5fa3ad8d9142ea77ef227bb358c19e` |
| .sidebar li + li | 1 | `aa7ba9ccaeb9549a8bbe02efe395671b60f249e2e1a78aff635bafd638ec28c2` |
| .sidebar h2 | 1 | `acf2ec9b05b421f729c75bad42876c7ca70f06c354068954430bd1ad5df79dfe` |
| .note, .hero-note | 1 | `aedb7cdcf23e81ccd3c1909879145f19b48da87b5c8b96ca6c5a335453c464db` |
| h1 | 1 | `be63616db33a647a5115561f1f314dce261dc7f55e67371532106ca29f97b7ff` |
| .muted-note, .subnote | 1 | `d511cb5d5c85c210236cd68b991512a4c6ad43bd6cc0d97114c709c822b0de66` |
| h2 | 1 | `da9b0a71288cb9e801a432a32304163f4eaf2ff0fee7efa2d92c2e5aee552907` |
| .lead | 1 | `ed18e3c8214cf9dc19b4f98ea9e33ecdb7950ce1cd5534c91238f128494720a8` |
| .mini | 1 | `f28518b26b86f0871dbef35942c1844a4ed09d1d6ae0a1275b7232150d271c5a` |
| .hero-band, .band | 1 | `f6c43c5592d4811337284d66f7d84438094066917d2ab9adff71358e897ef016` |
| .list | 1 | `fe8627ed0c7a8a77748099b6d6765eb411834df6ad2bc3d16d98e306dc185b7e` |

## assets/css/site/components.css (shared-selector)

Registered shared surface owner: components.css. Selectors remain centralized here; adding or moving a surface requires a described component/ownership change.

| Registered element | Count | Signature |
| --- | ---: | --- |
| .study-progress-status | 1 | `06201a89b8c66a42aa7ae5be657b31f06cc363301a76b31bfc3c36a6ce4687e5` |
| .qa-disclosure-number | 1 | `07d722e1ff07089f6807f1eee92df5bf4ddbbc2b8a2746396309cb963793d619` |
| .study-icon-button | 1 | `082127f24fcc1d369cf6150e141346704010f9626ef57a4e925f22f28567faae` |
| .qa-disclosure-card > details > summary | 1 | `087dae9e745cc8ed6648c4f097aa0b037141068c24417f56a61ec4c7feee336b` |
| .study-question | 1 | `0b5785e2b1c44cff86c96143041142e3733a228acf3250d2f15eb62101913afc` |
| .qa-pair-translation | 1 | `1076090c79dbf22c8bec44a27cd3d529e2a07458286c42029344102e5a89523b` |
| .demo-box ul | 1 | `1471aa676673d8d99f4d38e97d49c0a2087b735194ab2f7bbbd6d87ce4a91380` |
| .study-token:hover:not(:disabled), .study-option:hover:not(:disabled) | 1 | `18c640b0bee48002aecdfc3fda65d35564e88059daa90c98dbd5b89d64bff264` |
| .study-disclosure > summary | 1 | `19c6be8d83471ade063a0b15270a2d2292b0b774a686f79f72bdf560ec530d66` |
| .qa-pair-part--answer | 1 | `1ddd88d7f119d6d8787b25b7e53d5368c963dc8c1c475203786957a4b944efb3` |
| .vocab-data-table .vocab-table-maltese | 1 | `23ac725e3a07520f36ee55c3d0a0456a91113c8702a66afa6a8f27c62e61d135` |
| .grammar-contrast-card--right .right | 1 | `2843ae90e3b6bbec4415a5c56b4390d9d419733320d42dfa9d97ac68cc8b2b22` |
| .study-token--removable::after | 1 | `2bf30143a12fa4237c1048e595caa9043b6e1d7475a4539ead216770d62b940e` |
| .tip | 1 | `3156b49285eb7a1fca11865e8f303edf4a2167ba1e4b0485e26929800f1d650d` |
| .hero-link a | 1 | `35d2c3cd401935a8384976138bf5c1ae482f20db17ac528dbf07b20e972265ad` |
| .print-sheet pre | 1 | `3a429536168e446dcbbc80165e756c3840da10e08b7dfcaca7ac055dc907a4a6` |
| .lookup-status-box | 1 | `3c809d4f0d5cd23cae73a61cd334decab70d5488545cf2f01267faaae38d4d65` |
| .speech-card:nth-child(2n), #dialogues .dialogue-card:nth-child(2n), .example-dialogue-stack .dialogue-card:nth-child(2n) | 1 | `4202e6c5d98856d8c3bf6d2891f274272ce242bbe2a0cbd9317cb69aa8571877` |
| .qa-pair-card | 1 | `4ad952302cbde14057f15aaa557dda4bd2a0449c154b1c72cb68f24b4ad467e0` |
| .route-figure figcaption | 1 | `4f423ddbc0bfe75bd0165be5a9228b8efcdf86652f810d4834d18784d5dbfae5` |
| .toggle-chip.is-active, .toggle-chip[aria-pressed="true"] | 1 | `574ffc7d373301b08e662ac7e09278937e5d82ec607c3741672401219d449160` |
| .study-disclosure > summary:hover | 1 | `5ecfea78a73864291ef2fc26ea1fafde64738f0a0052e7013e6403816dfa2a02` |
| .print-sheet | 1 | `6b07aec30c021753bc75dc2f1b5e9944f562c915befb68760f5e63e8ef55c8ef` |
| .demo-box | 1 | `6e18d60d4961476ee36a4019783d2878283cb948762a21dd474e3cb04b90cd10` |
| @media (max-width: 600px) / .study-disclosure-body | 1 | `77bcb8857bd42f4b6c5d32afde2fff2012afad710add942a93cfb314a0081378` |
| .legend-swatch | 1 | `7bedc393a326064a144e81c34debad60f5abed78d1c1ec101d090117921b8509` |
| .speech-card:nth-child(2n+1), #dialogues .dialogue-card:nth-child(2n+1), .example-dialogue-stack .dialogue-card:nth-child(2n+1) | 1 | `7c8ddab13ccef197266fedd93100870f5c367c86c0a9e40c6f3d4f233155673d` |
| .route-card small | 1 | `7dc89bd8a55feff6abcaee7345d7e4de068da79f1f51c09cceb08943425832b2` |
| .qa-disclosure-options | 1 | `8258f81496b7cac879695259bc1565b7ff1e3873a2a8865b6e0eec0ad61ef631` |
| .study-token--selected | 1 | `82c32df1054844d6bf31c1e6ffb24b773397918c202a271bb4bc41f42baa00b6` |
| .study-live-status | 1 | `82c3383b9c9c5684bf2e8def3dd873444285e05930b09a9d98f8a3297b83a722` |
| .study-disclosure > summary:focus-visible | 1 | `865d65b9b49ed3dca8689dbc2919945d818e154cca1dd2aa33cad727550c8f8b` |
| .route-card .mt-line | 1 | `86ccbaa745724fb2932beec16ba317573d88081586d21302c8d1294976e15ac6` |
| .content-group, .open-group, .example-bank-section, .shopping-dialogue-bank, .grammar-contrast-card, .wide-box | 1 | `87f83fcc2c1bb3872df507447fcfc54aaeb035b641f353f339fd6c4f3939ba68` |
| .grammar-contrast-formula--right | 1 | `882a105067de15435756c27ed6d87ef2946c625c0a2a1afea8f19c3871757d81` |
| @media (max-width: 600px) / .study-question | 1 | `8a9322e56c405540af9a0d4f19a38975716c357d232b89f87e6365ee676ff9a8` |
| .study-contrast mark | 1 | `8c403f78040d2705b5a32f79ad84c85de5c19b250e7c583b2762444647e13c6e` |
| .study-link-button | 1 | `9213062977e7ea72dda74563e653d8db58a9752435c8bf24f006a5abe02082f0` |
| .segmented-toggle | 1 | `933c827d4fd51d0c4cb42bfff3ddbf3226bdd37f185fae8821995ac0ccdf0b91` |
| .formula | 1 | `95a795725bfae86033f9c1197a50512c044a7b762a9cbf28aa71cd81abbf1b43` |
| .study-disclosure:not(.study-card) > summary | 1 | `9731fc8c67304d53124067ff5b0cc4f1b6403042d3e2c654f7237b8e59836242` |
| .study-contrast | 1 | `9b29f2d9bf74ceb63b66a7c2efb9c729f1b42527b9a933b54be7a3f76ab6b07e` |
| .route-card .en-line | 1 | `9d8bd3337b611b08c9b413626a536ccbab448f917ea05edfc2f8f3bfe808abd2` |
| .hero-link p | 1 | `a6c04caf694a64b8c7c27c50fbee25c866291ba78c76113e2cd30d0025778f3b` |
| .route-figure img | 1 | `a772ae1968add88228b59245b5f27106d9785cf5f295c83b5002b3c76c16d15d` |
| .study-input | 1 | `afb93fa021bd85696cd03c329c52382cec12a5517d23feb530b53c9723e2c84c` |
| .study-disclosure[open] > summary | 1 | `b216a9ec0cea987db8164b6bc7f7f8a2f093552556f6841a7937c3eb62131b5d` |
| .toggle-chip | 1 | `b4955c89ba179216dc4bdfd182fc498e133a1047c0d9f76d45dfe53fee61f352` |
| .speech-card, #dialogues .dialogue-card, .example-dialogue-stack .dialogue-card | 1 | `b7aa5822b05c37030fbc40afe5c3aec1515b2165f4332d8345cb7ee251067f9b` |
| .route-card span | 1 | `bc116b37a03d5d63e0aa918b1b701f42c0ae0bd94174641b73d453c36ab9adac` |
| .study-feedback[data-state="correct"] | 1 | `be30a6b96a6835e810d83cc605bb738062efd5b6fc5118b05d13375b5969f88a` |
| .command | 1 | `c3c9aa1e88fa1831f2935f271681684524116b82598eeabc0dbd89565b62b460` |
| .legend-chip | 1 | `c5b987115451caa389f2af0cbe0a7043680d07a7da3f83fd6e9f5cf0cf660360` |
| .study-disclosure-body | 1 | `c5d40ce4b18e23c7ab1e01052b4482a1c96c52ab9a5df2b2df2496c8ba0caec1` |
| .study-input:disabled, .study-token:disabled, .study-option:disabled, .study-icon-button:disabled | 1 | `c903cfdd89520d56f5bd4c28504e11f58a5b8a73a264bdc4ab41dedc202fe9f6` |
| .lookup-status-box[data-state="ready"] | 1 | `cade81e94a972e1c97ce92be494033556d9d5c89dea73c53344de0e7198e1479` |
| .footer-note | 1 | `ce292d5fe7c38a47b374c425151cb68e0e248e9a84fc6d9e971ba583cff4498c` |
| .example-list | 1 | `cebd56530137eebe71ddd53b91330d2e5a2d5b5e6b401d3c4e745c3fe73d2280` |
| .hero-link, .demo-box, .tip | 1 | `d0fb65d450877bf68ef16d7bd6227a23be04a0e34c426f20fdb20890ec7ea44f` |
| .grammar-contrast-card--wrong .wrong | 1 | `d5f00ac5471666e278c4ff61c200adc4e851c2178e2a66a56b52796bb2868e06` |
| .copy-fallback | 1 | `d64f4126898bd575713799807ba896aaa750dcfb303306598f58a0efc90af1d6` |
| .vocab-table-notes | 1 | `dbf81e946814b669b39c5c1b7a460d10efd7024c070cf6d66fef4bab0d931a03` |
| .study-input:focus-visible, .study-check input:focus-visible, .study-token:focus-visible, .study-option:focus-visible, .study-icon-button:focus-visible, .study-link-button:focus-visible | 1 | `dc25fa5b06e1a88e57ef0cafad2d1636aa5d9101854e767ad3cd93216cb7c226` |
| .qa-disclosure-card > details > .qa-pair-part--answer | 1 | `de56840b2a399763232c90a4ee63bfb2709fbdd08e17447dfece0f929c214b05` |
| .study-option, .study-token | 1 | `e09c6ff2b135ccc73f673d386332c9d778821d06a350aff56b8803687f6b398a` |
| .visual | 1 | `ef7abe20480fe7143c437f1c38093e27e12713b8fa8725f9a875747cccf7165c` |
| .grammar-contrast-formula--wrong | 1 | `f3c52d148581cf594acf73cc16559d0d03e76754d242a4785521121cde789757` |
| .lookup-status-box[data-state="fallback"] | 1 | `f807697017ed755768d8742efe94ec82e9036c5f2bed773f3daeaa9e2c6110f5` |
| .qa-pair-label | 1 | `fb2b13d36bc0d1f5ecbbe49aa1aa3f6c0da9d8fb667b52dfad934054612b4fb9` |
| .qa-disclosure-card | 1 | `fd42084d94845ac40bcffa2df7e8aaeae1254748dc81bb2fc4c29f4a8f9f1317` |
| .hero-link | 1 | `fe75aef8fac7b8451ff74ee58003c830135febeccd1445a3d7f71d419404b5c4` |

## assets/css/site/exercises.css (shared-selector)

U04 field migration removes the exercise-input-label surface and legacy input/select skin. components.css now owns field appearance; this sheet retains exercise composition, choice/token debt and feedback contracts. See docs/analysis/exercise-fields-unification.md.

| Registered element | Count | Signature |
| --- | ---: | --- |
| .number-time-drill-feedback[data-state="incorrect"] | 1 | `0570345c70c3370854ff887a8a9f9b1c7e8718347047f623cc098789e3f7b105` |
| .exercise-choice:has(input:checked) | 1 | `08881e7b4afedc23bcc421c598280c11c240323de164a02ed18a5b0772d88004` |
| .exercise-token | 1 | `16ddd215a921cd09c95e5464d094ad55c5b5fe9829e3b8b0812b31b0227aa81a` |
| .exercise-item:last-of-type | 1 | `21dda73a4fcf671e50692996daee5c51a94a8e001ddc8cc33abfec6dcf89cccf` |
| .exercise-item.is-incorrect .exercise-feedback | 1 | `2f1da70bc0bf90263054f03baa82f872eca1261d70e428785ec5e7c09bcfd1a9` |
| .exercise-order-bank, .exercise-order-answer | 1 | `37e8f10873fb7db68aadf4b53afb1e32f3968dc91f183b5ef7b483f7f6db4040` |
| .exercise-match-row > span | 1 | `3b00b56fe10b7b0ca6d63a92ce323b09a43f60cc8f92efe639ee54c72e16280a` |
| .number-time-drill-challenge | 1 | `3b4a9607bca4d8bd919c5b1e42941abeb7387bbf4ebe81b03961be96188409b2` |
| @media (max-width: 640px) / .course-practice > summary | 1 | `3f74dce064f85546bbb511f4f5931f48f785f03bab7745018b2be86b51bf5ad3` |
| .number-time-drill-feedback[data-state="correct"] | 1 | `44e9ed206113499b789ac8fa9ebf7be4e70ccfb9b61e048146b85e05b3b4367d` |
| .exercise-order-answer | 1 | `4f1d25379e916fa8c5ff61113d6484bf0c32a381182a279bd18d90d7342880f6` |
| .number-time-drill-direction | 1 | `522353dca5d916bf66f63f767fd9cce8959253962504027f55036a2b22a0b721` |
| .number-time-drill-feedback | 1 | `55573fea22b00be43910daf027ff6adae00622c9f482e5434bde36f5b07b1acf` |
| .exercise-result[data-state="review"] | 1 | `672e7743e7a040a7c0d99590d476ce3105d8a6a7172664e9858138a684e41466` |
| .exercise-token.is-selected | 1 | `6a44dd52e7b3d98d4e215e296497d647628cd9d37ed6212110fbc68f4133b1b6` |
| .exercise-result | 1 | `6ad5b02af78fb767832bb407802ebf5a2831f63308db476aabb84d90ec2fa375` |
| .exercise-item.is-correct .exercise-feedback | 1 | `782aa8d3f36812dcf83a9a11ca7663229c2f88453ce64d423498bb6ed0f90d0e` |
| .exercise-item | 1 | `975801ef2d95fd6bd072dad074c09d9a7864f5e28eee6db3b101b6f114e0b03c` |
| .exercise-result[data-state="passed"] | 1 | `c490fac8aeb8cc4827e9d5d56f268bd7547bf5439e00524e953ebf508893dbef` |
| .exercise-choice | 1 | `d5be002c00fbfd024ab14c92de40d0efdc625aeffa8b63eb8d2c546e317a8068` |
| .course-practice > summary | 1 | `e741073c7bd8c69f28a07c86969a1523d7ba0c76accca751e49e1dcd344a1f11` |
| .course-practice | 1 | `f382c7d0c71ee9c4754af64e16f69c26c952be813299d392323c0ea4dd31c732` |
| .exercise-feedback | 1 | `f6e5245b2f4bc4d496c772b6918e6c0a6c74494841d3ee44a1a6632c9fc3d09e` |
| @media (max-width: 640px) / .number-time-drill-challenge | 1 | `fbaef8773e801da88e0e7cbab25f053f21a458e6d5816f74d748fee25db2c242` |
| .number-time-drill | 1 | `fdda5fe6472b9b5f1fbb985016136d461cfd1eb13b16b09017cca7b210502f00` |

## assets/css/site/games.css (shared-selector)

Registered shared surface owner: games.css. Selectors remain centralized here; adding or moving a surface requires a described component/ownership change.

| Registered element | Count | Signature |
| --- | ---: | --- |
| .topic-picker-check, .word-search-topic-check | 1 | `27b5f3f168391fcfa954115d6db920f9e573197f9c4d05c4673aec6eff611e2c` |
| .game-stat span, .vocabulary-game-stat span | 1 | `33cfeefa84b7ce69a93f23885f5183c29ab3a7f9b2b1c5c2359ce6f76c7c3186` |
| .topic-picker-checks, .word-search-topic-checks | 1 | `49a92e748d3d19f242b27bb9bf977457039ddf896ba5b0d476361989252c2251` |
| @media (max-width: 480px) / .topic-picker-check, .word-search-topic-check | 1 | `6e36b4c9d8c6f7b6ecab0db3a8ffcceb0e4790566da04a8b2eaae31d3f377279` |
| .game-stat, .vocabulary-game-stat | 1 | `80923affc857f7d1176c52fa84f4e916289bd8a09bb3d106d1df076b0687d97e` |
| .game-stat strong, .vocabulary-game-stat strong | 1 | `89f81a77a8458466ccf137f05fae6f842dee7e9d22a62fa90710ac9b9aa23d02` |
| @keyframes game-refresh / 0% | 1 | `c719e34453b3f1786d5f96c93a0f8cfbb13d7b416ff62cfcfe17dbf231fc63f3` |
| @keyframes game-refresh / 100% | 1 | `d7de0add0ce5d2ef32c9f798b23bd135f7dea48728a45faa7773287b87960258` |
| .game-field strong, .vocabulary-game-field strong | 1 | `dfb8d4828422acc58f56ca061e853e4555c69521842af7e7cdd534ddc9d9d14c` |
| .topic-picker-check.is-all, .word-search-topic-check.is-all | 1 | `ec92cd6d6917251ee62b7bb1eadb6c06554d91bbcd057aeca24b62ef1fb4eba4` |
| .word-search-field strong | 1 | `ee0834b9e520fb3b9fab35d93c515f811b7028d941a2e048931f6ba636c2a047` |

## assets/css/site/imperative.css (shared-selector)

Registered shared surface owner: imperative.css. Selectors remain centralized here; adding or moving a surface requires a described component/ownership change.

| Registered element | Count | Signature |
| --- | ---: | --- |
| .imperative-flow + .imperative-flow | 1 | `079be8b822b5ea192b3d779b1607d9a14c80e4b5393832f32d0f156e49839093` |
| .imperative-layout | 1 | `11257d8b62bf9ae2f7c1120edcdca78767ea8ca3342d5873ab6b9eb332c560fb` |
| .imperative-tricky-line | 1 | `1334e04e43ec7cef54ca41691554f3a80e7033a45314fe29b887257d400dc3bc` |
| .imperative-flow-label | 1 | `199ee5c343392b32ea185b6e33dcc2fcf31214db7e168a469905e4a11329ae5b` |
| .imperative-pair-row | 1 | `1f1e09e4e2299324b11da8af49ddf6ad755adff344aaea3e0039c4ba725787b8` |
| .imperative-tricky-header | 1 | `43986be19adaeed76efcf1ae38b49a69b2ab779841c814fa06eb49302c96c1ed` |
| .imperative-mini-box, .imperative-example-box, .imperative-polite-box, .imperative-tricky-box, .imperative-drill-box | 1 | `44bc1f331780038c4a663fee3a3865b4d97d7ec4bb22504011c4241c458cb1e9` |
| .imperative-mini-box h3, .imperative-polite-box h3, .imperative-example-box h3, .imperative-tricky-box h3 | 1 | `47ef76d992a07e1606b55c3031888698985e0b998f276900386c38334a2df508` |
| .imperative-layout-main, .imperative-layout-side | 1 | `5c4cc8575be4440c8c2b14f6a37c7c2a9e0ec175fb933d2a0b16ec756410f024` |
| .imperative-drill-toggle | 1 | `5ee519860c59b3fc4e2a3299e48b67eb62d2179291bbd15094e9bf8fee8e843f` |
| .imperative-drill-grid | 1 | `7b81fd87230baf47e3661c1604ed89e682eda7b1f1f0466e2bd2b1f9ebcb8a42` |
| .imperative-drill-box summary | 1 | `87832e93526c22980cb79f40a9e985730092f013aeedd7a27438088ae4d904d6` |
| .imperative-layout-side .study-card | 1 | `88d782bc8c7d80ebb29aab81a238937783ae5b1a1c68005486904ef401d5d223` |
| .imperative-drill-box[open] .imperative-drill-toggle | 1 | `8e7aebb3419c92e37a2af8fba5305d972dfef43712394f8ee2128bc42cc7fd31` |
| .imperative-flow > div | 1 | `8e95801bce81a8e719ebccf99abecb91ba2f1bc442f420f57939118f47e0350a` |
| .imperative-shortlist-table .verb-trigger | 1 | `a5199e78af8399fd4b642e133684e7e62c5d2cc97eca99325e75db4672cc0e1b` |
| .imperative-drill-answer | 1 | `b697c79f3d467335152bc09a2bb72368772b7b0d9dc7166e409bc21bdb993ac5` |
| .imperative-drill-number | 1 | `b8a6088bb6c4859eb24b0db627bd992789cff3307fd1dc68eb78aa6ad7e29fc4` |
| .imperative-flow | 1 | `c3fb497a4678e3da100d6d78303260d84dc811bee4c9e9471a25fa96ec25e062` |
| .imperative-explain-grid, .imperative-build-example-grid, .imperative-politeness-grid, .imperative-tricky-grid | 1 | `d0d92270782bdb1f405313abd28765fb67b00c23c24653c5f763808227ec3a04` |
| th | 1 | `d981dd6236d9f418cd1e7cf385b7158e426e99bc7bf45fe32826d01ecd87b5d8` |
| .imperative-pair-label | 1 | `dabba598808ccc793b6f585169660351d5a196c12f8714cc8d5579c1707c422c` |
| th, td | 1 | `e13567325cd93ebdfe0a953c7b584a7fa5a330c07a91721ffb31432f75113310` |
| .imperative-pair-cell | 1 | `e4bb4b7c2c6f9dad4d17bd34fb29fdabad5fe3ff664c2fee868eb1a76db15dc5` |
| .imperative-tricky-line + .imperative-tricky-line | 1 | `e9bed888895d13fdf64649c6d3012cf5b64602e70af5d936f3d22f8adda10d28` |
| .imperative-explain-grid, .imperative-politeness-grid | 1 | `edd2f0ae9560e2d512106f20cac5624a067461f75ea763c3d4c6d5fcb7edff5b` |
| .imperative-flow-arrow | 1 | `fdfb6a5467ae5b6395d75af94e0a8b49090eb047ba633254827581b9945d2661` |

## assets/css/site/layout.css (shared-selector)

Registered shared surface owner: layout.css. Selectors remain centralized here; adding or moving a surface requires a described component/ownership change.

| Registered element | Count | Signature |
| --- | ---: | --- |
| .story, .mistake, .example, .number-column, .study-card, .info-card, .example-card, .pattern-card, .dialogue-card, .verb-visual | 1 | `2389146b233efc8362da89f0bf0dced68cbbf3dbc951b613a970485321a2e4a0` |
| .study-card-note | 1 | `24d30d976643191d2c88947d08300fe05338367d75741d969434856e5ebe05e8` |
| .color-card, .animal-figure-card, .transport-figure-card | 1 | `28afa5a030c5525a44b6e17e3f5adeb403c030e35798963744093ea15c8b9ef5` |
| .inline-note | 1 | `34650c8e1a76a6fd424aba99bf4973874a3326a64eb14deac98387467a2f176e` |
| .animal-figure-card img, .transport-figure-card img | 1 | `3ca9b798d0c0806e0f0f4a284f692a66ade58a4a49bc173ecfec6f030a18d5d9` |
| .color-card span, .color-card small, .animal-figure-card span, .transport-figure-card span, .animal-figure-card small, .transport-figure-card small | 1 | `3f752f91e8b9078ef98cf4e5144594f374cd3400134e5a8ea5922116f5ad3910` |
| .study-card | 1 | `431394ccda3beba590842f041c32a2bef4583ab911cd471766ceb88bd71912a9` |
| .pill | 1 | `4adc31a95fe11a53f94e7f8d1f831c44e1e4f1455262f3c3afce27876c49f5c3` |
| .demo-box strong, .example strong, .study-card strong, .info-card strong, .example-card strong, .pattern-card strong, .dialogue-card strong | 1 | `4b3491e8df9565faae0372173bfdd78a1fee2c79b0dced13ce0262e63caf6e66` |
| .vocab-card--review-toggle:not(.vocab-card--has-visual), .year4-card.year4-card--review-toggle:not(.vocab-card--has-visual) | 1 | `577cafcdbb99cd9cdb2027d7b01ed493f8b37c3c9f348e9a9fdfc473254d6641` |
| .pill-row | 1 | `632143aed3c2f4b3f9460420aa41046493f4ad22d879ad5164f5c5246f19a69f` |
| .visual-vocab-card small | 1 | `663ebfa5cb02f045b21f440ac88c2848530350c13519500c6cdcfb7a01a3db24` |
| .study-card-compact p | 1 | `7077b76f2efafc9c81e71edaca186a4736661d43a2fb6df05a2d842d0a0e45c6` |
| .visual-vocab-card img.vocab-image--cutout, .animal-figure-card img.vocab-image--cutout, .transport-figure-card img.vocab-image--cutout, .year4-vocab-image | 1 | `75a6e9da3c569656cc55177810eb4f82aaf4f5da441de94de5e26c40d4e2ebcc` |
| .visual-vocab-card | 1 | `7659ee9fa5b1c3dd472575fefeb48fffae67a3acd9810e5c23313ee7f1e0c2c2` |
| .visual-vocab-card strong | 1 | `84122e9475bb2b27cc5bc4982e2f408d8a6efb590f36f418119471250e36e921` |
| .tag | 1 | `888cac285c5b78581fc5b97984743e8e1b09deb92442483e53dc49b73ac82cf9` |
| .demo-box span, .example span, .info-card span, .example-card span, .pattern-card span, .dialogue-card span | 1 | `8be6822f51df291da3dcf891a43b27bc4b4535d72fa59ade5e9ebfb36a0a976a` |
| .vocab-example | 1 | `8c6fc93760b42ad4b2fbd62a9fd0c9fdef793a7923b73cfeab17c28df92f4943` |
| .color-card small, .animal-figure-card small, .transport-figure-card small | 1 | `9605eae1710122ac14bfc4596a1d10c7fc48869b80c167adc0d39b2d56469e2a` |
| .status-box | 1 | `98202e418fe6e660b1e189983db100caee8ba9b98182801ef071b35a806af330` |
| .study-card-large | 1 | `a4aac8b201335a3b14d9e534679e1b130e0e4345ae92f50006edb8935d4f6220` |
| .visual-vocab-card img | 1 | `b10aa8dbb34a03ad92919ba1e0a85b0b211ddd4eb5880a1d298fc40b64f6dafd` |
| .study-card small, .study-card-note p, .study-card-compact p | 1 | `b8c9bd7fd16ea625f610bdfd940d7d526082a2521769247d0b59382f440e0452` |
| .study-card h3, .study-card h4 | 1 | `b9c7d86fa7750b8db5e2c76d03aa3c23c8fd1778b060bdd9641a91c1e9bc5672` |
| .image-frame | 1 | `bcb66c7c124c93cb053b0a18e84e2ca6282fa14f7df4f26ad3ce6f90f61d9cbb` |
| .study-card > span | 1 | `cb4a82bf07ed7d68a8dde46fb3e9cccdd3bc1fd3a2e74e3476f7388b201114c2` |
| .study-card-compact | 1 | `d1c96d17422b3e0e2026caccab20a74c65493866a52664eca0e799df5af07414` |
| .vocab-card--review-toggle img.vocab-image--cutout, .year4-card--review-toggle .year4-vocab-image | 1 | `d306b5d282b212c3525749dadb7acb6e544d34eb0def324a0e821208a690ec1d` |
| .status-box[data-state="fallback"] | 1 | `e810abb999bf4d1821f71d1a7f9bb128e3d9e5d50e3599f63f5ee75d227fca43` |
| .visual-vocab-card span | 1 | `f6defc4a7375c0ba04b81c81c59853e18b1f99a34f6acddca846297bb437fae5` |
| .study-card-compact h4 | 1 | `fcd9388ebf8967210ea1938c4995c689296188e548f752649c2c3e1ab3844248` |

## assets/css/site/learning.css (shared-selector)

Registered shared surface owner: learning.css. Selectors remain centralized here; adding or moving a surface requires a described component/ownership change.

| Registered element | Count | Signature |
| --- | ---: | --- |
| @media (max-width: 760px) / .course-metric | 1 | `0471726519f55b2095f40dd8dbcec372e8054109d0d0ca6fc75222c0f030fece` |
| .course-progress-chapter-cell small, .course-progress-table td:nth-child(4) small, .course-progress-depth-cell small | 1 | `0af65a78ae6cff3cef8b93b49fe73bf804343d65354570cd9477cdaa633e1518` |
| .grammar-example-list | 1 | `0f04bd9e5dd07241aff1ad3c5720a73ee5610860ffea171c5b1270fb6a6964cd` |
| .course-recommendation strong | 1 | `1262717e0963c064a802c4e552a19ebea76af2f20ead54565419454811df49a5` |
| .course-step | 1 | `1982432f695923a3f3e50b3400379daff1001332ed5d51aa22be5caad40bf557` |
| .mistake-practice | 1 | `1e1fdbff097583bef227b4994f572c084d4fa558f30ce575d851588c3c9bc4ac` |
| .coverage-category-option | 1 | `22a58c5c36835ccb81653c66ae55ea01811c58efe6a75406e377d996a87a5364` |
| .course-target-list li | 1 | `275d9409fff07e48b5fe21b9ba8dbb772c0ac1877dfe777c54bf3ba59f8e530b` |
| .course-chapter h4 | 1 | `27ae9b173646e2a8f8f1dda86d0dd6ff150ff721d6683c9c1fc336d2f345e591` |
| .course-checkpoint | 1 | `27c9b14912c55d1a714ba17d5a7f1ea291d30e13c8b82a65f603a17843e6e5b1` |
| .course-progress-table th, .course-progress-table td | 1 | `287827b2ecee95f96a08089276091ca29740bab7f2560c2f0e6918a5590ad773` |
| .course-progress-table | 1 | `28baa881c4f809305ad172f7593ad12f48dba84dac6db12ad32cd85999c8c89d` |
| .mistake-category-filter select | 1 | `2a4b1800e89470ad18378ae6371ef00337b6a63ed412c57127025136627b4f07` |
| .course-metric strong | 1 | `2a591acd3f319910d4b1085957020f2bbf52f47da2c26ecb5487e3ef24bb3275` |
| .course-chapter-nav | 1 | `2af19187b47a38ba3ae6d4a4baa968289adc8b44d4cec1f748eee79b2a78f667` |
| .mistake-category-filter | 1 | `2bd1e2d7d1aa32491ce6fc21b80c2bd9d802ed6a1f9f1f2188b84f88482e13f1` |
| .knowledge-reason-list | 1 | `2cacc5551598a81d55f272b3a6f7c9560151403a6c368c7345efd78371b358fb` |
| .grammar-practice > summary | 1 | `2f60f2ec53797b8e0005d6e39d43303ee8e16a0524b8f809e75825132751909d` |
| .course-dashboard | 1 | `2f688dee2a4f1b76aa02d4016466033a65f943731a3f4bf9b0247c32020fc290` |
| .course-progress-table th | 1 | `2ffaab6188149f616e35393bb12ef8a5112602701f68e7da0fdcfb1446493bcb` |
| .course-checkpoint[open] > summary | 1 | `316ca04669dc2fadadd6c14c4a19ecfb5718b82af987916ee8e0b9864c954e48` |
| .knowledge-recommendation | 1 | `320f718dd382b0b691044fc35f04bbab84a63867024a10525a29312eb983ee2b` |
| @media (max-width: 980px) / .knowledge-metric-grid .course-metric:nth-child(2n) | 1 | `333c8a2482227802e936cb7fab54ff535d029fe66d96131c72c018af73acdb06` |
| @media (max-width: 760px) / .course-progress-table td | 1 | `355741bbfc79b7fa04db9a8487eb2ef88c7bc22cea2ed753bc76dc0eb5a75372` |
| .grammar-example-row small | 1 | `38d362e41228d39bd9de7ae3cb026486f60304544687bc2d7e7f15e0fbbf6165` |
| .course-objective-static | 1 | `38d9e104662a14a0c0e6ae9a8f59429547bf9795323b70d95489ed06a739e15f` |
| .mistake-answer | 1 | `3a24fd3c27517b587fa1a49980e10563c4e79910a79edf7198a5e49902b6af39` |
| .course-progress-fill | 1 | `3a46c758f08599d18ec5d680fb748217a820ec498dd9e7ec171ebac0360329ee` |
| .coverage-session-status | 1 | `3e022550f2d0b3271d07c320b0c18d215b5a7fe0e7a3ce476cf6b8d7074b19a1` |
| .course-step-number | 1 | `45e751f7dd9aaa3098d8813d968a17c7aac51fce342db7a33a18be4d4a72301f` |
| .grammar-rule-box | 1 | `48d503bb82ce802c737e9302c697cb0a80bbe4806601aab39da178448e5d502c` |
| .course-page-link | 1 | `50b5475b9c4b9fe173b540ec691f6dc76c9cf3aa1bc0b31be6b8e52b215ab635` |
| .course-target-list small | 1 | `54e5e0a583a1e819dba363429d4d96a887b14b04b8a928547fef6c5431db30f0` |
| @media (max-width: 760px) / .coverage-metric-grid .course-metric:nth-child(-n+2) | 1 | `59d1ef9cd66d409f2fe2788456e616ef642dc11e2648bd238508f2b40a8b19db` |
| .coverage-controls | 1 | `623ca4ea2d7deff271b7f5f3c22aae2cd3824e63c4798d6cba1bcad966bed5b7` |
| .course-objective-marker | 1 | `6602cc20c96b2c91215e8e3be518e575b90686b4c6dce54a6e24db29cbb3d7b6` |
| .knowledge-focus-list small, .knowledge-empty | 1 | `670a2519470f0dcc3d81b25637666100df6517753ff9460fa2f4f038ee17602b` |
| .course-context-bar | 1 | `69951768c25ffcdbbcaefbc42f9ec43896c482ba15d4f3312b785e90fb6de4be` |
| @media (max-width: 760px) / .course-progress-table tr | 1 | `6dc4a1aaf0bdd467bd6e5709f5a3e97b31f1285b415b8f0283f147d5e89f20fb` |
| .course-metric-grid | 1 | `702ca92a27f1849665814f7d50f4b6bc04c9c985b2742e3862dac6cfaa07593d` |
| @media (max-width: 760px) / .course-progress-table td::before | 1 | `747a893fbfa5c14741d34fe2417b8752cc67ab572f694b88b1119faf79288a51` |
| .coverage-progress-percent | 1 | `7778225f0ecdc00eb6e0acc7504058ea76161a1714c49d945200d85958c3d2b0` |
| .coverage-control-group legend | 1 | `77bf539ba4c58513a49b5bb4749493095c06ef982caeef105bfb73c4ebfbbe90` |
| .course-page-link a | 1 | `7d6eeb99f19dbfd2cc42bb6c400182d882612f6f7d13eb0611c7ee213a39f509` |
| .course-metric:last-child | 1 | `7e751c874781ea39a66131be8dbfb411112c048d7bb8adf3e09e1e26c2ca1e6c` |
| .course-objective | 1 | `820c799c0c740c6a8b2c8d17d2142881942b63a86186cd9cb905f78d79d7f490` |
| @media (max-width: 760px) / .coverage-metric-grid .course-metric:nth-child(2) | 1 | `869fdfe8a5386b82f07fb63d32912051835a6b2adede1ed08bf2211f4fafe50c` |
| .course-progress-copy span | 1 | `87b6b7e5c3f0c7afc812c874bfcc3e588b354451b565504520caea27cae3c677` |
| .grammar-practice | 1 | `9d1fcab1152feae8b13d1b9b78880c2bf023c234141c5721aff754688a6e9de1` |
| .course-step p | 1 | `9fc8e8b337eb1ce5abf2f8de50d18bd7da704711b000eb7fdc07b0394ec50f40` |
| .course-page-link span | 1 | `a08584e165d627077fea9bdc914cb57934de05840a4ae99e62b551f45bebbcfc` |
| .course-metric span, .course-metric small | 1 | `a24182082b5289fa5f92fda52c7d36eb2c36f1dee069c9461e3110b06850d085` |
| .grammar-example-row | 1 | `a3cba2c3cf819e9d48c2569d190f320e5398677eca147d7a411d150ae4090b6a` |
| .coverage-category-option:has(input:checked) | 1 | `a59b3d010475c77af312a5a6b58eda96306a3e078341ba05d47bbd860fd7f0e1` |
| .course-recommendation span, .course-recommendation small | 1 | `ace5a32c099304f9d22f666a18f8276c90c18e7d7f28586e9b55952d69d4293f` |
| .course-recommendation | 1 | `b1e49fda3e440b535ba2001be0571b413d545ae2fbbb9c5fd3adc1b46293045d` |
| .today-primary | 1 | `b2beb2e9447459e449e834c3ce436e9f93ebcfa4aa716023fdb339adc98afd33` |
| .knowledge-focus-list li | 1 | `b3eabc3c9bea6df2c6cf8e86cde085eef711f6ad2000013e72cd1dd652fc4cc3` |
| .course-metric | 1 | `b606eb9759a1a7aeb7fff07136f444518ed086112e3547e38a15321887d54b68` |
| .grammar-practice[open] > summary | 1 | `b734d4f6a8f8c525c70ed69b379f22520e0187213f79497af826ff059363f90e` |
| .course-step a | 1 | `c40f8e1ecd89041c6d4a79079e144a103fd561fcf0a0a0fc7b2a9d1900dc2262` |
| .coverage-control-group | 1 | `c45021c918ef45cbea5526969e421a3251204f50f3d1a9611ef99a5dfc178e40` |
| .grammar-mistake | 1 | `c82277d86d806e17e59108152416a355796b497b741130e60a2e08e510666982` |
| .knowledge-focus | 1 | `ce95f693b6dc199e6feb55be806ced84b044cdb2cd504d65c031cbde2fc5986f` |
| @media (max-width: 760px) / .course-metric:last-child | 1 | `d1a229c8738652dc36d3becbe54871a58310eda57c85bd43955f8ddc7afa746e` |
| .course-progress-track | 1 | `d51a5094e28c82ebb556558b3c604076f136bbbb00011e60c67391066f5bb84b` |
| .grammar-target | 1 | `d6ab35f4884c113dfd32dcd36fdccbdb01a637a0f4c95e8de0c4e6b92a783e27` |
| .course-checkpoint > summary | 1 | `eb31ec3c314d09734a0cd6a21eb881b62008de598884b532759f8b6c7e4f07d4` |
| .course-level-intro p, .course-chapter-summary | 1 | `eb6d4f3b2aa62b9f96f7263c8844d73b1a4f483e954d60d0fafbebd546abe84e` |
| .mistake-entry | 1 | `ee363b4c64757034b72809267c11769f5b031a8f48c1814e6a443fcd8178052f` |
| [data-content-id][data-course-role="core"] | 1 | `f2320a9f57a0ffa285071111b3410285928f7826ac1024684790c5485b02f193` |
| .coverage-category-option small | 1 | `f3843bf3691711a62e6b647d9b5bf0ae4495b07e65520b88135b66d7bfb4eb65` |
| .knowledge-focus-list a | 1 | `fc0307e9d11766a791724a6991a34898dd30447c5398642d1d7ca73bff2dbcdd` |
| .today-action | 1 | `fe130db65582ab2ee2d9bdc88df29d332feb9bfab0a0d7a73b10ca012c071c9d` |

## assets/css/site/navigation.css (shared-selector)

Registered shared surface owner: navigation.css. Selectors remain centralized here; adding or moving a surface requires a described component/ownership change.

| Registered element | Count | Signature |
| --- | ---: | --- |
| .nav-menu a | 1 | `043dfb379b02a55ea55f899bde0935b2da87531d6304a9410386f5042c2ccdd6` |
| .site-search input | 1 | `088ba8187cfdeda3ea2f24146f60a12fff50617379ced4b5bb8e204d0b24204c` |
| .account-menu[data-sync-state="error"] .account-initials, .account-menu[data-sync-state="attention"] .account-initials | 1 | `0d3402d34f376c122fdb90003e1ce165581cf2dc7d5ec9f1b157ffd472e3c953` |
| .site-search input:focus | 1 | `12d1fe19cf2b2d9c9ec81141b60c2149d26031f0c07b3645d3c5fca468e65cbf` |
| .account-trigger | 1 | `20477d64db0a3c34ddb2cc87bc0d56ae29a9cf6d9579ce257b5ac2d62fcf343e` |
| .account-primary-action | 1 | `2589bbb78b139ba1fa767cc6d52a580bbb4440664dc104e1d9ba4af2a38c9c22` |
| .account-panel | 1 | `263434b266dec82b08067effe817de1d96f9e8c66d30ed58a1abd0f47fff1473` |
| .site-header | 1 | `294df17bfa1a76d309f63b1729335cf72ab574d02bb85b8e048d6f9be3a12df4` |
| .example-line .en | 1 | `2c963cac4aefe3c2ec6ed8161785471818a66fbcb7a10ee742dbc71b08fcf913` |
| .account-email | 1 | `33a9dc3a34f590a6da59d39c0bee680df95a724b10f78754bd89aed1b7c5bc00` |
| .theme-switcher select | 1 | `4f87dc5b8a798a56b4360a60d0c419dea0f4bf4813ce46868fd7e81e39a8e917` |
| .site-nav-toggle | 1 | `55faba409db57525218a66659a08bab26daa18c8fe15c7f32b898321bbbdf5f9` |
| .site-search-results | 1 | `59c3a31a04e66ed09625b74bc61dc49779a6c5a7e8bc1a8fd52ae02c2ab80a8c` |
| .account-menu[data-sync-state="syncing"] .account-initials, .account-menu[data-sync-state="pending"] .account-initials | 1 | `766f09da9b42ad57c98247a327998377129e21b24a6ac6644c727411e7cb86e6` |
| .site-nav-compact .is-current, .nav-menu .is-current | 1 | `7bba67cd55981f268b327d9bfb94469ab6266c2f9cc74cceb58c04f026c3a29c` |
| .nav-group.is-current-group summary | 1 | `7c54b05d4db1ad232d42abaecb8ab6fdefbb5aa9160212b90dbac0a12848f19c` |
| .site-search-result:hover, .site-search-result:focus-visible | 1 | `7cbadcaceb7d32f5a8686f89a656081495a45f4ca0db931f5b2bcb018e20bc8f` |
| .sync-conflict-dialog | 1 | `7d15362ede97baf2cf6007d3cd8cc0a1464dd407d4ac2527ff719dbe3094ab93` |
| .site-brand | 1 | `7f6f64451c81805f0e91fd6fb2eeafe36442e4a06c95313ac9af9d4613744887` |
| .is-search-target | 1 | `7fa616b558c571d54ea6aa1049f9f1bb64e6b1e0f1c7553ef2bcc4eb6f503ea3` |
| .example-line | 1 | `897202593b030d5c3a0777812aa1f7464ba6d042f488d3d1e22227807ce3ee2d` |
| .site-search-result span | 1 | `8a52dc65f75af81292e00ed3f5c9c8dafd1afebef3490ab8f771520c54809e42` |
| .nav-menu a:hover | 1 | `8cba12d4d74e7292c34d37eb689bc878121d8f1943fdaaf09450ef1c97184df4` |
| .account-primary-action:hover, .account-secondary-action:hover, .account-text-action:hover | 1 | `9262fb9d07f6df0cc55b5dd1e3404075e3436618599f9b38ac218f17e3a856c2` |
| .account-initials | 1 | `97f4cc0173900d8e4ea69c761535bb49982909dad693b329ffe2f0a9ee9005fe` |
| .example-line:first-child | 1 | `9a3d14c12c9c83ccae94d87697908a39a1555a21c16ad222618f5805ac92cff1` |
| .nav-menu .is-current | 1 | `a0229290a383b3d2154e0e2f092ea1fb138ebb815a53c2f0c806523abcf456ca` |
| .site-nav a | 1 | `a04e5ebc884be4887fa6fcc3a39da741d584728bdd0b4cde43c042eeb7106e01` |
| .site-nav-compact .nav-link:hover, .site-nav-compact summary:hover | 1 | `a15512b373d367a9ed94e9e46064c59af72da12623aca2907f5b1fdcecd429b6` |
| .account-sync-details | 1 | `ae94cee2f409721a18951ca15911e88576c53271a79ffdab7d10c4f664416816` |
| .site-search-result | 1 | `b05c403796c3fbfc13512f31a3a05b2e7e00f3ac8a3f6124d7b7a671a9f463c7` |
| .example-bank | 1 | `b2c6abb65851421c113dcf97e5ecea83d08137099fc92d69c7e002606a1eb257` |
| .account-text-action | 1 | `b5be3486dca7302a12bfdd23f7607f22a40c71e960b6d39334a02169807a80bd` |
| .site-nav-compact .nav-link, .site-nav-compact summary | 1 | `befeaf4136955a797dae6e16c2bf1d773abbbc4e353e761a5fd6c5b2488005a9` |
| .site-nav-compact .is-current | 1 | `bf5e007db9039f5dd5447273e1602b321223bf34ef8f3943dbedb911df28b89e` |
| .nav-group summary::after | 1 | `bf8da669adcd067afa08d7bb294ca58a0193d560d821680ac4d793e92f55f4c4` |
| .site-search input::placeholder | 1 | `c60b5548683136da4cf8f99edfa411907f1212827a8b2a4efc24ce9f6e021ab8` |
| .account-primary-action:disabled, .account-secondary-action:disabled | 1 | `c64c00b4ea0daf66929619d779499930ed8b73ae4e0597574dfb65331f2d3b05` |
| .example-line .mt | 1 | `c8235f45656d0381d6d0c7f71822dc25cd65125c0a96c46832d75eed684a05ec` |
| .theme-switcher | 1 | `ca45126b1576c3c47e6d15a39eca741bf13753cd8051e244461e84fc495d9c07` |
| .account-primary-action, .account-secondary-action, .account-text-action | 1 | `ccc1c59933c58f52f41d969ae910137d38f0f8971c5523e048706ae57ce93f72` |
| .sync-conflict-dialog::backdrop | 1 | `e13db8d8422614dd49b8363738553d219f89a4d545430145a98575ef13ab310d` |
| .account-secondary-action | 1 | `e65bc638f2441d4d91762f7f029c3c035940626d191ebf3f840a965fd4b97f6b` |
| .site-update-notice | 1 | `ea952fce82980fe2e0a3622283a995f7613e11d4eeac48bb2934b8262d4840bb` |
| .site-nav a:hover | 1 | `f1082c698f8e019d5bd8910c9cbe684704635fef46a58318d8b0ab0e4a955031` |
| .nav-menu | 1 | `f12514a0d3b16e1935a3add5881ffdb78706bbcd75e4844c856fd7eb6867b730` |
| .list | 1 | `fe8627ed0c7a8a77748099b6d6765eb411834df6ad2bc3d16d98e306dc185b7e` |

## assets/css/site/print.css (shared-selector)

Registered shared surface owner: print.css. Selectors remain centralized here; adding or moving a surface requires a described component/ownership change.

| Registered element | Count | Signature |
| --- | ---: | --- |
| @media print / a | 1 | `43fe7cd9ed1da9f2890b5f829620bff6f6b9498e24ebe3a761eb98918c1fda67` |
| @media print / body | 1 | `515cb2db9f0eebdf54e046e84e4f89610ba3f670ee8a1b5c39d205608fd215bb` |
| @media print / .hero, .sidebar, .card, .content-card, .section, .resource-card, .page-card, .study-card, .info-card, .example-card, .pattern-card, .dialogue-card, .story, .mistake, .example, .number-column, .verb-visual | 1 | `73ca3df7ec02d7db86e89a3f2021fed43ad3adba74b19dfb543ef0d29ae3c26e` |
| @media print / .printing-sheet .print-sheet-section | 1 | `a777334747de718494a2931d01e6ae092ca1b9a5002ce1e39865df56b125a753` |
| @media print / .printing-sheet .print-sheet | 1 | `b2769fc00d09392e52607b54a1a39355709fcf63d27cfea375e4b47fe36cba3d` |
| @media print / code, .maltese, .maltese-text, .sentence-text, .question-text | 1 | `eabc4ab609280bc8e53b883a4092628df89819b7dda94a09e158902349e14d49` |

## assets/css/site/responsive.css (shared-selector)

Registered shared surface owner: responsive.css. Selectors remain centralized here; adding or moving a surface requires a described component/ownership change.

| Registered element | Count | Signature |
| --- | ---: | --- |
| @media (max-width: 980px) / .qa-pair-part--answer | 1 | `00bd6e1e649245a6dcb8ccb24d17bdbe503d72130b6c570bde22c4cfc3a344d4` |
| @media (max-width: 980px) / [data-section-review-row] .action-button | 1 | `2e2eace497efb566e5968e7201c398194171f51c65e8a3f5371d5b38a0b11ae2` |
| @media (max-width: 980px) / .card, .content-card, .sidebar | 1 | `322ebd6f79ed9bd4482d6e8b62057c35a7046e94965579d955c6be1b6d3bf56e` |
| @media (max-width: 980px) / .nav-menu | 1 | `3af2084c1d017e872b4de63da07e7d0e6384e271a091f742e1c16ad49240c502` |
| @media (max-width: 980px) / .sidebar | 1 | `4bbb878402d4de290535cefcd24479a4504d58cecb9abc1f918d4fbb7a90a669` |
| @media (max-width: 980px) / .account-panel | 1 | `59b465bd0791997b902aa7bd50ebeeae45c10cbcd22f6867c4cb0dc984055b69` |
| @media (max-width: 980px) / .site-header | 1 | `96602049940de876ddbdef4a829a34d7f0faf5b3d31d0fe6764728d27b7b265e` |
| @media (max-width: 980px) / [data-section-review-row] .status-chip | 1 | `b38e402bccb476906f764b7ffb0d31508cf41a9c018812c60a0eb5eead3a415a` |
| @media (max-width: 980px) / table::-webkit-scrollbar-thumb | 1 | `f40a10530b2d4eefee65b3f91a125674bcc16ab2ed587d98022563fc964080b1` |

## assets/css/site/review.css (shared-selector)

U04 review field migration removes review-select and review-input/review-textarea surface ownership. All 26 consumers across Review, Memory, Word Builder, Word Search and Year 4 use study-input; retained review classes own width/resize only. Other review surfaces remain registered debt. See docs/analysis/review-fields-unification.md.

| Registered element | Count | Signature |
| --- | ---: | --- |
| .review-session-grid | 1 | `006724afcb53b1441218f858c93f3808b2c9a3defef65c3f419d7be16075abe9` |
| .review-saved-top | 1 | `017e700092b39f4cfa641ac0a2f406d498a20eaaee7a88c2d3b372c36c53370e` |
| .review-fab | 1 | `052f9ab93021fc3b13c2788569e2079d950bac066237cdec3871264938620372` |
| .review-saved-panel[open] .review-saved-summary | 1 | `0a235fdbf5865f576fcc7e83c8c61de86a12305777a242eab299f7d1254a368f` |
| .review-empty-actions | 1 | `0b29f8953b1599afcf0ea44b3b629865b5e29bf13d14d85f502fa5414aa483bc` |
| .review-add-button--icon::before | 1 | `0d19067839fbeb210d35d811f8aab69d356e0e5557c4739c6426ba32785c68bf` |
| .review-topic-card | 1 | `0d863b34c4315c5d600de465c465cd6db65c9c4ee03b379552d6284a139ec9d7` |
| .review-form-grid | 1 | `1219d48ad09c0054f9aa0623cd64d9c4906d333ea0f86cc9ce4fa4234b4718cc` |
| .review-word--prompt | 1 | `1876c6cdac1c688b66a2f57c8871ade6eb49dc5e4ee104b44a173f7cd56e791f` |
| .review-saved-item | 1 | `1a65ad6377d97d1c615d1ef5b0e4cd3ef864a441dba6fbe4ac19864657a09201` |
| .review-word | 1 | `1c563afa26e5616ff0e1bf3c45b8f7b5cc99ee22b00b1390b29505a3920a8815` |
| .review-meta | 1 | `20bc22607a790dde627f3b7e3c27a850b30c3f24a3e1a8857fa0ba81e2b306fd` |
| .action-link, .action-button, .review-add-button | 1 | `20c614907b9162c9134cb270a2e014dc2bc7d5e622aeb51f986699ffcbc19617` |
| .review-filters-body | 1 | `21e497631c48c86ad09334ab4ba4cfc39ffc88e3526dd56bbce5d3449c6108cd` |
| .review-check small | 1 | `247b8c2f1b598b9439cd8c22ba9d498f98f2368b26d93b2678eb448a8d2784c8` |
| .review-add-button.is-added | 1 | `257788c87b9908c283b445b021ce6cbaaa109c9d225a8ab1e65ffbd583e41d61` |
| .review-filter-grid | 1 | `2c20ed2f844cb14de1ed0f0cc0f2236cf2a36747b99d824306d2a6e938ed1425` |
| .review-flip-face | 1 | `2d1241d03a4534c40b22097ff4af9ec436c91d848d1f0aca876ed5debb7d9887` |
| .review-flip-face-inner | 1 | `32b122a48270df8a169b2c5cbedd239f5d066d18587de29a6726a92df630107a` |
| .review-saved-panel | 1 | `33abaa3172ff10c3e7e9b0569286369945580ec82e7e4a31cda115057c89f7dc` |
| .review-image | 1 | `3cb042df0f71903c600d6495489018a6ccc52dfda7382c569a623c0ce41239fe` |
| .review-topic-grid | 1 | `3fc655a650720fcbb1dde96236da756bfa9c15a09cbcf6e8d1302752f8449888` |
| .review-session-bar | 1 | `407e1a6014a1c1e8087342109007801e6b50f088d09960ad19b698119b6ac5c4` |
| .review-meta-stack | 1 | `4165f4cde8eda771be3132052adf9a00b3f8d8b0cf890e8340e8611c9f2e5812` |
| .review-color-swatch | 1 | `42fe0595dbd4815eb345011fb4daefb720f2ae85009c12a1df83935e12b94ff1` |
| .review-filters-panel[open] .review-filters-summary | 1 | `431f0f08360762e729122fe6f7c1e6e419b48f6efdecd3561b40e91ea104fc29` |
| .review-saved-bulk-actions | 1 | `49bdbcdb3acd5557c42798be2e6bcbf1e9c3d4f6d1d40573196ce4af683e3bc9` |
| .review-topic-actions | 1 | `4bedfe70e7209d39bc6f2ca758e1a2921a083dc394b142f54cc89a105e690185` |
| .review-add-button | 1 | `4e8c52e258b01d33ec2b4258f694fdbc7678dc9e93e51cc171a7c461507d99a3` |
| .toggle-images:hover, .home-toggle:hover | 1 | `513a6e5a2798575e65d588b4023888f9849c02a1116b25ccaf32ebfa2131c793` |
| .review-topic-breakdown | 1 | `539c23b618d443add0718134f32a4ff857e9c938232fb15dcfa04fa55c7f43fb` |
| .review-topic-due-badge | 1 | `6459f81aebc4e36c9d4e2c21aac00193cc7c38b52f53a11f4900ff5aa7e6ccd0` |
| .review-topic-load | 1 | `6715d2ccc15b179bd28565f4a14afcf79de677a0703936d1a606212126ec2c03` |
| .verb-drill-card | 1 | `685b0a4adafa08577f8025acfaeeefe38f4cb51446bf9f05fa0c244b52700037` |
| .review-session-summary-card | 1 | `68d4587680b72a33810d0b05578b590f1cbd1392c58397839db74f8c99a69ae6` |
| .review-actions, .review-grade-actions | 1 | `6ea8bb1359e72aaf122a592d2c5195f056fc5ca8a5749fdafb97f168d9736f99` |
| .review-topic-card--clear | 1 | `6fa846af051286f40fd0dfb720c233472b3de7f70b592d31d44400ccd82d8fd9` |
| .review-fab__count | 1 | `713cd6955493ebecaef6594e854b8d86c268f0197afc10e21caf021ecde745e5` |
| .review-saved-title | 1 | `7147895788a8519cac9041a233452d07f88dced5763183cd1005c08a8ed16d25` |
| .review-topic-button--secondary | 1 | `71e45bf332ca7fbd4565ba132b80ffb6a6ab3763628d69f7bba670b9048b6cd1` |
| .review-topic-chip | 1 | `7830b4f1d81589b28132b9cdeb9339a1fc91c6a0b814be6b9267e2185e7ad3a3` |
| .verb-drill-card p | 1 | `7924a22770f396d2b4e09981c5ec2dbe8a8570943e4dde683facdb13f3376555` |
| .review-topic-top h3 | 1 | `8812223406976b293b0f020187546030ab82310e7fb49b78b4f257055531ae82` |
| .review-saved-body | 1 | `894d7db62b4e91a45dc51ae368744a40d84617f72cc66f50b504768a86084903` |
| .review-saved-list | 1 | `8aea4ba420c9eb201e617fb13100070c1cf939069cff3a26346b9c84991ae88d` |
| .review-saved-summary | 1 | `8b930b6bc20227baa2593b08ce46ce887a0721b932cf01779e82332660d85d29` |
| .review-topic-button | 1 | `8c02bf30026e573fc5c21a0ef826a96f34734324516630486d66b96f85312a9a` |
| .verb-drill-card h3 | 1 | `8c7b77d4e992dfc00d3c83b4655a2f4825db087ae3080ca59c82cca6e625f7eb` |
| .review-add-button--icon | 1 | `9030ed0976062884341ed13eb2c119efcb5b997230e262f1b028296294ed1a3e` |
| .review-topic-total | 1 | `918d21b011d3d5ab9fabf28a4bf24b48a9a3eef541dc2bdab1050b680e6a36b6` |
| .review-topic-card--medium | 1 | `9e2194a48fa5964174222198f9b9aabdace237dd071270b3b2bb22d5e907e2f9` |
| .review-session-summary-grid | 1 | `a1c5ad0922265a3980f05c11be3671dd5d19461b72bc2bdee975f980a0a598c9` |
| .review-fab:hover | 1 | `a48905be7d0ee1503c2d19ad6228dd90e4d9542900279323788d1385b54204ab` |
| .review-saved-tools | 1 | `a56755c72cedbf035e9b3e37f5b986c3e804cf41ee8db46dded5e3fe83b37559` |
| .review-filters-summary | 1 | `ac0bc1b716dafaca68d4d2e116c4f6bdcdbfbb2a7dd698958083bec805f93cb0` |
| .review-filters-summary-text | 1 | `ad94f3d991fee0626d346d1da265fd31cc58fd88d71c97ff8e0289d142fd5b77` |
| .review-filter-status | 1 | `b26ff1bbe2c068f4253935c639520d463ad0671ec0befb970d1d4a814e6f5d18` |
| .review-filters-panel | 1 | `b3343c94465b6ef0a281d07b1db787c6a2dd05d97cc6ccb8863763534737cdc3` |
| .review-topic-card--heavy | 1 | `b514a1926e9f5ec744f6c14cc77ff806a74cc416f953c309dbade574b6ee576d` |
| .status-chip | 1 | `b6c2dce15957369fd6ff11ba630518b7d79d235b1a38b3b6c85c3d1a830f488b` |
| .review-flip-hint | 1 | `bac11b6d7ed75f57bc4cbc6edb57cb7c30fe5f20bffa5f8d035c21a7326830a1` |
| .review-saved-summary::after | 1 | `bdb31ef1bb798fbd18239ee91a4cdad14d6a61220a81c15106b0dbe3a06c8ab6` |
| .review-stage | 1 | `c23ddee7df4dfd148ef3260717a471a527d4e8a82722f88c4723f1df6eb19583` |
| .review-add-button--icon:focus-visible | 1 | `c6295af8d9a5b520483a7f03db24ca502f1a4077196945e49ba932324b38cd1c` |
| .review-flip-card | 1 | `c7ab2098f3f9e57acbd3d40805e140afee449d08c65eab3b8802f6ec23f8059c` |
| .review-topic-due-badge span | 1 | `c881b8a56b7c042220ee993136f05c0cc074f60f06e63ba051b2ffebeb7675b2` |
| .review-empty | 1 | `caf58447fff3426ef8a4b9cb0e8942b0e9a73cb4a7e1274cd0d0317c332df6d1` |
| .review-topic-due-badge strong | 1 | `cbace8ec0cab44abd52aeb99f8f23d84da74f2e09f51271285b67849a98602e8` |
| .review-saved-chip | 1 | `cd668b20a809ad333a0f0eded1c51915e1a15e2b6d60396dbf4ef13833f5cf66` |
| .action-link:hover, .action-button:hover, .review-add-button:hover | 1 | `d78431bb125f9e4b3817ce742ce70b7d8d0d9bc511cdcf45163346b3656a9d9b` |
| .toggle-images, .home-toggle | 1 | `d8ee427bc2613e4b64399fb604248b615d07565921295d979b1691aeeccca243` |
| .review-saved-empty | 1 | `dd94d65996fb168f07ce4a40898cc24b62af4db517292d777170bdaebd06f843` |
| .review-card-body | 1 | `dff62d9888b5744ae44f3b17099359e988e3836d403fee6572f0d18ce4a777fe` |
| .review-topic-card--light | 1 | `e07fda9038967877b8055f060afa3752310a33414f7ec4926d5f7efef0a7fea5` |
| .verb-drill-grid | 1 | `e2bc17b4e040bbb0215e83cc6e8af7caf5b978b8a51209d937872e946f1901e7` |
| .review-answer | 1 | `e80581fe868fb7be67901a41927a9ac364cfdd41afb7fe6654cfd4c3ce25049e` |
| .review-saved-summary-text | 1 | `e8d476eb3bbe0d62c905e54251eb0040009244b00ebea35e64397c07686f74f1` |
| .review-topic-meta-row | 1 | `ec02b5e84615c749c90d3961927b6a75f30a4f6a9eeeb53f7ceb2354ad131f9d` |
| .review-card-shell | 1 | `ed3cc46757ba3f7db665833566b574790a99cdb842ae31f00c58479a93a50ca5` |
| .review-topic-empty | 1 | `f3b9c49a34a192f11cf8b012a8ee98cd137ac38379b4a82acea16095af9adb5c` |
| .review-saved-meta | 1 | `f91e68cf75257a2f8647e5cdf0440b45a27f7322e51f3d9d539b1b10f94e79e6` |
| .review-check | 1 | `fe083cb99d8780ccf1827bc848ac846797640c2ddb2cc61b89e1d6a5d3d2b02e` |

## assets/css/site/verbs.css (shared-selector)

Registered shared surface owner: verbs.css. Selectors remain centralized here; adding or moving a surface requires a described component/ownership change.

| Registered element | Count | Signature |
| --- | ---: | --- |
| .line-pair:first-child | 1 | `127af27833b4bb7ab0b82a0b876f2dc129c91e0c2eae51604ea666783e8404d5` |
| .table-soft | 1 | `24bbe74d177c6337cc5b8bb1fae1098759fc6f7a38da0dc9bb06bf44bf34bae9` |
| .verb-table-card th, .verb-table-card td | 1 | `24dae3ed6fe22a0e88a59651de6a89b3db68fc05b2d024a6323b1e01dbcfaa93` |
| table | 1 | `2774e93a32bb43f318203445650830592935c6e595dec89bcd30889c35fb3449` |
| .course-verb-paradigm | 1 | `2b52e3a8aa415309a7736ca2d37d100331ec07785358cf07699dc9e5fa96deb3` |
| .verb-meta-list | 1 | `3b923c0066e0b361d1c72a6f529a9ade545ea73c29a1c4e7c6e2cf04f4b88b61` |
| .verb-match-button | 1 | `3e6c9f7780800d6594844c3e388b6f2dfd24a6fd1ae4097266e9a86c6a076e89` |
| .verb-meta-row span | 1 | `4407aab98a3e926e7b64b15c3d0208f7fd885968b644704294df5e00a23d3111` |
| .story > table, .mistake > table, .example > table, .number-column > table, .study-card > table, .info-card > table, .example-card > table, .pattern-card > table, .dialogue-card > table, .verb-visual > table | 1 | `50cb2dab6fad68002324d32151291609b7b1dbae54188d77171dddd5f25e19d0` |
| .verb-dialog-close | 1 | `577da650840b7c29ab793e4f81c432753244ea68a78486d860ebf60bad05b18b` |
| .verb-table-grid | 1 | `5ecf85dbe429bf843979646630d120cfe6945e11bdcd693e28a4862fc53d5789` |
| .verb-table-card table | 1 | `641ceafbe9360b4feeadfb54221ade8cf3e2900119334e585d59089896b48e59` |
| .verb-dialog-open-main:hover | 1 | `65c54a5584d604b7526c15b22aad54ae82ebc33192addb1f6a3f43888b0ee333` |
| .course-verb-paradigm-title | 1 | `6af3232a0ce59139de2b12a642487f797e880952d9a0013082866187579fb534` |
| .phrase-dialog-actions | 1 | `6b0ec7527909d5f1a6ac7a90c54d4e97e53f57c8f9ad2bf4f159adb156c97223` |
| .table-soft th, .table-soft td | 1 | `6cea4ee8090da2d7e7488fd9a7602f1f3441126413242ba0c138447c8ef899c8` |
| code | 1 | `6d2b926f01d57927c1b38509871ee97389b2a8f86f122f333b937009bd2199ef` |
| .verb-dialog | 1 | `70f827eba598ef71cd7f81252ae591ff2ad6690c0d078c88879f98e15a54dc80` |
| .verb-meta-row strong | 1 | `7876d45f610420a93fc0b678889208f9635edf833247fc720497a06be01893fc` |
| .course-verb-paradigm-list | 1 | `806ee1aba0a2a60857f4920be20a96fdffd889ea72b8793fba8a01900da8f8a9` |
| .verb-lookup-output code | 1 | `8086cad2d2a4e14368b0f46be4829b12fff01101389ab7852d403f5022a327f7` |
| .course-verb-book-toggle | 1 | `8179e1ecfdadfab562f36d32861f88439fec1293261bf0be0d5f3fd1ca382ca2` |
| .verb-match-button:hover | 1 | `8e944156229dccce292ec0ad9c53977ffa85125763dd2d38a985817f20c4eb35` |
| .verb-lookup-input | 1 | `9d0bc517ccfd812c425ac6b956aae01ea24a93b56b8ded72ee8e02d50106d3dd` |
| .phrase-dialog-line | 1 | `a66b3c9776b9aae073c4be0f0aa669de9a969bd961edf4d7945cb754ad9ae79e` |
| .verb-dialog-top | 1 | `b05fdb346509ac1f79ddeea8a26a4021faf70d2bc298a5c4ef1afa4693d467b0` |
| .course-verb-paradigm-body | 1 | `b3f69bef7d6636f77f48dac0cb6411121a4fb974a4023f303595f392659cbb5b` |
| .mt-line | 1 | `b84e26af38104051ff965ea626eff950121b2ac4c3667a5ee202381cff42eb42` |
| .course-verb-paradigm summary | 1 | `c26f025fc5779777598690dc068d3541f8253dfab5c65f748e685d92ab3b77c5` |
| .en-line | 1 | `c27535f44d4804c1a63ff4df317c6098161832855db385e3ecc0af27a7db84bd` |
| .course-verb-form | 1 | `c28bfe6fa72fca532fb3e907b5c414ee668585818fded4c9c3a7596eb5b0fcba` |
| .course-verb-book-toggle .toggle-chip | 1 | `c5fbcd9ed6865b03e1e1b211c6d7913abb05323a976d9788a7cb9c8ef5a923a8` |
| .verb-lookup-form | 1 | `c85f59a2b4431e4812ff5dd100b2f7b62abd40f1863c3e14902a289cb4679d7f` |
| .verb-meta-card, .verb-table-card | 1 | `c8d4da03ab296fa9797ff552c8e6e66617f1ab1d75cf5c6c757594b7791644bc` |
| .verb-lookup-grid | 1 | `d4d831a731a62a0da5f6a5ecf2df3348ef6247c85636f32bd6b09e6d4bc4c4c9` |
| .verb-match-button span | 1 | `d532e6c6e8dcedf4a252a8f87ab3b04192173ebaef493ea5ced4fab2c86481d9` |
| .verb-lookup-form label | 1 | `d5d63766cced2c2ecf1ee7388740e6d5a8799ea062abef092a4cb34d4ade0e9b` |
| .verb-lookup-input:disabled | 1 | `d6f759bd63f5614f06b481ab727eb24ea8ed089d3cbe1f403cae93a6480e98fa` |
| .verb-dialog-open-main | 1 | `db8c7646170cad39cff9e0260fc8e86048aab2a8aac47d0d6d980c7418fb0661` |
| .verb-meta-grid | 1 | `dcb9ea66d629030929ffc6f4689cdb44d80114ac6064db4684b39cec5df09ea0` |
| .verb-dialog-top h3 | 1 | `dfa8ec0ec6ee30f49b6f60308ac61b87d7654773af93a09a608e7427e41a7ed3` |
| .table-soft tr:last-child th, .table-soft tr:last-child td | 1 | `e6acde242f216ce7a55606d0340834ca56a25cb2788be7e382de72c0595bafbe` |
| .course-verb-review-button | 1 | `e6ee5796748be0a66890280817e2cd2b86b6df188d2829aa252fc13a9ed571c8` |
| .muted | 1 | `e6f7fccb114eb76482015c0d71ed97ee5fe75927391f9a5505a3ddfc127dbd4e` |
| .verb-meta-row | 1 | `f177d142edc6bfcfd31f7e07ba456a3c166761900622c5c91b31acfaff4a4b11` |
| .verb-dialog::backdrop | 1 | `f7001fa7cb41cd88ed8af27e10c55dd1a39887506e6c805f1357c30d145ac8a0` |
| .line-pair | 1 | `fda4148b62b15cfdb5c616289f62086a7c6711a02353f503b8e34f098b4c295f` |
| .verb-dialog-top-actions | 1 | `ff582e001b122b05714f2fd0b95239b7d07573be49f753b7b959bbecf71a7f0b` |

## assets/data/colors.json (style-payload)

Existing content swatch CSS in colors.json, retained under U10. New or changed non-empty CSS payloads require explicit documentation until structured swatches replace these strings.

| Registered element | Count | Signature |
| --- | ---: | --- |
| /groups/0/items/6/swatchStyle | 1 | `18f2a72876b9beff32e40634660c9aac58ffa9a01688b16083e054556bbf58f4` |
| /groups/0/items/7/swatchStyle | 1 | `4e769ad54df11ede0182fb9fa3f7bc86aafb788fb376c4b5cae137d1c678832a` |
| /groups/0/items/9/swatchStyle | 1 | `5bfbb45d8bc6788abe5dccc29c46666682ec014f22ed3f76c7132a9798381c52` |
| /groups/0/items/10/swatchStyle | 1 | `5ce8344b1f0c091f1493e7b43b4575be68489effff40503449b1ea1a814fbadf` |
| /groups/0/items/0/swatchStyle | 1 | `892659fb8c97c614c183582bd1f98c686193d346599082d4769554519a8ca769` |
| /groups/0/items/11/swatchStyle | 1 | `c406c6486525508bd00ce1e8d95d25bddc3062ed5d6c6f211d6a7e83f2ed5036` |
| /groups/0/items/5/swatchStyle | 1 | `c6009f3f6d308f80138e8ce7b6b1f884951ffb4e8c58e5c7e1d7143f0b236c9e` |
| /groups/0/items/2/swatchStyle | 1 | `d32e43e46697c837a5d62db5ea381719f7a81f315b7d133952044ffae5ecb7e8` |
| /groups/0/items/1/swatchStyle | 1 | `d4f18da8f5099d5e0f90bc5342f7f141d3f05c3160a672c7c1d1ce4eade50806` |
| /groups/0/items/4/swatchStyle | 1 | `e19f6abbc875aeb9a4f3c959efed4f8ea5721e5a25f37fa9cf3ce481c2a9e994` |
| /groups/0/items/3/swatchStyle | 1 | `e94ecc1c8e8fb3c67374aa909118308ad66a843edf8c6fece34b0f4d6d4c673a` |
| /groups/0/items/8/swatchStyle | 1 | `fa1cdee7e99a548dd85505036364cb0373674583a598c5a61d958e38f4d0899a` |

## assets/data/shopping_clothes.json (style-payload)

Existing content swatch CSS in shopping_clothes.json, retained under U10. New or changed non-empty CSS payloads require explicit documentation until structured swatches replace these strings.

| Registered element | Count | Signature |
| --- | ---: | --- |
| /groups/1/items/3/swatchStyle | 1 | `892659fb8c97c614c183582bd1f98c686193d346599082d4769554519a8ca769` |
| /groups/1/items/4/swatchStyle | 1 | `c6009f3f6d308f80138e8ce7b6b1f884951ffb4e8c58e5c7e1d7143f0b236c9e` |
| /groups/1/items/0/swatchStyle | 1 | `d32e43e46697c837a5d62db5ea381719f7a81f315b7d133952044ffae5ecb7e8` |
| /groups/1/items/2/swatchStyle | 1 | `d4f18da8f5099d5e0f90bc5342f7f141d3f05c3160a672c7c1d1ce4eade50806` |
| /groups/1/items/1/swatchStyle | 1 | `e94ecc1c8e8fb3c67374aa909118308ad66a843edf8c6fece34b0f4d6d4c673a` |
| /groups/1/items/5/swatchStyle | 1 | `fa1cdee7e99a548dd85505036364cb0373674583a598c5a61d958e38f4d0899a` |

## assets/data/vocabulary_review_catalog.json (style-payload)

Existing content swatch CSS in vocabulary_review_catalog.json, retained under U10. New or changed non-empty CSS payloads require explicit documentation until structured swatches replace these strings.

| Registered element | Count | Signature |
| --- | ---: | --- |
| /words/word::colors::orangjo/swatchStyle | 2 | `18f2a72876b9beff32e40634660c9aac58ffa9a01688b16083e054556bbf58f4` |
| /words/word::colors::vjola/swatchStyle | 1 | `4e769ad54df11ede0182fb9fa3f7bc86aafb788fb376c4b5cae137d1c678832a` |
| /words/word::colors::kannella/swatchStyle | 1 | `5bfbb45d8bc6788abe5dccc29c46666682ec014f22ed3f76c7132a9798381c52` |
| /words/word::colors::griz/swatchStyle | 2 | `5ce8344b1f0c091f1493e7b43b4575be68489effff40503449b1ea1a814fbadf` |
| /words/word::colors::abjad/swatchStyle | 2 | `892659fb8c97c614c183582bd1f98c686193d346599082d4769554519a8ca769` |
| /words/word::colors::ikkulurit/swatchStyle | 2 | `c406c6486525508bd00ce1e8d95d25bddc3062ed5d6c6f211d6a7e83f2ed5036` |
| /words/word::colors::ahdar/swatchStyle | 2 | `c6009f3f6d308f80138e8ce7b6b1f884951ffb4e8c58e5c7e1d7143f0b236c9e` |
| /words/word::colors::ahmar/swatchStyle | 2 | `d32e43e46697c837a5d62db5ea381719f7a81f315b7d133952044ffae5ecb7e8` |
| /words/word::colors::iswed/swatchStyle | 2 | `d4f18da8f5099d5e0f90bc5342f7f141d3f05c3160a672c7c1d1ce4eade50806` |
| /words/word::colors::isfar/swatchStyle | 1 | `e19f6abbc875aeb9a4f3c959efed4f8ea5721e5a25f37fa9cf3ce481c2a9e994` |
| /words/word::colors::blu/swatchStyle | 2 | `e94ecc1c8e8fb3c67374aa909118308ad66a843edf8c6fece34b0f4d6d4c673a` |
| /words/word::colors::roza/swatchStyle | 2 | `fa1cdee7e99a548dd85505036364cb0373674583a598c5a61d958e38f4d0899a` |

## assets/data/year4_revision_vocabulary.json (style-payload)

Existing content swatch CSS in year4_revision_vocabulary.json, retained under U10. New or changed non-empty CSS payloads require explicit documentation until structured swatches replace these strings.

| Registered element | Count | Signature |
| --- | ---: | --- |
| /collections/1/groups/5/items/6/swatchStyle | 1 | `18f2a72876b9beff32e40634660c9aac58ffa9a01688b16083e054556bbf58f4` |
| /collections/1/groups/5/items/7/swatchStyle | 1 | `4e769ad54df11ede0182fb9fa3f7bc86aafb788fb376c4b5cae137d1c678832a` |
| /collections/1/groups/5/items/9/swatchStyle | 1 | `5bfbb45d8bc6788abe5dccc29c46666682ec014f22ed3f76c7132a9798381c52` |
| /collections/1/groups/5/items/10/swatchStyle | 1 | `5ce8344b1f0c091f1493e7b43b4575be68489effff40503449b1ea1a814fbadf` |
| /collections/1/groups/5/items/0/swatchStyle | 1 | `892659fb8c97c614c183582bd1f98c686193d346599082d4769554519a8ca769` |
| /collections/1/groups/5/items/11/swatchStyle | 1 | `c406c6486525508bd00ce1e8d95d25bddc3062ed5d6c6f211d6a7e83f2ed5036` |
| /collections/1/groups/5/items/5/swatchStyle | 1 | `c6009f3f6d308f80138e8ce7b6b1f884951ffb4e8c58e5c7e1d7143f0b236c9e` |
| /collections/1/groups/5/items/2/swatchStyle | 1 | `d32e43e46697c837a5d62db5ea381719f7a81f315b7d133952044ffae5ecb7e8` |
| /collections/1/groups/5/items/1/swatchStyle | 1 | `d4f18da8f5099d5e0f90bc5342f7f141d3f05c3160a672c7c1d1ce4eade50806` |
| /collections/1/groups/5/items/4/swatchStyle | 1 | `e19f6abbc875aeb9a4f3c959efed4f8ea5721e5a25f37fa9cf3ce481c2a9e994` |
| /collections/1/groups/5/items/3/swatchStyle | 1 | `e94ecc1c8e8fb3c67374aa909118308ad66a843edf8c6fece34b0f4d6d4c673a` |
| /collections/1/groups/5/items/8/swatchStyle | 1 | `fa1cdee7e99a548dd85505036364cb0373674583a598c5a61d958e38f4d0899a` |

## assets/css/site.css (stylesheet-import)

Existing stylesheet dependency in site.css. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered.

| Registered element | Count | Signature |
| --- | ---: | --- |
| @import url("./site/base.css"); | 1 | `1927acf166f802b6ee5273651351a84622d51399d0ed193f7f680883208267af` |
| @import url("./site/print.css"); | 1 | `1e741969dcf7c252c2098c5c9ff7c6fae36d7ecccdd7643db74c47ee721d49f7` |
| @import url("./site/games.css"); | 1 | `2206a29dffe63ba99cc6fac1578b87c9bc640653f7e0155cf5829a93383f3e9a` |
| @import url("./site/learning.css"); | 1 | `30edc101d804fc60c3d5ff36f63e62ca6a0cb79a3cd1036cc7e458f8d97e4b2f` |
| @import url("./site/layout.css"); | 1 | `4ece8e93e078b603302115ba2c444f0119509af0804b7950d2b562f2a9377c93` |
| @import url("./site/verbs.css"); | 1 | `514ddb6b185e1df161c1173840587977eeab8781371d662bf4a9d2b69bdd3193` |
| @import url("./site/responsive.css"); | 1 | `69794f959ad0b06bf1f267f39061aba16edde55e13975860943618b3a6d00584` |
| @import url("./site/navigation.css"); | 1 | `84e81b0b40a7851f7792d3808e306c1d932dd59e816aa1e2a5b6d9f63362210c` |
| @import url("./site/components.css"); | 1 | `87bc04dbfd131712010b6a8174a145aefac69bc3d996b6d3216a449f82eee536` |
| @import url("./site/review-inline.css?v=2"); | 1 | `b0c84e1e8fea8e1ac4308894fa423cbf3a6f729f1d3ce37d81a0a709948b0631` |
| @import url("./site/review.css"); | 1 | `cae057ca42770c5d9e8684365edf2687c5802e65fb4e456b7f28007885f5bb07` |
| @import url("./site/exercises.css"); | 1 | `e990cc4952366b100aa5d6703ad75c5833013a03c9ebc0f56767cb28af8f55de` |
| @import url("./site/imperative.css"); | 1 | `f74c38eafe9a24216f8026d069712cbba6e35f3793bb8e148d0b264b2def3399` |

## assets/css/theme.css (stylesheet-import)

Existing stylesheet dependency in theme.css. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered.

| Registered element | Count | Signature |
| --- | ---: | --- |
| @import url("./themes/contrast.css"); | 1 | `bd4004bd05c0d09e898528cc2336eb10910e76103de6e6e679489a853f193be5` |
| @import url("./themes/forest.css"); | 1 | `ca2d5885b6be44c6bea54c94774073de4318c9eb8b63583103d524cc0db880a3` |

## conversation_help.html (stylesheet-import)

Existing stylesheet dependency in conversation_help.html. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered.

| Registered element | Count | Signature |
| --- | ---: | --- |
| ./assets/css/lesson01-practice.css?v=phrase-cards-2 | 1 | `c3b924402298c369f069441a06a74def71cebb5c2f729b625f959793c67de63d` |

## getting_to_know.html (stylesheet-import)

Existing stylesheet dependency in getting_to_know.html. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered.

| Registered element | Count | Signature |
| --- | ---: | --- |
| ./assets/css/lesson01-practice.css?v=phrase-cards-2 | 1 | `c3b924402298c369f069441a06a74def71cebb5c2f729b625f959793c67de63d` |

## greetings.html (stylesheet-import)

Existing stylesheet dependency in greetings.html. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered.

| Registered element | Count | Signature |
| --- | ---: | --- |
| ./assets/css/lesson01-practice.css?v=phrase-cards-2 | 1 | `c3b924402298c369f069441a06a74def71cebb5c2f729b625f959793c67de63d` |

## memory_game.html (stylesheet-import)

Existing stylesheet dependency in memory_game.html. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered.

| Registered element | Count | Signature |
| --- | ---: | --- |
| ./assets/css/vocabulary-games.css | 1 | `718eabc09c00a5911271c423632e0c7475676fbee111abb7dfe21bb48fa2f979` |
| ./assets/css/topic-picker.css | 1 | `d610b578553daa2c8b37ce4f07e548c16ccd1cef18f30636b6ebe67772dca5d6` |

## numbers_calendar_time.html (stylesheet-import)

Existing stylesheet dependency in numbers_calendar_time.html. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered.

| Registered element | Count | Signature |
| --- | ---: | --- |
| ./assets/css/numbers-expansion.css | 1 | `8e3c886fce286ce8f0617601fc902b0b681488217423cc04a36555adb0b8b9ee` |

## polite_phrases.html (stylesheet-import)

Existing stylesheet dependency in polite_phrases.html. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered.

| Registered element | Count | Signature |
| --- | ---: | --- |
| ./assets/css/lesson01-practice.css?v=phrase-cards-2 | 1 | `c3b924402298c369f069441a06a74def71cebb5c2f729b625f959793c67de63d` |

## word_builder_game.html (stylesheet-import)

Existing stylesheet dependency in word_builder_game.html. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered.

| Registered element | Count | Signature |
| --- | ---: | --- |
| ./assets/css/vocabulary-games.css | 1 | `718eabc09c00a5911271c423632e0c7475676fbee111abb7dfe21bb48fa2f979` |
| ./assets/css/topic-picker.css | 1 | `d610b578553daa2c8b37ce4f07e548c16ccd1cef18f30636b6ebe67772dca5d6` |

## word_search.html (stylesheet-import)

Existing stylesheet dependency in word_search.html. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered.

| Registered element | Count | Signature |
| --- | ---: | --- |
| ./assets/css/word-search.css | 1 | `bd1f82c3f56887f13dd7aeb7fe195cf221d7d04771d5440c0d8281c7c88bfc15` |
| ./assets/css/topic-picker.css | 1 | `d610b578553daa2c8b37ce4f07e548c16ccd1cef18f30636b6ebe67772dca5d6` |

## year4_exam.html (stylesheet-import)

Existing stylesheet dependency in year4_exam.html. New imports, direct layer loads or custom page styles require an explicit ownership description; the three standard shell links remain mandatory and ordered.

| Registered element | Count | Signature |
| --- | ---: | --- |
| ./assets/css/vocabulary-games.css | 1 | `718eabc09c00a5911271c423632e0c7475676fbee111abb7dfe21bb48fa2f979` |

## Change Procedure

1. Prefer composing registered components. New standard HTML and typed learning data do not need exceptions.
2. For a genuinely new component or an intentional exception, change the JSON rules/scopes, explain the purpose and ownership, and update the component guide and catalog as applicable.
3. Run `npm run ui:policy:describe` to regenerate this complete list and description; review the diff. This command does not scan or approve source changes.
4. Run `npm run materials:check` and relevant runtime/accessibility/visual checks. No automatic baseline promotion is permitted.

## Enforcement Limits

This is a repository quality contract, not a security boundary against a maintainer editing the checks. AST factory checks are conservative and are not a proof of all possible JavaScript data flow. Existing CSSOM/HTML checks, runtime contracts and review remain required. GitHub branch protection, required CI and independent review of policy changes are necessary for server-side enforcement. Local hooks alone can be bypassed by the machine owner. No remote repository setting is changed by this implementation.
