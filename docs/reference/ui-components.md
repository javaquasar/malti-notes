# UI Components and Usage

This is the implementation guide for the site's shared UI components. Use it
when adding a page, extending an exercise or changing the visual theme.

Reading this guide is mandatory before authoring learning material. Follow the
[material authoring workflow](../quality/material-authoring.md) and run
`npm run materials:preflight` before editing. The same measurable rules are
checked again by the Git hooks and CI; a passed preflight is not permanent approval.

- [Visual component catalog](../../scripts/fixtures/ui_component_catalog.html): rendered examples and component states.
- [Style architecture](../decisions/0003-layered-style-system.md): ownership rules and migration policy.
- [Learning content model](../learning-content-model.md): translation, example, question/answer and rule data.

CSS classes provide presentation. They do not create review records, validate
answers, persist progress, copy text or implement drag-and-drop.

## Choose a Component

| Content or interaction | Use | Application rule |
| --- | --- | --- |
| Main page section | `content-card` | Use an existing section surface, not a new page-specific background or radius. |
| A repeated phrase with a translation | `study-card` | Keep source text, translation and optional notes in one item. |
| Explanatory information | `info-card` | Use for a short fact or explanation rather than an interactive exercise. |
| A worked example | `example-card` | Use for an example of a rule or construction. |
| A reusable language structure | `pattern-card` | Use for a sentence pattern or formula. |
| One speaker's contribution | `dialogue-card` | Group related turns with the existing dialogue layout. |
| A demonstration | `demo-box` | Use for a worked model, not as a generic wrapper around every section. |
| A compact reference item | `study-card study-card-compact` | Keep both classes: the second is a modifier, not a replacement. |
| A note within a card collection | `study-card study-card-note` | Use the note surface without adding local color rules. |
| A primary command | `action-button` | Use a native button with an explicit `type`. |
| Navigation styled as an action | `action-link` | Use an anchor with a real destination. |
| Text or numeric entry, or a select | `study-input` | Pair the control with a visible label. |
| A binary preference | `study-check` | Apply to the label containing a native checkbox. |
| A short set of possible answers | `study-option` | Use a button for each answer; wire selection or submission separately. |
| A movable word in a builder | `study-token` | Keep candidate and selected words at the same token height. |
| Optional examples or exercise bank | `study-disclosure` | Use native `details` and `summary`. |
| A compact collapsible question | `study-disclosure study-card` | The whole question owns the card surface. |
| A prominent exercise prompt | `study-question` | Use inside a study tool, not as a page heading. |
| Answer feedback | `study-feedback` | Include explicit result text; do not communicate correctness by color alone. |
| A comparison of related forms | `study-contrast` | Highlight only the changing forms with `mark`. |
| A printable exercise sheet | `print-sheet` | Keep printing controls outside the sheet content. |

## Layout and Containers

| Class | Purpose | When to use it |
| --- | --- | --- |
| `stack` | Vertical grid with shared spacing | Related items in one column. |
| `grid-2`, `grid-3` | Existing responsive column layouts | Comparable items of similar complexity. |
| `grid-auto` | Automatically fitted columns | Repeated items that do not require a fixed column count. |
| `toolbar-row` | Wrapping row of actions | Commands such as Check, Next and Copy. |
| `control-row` | Wrapping controls aligned at the bottom | Labels, fields, checkboxes and commands in one form. |
| `control-row control-row--responsive` | Control group that becomes one column at 600px and below | Filters and forms that need full-width mobile fields. |
| `segmented-toggle` with `toggle-chip` buttons | A compact choice between modes | Set `aria-pressed` on exactly one active button; the owning controller implements switching and persistence. |
| `content-group`, `open-group`, `example-bank-section` | Existing framed group contracts | Use when the content genuinely needs a group boundary; the word "open" does not mean unframed. |

Prefer an unframed layout for arranging repeated cards. Do not introduce another
decorative card just to group controls. Do not use deprecated classes such as
`box`, `item`, `pair`, `pattern` or `phrase-card` in new markup.

### A Bilingual Study Item

```html
<article class="study-card">
  <strong lang="mt">tliet kotba</strong>
  <span>three books</span>
  <small>Use the ordinary counted form before this noun.</small>
</article>
```

