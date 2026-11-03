# Malti.B 3 revision: architecture, style analysis and implementation

Date: 2026-11-03.

This document records the initial page and its style decisions. The current active-practice extension is documented in [B3 active revision](b3-practice.md). Initial counts and the original mixed-check description below are historical.

## Scope and existing implementation

The requested reference is the B2 tab of [Learning Path](../../course_path.html),
implemented by [course-path.js](../../assets/js/course-path.js),
`assets/data/course_path.json` and the lazy course chapter manifest.
It is an ordered chapter route, not a standalone B2-specific HTML skin.
Seven B2 chapters share the generic `course_chapter.html` dashboard, topic
pages, exercise runner and review stores. The site also has a separate
`year4_exam.html` vocabulary revision tool; that is not the book B2 route.

The B3 deliverable is [Malti.B 3 Revision](../../b3_revision.html): seven ordered
chapter sections, concise grammar references, new examples, checks, speaking
prompts and links into the canonical topic library. B3 means the third book
in the Malti.B series; this work does not assign a CEFR level.

## Visual language observed in B2

The design is a paper-like learning notebook. Classic uses a warm cream page,
dark green text, teal navigation, terracotta accents, soft translucent panels
and rounded frames. Georgia/Times serif typography is a central choice, rather
than a font to redeclare on a new page. The hero has the existing teal/terracotta
band, an introductory column, a note column and small pill labels.

The page is constrained by `--page-max-width` (1220px), with shared page padding.
The B2 chapter surface uses `course-chapter content-group`: measured in Chrome
under Classic, its padding is 18px, radius 24px, border a 1px translucent accent,
and background a translucent white. B3 uses the same classes. It must inherit
future changes to those classes, not freeze these measured values in new CSS.

`course-shell`, `course-dashboard`, `course-progress-copy`,
`course-dashboard-actions`, `course-chapter-list`, `course-chapter-header` and
`course-chapter-summary` supply the B2 layout. B3 composes these exact contracts.
Native disclosures shorten the initial page while keeping every chapter
addressable by an anchor. No new decorative wrapper is inserted around each
existing component surface.

## Style ownership and enforced reuse

The required reading was completed before authoring:

- [Mandatory authoring workflow](../quality/material-authoring.md)
- [Component reference](../reference/ui-components.md)
- [Layered styles](../decisions/0003-layered-style-system.md)
- [Learning content model](../learning-content-model.md)
- [Content verification](../content-verification.md)
- [Exact UI contract](../quality/ui-unification-contract.md)

The stylesheet order is exactly `theme.css`, `site.css`, `pages.css`.
`site.css` imports shared layers; pages do not load `site/learning.css` or other
individual layers directly. Theme files own colors; semantic aliases and
component tokens supply surfaces, borders, text, spacing and control sizing.
Classic, Forest and Contrast are all supported.

| Concern | Existing owner / B3 selection |
| --- | --- |
| Page, hero and outer sections | `site/base.css`; `page`, `hero`, `hero-body`, `section` |
| B2 chapter layout | `site/learning.css`; the `course-*` classes listed above |
| Chapter frames | `content-group`, using its existing shared surface |
| Example and word cards | `study-card`, rendered by the shared example-bank renderer |
| Optional references | `study-disclosure`, `study-disclosure-body`, `stack` |
| Buttons and navigation | `action-button`, `action-link`; native semantic elements |
| Answer controls and feedback | Existing `exercise-runner.js` and `site/exercises.css` |
| Text fields and matching selects | Shared `study-field` and `study-input` |
| Tabular comparisons | `table-soft`, caption and scoped headers |
| Small-screen references | Two-column `table-soft` references; no forced 720px-wide table |
| Sentence bookmarks | Shared renderer, review button contract and review store |
| Mobile composition | Existing shared responsive layers |

There is **no new CSS file, inline style, local token override, copied control
skin or modified runtime UI factory**. The existing UI registry remains at its
preflight state. Its exact legacy exceptions are not general permission to
copy older page styles. The page's inline JavaScript only configures the shared
renderer; it does not construct DOM or assign CSS/classes.

The named control tokens remain central, including `--control-height` (44px),
`--control-token-height` (48px), padding, radius and disabled opacity. Existing
exercise word-order controls are intentionally left under their current owner;
this content task does not refresh their frozen factory signatures.

## Why this is a revision page rather than a new course-graph level

The B1/B2 course inventory is a frozen audit: `book_coverage_check.js` explicitly
requires 14 chapters and four source records. Its provenance validator assumes
the existing book set and PDF page counts of at least 100. The supplied B3 book
has 94 pages. Milestone generation explicitly selects B1 and B2, and the source,
binding, assessment, payload and coverage graphs depend on that inventory.

Adding a third tab alone would therefore misrepresent coverage and leave the
downstream graph incomplete. Changing those assertions to make an ordinary
material addition pass would weaken existing validation. Extending the audited
course graph is a separate book-audit and policy-maintenance change.

This implementation supplies the requested working B3 revision page using the
existing UI and exercise/review APIs. It makes no new claim of course mastery,
inventory completeness or certification, and adds no B3 targets to the existing
course knowledge map. The B1/B2 objective keys and course manifest remain intact.

## Chapter map and learning scope

The source is Antoinette Camilleri Grima and Raisa Abela, *Malti.B 3 — Ktieb
tal-istudent*, Schola Publications, 2024, ISBN 9789918607358.
The previously extracted transcript was visually compared with all 94 scans on
2026-11-02. Source PDF SHA-256:
`7fad01fe8b636de0d7ffefdfdcd34ca5b95d18be1ca21c89106c798330234f76`.

