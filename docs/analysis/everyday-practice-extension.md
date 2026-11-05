# Everyday Practice Extension

Date: 2026-10-28.

## Scope

Five additions extend the existing topic pages without a numbered lesson page:

| Destination | Addition | Assessment |
| --- | --- | --- |
| Food Preferences, `#shopping-conversation` | Seven turns at the greengrocer, including vegetables, fruit, quantities, price, total and farewell | Shared exercise runner; each turn has a stable progress ID |
| Restaurant and Ordering Food, `#coffee-conversation` | Seven turns for cappuccino, oat milk, sugar, takeaway, payment and farewell | Shared exercise runner; next turn requires a previously passed or newly correct answer |
| Gender and Agreement, `#whole-sentences` | Five complete-sentence transformations and five correction questions | Constrained answers with explicit agreement explanations |
| School and Classroom, `#three-word-challenge` | All ten supplied open vocabulary categories | Saved drafts and self-ratings, never an automatic vocabulary or pronunciation score |
| Daily Problems, `#tonina-listening` | Original recording, speed/position controls, ten bilingual questions and a notes field | Deliberately unscored; checked transcript and key remain withheld |
| Gender and Agreement, `#mixed-review` | Six-task selections with two gender, two shopping and two coffee items | Separate recognition/production statistics; open mistakes and due items take priority |

The source intake is the local `lesson-04-materials-analysis.md`, sections 2-8,
11 and 16-19; the audio comparison is `tonina-deep-analysis.md`. New conversations
and sentence transformations are editorial tasks, not teacher-provided keys.
Conversation prices are practice amounts, not live product prices.

## Language Decisions

Whole-sentence transformations constrain word order and the referent. They
check demonstratives, noun forms, auxiliaries and adjectives together; possession
in `tiegħi` remains unchanged when the referent changes. They reuse the reviewed
full forms rather than generating feminine forms by suffix replacement.

The three-word models are examples, not exhaustive answer lists. The incorrect
bag spelling `borsa` is not imported; `borża` would not satisfy the SA ending.
The model uses `għassa` alongside `qattusa` and `libsa`. Primary Maltese usage
corroborates `għassa` in the police-station sense:
[Maltese court judgment, p. 12](https://ecourts.gov.mt/onlineservices/Judgements/PrintPdf?CaseJudgementId=152169&JudgementId=0).
The controller checks only entry count, distinctness and requested letters;
neither word validity, category membership nor rhyme is inferred from spelling.
Editing an answer clears its earlier self-rating.

The audio questions are editorial paraphrases. They do not assert a damaged
source verb or teach an ASR reconstruction as a quotation. No uncertain
transcript or provisional automatic key is added to runtime data, review or
search. A human comparison of the disputed passages is still required before
publishing a faithful transcript or scored listening test. This boundary is not
removed by the presence of two speech-recognition outputs.

## Audio Provenance

The user supplied `Taninia.ogg`; its actual container is MP4/M4A with mono AAC
at 48 kHz, duration 212.501 seconds. `assets/audio/tonina.m4a` is a byte-for-byte
copy with a container-appropriate filename, not regenerated speech:

```text
bytes: 1775824
sha256: 469c34bf19baf1e1de43b53e33b36a234aa274fcbd5478a79c9e45e9c2406c79
```

No open licence or teacher certification is asserted. ASR models and their
weights are not redistributed. Approximate navigation points locate the meal
consequence and ending; they are not word-level alignment claims.

The recording is a lazy offline asset, not a mandatory download for every site
visitor. The service worker caches a complete media response and serves native
byte ranges for seeking, including suffix ranges and invalid-range responses.
Static preview servers without range support use a local blob fallback on seek;
that object URL is retained during back-forward caching and otherwise revoked.

## Shared Components And State

`topic-practice.js` binds the existing shared exercise and typed-bank renderers
to standard static markup. It does not implement a second card, input, button or
feedback renderer and introduces no CSS. New fields, commands, disclosures and
question banks use the documented shared components.

- `MaltiExerciseRunner` owns grading, retry, progress and missed-answer review.
- `renderExampleBanksFromData` owns the self-assessment and bilingual reading
  presentations. The listening questions are translation items, not question/
  answer pairs with an invented answer.
- `MaltiMistakeStore` owns mistake records. Correct mixed practice also advances
  an existing matching source mistake; it does not fabricate source test scores.
- `MaltiStorage` stores supplemental state in `malti_topic_practice_v1`, included
  in the existing backup/sync key registry. Earlier storage keys are unchanged.
- Supplemental state includes guided position/drafts, open-answer drafts and
  self-ratings, listening notes/speed/position and per-item mixed-session history.

Recognition uses the existing choice/matching tasks. Production uses typed or
word-order answers, not self-ratings. Six-task sessions are balanced across the
three topics. Open mistakes are prioritised, then due, unseen and least-practised
items. Due dates are one day after an error, or 3-14 days after successive correct
mixed attempts. This is a transparent practice schedule, not a scientifically
validated mastery claim. Statistics count actual mixed attempts only.

The conservative UI scan also registers functions containing input-event
listeners. On 2026-10-28 the owner explicitly approved registering this shared
controller after a separate request. Only the exact `guided` and `listening`
signatures were added to the UI registry, with the matching generated English
description. The ten rules, standard-control list, validators and every prior
registered entry remain unchanged. This is not a blanket exemption for the file;
future factory changes still require registry-and-description review.

## Verification Commands

```sh
npm run topics:check
npm run topics:practice:check
npm run materials:check
npm run cloud-sync:check
npm run release:check
```

The new browser suite checks all 14 guided turns, incorrect answers/retry,
position and draft restore, all ten open categories, rating invalidation,
native audio playback, saved listening notes, mixed mode balance and mistake
priority, due dates and unrelated state preservation. It also audits six new
surfaces at 320px/1440px in three themes, and checks cached audio range playback.
Screenshots are ignored local artifacts, not updated visual baselines.

Confirmed on 2026-10-28:

- `topics:check`: 81 scored answers, including the ten new full-sentence tasks;
  existing progress, bookmarks, responsive layouts and accessibility passed.
- `topics:practice:check`: all 14 guided turns, ten open-answer tasks, separate
  mixed modes, audio playback/seeking and offline range tests passed; 36 new
  viewport/theme/accessibility combinations passed.
- `vocabulary:gaps:check`: 60 existing scoped viewport/theme/accessibility
  combinations passed. Audit-only CSSOM requests are now attributed at request
  creation, including delayed responses; product loads and page errors remain
  checked. No accessibility finding or rule was suppressed.
- `release:check`: reproducible versioned release, all three new dynamic banks,
  mixed-session loading and offline audio passed under the deployed subpath.
- `cloud-sync:check` and the five `progress-storage` functional cases passed.
- Data/schema, typed content, verification, links, documentation, coverage,
  search freshness, offline freshness and whitespace checks passed separately.
- UI-04 initially blocked `materials:check` because `guided` and `listening` in
  `topic-practice.js` were not registered. The owner subsequently approved their
  exact registration. The full `materials:check` gate then passed, including the
  synchronized English description, 1,040 exact UI observations and negative
  bypass tests. A structural comparison confirmed that only the two approved
  entries in one new controller scope were added; prior entries and all ten
  rules are unchanged. The existing 26 Year 4 missing-example warnings remain
  unrelated to this extension.
