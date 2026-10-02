const functionalSuites = {
  "navigation-search": [
    "site search opens the matching page",
    "site search finds and reveals learning content",
    "site directory is generated from the shared map"
  ],
  course: [
    "course path saves objectives and quick-check progress",
    "milestone tests stay balanced across course chapters",
    "course runtime loads manifest and one chapter payload",
    "guided chapter route reports book, mapping, and assessment scope",
    "book context scopes a topic without changing its full view",
    "guided chapter scope is derived for every mapped page type",
    "linked chapter checks can advance a target to mastery",
    "course topic pages render data, exercises, and chapter context",
    "book verb paradigms render every audited form and save a drill",
    "book checkpoints render varied contextual assessment types"
  ],
  "review-games": [
    "Today builds a focused adaptive study queue",
    "wrong exercise answers flow into the mistake journal",
    "grammar path tracks recognition, production, and rule mistakes",
    "typed question-answer banks render and save the correct sides",
    "number and clock drills rotate and preserve progress",
    "reviewable bank items toggle individually without covering text",
    "shared vocabulary bookmarks toggle the review collection",
    "Year 4 vocabulary uses the shared review store",
    "word search creates a playable puzzle",
    "word search keeps mobile puzzle targets usable",
    "memory game creates a complete deck",
    "vocabulary games share usable mobile topic targets"
  ],
  "progress-storage": [
    "course progress summarizes target states and filters chapters",
    "knowledge map explains the next study action",
    "coverage tests rotate and track the complete learning bank",
    "progress backup restores cleared data",
    "Google sign-in sync uploads local progress by user id"
  ],
  "visual-contracts": [
    "lesson support surfaces keep consistent spacing and width",
    "floating review shortcut stays contextual and clear of mobile content",
    "section review controls stay compact on mobile",
    "shared mobile actions keep usable targets",
    "mobile toggles keep usable targets",
    "mobile form controls keep usable targets",
    "mobile ordering tokens keep usable targets",
    "mobile word builder tiles keep usable targets",
    "mobile navigation rows keep usable targets",
    "mobile sidebars keep usable navigation targets",
    "mobile data tables keep every column reachable",
    "vocabulary images load lazily without layout shifts",
    "home review toolbar keeps every action visible",
    "mobile verb banks stay readable and tappable",
    "Year 4 tabs keep usable mobile targets",
    "book verb levels use the shared mobile toggle",
    "course quick checks keep usable mobile targets",
    "generated banks keep the shared card styling",
    "verified example banks render without quarantined content",
    "framed content groups keep the shared visual contract",
    "theme choice survives a reload"
  ],
  "offline-pwa": [
    "offline application assets are registered",
    "large test bank is cached on first use",
    "visited course chapter remains available offline"
  ]
};

const suiteNames = Object.keys(functionalSuites);
const allFunctionalTestNames = suiteNames.flatMap((suiteName) => functionalSuites[suiteName]);
const duplicateTestNames = allFunctionalTestNames.filter(
  (testName, index) => allFunctionalTestNames.indexOf(testName) !== index
);

if (duplicateTestNames.length) {
  throw new Error(`Functional tests assigned to multiple suites: ${[...new Set(duplicateTestNames)].join(", ")}`);
}

module.exports = {
  allFunctionalTestNames,
  functionalSuites,
  suiteNames
};
