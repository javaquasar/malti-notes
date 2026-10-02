# Teaching Depth

Book coverage answers whether a required Maltese term exists somewhere on the site. Teaching depth answers whether that target is actually teachable and testable.

Every implemented B1/B2 course target must provide six stages:

1. `meaning`: a reviewed English gloss or grammar summary
2. `explanation`: a linked teaching surface and assessment feedback, or a full grammar rule
3. `example`: a bilingual contextual example
4. `recognition`: at least one recognition assessment
5. `production`: at least one learner-produced answer
6. `review`: a review card attached to assessment feedback

The generated `assets/data/teaching_depth_report.json` contains overall, target-type, and chapter summaries plus exact target gaps. It is displayed on `course_progress.html` and cached for offline use.

Run:

```powershell
npm run depth:build
npm run depth:check
```

`depth:check` fails when the generated report is stale or any implemented target loses one of the six stages. GitHub Actions runs this check independently and through `course:lint`.
