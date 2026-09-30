# Audit Word-Search PDF Coverage

`scripts/analyze_word_search_pdf_coverage.py` compares English tokens from a source PDF with English glosses in the word-search bank. It writes the reproducible report at `docs/analysis/word-search-pdf-coverage.md`.

## Dependency

```powershell
python -m pip install pypdf
```

## Generate The Report

```powershell
npm run word-search:coverage -- --pdf "C:\path\to\level 5 word lists final.pdf"
```

The source can also be supplied through `MALTI_WORD_SEARCH_SOURCE`:

```powershell
$env:MALTI_WORD_SEARCH_SOURCE="C:\path\to\level 5 word lists final.pdf"
npm run word-search:coverage
```

Use `--bank` or `--output` to override the default repository paths. Use `--check` to verify that the committed report matches the source without rewriting it.

This is an optional local audit because the source PDF is not stored in the repository. The generated report is committed so its result remains available without reparsing the PDF.
