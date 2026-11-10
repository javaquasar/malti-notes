# Unified B1, B2 and B3 practice

The study entry is designed for a nine-year-old working independently, with a
parent helping when needed. It uses the site's existing English UI and Maltese
learning material. B1, B2 and B3 remain local names for the material routes.

## Entry and presentation

`today.html` is the common My practice entry. Home, the B1/B2 path and B3 revision
link to the same flow. Existing detailed material, IDs and URLs remain available.
The first screen shows a level, current topic and one primary Start/Continue
action. Full directories and technical progress are disclosed on demand.

`study-entry.js` closes the initially inherited navigation dropdown once, so it
does not cover the entry action. Normal navigation and keyboard controls remain
available. The pages compose existing static components, native disclosure and
the shared exercise renderer. No CSS, control skin, DOM factory, UI-policy
exception or visual baseline is introduced or changed.

## Short sessions

- Course sessions select six existing focused checkpoint items from the chosen
  chapter, balancing recognition and production. The original target/item IDs,
  explanations and examples are retained; aggregate matching and full diagnostic
  tests remain in the detailed route.
- B3 delegates selection and spaced results to the existing B3 core. The chosen
  topic stays scoped; due work and help requests influence the next selection.
- The shared exercise runner displays one item at a time. A blank submission
  stays on the question. Checked feedback, retry, hints, examples and explicit
  deferral to a parent have distinct states.
- Step set IDs are stable and separate from original checkpoint IDs. Finishing
  six items never marks an entire checkpoint or chapter passed.
- Step items do not contain reviewCard payloads, preventing per-session copies
  of the same Review card. Existing word review stays in the shared Review store.

## Learn first and apply the rule

The first visit to a topic offers a short goal, useful language from the lesson
and a worked example. The Colours pilot compares masculine and feminine forms
using clothes, with a separate example showing why the feminine form fits.
On return, the learner can resume or start practice with the warm-up collapsed.

During a question, Hint gives a clue first. When a separate example is available,
the learner can open it next, then explicitly show the answer. The Colours pilot
uses a different colour in that example. After checking, a short oral exercise
uses the same colour with another noun and a separate model for comparison.
The oral exercise is self-checked. The six-question results retain the original
target and separate independent answers from answers with help.

In B3 Calendar, the home and finish cards link to the existing timetable and a
new plan-making task. The learner uses the timetable to choose a time, then
makes a two-sentence plan with a saved self-check. A separate reader prompt
lets someone read the original timetable passage aloud.

## Progress and help

Independent course attempts update their original target progress through the
shared runner. Independent B3 attempts update the existing B3 pattern core.
Hints and retries use a separate assisted step identity and no target credit.
Feedback already reveals an answer, so a retry is assisted. Session completion,
independent answers, helped answers and parent deferrals remain separate from
long-term mastery.

The parent can choose a topic, browse paged help requests and mark a request as
discussed. Requests are scoped by route, chapter, skill and assessment mode;
resuming an older parked session cannot resurrect a resolved request. Detailed
legacy review tools remain available inside the parent disclosure.

## Persistence and compatibility

The feature uses the existing backup-enabled `malti_topic_practice_v1` object,
under `studySession`. It adds no storage key. Other topic state, old B3 drafts,
review schedules, manual objectives and original checkpoint records are retained.

Sessions are parked per chapter. Switching level/topic or selecting a parent
assignment keeps earlier drafts. The most recently selected level/topic is
restored when no explicit URL selection is supplied. Each resumed item is
rehydrated from current authoritative data. If a question's answer key changes,
an earlier checked result stays in the session history. An older draft for
that question is kept in the backup and the learner answers the revised question
separately. Invalid older sessions are archived when a fresh session starts.

Input/change/composition, token clicks, pause and page exit preserve drafts.
Restored checked feedback is displayed without replaying submission or adding
attempts. Submission and completion guards prevent duplicate recording.

Course chapter payloads are fetched lazily through the existing runtime manifest
and become available offline after use. Offline navigation first checks the exact
address, then its query-free static HTML page, so level/topic links restore the
correct page before reading the selected route from the URL. The existing offline worker precaches
the shared UI and B3 banks. An unavailable offline topic leaves saved work intact
and gives a connection message. The withdrawn Tonina audio remains absent and
its retired URLs remain blocked.

## Verification

```sh
npm run study:core:check
npm run study:check
npm run materials:check
node scripts/functional_check.js --suite review-games
```

Core checks cover all fourteen real course chapters, real B3 scheduling,
authoritative resume, prototype safety, duplicate completion, assistance and
immutable state. Browser checks cover actual six-question flows, immediate
draft persistence, level parking, parent help/assignment, protected progress,
keyboard use, offline work and three themes at mobile/desktop widths.

The existing legacy Today functional test opens its new parent disclosures
before exercising the same duration, due counts and Review-link assertions.
CI runs the new study suite in addition to the existing checks. Test evidence
and reviewed screenshots are saved separately; no visual baseline is promoted.
