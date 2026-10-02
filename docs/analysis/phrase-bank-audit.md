# Phrase Bank Migration Audit

This audit records hardcoded phrase, dialogue, Q&A, and correction sections that may still benefit from moving into shared data-driven banks. Priorities are maintained in the single [project roadmap](../roadmap.md).

The main goals are:

- reduce repeated HTML phrase markup
- make Maltese / English translation pairs easier to edit
- reuse `render-example-banks.js` consistently
- make sentence-review wiring easier and more reliable
- reduce future mojibake / formatting drift in manual inline blocks

## Full Site Sweep

This section reflects a full page-by-page pass with the newer refactor rules in mind:

- light open vocab sections are preferred for simple word groups
- uneven paired groups should usually become separate sections
- short turn-based dialogues should use the messenger-style pattern
- `Wrong vs Right` grammar contrasts should stay inline and should not be review-connected
- new CSS should be the last resort
- prefer reusing existing structure and card classes before introducing any page-specific styling:
  - `open-group-grid`
  - `open-group`
  - `grid-2`
  - `grid-3`
  - `grid-auto`
  - `demo-box`
  - `phrase-card`
  - `grammar-contrast-grid`
  - `grammar-contrast-card`
  - `example-dialogue-stack`
- extracted turn-based dialogues should use one shared data/render contract:
  - one dedicated dialogue section
  - `example-bank-stack` with separate neutral `section-stack` blocks for each dialogue
  - dialogue groups in JSON should use `containerClass: "grid-2 example-dialogue-stack"`
  - dialogue groups in JSON should use `cardClass: "phrase-card"`
  - dialogue groups in JSON should usually use `numbered: false`
- after any bulk rewrite, encoding repair, or generated-file update, normalize changed text files to `UTF-8` without BOM and `LF` line endings
- before finishing a refactor pass, verify that changed text files do not contain BOM, CRLF-only churn, or mojibake markers such as `Ä`, `Å`, `Ã`, and `â€™`

### Style Reuse First

When refactoring a page:

1. try to solve layout with existing grid/layout utilities
2. then try to solve the visual surface with existing card/container classes
3. only introduce a new class when the shared patterns genuinely cannot express the teaching block clearly

Current page-specific helper styles should be treated as exceptions, not as the default path for future work:

- `modals-open-group`
- `weather-sections-stack`
- `transport-alternatives-stack`
- `attached-pattern-panel`
- `attached-pattern-table`
- `shopping-dialogue-bank`

If a future refactor starts to need something similar, first check whether it can instead be expressed by combining shared patterns already in the stylesheet.

## Current Problem Page Audit

This is the saved working list of pages that still need structural cleanup or a consistency pass after the latest refactors.

### Lower Priority / Special Cases

- `shopping_clothes.html`
  - already a strong reference page
  - only minor cleanup should happen here
- `verbs_guide.html`
  - intentionally special and reference-heavy
  - not a normal phrase-bank cleanup target

### Pages That Currently Look Stable

- `restaurant_ordering.html`
- `weather.html`
- `food_preferences.html`
- `family_home_food.html`
- `daily_problems.html`
- `directions_town.html`
- `transport_travel.html`
- `animals.html`
- `emotions.html`
  - situation models, Q&A pairs, pair-work prompts, and individual speaking models use typed shared banks
  - every migrated item can be added to Review individually
  - grammar explanations and agreement examples remain inline because their layout carries teaching meaning
- `impactful_people.html`
- `places_events.html`
- `body_appearance.html`
- `collective_nouns.html`
- `home_furniture.html`
- `prepositions_place.html`
- `comparisons.html`
  - comparison examples and Q&A pairs use shared typed banks
  - each Q&A pair can be reviewed independently without duplicating HTML markup
  - compact agreement illustrations and the `Wrong vs Right` contrast remain intentionally specialized
- `colors_maltese.html`
  - pattern, object, and Q&A examples use shared typed banks with individual review controls
  - shade references use light open groups
  - the shared grammar contrast remains intentionally specialized for correction practice
- `pronouns_possessives.html`
  - all nine reference tables use the shared light table surface without a second frame
  - explanatory cards and generated banks use unframed section stacks instead of nested panels
  - `Quick Answers` and its mini drill use typed shared banks with individual review controls
- `daily_routine.html`
  - greeting and reply banks use neutral section stacks instead of nested framed panels
  - routine templates remain framed because each one is a complete instructional tool
  - Q&A, mini routine, and model story content already use shared typed banks
- `sentence_builder.html`
  - the Combination Bank has one canonical render target instead of a duplicate empty section
  - the present-continuous table uses the shared light surface without a second frame
  - instructional building blocks remain framed because they are independent drill tools