| Chapter | Printed / PDF pages | Revision emphasis | Existing topic destinations |
| --- | --- | --- | --- |
| 1. Kif Inħossni | 3–13 / 4–14 | Body words, demonstratives, attached possession, feelings and symptoms | Body, Emotions, Health |
| 2. L-Isport Tajjeb għas-Saħħa | 14–28 / 15–29 | Sports, adjective agreement, ipprattika, xorob, commands | Body, Agreement, Verbs |
| 3. Il-Kalendarju | 29–38 / 30–39 | Weekdays, months, 21–31, birthday and weekly plans | Numbers/Calendar/Time, Routine |
| 4. Il-Festi f'Malta | 39–54 / 40–55 | Festa vocabulary and jogħġobni / togħġobni / jogħġbuni | Places/Events, Food |
| 5. Niddeskrivi Persuna | 55–69 / 56–70 | Appearance, independent possession, jobs and actions | Body, Possessives |
| 6. X'Nixtieq Insir La Nikber | 70–79 / 71–80 | nixtieq insir, corresponding persons, professions and hobbies | Hobbies/Future, Modals |
| 7. Ir-Raħal Fejn Noqgħod | 80–92 / 81–93 | Place prepositions, neighbourhood descriptions and se | Prepositions, Directions, Future |

Book tables and the checked transcription guide the forms, including the
distinction between standalone `hu jsir` and the following form in `jixtieq
isir`. Source ambiguities and printed mistakes are not imported as new rules.
Festa dates are not presented as a current event calendar. No source listening
recordings are available, so the page does not invent audio or an audio score.

## Data, provenance and reusable behavior

[B3 examples](../../assets/data/b3_revision_examples.json) use schema version 2,
typed `example` and `translation` groups and stable ASCII item slugs. There are
56 short authored sentences and 36 word/phrase entries, in ten banks. New
sentences and English translations are site-authored; alignment with the book
is recorded separately from source quotation or linguistic certification.
The alignment object stores the source hash, dates, chapter titles and both
printed and PDF page ranges. This allows future work without another OCR pass.

Existing vocabulary, examples and broader explanations remain canonical on
their topic pages. B3 links to them rather than copying their JSON records or
introducing competing review IDs. The shared `reading` presentation gives new
cards `lang="mt"` and English translations `lang="en"`.

[B3 exercises](../../assets/data/b3_revision_exercises.json) contain seven
six-question checks plus a mixed 14-question check: 56 question presentations,
with two questions from each chapter reused in the cumulative set. They use
multiple choice, text production, matching and word ordering. Incorrect answers
have explanatory feedback and relevant review cards. Answer positions vary.

`MaltiExerciseRunner` owns grading, retries, attempts, best scores, mistake
records and saving missed answers. New set/item IDs use the `b3-` prefix.
The existing `malti_exercise_progress_v1` store merges them without replacing
B1/B2 records. Sentence bookmarks use `MaltiReviewStore` and the
`b3-revision` prefix. No second progress database, mock bookmark or imitation
grading UI is introduced. Open speaking tasks have no fabricated numeric score.

## Integration and size

- The shared site map registers B3 under Course and on the generated home/directory views.
- The B1/B2 learning-path dashboard has a direct link to B3.
- The generated search index includes the new page and its learning items.
- The existing service-worker builder precaches the two small B3 data banks;
  no scan images, source PDF or OCR archive is copied into the web application.
- Unrelated working-tree changes were already present, including the speaking
  extension and UI policy work. They were preserved; this task makes no new
  policy/validator changes and does not commit or publish the site.

## Verification

Preflight passed before authoring, after rerunning with permission to create
the temporary Git repositories used by the gate. Its initial sandbox attempt
could not write a temporary `.git/config`; no gate was bypassed.

The dedicated regression test is
[b3_revision_check.js](../../scripts/b3_revision_check.js).
It checks all eight sets through real inputs, matching selects and ordering
buttons; wrong-answer review content; bookmark/disclosure keyboard use;
attempt persistence; retained B2 objectives, scores and cards; computed B2/B3
surface equality; navigation; three themes at 1440, 390 and 320px; accessibility;
and a service-worker-controlled offline reload.

Results:

- `npm run materials:preflight` passed before authoring.
- `npm run ui:policy:check` passed with the same 10 rules and 1040 exact observations.
- `node scripts/b3_revision_check.js` passed all eight sets and all nine theme/viewport combinations, plus persistence, retained B2 data and offline reload.
- `npm run functional:test -- --suite course` passed all ten existing course tests.
- Final `npm run materials:check` passed: documentation, styles, exact UI registry, data, schemas, typed content, verification, links, search, offline assets and CI wiring. The only warnings are the pre-existing 26 Year 4 entries without example sentences.

Visual inspection caught two composition details. Three-column references were
reformatted into two columns so a phone can show both subject and forms without
horizontal scrolling. The shared `tag` surface had insufficient contrast in
Forest on the B3 chapter frame; B3 uses the already available `status-chip`
for chapter labels. No theme value, CSS exception or checker was changed.

The full-browser test reports axe's synthetic CSSOM import probes separately:
the installed axe loader creates a detached HTMLDocument and resolves its
copied relative CSS imports at the document root. Real page resource requests
and the service-worker offline reload are checked independently and pass.
The accessibility rules themselves remain enabled.

Reviewed evidence:

- [B2 visual reference before this change](b3-revision-screenshots/b2-reference-classic-1440.png)

- [Classic desktop](b3-revision-screenshots/b3-classic-1440.png)
- [Classic mobile reference](b3-revision-screenshots/b3-classic-390-reference.png)
- [Forest desktop](b3-revision-screenshots/b3-forest-1440.png)
- [Contrast mobile](b3-revision-screenshots/b3-contrast-390.png)
- [Browser validation record](b3-revision-validation.json)

 Passing automated checks does not independently certify the quality
of every authored Maltese sentence or English translation.
