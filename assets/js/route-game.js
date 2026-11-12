(() => {
  'use strict';

  const root = document.querySelector('[data-route-game]');
  if (!root) return;
  const core = window.MaltiRouteGame;
  const find = selector => root.querySelector(selector);
  const all = selector => [...root.querySelectorAll(selector)];
  const say = (selector, value) => { find(selector).textContent = value; };

  const svg = find('[data-route-map]');
  const labels = all('[data-route-landmark]');
  const labelMeasure = find('[data-route-label-measure]');
  const coordinates = labels.map(label => {
    const { e: x, f: y } = label.parentElement.transform.baseVal.getItem(0).matrix;
    return { x, y };
  });
  const icons = all('[data-route-icon]');
  const rings = all('[data-route-ring]');
  const roads = all('[data-route-road]');
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

  const current = () => trail.at(-1);
  const reachedGoal = () => current().at === round.goal;
  const hasMission = () => Boolean(round.ordinal);
  const place = index => core.place(map, index);
  const face = heading => core.headings[heading].name;

  function drawLine(lines, points) {
    for (const line of lines) {
      line.points.clear();
      for (const { at } of points) {
        const vertex = svg.createSVGPoint();
        Object.assign(vertex, coordinates[at]);
        line.points.appendItem(vertex);
      }
    }
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

  function renderTextMap() {
    renderRows(find('[data-route-text-map]'), find('[data-route-text-template]'), map.places, (fragment, _, index) => {
      const [name, englishName] = place(index);
      const ways = core.headings.flatMap((direction, heading) => {
        const next = core.neighbour(map, index, heading);
        if (next !== -1) return [direction.name + ' to ' + place(next)[1]];
        const possible = core.gridNeighbour(index, heading);
        return possible !== -1 && core.roadState(map, core.edgeKey(index, possible)) === 'closed'
          ? [direction.name + ' closed'] : [];
      });
      fragmentText(fragment, '[data-route-text-place]', name);
      fragmentText(fragment, '[data-route-text-ways]', ' (' + englishName + ') · ' + ways.join(', '));
    });
  }

  function fragmentText(fragment, selector, value) {
    fragment.querySelector(selector).textContent = value;
  }

  function paintMap() {
    say('[data-route-map-name]', map.name);
    say('[data-route-map-level]', map.difficulty);
    say('#route-svg-title', map.name + ' street map');
    find('[data-route-scenery]').href.baseVal = '#route-scenery-' + map.id;
    mapSelect.value = map.id;
    labels.forEach((label, index) => {
      const name = place(index)[0];
      labelMeasure.textContent = name;
      label.textContent = name;
      label.textLength.baseVal.value = Math.min(labelMeasure.getComputedTextLength(), 94);
      icons[index].href.baseVal = '#route-icon-' + map.places[index];
    });
    labelMeasure.textContent = '';
    roads.forEach(road => { road.dataset.edgeState = core.roadState(map, road.dataset.routeRoad); });
    renderTextMap();
  }

  function updatePosition(message = '') {
    const { at, heading } = current(), count = trail.length - 1;
    const position = place(at)[0] + ' · Facing ' + face(heading) + ' · ' + count + (count === 1 ? ' block' : ' blocks');
    say('[data-route-position]', message ? message + ' ' + position : position);
  }

  function paintTrail() {
    drawLine(trailLines, trail);
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
  }

  function selectPhrase(index) {
    activePhrase = index;
    [...phraseList.querySelectorAll('[data-route-phrase]')].forEach((button, position) => {
      button.ariaPressed = String(position === index);
    });
    const phrase = phrases[index];
    drawLine(segmentLines, phrase ? trail.slice(phrase.from, phrase.to + 1) : []);
    if (phrase) {
      const from = place(trail[phrase.from].at)[1], to = place(trail[phrase.to].at)[1];
      say('[data-route-highlight-status]', 'Highlighted from ' + from + ' to ' + to + '.');
    } else {
      say('[data-route-highlight-status]', '');
    }
  }

  function renderPhrases() {
    const show = trail.length > 1 && (mode === 'live' || result?.passed);
    model.hidden = !show;
    if (!show) {
      phrases = [];
      phraseList.replaceChildren();
      selectPhrase(-1);
      return;
    }
    say('#route-model-title', reachedGoal() ? 'Directions to the goal' : 'Directions so far');
    phrases = core.routePhrases(map, trail, round);
    renderRows(phraseList, find('[data-route-phrase-template]'), phrases, (fragment, phrase, index) => {
      fragment.querySelector('[data-route-phrase]').dataset.routePhrase = String(index);
      fragmentText(fragment, '[data-route-phrase-mt]', phrase.mt);
      fragmentText(fragment, '[data-route-phrase-en]', phrase.en);
    });
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
    paintTrail();
    updatePosition();
    renderDirections();
  }

  function refreshMove() {
    result = null;
    paintTrail();
    updatePosition();
    renderDirections();
  }

  function travel(heading, missing = 'There is no road that way.') {
    if (reachedGoal()) return;
    const from = current().at;
    const next = heading === -1 ? -1 : core.neighbour(map, from, heading);
    if (next === -1) {
      const candidate = heading === -1 ? -1 : core.gridNeighbour(from, heading);
      const blocked = candidate !== -1 && core.roadState(map, core.edgeKey(from, candidate)) === 'closed';
      updatePosition(blocked ? 'That road is closed. Choose a ringed intersection.' : missing);
      return;
    }
    trail.push({ at: next, heading });
    refreshMove();
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
    const target = event.target.closest('[data-route-node]');
    if (!target) return;
    const next = Number(target.dataset.routeNode);
    const heading = core.headings.findIndex((_, direction) => core.gridNeighbour(current().at, direction) === next);
    travel(heading, 'Choose an intersection one block away.');
  });
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
})();
