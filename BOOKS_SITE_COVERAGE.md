# B1/B2 Book Coverage Snapshot

This document freezes the book-to-site audit completed on 2026-08-13. Routine checks use the machine-readable inventory in `assets/data/book_coverage_inventory.json`; the source PDFs do not need to be parsed again.

## Sources And Method

The compact PDFs were image-only and some pages rendered as grey blocks, so the audit used the embedded text layers in the full PDFs. All four source hashes are stored in the inventory. Re-extract book content only when one of those hashes changes or the inventory is deliberately revised.

Coverage means that the normalized Maltese word or phrase was found in the site's HTML, learning-data JSON, or word-search material. It does not by itself prove that the item has a translation, explanation, exercise, or sufficient teaching depth. Grammar themes were therefore reviewed separately.

## Frozen Baseline

| Scope | Required | Covered | Missing | Coverage |
| --- | ---: | ---: | ---: | ---: |
| B1 vocabulary | 233 | 175 | 58 | 75.1% |
| B2 vocabulary | 212 | 145 | 67 | 68.4% |
| Combined vocabulary | 437 | 312 | 125 | 71.4% |
| B1 verb-form audit | 61 | 48 | 13 | 78.7% |
| B2 verb-form audit | 64 | 30 | 34 | 46.9% |
| Combined verb-form audit | 125 | 78 | 47 | 62.4% |

All 14 chapters, seven from B1 and seven from B2, have a corresponding chapter in `assets/data/course_path.json`.

The inventory also preserves the detailed paradigm gap watchlist produced during the audit. It is intentionally kept separately from the aggregate verb-form measurement because the two checks used different scopes: the aggregate measured forms in the chapter teaching surface, while the watchlist records exact paradigm forms worth protecting or adding anywhere in the site.

The original working-tree scan reported 31 B2 forms. Validation in a clean checkout showed that `rema` came only from the ignored generated verb lookup cache, not from published site content. The frozen baseline above records the corrected clean-site result of 30 B2 forms.

## Vocabulary Gaps

### B1

- **1. Jien u Int:** ċertifikat, ħabel, jott, pedala, teżor, uviera, verità, sportiva.
- **2. Fejn Noqgħod:** trakk, vann, karozza tal-linja, bil-vann, bil-kowċ, bankina.
- **3. L-Iskola:** laboratorju, ċoff, kalzetta, żarbuna.
- **4. L-Annimali:** fellus, ħmara, emu, kamaleont, lampuka, denfil.
- **5. Il-Kuluri:** ċirku, ċrieki, kaxxi, trijanglu, trijangli, strixxa, strixxi, bandiera, Italja, Ingilterra, Ġermanja, Franza, Ukraina, Portugall, Filippini, Indja, Ġappun, Awstralja.
- **6. L-Ikel:** spagetti, kuskus, paella, meraq tal-frott, għanqud, bambinella, bajtra tax-xewk, ċirasa, tina, kejkijiet, insalati, pasti.
- **7. Il-Familja:** passeġġata, Il-waranofsinhar it-tajjeb, Mhux ħażin, Ħu ħsieb.

### B2

- **1. Fil-Basket tal-Iskola:** kumpass, ikrah, kerha, koroh, qodma, antik, ikkuluriti.
- **2. Iftaħ il-Ktieb u Aqra:** qum, qumu, daħħlu, staqsi.
- **3. It-Temp:** temperatura, sajjetti, kesħa, staġun, staġuni, bnazzi, l-ogħla temperatura, l-inqas temperatura.
- **4. Il-Ħwejjeġ:** libsa ħafifa, flokk bil-komma qasira, ġakketta tal-jeans, flokk ta' taħt, qalziet ħafif, flokk biċ-ċingi, karkur, flokk tas-suf, boots.
- **5. Xi Nħobb Nagħmel:** użaw, qum, ilgħab, se norqdu, se tilgħab, se naraw, se jgħumu, se noħorġu, se nagħmel.
- **6. Fil-Pjazza:** uffiċċju tal-Kunsill Lokali, zuntier, pastizz tal-irkotta, pastizz tal-piżelli, vjal, Aqsam it-triq, Dur mal-kantuniera, Imxi dritt, Itla' 'l fuq, Inżel 'l isfel.
- **7. Nirriċiklaw l-Iskart:** riċiklar, skart imħallat, skart riċiklabbli, maħmuġin, mimlijin, mormi, mormija, mormijin, jinten, tinten, jintnu, miftuħ, mqatta', mqattgħa, mqattgħin, armi, armu, waddab, waddbu, issepara, isseparaw.

The number forms tlettax, erbatax, sittax, sbatax, tmintax, and dsatax are covered in `numbers_calendar_time.html`; the checker reconstructs them when their roots and endings are split across spans.

## Grammar Findings

The main structural themes are present: subject pronouns, masculine/feminine agreement, demonstratives, possession, colour agreement, collective food nouns, the definite article, singular/plural imperatives, numbers 1-20, the future with `se`, directions, and recycling routines.

The clearest partial areas are:

- The rule for numbers 11-19 with `-il` plus a singular noun is demonstrated, but not explained as completely as in B2.
- Direction commands are taught, but several exact book commands are absent.
- Future and recycling structures are present, while some of the book's exact examples and inflected forms remain absent.
- The full verb-paradigm watchlist is stored in `book_coverage_inventory.json` rather than duplicated here.

## Reusable Check

Run:

```powershell
npm run books:coverage
```

The command scans the current site against the frozen inventory. Known baseline gaps do not fail the build; newly covered targets are reported as improvements. A target that was covered at baseline and later disappears fails the command and GitHub Actions.

For machine-readable current results:

```powershell
npm run books:coverage -- --json
```

When a book edition changes, verify its new hash, update the inventory from the new extraction, review this report, and establish the new baseline in the same commit.
