# Mandatory Authoring Instructions

These instructions apply to this entire repository, including new pages,
learning data, generated materials and scripts. Read them before editing.

## Required Reading and Preflight

Before creating or expanding learning material, read:

1. `docs/quality/material-authoring.md`
2. `docs/reference/ui-components.md`
3. `docs/decisions/0003-layered-style-system.md`
4. `docs/learning-content-model.md`
5. `docs/content-verification.md`

Run `npm run materials:preflight` before authoring and resolve failures before
proceeding. On a new checkout, run `npm run materials:hooks:install` to install
the commit/push guards. Do not describe a check as passed unless it was run.

## Implementation Rules

- Identify the content type, sources, shared renderer and component choices before editing.
- Reuse shared components; page CSS owns topic-specific composition, not copied control surfaces.
- Add genuinely missing reusable variants to the shared layer and component catalog before using them.
- Keep UI explanations and translations in English; preserve Maltese learning text and its language metadata.
- Use typed data, stable IDs, the existing review/progress APIs and the content-verification workflow.
- Do not bypass required reading or checks, add inline styles, override shared tokens locally, or expand legacy exceptions to hide a duplication.
- Do not disable hooks, weaken validators, suppress failures or promote unexplained visual regressions to finish a content task.
- Changes to this policy or its validators require explicit policy-maintenance intent, not an ordinary material request.

## Before Delivery

Run `npm run materials:check` and the relevant functional, accessibility and
visual checks. Preserve existing progress. Report any unresolved failure or
verification limitation. The pre-commit hook validates the staged tree; the
pre-push hook validates outgoing commit tips. CI independently enforces the gate.

Never claim that local hooks prevent an administrator from bypassing policy.
GitHub rulesets are a separate repository-owner decision documented in the
mandatory authoring workflow.
