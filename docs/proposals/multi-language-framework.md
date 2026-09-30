# Proposal: Multi-Language Framework

- Status: Proposed
- Last reviewed: 2026-09-30

This proposal is intentionally separate from the accepted decisions. The abstraction should be validated with a second-language prototype before adoption.

## Goal

Turn the current Maltese study site into a reusable foundation for building study websites for other languages, without losing the strong language-specific workflows that already exist.

This document focuses on how to separate:

- the **reusable learning engine**
- from the **Maltese-specific content and logic**

## Current State

The site already behaves like a lightweight language-learning platform in several important ways.

It already has:

- JSON-driven vocabulary pages
- reusable vocabulary renderers
- reusable example-bank rendering
- browser-based review storage
- shared review flows for words, verb forms, and now sentences
- topic dashboards and quick sessions
- page-level “add to review” integration
- local-first architecture with no backend requirement

That means the project is already more than a single-language site. It is close to being a reusable language-study framework.

## Main Architectural Idea

The best long-term direction is:

1. keep the current review and rendering engine
2. move Maltese-specific behavior into a language layer
3. make page data and labels configurable
4. keep advanced grammar/drill systems pluggable rather than universal by force

## What Is Already Reusable

The following parts are already strong candidates for reuse across languages with little or no structural change.

### Shared review engine

- [C:\Workspace\prj\jq\malti-notes\assets\js\review-store.js](C:\Workspace\prj\jq\malti-notes\assets\js\review-store.js)
- [C:\Workspace\prj\jq\malti-notes\assets\js\review-cards.js](C:\Workspace\prj\jq\malti-notes\assets\js\review-cards.js)

These already support:

- local review persistence
- multiple card types
- due logic
- quick sessions
- topic filtering
- multiple answer layouts

### Shared page-to-review integration

- [C:\Workspace\prj\jq\malti-notes\assets\js\vocab-review-page.js](C:\Workspace\prj\jq\malti-notes\assets\js\vocab-review-page.js)
- [C:\Workspace\prj\jq\malti-notes\assets\js\render-example-banks.js](C:\Workspace\prj\jq\malti-notes\assets\js\render-example-banks.js)

These already provide:

- page bulk add
- section bulk add
- review summary chips
- page-level review wiring

### Shared renderers

- `render-vocab-cards.js`
- `render-vocab-table.js`
- `render-example-banks.js`

These are good reusable primitives for:

- word lists
- table views
- phrase banks
- example-driven study sections

### Layout and UI system

- [C:\Workspace\prj\jq\malti-notes\assets\css\site.css](C:\Workspace\prj\jq\malti-notes\assets\css\site.css)
- [C:\Workspace\prj\jq\malti-notes\assets\css\pages.css](C:\Workspace\prj\jq\malti-notes\assets\css\pages.css)

The visual language is already generic enough for:

- topic pages
- sidebars
- tags
- content cards
- floating review access
- shared page actions

## What Is Currently Maltese-Specific

These parts need to be abstracted if the site is meant to support other languages cleanly.

### Verb system

This is the most Maltese-specific subsystem.

Relevant files include:

- [C:\Workspace\prj\jq\malti-notes\assets\js\verb-lookup-loader.js](C:\Workspace\prj\jq\malti-notes\assets\js\verb-lookup-loader.js)
- [C:\Workspace\prj\jq\malti-notes\assets\data\verbs_extensions.json](C:\Workspace\prj\jq\malti-notes\assets\data\verbs_extensions.json)
- [C:\Workspace\prj\jq\malti-notes\assets\data\verbs_course_bank.json](C:\Workspace\prj\jq\malti-notes\assets\data\verbs_course_bank.json)
- [C:\Workspace\prj\jq\malti-notes\scripts\build_verb_lookup_pack.py](C:\Workspace\prj\jq\malti-notes\scripts\build_verb_lookup_pack.py)
- [C:\Workspace\prj\jq\malti-notes\wasm-search\src\lib.rs](C:\Workspace\prj\jq\malti-notes\wasm-search\src\lib.rs)

Maltese-specific assumptions currently include:

- Maltese normalization rules
- special letters such as `ċ ġ għ ħ ż`
- Maltese verb lookup packs
- `present / past / imperative`
- pronoun order and labels
- polarity handling
- lemma lookup structure
- Maltese-specific alias logic

This should not be treated as the universal default for other languages.

### Text schema assumptions

Many data files still assume the pair:

- `maltese`
- `english`

That works well for this site, but it is not language-neutral.

For a reusable framework, the long-term schema should move toward:

- `sourceText`
- `targetText`

or another generic equivalent.

### Page-level content conventions

Some page patterns currently assume:

- Maltese on the left
- English on the right
- example sentences with `mt` and `en`
- certain grammar labels already baked into the page structure

