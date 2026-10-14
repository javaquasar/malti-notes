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
core/clock patterns, 63 number/noun combinations, 27 form-choice tasks and two source-backed price contexts for 684 questions. Exact repeated lexical pairs are merged;
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

## Context, Recall and Worksheets

`numbers-tools.js` adds 27 three-context form questions (alone, ordinary counted
noun, linking-i noun). Answer feedback highlights a full contrast; noun-counting
questions share that comparison. Hints name a rule without displaying the answer.

Adaptive review schedules weak or assisted answers after three intervening
answered questions or ten minutes. Independent answers increase the interval
from one day up to thirty days, with an in-session turn interval as well.
Due items outrank unseen items; unseen items outrank items not yet due. Two
consecutive independent answers mark an item secure. Existing attempt counters,
legacy imports, and session snapshots are preserved. The switch can disable
adaptive ordering. Topic progress reports secure, attempted and time-due counts.

Four selectable situations use checked source questions: shopping, arranging a
meeting, measuring/cooking, and dates/quantities. They run in the same resumable
practice controller; a situation never replaces an active session.

The explorer accepts checked values from source examples and the core 1–100
pool, not arbitrary generated Maltese. Its category distinguishes fractions,
length, weight, volume, decimals and money. Whole-number examples show their
numeric decomposition; large examples with elf also show the Maltese thousands
and remainder groups. Unsupported values receive an explicit message rather
than an inferred translation. The underlying reference sections retain all
source alternatives.

Speaking practice reveals the answer on request and records self-assessment
separately under `malti_numbers_speaking_v1`. It offers a repeat-only filter and
does not claim pronunciation scoring or change typed-answer mastery. The key is
included in the existing progress backup/cloud-sync contract.

Teacher worksheets offer 5/10 tasks, topic selection, optional answers, optional
available English translations, multiline copying, and a worksheet-only print
view. A mixed worksheet round-robins topics. Printing hides other page sections.

Run `npm run numbers:tools:check` for contrasts, adaptive return/reload, explorer
values, all four situations, speaking isolation/retry, worksheet copy/print and
320/390/1440-pixel screenshots under ignored `tmp_numbers_sessions/`.

## Shared Style Migration

The numbers stylesheet no longer owns input/select, checkbox, choice/token,
disclosure, feedback, comparison, clipboard or worksheet surfaces. They use the
shared study contracts documented in [Decision 0003](../decisions/0003-layered-style-system.md).
Local styles retain number diagrams, builder group layout and responsive table
composition. Field heights, token heights, spacing and radii come from common
theme tokens. No teaching data, exercise IDs, storage keys or scheduling logic
change in this migration.

Run `npm run numbers:style:check` for cross-theme contract equality, token-change
propagation, accessibility, mobile layouts, worksheet PDF generation and progress
preservation. Artifacts are saved to ignored `tmp_numbers_sessions/`. Catalog
variants have independent Windows/Linux visual baselines.

## Guided Recall and Compact Views

`numbers-learning.js` diagnoses common answer differences using checked accepted
answers: missing linking u, word order, counted-number forms, past/to clock
direction, units, place-value groups and diacritics. A common prefix/suffix
comparison highlights the changed fragment without injecting answer HTML. A
generic comparison is used when a more specific diagnosis is not supported.
The last answer and diagnostic category are stored with the existing result;
the mistake journal receives the targeted explanation. Test mode does not show
diagnoses, comparisons or answers until completion.

Answer mode defaults to independent writing for backward compatibility. Guided
progression tracks Choose, Build and Write per existing question ID. Two answers
without a hint/reveal advance each supported stage. Incorrect or assisted answers
reset that stage's streak. Recognition and word-building successes are counted
as supported, not independent writing, and do not advance writing mastery.
Copying/saving an unanswered answer counts as assistance. Existing independently
mastered items are not downgraded when guided practice is opened. Stage/session
data stays inside `malti_numbers_extended_v1` and the existing backup contract.

The shared segmented controls switch Reference, Practice and My mistakes. The
reference-topic selector shows one section on demand, with an explicit All
reference sections option. View and topic persist. Existing section hashes and
search targets select the correct view automatically. The full reference hero
is reserved for Reference; practice and mistakes use a compact page heading.
Chapter-scoped course rendering retains its existing navigation ownership.

Context comparison reuses standalone numbers, counted books/children, checked
clock forms and matching source prices. Two price questions are derived directly
from existing Money entries, not a general currency-word generator. Mistakes can
start a targeted writing session or open a checked spoken prompt. Speaking can
filter by written mistakes or attempted learning items and displays the written
stage. Oral ratings stay in `malti_numbers_speaking_v1`: no microphone, recording,
speech synthesis or pronunciation scoring is introduced.

Run `npm run numbers:learning:check` for error types, preserved views and deep
links, guided progression/resume, keyboard word return, cross-context examples,
mistake-linked speaking, test secrecy and mobile layouts. It starts a temporary
server by default or uses `NUMBERS_TEST_URL`; CI runs it alongside shared-style
checks. Screenshots use the ignored `tmp_numbers_sessions/learning-*` paths.

## Whole-number helper

`#number-helper` is a Reference section using `content-card`, `stack`,
`study-field`, `study-input`, `study-question`, `toolbar-row`, `action-button`
and `study-feedback`. No new CSS or progress keys are introduced. The pure
`MaltiNumbersHelper.toWords` function covers integer values 0 through 999,999,999;
`parse` rejects decimals, exponents, negatives and malformed digit grouping.
Copy writes only the Maltese result. Empty or invalid input clears stale output.

Linguistic references checked on 2026-10-15:

- [Unicode CLDR Maltese rule-based number formatting](https://github.com/unicode-org/cldr/blob/main/common/rbnf/mt.xml): standalone, counted and connective forms, units before tens, scale names.
- [National Literacy Agency bilingual mathematics glossary](https://nla.gov.mt/wp-content/uploads/2023/12/Glossarju_bilingwi_ta_termini_tal-matematika_is-snin_bikrin_u_tal-primarja_2022.pdf): `miljun`, `miljuni`, `żewġ miljuni`, `ħames mitt elf`.
- [Government stock issue announcement](https://www.gov.mt/en/Government/DOI/Press%20Releases/Pages/2025/11/07/PR251976.aspx): compound hundreds of millions.

The small converter composes these rules with the page's existing lesson forms;
it is not a generic CLDR interpreter. It retains standalone units in compound
tens, uses `mitt` for an exact hundred before a scale, and treats scale groups as
counted contexts. Groups are joined with `u`. It does not generate counted noun,
currency, fractional or ordinal phrases. Automated fixtures cover each scale
boundary and the maximum; generated combinations are rule-derived, not individually
teacher-reviewed. Tests also cover grouped paste, copying, keyboard submission,
mobile wrapping and unchanged exercise results, in `numbers:learning:check`.