- `numbers_calendar_time.html`
  - vocabulary table views and reference tables use one shared light surface without outer card frames
  - generated time-expression banks use neutral layout wrappers instead of nested panels
  - the five counting examples use a typed shared bank with individual Review controls
  - the two contrasting clock-pattern explanations remain framed intentionally
- `common_mistakes.html`
  - all six Wrong/Right comparisons remain intentionally framed
  - correction banks use neutral wrappers so the individual Review cards provide the only inner frame
  - article and preposition examples use the full content width instead of a compressed nested grid
  - duplicate correction examples are rejected by the page-level smoke check
- `health_doctor.html`
  - attached-pronoun references keep one light table surface without an outer panel and switch to labelled rows on narrow screens
  - useful expressions and both dialogue banks use neutral section wrappers around their individual cards
  - 70 displayed examples resolve to 58 unique Review items, so repeated teaching examples do not duplicate saved cards
  - role-play prompts and the Wrong/Right comparison remain framed intentionally

### Recommended Next Order

The current structural-cleanup queue is complete. New candidates should come from a fresh visual audit rather than the retired list above.

### Already Good / Recently Refactored

- `shopping_clothes.html`
  - keep expanding this as a reference page for:
    - light vocab groups
    - split uneven sections
    - messenger-style dialogues
    - inline grammar contrasts
- `health_doctor.html`
  - use as a reference page for neutral dialogue wrappers, individually framed turns, and deduplicated Review items
- `restaurant_ordering.html`
  - use as a second reference page for the same extracted-dialogue contract
- `common_mistakes.html`
  - remains a grammar/correction-heavy page
  - answer-ready correction banks are extracted while Wrong/Right teaching contrasts stay specialized

### Strong Phrase-Bank Refactor Candidates

- `food_preferences.html`
  - `Pair Work Questions`
  - `Dialogue and Common Expressions`
  - `Practice Bank`
  - likely candidate for messenger-style mini-dialogues if extracted
- `weather.html`
  - top example blocks
  - `Mini-dialogues`
  - `Thematic Phrases`
  - likely one of the cleanest wins after shopping and health
- `body_appearance.html`
  - `Ready Models`
  - `Questions`
  - `Answers`
  - `Thematic Phrases`
- `home_furniture.html`
  - inline example blocks
  - `Questions And Answers For Small Talk And Homework`
- `transport_travel.html`
  - `Questions and Answers`
  - `Practice Bank`
- `places_events.html`
  - `Ready-Made Models`
  - `Questions and Answers`
  - `Practice Bank`

### Good Candidates, But Prefer Mixed Refactor Strategy

- `daily_routine.html`
  - bank questions and short answers
  - keep routine verb structure and drill-friendly parts readable in HTML
- `modals_needs.html`
  - bank `More Models`, `Advice Models`, and mini-dialogues
  - keep explanation blocks inline
- `pronouns_possessives.html`
  - bank `Quick Answers` and remaining hardcoded Q&A clusters
  - keep explanation tables and grammar notes inline
- `prepositions_place.html`
  - expand remaining phrase islands and picture-description models
  - keep visual drill and spatial explanation inline
- `directions_town.html`
  - bank remaining route/dialogue material
  - apply messenger-style layout to turn-based exchanges
  - keep map-like or route-logic explanation inline
- `collective_nouns.html`
  - bank shopping lines, Q&A, and practice bank
  - keep classification/reference tables inline

### Sentence-First / Speaking-First Pages

- `picture_description.html`
  - mostly already on the right path
  - keep `20 Questions` as speaking/reference content
  - only extract leftover inline sentence clusters if they still exist
- `sentence_builder.html`
  - sentence-first by design
  - do not over-bank explanation and build-order material
- `impactful_people.html`
  - mostly sentence-first
  - keep biography and tense guidance readable in page context

### Vocab-First Pages Where Phrase Refactor Is Lower Priority

- `animals.html`
- `colors_maltese.html`
- `emotions.html`
- `family_home_food.html`
- `restaurant_ordering.html`

These pages are already useful with shared vocab review and do not need a phrase-bank-first pass unless new hardcoded dialogue islands appear.

### Better Left On Special Logic Or Reference Paths

- `imperative_verbs.html`
  - keep on special drill path
  - add inline notes, reading hints, and small usage notes carefully
  - do not flatten it into ordinary phrase banks
- `verbs_guide.html`
  - keep on custom verb workflow
  - extract only selective answer models if really useful
- `numbers_calendar_time.html`
  - keep mixed approach:
    - table/reference
    - vocab review for suitable groups
    - custom drills for numbers and time patterns
- `word_search.html`
  - not a phrase-bank target

### Mostly Navigation / Index / Utility Pages

- `index.html`
- `all_pages.html`
- `review_cards.html`

These are not phrase-bank targets.

## First Recommended Refactor Group

The best next wave, using the new rules consistently, is:

