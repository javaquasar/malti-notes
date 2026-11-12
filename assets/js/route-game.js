(() => {
  'use strict';

  const root = document.querySelector('[data-route-game]');
  if (!root) return;
  const core = window.MaltiRouteGame;
  const find = selector => root.querySelector(selector);
  const all = selector => [...root.querySelectorAll(selector)];
  const say = (selector, value) => { find(selector).textContent = value; };

  const svg = find('[data-route-map]');
  const labelSlots = all('[data-route-label-slot]');
  const [normalLabel, terminalLabel] = find('[data-route-label-templates]').children;
  const coordinates = labelSlots.map(slot => {
    const { e: x, f: y } = slot.parentElement.transform.baseVal.getItem(0).matrix;
    return { x, y };
  });
  const icons = all('[data-route-icon]');
  const targets = all('[data-route-node]');
  const rings = all('[data-route-ring]');
  const roads = all('[data-route-road]');
  const scenery = find('[data-route-scenery]');
  const transitLines = all('[data-route-transit-line]');
  const transitTags = all('[data-route-transit-tag]');
  const transitPanel = find('[data-route-transit]');
  const departureList = find('[data-route-departures]');
  const boarding = find('[data-route-boarding]');
  const previewLines = [find('[data-route-preview-edge]'), find('[data-route-preview-line]')];
  const previewStop = find('[data-route-preview-stop]');
  const motionPath = find('[data-route-motion-path]');
  const vehicle = find('[data-route-vehicle]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const vocabulary = find('[data-route-vocabulary]');
  const vocabularyToggle = find('[data-route-vocabulary-toggle]');
  const landmarkSelect = find('[data-route-landmark-select]');
  const landmarkMarker = find('[data-route-landmark-marker]');
  const bottomMargin = svg.viewBox.baseVal.height - coordinates[core.neighbourhoods[0].places.length - 1].y;
  const compact = window.matchMedia('(max-width: 980px)');
  const directions = find('[data-route-directions]');
  const inline = find('[data-route-inline]');
  const side = find('[data-route-side]');
  const model = find('[data-route-model]');
  const settings = find('[data-route-settings]');
  const settingsToggle = settings.querySelector('summary');
  const form = find('[data-route-form]');
  const draft = find('[data-route-description]');
  const mapSelect = find('[data-route-map-select]');
  const conditionList = find('[data-route-conditions]');
  const phraseList = find('[data-route-phrases]');
  const phraseHits = find('[data-route-phrase-hits]');
  const hitShape = find('[data-route-hit-shape]');
  const selection = find('[data-route-selection]');
  const modeButtons = all('[data-route-mode]');
  const trailLines = [find('[data-route-trail-edge]'), find('[data-route-trail]')];
  const segmentLines = [find('[data-route-segment-edge]'), find('[data-route-segment]')];
  const startMarker = find('[data-route-start-marker]');
  const goalMarker = find('[data-route-goal-marker]');
  const walker = find('[data-route-walker]');
  const problem = find('[data-route-problem]');
  const modeTitles = { read: 'Read & follow', write: 'Give directions', live: 'Live directions' };
  const conditionStates = { done: '✓ Done', missed: '! Review', pending: 'To do' };

  let map = core.neighbourhoods[0];
  let round, trail, result, activePhrase = -1, phrases = [], mode = 'read', english = false;
  let previewedRide = null;
  let rideFrame = 0;

  const current = () => trail.at(-1);
  const reachedGoal = () => current().at === round.goal;
  const hasMission = () => Boolean(round.ordinal || round.ride);
  const place = index => core.place(map, index);
  const face = heading => core.headings[heading].name;

  function drawLine(lines, points) {
    for (const line of lines) {
      line.points.clear();
      for (const point of points) {
        const vertex = svg.createSVGPoint();
        Object.assign(vertex, point);
        line.points.appendItem(vertex);
      }
    }
  }

  function trailGeometry(steps) {
    return steps.flatMap((step, index) => index > 0 && step.ride
      ? [...step.ride.via, coordinates[step.at]] : [coordinates[step.at]]);
  }

  function rideGeometry(ride) {
    return [coordinates[ride.from], ...ride.via, coordinates[ride.to]];
  }

  function placeMarker(marker, index) {
    const { x, y } = coordinates[index];
    marker.transform.baseVal.getItem(0).setTranslate(x, y);
  }

  function mountDirections() {
    const useInline = compact.matches && mode !== 'write';
    const host = useInline ? inline : side;
    if (directions.parentElement !== host) host.append(directions);
    inline.hidden = !useInline;
    side.hidden = useInline;
  }

  function renderRows(container, template, entries, fill) {
    container.replaceChildren(...entries.map((entry, index) => {
      const fragment = template.content.cloneNode(true);
      fill(fragment, entry, index);
      return fragment;
    }));
  }

  function renderTextMap(active) {
    renderRows(find('[data-route-text-map]'), find('[data-route-text-template]'), active, (fragment, index) => {
      const [name, englishName] = place(index);
      const ways = core.headings.flatMap((direction, heading) => {
        const next = core.neighbour(map, index, heading);
        if (next !== -1) return [direction.name + ' to ' + place(next)[1]];
        const possible = core.gridNeighbour(map, index, heading);
        return possible !== -1 && core.roadState(map, core.edgeKey(index, possible)) === 'closed'
          ? [direction.name + ' closed'] : [];
      });
      ways.push(...core.departures(map, index).map(service => core.serviceName(map, service) + ' to ' + place(service.to)[1]));
      fragmentText(fragment, '[data-route-text-place]', name);
      fragmentText(fragment, '[data-route-text-ways]', ' (' + englishName + ') · ' + ways.join(', '));
    });
  }

  function fragmentText(fragment, selector, value) {
    fragment.querySelector(selector).textContent = value;
  }

  function paintTransitLines() {
    transitLines.forEach((line, index) => {
      const service = map.services?.[index], tag = transitTags[index];
      drawLine([line], service ? rideGeometry(service) : []);
      tag.dataset.routeEmpty = String(!service);
      if (service) {
        const { x, y } = service.label;
        tag.transform.baseVal.getItem(0).setTranslate(x, y);
        fragmentText(tag, 'text', service.number);
      }
    });
  }

  function resizeMapLabels() {
    const width = svg.getBoundingClientRect().width;
    if (!width) return;
    const unitsPerPixel = svg.viewBox.baseVal.width / width;
    const scale = Math.max(11 * unitsPerPixel, Math.min(15, 20 * unitsPerPixel)) / 15;
    const maxLength = 94 / scale;
    const labels = labelSlots.flatMap(slot => {
      if (!slot.firstElementChild) return [];
      slot.transform.baseVal.getItem(1).setScale(scale, scale);
      return [slot.firstElementChild];
    });
    labels.forEach(label => label.removeAttribute('textLength'));
    const lengths = labels.map(label => label.getComputedTextLength());
    lengths.forEach((length, index) => {
      if (length > maxLength) labels[index].textLength.baseVal.value = maxLength;
    });
  }

  function paintMap() {
    say('[data-route-map-name]', map.name);
    say('[data-route-map-level]', map.difficulty);
    say('#route-svg-title', map.name + ' street map');
    const height = coordinates[map.places.length - 1].y + bottomMargin;
    svg.viewBox.baseVal.height = height;
    scenery.height.baseVal.value = height;
    scenery.href.baseVal = '#route-scenery-' + map.id;
    find('[data-route-clip]').height.baseVal.value = height;
    find('[data-route-frame]').height.baseVal.value = height - 2;
    find('[data-route-transit-help]').hidden = !map.transit;
    mapSelect.value = map.id;
    const terminals = new Set((map.services || []).flatMap(service => [service.from, service.to]));
    labelSlots.forEach((slot, index) => {
      const landmark = place(index);
      const empty = String(!landmark);
      slot.parentElement.dataset.routeEmpty = empty;
      targets[index].dataset.routeEmpty = empty;
      if (!landmark) {
        slot.replaceChildren();
        return;
      }
      const label = (terminals.has(index) ? terminalLabel : normalLabel).cloneNode();
      label.dataset.routeLandmark = String(index);
      label.textContent = landmark[0];
      slot.replaceChildren(label);
      icons[index].href.baseVal = '#route-icon-' + (landmark[2] || map.places[index]);
    });
    resizeMapLabels();
    roads.forEach(road => { road.dataset.edgeState = core.roadState(map, road.dataset.routeRoad); });
    paintTransitLines();
    const active = map.places.flatMap((landmark, index) => landmark ? [index] : []);
    renderTextMap(active);
    renderRows(landmarkSelect, find('[data-route-landmark-option-template]'), active, (fragment, index) => {
      const option = fragment.querySelector('option');
      option.value = String(index);
      option.textContent = place(index)[0];
    });
  }

  function showLandmark(index) {
    const [name, englishName] = place(index);
    const example = core.passInstruction(map, index);
    landmarkSelect.value = String(index);
    say('[data-route-landmark-name]', name);
    say('[data-route-landmark-en]', englishName);
    say('[data-route-landmark-example]', example.mt);
    say('[data-route-landmark-example-en]', example.en);
    placeMarker(landmarkMarker, index);
  }

  function setVocabulary(open) {
    vocabulary.hidden = !open;
    vocabularyToggle.ariaPressed = String(open);
    landmarkMarker.dataset.routeEmpty = String(!open);
    phraseHits.dataset.routeEmpty = String(open);
    if (open) {
      selectPhrase(-1);
      showLandmark(current().at);
    }
  }

  function updatePosition(message = '') {
    const { at, heading } = current(), rides = trail.filter(step => step.ride).length;
    const count = trail.length - 1 - rides;
    const position = place(at)[0] + ' · Facing ' + face(heading) + ' · ' + count + (count === 1 ? ' block' : ' blocks');
    const travelCount = rides ? position + ' · ' + rides + (rides === 1 ? ' ride' : ' rides') : position;
    say('[data-route-position]', message ? message + ' ' + travelCount : travelCount);
  }

  function showPreview(ride) {
    previewedRide = ride;
    boarding.hidden = !ride;
    for (const choice of departureList.querySelectorAll('[data-route-service]')) {
      choice.ariaPressed = String(choice.dataset.routeService === ride?.number);
    }
    drawLine(previewLines, ride ? rideGeometry(ride) : []);
    previewStop.dataset.routeEmpty = String(!ride);
    if (ride) placeMarker(previewStop, ride.to);
    say('[data-route-preview-summary]', ride ? 'Get off at ' + place(ride.to)[1] + '.' : '');
  }

  function renderDepartures() {
    const available = reachedGoal() ? [] : core.departures(map, current().at);
    transitPanel.hidden = !available.length;
    if (available.length) say('#route-transit-heading', map.transit.plural + ' from ' + place(current().at)[1]);
    renderRows(departureList, find('[data-route-service-template]'), available, (fragment, service) => {
      const choice = fragment.querySelector('[data-route-service]');
      choice.dataset.routeService = service.number;
      choice.textContent = core.serviceName(map, service) + ' · ' + service.destination;
    });
    showPreview(null);
  }

  function stopRideAnimation() {
    if (!rideFrame) return;
    cancelAnimationFrame(rideFrame);
    rideFrame = 0;
    vehicle.dataset.routeEmpty = 'true';
    walker.dataset.routeEmpty = 'false';
  }

  function animateRide(ride) {
    if (reducedMotion.matches) return;
    drawLine([motionPath], rideGeometry(ride));
    const length = motionPath.getTotalLength();
    const duration = 720;
    const started = performance.now();
    const transform = vehicle.transform.baseVal.getItem(0);
    placeMarker(vehicle, ride.from);
    vehicle.querySelector('use').href.baseVal = '#route-icon-' + place(ride.from)[2];
    walker.dataset.routeEmpty = 'true';
    vehicle.dataset.routeEmpty = 'false';

    function advance(now) {
      const elapsed = Math.max(0, now - started);
      if (elapsed >= duration) {
        stopRideAnimation();
        return;
      }
      const { x, y } = motionPath.getPointAtLength(length * elapsed / duration);
      transform.setTranslate(x, y);
      rideFrame = requestAnimationFrame(advance);
    }
    rideFrame = requestAnimationFrame(advance);
  }

  function paintTrail() {
    drawLine(trailLines, trailGeometry(trail));
    placeMarker(walker, current().at);
    walker.transform.baseVal.getItem(1).setRotate(current().heading * 90, 0, 0);
    const available = reachedGoal() ? [] : core.headings.map((_, heading) => core.neighbour(map, current().at, heading));
    rings.forEach((ring, index) => {
      ring.r.baseVal.value = available.includes(index) && index !== round.start && index !== round.goal ? 10 : 0;
    });
    find('[data-route-start-ring]').r.baseVal.value = available.includes(round.start) ? 17 : 0;
    find('[data-route-goal-ring]').r.baseVal.value = available.includes(round.goal) ? 17 : 0;
    find('[data-route-undo]').disabled = trail.length < 2;
    problem.querySelector('circle').r.baseVal.value = result?.at == null ? 0 : 19;
    if (result?.at != null) placeMarker(problem, result.at);
    renderDepartures();
  }

  function selectPhrase(index) {
    activePhrase = index;
    [...phraseList.querySelectorAll('[data-route-phrase]')].forEach((button, position) => {
      button.ariaPressed = String(position === index);
    });
    const phrase = phrases[index];
    drawLine(segmentLines, phrase ? trailGeometry(trail.slice(phrase.from, phrase.to + 1)) : []);
    selection.hidden = !phrase || mode !== 'live';
    say('[data-route-selection-mt]', phrase?.mt || '');
    say('[data-route-selection-en]', phrase?.en || '');
    if (phrase) {
      const from = place(trail[phrase.from].at)[1], to = place(trail[phrase.to].at)[1];
      say('[data-route-highlight-status]', 'Highlighted from ' + from + ' to ' + to + '.');
    } else {
      say('[data-route-highlight-status]', '');
    }
  }

  function insetPoint(from, to) {
    const dx = to.x - from.x, dy = to.y - from.y;
    // Keep the junctions free for movement, even when a travelled street can be selected.
    const fraction = Math.min(0.45, 24 / Math.hypot(dx, dy));
    return { x: from.x + dx * fraction, y: from.y + dy * fraction };
  }

  function renderPhraseHits() {
    const hits = [];
    if (mode === 'live') {
      phrases.forEach((phrase, index) => {
        if (phrase.tapFrom == null) return;
        for (let from = phrase.tapFrom; from < phrase.to; from++) {
          const points = trailGeometry(trail.slice(from, from + 2));
          const last = points.length - 1;
          points[0] = insetPoint(points[0], points[1]);
          points[last] = insetPoint(points[last], points[last - 1]);
          const hit = hitShape.cloneNode();
          hit.removeAttribute('data-route-hit-shape');
          hit.dataset.routePhraseHit = String(index);
          drawLine([hit], points);
          hits.push(hit);
        }
      });
    }
    phraseHits.replaceChildren(...hits);
  }

  function renderPhrases() {
    const show = trail.length > 1 && (mode === 'live' || result?.passed);
    model.hidden = !show;
    if (!show) {
      phrases = [];
      phraseList.replaceChildren();
      phraseHits.replaceChildren();
      selectPhrase(-1);
      return;
    }
    say('#route-model-title', reachedGoal() ? 'Directions to the goal' : 'Directions so far');
    say('[data-route-highlight-help]', mode === 'live' ? 'Tap a travelled segment or select a sentence to highlight it.'
      : 'Select a sentence to highlight its segment.');
    phrases = core.routePhrases(map, trail, round);
    renderRows(phraseList, find('[data-route-phrase-template]'), phrases, (fragment, phrase, index) => {
      fragment.querySelector('[data-route-phrase]').dataset.routePhrase = String(index);
      fragmentText(fragment, '[data-route-phrase-mt]', phrase.mt);
      fragmentText(fragment, '[data-route-phrase-en]', phrase.en);
    });
    renderPhraseHits();
    selectPhrase(-1);
  }

  function renderChallenge(steps, progress) {
    const reading = mode === 'read';
    const translation = !reading || english;
    const firstUnfinished = progress.findIndex(step => step.state !== 'done');
    const brief = find('[data-route-brief]');
    brief.hidden = !hasMission();
    if (hasMission()) {
      brief.textContent = firstUnfinished === -1
        ? 'Mur ħdejn ' + place(round.goal)[0].toLocaleLowerCase('mt') + '.'
        : steps[firstUnfinished].mt;
    }
    find('[data-route-challenge]').hidden = !hasMission();
    find('[data-route-free-challenge]').hidden = hasMission();
    const hint = find('[data-route-hint]');
    hint.hidden = !reading;
    hint.ariaPressed = String(english);
    hint.textContent = english ? 'Hide English' : 'Show English';
    find('[data-route-check]').hidden = !reading;
    renderRows(conditionList, find('[data-route-condition-template]'), steps, (fragment, step, index) => {
      fragmentText(fragment, '[data-condition-mt]', step.mt);
      const translated = fragment.querySelector('[data-condition-en]');
      translated.textContent = step.en;
      translated.hidden = !translation;
      const state = progress[index].state;
      fragmentText(fragment, '[data-condition-state]', conditionStates[state]);
    });
  }

  function renderFeedback(progress) {
    let message = result?.message || '';
    if (!message && mode !== 'read') {
      message = progress.find(step => step.state === 'missed')?.message || '';
      if (!message && reachedGoal()) {
        message = mode === 'write' ? 'You reached the goal. Write your directions and check the route.'
          : hasMission() ? 'Challenge complete. You reached the goal.' : 'You reached the goal.';
      }
    }
    say('[data-route-feedback]', message);
  }

  function renderDirections() {
    const writing = mode === 'write';
    form.hidden = !writing;
    find('#route-write-help').hidden = !writing;
    find('[data-route-live-empty]').hidden = mode !== 'live' || trail.length > 1;
    say('#route-write-heading', modeTitles[mode]);
    const progress = hasMission() ? core.evaluateMission(map, round, trail) : [];
    const steps = hasMission() ? core.instructions(map, round) : [];
    renderChallenge(steps, progress);
    renderPhrases();
    renderFeedback(progress);
  }

  function changeMode(next) {
    mode = next;
    modeButtons.forEach(button => { button.ariaPressed = String(button.dataset.routeMode === mode); });
    mountDirections();
  }

  function newRound(withMission) {
    stopRideAnimation();
    const pool = withMission ? core.missionRounds(map) : core.freeRounds(map);
    const alternatives = pool.filter(candidate => candidate.id !== round?.id);
    round = alternatives[Math.floor(Math.random() * alternatives.length)];
    trail = [{ at: round.start, heading: round.heading }];
    draft.value = '';
    result = null;
    english = false;
    say('[data-route-start-name]', place(round.start)[0]);
    say('[data-route-goal-name]', place(round.goal)[0]);
    say('[data-route-start-heading]', 'Start facing ' + face(round.heading));
    placeMarker(startMarker, round.start);
    placeMarker(goalMarker, round.goal);
    if (!vocabulary.hidden) showLandmark(round.start);
    paintTrail();
    updatePosition();
    renderDirections();
  }

  function refreshMove(message) {
    stopRideAnimation();
    result = null;
    paintTrail();
    updatePosition(message);
    renderDirections();
  }

  function travel(heading, missing = 'There is no road that way.') {
    if (reachedGoal()) return;
    const from = current().at;
    const next = heading === -1 ? -1 : core.neighbour(map, from, heading);
    if (next === -1) {
      const candidate = heading === -1 ? -1 : core.gridNeighbour(map, from, heading);
      const blocked = candidate !== -1 && core.roadState(map, core.edgeKey(from, candidate)) === 'closed';
      updatePosition(blocked ? 'That road is closed. Choose a ringed intersection.' : missing);
      return;
    }
    trail.push({ at: next, heading });
    refreshMove();
  }

  function board() {
    const ride = previewedRide;
    if (!ride) return;
    trail.push({ at: ride.to, heading: ride.heading, ride });
    refreshMove(core.serviceName(map, ride) + ' arrived at ' + place(ride.to)[1] + '.');
    animateRide(ride);
    find('[data-route-move="0"]').focus({ preventScroll: true });
  }

  function checkRoute() {
    if (mode === 'read') english = true;
    const progress = hasMission() ? core.evaluateMission(map, round, trail) : [];
    const unmet = progress.find(step => step.state !== 'done');
    if (unmet) {
      result = { passed: false, message: unmet.message, at: unmet.at };
    } else if (!reachedGoal()) {
      result = { passed: false, message: 'Keep going to ' + place(round.goal)[1] + '.' };
    } else if (mode === 'write' && !draft.value.trim()) {
      result = { passed: false, message: 'Write your directions in Maltese, then check the route.' };
      draft.focus();
    } else {
      result = {
        passed: true,
        message: hasMission() ? 'Challenge complete. You followed all three instructions and reached the goal.'
          : 'Your route reaches the goal. Compare your sentences with the model.'
      };
    }
    paintTrail();
    renderDirections();
    if (result.passed && mode === 'write') find('#route-model-title').focus();
  }

  all('[data-route-move]').forEach(button => button.addEventListener('click', () => {
    travel(core.rotate(current().heading, Number(button.dataset.routeMove)));
  }));
  svg.addEventListener('click', event => {
    const segment = event.target.closest('[data-route-phrase-hit]');
    if (segment) {
      const index = Number(segment.dataset.routePhraseHit);
      selectPhrase(index === activePhrase ? -1 : index);
      if (index === activePhrase && compact.matches) selection.scrollIntoView({ block: 'nearest' });
      return;
    }
    const target = event.target.closest('[data-route-node]');
    if (!target) return;
    const next = Number(target.dataset.routeNode);
    if (!vocabulary.hidden) {
      showLandmark(next);
      if (compact.matches) vocabulary.scrollIntoView({ block: 'nearest' });
      return;
    }
    const heading = core.headings.findIndex((_, direction) => core.gridNeighbour(map, current().at, direction) === next);
    travel(heading, 'Choose an intersection one block away.');
  });
  departureList.addEventListener('click', event => {
    const choice = event.target.closest('[data-route-service]');
    if (!choice) return;
    const ride = core.departures(map, current().at).find(service => service.number === choice.dataset.routeService);
    if (ride) showPreview(previewedRide?.number === ride.number ? null : ride);
  });
  find('[data-route-board]').addEventListener('click', board);
  vocabularyToggle.addEventListener('click', () => setVocabulary(vocabulary.hidden));
  landmarkSelect.addEventListener('change', () => showLandmark(Number(landmarkSelect.value)));
  phraseList.addEventListener('click', event => {
    const button = event.target.closest('[data-route-phrase]');
    if (!button) return;
    const index = Number(button.dataset.routePhrase);
    selectPhrase(index === activePhrase ? -1 : index);
    if (activePhrase !== -1 && event.detail > 0 && compact.matches && svg.getBoundingClientRect().bottom < 0) {
      svg.scrollIntoView({ block: 'nearest' });
    }
  });
  find('[data-route-undo]').addEventListener('click', () => {
    if (trail.length < 2) return;
    trail.pop();
    refreshMove();
  });
  find('[data-route-new]').addEventListener('click', () => {
    if (mode === 'read') changeMode('write');
    newRound(false);
    settings.open = false;
    settingsToggle.focus();
  });
  document.addEventListener('click', event => {
    if (settings.open && !settings.contains(event.target)) settings.open = false;
  });
  document.addEventListener('keydown', event => {
    if (!settings.open || event.key !== 'Escape' || event.defaultPrevented) return;
    event.preventDefault();
    settings.open = false;
    settingsToggle.focus();
  });
  all('[data-route-challenge-new], [data-route-free-challenge]').forEach(button => {
    button.addEventListener('click', () => newRound(true));
  });
  modeButtons.forEach(button => button.addEventListener('click', () => {
    const next = button.dataset.routeMode;
    if (mode === next) return;
    changeMode(next);
    result = null;
    if (mode === 'read' && !hasMission()) newRound(true);
    else {
      paintTrail();
      renderDirections();
    }
  }));
  mapSelect.addEventListener('change', () => {
    map = core.neighbourhoods.find(candidate => candidate.id === mapSelect.value);
    paintMap();
    round = null;
    newRound(mode === 'read');
  });
  compact.addEventListener('change', mountDirections);
  reducedMotion.addEventListener('change', event => {
    if (event.matches) stopRideAnimation();
  });
  find('[data-route-hint]').addEventListener('click', () => {
    english = !english;
    renderDirections();
  });
  find('[data-route-check]').addEventListener('click', checkRoute);
  form.addEventListener('submit', event => {
    event.preventDefault();
    checkRoute();
  });

  paintMap();
  mountDirections();
  newRound(true);
  new ResizeObserver(resizeMapLabels).observe(svg);
})();
