# Mandatory Material Authoring Workflow

This policy applies to new and expanded lessons, topic pages, examples, exercises,
learning-data files and their UI. It is not optional guidance.

## Before Editing

Read these references before creating or changing learning material:

- [UI Components and Usage](../reference/ui-components.md)
- [Layered Style System](../decisions/0003-layered-style-system.md)
- [Learning Content Model](../learning-content-model.md)
- [Content Verification](../content-verification.md)
- [Enforced UI Rule Registry](ui-unification-contract.md)

Run `npm run materials:preflight` in the repository root. Do not start authoring
until it passes. A command cannot prove that a person read or understood a
document; the instructions require reading, while the checks enforce measurable
parts of the contract.

Before writing markup, identify the content type, its source, the existing data
bank or renderer, and the shared components to reuse. If a new reusable component
is genuinely necessary, add its shared implementation and catalog states before
using it in the material. Do not create a local visual substitute.

## During Authoring

- Use typed learning data and existing renderers; distinguish translations from question/answer pairs.
- Preserve stable IDs, existing progress, review behavior and source provenance.
- Keep explanatory UI text and translations in English, with Maltese learning content marked appropriately.
- Reuse the documented shared components and semantic theme tokens.
- Do not introduce inline styles, page-local control surfaces or local overrides of shared control tokens.
- Do not add exceptions, weaken validators, remove tests or update visual baselines merely to obtain a pass.
- Quarantine uncertain linguistic claims through the existing verification workflow rather than publishing guesses as verified material.

If a preflight failure is unrelated to the requested change, report it and agree
on a resolution. Do not silently bypass the failed gate.

## Before Delivery

Run `npm run materials:check` after editing. It checks the required references,
agent instructions, documentation, styles, data/schema contracts, typed content,
verification status, links, generated search/offline assets and CI wiring.
Rebuild the search index and service worker when their checks require it.

Run the relevant functional and visual suites as well. New interactions require
keyboard and mobile verification. Shared-style changes require three-theme
accessibility and reviewed catalog screenshots. A fast gate is not a replacement
for those feature-specific checks.

## Git Hooks

Run this once per checkout:

```sh
npm run materials:hooks:install
```

The installer preserves unrelated existing hooks and custom `core.hooksPath`
settings by refusing to overwrite them. It installs only the project's marked
`pre-commit` and `pre-push` hooks in Git's hook directory.

The commit hook exports the exact staged Git tree to a temporary directory and
runs the material gate there. An unstaged fix cannot conceal an invalid staged
version. The push hook validates the exact outgoing commit tips, not whichever
files happen to be in the working directory. Temporary exports reuse installed
dependencies without changing the Git index or the original worktree.
Snapshot files are checked against Git blob hashes. Archive exclusions and
substitutions cannot remove or silently change material before validation.

Both hooks fail closed when dependencies, validators or required policy files
are missing. Deleting a remote ref does not require a content check. Install
Node dependencies and a supported Playwright browser before using the hooks.

## CI and Protection Limits

CI runs `materials:check` independently of local hooks. Publishing depends on
the existing quality, functional and visual jobs, so a material-gate failure
blocks that workflow's deployment.

Git hooks can be skipped or removed by someone who controls their checkout.
Repository files cannot prevent an administrator from editing validators or
changing GitHub settings. A preflight does not technically prevent filesystem
writes before it runs.

For a server-side merge boundary, protect `main` using a GitHub ruleset: require
pull requests and successful quality, functional and visual checks; prevent
force pushes and deletions; restrict bypasses; and require independent review of
policy, workflow and validator changes. Ensure required workflows cannot simply
be removed in the same change. These are repository administration settings,
not something a local script can guarantee. Enabling them changes the direct-push
workflow and must be an explicit repository-owner decision.

## Policy Maintenance

### UI Contract Changes

`scripts/ui_unification_contract.json` is the machine-readable rule, ownership,
exact-exception and runtime-factory list. Its complete English description is
[UI Unification Contract](ui-unification-contract.md). `npm run ui:policy:check`
requires the two to agree and rejects unregistered CSS, stylesheet dependencies,
native controls, changed DOM/style/class factories and non-empty data CSS payloads.
`style:lint`, the material gate, staged/outgoing Git hooks and CI run the check.

Existing legacy files are not blanket permission to add styles. Only exact,
count-bound registered observations remain accepted. Two migrated/empty sheets
(`lesson01-practice.css` and `topic-picker.css`) have also been removed from the
older first-stage filename exception list. Do not add them back.

An authorized policy-maintenance change must explain the scope/ownership in the
JSON registry, update entries deliberately, run `npm run ui:policy:describe`, and
review both the list and description diff. Add or update the component reference
and catalog for real new components. The `--inventory` scanner only collects
observations in an ignored temporary file; it does not accept or approve them.
There is no update-baseline option on the checking command.

UI factory signatures are intentionally conservative: a new or changed renderer
may need a policy review even when its implementation is otherwise compliant.
New standard static markup and typed data that do not introduce style payloads
normally use the existing contracts without adding exceptions. Checks are not a
proof of arbitrary JavaScript data flow or of meaningful human review.

`.github/CODEOWNERS` assigns policy and checker review to the repository owner.
It does not itself enforce approval or prevent direct pushes. The repository
owner must separately enable required pull requests, successful CI, code-owner
approval and restricted bypasses in GitHub rulesets. This change does not modify
remote settings or claim those settings have been verified.

Keep the component guide linked from the documentation index and the style
decision. `scripts/materials_policy_check.js` detects missing references,
disconnected validators and absent hook/CI wiring. The Git-gate tests verify
staged-tree isolation and temporary-export cleanup.

Update this policy when the shared component contract changes. Never claim that
an acknowledgement, a timestamp or a generated approval file proves compliance.
