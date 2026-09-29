# Content Verification

## Policy

- Text markers such as `[UNCERTAIN]` are not valid learning content.
- A whole example that still needs linguistic review uses `verificationStatus: "needs-review"` and a stable `verificationId`.
- Needs-review examples remain in source data for later correction, but renderers and generated exercise banks exclude them.
- A doubtful claim inside an otherwise usable vocabulary item uses `pendingClaims`. Pending claims are not displayed.
- Confirmed claims use `verifiedClaims` and reference a source declared in the same data file.

## Current Audit

Checked on 2026-09-29:

- 22 sentence or question-answer examples are quarantined pending Maltese-language review.
- 28 animal plural claims remain pending and are not shown to learners.
- 8 animal plurals were confirmed against the University of Malta's Maltese broken-plural corpus and restored with source metadata.
- The two supplied B1 and B2 PDFs are image-only scans. Their frozen course inventory remains the coverage source, but the PDFs do not provide searchable evidence for these individual claims without a new OCR pass.

## Verified Source

- Malta Language Resource Server, University of Malta: [Maltese broken plural corpus](https://mlrs.research.um.edu.mt/dl/broken_plural_CVPattern.pdf)

## Automated Gate

Run `npm run content:verify`. The check rejects text uncertainty markers, malformed verification metadata, displayed pending claims, and quarantined pairs that leak into the search index, Year 4 revision data, or the comprehensive test bank.
