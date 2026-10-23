# UI Unification Checks

These checks supplement the [component reference](../reference/ui-components.md), [layered style system](../decisions/0003-layered-style-system.md), and [unification audit](../analysis/ui-unification-audit.md). They do not grant exceptions to component ownership rules.

## Live Appearance Contracts

Run `npm run ui:runtime:check`. The runner serves its own isolated origin and uses fresh browser contexts. It never reads or changes a learner's browser profile.

Coverage includes the four speaking pages, particles, bilingual reading and numbers, in Classic, Forest and Contrast at 1280 and 390 pixels. States include initial rendering, open disclosures, speaking tabs, selected numbers sections, focused controls, saved review cards and reload with restored review progress. Evidence is written to `tmp_ui/runtime-contracts.json`.

Review controls are compared with an independent shared-component reference outside page-specific containers. Contracts include surface and icon colors, borders, padding, dimensions, flex alignment, icon transform and focus outline. Table action centers have a two-pixel tolerance. CSS blockification of inline-flex grid items is normalized because it does not change the inner flex layout.

Shared fields are compared for surface, border, radius, padding, minimum height, disabled opacity and focus outline. Width is intentionally owned by the surrounding layout; textarea height is owned by its rows/content. Reference fields have no inherited page-specific classes, inline styles or data selectors. Deliberate button and field mutations must be detected, so a contaminated reference cannot silently approve them.

This is a bounded regression matrix, not a claim that every page or legacy control has migrated. Extend its page/state list when migrating another work package. Legacy controls without `.study-input` remain visible in the audit rather than being silently reclassified as standard.

## Isolated Component Captures

Run `npm run visual:components`. Each unique `data-component` in the catalog produces an individual PNG for every theme and viewport. Full-page context is retained. Adding a section no longer changes the dimensions of unrelated component captures.

Capture metadata records platform, Playwright version, themes and viewports. To compare with an explicitly reviewed reference directory, run:

```sh
npm run visual:components -- --baseline <reviewed-reference-directory>
```

The comparison rejects a different operating system. Missing, resized and changed images remain failures in the existing pixel-diff runner. The command does not promote references. Initial per-component reference approval is still required on each supported platform; CI uploads captures for review. Existing `visual:catalog` and framed-group baseline checks remain mandatory and are not bypassed by successful captures. Known pre-existing full-catalog baseline drift must be reviewed independently, not approved as part of this tooling change.

## Content-Versioned Publication

Run `npm run release:build` to create a new `site-dist` directory. Existing output is rejected instead of overwritten. This is the publication artifact, not an in-place rewrite of source pages.

The builder computes a deterministic SHA-256 release revision from normalized site text, binary asset contents and the two build scripts. Published resources live below `assets/<revision>/`. It updates local resource prefixes in HTML, CSS, JavaScript, JSON and the offline worker, and removes legacy CSS/JS `?v=` suffixes in the artifact. Relative CSS imports and JS modules inherit the same versioned parent directory. Changes in a transitive stylesheet, data file or script therefore change the entire resource namespace. External dependencies are not bundled or versioned by this contract.

`release.json` records the revision and per-file integrity hashes. The offline shell is generated against the staged publication files, with the same exclusions as the previous Pages packaging step. Source-tree offline checks continue to discover any legacy versioned URLs automatically; there is no manually maintained list of six version exceptions.

Run `npm run release:check` to verify reproducibility, line-ending independence, transitive CSS invalidation, complete precache paths, no manual suffixes, and actual browser loading below a GitHub-Pages-style subpath with offline reload. This test uses a temporary directory and deletes only that directory afterward.

GitHub Pages now publishes the generated release artifact. A plain source-tree development server still works but intentionally does not simulate the release namespace. No learner storage keys or review identities are changed.

## Measurable Refactoring

The machine-readable work plan is `scripts/ui_unification_plan.json`. It tracks the twelve audit packages separately from these five infrastructure improvements. `pending`, `in-progress`, and `complete` are the only valid states. Completion requires retained evidence files and a verification command.

Run `npm run ui:progress:build` after changing the plan or measured CSS. Review the generated [progress report](../analysis/ui-unification-progress.md). `npm run ui:progress:check` rejects stale counters, missing scope files and completion without evidence. CSSOM counts distinguish total declarations, surface candidates, control-surface candidates and `!important` use. Counts are review signals, not semantic proof of a violation; selector-name matching can undercount controls with opaque names.

The report explicitly preserves legitimate game geometry, progress placement and content swatches. These are not blanket exemptions for command controls or unrestricted CSS values. U04 and U11 are in progress: shared inputs now resist legacy exercise surfaces, and number bookmarks use the shared inline variant. Their remaining work is not marked complete.

## CI

CI runs all four new checks (`ui:runtime:check`, `visual:components`, `ui:progress:check`, `release:check`) in addition to existing gates. The workflow contract requires them and the release build step. Runtime evidence and snapshots are uploaded even when another quality check fails. No existing lint, accessibility or visual comparison has been removed.
