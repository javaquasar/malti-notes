# Malti Notes Roadmap

This is the only project roadmap. It records active priorities and durable completion history; detailed audits, proposals, and architectural decisions live in their dedicated sections under `docs/`.

## Now

### 1. Continue content verification

- Resolve remaining `pendingClaims` against books, dictionaries, and corpora.
- Add source metadata for confirmed grammar, vocabulary, and verb forms.
- Keep unverified material quarantined from public exercises, search, and review.

### 2. Finish structured-content migration

- Move remaining hand-authored phrase and question banks into the typed learning-content model.
- Preserve explicit `translation`, `example`, `questionAnswer`, and `rule` semantics.
- Remove legacy renderer aliases only after every owning page uses the shared contract.

Teaching-depth coverage is now enforced for all course targets. The generated report distinguishes simple presence from the complete learning chain: meaning, explanation, example, recognition, production, and review.

The page-by-page evidence is maintained in the [phrase-bank audit](analysis/phrase-bank-audit.md) and [review connection inventory](analysis/review-connections.md).

### 3. Improve review depth

- Add clearer review entry points for words, verb forms, sentences, and visual prompts.
- Expand verb recognition drills for pronoun, tense, polarity, and topic.
- Continue surfacing weak and due material through the knowledge map and Today queue.

## Next

### 4. Strengthen lexical coverage

- Curate missing course verbs using the documented [Maltese verb sources](reference/maltese-verb-sources.md).
- Reduce the [unreachable course verb](analysis/verbs-course-unreachable.md) inventory.
- Review useful gaps identified by the [word-search PDF comparison](analysis/word-search-pdf-coverage.md).

### 5. Prepare language-neutral boundaries

- Separate generic storage, review, exercise, and rendering code from Maltese-specific behavior.
- Introduce a language adapter only when a second language prototype is ready to validate the abstraction.
- Keep Maltese verb morphology pluggable instead of forcing it into a universal schema.

The design remains a proposal until that validation work begins: [multi-language framework proposal](proposals/multi-language-framework.md).

## Later

- Build one small second-language prototype to test the proposed framework boundaries.
- Add deeper learning analytics only where they produce a concrete next study action.
- Revisit offline storage budgets as generated banks grow.

## Completed Foundations

- Shared tokenized and layered CSS, three themes, print styles, style linting, component catalog, and visual baselines.
- Typed learning-content model with source and verification metadata.
- Shared vocabulary, sentence, verb, and mistake-review flows.
- Full-content search, adaptive coverage tests, milestone tests, backup/import, and knowledge map.
- Chapter-scoped B1/B2 book route without duplicating complete topic libraries.
- Full-page accessibility checks, semantic tables, parallel functional suites, and visual CI.
- PWA update notification and on-demand caching for large assessment banks.

## Maintenance Rules

1. Add priorities here, not in a new `*_PLAN.md` or `*_ROADMAP.md` file.
2. Put page-by-page findings in `docs/analysis/`.
3. Put unaccepted designs in `docs/proposals/`.
4. Record accepted, durable technical choices in `docs/decisions/`.
5. Put executable workflow instructions in `docs/tools/` and keep their scripts under `scripts/`.

## Consolidation Record

The following former root documents were consolidated in September 2026:

| Former document | Canonical destination |
| --- | --- |
| `SITE_IMPROVEMENT_ROADMAP.md` | This roadmap |
| `REVIEW_AND_LEARNING_PLAN.md` | This roadmap |
| `SHARED_REVIEW_CONNECTION_ROADMAP.md` | This roadmap and decision 0002 |
| `REVIEW_PAGE_CONNECTION_PLAN.md` | Review connection inventory |
| `PHRASE_BANK_REFACTOR_ROADMAP.md` | Phrase-bank audit |
| `MULTI_LANGUAGE_FRAMEWORK_PLAN.md` | Multi-language proposal |
| `STYLE_NEXT_STEPS_ROADMAP.md` | Completed foundations and decision 0003 |
| `STYLE_THEME_REFACTOR_PLAN.md` | Decision 0003 |
| `WORD_SEARCH_PDF_COVERAGE.md` | Word-search analysis |
