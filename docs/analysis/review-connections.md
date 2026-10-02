# Review Connection Inventory

This inventory records page-level integration status. Future priorities belong in the single [project roadmap](../roadmap.md).

## Shared Review Status

Most study pages are now connected either to:

- the shared vocabulary review flow
- the shared sentence review flow
- or a dedicated custom drill path

The remaining work is now mostly polish, consistency, and explicit documentation of the pages that should stay on custom logic.

## Connected Through Shared Vocabulary Review

- `animals.html`
- `body_appearance.html`
- `colors_maltese.html`
- `collective_nouns.html`
- `daily_routine.html`
- `directions_town.html`
- `emotions.html`
- `family_home_food.html`
- `food_preferences.html`
- `health_doctor.html`
- `home_furniture.html`
- `places_events.html`
- `restaurant_ordering.html`
- `shopping_clothes.html`
- `transport_travel.html`
- `weather.html`

## Connected Through Shared Vocabulary + Sentence Review

- `comparisons.html`
- `modals_needs.html`
- `prepositions_place.html`
- `pronouns_possessives.html`

## Connected Primarily Through Shared Sentence Review

- `common_mistakes.html`
- `impactful_people.html`
- `picture_description.html`
- `sentence_builder.html`

## Connected, But On A Special Drill Path

- `imperative_verbs.html`
- `verbs_guide.html`

These pages already use more specific verb-review or drill behaviour and should not be flattened into plain shared vocab review.

## Partially Connected / Better Left As Structured Practice

- `numbers_calendar_time.html`

This page already supports shared review for the vocabulary-friendly groups, but some parts are still better treated as:

- table/reference content
- number drills
- time drills

## No Longer In The “Not Yet Connected” Bucket

These pages were on the older backlog, but are now connected:

- `common_mistakes.html`
- `comparisons.html`
- `daily_problems.html`
- `daily_routine.html`
- `family_home_food.html`
- `impactful_people.html`
- `modals_needs.html`
- `picture_description.html`
- `places_events.html`
- `prepositions_place.html`
- `pronouns_possessives.html`
- `restaurant_ordering.html`
- `sentence_builder.html`

## Best Next Cleanup Tasks

Now that most of the connection work is done, the highest-value next tasks are:

1. Revisit `numbers_calendar_time.html` only if we want dedicated drill modes.
2. Leave `verbs_guide.html` and `imperative_verbs.html` on their special review paths unless we deliberately redesign verb practice.

The legacy UTF-8 cleanup is complete. `npm run encoding:check` now protects public
HTML, JSON, CSS, and JavaScript in GitHub Actions while ignoring dependencies and
the two intentional runtime repair tables.

Example-bank consistency is also enforced by `npm run content:model:check`.
Every data file must match its owning page and rendered group targets, while two
different cards may not resolve to the same Review identity. Intentional repeated
prompts with different answers use explicit stable slugs.

## Working Rule Going Forward

When adding a new study page:

- use shared vocabulary review if the content is list-like and reusable
- use shared sentence review if the value is in phrase or sentence production
- keep a page on a custom drill path if shared cards would reduce the quality of the exercise
