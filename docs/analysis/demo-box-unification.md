# Demonstration Surface Ownership

Work package U03 from the [UI unification audit](ui-unification-audit.md).

## Change

Removed the `.demo-box` surface rule from `assets/css/pages.css`. The component remains implemented by `assets/css/site/components.css`, including its existing demonstration-specific padding and muted background. The shared base rule and its modifier belong to the same owner; no page stylesheet may supply a competing surface.

No class, renderer, source text, bank identity or review identity changed. The three JSON-configured pronoun groups still render all 22 models through the common example-bank renderer. This is a cascade ownership fix, not a new presentation or a new component variant.

## Verification

`npm run ui:runtime:check` now includes `pronouns_possessives.html` in Classic, Forest and Contrast at 1280 and 390 pixels. It verifies the count and Maltese text of all 22 generated models. Every model's background, border, radius and four padding edges are compared with the catalog demonstration in a separate reference page **without** `pages.css`. A page override therefore cannot contaminate the expected result. A deliberately injected padding override must be detected. The existing save/reload/review checks also run on this page.

Screenshots of the generated family models are saved under ignored `tmp_ui/demo-box-*.png`. They are inspected on desktop and mobile. The normal accessibility checker covers the pronoun page on both viewports; the theme contrast gate remains unchanged. `materials:check` checks style ownership, content, data and offline freshness.

`visual:catalog` is still run without baseline promotion. It reports the known six full-page baseline size mismatches. This migration does not approve that unrelated historical drift or claim that the complete visual gate is green.
