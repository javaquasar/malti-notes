# Particles Implementation

The site integrates the reviewed particle material, the direction-writing task
and the Red Cave reading using existing study components and exercise/review APIs.

## Content and Provenance

`intake.json` freezes the 109 audited source records. The builder reads its
controlled table columns and emits schema-version-2 banks; it never parses the
user's current Dropbox files during CI or at runtime. `source-analysis.md` is the
original analysis snapshot. Its source-file paths refer to the local lesson
folder; raw text and answer-link evidence are archived in `analysis/`. The
original PDF scans, proprietary Loop container and source clipart are not
republished. Original render/Loop artifacts remain in the user's lesson folder.

`site-coverage.json` maps every intake ID to teaching records or a held decision.
Four records are intentionally excluded from live data: L03-sun-02 (full-sentence
lexical check), L03-lil-a07 (vocabulary), L03-gap-12 (ambulance wording) and
L03-gap-13 (temporal ma versus accompaniment ma'). Do not increase the repository's
verification budgets to publish them. The corrected `għad irrid nara`,
`mis-saqaf`, `ġol-għar` and `bl-oġġett` are retained in the teaching versions.

The motorcycle reading is an explicitly recorded teaching adaptation: the
ambiguous ambulance clauses are omitted, not silently given fabricated keys.
Eleven source-based sentence records preserve the remaining narrative. Its
thirteen reviewed gaps are available as exercise questions. The other practice
topics contain eight correction prompts, eight article choices, fifteen
shortened-lil prompts and twelve translation prompts: 56 source tasks in total.
Writing mode uses the same answers and retains apostrophe/hyphen distinctions.

New English translations are editorial rather than a claimed teacher key.
Free comprehension and direction writing are self-assessed. No pronunciation
scoring, audio recording or automatic grading of arbitrary free text is added.

## Reused Components and State

All reference tables, correction examples, bilingual reading paragraphs and
self-assessment question blocks are rendered by `renderExampleBanksFromData`
through its shared `groupViews` contract. The lesson controller supplies view
configuration and persists draft/rating events; it no longer assembles those
items or creates their bookmark buttons. Existing slugs, review prefixes and
storage keys are retained.

The presentation API and lesson controller use matching `bank-views-2` script
URLs, both explicitly precached. This prevents an older offline renderer from
silently treating the new table target as ordinary cards after a page update.
The versioned site entry imports the shared `review-inline.css` variant layer,
so an older cached `review.css` cannot omit the new in-flow positioning rule.
Disclosure bodies contain a separate bank target so generated bulk-review
toolbars remain inside the indented content, with shared vertical spacing.

- The reference renderer uses `renderExampleBanksFromData`; correction examples
  use the standard `study-card` surface. Tables have captions, header scopes and a dedicated
  review column. `table-scroll` is confined to the genuinely wide table.
- `MaltiExerciseRunner` owns grading, exercise progress and mistake-journal
  attempts. The page adapter supplies its documented `choices` and `accepted`
  fields; a one-submission guard prevents repeated Enter from recording twice.
- Review cards use `MaltiReviewStore` and typed question/answer identities.
  Story cards use `sentence-card--review-toggle`; table and toolbar bookmarks
  use the shared `review-add-button--inline` variant, with no sentence-card
  wrapper or inherited icon translation.
- Forms use `study-field`, `study-input`, `study-check`, `control-row` and
  `toolbar-row`; disclosures use `study-disclosure-body`. No new CSS or local
  control appearance is introduced.
- `malti_particles_study_v1` stores topic/task selection, answer drafts, reading
  display preferences, comprehension drafts/self-ratings and direction drafts.
  It is added to the existing backup key registry, which also supplies cloud-sync
  sections. Existing storage keys and saved items are not migrated or cleared.
- Exercise results stay in `malti_exercise_progress_v1`; wrong answers use
  `MaltiMistakeStore`. Recognition and writing sets have separate stable IDs.
- Copying serializes plain text separately from markup. Bilingual story copy
  places Maltese first, English on the next line and a blank line between pairs.
  A visible read-only textarea provides a fallback when the clipboard API fails.

## Verification

`data-bank-layout` identifies table, contrast, trainer, reading and comprehension
presentations rather than generated sentence cards. The general functional suite
checks their bookmark or correction structure separately; the lesson-specific
suite checks grading, item coverage, layout and persistence end to end.
It also compares text/button vertical centers and checks the rendered bookmark
pixels in all three themes. Catalog cases include saved/unsaved icons, fallback
text versus empty text, and paragraph-first cards; square button dimensions
alone do not prove that the glyph or the row is centered.

Run `npm run particles:build` after editing intake mappings. `npm run
particles:check` checks generated-file freshness, all 109 coverage decisions,
all 56 source-task answers, spelling/hyphen distinctions, draft restoration,
review/mistake behavior, duplicate submission, backup inclusion, existing-number
progress, bilingual copy, three themes and 320/390/1440px layouts. It starts an
ephemeral server; screenshots are saved to the ignored `tmp_particles/` folder.
The test is included in CI. Run the standard material gate and search/PWA
rebuilds after source edits as required by the authoring policy.

Accessibility audits cover both complete new pages and the added direction
section in all three themes. A whole-page audit of the existing Directions page
also found pre-existing forest-theme contrast failures on its old `.tag` labels
outside the added section; those unrelated labels are not silently repaired or
treated as passing by this feature's section-scoped test.

The full `visual-contracts` suite also stops on the unchanged Health page: its
assertion expects 70 article cards, while the page loads the 70-item main bank
and four Lesson 01 additions. That unrelated count assertion is not changed
here. The 13-test `review-games` suite and the lesson-specific suite pass.
