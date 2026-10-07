# MQF 2 Lesson 01
All ten PDFs are mapped in `lesson01-source-coverage.json`. Each source example points to a published page, group and stable item slug. Repeated worksheets share destinations.

## Editorial decisions
- Correct Good evening attached to Il-waranofsinhar it-tajjeb to Good afternoon.
- Use Ma nifhimx instead of Mhux nifhem; retain the source wording in a note.
- Replace the repeated worksheet letter (g) with (h) for Saħħa. Evening takes Bonswa; night takes Il-lejl it-tajjeb.
- Keep Bezzjoni as the traditional blessing request printed in the worksheet.
- Keep Narak/Narakom and Narawk/Narawkom with the distinction between one speaker and several speakers, and one listener and several listeners.
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

## Speaking practice
- Four speaking pages share 20 essential phrases, paired replies and usage notes. Source banks remain intact and are labelled Essential, Context / extension or Traditional.
- Three adapted dialogues support both roles, guided and independent modes. Production practice includes translation, restoring a reply and completing a phrase. Model names are fixed fictional examples, not personalised answers.
- Errors enter the existing mistake journal and review collection. Missing Maltese letters receive spelling feedback and review instead of independent credit. Each task is scored once per presentation; showing a model or opening hints counts as assisted.
- Skill progress uses `malti_lesson01_skills_v1`, included in the existing backup/Firebase allowlist. Self-assessment of a timed conversation is separate from checked answers. Microphone recordings and local audio files are not persisted or uploaded.
- Pronunciation links were checked on 2026-10-07: Forvo lists Maltese recordings of Bonġu by markcame, L-għodwa t-tajba by mell0026 and Grazzi by Mikiel, all with location Malta. These are community recordings, not a language-authority certification. No clips were downloaded or republished.
- Full licensed native dialogue recordings are still missing. The local recorder and audio-file player support normal and 0.75 speed without claiming to verify pronunciation. No fallback English/Italian synthetic voice is used.
- Run `node scripts/lesson01_practice_check.js` with a server on port 4190 for normalization, review, task modes, all six roles, hints, timer, persistence and desktop/mobile checks.

## Adaptive practice and local family details
- Accepted alternatives are curated per phrase and dialogue turn. Exact normalized variants receive credit; edit distance only selects a useful model for feedback and never grants credit to a wrong answer. This is not a general-purpose grammar checker.
- Feedback distinguishes missing article prefixes, known person/gender contrasts, Maltese-letter differences and other wording differences. A fragment retry is assisted and cannot overwrite a failed full-answer result.
- Mixed checks draw two distinct items from each of the four skills and hide model/hint controls. The result reports answered items and identifies skipped tasks. Focused sessions prioritise the actual missed phrase or dialogue turn, then add examples from the weakest skill.
- Personal mode imports only the learner's explicitly saved local about-me draft. Names, origin, work, hobbies and family details can be used in practice. Personal text is never written to skill metrics, mistake answers or automatic review cards; those use public model patterns. The draft remains excluded from backup/Firebase synchronization.
- The full and guided about-me builders support one or two children with independent name, gender and age fields. Legacy son/daughter drafts migrate to one child with the correct gender. Inactive child details are retained locally for editing but excluded from generated stories. One year uses sena; the other numeric ages use snin. Blank or out-of-range ages are omitted.
- Run `node scripts/lesson01_adaptive_check.js` for children, migration-compatible forms, privacy, personal dialogue variants, targeted feedback, mixed checks and next-step practice on desktop/mobile.

## Pronunciation references
- [Forvo: Bonġu](https://forvo.com/word/bon%C4%A1u/)
- [Forvo: L-għodwa t-tajba](https://forvo.com/word/l-g%C4%A7odwa_t-tajba/)
- [Forvo: Grazzi](https://forvo.com/word/grazzi/)
## Additional language references
- [L-Akkademja tal-Malti: Bezzjoni in Maltese prose](https://akkademjatalmalti.org/librerija/il-letteratura/proza-gizimin-li-qatt-ma-jiftah-minn-oliver-friggieri/)
- [Heritage Malta: wishing someone xorti tajba](https://heritagemalta.mt/whats-on/meet-the-busker-at-muza/)