For repeated learning material, prefer the existing typed JSON banks and shared
renderers to manually duplicating HTML. A question and its answer are not a
translation pair: use the `questionAnswer` data type and the existing Q&A
renderer. Review actions must use the shared review store and stable item IDs.

## Fields and Checkboxes

`study-field` arranges a label and its control. `study-input` owns the control's
height, padding, border, radius, font and theme surface. It works on both inputs
and selects. `study-check` arranges a checkbox label and gives the native checkbox
a consistent size and accent color.

```html
<form class="control-row control-row--responsive">
  <label class="study-field">
    Your answer
    <input class="study-input" name="answer" autocomplete="off">
  </label>
  <label class="study-field">
    Topic
    <select class="study-input" name="topic">
      <option value="forms">Number forms</option>
      <option value="time">Clock time</option>
    </select>
  </label>
  <label class="study-check">
    <input type="checkbox" name="adaptive" checked>
    Adaptive review
  </label>
  <button class="action-button" type="submit">Check answer</button>
</form>
```

Use native `disabled` for unavailable controls. Preserve keyboard focus outlines.
Use `aria-describedby` to associate additional help or an error with an input.
Do not replace a visible label with placeholder text. The responsive row makes
its fields full width on small screens; outside that row, choose an appropriate
layout rather than adding a second field appearance rule.

## Actions, Options and Tokens

| Class or combination | Description | Behavior required from the controller |
| --- | --- | --- |
| `action-button` | Standard command surface | Handle click or form submission. |
| `action-button study-icon-button` | Square icon command | Provide an accessible name and a descriptive `title`. |
| `study-link-button` | A low-emphasis command with link-like styling | Use a button when the action does not navigate. |
| `study-option` | An answer-choice button | Record or submit the chosen value; disable it when appropriate. |
| `study-token` | An available word or fragment | Insert the represented token, preserving its identity. |
| `study-token study-token--selected` | A selected token | Maintain its order and selected state. |
| `study-token study-token--selected study-token--removable` | A selected token with a removal indicator | Return the token on activation and restore keyboard focus. |

```html
<div class="toolbar-row">
  <button class="study-token" type="button">mija</button>
  <button class="study-token study-token--selected study-token--removable"
          type="button" aria-label="Return elf to the word bank">elf</button>
  <button class="study-option" type="button">tliet</button>
  <button class="action-button study-icon-button" type="button"
          aria-label="Move selected word left" title="Move selected word left">&larr;</button>
  <button class="study-link-button" type="button">Copy</button>
</div>
```

The removal indicator is generated by CSS; it does not remove anything by
itself. A builder still needs keyboard-accessible movement and removal, stable
token IDs and its existing undo behavior. Do not change token height when its
state changes. Do not make drag-and-drop the only way to reorder words.

Bookmark buttons belong to the existing review component and renderer. They
must reflect the real review-store state, expose an accessible name and update
`aria-pressed`; a decorative bookmark alone is not a working review control.

For a bookmark in a table cell or action toolbar, combine
`review-add-button review-add-button--icon review-add-button--inline`.
This shared variant stays in normal flow and centers the icon without a
sentence-card grid wrapper. Keep table actions in their own column.
The variant is supplied by `site/review-inline.css`, imported through `site.css`;
pages must not load this shared layer directly.

Icon review buttons use a single flex row with zero gap, not a grid with an
anonymous text row. Their glyph has no translation offset and stays centered
whether the renderer supplies fallback text or only an accessible label.
Sentence-card review actions center against the first grid row, including a
paragraph's margins. Shared review tables use `review-table` and a dedicated
`review-table-action` column to center row text and controls together. Do not
compensate for misalignment with per-page offsets or transforms.

## Disclosures

Use the default disclosure for a bank of examples. The summary owns the shared
surface, while `study-disclosure-body` gives the revealed content an indentation
and a vertical guide. This makes the parent-child relationship visible.

```html
<details class="study-disclosure">
  <summary>Examples in context</summary>
  <div class="study-disclosure-body">
    <article class="study-card">
      <strong lang="mt">tliet kotba</strong>
      <span>three books</span>
    </article>
    <details class="study-disclosure study-card">
      <summary>3 children: ___ itfal</summary>
      <p lang="mt">tlett / tlitt</p>
      <small>This noun takes the linking-i form.</small>
    </details>
  </div>
</details>
```

