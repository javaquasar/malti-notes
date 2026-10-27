# Supplied Vocabulary Coverage

Date: 2026-10-28.

## Method and Before Evidence

This follow-up compares the supplied material with the site **after** the first
gender/food/cafe integration, not with Git HEAD. That earlier work was still
uncommitted and was preserved. There is no new lecture-number page.

The [inventory](supplied-vocabulary-inventory.json) contains 292 distinct textual
forms and expressions from S01-S17 of the local intake. These include inflected
forms and phrases; **292 is not a count of different dictionary lemmas**. Function
words, proper names and every token of the uncertain story are not an exhaustive
lemma inventory.

The [before snapshot](supplied-vocabulary-audit.json) was captured before editing
learning data. The scanner uses Unicode word boundaries, preserving Maltese
letters while separating apostrophes and hyphens used with clitics. It examines
canonical learning JSON, inert DOM-parsed HTML and the literal loaded word-game
bank. Metadata filenames, generated search indexes/catalogs and quarantined
items do not establish coverage. Game data is parsed with Acorn, not executed.

One documented scanner correction is retained separately: `nsibu` was already
in the person-keyed positive present-tense paradigm in `verbs_extensions.json`.
The initial traversal missed that map. The scanner now handles these maps; the
raw before snapshot was not replaced by an after snapshot.

| Effective before state | Source forms/expressions |
| --- | ---: |
| Direct bilingual item or reference pair | 158 |
| Only in a sentence, question, paradigm or other context | 60 |
| Only in a word game | 5 |
| No exact form/expression found | 69 |
| Total | 292 |

Textual absence does not imply a new root: `jibdew`, `jispiċċaw`, `ġirien` and
`torti` overlap with forms already taught. `Dik it-tilwima` is a demonstrative
plus a noun, not an independent headword. Human editorial decisions are recorded
in [the decision map](supplied-vocabulary-decisions.json).

## Harmonious Integration

All destinations are existing topic pages. New items use their existing typed
banks, vocabulary components, review prefixes and renderers. No local CSS,
runtime factories, policy exceptions or budgets were changed.

| Destination | Added or clarified material |
| --- | --- |
| Gender and Agreement | `ġens`, explicit `maskil/femminil` glosses and an optional vocabulary bank explaining the contextual exercise words, including `jidden`, `jinħaq`, `tibdila`, `kunvent tal-klawsura`, `stħajlet` and `bierket`. |
| Food Preferences | Corrected `qarabagħli`; `zunnarija` as an alias on existing `karrotti`, not a second carrot concept; cooking/serving vocabulary including `mielaħ`, `maħruq`, `riħa`, `imqarrun`, `dixx`; short cooking examples, a `torti` plural note and `xi bżonnijiet`. |
| Getting to Know Someone | Work/interview vocabulary, preferences and a short catching-up dialogue: `intervista`, `infittex xogħol`, `bħala kok`, `minn dejjem`, `għal qalbek`, leaving politely and enjoying a conversation. |
| Restaurant and Ordering Food | `sarvetta` in service vocabulary; coffee-and-company expressions distinguishing feminine `mejta għal`, `bħali` and `naqra` meaning a little, not I read. |
| Daily Problems | Disagreement/incident words: `għajjat`, `tilwima`, `ġlieda`, `xhud`, `qorti`, `ġirien`; noticing, approaching, name-calling and paying attention, with pronoun/reference notes. These are language examples, not legal advice. |
| Daily Routine | `drawwa`, spending time and a proverb about ingrained habits. The proverb is figurative, not a deterministic claim about real people. |
| School and Classroom | Language for word-game instructions: beginning, ending, rhyming, finding and kinds/types. Rhyming is not graded from spelling alone; no new exact-answer game was invented. |
| Home and Furniture | `għatba` and a literal doorstep expression; `injam`, previously only in the game, now has a furniture/material example. |
| Weather | `mewġ`, integrated into the existing weather/sea vocabulary. |
| Emotions | `Wiċċha xegħel bil-ferħ`, a figurative reaction in the existing situation bank. |

The decisions contain 49 additions, 18 contextual/game promotions and two aliases:
69 source forms/expressions now reach an intended teaching destination. Of these,
51 were textually absent before, including variants and complete phrases. These
are **not 69 new roots or 69 new vocabulary cards**: some expressions share an
example or explain an existing word. The other decisions are 205 already-covered
entries, one construction covered through `tilwima`, and 17 held entries.

