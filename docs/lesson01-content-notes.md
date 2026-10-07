# MQF 2 Lesson 01
All ten PDFs are mapped in `lesson01-source-coverage.json`. Each source example points to a published page, group and stable item slug. Repeated worksheets share destinations.

## Editorial decisions
- Correct Good evening attached to Il-waranofsinhar it-tajjeb to Good afternoon.
- Use Ma nifhimx instead of Mhux nifhem; retain the source wording in a note.
- Replace the repeated worksheet letter (g) with (h) for Saħħa. Evening takes Bonswa; night takes Il-lejl it-tajjeb.
- Keep Bezzjoni as the traditional blessing request printed in the worksheet.
- Keep Narak/Narakom and Narawk/Narawkom as source variants.
- Align Għoġbok/Għoġbitni with their past-tense meaning.
- Restore diacritics and spacing; complete blank templates with labelled model answers.
- Keep Evviva in both source contexts: a toast and a response to sneezing.
- Ta' xejn and M'hemmx imniex reply to thanks; Merħba welcomes someone.
- Replace English translator with traduttur and untranslated Good Luck with a Maltese model.
- Personal answers are examples, not fixed facts about every learner.
- The Marija/Pawlu dialogue and its activities come from the screenshots in the chat.

## Structure
Four new Speaking pages and supplements on six existing topic pages.
All examples use the existing review toggle. Quick checks use the existing exercise runner.

## Checks
Run `node scripts/lesson01_coverage_check.js` to verify every mapped example has a data item and rendered section.
With the local site running on port 4190, run `node scripts/lesson01_browser_check.js` for desktop/mobile rendering, review toggles, text collisions and exercise answers.

## Additional language references
- [L-Akkademja tal-Malti: Bezzjoni in Maltese prose](https://akkademjatalmalti.org/librerija/il-letteratura/proza-gizimin-li-qatt-ma-jiftah-minn-oliver-friggieri/)
- [Heritage Malta: wishing someone xorti tajba](https://heritagemalta.mt/whats-on/meet-the-busker-at-muza/)
