# Lesson 03 Particles Analysis and Site Integration Plan

Analysis date: 2026-10-21. Language of explanations and translations: English.
Maltese source text is retained separately from corrections. No site changes or publication are included in this analysis.

## 1 Scope and Evidence

The folder contains 25 source files representing 11 basename groups: 10 teaching materials and one Loop meeting-note container. Different formats of the same material are not counted as separate lessons. Different presentations with similar names remain separate when their questions differ.

All 25 files were opened by a parser. All 64 slides across the four unique decks were extracted; PDF counterparts were used to cross-check extraction. Scanned notes and the motorcycle worksheet were also rendered and visually read. Original text, including distractors and extraction defects, is in [raw extraction](analysis/source-extraction.md); machine-readable evidence with file hashes and unit numbers is in [source-extraction.json](analysis/source-extraction.json).

### Unique Material Inventory

| ID | Source basename | Formats present | Selected content source and coverage |
| --- | --- | --- | --- |
| M01 | 1a.-Il-Prepozizzjonijiet-quddiem-konsonanti-xemxin-prezentazzjoni | PPTX, ODP, PDF | PPTX text plus PDF; 12 slides, 9 wrong/right sentence contrasts |
| M02 | 2a.-Il-prezentazzjonijiet-bl-artiklu-prezentazzjoni (1) | PPTX, ODP, PDF | PPTX plus PDF and interactive links; 21 slides, article-selection explanation, 8 practice contrasts |
| M03 | breakout rooms partiċelli | ODT, PDF | PDF text, ODT cross-check; 12 translation prompts |
| M04 | il-misteru ta' l-għar l-aħmar qari | ODT, PDF | PDF plus ODT; 8 narrative sentences, 8 comprehension questions; second PDF page has no additional lesson text |
| M05 | Il-particella-lil-imqassra-lil-ma-direzzjonijiet-loghba-gdida | DOCX, ODT, PDF | PDF text and visual layout; 9 direction phrases, group-writing instructions, 9 answer lines |
| M06 | Il-particella-lil-imqassra | PPTX, ODP, PDF | PPTX text and hyperlink targets; 22 slides, 9 multiple-choice questions, picture-reveal game |
| M07 | lil-imqassra | PPTX, ODP, PDF | PPTX text and PDF visual check; 9 slides, 7 different multiple-choice questions |
| M08 | Maltese as a foreign language level 2 2026-10-20 | LOOP | Proprietary Microsoft.Prague container; 72 complete JSON fragments recovered from DEFLATE streams. Readable text segments are empty meeting-template headings, not additional language material. Full live-document reconstruction is not certified. |
| M09 | note partiċelli | PDF | One scanned page; visual transcription of 10 contractions, 7 additional examples and 3 explanations |
| M10 | partiċelli + artiklu | PDF | One scanned page; full motorcycle narrative, 15 gaps, source prompts and image inspected |
| M11 | particelli note | DOCX, ODT, PDF | DOCX plus PDF; English definition, 10 meanings, 10 contractions, 3 example constructions |

### Format Reconciliation

- ODP/ODT can merge adjacent formatted spans into words such as `Agħmelix-xogħol` or `nofsinharmeta`; use the PDF to restore spacing, not as evidence of a linguistic error.
- The DOCX direction sheet repeats text from drawing/textbox wrappers in XML. These are duplicate extraction instances, not additional examples. PDF provides one copy of each phrase.
- The `lil-imqassra.pdf` text layer omits some visible sentence content. PPTX preserves the seven complete prompts. A short PDF extraction does not mean the presentation is shorter.
- M01 intentionally displays incorrect forms beside corrected ones. M02 intentionally offers incorrect article choices. Preserve these only as labelled distractors.
- M06 contains repeated picture-grid slides used for animation/navigation. These do not create new questions. Correct answer links are captured in [interactive-links.json](analysis/interactive-links.json).
- No complete parse of the proprietary Loop document is claimed. [Recovered JSON fragments](analysis/loop-recovered-fragments.json) include `Agenda`, `Meeting notes`, `Follow-up tasks`, `Task`, `Assigned to`, `Due date`, `Planner Task Id`, and `Bucket`, but no recovered Maltese lesson text. Do not invent material from its filename.

## 2 Validation Method and Statuses

Every example or exercise below has a stable intake ID and a review decision. These decisions are an editorial audit, not a teacher's endorsement of every sentence.

- **RULE**: the target form follows the stated rule and was checked against supplied material and the primary teaching references below; no target-form correction identified.
- **KEY**: the correct option is recoverable from the original PPTX's answer hyperlink and also agrees with the rule.
- **FIX**: a specific correction is recorded, with the source wording retained in evidence.
- **DRAFT**: a new English translation or answer composed for this analysis, not a supplied answer key. Rule/content checked, but not automatically a source-verified example.
- **REVIEW**: ambiguity or collateral wording needs a teacher/lexical decision before strict grading or publication of the whole sentence.

Rows can have more than one status: a source answer link may establish the intended particle while the surrounding sentence still needs review. Wrong alternatives are intentionally wrong, not silently corrected into additional positive examples.