Add `open` only when the content should initially be visible. Native disclosure
behavior already supports keyboard activation; do not replace it with a clickable
`div`. Keep the summary meaningful and do not put another command inside it.
Use the `study-card` combination for compact questions instead of applying a
second framed wrapper around the same disclosure.

## Prompts, Results and Comparisons

```html
<p class="study-question">3 books: ___ kotba</p>
<p class="study-feedback" data-state="correct" role="status">Correct.</p>
<div class="study-contrast">
  <p>Alone: <mark lang="mt">tlieta</mark></p>
  <p>Before a noun: <mark lang="mt">tliet</mark> <span lang="mt">kotba</span></p>
  <p>Linking i: <mark lang="mt">tlett</mark> <span lang="mt">itfal</span></p>
</div>
```

`study-feedback[data-state="correct"]` has a shared success appearance. Other
states still require explicit, meaningful text; this class does not define a
complete grading state machine. Keep answers and comparisons hidden in test
mode until the controller permits disclosure.

`study-progress-status` emphasizes a short session status. `study-live-status`
is a sticky transient announcement surface that disappears when empty. Use it
sparingly, give it `role="status"`, and clear messages through the controller.
Do not announce the same result through several live regions at once.

## Tables

Use a semantic table for genuinely tabular comparisons. `table-soft` provides
the existing light table surface; it is not a substitute for table semantics.

```html
<table class="table-soft">
  <caption>Standalone and counted forms</caption>
  <thead>
    <tr><th scope="col">Alone</th><th scope="col">Before a noun</th></tr>
  </thead>
  <tbody>
    <tr><td lang="mt">tlieta</td><td lang="mt">tliet</td></tr>
  </tbody>
</table>
```

Give every table a caption and header scopes. Put row actions in a dedicated
column instead of letting buttons move horizontally with text length. Reuse
`table-scroll` when a wide table genuinely needs horizontal scrolling; its
existing contract uses a 720px minimum table width. Do not apply it automatically
to small tables that can fit on a phone.

## Printable Worksheets

```html
<section class="content-card print-sheet-section">
  <h2>Teacher Worksheet</h2>
  <div class="toolbar-row no-print">
    <button class="action-button" type="button">Print worksheet</button>
  </div>
  <div class="print-sheet">
    <h3>Numbers and Time</h3>
    <p>Name: ____________________</p>
    <pre>1. 23
____________________</pre>
  </div>
</section>
```

For worksheet-only printing, add `printing-sheet` to the body before calling
`window.print()` and remove it on `afterprint`. The section must be a direct child
of `.content` in the standard page shell. The print stylesheet hides the other
content sections, sidebar, hero and controls, and uses the shared print colors.
Without `printing-sheet`, the site's normal page-print behavior remains active.

`no-print` hides interactive controls in either print mode. Keep copy/export
serialization separate from HTML: preserve line breaks and respect the selected
answer and English-translation options. Hidden answers must not accidentally
appear in a worksheet that is configured without answers.

## Styling Ownership

| Concern | Owner |
| --- | --- |
| Theme values and semantic tokens | `assets/css/theme.css`, `assets/css/themes/` |
| Shared CSS import order | `assets/css/site.css` |
| Page shell and existing card/layout contracts | `assets/css/site/base.css`, `assets/css/site/layout.css` |
| Shared study components | `assets/css/site/components.css` |
| Review actions and their states | `assets/css/site/review.css`, `assets/css/site/review-inline.css` |
| Existing exercise-specific contracts | `assets/css/site/exercises.css` |
| Print behavior | `assets/css/site/print.css` |
| Topic-specific diagrams and layout | The owning page stylesheet, within documented exceptions |

Pages load `theme.css` and `site.css`, then the existing `pages.css` and any
necessary page-specific stylesheet. Do not import individual shared layers from
a page or introduce another stylesheet that redefines the same controls.

The principal study tokens are `--control-height`, `--control-token-height`,
`--control-radius`, `--control-padding`, `--control-gap`, `--control-check-size`,
`--control-disabled-opacity`, `--study-question-size` and
`--study-question-size-mobile`. They currently provide 44px controls and 48px
word tokens. Change the central token when changing the shared design; do not
redeclare it on one topic page.

