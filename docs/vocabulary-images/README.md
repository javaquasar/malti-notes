# Vocabulary Image Audit

The inventory covers vocabulary-card source datasets configured by `MaltiVocabReviewPage` and the Year 4 exam vocabulary. Sentence banks are excluded. Entries are card occurrences, not unique words: a word can occur on several pages. Generated Year 4 revision collections reuse these datasets and are not counted twice.

- `before-with-images.md` and `.json`: existing pictures before this work.
- `before-without-images.md` and `.json`: priority queue before downloads.
- `before-with-swatches.md` and `.json`: colour samples, counted separately.
- `current-*`: updated lists after integration; the remaining unillustrated cards stay visible here.
- `needs-image.md` and `.json`: concrete subjects still needing accurate artwork, with a reason for each entry.
- `no-image-needed.md` and `.json`: entries better taught with sentences, timelines or labelled diagrams.
- `withdrawn-images.md` and `.json`: rejected illustrations, old paths and semantic reasons; this log survives rebuilds.
- `context-only.md` and `.json`: retained context cues excluded from visual quizzes.
- `semantic-audit.json`: classification of all 911 card entries.
- `downloaded-assets.json`: original URLs, pinned upstream revision, license and file checksums.

Existing subject-specific images are preserved except for explicitly documented semantic errors (the garden assigned to cleaning and the shelf assigned to a library) and the requested classroom and Home and Furniture replacements. Generic favicon placeholders are not counted as useful illustrations. No fuzzy matching is used: `assets/data/vocabulary_image_sources.json` contains explicit reviewed English-gloss mappings. Some icons illustrate a category, activity or emotion rather than a literal object. Abstract grammar, ambiguous meanings and named Maltese landmarks without accurate artwork remain unillustrated rather than receiving an unrelated icon.

Initial inventory: 911 card entries, 102 illustrated, 791 without a useful picture, and 18 colour swatches. After the semantic audit and classroom replacements: 582 illustrated, 311 without a picture, and the same 18 swatches. The 311 entries split into 44 subjects needing artwork and 267 entries where a standalone image is not recommended. Counts decreased intentionally: 31 misleading illustrations were withdrawn, six new subjects were illustrated, and sugar, river and shelf approximations were replaced. The classroom library now has a reading-room scene. Shared icons can appear on several cards; counts are not unique artwork counts.

## Teaching Use

`teaching-audit.json` records image roles and bilingual-example coverage for every entry. There are 203 quiz-eligible visuals (including colour swatches) and 820 paired examples. The remaining 91 entries need a contextual example and English translation; no generic `Nara` sentence is invented for abstract grammar. Existing topic examples are reused where possible; simple object examples and translated topic examples have explicit provenance.

`imageRole: identifying` and `imageQuizEligible: true` explicitly permit image-to-Maltese practice. Calendar icons, family-role symbols and other context cues remain visible on topic cards but are excluded from that quiz. Unknown eligibility defaults to excluded. Pre-existing labelled illustrations are context-only because their text can reveal the answer; this also prevents generic category art being treated as a literal quiz prompt. Misleading packaging and room-object approximations were withdrawn rather than used as context. The old bookshelf export depicted books without a shelf and was replaced by a literal shelf SVG.

Topic groups have independent Images and English checkboxes, saved locally. Examples include Maltese and English. Saved built-in review cards receive current images, eligibility and examples through an ID-keyed catalog, without changing their ID, wording, topic, box, review count or review dates. Manual cards are never updated. Clearing an obsolete image is supported explicitly. A failed or offline catalog fetch does not prevent review; normal PWA caching can serve a previously downloaded catalog.

## Image Credits

New illustrations: **OpenMoji**, the open-source emoji and icon project by **HfG Schwabisch Gmund and the OpenMoji contributors**. Original SVGs are used without modification.

- Project: https://openmoji.org/
- Source: https://github.com/hfg-gmuend/openmoji
- License: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0), https://creativecommons.org/licenses/by-sa/4.0/
- Original license text: `assets/img/openmoji/LICENSE.txt`.

