# Maltese Verb Sources

This note collects the most useful sources for expanding the local Maltese verb database used by the site.

## Recommended Sources

### 1. Ġabra API

URL: [https://mlrs.research.um.edu.mt/resources/gabra-api/](https://mlrs.research.um.edu.mt/resources/gabra-api/)

Why it is useful:

- Best source for lemma lookup, lemmatisation, and full-form search.
- Can search by Maltese surface form, lemma, or English gloss.
- Supports developer workflows through a documented HTTP API.
- Useful for filling missing verbs and checking whether a course form already exists in a lexical database.

Useful operations:

- `/lexemes/search?s=ktibt`
- `/lexemes/search_gloss?s=find`
- `/lexemes/lemmatise?s=ktibniehom`
- `/lexemes/wordforms/:id`
- `/lexemes/search_suggest?s=Hareg`

Notes:

- The API is UTF-8 sensitive.
- Searching in wordforms is prefix-based.
- English gloss search has its own endpoint and usually gives better English-side results than the generic search.

Source:

- [Ġabra API docs](https://mlrs.research.um.edu.mt/resources/gabra-api/)

### 2. MLRS Lexical Resources

URL: [https://mlrs.research.um.edu.mt/index.php?page=lexicons](https://mlrs.research.um.edu.mt/index.php?page=lexicons)

Why it is useful:

- Good overview page for the lexical resources maintained by the Maltese Language Resource Server.
- Confirms the role of Ġabra as the main open Maltese-English full-form lexicon.
- Good starting point when documenting the provenance of lexical data.

Source:

- [MLRS Lexical Resources](https://mlrs.research.um.edu.mt/index.php?page=lexicons)

### 3. Ġabra Download Snapshots

URL: [https://mlrs.research.um.edu.mt/resources/gabra-api/p/download](https://mlrs.research.um.edu.mt/resources/gabra-api/p/download)

Why it is useful:

- Lets you download database snapshots for local use.
- Useful if you later want a fully offline enrichment workflow instead of querying the API live.
- Helpful for bulk analysis and extension-building on your own machine.

Notes:

- The downloadable snapshots are published in BSON format.
- This is a better fit for heavy local processing than for direct browser use.

Source:

- [Ġabra Download page](https://mlrs.research.um.edu.mt/resources/gabra-api/p/download)

### 4. Ġabra Schema

URL: [https://mlrs.research.um.edu.mt/resources/gabra-api/p/schema](https://mlrs.research.um.edu.mt/resources/gabra-api/p/schema)

Why it is useful:

- Documents the structure of the database collections.
- Helpful when mapping lexeme, root, gloss, and wordform data into the local verb pack.
- Useful when designing scripts that merge external lexemes with local extensions.

Source:

- [Ġabra Schema](https://mlrs.research.um.edu.mt/resources/gabra-api/p/schema)

### 5. MLRS Corpora / Korpus Malti

URL: [https://mlrs.research.um.edu.mt/index.php?page=corpora](https://mlrs.research.um.edu.mt/index.php?page=corpora)

Why it is useful:

- Useful for checking real usage, context, and frequency.
- Better for example sentences and validation than for direct conjugation tables.
- Helpful when deciding which missing verbs are worth prioritising for learners.

Source:

- [MLRS Corpora](https://mlrs.research.um.edu.mt/index.php?page=corpora)

## Practical Recommendation

For this project, the most practical workflow is:

1. Use the local `verb.mt` export as the main source for conjugation tables.
2. Use the Ġabra API to research missing verbs and English glosses.
3. Add confirmed missing verbs into `assets/data/verbs_extensions.json`.
4. Rebuild the lookup pack with `scripts/build_verb_lookup_pack.py`.
5. Use corpora later for example sentences and prioritisation.

## Why This Split Works

- `verb.mt` is great for quick conjugation tables already available locally.
- `Ġabra` is stronger for lookup, lemmatisation, English search, and broader lexical coverage.
- `MLRS corpora` are best for usage evidence, not for direct verb-table generation.
