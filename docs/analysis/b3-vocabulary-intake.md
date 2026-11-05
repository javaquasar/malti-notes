# Vocabulary intake: completed lexical coverage

On 5 November 2026, 302 word/phrase cards were added across 19 existing thematic pages; 14 established cards were enriched. The learner-facing cards use the shared renderer and styles, with no book provenance or B3 references.

The source audit contains 562 lexical learning units, not every printed token. Of these, 226 were already covered. All 336 remaining units now have concrete card dispositions: 301 add, 12 enrich, 12 merge and 11 verified existing inflection families. The two distinct senses of `forn` account for one additional physical card.

The [machine-readable manifest](b3-vocabulary-intake.json) retains the source hashes, PDF-page evidence, every disposition, before/after objects for enriched cards, primary-source checks and independent linguistic reviews. Repeating OCR is unnecessary.

## Destinations

| Existing page | New cards | Enriched cards |
| --- | ---: | ---: |
| [Body and Appearance](../../body_appearance.html) | 27 | 1 |
| [Comparisons](../../comparisons.html) | 3 | 0 |
| [Daily Routine](../../daily_routine.html) | 8 | 1 |
| [Directions and Places](../../directions_town.html) | 12 | 3 |
| [Emotions](../../emotions.html) | 4 | 0 |
| [Family, Home and Food](../../family_home_food.html) | 2 | 0 |
| [Food Preferences](../../food_preferences.html) | 8 | 0 |
| [People and Work](../../getting_to_know.html) | 49 | 0 |
| [Health and Doctor](../../health_doctor.html) | 23 | 0 |
| [Hobbies and Future Plans](../../hobbies_future.html) | 49 | 2 |
| [Home and Furniture](../../home_furniture.html) | 6 | 0 |
| [Introductions and Alphabet](../../introductions_alphabet.html) | 1 | 1 |
| [Can, Must, Want and Need](../../modals_needs.html) | 4 | 2 |
| [Numbers Calendar Time](../../numbers_calendar_time.html) | 34 | 0 |
| [Places and Events](../../places_events.html) | 61 | 2 |
| [Prepositions of Place](../../prepositions_place.html) | 2 | 0 |
| [School and Classroom](../../school_classroom.html) | 7 | 0 |
| [Transport and Travel](../../transport_travel.html) | 1 | 2 |
| [Weather](../../weather.html) | 1 | 0 |

## Deduplication and stable progress

- Preserve every established slug and review prefix. The manifest records 14 exact before/after identities; all 11 existing imperative-card references retain their original verb identities.
- Add the bare nouns `karozza`, `taxi` and `festival` to the existing construction cards. Keep their established review IDs.
- Combine pharmacist spellings, person variants of care expressions, birthday forms, curly-hair terms and synonymous pastry names on single cards.
- Keep `forn` as oven and bakery, and `riħ` as wind and common cold, with explicit sense distinctions. The intransitive `noħroġ` card is distinct from the established transitive rubbish-bag example.
- Existing overlaps between old thematic banks are retained. The checker rejects any newly introduced duplicate whole headword without a documented different sense.

## Form and meaning review

The linked evidence in the manifest supports these corrections and qualifications:

- `infjammati`, `mgħieġed` and `brodu` replace uncertain extracted spellings; the former spellings remain only in internal provenance.
- `ruxxan` describes a ruddy or flushed face; `samrani` describes a darkish complexion.
- `darsa / dras` means molar / molars.
- `se jkolli` teaches the obligation construction “I will have to”. The complete question `Tweġġa' meta tibla'?` identifies the addressed person; the isolated verb form is ambiguous.
- `misluħa` is qualified as grazed/scraped in the supplied skin context and can also describe sore or rubbed-raw skin.
- `il-Mużew (katekiżmu)` explicitly identifies the religious-education usage. `il-Barrakka ta' Fuq` is the Valletta landmark.
- Cultural foods, decorations and gender forms were checked against primary institutional, research or original-language sources. Nine additional health-language review flags were explicitly resolved.

The old GĦABRA API redirected to the University homepage during review. No successful live API lookup is claimed. Explicit conjugation tables in the existing verb lookup snapshot, live verb.mt and primary Maltese sources were used instead.

Short examples are editorial constructions, except for the short context-qualified doctor question. Checking a spelling or sense does not certify an entire example as an external quotation; no new item was marked globally source-verified for that reason.

## Reuse and maintenance

The existing `MaltiVocabReviewPage`, shared vocabulary renderer, storage and review APIs render every new card. The Getting to Know Someone page now mounts its own canonical people/work bank through that same configuration. No CSS, shared renderer, UI policy registry or verification budget was changed. Explicit morphology notes use the existing per-claim verification model and reference the evidence manifest.

Generated Year 4 collections, the review catalog, search index and Service Worker were rebuilt. The new people bank is discovered by the existing vocabulary inventory and included in the existing offline asset inventory, with vocabulary data cached on first use.

Run the intake-specific check after a content edit:

```sh
node scripts/b3_vocabulary_intake_check.js
npm run materials:check
```

The intake checker validates all 336 concrete references, real HTML group mounts, preserved review IDs, visible headword alternatives, examples/translations, evidence for the 14 original disputed units and newly introduced duplicates. Seven isolated positive/negative fixtures verified missing references, provenance leaks, duplicates, missing evidence and metadata-only coverage.

Functional expectations for the exact topic-group counts were updated to match the expanded banks. Two pre-existing test mismatches were corrected: seven emotion situations were already present at HEAD, and seven speaking self-assessments used nested inline bookmarks rather than the old sentence-card class. The bookmark test now checks real typed card semantics; all 39 bank pages and eight deliberate broken-layout fixtures were checked.

Validation completed: the material gate, 336-unit intake check, all 10 course functional tests, all 13 review/game functional tests, accessibility on 19 owner pages at desktop/mobile, and 198 browser checks (including 171 page/theme/width cases, progress persistence and offline content). The material gate retains 25 pre-existing Year 4 example warnings; no new card lacks its example or translation.

Browser evidence and the full intermediate work are archived beside the supplied material, under `M_B3_extracted/review/2026-11-05/vocabulary-intake`.
