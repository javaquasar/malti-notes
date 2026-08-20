const CACHE_PREFIX = "malti-notes-";
const CACHE_NAME = `${CACHE_PREFIX}edf63fd143e7`;
const CORE_ASSETS = [
    "./",
    "./all_pages.html",
    "./animals.html",
    "./body_appearance.html",
    "./collective_nouns.html",
    "./colors_maltese.html",
    "./common_mistakes.html",
    "./comparisons.html",
    "./course_chapter.html",
    "./course_exam.html",
    "./course_path.html",
    "./course_progress.html",
    "./coverage_test.html",
    "./daily_problems.html",
    "./daily_routine.html",
    "./directions_town.html",
    "./emotions.html",
    "./environment_recycling.html",
    "./family_home_food.html",
    "./food_preferences.html",
    "./grammar_path.html",
    "./health_doctor.html",
    "./hobbies_future.html",
    "./home_furniture.html",
    "./impactful_people.html",
    "./imperative_verbs.html",
    "./index.html",
    "./introductions_alphabet.html",
    "./memory_game.html",
    "./mistakes.html",
    "./modals_needs.html",
    "./numbers_calendar_time.html",
    "./picture_description.html",
    "./places_events.html",
    "./prepositions_place.html",
    "./pronouns_possessives.html",
    "./restaurant_ordering.html",
    "./review_cards.html",
    "./school_classroom.html",
    "./sentence_builder.html",
    "./shopping_clothes.html",
    "./today.html",
    "./transport_travel.html",
    "./verbs_guide.html",
    "./weather.html",
    "./word_builder_game.html",
    "./word_search.html",
    "./year4_exam.html",
    "./manifest.webmanifest",
    "./assets/css/pages.css",
    "./assets/css/site.css",
    "./assets/css/site/base.css",
    "./assets/css/site/components.css",
    "./assets/css/site/exercises.css",
    "./assets/css/site/games.css",
    "./assets/css/site/imperative.css",
    "./assets/css/site/layout.css",
    "./assets/css/site/learning.css",
    "./assets/css/site/navigation.css",
    "./assets/css/site/print.css",
    "./assets/css/site/responsive.css",
    "./assets/css/site/review.css",
    "./assets/css/site/verbs.css",
    "./assets/css/theme.css",
    "./assets/css/themes/classic.css",
    "./assets/css/themes/contrast.css",
    "./assets/css/themes/forest.css",
    "./assets/css/topic-picker.css",
    "./assets/css/vocabulary-games.css",
    "./assets/css/word-search.css",
    "./assets/js/animal-compact-toggle.js",
    "./assets/js/course-chapter.js",
    "./assets/js/course-context.js",
    "./assets/js/course-exam.js",
    "./assets/js/course-path.js",
    "./assets/js/course-progress.js",
    "./assets/js/course-topic-view.js",
    "./assets/js/coverage-test.js",
    "./assets/js/exercise-runner.js",
    "./assets/js/game-audio.js",
    "./assets/js/grammar-path.js",
    "./assets/js/home-compact-toggle.js",
    "./assets/js/init-verbs-course-bank.js",
    "./assets/js/mistake-store.js",
    "./assets/js/mistakes.js",
    "./assets/js/progress-backup.js",
    "./assets/js/render-course-verb-paradigms.js",
    "./assets/js/render-example-banks.js",
    "./assets/js/render-imperative-verbs-page.js",
    "./assets/js/render-verbs-course-bank.js",
    "./assets/js/render-vocab-cards.js",
    "./assets/js/render-vocab-table.js",
    "./assets/js/review-cards.js",
    "./assets/js/review-store.js",
    "./assets/js/seen-words.js",
    "./assets/js/site-header.js",
    "./assets/js/site-map-pages.js",
    "./assets/js/storage.js",
    "./assets/js/today.js",
    "./assets/js/topic-picker.js",
    "./assets/js/transport-compact-toggle.js",
    "./assets/js/verb-lookup-loader.js",
    "./assets/js/verb-trigger.js",
    "./assets/js/verbs-review.js",
    "./assets/js/vocab-review-page.js",
    "./assets/js/vocab-view-toggle.js",
    "./assets/js/vocabulary-games.js",
    "./assets/js/word-search-bank.js",
    "./assets/js/word-search-game.js",
    "./assets/js/year4-exam.js",
    "./assets/js/year4-revision-topic.js",
    "./assets/data/site-map.json",
    "./assets/data/search-index.json",
    "./assets/data/course_path.json",
    "./assets/data/course_exercises.json",
    "./assets/data/course_milestone_assessments.json",
    "./assets/data/course/manifest.json",
    "./assets/data/course_verb_paradigms.json",
    "./assets/data/comprehensive_test_bank.json",
    "./assets/data/grammar_targets.json",
    "./assets/img/favicon-option-speech.svg"
  ];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

async function cacheResponse(request, response) {
  if (response && response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

async function navigationResponse(request) {
  try {
    return await cacheResponse(request, await fetch(request));
  } catch (error) {
    return (await caches.match(request)) || (await caches.match(new URL("index.html", self.registration.scope).href));
  }
}

async function assetResponse(request) {
  const cached = await caches.match(request);
  const network = fetch(request).then((response) => cacheResponse(request, response)).catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith(request.mode === "navigate" ? navigationResponse(request) : assetResponse(request));
});
