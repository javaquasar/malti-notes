# Project Documentation

This directory is the canonical home for project documentation. The root `README.md` introduces the project; root `AGENTS.md` contains mandatory contributor instructions. Other documentation belongs here.

## Planning

- [Roadmap](roadmap.md) - the single prioritized backlog and completed-work record.
- [Multi-language framework proposal](proposals/multi-language-framework.md) - a future, not-yet-accepted direction for extracting a reusable study engine.

## Architectural Decisions

- [Book course and topic library](decisions/0001-book-course-and-topic-library.md)
- [Shared learning content and review](decisions/0002-shared-learning-content-and-review.md)
- [Layered style system](decisions/0003-layered-style-system.md)

## Models And Quality

- [Mandatory material authoring workflow](quality/material-authoring.md) - required reading, preflight, exact-tree Git checks, CI and protection limits.
- [UI components and usage](reference/ui-components.md) - English component reference, selection rules, HTML examples, states and styling ownership.
- [Learning content model](learning-content-model.md)
- [Content verification](content-verification.md)
- [Visual regression checklist](quality/visual-regression-checklist.md)
- [UI unification checks and release assets](quality/ui-unification-checks.md)

## Analysis

- [UI unification audit and refactoring backlog](analysis/ui-unification-audit.md)
- [UI unification progress and remaining style counters](analysis/ui-unification-progress.md)
- [Speaking practice component migration](analysis/speaking-unification.md)
- [About Me component migration](analysis/about-me-unification.md)
- [Demonstration surface ownership](analysis/demo-box-unification.md)
- [B1/B2 book coverage](analysis/book-coverage.md)
- [Phrase-bank audit](analysis/phrase-bank-audit.md)
- [Review connection inventory](analysis/review-connections.md)
- [Word-search PDF coverage](analysis/word-search-pdf-coverage.md)
- [Verb course lesson map](analysis/verbs-course-lessons.md)
- [Unreachable course verbs](analysis/verbs-course-unreachable.md)
- [Particles and reading implementation](analysis/lesson03/implementation.md)

## Tools And References

- [Firebase progress sync](FIREBASE_SYNC.md)
- [Build the verb lookup pack](tools/build-verb-lookup-pack.md)
- [Export local verb extensions](tools/export-verb-extensions.md)
- [Generate review SVGs](tools/generate-review-svgs.md)
- [Repair UTF-8 mojibake](tools/utf8-mojibake.md)
- [Audit word-search PDF coverage](tools/word-search-pdf-audit.md)
- [Maltese verb sources](reference/maltese-verb-sources.md)

Run `npm run docs:check` after moving or editing documentation. The check rejects root-level Markdown sprawl and broken relative Markdown links.
