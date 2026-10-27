# Gender, Food and Cafe Integration

Date: 2026-10-28.

## Scope and Ownership

The user requested topic-based integration of supplied gender/agreement, grocery
and cafe materials. There is no numbered lesson page or learner-facing lecture
label. Tonina, the introductions worksheet and the three-word game are outside
this implementation.

- `gender_agreement.html` is a detailed grammar reference, linked from Grammar
  navigation and Grammar Path. The existing tracked `grammar-agreement` target
  and its progress identity are unchanged.
- `food_preferences.html` owns grocery vocabulary, quantities and shopping
  dialogues. Existing food words are reused instead of imported again.
- `restaurant_ordering.html` owns cafe vocabulary, ordering and payment.
- Typed banks use `renderExampleBanksFromData`; vocabulary uses the existing
  vocabulary renderer. New exercises use `MaltiExerciseRunner` and its existing
  progress, feedback and retry behavior.
- Tables use the shared table presentation and dedicated review-action columns.
  Disclosures contain an outer `study-disclosure-body` and a separate inner bank
  target, keeping generated toolbars inside the disclosure hierarchy.
- No CSS, runtime renderer, UI exception registry or policy change is required.
  Existing review prefixes, item IDs and storage keys remain unchanged.

Redundant section tags on the two expanded pages were removed: their numeric
order no longer matched the inserted topics, and their inherited forest-theme
appearance failed rendered contrast checks. Semantic headings remain. No local
colors or shared theme changes were introduced.

## Source Inventory

The full local intake is `lesson-04-materials-analysis.md` in the supplied material
directory. It records format deduplication and visual checks of scanned pages.
That filename identifies provenance, not a public lesson label. Source documents
are not redistributed with this implementation.

| Source | Selected material | Use |
| --- | --- | --- |
| S01 | `1a.Il-Gens-Prezentazzjoni.pptx` | Gender contrasts and family/role examples |
| S02 | `il-ġens.odt` | Reference pairs and adjective forms |
| S03 | `il gens fill in.pdf` | Twelve contextual gender prompts |
| S04 | `maskil femminil.pdf` | Ten past-tense forms and four usable odd-word prompts |
| S05 | `djalogu at the green grocer.pptx` | Shopping and cafe communication patterns |
| S06 | `djalogu supermarkit to fill in.docx` | Open shopping template; not treated as identical to S07 |
| S07 | `fis supermarket example dialogue.pdf` | Supermarket dialogue and quantities |
| S08 | `vokabularju fis-supermarkit.odt` | Produce, drinks, cheese and cold cuts |
| S09 | `vokabularju_kafe_malti.pptx` | Coffee, milk, sugar, requests and payment |
| S10 | `vokabularju_ħelu_kafe_malti.pptx` | Clear pastry terms and ordering requests |

Data banks retain source mappings and distinguish editorial examples/exercises
from source-provided answer sheets. The new assessment keys were editorially
reviewed; they are not described as teacher-certified.

## Linguistic Review Before Publication

All new learning text was compared with the intake and reviewed for Maltese
letters, apostrophes, article assimilation, noun/adjective agreement, verb person,
possessives, measures and English meaning before insertion. Targeted primary
checks corroborate particular forms; they do not certify every sentence or a
whole generated paradigm. A second read-only reviewer checked the difficult
gender and vocabulary decisions. The live Gabra service redirected rather than
returning dictionary entries, so no successful live Gabra verification is claimed.

### Gender Decisions

| Item | Publication decision |
| --- | --- |
| 23 noun pairs | Retain full pairs, distinguishing stem changes and different words; do not implement an append-a converter. |
| `Serduk` | Correct to `serduq`; preserve original spelling in the intake. |
| `ħu / oħt` and `ħija / oħti` | Separate brother/sister from my brother/my sister. |
| `għalliem / għalliema` | Specify feminine singular in this contrast; do not claim `għalliema` is never plural. |
| `ġuvni / tfajla; ġuvni / xebba` | Retain alternatives in the reference; the unchanged `It-` exercise requires `tfajla`, not `xebba`. |
| `patri / soru` | Translate friar/nun as corresponding roles, not identical offices. |
| `żiemel / debba` | Horse, or stallion in this contrast, versus mare. |
| Seven adjective pairs | Use `twila`, `mħawda`, `mgħawġa`, `mxarrba`, `mħassra`, `mkissra`, `mfarrka`; contextual English glosses are not exclusive meanings. |
| `mgerfex / mgerfxa` | Withhold from published reference and assessment pending stronger confirmation. |
| Context Q4 | Change contradictory masculine instruction to feminine counterpart of `patri`; answer `soru`. |
| Context Q8 | Simplify source opening `Darba wieħed raġel` to `Darba raġel`; retain the source wording in the intake. |
| Ten classified verbs | Label third-person singular past-tense forms, not a general ending-based gender rule. |
| Odd-word row with `moħor` | Withhold the entire ambiguous row, not a guessed replacement. |

