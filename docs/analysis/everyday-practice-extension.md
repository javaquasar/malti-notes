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
| Daily Problems, `#tonina-listening` | Fifteen short bilingual reading passages followed by ten comprehension questions | Edited reading adaptation; questions remain unscored |
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

The Tonina questions are editorial paraphrases. The full reading version is
an edited adaptation of the saved bilingual working text, not a certified
transcript or an official teacher key. Its twenty source units are grouped into
fifteen short passages without omitting narrative content, using the existing card
length limits. The unresolved action
behind the door is replaced only with the supported location: Tonina was behind
the door. The text does not guess that she hid or publish the damaged source
verb. In the long sentence about returning home, the redundant adverb in
`Tonina daħlet ġewwa hi wkoll` is omitted (`Tonina daħlet hi wkoll`): the meaning
of entering remains, and the complete English translation is retained. Questions
follow the complete text and remain unscored.

## Tonina Audio Removal — 2026-11-05

The owner explicitly stated that publication permission for the recording was
not available. The public audio file, player, audio link, playback controls and
offline-asset entry have therefore been removed. The original recording and a
private backup remain outside the website repository. Keeping a user-supplied
file is not permission to publish it.

The existing section anchor, data filename and question identities remain for
compatibility. Daily Problems invokes the existing shared `reading` presentation
directly; it no longer loads the audio controller. Stored Tonina notes and other
practice state are not deleted, although the former listening-note editor is
removed with the player. Existing guided conversations, recall and mixed review
keep their controller and state.

The generated service worker excludes the recording from all manifests and
returns `410` with `Cache-Control: no-store` for the retired raw and versioned
audio URLs. The guard precedes navigation, media and generic asset handling and
also covers query strings and range requests. A successfully installed update
takes over immediately, and activation removes the previous site caches.
The generic media/range implementation remains available for other content.

This removes the recording from the current source and future deployments.
Already downloaded copies, clients that remain offline and historical public
Git commits cannot be revoked by a service-worker update. Git history is not
rewritten by this content change.

## Shared Components And State

`topic-practice.js` binds the existing shared exercise and typed-bank renderers
to standard static markup. It does not implement a second card, input, button or
feedback renderer and introduces no CSS. New fields, commands, disclosures and
question banks use the documented shared components.

- `MaltiExerciseRunner` owns grading, retry, progress and missed-answer review.
- `renderExampleBanksFromData` owns the self-assessment and bilingual reading
  presentations. The reading questions are translation items, not question/
  answer pairs with an invented answer.
- `MaltiMistakeStore` owns mistake records. Correct mixed practice also advances
  an existing matching source mistake; it does not fabricate source test scores.
- `MaltiStorage` stores supplemental state in `malti_topic_practice_v1`, included
  in the existing backup/sync key registry. Earlier storage keys are unchanged.
- Supplemental state includes guided position/drafts, open-answer drafts and
  self-ratings and per-item mixed-session history. Legacy Tonina notes/speed/position remain in storage for backup compatibility.

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
complete bilingual reading, unchanged questions, audio removal and legacy-state preservation, mixed mode balance and mistake
priority, due dates and unrelated state preservation. It also audits six new
surfaces at 320px/1440px in three themes, and checks offline reading plus retired-audio rejection without caching.
Screenshots are ignored local artifacts, not updated visual baselines.

Historical checks on 2026-10-28 (before the audio removal):

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