Use existing spacing, surface, border and text tokens. Page CSS may arrange
columns, position review controls or size a number diagram. It must not recreate
the input, card, disclosure or button surface. Retained `numbers-*` classes may
be controller/test hooks; they are not an alternative visual component system.

Five older page stylesheets are temporarily exempt from part of the composition
guard. That is a migration backlog, not permission to copy their independent
control styles into new work.

## Extending the System

### Shared Bank Presentations

`renderExampleBanksFromData` owns repeated content markup and review buttons.
Use `groupViews` for an alternative presentation, not a page-local item renderer:

```javascript
await renderExampleBanksFromData({
  dataUrl: './assets/data/my_examples.json',
  groupAttribute: 'data-bank-view',
  reviewPrefix: 'my-existing-prefix',
  groupViews: {
    reference: {
      presentation: 'table',
      columns: [{ field: 'maltese', lang: 'mt' }, { field: 'english', lang: 'en' }]
    },
    corrections: { presentation: 'correction' },
    reading: { presentation: 'reading' },
    questions: { presentation: 'selfAssessment', state: { answers: {}, ratings: {} } }
  }
});
```

The target for `table` is a `tbody` inside a semantic table with a caption and
column headings; the renderer adds the review heading and aligned row actions.
Other targets are ordinary layout containers. `correction` uses `incorrect`
plus the typed correct example. `reading` renders Maltese first, then English.
`selfAssessment` requires typed question/answer items and starts with hidden
models and disabled rating commands. It never treats self-ratings as graded results.

All presentations filter quarantined items, normalize typed content, and share
review IDs and store synchronization with ordinary cards. `data-bank-primary`
identifies reading text; `data-bank-translation` identifies English text.
The controller may toggle translations or highlight domain-specific text without
rebuilding the card. Drafts and ratings emit bubbling `malti-bank-draft` and
`malti-bank-rating` events with `{ groupId, slug, value }`; controllers persist
those values and pass them back through `state` on the next render.
An optional `data` object avoids a second fetch when the controller already
loaded the same bank. Keep `dataUrl` as its provenance/configuration URL.

For a generated bank inside a disclosure, use an outer
`study-disclosure-body mt-16` and a separate inner bank target. The renderer
inserts its bulk-review toolbar immediately before that target, so both toolbar
and items stay inside the indentation and vertical guide. Do not put the bank
attribute on the disclosure-body wrapper itself.

1. Find the closest existing component and inspect the visual catalog.
2. Compose existing layouts and semantic components before writing new CSS.
3. If a genuinely reusable variant is missing, define it in the owning shared layer and add a catalog example, including relevant states.
4. Keep data, event handling and persistence in the existing controllers and stores.
5. Verify all three themes, keyboard use, desktop/mobile layouts and print behavior when applicable.
6. Review visual changes before updating the platform-specific baselines. Never promote an unexplained regression just to make a test pass.

## Verification

| Command | What it checks |
| --- | --- |
| `npm run docs:check` | Documentation structure and relative Markdown links. |
| `npm run style:lint` | Style rules, shared component ownership, theme-token ownership, HTML inline styles and negative regression cases. Requires a Playwright browser. |
| `npm run theme:a11y` | Theme-token contrast pairs. |
| `npm run a11y:check` | Rendered-page accessibility, including labels and table semantics. |
| `npm run visual:catalog` | Catalog screenshots against the current platform's baseline. |
| `npm run visual:groups` | Existing framed-group visual contracts. |
| `npm run numbers:style:check` | Catalog/page agreement, central token propagation, three themes, 320/390/1440px layouts, accessibility, printing and unchanged progress. |
| `npm run numbers:check` | Numbers content coverage, builders, review, copying and progress preservation. |
| `npm run numbers:sessions:check` | Session resume, scoring, hints and builder interactions. |
| `npm run numbers:tools:check` | Contextual practice, adaptive return, speaking isolation and worksheet behavior. |
| `npm run numbers:learning:check` | Targeted feedback, guided recall stages, compact views, contextual comparisons and mistake-linked speaking; starts its own server unless `NUMBERS_TEST_URL` is set. |

The three numbers behavior checks use a running local server at port 4190, or
`NUMBERS_TEST_URL`. The shared-style check starts its own temporary server.
The catalog has separate Windows and Linux baselines; generate screenshots on
the matching platform. The source of truth is the component implementation plus
its reviewed catalog examples, not an individual page's copied CSS.