### Primary Validation References

- **V1**: [Official Maltese teaching resources for Year 5](https://malti.skola.edu.mt/primarja/hamsapri/il-grammatika-5/), sections on prepositions, shortened `lil` and directions. This locates original teaching resources, not independent attestation of every story sentence.
- **V2**: [Official shortened lil poster](https://malti.skola.edu.mt/wp-content/uploads/2009/08/iktibni-sew-lil-imqassra.pptx), downloaded as [official-lil-rules.pptx](analysis/official-lil-rules.pptx). Two slides explicitly contrast consonant/vowel boundaries and article/no-article forms.
- **V3**: [Official direction poster](https://malti.skola.edu.mt/wp-content/uploads/2009/08/iktibni-sew-il-u-l-ma-direzzjoni.pptx), downloaded as [official-direction-rules.pptx](analysis/official-direction-rules.pptx). Three slides give examples with `’il` and `’l`.
- **V4**: M09 scanned textbook-style note, visually inspected. Publisher/book identity is not supplied; do not invent bibliographic attribution.
- **V5**: Original M06 answer hyperlinks, preserved in `analysis/interactive-links.json`.

The new English translations and unsupplied answer keys below are editorial. Preserve that distinction when converting to site verification metadata. Repeated distribution of the same presentation is not an independent linguistic source.

## 3 Complete Rule Reference

### R01 Particles and Their Meanings

Particles are short words expressing relationships. These ten prepositions can combine with the definite article. Source: M09 and M11. `ma’` and `bi` both translate as "with" in some contexts, but are not generally interchangeable: accompaniment versus instrument/manner is an important teaching contrast.

| ID | Particle | English | With article | Example from M09 | English example | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| L03-ref-01 | fi | in | fil- | fil-ħanut | in the shop | RULE |
| L03-ref-02 | ma’ | with | mal- | mal-mamà | with Mum | RULE |
| L03-ref-03 | lil | to; also marks certain direct objects | lill- | lill-isqof | to the bishop | RULE |
| L03-ref-04 | għal | for | għall- | għall-erwieħ | for the souls | RULE |
| L03-ref-05 | ta’ | of | tal- | tal-Mużew | of the museum | RULE |
| L03-ref-06 | sa | as far as; until | sal- | sal-belt | as far as the city | RULE |
| L03-ref-07 | minn | from | mill- | mill-iskola | from the school | RULE |
| L03-ref-08 | ġo | inside; in | ġol- | ġol-gaġġa | inside the cage | RULE |
| L03-ref-09 | bi | with; by | bil- | bil-maqlub | upside down | RULE |
| L03-ref-10 | bħal | like | bħall- | bħall-ieħor | like the other one | RULE |

Source equations use either `l-` or `il-` to demonstrate the article. This is a teaching decomposition, not an instruction to write two separate articles. The resulting form depends on the next word.

### R02 Sun Consonants and Assimilation

Sun consonants: `ċ, d, n, r, s, t, x, z, ż`. The article's `l` assimilates to the initial consonant. This is not permission to change every final consonant in the preposition. For example, `minn + in-nar → min-nar`.

M01 contrasts below retain the source's deliberately incorrect alternatives. English translations are editorial.

| ID and slide | Deliberately wrong source form | Target teaching form | English | Decision |
| --- | --- | --- | --- | --- |
| L03-sun-01; M01/3 | Rajna lill-neputija. | Rajna lin-neputija. | We saw the niece/granddaughter. | RULE; kinship translation depends on context |
| L03-sun-02; M01/4 | Sellili għall-ziju. | Sellili għaz-ziju. | Say hello to the uncle for me. | RULE for għaz-; REVIEW the lexical wording Sellili before publishing the full sentence |
| L03-sun-03; M01/5 | Fil-telgħa tbati bir-rota. | Fit-telgħa tbati bir-rota. | Cycling uphill is hard work. | RULE |
| L03-sun-04; M01/6 | Ħrabt mill-nar. | Ħrabt min-nar. | I escaped from the fire. | RULE |
| L03-sun-05; M01/7 | Toqgħodx fil-xemx! | Toqgħodx fix-xemx! | Do not stay in the sun! | RULE |
| L03-sun-06; M01/8 | Ġejt bil-ċavetta li selliftni. | Ġejt biċ-ċavetta li selliftni. | I came with the key you lent me. | RULE |
| L03-sun-07; M01/9 | Morna sal-Rabat. | Morna sar-Rabat. | We went as far as Rabat. | RULE; this place name takes an article |
| L03-sun-08; M01/10 | Agħmel ix-xogħol tal-dar sew. | Agħmel ix-xogħol tad-dar sew. | Do the housework/homework properly. | RULE; FIX extraction-only missing space in ODP |
| L03-sun-09; M01/11 | Ħadna ritratt mal-tfal. | Ħadna ritratt mat-tfal. | We took a photo with the children. | RULE |

Additional M09/M11 examples:

| ID | Form | English | Decision |
| --- | --- | --- | --- |
| L03-extra-01 | fix-xelter | in the shelter | RULE |
| L03-extra-02 | mas-surmast | with the headteacher | RULE |
| L03-extra-03 | liz-ziju | to the uncle | RULE |
| L03-extra-04 | ġol-ilma | in the water | RULE |
| L03-extra-05 | mal-art | with/against the ground, depending on context | RULE; do not translate as "on the ground" universally |
| L03-extra-06 | tal-ewwel | of the first; first, depending on context | RULE |
| L03-extra-07 | sal-artal | as far as the altar | RULE |
| L03-extra-08 | fi + ix-xemx → fix-xemx | in the sun | RULE; source shorthand Fi+ix omits the noun in the decomposition |
| L03-extra-09 | ġo + id-dar → ġod-dar | inside the house | FIX source spacing ġod- dar; no internal space after the hyphen |
| L03-extra-10 | fi + id-dar → fid-dar | in the house | RULE |

### R03 Before Vowels

M09 explicitly retains article combinations for `ġo`, `ma’`, `sa`, `ta’` before vowel-initial words: `ġol-ilma`, `mal-art`, `sal-artal`, `tal-ewwel`. Do not apply one mechanical vowel rule to every particle. In other contexts the reduced forms `fl-` and `bl-` occur; the reading's `bil-oġġett` needs `bl-oġġett`.

### R04 Choosing Article or No Article

M02's substitution aid: try `ta’` versus `tal-` (or its assimilated variant) with the following noun phrase. If that phrase takes an article, use the corresponding article-bearing preposition. This is a learner's diagnostic, not an algorithm based solely on English "the".

Proper names and possessive forms such as `Jane`, `ommu`, `sieħbu`, `oħti`, `ommi` differ from article-bearing phrases such as `il-ħabiba` and `il-pazjenti`. Some place names take articles, so "never use an article with a proper name" is false.

| ID and slides | Correct source model | Wrong option or comparison | English | Decision |
| --- | --- | --- | --- | --- |
| L03-article-01; M02/2–5 | Mort għal Jane l-ajruport. | Mort għall-Jane l-ajruport.; ta’ Jane versus tal-Jane | I went to the airport to meet/pick up Jane. | RULE |
| L03-article-02; M02/7–8 | Mort għall-ħabiba l-ajruport. | ta’/tal- test: tal-ħabiba → għall-ħabiba | I went to the airport to meet/pick up the female friend. | RULE |
| L03-article-03; M02/9–11 | It-tabib żar lill-pazjenti l-isptar. | It-tabib żar lil pazjenti l-isptar. | The doctor visited the patients in hospital. | RULE for intended definite reading; no-article phrase is not wrong in every possible context |
| L03-article-04; M02/12 | It-tabib żar lil ommu l-isptar. | ta’ ommu → lil ommu | The doctor visited his mother in hospital. | RULE |
| L03-article-05; M02/13 | Mark weġġa’ bħall-ħabib tiegħu. | Mark weġġa’ bħal ħabib tiegħu. | Mark got hurt like his friend. | RULE for intended definite reading |
| L03-article-06; M02/14 | Mark weġġa’ bħal sieħbu. | Mark weġġa’ bħall-sieħbu. | Mark got hurt like his companion. | RULE |
| L03-article-07; M02/15 | Rajt lill-ħabiba wara l-kantuniera. | Rajt lil ħabiba wara l-kantuniera. | I saw the female friend around the corner. | RULE for intended definite reading; lil ħabiba can mean a female friend |
| L03-article-08; M02/16 | Xtrajt rigal lil oħti. | Xtrajt rigal lill-oħti. | I bought a present for my sister. | RULE |
| L03-article-09; M02/17 | Aħbar bħal dik qatt ma stennejtha. | Aħbar bħall-dik qatt ma stennejtha. | I never expected news like that. | RULE |
| L03-article-10; M02/18 | Tkellimx lil min ma tafx! | Tkellimx lill-min ma tafx! | Do not speak to someone you do not know! | RULE |
| L03-article-11; M02/19 | Ħabiba ta’ veru bħal Hannah għad irrid nara. | Source correct-choice line has għad irid nara; alternative has bħall-Hannah | I have yet to meet a true friend like Hannah. | FIX irid → irrid for first-person nara; bħal Hannah is the particle target |
| L03-article-12; M02/20 | Għal ommi nagħmel kollox. | Għall-ommi nagħmel kollox. | I do everything for my mother. | RULE |

### R05 Shortened lil and lill

V2 explicitly distinguishes two independent decisions:

1. Does the following noun phrase take the article? `lil` has no article; `lill-` includes the article.
2. Does contraction leave a consonant on both sides? If so retain the supporting vowel `i`.

| Full form | At least one neighbouring vowel | Consonants on both sides | Hyphen |
| --- | --- | --- | --- |
| lil | ’l | ’il | No |
| lill- | ’l- | ’il- | Yes, attached to the following noun |

This boundary check uses the surrounding words, not merely the first letter of the following name. Do not confuse the required apostrophe with a closing quotation mark. In stored data accept straight and typographic apostrophes for input, but keep distinctions between `’l`, `’il`, `’l-`, `’il-`.

Use sound-aware examples rather than a raw first/last-character test: the direction poster writes `Mur ’l hemm` and `Ejja ’l hawn`. The written h in those words must not be treated as an ordinary pronounced consonant by an automatic helper.

M06's source key is obtained from answer-label hyperlinks leading to the next reveal-grid state (rather than the failure grid). Options always contain all four forms; their letter/order differs by slide. IDs below preserve slide provenance, not an inferred global option order.

| ID; M06 slide | Prompt | Correct option | English rendering | Decision |
| --- | --- | --- | --- | --- |
| L03-lil-a01; 4 | Staqsejna ___ xulxin x’kien ġara. | b: ’l | We asked each other what had happened. | KEY |
| L03-lil-a02; 5 | Fittxew ___ Robert kullimkien. | d: ’il | They looked everywhere for Robert. | KEY |
| L03-lil-a03; 6 | Ħallejt ___ Katya tiġi miegħi sal-bandli. | ċ: ’il | I let Katya come with me to the swings. | KEY |
| L03-lil-a04; 7 | It-turisti staqsew ___ gwida fejn kienu sejrin. | b: ’il- | The tourists asked the guide where they were going. | KEY |
| L03-lil-a05; 8 | Temgħu ___ kelb għax kien bil-ġuħ. | b: ’l- | They fed the dog because it was hungry. | KEY |
| L03-lil-a06; 9 | Slift il-ktieb tal-Ingliż ___ sieħbi għax insieh l-iskola u kellu bżonnu. | d: ’il | I lent my friend the English book because he had left his at school and needed it. | KEY; translation makes the contextual book reference explicit |
| L03-lil-a07; 10 | Julia gżat ___ dawk it-tfal li ħadulha l-pokit. | a: ’il | Julia [source verb requires lexical review] those children who took her pocket money. | KEY for particle; REVIEW gżat and pokit before translating/grading the entire sentence |
| L03-lil-a08; 11 | Sellimt ___ ġar meta rajtu miexi fit-triq. | ċ: ’il- | I greeted the neighbour when I saw him walking in the street. | KEY |
| L03-lil-a09; 12 | Jiena nxejjer ___ kulħadd. | d: ’il | I wave to everyone. | KEY |

M07 is a different exercise, not a duplicate of M06. Its door graphics use `noaction` links/animation, so the answers here are checked against V2's rule, not claimed as extracted hyperlinks.

| ID; M07 slide | Prompt | Answer | English | Decision |
| --- | --- | --- | --- | --- |
| L03-lil-b01; 2 | Rajt ___ ommi xxejjirli mill-gallarija. | ’l | I saw my mother waving to me from the balcony. | RULE |
| L03-lil-b02; 3 | Staqsejt ___ Mark mistoqsija tal-Matematika. | ’il | I asked Mark a mathematics question. | RULE |
| L03-lil-b03; 4 | Kellimna ___ kuġina tiegħek ilbieraħ. | ’l- | We spoke to your female cousin yesterday. | RULE |
| L03-lil-b04; 5 | Ċempilt ___ parrinu biex nitkellmu dwar il-Griżma. | ’il- | I called the godfather/sponsor to discuss Confirmation. | RULE |
| L03-lil-b05; 6 | Qabel tlaqna, sellimna ___ xulxin. | ’l | Before we left, we said goodbye to each other. | RULE |
| L03-lil-b06; 7 | Staqsew ħafna mistoqsijiet ___ xulxin. | ’il | They asked each other many questions. | RULE |
| L03-lil-b07; 8 | Bagħtu ___ kulħadd id-dar. | ’l | They sent everyone home. | RULE |

M06 game instructions: answer questions by selecting yellow numbered boxes; correct answers remove a tile, wrong answers return to the grid; continue through 1–9; guess the final picture. Source answer: a strawberry (`Stampa ta’ frawla`). For the site, ordinary accessible question controls can replace PowerPoint-only click regions. The source strawberry image is not licensed merely because it is embedded.

M07 instructions: select the correct shortened particle by clicking it; four doors represent the four options. Retain all seven prompts, not decorative duplicates of doors.

### R06 Direction Expressions

M05 and V3 distinguish fixed direction phrases. No hyphen joins the particle to the direction word. Phrases can be sensitive to the preceding sound: V3 has `Ħares ’il quddiem` while M05 lists standalone `’il quddiem`. Do not reject `’l quddiem` universally when the preceding context changes.

| ID | Source phrase | English meaning | Decision |
| --- | --- | --- | --- |
| L03-dir-01 | ’il barra | out; outside | RULE |
| L03-dir-02 | ’il ġewwa | in; inside | RULE |
| L03-dir-03 | ’il fejn | where to; in which direction | RULE; FIX improve source gloss where to preserve direction |
| L03-dir-04 | ’il bogħod | far away | RULE |
| L03-dir-05 | ’il fuq | up; upwards | RULE |
| L03-dir-06 | ’il quddiem | ahead; forwards | RULE; validate in its full sentence context |
| L03-dir-07 | ’l hawn | this way; towards here | RULE |
| L03-dir-08 | ’l hemm | that way; towards there | RULE |
| L03-dir-09 | ’l isfel | down; downwards | RULE |

M05 group task: words in bubbles indicate directions. As a group, write sentences with them on the nine lines on page two. When all sentences are written, call out `Lesti` (Ready/Done). There is no supplied nine-sentence answer key. Future site exercise should use model examples plus self-review, not grade every free sentence by a single fixed string.

## 4 Translation Exercise M03

Instruction: `Aqleb mill-Ingliż għall-Malti`. Source prompts have no supplied solutions. The following key is editorial and must retain gender/context alternatives.

| ID | English prompt | Proposed Maltese answer | Decision and explanation |
| --- | --- | --- | --- |
| L03-tr-01 | With the bag | Bil-borża | DRAFT; instrumental/carrying sense. Mal-borża is context-dependent, not a universally equivalent answer. |
| L03-tr-02 | With my friend | Ma’ ħabibi / Ma’ ħabibti | DRAFT; friend gender unspecified |
| L03-tr-03 | For the cousin | Għall-kuġin / Għall-kuġina | DRAFT; cousin gender unspecified |
| L03-tr-04 | To the woman | Lill-mara | DRAFT |
| L03-tr-05 | On the table | Fuq il-mejda | DRAFT; do not manufacture a fusion fuqil- |
| L03-tr-06 | In the sea | Fil-baħar | DRAFT |
| L03-tr-07 | In the street | Fit-triq | DRAFT; sun consonant t |
| L03-tr-08 | To Tom | Lil Tom | DRAFT; proper name without article |
| L03-tr-09 | From the city | Mill-belt | DRAFT |
| L03-tr-10 | Like the actor | Bħall-attur | DRAFT |
| L03-tr-11 | Like the pear | Bħall-lanġasa | DRAFT; retain the three l letters across the hyphen |
| L03-tr-12 | From China | Miċ-Ċina | DRAFT; the country name takes the article, with ċ assimilation |

## 5 Motorcycle Cloze M10

Title: `Dawra bil-mutur` (A motorcycle ride).
Instruction: `Imla bil-partiċelli biex tkompli s-sentenza.` (Fill in the particles to complete the sentence.)

### Source Text with All Gaps Preserved

Malli qomt dalgħodu fettili mmur dawra (bi) ___ mutur. Kien ilni snin ma nsuqu. Kont xtrajtu meta kelli 18-il sena, għamilt sena nsuqu, u xħin xtrajt il-karozza, ma soqtux aktar. Poġġejtu (fi) ___ garaxx ta’ missieri u minn dakinhar insejtu. Però dalgħodu tfajtlu l-petrol (ġo) ___ tank u malli pruvajt inqabbdu qabad (minn) ___ ewwel. Iddeċidejt li nitlaq (minn) ___ Xewkija, fejn joqgħod missieri, (għal) ___ Għajnsielem. Waqt li kont għaddej (minn) ___ triq, qasamli żiemel, evitajtu iżda ħbatt (ma’) ___ ħajt tas-sejjieħ li hemm (fi) ___ ġenb tat-triq. Waqajt għal tuli (fi) ___ art u stordejt. Waqaf wieħed jgħinni u malli rani (fi) ___ dak l-istat ċempel (lil) ___ ambulanza. Iżda sa (ma’) ___ ambulanza ġiet ilħaqt ġejt f’ tiegħi. Ħaduni l-isptar u żammewni jumejn (għal) ___ osservazzjoni. Nispera li d-darba li ġejja li mmur dawra ma jerġax jiġrili (bħal) ___ din id-darba.

This is a visual transcription with ordinary spacing restored; see the source image for line breaks. Do not use the low-quality PDF text layer as clean Maltese.

### Gap Audit

The noun is already outside the blank; an answer such as `bil-` must form `bil-mutur`, not `bil- mutur` on display. Store the particle and the completed phrase separately.

| ID | Cue and next word | Proposed fill | Completed phrase | Decision |
| --- | --- | --- | --- | --- |
| L03-gap-01 | bi + mutur | bil- | bil-mutur | DRAFT; RULE |
| L03-gap-02 | fi + garaxx | fil- | fil-garaxx ta’ missieri | DRAFT; RULE |
| L03-gap-03 | ġo + tank | ġot- | ġot-tank | DRAFT; RULE |
| L03-gap-04 | minn + ewwel | mill- | mill-ewwel | DRAFT; RULE |
| L03-gap-05 | minn + Xewkija | mix- | mix-Xewkija | DRAFT; RULE; place name takes an article |
| L03-gap-06 | għal + Għajnsielem | għal | għal Għajnsielem | DRAFT; RULE; this place name does not take the article here |
| L03-gap-07 | minn + triq | mit- | mit-triq | DRAFT; RULE |
| L03-gap-08 | ma’ + ħajt | mal- | mal-ħajt tas-sejjieħ | DRAFT; RULE |
| L03-gap-09 | fi + ġenb | fil- | fil-ġenb tat-triq | DRAFT; RULE; ġ is not ċ |
| L03-gap-10 | fi + art | fl- | fl-art | DRAFT; RULE |
| L03-gap-11 | fi + dak | f’ | f’dak l-istat | DRAFT; RULE; demonstrative, not an article contraction |
| L03-gap-12 | lil + ambulanza | lill- | lill-ambulanza | DRAFT; REVIEW semantic/metonymic use of ċempel lill-ambulanza before strict grading |
| L03-gap-13 | sa (ma’) + ambulanza ġiet | No approved fixed answer | Suggested rewrite: Iżda sa ma ġiet l-ambulanza, ilħaqt ġejt f’tiegħi. | REVIEW; temporal ma is not the accompaniment preposition ma’; do not mechanically grade mal- |
| L03-gap-14 | għal + osservazzjoni | għal | għal osservazzjoni | DRAFT; RULE; abstract purpose without an article |
| L03-gap-15 | bħal + din | bħal | bħal din id-darba | DRAFT; RULE |

Collateral source spelling: `f’ tiegħi` needs spacing repaired to `f’tiegħi`. Gap 13 needs a teacher decision before a single answer is enabled. The motorcycle photograph visibly contains a Shutterstock credit/watermark: do not republish it as an open-licensed asset.

## 6 Reading M04 with Sentence-Level English

Title: **Il-Misteru tal-Għar l-Aħmar** / **The Mystery of the Red Cave**.
Each Maltese sentence comes first, followed by English, preserving the user's requested reading/copy format. Translations are editorial. The source's one confirmed particle error is corrected explicitly in sentence 5.

### L03-read-01

Kien wara nofsinhar meta f’jum sħun ta’ Lulju, Leli u n-neputi tiegħu Ġanni ddeċidew li jesploraw l-għoljiet imwarrba wara r-raħal tagħhom.

One afternoon, on a hot July day, Leli and his nephew Ġanni decided to explore the remote hills behind their village.

Decision: DRAFT translation; no particle correction identified. Opening is stylistically redundant but retained. `neputi` can also mean grandson; nephew is the contextual reading used here, not a uniquely forced kinship meaning.

### L03-read-02

Għalkemm kienu ilhom joqogħdu f’dawk l-inħawi għal snin sħaħ, qatt ma kienu nnutaw passaġġ żgħir moħbi wara s-siġar tal-ħarrub antik.

Although they had lived in the area for many years, they had never noticed a small passage hidden behind the old carob trees.

Decision: DRAFT translation; no particle correction identified. Retain `antik` as supplied; do not label every unusual adjective placement an error without lexical review.

### L03-read-03

Imqanqla mill-kurżità, huma mxew b’attenzjoni bejn il-blat sakemm sabu ruħhom quddiem fetħa mudlama: l-Għar l-Aħmar.

Driven by curiosity, they walked carefully among the rocks until they found themselves facing a dark opening: the Red Cave.

Decision: DRAFT translation; RULE for mill- and b’.

### L03-read-04

L-isem kien ġej mill-kulur tal-blat mal-faċċata, li kien jixgħel lewn in-nar meta tolqtu x-xemx tal-għabex.

Its name came from the colour of the rocks at the entrance, which glowed like fire when the evening sun struck them.

Decision: DRAFT translation; RULE for the target particle combinations. English uses plural rocks idiomatically for collective Maltese blat.

### L03-read-05

Hekk kif daħlu ġewwa, il-kesħa tal-għar laqtet wiċċhom u bdew jisimgħu l-qtar tal-ilma nieżel bil-mod mis-saqaf.

As soon as they stepped inside, the cave's cold air hit their faces, and they began to hear water dripping slowly from the ceiling.

Decision: FIX source `mill-saqaf` → `mis-saqaf`, because s is a sun consonant. This is a source error, not merely PDF OCR. DRAFT translation.

### L03-read-06

Fuq wara nett tal-għar, Ġanni nnota xi ħaġa tleqq nofsha midfuna fil-ħamrija.

At the very back of the cave, Ġanni noticed something shiny, half buried in the soil.

Decision: DRAFT translation; no particle correction identified.

### L03-read-07

Kienet kaxxa żgħira tal-ħadid, imsadda biż-żmien, imma b’kurċifiss antik imnaqqax fuqha.

It was a small iron box, rusted with age, with an old crucifix engraved on it.

Decision: DRAFT translation; RULE for tal-, biż-, b’.

### L03-read-08

Mingħajr ma ħasbuha darbtejn, huma ddeċidew li joħduha d-dar biex jippruvaw jiftħuha flimkien mal-kumplament tal-familja.

Without thinking twice, they decided to take it home and try to open it together with the rest of the family.

Decision: DRAFT translation; no particle correction identified. `darbtejn` provides a cross-link to dual forms, not a reason to move this lesson into the numbers page.

### Comprehension Questions and Draft Answers

| ID | Maltese question, cleaned where noted | English question | Draft Maltese answer | Decision |
| --- | --- | --- | --- | --- |
| L03-qa-01 | F’liema xahar tas-sena sseħħ l-istorja? | In which month does the story take place? | F’Lulju. | DRAFT; supported by read-01 |
| L03-qa-02 | X’kien hemm wara r-raħal tagħhom? | What was behind their village? | Kien hemm għoljiet imwarrba. | DRAFT; read-01 |
| L03-qa-03 | Min huma ż-żewġ karattri prinċipali u x’inhi r-relazzjoni ta’ bejniethom? | Who are the two main characters, and how are they related? | Leli u Ġanni. Ġanni huwa n-neputi ta’ Leli. | DRAFT; read-01; preserve source kinship ambiguity |
| L03-qa-04 | Għaliex imxew bejn il-blat? | Why did they walk among the rocks? | Għax kienu mqanqla mill-kurżità u riedu jesploraw il-passaġġ. | DRAFT; read-02/03 |
| L03-qa-05 | Għaliex l-għar jismu “l-Għar l-Aħmar”? | Why is the cave called the Red Cave? | Għax il-blat mal-faċċata kien jixgħel lewn in-nar meta tolqtu x-xemx tal-għabex. | DRAFT; read-04 |
| L03-qa-06 | X’semgħu malli daħlu ġol-għar? | What did they hear as soon as they entered the cave? | Semgħu l-qtar tal-ilma nieżel mis-saqaf. | FIX source ġo l-għar → ġol-għar for lesson consistency; DRAFT answer |
| L03-qa-07 | X’sabu Leli u Ġanni midfun fil-ħamrija fuq wara tal-għar? | What did Leli and Ġanni find buried in the soil at the back of the cave? | Sabu kaxxa żgħira tal-ħadid, imsadda biż-żmien, b’kurċifiss antik imnaqqax fuqha. | DRAFT; read-06/07 |
| L03-qa-08 | X’għamlu bl-oġġett li sabu fl-aħħar tal-istorja? | What did they do with the object they found at the end of the story? | Iddeċidew li joħduh id-dar biex jippruvaw jiftħuh mal-familja. | FIX source bil-oġġett → bl-oġġett; DRAFT answer |

Do not grade the free comprehension answers against only one literal string. Suggested short-answer tokens can assess facts, while full sentences remain model answers/self-review unless acceptable alternatives are explicitly enumerated.

## 7 Consolidated Corrections and Review Queue

| Location | Source issue | Treatment |
| --- | --- | --- |
| M01 wrong columns | lill-neputija, għall-ziju, fil-telgħa, mill-nar, fil-xemx, bil-ċavetta, sal-Rabat, tal-dar, mal-tfal | Deliberate distractors; retain only as labelled incorrect contrasts |
| M02 wrong options | Article-bearing forms before Jane, sieħbu, oħti, dik, min, Hannah, ommi | Deliberate distractors; preserve the intended definite/indefinite distinction where alternatives could be grammatical in another context |
| M02 slide 19 | għad irid nara | Propose għad irrid nara; first-person form, not a particle rule |
| M11 | ġod- dar | ġod-dar; typographical spacing |
| M04 sentence 5 | mill-saqaf | mis-saqaf; source correction |
| M04 question 6 | ġo l-għar | ġol-għar; normalized contraction for teaching |
| M04 question 8 | bil-oġġett | bl-oġġett; source correction |
| M10 | f’ tiegħi | f’tiegħi; typographical spacing |
| M10 gap 13 | sa (ma’) ___ ambulanza ġiet | REVIEW conjunction ma versus preposition ma’; rewrite sentence before setting a strict key |
| M10 gap 12 | ċempel lill-ambulanza | Particle can be formed; REVIEW vehicle/service metonymy and whether a clearer noun is preferable |
| M01 slide 4 | Sellili għaz-ziju | Particle rule checked; REVIEW source verb wording, do not silently replace it |
| M06 slide 10 | Julia gżat ... il-pokit | Intended particle checked from hyperlink; REVIEW vocabulary/register and English translation |
| M03 prompt 1 | With the bag | REVIEW contextual alternatives if broad translation grading is intended |
| M03 prompt 2/3 | friend/cousin gender unspecified | Accept reviewed masculine/feminine alternatives, not only a single gender |
| M05 | ’il fejn = where | Improve English to where to/in which direction |
| Various XML extracts | repeated drawing text; merged runs; ’ i l - with separated characters | Extraction/layout artifacts; compare PDF and normalize without inventing extra learning items |

All examples have been assessed for the target rules, and exceptions are listed above. This does not assert independent corpus verification of every entire sentence. REVIEW items must not become positive example cards or auto-graded questions until resolved. No existing site validation budget is changed to admit unresolved material.

## 8 Proposed Site Integration

### Content Placement

The numbers page is not the right primary destination for particles. `prepositions_place.html` currently focuses on spatial position; `directions_town.html` focuses on practical directions. Keep these purposes rather than overloading the numbers page.

| Proposed destination | Sections and content | Reuse strategy |
| --- | --- | --- |
| New particles_prepositions.html | Particle meanings; article combinations; sun consonants; article/no-article diagnostic; shortened lil; common errors | One grammar reference and trainer, linked from grammar_path.html, all_pages.html and the topic map |
| particles_prepositions.html#practice | M01's 9 corrections, M02's 8 choices, M06/M07's 16 shortened-lil questions, M03's 12 translations, M10's 15-gap story with unresolved gap disabled | Shared question bank with topic filters; do not copy the same items into several independent progress stores |
| directions_town.html | M05's 9 direction phrases and a nine-sentence writing task | Link to the full contraction rule; reuse existing direction review entries when equivalent |
| New reading_red_cave.html | Complete 8-sentence Maltese-first bilingual reading; 8 comprehension questions; particle highlighting | Dedicated readable text rather than putting a long story inside a vocabulary card; link back to particle rules |
| prepositions_place.html | A short related-topic link to article contractions and the new trainer | Preserve existing spatial vocabulary, IDs and progress |
| numbers_calendar_time.html | Optional related-topic link from darbtejn to its existing dual-form entry | No duplication of the particle lesson or new number material inferred from it |

The filenames above are proposals, not newly created pages. A general reading library can replace the story-specific page later if the repository gains a shared reader.

### Reference and Exercise Design

1. Reference tables: ten particles, full/contracted form, noun context and English meaning. Add the sun-consonant contrasts as `study-contrast` items with explicit wrong/right labels.
2. Trainer modes: choose a form, complete a particle, rewrite a wrong form, translate a phrase. Progress from recognition to independent recall using existing study controls and storage patterns.
3. Shortened-lil helper: teach article choice and surrounding vowel/consonant boundaries as separate steps. Explanations should say why a hyphen is or is not needed. Do not collapse the four answer forms during normalization.
4. Reading: Maltese sentence first, English immediately below; translation toggle; copy Maltese only or with English, retaining paragraph boundaries. Keep comprehension answers hidden until requested.
5. Review: separate bilingual examples from question/answer prompts; permit bookmarking and targeted retry of mistakes through shared APIs. Writing directions is self-assessed; no missing audio is invented.

### Data and Component Contract

- Use the existing schema-version-2 learning-content banks and `assets/js/learning-content.js` adapter. Rule items are `rule`; bilingual phrases are `translation`; complete bilingual models are `example`; exercises/comprehension are `questionAnswer` with separate prompt/answer fields.
- Retain these L03 intake IDs or map them explicitly to stable site IDs. Each record needs material ID, original filename, slide/page/unit, original text, teaching text, correction reason and verification state.
- Introduce no new visual system: `content-card`, `table-soft`, `study-contrast`, `study-disclosure` plus `study-disclosure-body`, `study-input`, `study-option`, `toolbar-row`, `control-row`, `study-feedback`, and the existing review buttons.
- Use Maltese language metadata on learning text. English remains the translation/explanation language.
- Keep source mistakes as provenance or explicitly marked distractors, never as accepted positive examples.
- Leave unresolved material in this intermediate analysis until the verification workflow permits publication; do not weaken guards or increase quality budgets merely to import it.
- Link new pages through the shared sitemap/search and rebuild the offline service worker when implementation is approved. Do not republish textbook scans, Shutterstock photos or source clipart without permission or an adequate license.

### Implementation Order and Acceptance Checks

1. Resolve the review queue with the teacher, especially M10 gap 13 and M06 vocabulary; lock approved answers and alternatives.
2. Add typed source-backed data and reference sections, preserving all unique item IDs.
3. Add filtered exercises, diagnostics, mistakes review and keyboard interactions using shared controllers.
4. Add the reading and direction-writing integration; verify line-by-line bilingual copying and answer concealment.
5. Validate material coverage, positive/distractor separation, all four shortened forms, apostrophe handling, mobile at 320/390 px, three themes, accessible labels/focus, offline loading and unchanged existing progress.

Before any site authoring, follow repository `AGENTS.md`, the material-authoring workflow and the mandatory preflight. This analysis only read the repository to propose compatible destinations; it did not edit the site or make a commit.

## 9 Reproducibility

- `analysis/extract_sources.py`: XML/PDF extraction with SHA-256 source hashes.
- `analysis/inspect_sources.py`: selected PDF renders and cautious recovery of complete Loop JSON fragments.
- `analysis/extract_interactions.py`: original PowerPoint answer-link evidence.
- `analysis/source-extraction.md` and `.json`: all format variants, by unit.
- `analysis/renders/`: inspected notes, worksheet and direction/short-lil PDF pages.
- `analysis/validation-ledger.json`: per-item audit extracted from this Markdown, including decisions and coverage checks.
- `analysis/validate_analysis.py`: checks all 25 source hashes, 109 reviewed records, expected coverage counts, local evidence links and the nine original M06 answer keys.

Use the Markdown as the consolidated intermediate specification. Keep raw evidence beside it so corrected teaching versions can always be traced back to the supplied wording.