1. `food_preferences.html`
2. `weather.html`
3. `body_appearance.html`

Why this group first:

- all three still have a lot of phrase-heavy teaching content
- all three should benefit from easier `mt/en` maintenance
- all three contain good candidates for the newer dialogue and contrast rules
- together they are broad enough to validate the rules on:
  - pair work
  - mini-dialogues
  - thematic phrases
  - question/answer clusters

## Refactor Pattern

For each target page:

1. move hardcoded phrase-like content into `assets/data/<page>_examples.json`
2. split content into clear groups such as:
   - `patterns`
   - `dialogues`
   - `questions`
   - `answers`
   - `phrases`
   - `wrong`
   - `right`
   - `models`
3. replace inline `.example-bank` blocks with `data-example-group` containers
4. let `render-example-banks.js` handle:
   - section rendering
   - add-to-review sentence-bank actions
   - stable `mt/en` pairing
5. keep only truly presentation-specific blocks in raw HTML

## Priority 1: High-Value Pages

### `shopping_clothes.html`

Sections that should be banked:

- `Shopping Patterns`
- `Mini-dialogues > Buying a shirt`
- `Mini-dialogues > Asking the price`
- `Wrong vs Right > Wrong`
- `Wrong vs Right > Right`
- `Thematic Phrases`

Recommended target file:

- `assets/data/shopping_clothes_examples.json`

Notes:

- this page is an ideal pilot for a complete phrase-bank pass
- also worth cleaning the page vocabulary JSON to UTF-8 while touching it

### `health_doctor.html`

Sections that should be banked:

- `Mini-dialogues > At the doctor`
- `Mini-dialogues > At the pharmacy`
- `Wrong vs Right > Wrong`
- `Wrong vs Right > Right`
- `Thematic Phrases`

Recommended target file:

- `assets/data/health_doctor_examples.json`

Notes:

- keep the attached-pronoun explanation block in HTML
- move sentence pairs and correction pairs into banks

### `food_preferences.html`

Sections that should be banked:

- `Pair Work Questions`
- `Dialogue and Common Expressions`
- `Practice Bank`
- any short ready-made meal / preference lines that are still inline

Recommended target file:

- `assets/data/food_preferences_examples.json`

Notes:

- this page has strong sentence-review value
- dialogue and pair-work sections should become easier to maintain after extraction

### `weather.html`

Sections that should be banked:

- top example-bank intro blocks
- `Mini-dialogues`
- `Thematic Phrases`

Recommended target file:

- `assets/data/weather_examples.json`

Notes:

- likely one of the cleaner wins after shopping and food

### `body_appearance.html`

Sections that should be banked:

- `Ready Models`
- `Questions`
- `Answers`
- `Thematic Phrases`

Recommended target file:

- `assets/data/body_appearance_examples.json`

Notes:

- page already has phrase-heavy teaching flow
- extraction should simplify both translation maintenance and review wiring

## Priority 2: Structured Speaking / Q&A Pages

### `daily_routine.html`

Sections that should be banked:

- `Basic Questions`
- `Routine Questions and Short Answers`

Recommended target file:

- `assets/data/daily_routine_examples.json`

Notes:

- strong candidate for split question/answer groups

### `home_furniture.html`

Sections that should be banked:

- early inline example-bank blocks
- `Questions And Answers For Small Talk And Homework`

Recommended target file:

- `assets/data/home_furniture_examples.json`

### `places_events.html`

Sections that should be banked:

- `Ready-Made Models`
- `Questions and Answers`
- `Practice Bank`

Recommended target file:

- `assets/data/places_events_examples.json`

### `transport_travel.html`

Sections that should be banked:

- `Questions and Answers`
- `Practice Bank`

Recommended target file:

- `assets/data/transport_travel_examples.json`

### `collective_nouns.html`

Sections that should be banked:

- `Ready-made shopping lines`
- `Questions and Answers`
- `Practice Bank`

Recommended target file:

- `assets/data/collective_nouns_examples.json`

## Priority 3: Partial Cleanup / Mixed Pages

### `prepositions_place.html`

Current migration status:

- the cat / ball visual drill is a typed `questionAnswer` group with disclosure presentation
- each hidden answer can be saved to Review without revealing it first
- `Picture Description Models`, `Practice Bank`, and thematic phrases already use shared data groups
- no remaining manual phrase islands are known on this page

### `directions_town.html`

Sections that should be banked:

- any remaining inline route / landmark mini-models
- leftover manual examples after the lesson 25 expansion

Recommended target file:

- expand `assets/data/directions_town_examples.json`

### `modals_needs.html`

Sections that should be banked:

- `More Models`
- `Advice Models`
- inline dialogue blocks not yet moved
- any remaining manual thematic mini-patterns

Recommended target file:

