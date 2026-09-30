# Decision 0002: Shared Learning Content And Review

- Status: Accepted
- Date: 2026-09-30

## Context

Topic pages historically represented translations, examples, questions, and rules with similar ad hoc fields. That made search, review, verification, and rendering interpret the same data differently.

## Decision

1. Learning banks use the typed model documented in [Learning Content Model](../learning-content-model.md): `translation`, `example`, `questionAnswer`, or `rule`.
2. Source data owns meaning and provenance. Renderers must not infer a question/answer relationship from visual order or punctuation.
3. Shared renderers are responsible for the common card, list, question, and translation surfaces.
4. Vocabulary, sentence, verb, exercise, mistake, and progress data use shared stores and stable identifiers.
5. Search indexes, comprehensive tests, and chapter payloads are derived artifacts. Their build checks must fail when they are stale.
6. Material marked `needs-review` or represented as a pending claim must not enter public exercises or review queues.

## Consequences

- Topic pages can keep domain-specific layouts while sharing data semantics and review behavior.
- New learning types require a schema change and renderer/test support instead of page-local interpretation.
- Generated artifacts are committed for static hosting but validated in CI against canonical sources.
- Page-by-page migration can be incremental because compatibility aliases remain until the owning pages are converted.