## Linguistic Review and Held Material

The clear glossary senses were reviewed alongside their source contexts. New
sentences are short editorial adaptations, not teacher-supplied answers or
certified quotations from the recording. The existing raw intake and audio
analysis remain separate. Targeted primary corroboration supports these changes:

- [Ministry of Agriculture, traditional agro-food inventory, section 44](https://ruralaffairs.gov.mt/wp-content/uploads/2024/05/qp003.pdf#page=45) explicitly pairs `qarabagħli` with marrows. This resolves the defective source spelling `Qarabali` for this bounded import.
- [Klimiuk, Language Questionnaire for Gozo, printed p.119](https://journals.pan.pl/Content/124789/PDF/2021-FORI-06-Klimiuk.pdf#page=9) lists carrot naming variants, supporting an alias note rather than a duplicate carrot concept.
- [Malti.mt, maltemp glossary](https://malti.mt/glossarji/maltemp/) provides contextual `mewġ` usage in a sea/weather definition.
- [University of Malta repository thesis, printed p.144](https://www.um.edu.mt/library/oar/bitstream/123456789/119074/1/2419LLTLIN500105080285_3.pdf#page=154) corroborates `sarvetta`.
- [Zammit, Maltese grammaticalization study](https://www.um.edu.mt/__data/assets/pdf_file/0008/124991/zammit.pdf) supports the small-quantity reading of `naqra`; the cafe example does not use its I-read sense.

Held entries are documented individually in the decision map. The reasons differ:
unconfirmed forms/paradigms (`mgerfex/mgerfxa`, `moħor`), ambiguous food names or
glosses, defective source sentences, and recording-specific wording outside this
vocabulary-only release. No runtime quarantine budget was relaxed to store them.

Important spelling distinction: bare `tissemma` can mean is mentioned/named;
attested listening usage has an apostrophe, `tissemma'`. The supplied eavesdropping
entry remains held, rather than teaching the wrong sense or silently certifying a
correction. Compare the [MATSEC marking scheme, p.11](https://www.um.edu.mt/media/um/docs/directorates/matsec/markingschemesandsba/markingschemes/2018/sec/Marking20Scheme20-20SEC202220IL-20MALTI20201820May.pdf#page=11)
and [original poetry in the UM repository](https://www.um.edu.mt/library/oar/bitstream/123456789/134462/1/Il_poe%C5%BCija.pdf#page=2).

The chat-suggested game answer `borsa` is not imported as bag. Existing `borża`
already covers that meaning, but substituting it would break the source task's
required `-SA` ending. The suggested answers are not an official teacher key.

## Verification

Before authoring, `npm run materials:preflight` passed with the existing changes
present. `npm run vocabulary:audit` confirms every selected form reaches its
intended learning file, preserves previously covered forms, and requires a
decision for every textual gap. Run it without `--capture-before`; that capture
option refuses to replace an existing snapshot.

The shared search, vocabulary-review, comprehensive-assessment and offline
generators were rebuilt. New vocabulary adds 18 canonical word-review records;
the coverage bank now has 1,271 targets. Aliases preserve existing review IDs.

The browser regression command is `npm run vocabulary:gaps:check`, using the
running local server at port 4190 or `TOPICS_TEST_URL`. Its scope is the changed
learning banks on ten pages, not a certification of every legacy page region.
Screenshots go to ignored `tmp_ui/vocabulary-gaps/`; they are not new baselines.

Confirmed checks:

- `materials:check`: passed, including schemas, typed data, verification, links,
  exact UI policy/style ownership, search and offline asset freshness. Existing
  Year 4 missing-example warnings remain unchanged.
- `vocabulary:audit`: all 292 baseline records retained and all 69 selected
  additions/promotions/aliases reach their intended learning files.
- `vocabulary:gaps:check`: passed 60 scoped accessibility/viewport/theme cases on
  ten pages, with keyboard bookmarks, reload persistence, aliases, search and
  preservation of existing review/exercise/number progress.
- `coverage:check`: 1,271 targets are current.
- Desktop/mobile screenshots of the work, incident and cooking additions were
  inspected for readable text, aligned controls and overlap.