Primary references for these bounded checks:

- [Education Department grammar resources](https://malti.skola.edu.mt/primarja/tlietapri/il-grammatika-3/): gender and adjective teaching resources.
- [Charles Daniel Saliba, A2 syllabus, 2025, grammar objectives](https://www.um.edu.mt/library/oar/bitstream/123456789/140650/1/Maltese_as_a_foreign_language_syllabus_juniors_level_A2_elementary_2025.pdf): basic noun/adjective gender contrasts, not a universal ending rule.
- [Guzi Gatt, goat and sheep vocabulary, pp. 140-141](https://www.um.edu.mt/library/oar/bitstream/123456789/37516/1/moghoz%20u%20naghag%20vokobularju.pdf): `bodbod/mogħża` and `muntun/nagħġa`.
- [MATSEC specimen assessment](https://www.um.edu.mt/media/um/docs/directorates/matsec/markingschemesandsba/specimenpapers/sec/SpecimenPaper-SEC22Malti2025%281%29.pdf): usage of `mħawda`, not a complete adjective paradigm.
- [National Literacy Agency, Il-Kutra tal-Pingwini](https://nla.gov.mt/wp-content/uploads/2024/07/Il-Kutra-tal-Pingwini.html): usage of `mxarrba`.

### Food and Cafe Decisions

| Item | Publication decision |
| --- | --- |
| `ġidra` | Correct source's turnip gloss to kohlrabi. |
| `karroti` | Correct to `karrotti`; avoid mixing collective and one-item forms without context. |
| `Qarabali` | Do not copy the defective spelling; any retained marrow term requires a checked form. |
| `minerali` | Soft drinks in the shopping context, not literal minerals. |
| `ġobon tat-tursina` | Retain blue/blue-veined cheese; do not miscorrect to parsley cheese. |
| Descriptive cheese names | Translate descriptively; do not guarantee an exclusive branded/product variety. |
| Payment | Use correctly hyphenated `tnax-il ewro`; distinguish euros and cents. |
| `bil-card` | Use a supported Maltese payment form, not the unreviewed source mixture. |
| Singular/plural customer | Keep `jogħġbok / jogħġobkom` and `miegħek / magħkom` distinct. |
| Strawberry agreement in S07 | Withhold the conflicting adjective/number example. |
| `Se neħħu hawn` | Exclude: it does not reliably express the supplied English. Do not guess a replacement and call it source text. |
| `sustanza = sweetener` | Exclude the unsupported standalone equivalence. |
| Americano / long black | Do not teach the source's asserted recipe equivalence. |
| `tal-Iskun`, uncertain biscuit names and sweetness claims | Withhold unresolved terminology; do not label ordinary ricotta pastizzi as sweet. |

Primary terminology references:

- [NSO, Agriculture 2007, Appendix A, printed p. 117](https://nso.gov.mt/wp-content/uploads/Agriculture_2007online.pdf#page=135): bilingual produce names, including kohlrabi and carrots.
- [Council of the EU, ST 14757/2011 ADD 29, Maltese](https://data.consilium.europa.eu/doc/document/ST-14757-2011-ADD-29/mt/pdf#page=11): blue-type cheese terminology.
- [Kunsill tal-Malti, euro guidance](https://kunsilltalmalti.gov.mt/wp-content/uploads/2025/03/euro_EN.pdf): currency spelling and number conventions.
- [Identita, Maltese eID FAQ](https://identita.gov.mt/mt/frequently-asked-questions/maltese-eid-cards/): official usage of `bil-kard` in a payment question. Other payment phrasing may be editorial reuse of existing site patterns.

## Release Boundaries

Unresolved originals stay in the local intake and this editorial review queue,
not learner-facing banks, search results or automatic scoring. The existing zero
pending/quarantined runtime-content budget is not relaxed. Editorial review is
not proof of native-speaker or teacher certification.

## Implemented Coverage

- Gender: 23 noun pairs, seven adjective pairs, 20 bilingual sentence examples,
  ten past-tense forms and four rules. Four exercise sets contain 33 tasks.
- Food and cafe: 42 new vocabulary items, 51 bank entries and 38 exercises.
  Existing food and restaurant items remain unchanged. Existing words such as
  `perżut`, `ġobon`, `patata`, `ħalib` and `zokkor` are reused.
- The 71 tasks use the existing grading engine. New topic IDs do not rename or
  overwrite older results. The three expanded pages are reachable through the
  shared navigation map, local contents and cross-topic links.
- Search, vocabulary-review catalog, comprehensive assessment bank and service
  worker were rebuilt through their existing generators. The comprehensive bank
  gains 42 vocabulary targets; the old book-course target identities are retained.
- Topic bank JSON and exercise JSON are registered in the existing offline build.

## Validation

Confirmed on 2026-10-28:

- `npm run materials:preflight` passed before authoring.
- `npm run materials:check` passed after integration; this includes schema,
  typed-model, content verification, link, UI ownership/style, search and PWA
  checks. The pre-existing 26 missing-example warnings in Year 4 data remain.
- `npm run topics:check` exercises all 71 correct answers, an incorrect attempt
  and retry, bookmark toggle/reload persistence, saved exercise results and
  preservation of seeded unrelated review/number progress.
- That browser suite checked 320px, 390px and 1440px in classic, forest and
  contrast themes: 27 page/viewport/theme combinations and 18 serious/critical
  accessibility audits. It checks visible image loading, page overflow and table
  review-column alignment. Screenshots are local artifacts, not new baselines.
- `npm run theme:a11y`, `npm run coverage:check` and
  `node scripts/build_vocabulary_review_catalog.js --check` passed.
- The navigation-search functional suite passed all three checks.
- The review-games functional suite passed all 13 checks, including individual
  bank bookmarks across the site's pages and shared vocabulary/game behavior.
- The offline-pwa functional suite passed all three checks. A separate browser
  test visited each affected page, switched the context offline and successfully
  reloaded the new gender, produce and coffee banks.
- Independent read-only review of the final learning data found no confirmed
  linguistic bugs or ambiguous graded keys and confirmed that previous group
  and item identities in the four food/restaurant banks were unchanged.

The browser suite checks product network loads before injecting axe. Axe's
cloned CSSOM makes audit-only requests for relative imported stylesheets against
the document URL; those requests are separated from application-resource errors.
No accessibility rule or result filter was disabled to address that tooling
behavior. Serious/critical findings remain failures.

Run the topic browser suite against the running repository server:

```sh
npm run topics:check
```

The default server URL is `http://127.0.0.1:4190`; `TOPICS_TEST_URL` can override
it. Screenshots are written to the ignored `artifacts/gender-food-cafe/` folder.

## Ordering Practice Extension

Added on 2026-10-28 in response to the request for vegetable, fruit and coffee
ordering exercises. The two original six-question sets retain their IDs and
questions; three new independent progress records are added:

| Set | Tasks | Communication covered |
| --- | ---: | --- |
| `food-vegetable-orders` | 8 | Shopping list, vegetable names, half/whole kilo, polite request, adding an item, closing an order |
| `food-fruit-orders` | 8 | Fruit names, different quantities, apples, oranges, grapes, strawberry boxes, price and farewell |
| `restaurant-coffee-orders` | 10 | Black coffee, milk choices, sugar, cappuccino, oat milk, takeaway, one addressee and card payment |

These are editorial exercises based on the reviewed S05-S09 vocabulary and
service patterns, not recovered teacher answer keys. Each has contextual
feedback. Sentence-sized model answers can be saved through the existing
missed-answer review action. Word-order tasks constrain the opening and the
position of please; short-answer prompts specify the gap rather than demanding
one arbitrary translation of an open-ended request.

`kilo` and `kilogramma` are accepted for the one-kilo measure gap; `mingħajr` and
`bla` are accepted for the without-sugar gap. The existing engine normalizes
case, outer whitespace and terminal punctuation while retaining Maltese letters.
The variants are corroborated by Maltese-language primary usage:
[Parliament of Malta, 23 February 2026, p. 27](https://www.parlament.mt/media/137707/20260223_436o_par.pdf)
uses `kilogramma`; [Health Promotion and Disease Prevention dietary guidance](https://hpdp.gov.mt/sites/default/files/2024-05/Dietary%20Guidelines%20Elderly%20Book%20%28MLT%29%202024%20LR.pdf)
uses `bla zokkor` for drinks. These bounded checks do not certify all authored
sentences. No disputed strawberry agreement, sweetener equivalence or defective
source ordering phrase has been introduced.

The sets use shared native disclosures and `MaltiExerciseRunner` on the existing
shopping and cafe practice sections. No renderer, CSS, storage key or UI policy
exception changes are required. The browser regression suite now checks all
new sets with both accepted-answer paths, an empty attempt, retry, exact full
scores, missed-answer review, keyboard token insertion/return and persisted
best scores. Expanded ordering banks are included in responsive/theme and
accessibility coverage, with separate screenshots rather than baseline updates.
