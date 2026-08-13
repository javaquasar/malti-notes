# Book Course Architecture Plan

Status: accepted architecture implemented across all B1/B2 chapters.

Last updated: 2026-08-14.

## Implementation Progress

The reusable course layer now covers the complete 14-chapter route:

- `course_chapter.html` renders any of the 14 chapters from existing course and audit data.
- All 462 frozen book requirements have stable generated bindings: 174 linked to canonical lesson items, 162 recorded as evidence-only, and 126 retained as explicit content gaps.
- Scoped chapter views are derived from `contentRef.page` and work with vocabulary cards, vocabulary tables, static number rows, and imperative tables.
- The guided path adds focused room, imperative, and restaurant steps where the audited material already lives on another topic page.
- Every chapter has at least one target with recognition and production assessment coverage; missed answers use shared review and spaced successes can advance the target to mastery.
- `course:bindings:check`, course lint, Playwright, and the visual matrix protect bindings, scoped views, target progress, and responsive rendering.

The remaining phases are broader assessment coverage beyond the first mastery-ready target per chapter, entry diagnostics, and section checkpoints. Evidence-only records should be promoted only after a stable lesson item is available; frozen missing records require an intentional book-audit refresh after content is added.

## Decision Summary

Malti Notes keeps its current topic-based structure as the complete reference and practice library. A separate B1/B2 book flow provides an ordered learning path through selected parts of that same content.

Topic pages are allowed and expected to contain more vocabulary, grammar, examples, and exercises than a book chapter. The course does not create reduced copies of those pages. It applies a chapter-specific view and assessment scope on top of the canonical topic content.

The primary relationship is:

```text
book requirement
      -> course target and chapter binding
      -> existing topic content
      -> existing or new assessment
      -> shared review queue
```

## Goals

- Preserve all current pages, routes, navigation, games, and free exploration.
- Add an ordered route through all seven B1 and seven B2 chapters.
- Focus a learner on the material required by the current chapter without deleting broader topic content.
- Reuse one canonical vocabulary or grammar record everywhere.
- Keep book coverage separate from individual learner progress.
- Support recognition, recall, production, chapter tests, and review of mistakes.
- Allow the course to improve incrementally while making missing material visible.
- Protect course links and coverage from regressions in GitHub Actions.

## Non-Goals

- Replacing the topic-based site with a textbook replica.
- Copying complete book pages, exercises, images, or copyrighted explanations.
- Maintaining separate B1/B2 copies of vocabulary already present on topic pages.
- Hiding useful extended content from users who want to explore it.
- Counting optional vocabulary against completion of a book chapter.
- Making audio a requirement for the first implementation of the course flow.

## Information Architecture

The site has two complementary entry modes.

### Topics

The current navigation remains the main reference structure:

```text
Topics -> Animals / Food / Weather / Verbs / Games / Review
```

Opening a topic page normally shows its complete content. Existing URLs continue to work and retain their current meaning.

### Book Course

The course adds a guided structure:

```text
Course -> B1 or B2 -> Chapter -> Step -> Checkpoint -> Chapter test
```

`course_path.html` remains the course entry point. A generic chapter screen should coordinate chapter goals, steps, progress, and tests rather than duplicate teaching content.

Recommended route shape:

```text
course_path.html
course_chapter.html?chapter=b1-animals
animals.html?course=b1&chapter=b1-animals&step=vocabulary
```

The URL is the source of truth for course context so browser history, bookmarks, and shared links work. Local storage is used for learner progress, not navigation state.

## Topic Page Modes

When a topic page is opened normally, it displays the complete topic.

When it is opened from a book chapter, the existing course context bar shows the chapter and navigation actions. A segmented control switches between:

```text
[ Chapter material ] [ Full topic ]
```

`Chapter material` is the default in book context. `Full topic` exposes the normal complete page without leaving the course route.

The selected mode may be encoded in the URL:

```text
animals.html?course=b1&chapter=b1-animals&view=chapter
animals.html?course=b1&chapter=b1-animals&view=all
```

Outside book context, the segmented control and course navigation are absent.

## Content Roles

Content receives a role relative to a chapter, not globally.

| Role | Meaning | Chapter view | Chapter completion |
| --- | --- | --- | --- |
| `core` | Required by the book chapter | Visible and prioritised | Included |
| `supporting` | Needed for an explanation or example | Visible where relevant | Excluded |
| `extended` | Useful topic material beyond the chapter | Collapsed or available through `Full topic` | Excluded |

Unbound items on a topic page are treated as `extended` in book context. They remain ordinary content in the normal topic view.

The role belongs to the chapter binding. For example, `kelb` can be `core` in B1 Animals, while another animal can be `extended` there and become `core` in a later course.

## Vocabulary Supersets

A topic page containing more words than the book is the intended design, not a coverage error.

Example:

```text
Animals topic page:       60 words
B1 Animals core:          27 words
Supporting vocabulary:    4 words
Extended vocabulary:     29 words
```

