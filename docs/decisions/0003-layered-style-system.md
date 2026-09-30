# Decision 0003: Layered Style System

- Status: Accepted
- Date: 2026-09-30

## Context

Page-local CSS and overlapping component classes repeatedly caused missing borders, fills, spacing, and inconsistent theme behavior.

## Decision

1. `assets/css/site.css` is the single page entry point and imports the shared layers in a stable order.
2. Theme files own color values. Shared and page CSS consume semantic custom properties instead of declaring direct colors.
3. Repeated learning surfaces use shared component contracts for cards, framed groups, tables, rules, questions, and translations.
4. Page-specific CSS may define composition unique to a page, but it must not duplicate shared visual contracts.
5. Classic, forest, and contrast themes are first-class and must pass automated contrast checks.
6. UI component screenshots, framed-group baselines, and full-page visual shards protect the common style system.
7. Legacy class aliases may remain only as documented migration bridges and should be removed after usage reaches zero.

## Consequences

- A shared token change can affect the whole site and therefore requires visual and accessibility verification.
- New component variants belong in the shared catalog before broad page adoption.
- Inline style declarations and direct color values outside theme files are rejected by style checks.
- The manual visual workflow remains documented in [Visual Regression Checklist](../quality/visual-regression-checklist.md).
