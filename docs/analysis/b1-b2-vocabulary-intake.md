# B1/B2 vocabulary intake

Reviewed on 2026-11-05. Implementation uses the existing shared vocabulary renderer and review store. No CSS, UI factories or policy exceptions were added.

## Result

- All **284** previously missing, partial or disputed book-scoped units have explicit dispositions: **83 B1**, **201 B2**. They form 274 identical-label groups; reviewed inflections and senses determine the physical cards.
- **225 new cards**, with original short Maltese examples and English translations.
- **38 existing cards enriched**: 30 thematic cards, 2 Year 4 cards and 6 course cards. Existing slugs and review IDs remain stable.
- 26 thematic owner pages changed. Eight groups were mounted through the shared components; greetings and conversation reuse the existing controller through two small vocabulary banks.
- Existing course/Year 4 cards remain in place. Seven course bindings are explicitly retained in `course_target_binding_overrides.json` so newly enriched notes cannot silently unmount older cards.
- The 728 previously covered units remain covered; all 1,012 source units have a card or a verified bilingual lexical presentation. This is a count of lexical learning units, not every printed token or every spelling of a form.

## Linguistic review

The [machine-readable dispositions](b1-b2-vocabulary-intake.json) retain source pages, observed forms, independent checks and exact destination IDs. Two independent reviews covered all 274 label groups. Original examples are editorial teaching material; none is falsely marked as a source-verified quotation.

Key decisions include brama = jellyfish; kulur as a school colouring implement; librerija as both library and bookcase; the completion verb jlesti distinct from ready lesta; tieħu riħ = catch a cold; ċlampu and tidlik as context-qualified weather nouns; and the adjective ħelu distinct from the collective noun sweets. The English dialogue role salesgirl is represented by independently checked Maltese bejjiegħa.

The extraction fragment tifhim is interpreted through its full attested negative ma tifhimx, rather than published as a separate word. Article spelling, typography and English role labels are retained in source evidence without blindly reproducing them as Maltese headwords.

## Existing progress

`syncWordContent` now refreshes source-owned Maltese/English labels and examples under the same review ID. Display and normalized Maltese labels stay consistent. Review boxes, counts, dates and manual cards are preserved. The existing catalog also retains course definitions, allowing an old saved brama translation to update when Review loads.

## New cards by owner page

| Page | Cards |
| --- | ---: |
| [animals.html](../../animals.html) | 16 |
| [colors_maltese.html](../../colors_maltese.html) | 5 |
| [comparisons.html](../../comparisons.html) | 4 |
| [conversation_help.html](../../conversation_help.html) | 10 |
| [daily_routine.html](../../daily_routine.html) | 16 |
| [directions_town.html](../../directions_town.html) | 11 |
| [emotions.html](../../emotions.html) | 1 |
| [environment_recycling.html](../../environment_recycling.html) | 10 |
| [family_home_food.html](../../family_home_food.html) | 2 |
| [food_preferences.html](../../food_preferences.html) | 16 |
| [getting_to_know.html](../../getting_to_know.html) | 9 |
| [greetings.html](../../greetings.html) | 2 |
| [hobbies_future.html](../../hobbies_future.html) | 20 |
| [home_furniture.html](../../home_furniture.html) | 2 |
| [introductions_alphabet.html](../../introductions_alphabet.html) | 13 |
| [modals_needs.html](../../modals_needs.html) | 6 |
| [numbers_calendar_time.html](../../numbers_calendar_time.html) | 15 |
| [places_events.html](../../places_events.html) | 6 |
| [prepositions_place.html](../../prepositions_place.html) | 1 |
| [pronouns_possessives.html](../../pronouns_possessives.html) | 12 |
| [school_classroom.html](../../school_classroom.html) | 24 |
| [shopping_clothes.html](../../shopping_clothes.html) | 18 |
| [transport_travel.html](../../transport_travel.html) | 2 |
| [weather.html](../../weather.html) | 4 |

## Validation

Run the source-aware regression check with `node scripts/b1b2_vocabulary_intake_check.js`. It pins the 284 source keys, resolves every actual mount, verifies old IDs and current catalog definitions, checks new headword duplicates and approved sense distinctions, and checks the canonical course builders. Five negative probes verify that missing IDs, missing catalog records, duplicate heads, provenance leaks and source-queue changes fail.

The [validation record](b1-b2-vocabulary-validation.json) records the commands and browser results. Full logs, 28 screenshots, review notes, input proposals, intermediate snapshots and scripts are archived beside each source PDF under its `M_B1_extracted` / `M_B2_extracted` review directory. OCR was not repeated.

There are 24 pre-existing Year 4 missing-example warnings outside the new-card intake. No pending claim or quarantined example was introduced.