- expand `assets/data/modals_needs_examples.json`

### `pronouns_possessives.html`

Sections that should be banked:

- source-based practice answers
- any remaining hardcoded question-answer clusters

Recommended target file:

- expand `assets/data/pronouns_possessives_examples.json`

Completed in the latest migration pass:

- `Quick Answers` is stored as a typed `questionAnswer` group.
- `Safe Mini Drill` is stored as an `example` group.
- both groups render through the shared sentence-review contract.
- all reference tables use `table-soft` directly, without framed table wrappers.
- explanatory lists and generated cards use neutral `section-stack` wrappers to avoid nested cards.

## Lower Priority / Handle Carefully

### `verbs_guide.html`

Potential candidates:

- answer models
- short oral answer models
- family answer models
- home/object answer models

Why lower priority:

- page has a lot of verb-specific logic and custom teaching structure
- phrase extraction should be selective, not sweeping

### `imperative_verbs.html`

Potential candidates:

- tiny usage notes only, if they become repetitive

Why lower priority:

- this page already has a custom workflow
- not a typical sentence-bank page

### `picture_description.html`

Potential candidates:

- only if some leftover inline simple-sentence blocks remain outside the existing bank

Why lower priority:

- sentence-review layer is already mostly in place
- `20 Questions` should remain a speaking/reference tool

## Recommended Order

1. `shopping_clothes.html`
2. `health_doctor.html`
3. `food_preferences.html`
4. `weather.html`
5. `body_appearance.html`
6. `daily_routine.html`
7. `home_furniture.html`
8. `places_events.html`
9. `transport_travel.html`
10. `collective_nouns.html`

Then do targeted cleanup passes for:

- `prepositions_place.html`
- `directions_town.html`
- `modals_needs.html`
- `pronouns_possessives.html`

## Migration Notes

- prefer small, named groups instead of one giant catch-all bank
- keep titles semantic so review topics remain readable
- keep correction pairs as separate `wrong` / `right` groups
- use clean UTF-8 during every extraction pass
- when a page already has a working examples JSON, expand it rather than creating a parallel file

## UI Guidance For Refactors

- for vocabulary groups, prefer the lighter open grid presentation used on `shopping_clothes.html`
- avoid wrapping simple word groups in an extra white-background inner box when the page already has a clear section card
- preferred pattern:
  - section card
  - short toolbar row
  - open `grid-auto` word cards directly in the section
- use inner white boxes only when they add real structure, for example:
  - side-by-side contrast blocks
  - separate dialogue panels
  - special explanation or drill areas
- the `Clothes Vocabulary` section on `shopping_clothes.html` is the reference example for the preferred lighter layout
- when two related groups have very uneven lengths, prefer splitting them into separate sections instead of forcing a shared two-column block
- example:
  - `Colours` and `Sizes` on `shopping_clothes.html` should live as separate sections
  - this avoids one tall column and one short column drifting out of balance
- prefer section-level clarity over artificial symmetry when content volume is clearly uneven
- for short dialogues, prefer a messenger-style layout instead of nested heavy cards or a balanced two-column dialogue grid
- preferred dialogue pattern:
  - one section card dedicated to dialogue content
  - do not mix a messenger-style dialogue and a generic phrase grid inside the same section
  - place common expressions, phrase lists, or vocabulary follow-ups in their own separate section
  - one light sub-block per dialogue bank when a page has multiple separate dialogues
  - one compact review row per bank
  - one single-column stack of turns
- dialogue turns extracted into a connected data file should usually be unnumbered
  - in chat-like banks, rhythm and formatting already separate the turns
  - keep numbering only when sequence order is itself part of the exercise or explanation
- remove extra inner `wide-box` wrappers when they only create more white surface without adding structure
- cap dialogue-bubble width so turns do not stretch across the whole section
- when the content is truly turn-based, alternate left/right alignment for consecutive turns to create a chat rhythm
- use slight visual variation between alternating turns instead of building a completely separate visual system
- reference example:
  - the `Mini-dialogues` block on `shopping_clothes.html`
  - this should be the default model for future mini-dialogue, Q&A exchange, and short role-based conversation refactors
- for `Wrong vs Right` and similar grammar contrast sections, prefer inline contrast blocks instead of review-connected example banks
- these blocks should not be extracted into connected phrase banks when they contain wrong forms or correction-only contrasts
- preferred grammar-contrast pattern:
  - keep the block directly in page HTML
  - no `Add sentence bank to review` controls
  - present the wrong form and the corrected form as a visual comparison
  - add a short explanation line that states the grammar point
- it is good to strengthen the wrong side visually:
  - use a warmer or red-tinted background/accent for the wrong formula
  - keep the corrected side calmer and cleaner
- reference example:
  - the `Wrong vs Right` block on `shopping_clothes.html`
