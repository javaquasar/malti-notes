# Vocabulary Image Audit

The inventory covers vocabulary-card source datasets configured by `MaltiVocabReviewPage` and the Year 4 exam vocabulary. Sentence banks are excluded. Entries are card occurrences, not unique words: a word can occur on several pages. Generated Year 4 revision collections reuse these datasets and are not counted twice.

- `before-with-images.md` and `.json`: existing pictures before this work.
- `before-without-images.md` and `.json`: priority queue before downloads.
- `before-with-swatches.md` and `.json`: colour samples, counted separately.
- `current-*`: updated lists after integration; the remaining unillustrated cards stay visible here.
- `downloaded-assets.json`: original URLs, pinned upstream revision, license and file checksums.

Existing subject-specific images are preserved. Generic favicon placeholders are not counted as useful illustrations. No fuzzy matching is used: `assets/data/vocabulary_image_sources.json` contains explicit reviewed English-gloss mappings. Some icons illustrate a category, activity or emotion rather than a literal object. Abstract grammar, ambiguous meanings and named Maltese landmarks without accurate artwork remain unillustrated rather than receiving an unrelated icon.

Initial inventory: 911 card entries, 102 illustrated, 791 without a useful picture, and 18 colour swatches. After integration: 599 illustrated, 294 without a picture, and the same 18 swatches. This adds illustrations to 497 previously unillustrated entries. Shared icons can appear on several cards; counts are not unique artwork counts.

## Image Credits

New illustrations: **OpenMoji**, the open-source emoji and icon project by **HfG Schwabisch Gmund and the OpenMoji contributors**. Original SVGs are used without modification.

- Project: https://openmoji.org/
- Source: https://github.com/hfg-gmuend/openmoji
- License: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0), https://creativecommons.org/licenses/by-sa/4.0/
- Original license text: `assets/img/openmoji/LICENSE.txt`.

Additional household and landscape illustrations: **Game-icons.net**, by **Delapouite and Caro Asercion**, licensed under **CC BY 3.0**, https://creativecommons.org/licenses/by/3.0/. Original black-on-transparent SVG exports are unmodified. `game-icons-assets.json` records individual authors, source pages, download URLs and checksums. Run `node scripts/import_vocabulary_game_icons.js` to reproduce this supplementary import.

Only the imported artwork is covered by this attribution/license notice; it does not relicense unrelated site code or original teaching material. Per-image source URLs are stored in the vocabulary data and in `downloaded-assets.json`.

## Rebuild

Run `node scripts/vocabulary_image_inventory.js` for current lists. Preserve the original `before-*` snapshots. Run `node scripts/import_vocabulary_images.js` to add missing mapped images, then `node scripts/build_year4_revision_data.js` to rebuild derived Year 4 collections. The import preserves existing non-placeholder images and swatches.

Run `node scripts/vocabulary_images_check.js` for original-image preservation, source checksums, SVG decoding, transparent corners, nonblank artwork, desktop/mobile layout, visible credits and image persistence in the review collection. The test starts and closes its own local HTTP server.