Additional household and landscape illustrations: **Game-icons.net**, by **Delapouite and Caro Asercion**, licensed under **CC BY 3.0**, https://creativecommons.org/licenses/by/3.0/. Original black-on-transparent SVG exports are unmodified. `game-icons-assets.json` records individual authors, source pages, download URLs and checksums. Run `node scripts/import_vocabulary_game_icons.js` to reproduce this supplementary import.

Additional originals from **Pictogrammers / Material Design Icons**, by **Google, Simran and GreenTurtwig**, under **Apache 2.0**, https://www.apache.org/licenses/LICENSE-2.0. `mdi-assets.json` records authors, pinned revision, original URLs and checksums. Original collection notice and full Apache license are in `assets/img/mdi/`. No SVGs were modified.

Supplementary transparent originals under **CC0 1.0**: cauliflower by **cactus cowboy** (Openclipart, hosted by Wikimedia Commons), wasp uploaded by **Juhele**, derived from **publicdomainq.net** (Openclipart), and glue uploaded by **SVG Repo**. `cc0-assets.json` records each source page, download URL, license and checksum. Artwork is unmodified. Run `node scripts/import_vocabulary_cc0.js` before the teaching and derived-data rebuilds.

Six classroom replacements are scoped to `school_classroom.json` by slug: table (Game-icons.net), chair (OpenMoji), and window, door, library and board (CC0 SVG Repo originals). They do not change illustrations on other topic pages. `classroom-image-replacements.json` records old and new paths and source pages. The library scene is context-only; the five standalone objects are identifying illustrations. This scoped import is reproducible and overrides the older generic board mapping. Superseded downloaded candidates remain in the provenance manifest but are not displayed on the page.

All 23 Home and Furniture illustrations use unmodified open-source originals rather than the old custom `assets/img/home/` artwork. `home-assets.json` records the sources, licenses and checksums; `home-image-replacements.json` records all old and new paths. CC0 room and roof artwork from SVG Repo and bedroom furnishings by **loveandread / Openclipart** are combined with existing OpenMoji, Game-icons.net and Pictogrammers objects. Room/workspace and garden cues remain context-only, while the ten furniture objects and four directly depicted outside objects are quiz-eligible. This import changes only `home_furniture.json`. Superseded candidates remain credited in the manifest, but are not displayed.

Cutout images use a stable 128px-high, centered `contain` area. Bookmark controls have a separate top clearance. Illustrated Year 4 cards use symmetric padding; text-only cards retain extra space for their bookmark. Screenshots and geometric checks cover 320px, 390px and 1280px widths, plus centering in review practice.

Only the imported artwork is covered by this attribution/license notice; it does not relicense unrelated site code or original teaching material. Per-image source URLs are stored in the vocabulary data and in `downloaded-assets.json`.

## Rebuild

Run `node scripts/vocabulary_image_inventory.js` for current lists. Preserve the original `before-*` snapshots. Run `node scripts/import_vocabulary_images.js` to add missing mapped images, then `node scripts/build_year4_revision_data.js` to rebuild derived Year 4 collections. The import preserves existing non-placeholder images and swatches.

For the Home and Furniture refresh, run `node scripts/import_vocabulary_game_icons.js`, `node scripts/import_vocabulary_cc0.js`, then `node scripts/import_home_furniture_images.js`. For the teaching improvements, run `node scripts/improve_vocabulary_content.js`, then `node scripts/audit_vocabulary_images.js`, `node scripts/build_year4_revision_data.js`, `node scripts/build_vocabulary_review_catalog.js`, `node scripts/build_search_index.js` and `node scripts/build_service_worker.js`. The audit applies the reviewed withdrawal policy and rebuilds both missing-image queues. The OpenMoji importer also honors that policy, so rejected approximations cannot return on a later import. Use `node scripts/build_vocabulary_review_catalog.js --check` to verify the generated catalog.

Run `node scripts/vocabulary_images_check.js` for retained originals and documented exceptions, source checksums, SVG decoding, transparent corners, nonblank artwork, desktop/mobile layout, visible credits, independent persistent visibility controls, complete disjoint missing-image queues, rejection-policy enforcement, answer-labelled image exclusions and saved-card updates without lost progress. Contact sheets of every currently used image are generated for semantic inspection. The test starts and closes its own local HTTP server.
