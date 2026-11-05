# B3 active revision: five extensions

Date: 2026-11-03.

[Open B3 Revision](../../b3_revision.html) · [Original style and architecture analysis](b3-revision.md)

## Standalone presentation

On 2026-11-05 the learner-facing label was updated to **B3 Revision**,
retaining the B1/B2/B3 organisation requested for the site. B3 is used in
navigation, daily sessions, exercise headings and new review-card topics.
The seven topics remain self-contained and contain no textbook references.

On 2026-11-03 the learner-facing page was renamed **Everyday Maltese Practice**.
Seven independent topics replace book chapter labels, printed page ranges,
the title citation and book-dependent grammar explanations. Site navigation,
directory descriptions, search entries, new review-card topics and exercise
headings use the standalone name. The original `b3-*` IDs, URL and storage
namespace remain stable to preserve progress. Restored unfinished sessions
derive their headings from current material instead of an old saved title.

Standalone presentation was checked in the rendered page, generated directory
and runtime data; the full practice, three-theme and material gates pass.

Historical source evidence was retained in [the authoring provenance archive](b3-provenance.json),
outside the runtime data. The content check still validates the source hash and
all original pattern references against that archive. The page does not load it.

## Implemented scope

1. **Varied practice:** 21 patterns across seven chapters, with six variants per pattern (126 tasks). Each pattern has recognition and production tasks. The final check uses 14 independent questions, one recognition and one production question from every chapter. The earlier seven foundation checks remain available. The old copied mixed check is replaced in the UI; its existing saved score is retained.
2. **Learning after mistakes:** a wrong answer opens a pattern explanation and contrast, then another model, then a different production task. There are 21 authored recovery tasks. A successful repair records writing without inventing recognition success. A later correct response in the same mode reconciles stale queued mistakes.
3. **Connected meaning:** seven original short readings (29 sentences), 28 comprehension questions, a weekly timetable and an original neighbourhood diagram. English support begins hidden and can be enabled. The map has an initially open text alternative, especially for small screens.
4. **Guided speaking:** seven typed question/answer models, three scaffolds and three self-checks per chapter. The shared self-assessment renderer saves personal drafts and self-ratings. Editing a draft invalidates the prior rating and checks. Self-ratings never increase automatically graded pattern results.
5. **Today's practice:** 6- or 10-question sessions prioritise due and weak modes, then new material. The page explains the selection and names weak constructs. Recognition and writing remain separate. Unfinished sessions retain stable question IDs and answers across reloads; start controls do not replace an unfinished session.

## Data and source ownership

| File | Role |
| --- | --- |
| [Practice bank](../../assets/data/b3_practice_bank.json) | 126 variants, 21 production recovery tasks, 14 fresh final tasks; stable chapter/pattern/item IDs |
| [Context and speaking bank](../../assets/data/b3_context_examples.json) | Schema-v2 examples and real question/answer models, plus timetable/map content |
| [Context questions](../../assets/data/b3_context_exercises.json) | Seven sets of four comprehension tasks |
| [Speaking task metadata](../../assets/data/b3_speaking_tasks.json) | Scaffolds, checklist labels and assessment notes |
| [Learning core](../../assets/js/b3-practice-core.js) | Pure selection, mode statistics, variant rotation and scheduling |
| [Page controller](../../assets/js/b3-practice.js) | Existing renderer composition and state/event wiring |

The same supplied and visually checked Malti.B 3 transcript guides the forms.
Questions, connected readings, translations and speaking models are authored
for this site. They are not presented as textbook quotations or independently
certified linguistic examples. No new listening recording is implied.

## Rendering and style contract

All visible controls use existing components: `study-input`, `study-check`,
`action-button`, `study-disclosure`, `study-card`, `study-contrast` and the
existing exercise styles. Page stylesheet order remains `theme.css`,
`site.css`, `pages.css`. No CSS file, component surface or token override was
added. No existing shared renderer or UI factory was changed. The existing UI
registry is reused without additions or changes.

The shared exercise runner owns grading, feedback, retries, review-card actions
and its existing result storage. The shared example-bank renderer supplies
reading and `selfAssessment` presentations, Maltese/English language metadata
and review identity. Static HTML supplies the surrounding sections, timetable
and checklist controls. The original SVG diagram is learning content rather
than a page-local UI skin.

## Persistence, review and old progress

The controller stores scoped state in the existing `malti_topic_practice_v1`
under `b3Revision`. Other topic-practice fields are preserved. This makes B3
history and speaking drafts part of the existing backup/sync section without
adding a second storage registry or changing backup validators.

The shared `malti_exercise_progress_v1` continues to hold check attempts and
best results. Existing B1/B2 and earlier B3 records are retained. Session IDs
for the two daily sizes differ, so scores with different denominators are not
combined. Wrong answers continue to use the shared review store and mistake
journal. B3 pattern IDs are not fabricated global course-target IDs; the
frozen B1/B2 course graph remains a separate audit.

Each pattern tracks recognition and production independently. Wrong answers
make the mode weak immediately and schedule a next-day revisit. Successful
spaced stages use 1, 3 and 7 days; repeated correct clicks within one day cannot
advance those stages. A later successful visit must be at least 24 hours after
the previous spaced success. The interface reports practice and spaced review,
not a claim of complete book mastery.

## Verification commands

```sh
node scripts/b3_practice_content_check.js
node scripts/b3_practice_core_check.js
node scripts/b3_practice_browser_check.js
node scripts/b3_revision_check.js
npm run materials:check
npm run functional:test -- --suite course
```

The content check validates IDs, item forms, mode/chapter balance, varied answer
positions, relevant written-answer review cards and independent final examples.
The pure core check covers invalid state, rotation, due scheduling, mode
separation, balanced selection and same-day anti-inflation.

The new browser suite grades every one of the 126 variants, the 14 fresh final
questions and all 28 comprehension questions through real controls. It also
checks wrong-answer recovery, partial repair/session reloads, double-submit
protection, draft/checklist/rating persistence and invalidation, backup export,
retained B1/B2 and earlier B3 scores, and a real offline reload. The existing B3
suite still grades all seven foundation sets, checks shared B2 surface equality,
bookmarks, keyboard behavior, legacy records and nine theme/viewport combinations.

Results: all verification commands above passed. The learning core reports 11
passing tests; browser coverage includes all 126 variants, 14 new final
questions, 28 context questions, nine end-to-end scenario groups and nine
Classic/Forest/Contrast viewport combinations. All ten existing course tests
pass. The final material gate passes with the unchanged pre-existing 26 Year 4
example warnings.

Evidence:

- [Extended browser validation](b3-practice-validation.json)
- [Three-theme/layout validation](b3-revision-validation.json)
- [Town plan at 320px](b3-practice-screenshots/town-mobile-320.png)
- [Daily practice overview](b3-practice-screenshots/today-desktop.png)

The pre-existing Year 4 example warnings remain outside this work. No checker,
policy exception or visual baseline was weakened or refreshed to obtain a pass.