These should become configurable rather than implicit.

## Recommended Framework Shape

The best architecture is a layered one.

### Layer 1: Core study engine

This layer should stay language-agnostic.

It would include:

- review storage
- scheduling
- review UI
- topic dashboards
- quick sessions
- shared renderers
- page-to-review wiring
- page layouts

### Layer 2: Language adapter

Each language should define its own adapter.

Example structure:

- `assets/js/languages/maltese.js`
- `assets/js/languages/spanish.js`
- `assets/js/languages/german.js`

This layer would define:

- normalization
- label strings
- writing direction if needed
- special grammar filters
- pronoun ordering
- verb metadata formatting
- optional language-specific study modes

### Layer 3: Content packs

Each site or language should supply data files such as:

- vocabulary JSON
- example-bank JSON
- optional morphology data

This keeps content independent from the review engine.

## Configuration Needed

To support other languages cleanly, introduce a site-level configuration file.

Suggested shape:

```json
{
  "languageCode": "mt",
  "languageName": "Maltese",
  "baseLanguage": "English",
  "labels": {
    "review": "Review",
    "findVerb": "Find a Verb"
  },
  "features": {
    "vocabReview": true,
    "sentenceReview": true,
    "verbLookup": true,
    "verbDrills": true,
    "imageCards": true
  }
}
```

This configuration would help determine:

- which features a language site actually uses
- which labels to render
- whether advanced verb tooling is present

## Recommended Schema Evolution

### Short-term

Keep current `maltese` / `english` naming where it already works, but avoid spreading it further into new shared logic.

### Medium-term

For new shared systems, introduce neutral naming such as:

- `sourceText`
- `targetText`
- `displaySource`
- `displayTarget`

### Long-term

Migrate shared renderers so they no longer care which language is “Maltese” and which is “English”.

## Verb System Strategy

The verb system should become optional and pluggable.

### Recommended direction

Do not try to force a single universal morphology engine across all languages.

Instead:

1. keep the current Maltese verb engine as a language module
2. define an interface for optional morphology support
3. allow each language to opt in only if it has suitable data

### Why this matters

Different languages need very different structures:

- Maltese: roots, patterns, consonant behavior, special normalization
- Spanish: person, tense, mood
- German: irregular conjugation plus separable verbs
- Arabic: roots and patterns again, but differently from Maltese
- Japanese: dictionary/polite/plain/te-form families

Trying to make all of that fit one rigid model too early would likely weaken the framework.

## Best Near-Term Reuse Cases

Even before a full refactor, the current site can already serve as a base for:

- Spanish vocabulary and phrase practice
- Italian vocabulary and phrase practice
- German vocabulary and phrase practice
- any language site focused mainly on:
  - vocabulary pages
  - phrase banks
  - example-bank review
  - browser-based local review

That means the framework is already useful even without exporting the Maltese verb system.

## Refactor Priorities

If the project should move toward multi-language reuse, the most valuable sequence is:

### 1. Introduce a framework/config layer

Create a site config that controls:

- labels
- enabled features
- language identity

### 2. Stop expanding Maltese-specific assumptions in shared code

New shared systems should avoid hardcoded `maltese`, `english`, or Maltese-only labels where possible.

### 3. Extract Maltese-specific logic into a language adapter

Especially:

- normalization
- verb lookup behavior
- pronoun formatting
- verb drill labels

### 4. Keep the verb system pluggable

Treat morphology support as optional per language.

### 5. Standardize data contracts

Make it easy to supply:

- vocab data
- example-bank data
- optional grammar/drill data

without rewriting the engine.

## Suggested Migration Path

### Stage 1: Framework-friendly cleanup

- add site config
- add language adapter entry point
- keep the current Maltese site working as-is

### Stage 2: Shared schema discipline

- use neutral data names in new shared features
- keep legacy fields supported for compatibility

### Stage 3: Extract Maltese engine pieces

- isolate Maltese review labels
- isolate Maltese normalization
- isolate Maltese verb pack handling

### Stage 4: Build one second-language prototype

The best test is not theoretical abstraction. It is a real second site.

For example:

- a small Spanish or Italian prototype
- using only vocabulary, phrases, and sentence review

That will quickly reveal which assumptions are still too Maltese-specific.

## What Success Looks Like

The framework should eventually support this model:

1. choose a language
2. provide vocab and example-bank JSON
3. enable only the features needed for that language
4. optionally plug in a language-specific verb/morphology module
5. reuse the same page shells, review engine, and navigation patterns

## Recommended Next Step

The best next step is not to rewrite everything.

Instead:

1. add a small site configuration layer
2. document which shared systems are engine-level
3. document which files are Maltese-specific
4. then try one small second-language prototype with vocab and sentence review only

That will keep the project grounded and prevent over-abstracting too early.