In chapter view, the 27 core items are shown first, supporting items remain available in their examples, and the remaining 29 items are placed under extended content or revealed by `Full topic`.

Only the 27 core items are sampled by the chapter test and counted toward chapter mastery. Extended words may still be added manually to the shared review queue.

## Data Ownership

Each file has one responsibility.

### `assets/data/book_coverage_inventory.json`

- Stores the frozen extraction and comparison with the B1/B2 books.
- Identifies source requirements, known gaps, grammar findings, and source PDF hashes.
- Supports audit and regression checks.
- Is not used directly as the runtime UI model.

### `assets/data/course_path.json`

- Stores B1/B2 level order, chapter order, objectives, linked pages, and chapter summaries.
- Remains the source for course navigation.
- Does not duplicate complete vocabulary records or exercise content.

### Existing topic data files

- Remain canonical for Maltese text, English meaning, examples, notes, and review metadata.
- Gain stable item IDs where they do not already have one.
- Are rendered in normal and book-context views.

### Proposed `assets/data/course_target_bindings.json`

- Maps each book requirement to a stable learning target ID.
- Associates the target with a chapter and an existing content item or records that content is not implemented yet.
- Assigns the chapter-relative role.
- Links assessments to the target.

Proposed shape:

```json
{
  "schemaVersion": 1,
  "targets": [
    {
      "id": "b1-animals-kelb",
      "book": "B1",
      "chapterId": "b1-animals",
      "type": "vocabulary",
      "sourceRequirement": "kelb",
      "role": "core",
      "contentRef": {
        "file": "assets/data/animals.json",
        "itemId": "kelb"
      },
      "assessmentIds": [
        "b1-animals-kelb-recognition",
        "b1-animals-kelb-production"
      ]
    }
  ]
}
```

`sourceRequirement` identifies the audited book target. The teaching text is resolved through `contentRef`, avoiding a second editable copy of the translation and example.

A target without site content uses `contentRef: null`. This allows the course UI and reports to distinguish missing implementation from learner progress.

## Rendering Contract

Every filterable teaching item needs a stable content ID. Data-rendered cards receive it from their JSON record. Static HTML sections receive an explicit `data-content-id` or `data-learning-target` attribute.

In book context, the page runtime:

1. Reads `chapter` and `view` from the URL.
2. Loads bindings for that chapter and page.
3. Classifies rendered items as `core`, `supporting`, or `extended`.
4. Shows chapter content in the page's existing order and design system.
5. Moves or collapses extended groups without cloning their content.
6. Preserves review buttons and normal topic interactions.

Filtering must not rely on matching visible strings. Stable IDs prevent punctuation, case, translation, or markup changes from breaking course bindings.

The same shared cards, framed groups, spacing tokens, buttons, and responsive rules are used in both modes. The course introduces navigation context, not a second visual theme.

## Chapter Screen

The chapter screen acts as a learning dashboard. It should contain:

- Chapter title, objectives, and position within B1 or B2.
- Site coverage for required book targets.
- Learner mastery for currently available core targets.
- Ordered learning steps linked to existing topic sections.
- Entry diagnostic, section checkpoints, and final test.
- A review-errors action using the existing review system.
- Clear previous and next chapter navigation.

A representative status is:

```text
B2.3 It-Temp
Site material: 15 of 23 required targets
Your progress: 9 of 15 available targets mastered
Due for review: 4 targets
```

Site coverage and learner progress must never be merged into one percentage.

## Assessment Model

The book flow uses the existing exercise runner and review store. Exercise records gain stable links to one or more learning target IDs.

Each chapter supports three assessment layers.

| Assessment | Purpose | Suggested size |
| --- | --- | ---: |
| Entry diagnostic | Identify familiar targets and establish a starting point | 5-8 |
| Step checkpoint | Verify the current vocabulary or grammar step | 3-5 |
| Chapter test | Measure independent mixed recall and production | 12-20 |

Question difficulty should progress through:

```text
recognise meaning
-> choose the correct form
-> fill a gap
-> assemble a sentence
-> enter an answer independently
```

Chapter tests sample only available `core` targets. A separate `Full topic` or `Extended challenge` test may include supporting and extended items, but its result does not change book completion.

Viewing an answer or using a strong hint records the target as needing review even if the next attempt is correct.

## Progress And Mastery

Progress is stored by stable learning target ID so it survives page reorganisation.

Recommended target states:

| State | Meaning |
| --- | --- |
| `new` | Available but not attempted |
| `learning` | Attempted without stable recall |
| `review` | Incorrect, hinted, or due for repetition |
| `mastered` | Recalled successfully across multiple sessions |

Mastery should require more than one recognition answer. A practical initial rule is:

- At least one successful recognition attempt.
- At least one successful production attempt without a hint.
- A later successful review on a different day.

Chapter completion is based on the available `core` targets and a passing final test. If required book targets are not implemented, the chapter can show learner completion for available material while retaining a visible `content incomplete` status.

