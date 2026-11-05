# Colour gender agreement

Reviewed on 2026-11-05. This change makes singular gender forms visible on the existing colour cards. It does not introduce a parallel vocabulary collection.

## Linguistic evidence

| Masculine | Feminine | English |
| --- | --- | --- |
| abjad | bajda | white |
| iswed | sewda | black |
| aħmar | ħamra | red |
| blu | blu | blue |
| isfar | safra | yellow |
| aħdar | ħadra | green |
| oranġjo | oranġjo | orange |
| vjola | vjola | purple |
| roża | roża | pink |
| kannella | kannella | brown |
| griż | griża | grey |
| ikkulurit | ikkulurita | colourful / coloured |

The first eleven pairs were compared with the masculine and feminine columns in *Hekk aħjar!*, **Il-kuluri**, printed page 24 (PDF page 24), a primary educational reference from the National Council for the Maltese Language and the education curriculum department:

https://www.mmargherita.org/wp-content/uploads/2015/10/hekkahjar-abbozz.pdf

The same table lists **ikħal / kaħla** as a separate blue word. The explanation must not present kaħla as the feminine of blu. Plurals are outside the scope of this singular agreement display.

The forms **ikkulurit / ikkulurita** are corroborated by the Malta Government Gazette, 29 March 2021, printed page 2764 (PDF page 10): ikkulurita describes feminine art and ikkulurit describes masculine sqaq. This verifies morphology, not every original example or the whole semantic range of colourful:

https://www.gov.mt/en/Government/DOI/Government%20Gazette/Documents/2021/03/Government%20Gazette%20-%2029th%20March.pdf

**qmis**, meaning shirt, is feminine. Primary parliamentary regulations use qmis bajda alongside qalziet twil abjad, page B1013, section 5(a):

https://parlament.mt/media/62275/1892.pdf

The lexical entry also distinguishes the feminine shirt noun from a masculine homonym:

https://en.wiktionary.org/wiki/qmis

Consequently, the page's existing shirt examples were corrected to qmis bajda, qmis ħamra and X'kulur hi l-qmis?. English translations of collective tuffieħ and frawli were corrected to apples and strawberries without changing the valid masculine collective agreement.

## Presentation and reuse

- The existing 12 core cards retain their order, slugs, review IDs and swatches. Seven headings expose the complete masculine / feminine pair; five invariant colour headings retain one word and explicitly label both forms in their notes.
- Original paired examples use flokk and libsa to make agreement easy to compare. Grammatical gender belongs to the described noun, including when the owner or wearer is a different gender.
- The page uses the existing content-card, study-contrast, mark, action-link and shared vocabulary/example renderers. No CSS, swatch payload, DOM factory, component registry, policy or visual baseline changes are required.
- Per-item verifiedClaims reference the declared primary sources in colors.json. Complete site-authored sentences are not labelled externally verified quotations.
- Generated Year 4, review-catalog, search, course and offline artifacts must be refreshed through their existing builders where affected.

## Saved material

Vocabulary IDs remain word::colors::<existing-slug>. The established word-content synchronization refreshes paired headings while retaining scheduling fields and manual-owned cards.

Corrected examples formerly identified by their text now have stable kebab-case slugs and explicit legacyReviewIds. The existing colour bootstrap loads the typed bank once, calls the data-only syncSentenceContent API, then passes the bank through the shared renderer's supported data option. This avoids changing the shared DOM factory.

The content update creates no unsaved cards. Same-ID sentence updates change only allowlisted learning fields. Legacy sentence migrations move the complete saved record atomically; if both source-owned IDs exist, the most recently reviewed record wins (reviewCount then canonical ID break ties), retaining its scheduling and custom fields. Manual-owned, different-type and different-source collisions are protected. Repeating the migration is idempotent.

The swatch backfill uses content synchronization, preserving scheduling and respecting manual ownership instead of re-adding a normalized card with default review fields.

The explicit lemma retains the original lexical head when the displayed word becomes a gender pair. Year 4 and comprehensive coverage builders use this head for deduplication: the display change must not add duplicate colour targets or disturb unrelated recognition choices. Existing course-card bindings are pinned where automatic matching would otherwise replace previously mounted feminine cards.

## Verification

Run the mandatory material gate, UI policy check, sentence-content synchronization edge cases, relevant course/generated-data and vocabulary checks, plus browser checks of cards, saved progress, search, mobile layouts, accessibility and all three themes. Record actual outcomes in the task evidence; a checklist is not a passed test.
