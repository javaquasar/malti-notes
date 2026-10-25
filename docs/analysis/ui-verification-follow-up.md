# UI Verification Follow-Up

Date: 2026-10-25. Source checkpoint: `1e1338c`.

## CSS Link Smoke Check

The smoke check previously passed stylesheet URLs directly to the filesystem,
so `site.css?v=bank-views-3` was incorrectly treated as a literal filename.
It now resolves local URLs with the standard URL parser and checks their decoded
pathname. Query parameters and fragments are not part of a filesystem filename.
Regression assertions cover plain, versioned and fragmented stylesheet URLs and
ensure a missing versioned stylesheet still fails existence checking.

`npm run visual:smoke` passes. No CSS link was removed, no missing resource was
allowlisted and no style-policy exception was changed.

## Full Catalog Height Diagnosis

The Windows catalog baseline was last updated in `c3ed268`. Compared with that
fixture, the current catalog adds inline review actions, a paragraph-based
review example, table review actions and a multiline field.

| Width | Baseline Height | Current Height | Difference |
| --- | ---: | ---: | ---: |
| 1280px | 4414px | 4744px | 330px |
| 390px | 6774px | 7267px | 493px |

To isolate fixture growth from stylesheet drift, the original HTML was read with
`git show c3ed268:scripts/fixtures/ui_component_catalog.html`, served through a
Playwright request override at the same fixture URL, and rendered with current
styles. This did not edit source HTML, baseline images or browser profiles.

The historical fixture with current styles exactly reproduces the baseline page
heights at both widths. The current fixture's increased height is confined to
three sections: controls (+158px desktop / +236px mobile), tables (+40px /
approximately +91px), and study controls (+132px / +166px). The remaining six
section heights are unchanged in this comparison.

Six historical-fixture screenshots (three themes, two widths) were compared with
the existing Windows references using the unchanged pixel-diff command and
tolerances. All six passed; their pixel differences were 0.0230%-0.0494%, below
the existing 0.2% limit. This is compatibility evidence, not exact pixel identity
or approval of the new catalog content.

Local diagnostic captures are in `tmp_ui/catalog-compatibility`; comparison
results are in `tmp_ui/catalog-compatibility-diff/summary.json`. Reproduction uses
the existing baseline directory `visual-regression/ui-component-catalog-baseline-win32`
and `node scripts/visual_diff.js --baseline <directory> --current <captures>`.

## Remaining Boundary

`npm run functional:test -- --suite visual-contracts` was rerun and stopped at
`scripts/functional_check.js:814`: it expects exactly 70 Health examples across
all example groups. The current page renders 74: 70 from
`health_doctor_examples.json` and four from `health_doctor_lesson01_examples.json`.
Both source totals and the browser count were checked. This is a stale aggregate
expectation, not evidence of four missing examples. The assertion remains
unchanged; this run does not establish that later tests in that suite pass.

The final material gate and the corrected visual smoke command passed. The
historical-fixture six-image comparison passed under the existing tolerances.

The current full-catalog comparison still fails with six size mismatches. It was
not replaced by the historical-fixture experiment and remains mandatory. New
catalog content needs explicit visual review and platform-specific reference
approval; no baseline or comparison tolerance was changed in this follow-up.

This investigation does not certify every page or resolve the remaining U04-U12
unification backlog. Existing dual-form intake notes and screenshots are outside
the change and remain untracked.