Extended vocabulary has independent review progress and never blocks book chapter completion.

## Coverage Metrics

Four measurements are kept separate:

| Metric | Denominator | Owner |
| --- | --- | --- |
| Book coverage | All audited targets in the chapter | Repository content |
| Assessment coverage | Implemented core targets with required test modes | Repository content |
| Learner mastery | Available core targets | Individual learner |
| Extended progress | Optional supporting and extended targets attempted | Individual learner |

This prevents a broad topic page from falsely inflating book coverage and prevents missing site content from being reported as a learner failure.

## Navigation Rules

- Entering a topic from a chapter preserves `course`, `chapter`, `step`, and `view` parameters.
- `Back to chapter` returns to the originating chapter screen.
- `Next step` is determined by `course_path.json`, not document order.
- Switching to `Full topic` does not leave course context.
- Opening the same page without course parameters restores the ordinary full-topic experience.
- Review and game links may carry a chapter filter, but their underlying content remains shared.

## Validation And CI

The data validator should eventually enforce:

- Every course target ID is unique.
- Every binding references an existing course chapter.
- Every non-null `contentRef` resolves to an existing file and item ID.
- Every `core` target appears in the frozen book inventory.
- Every linked assessment exists and references the same target.
- Implemented core vocabulary has a meaning and at least one example.
- Grammar targets have an explanation or rule reference.
- Production coverage cannot be satisfied by recognition-only exercises.
- Previously implemented core targets cannot silently become unbound.

`npm run books:coverage` remains the source-presence regression check. A later `npm run course:lint` should validate runtime bindings and pedagogical completeness without reparsing the PDFs.

Playwright coverage should include:

- A normal topic page still shows all content.
- The same page in chapter view shows the correct core subset.
- `Full topic` reveals the extended material.
- The mode and chapter survive reload and browser navigation.
- Core and extended items do not overlap or disappear.
- Chapter tests exclude extended targets.
- Mobile controls do not overlap and remain keyboard accessible.

## Implementation Phases

### Phase 1: Target Identity

- Add stable IDs to canonical topic records.
- Create `course_target_bindings.json` from the frozen inventory.
- Mark unresolved targets with `contentRef: null`.
- Add validation for chapter, content, and target references.

### Phase 2: One-Chapter Pilot

- Implement a generic chapter screen.
- Extend `course-context.js` to support `view=chapter|all`.
- Add the segmented view control to one representative topic page.
- Confirm normal page behavior remains unchanged.

B1 Animals is a suitable pilot because it has a clear vocabulary subset, existing topic content, singular/plural forms, possession, and known coverage gaps.

### Phase 3: Scoped Rendering

- Add stable DOM hooks to shared card and table renderers.
- Support `core`, `supporting`, and `extended` grouping.
- Roll chapter filtering out to all linked vocabulary and grammar pages.
- Add Playwright coverage for desktop and mobile views.

### Phase 4: Assessments

- Link existing exercises to target IDs.
- Add missing recognition and production exercises.
- Implement diagnostics, checkpoints, and chapter tests.
- Send failed or hinted targets to the shared review queue.

### Phase 5: Progress

- Store progress by target ID.
- Show site coverage and learner mastery separately.
- Add due-review and retry-errors flows.
- Include course progress in the existing export and restore workflow.

### Phase 6: Coverage Completion

- Add the 125 vocabulary targets missing from the frozen baseline.
- Complete weak verb paradigms and partial grammar explanations.
- Require stronger pedagogical coverage in CI as chapters mature.

## Acceptance Criteria

The architecture is successfully implemented when:

- Existing topic URLs and full-topic behavior remain intact.
- A learner can enter B1 or B2, select a chapter, and follow ordered steps.
- Topic pages can contain any amount of extra material without affecting chapter completion.
- Chapter view and full-topic view use the same canonical content records.
- Every book target has a stable ID and an explicit implemented or missing status.
- Chapter tests use only the chapter's available core targets.
- Errors flow into shared review and progress survives reload and export.
- Site coverage, assessment coverage, mastery, and extended progress are reported separately.
- CI detects broken bindings, lost core content, and missing assessment references.
- All 14 chapters use the same course interaction and visual patterns.

## Architectural Decisions

1. **Keep topic pages as supersets.** Broader site content is an advantage and remains available.
2. **Add course context rather than duplicate pages.** The book flow selects and sequences existing material.
3. **Assign roles per chapter.** `core`, `supporting`, and `extended` are relationships, not permanent properties of a word.
4. **Use stable IDs for all links.** Runtime behavior and progress do not depend on visible text matching.
5. **Keep audit, navigation, content, and progress separate.** Each data layer has one responsibility.
6. **Test only core material for chapter completion.** Optional exploration does not penalise the learner.
7. **Expose missing site material honestly.** Content gaps are repository status, not learner failure.
8. **Reuse the current design system and review engine.** The course is a coherent path through Malti Notes, not a separate application.
