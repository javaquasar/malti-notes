# Numbers, Quantities, Calendar and Time

## Scope

The existing numbers/calendar/time page is extended in place. Old section anchors,
vocabulary review IDs and old progress key `malti_numbers_time_drill_v1` remain
intact. The duplicate drill interface is replaced by one practice block. The old
`#self-test` anchor still lands inside it. Legacy attempts are imported once,
incrementally and idempotently, into corresponding core/clock question IDs.

Nine reference groups cover number forms, hundreds/thousands, word building, dual
forms, fractions, measurements/money, temperatures, decades and time expressions.
The page includes 156 reference entries and 77 source-derived exercise questions.
The expanded runtime pool adds contextual reading/reverse-reading and existing
core/clock patterns plus 63 number/noun combinations for 655 questions. Exact repeated lexical pairs are merged;
all their original source references remain attached.

## Import and Provenance

The input is `lesson02-learning-content.json`, produced by the local Lesson 02
extraction. Rebuild with:

```powershell
python -X utf8 scripts/import_numbers_materials.py "path/to/lesson02-learning-content.json"
```

The generated `assets/data/numbers_expansion.json` is self-contained. No absolute
local paths, external Dropbox dependency, original presentation artwork or audio
are required by the website. It retains all 205 source item mappings, references
to all 129 source units, fourteen editorial resolutions and the thirteen-material
inventory. It is validated by JSON Schema in `schema:check`. Unchanged original
text, typography, alternative extractions and source item values are preserved
in `numbers-source-evidence.json` alongside this document. Published teaching
strings use the site's straight-apostrophe convention.

Source text is evidence, not an unqualified grading key. The listening task is
deferred because its recording was not supplied. Eight lexical targets replace
the source's full-sentence dual transformation exercise in automatic grading;
the original sentences are retained as translated examples. This avoids falsely
grading sentence agreement by mere noun substitution.

## Editorial Verification

Checked on 2026-10-14 against primary references:

- [National Council, question 39](https://kunsilltalmalti.gov.mt/mistoqsija-u-twegiba-26-51/): unit-first decimal measurement policy. Inconsistent rainfall options are rewritten accordingly.
- [Għidha bil-Malti](https://ghidhabilmalti.mt/iktibha-tajjeb/in-numri-man-nom-u-t-t-marbuta): counted forms and accepted tlett/tlitt variants.
- [National Literacy Agency mathematics glossary](https://nla.gov.mt/wp-content/uploads/2023/12/A-Bilingual-Glossary-of-Mathematics-Terms-The-Early-and-Junior-Years.pdf): fractions and large-number composition.
- [University of Malta, L-Allomorfija](https://www.um.edu.mt/library/oar/bitstream/123456789/95807/3/L-Allomorfija.pdf): xkora/xkertejn is attested, not an error.
- [National Council, Tagħrif](https://kunsilltalmalti.gov.mt/wp-content/uploads/2023/03/taghrif.pdf): ġwinħajn is retained.
- [National Council, question 81](https://kunsilltalmalti.gov.mt/mistoqsija-u-twegiba-77-102/): standardized ilbiraħtlula.

Other corrections: 0.75 kg = 750 g; Celsius spelling; irkoppa/irkopptejn;
kuċċarini after żewġ; singular pass as the cue for passejn; fid-disgħa; missing
conjunctions after hundreds. The four breakout-room number readings are labelled
editorial derivations from compositional rules, not teacher-supplied keys.

## State and Controls

`malti_numbers_extended_v1` stores independent practice results, topic/direction
and last-shown timestamps, difficulty, resumable sessions and twenty recent
session records. It never rewrites the legacy drill key. Revealing an
answer does not count as a correct attempt; mistakes can be practised separately.
Mistakes are also sent through the existing `MaltiMistakeStore` API.

Cards use the existing `MaltiReviewStore`; reference saves are idempotent and do
not overwrite scheduling fields when toggling unrelated cards. Copying uses plain
text, one Maltese line followed by its English translation when enabled, with an
empty line between entries. The copy setting persists independently. Windows may
convert LF to CRLF on the system clipboard; both preserve the intended lines.

## Verification

Run `npm run numbers:check` with the local site at port 4190, or set
`NUMBERS_TEST_URL`. The test uses an isolated browser context, checks dataset
coverage, both number builders, all practice categories, mistakes filtering,
clipboard output, review persistence and preservation of legacy progress. It also
checks section surfaces/radii and overflow at 1440, 390 and 320 pixels, and saves
screenshots under ignored `tmp_numbers_expansion/`.

The new JSON and drill data are included in the service-worker core cache.
The new progress and copy-format keys are registered with the existing backup
and cloud-sync export contract. Reference phrases are indexed under their topic
anchors by the existing site search builder; original source evidence is not
indexed as teaching content.

## Focused Study and Sessions

Measurement examples are grouped as Units, Decimals, Length, Weight, Volume and
Money, each with visible examples and its own remaining-example disclosure.
Number/noun practice composes counted forms for seven attested classroom nouns
with 2–10. The linking-i category is explicitly assigned to each noun; it is not
guessed from any initial letter i. Both tlett and tlitt are accepted for three.

The number builder supports returning individual tokens, inserting before a
chosen token, moving a token with arrow buttons or arrow keys, and dragging a
selected token before another. Undo restores the previous arrangement. Thousand
and remainder groups are visually separated; feedback identifies the wrong group.

One practice controller owns the topic, direction and difficulty filters. Short
sessions contain 5 or 10 distinct questions; mixed sessions spread topics. Study
mode distinguishes independent correctness, correctness after hints, wrong
answers, revealed answers and skips. Test mode hides hints and answers until the
summary. The summary supports retrying only that session's failed/revealed/skipped
questions. Session state, including already recorded answers and hints, resumes
after reload. The last summary remains available through Last session.

Run `npm run numbers:sessions:check` for migration-independent scenario tests of
these features, session resume, test secrecy, topic diversity, partial retries and
keyboard/drag/insertion builder operations at desktop/mobile widths.
