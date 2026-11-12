(() => {
  'use strict';
  const root = document.querySelector('[data-route-game]');
  if (!root) return;
  const find = selector => root.querySelector(selector);
  const say = (selector, value) => { find(selector).textContent = value; };
  const columns = 4;
  const labelOffset = 39;
  const directions = [
    { dx: 0, dy: -1, name: 'north' }, { dx: 1, dy: 0, name: 'east' },
    { dx: 0, dy: 1, name: 'south' }, { dx: -1, dy: 0, name: 'west' }
  ];
  const sides = { 1: { mt: 'il-lemin', en: 'right' }, 3: { mt: 'ix-xellug', en: 'left' } };
  const landmarks = [...root.querySelectorAll('[data-route-landmark]')].map((label, index) => ({
    col: index % columns, row: Math.floor(index / columns), maltese: label.textContent,
    english: label.dataset.english, x: Number(label.getAttribute('x')), y: Number(label.getAttribute('y')) - labelOffset
  }));
  const rounds = landmarks.flatMap((from, start) => landmarks.flatMap((to, goal) => {
    const dx = to.col - from.col, dy = to.row - from.row;
    if (!dx || !dy || Math.abs(dx) + Math.abs(dy) < 3) return [];
    const heading = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
    return [{ start, goal, heading }];
  }));
  const challengeRounds = rounds.filter(({ start, goal, heading }) => heading % 2 === 1
    && Math.abs(landmarks[goal].col - landmarks[start].col) >= 2);
  const model = find('[data-route-model]');
  const form = find('[data-route-form]');
  const modes = [...root.querySelectorAll('[data-route-mode]')];
  const description = find('[data-route-description]');
  const map = find('[data-route-map]');
  const trailPoints = find('[data-route-trail]').points;
  const walker = find('[data-route-walker]');
  const dots = [...map.querySelectorAll('[data-route-dot]')];
  const compact = window.matchMedia('(max-width: 980px)');
  const directionsPanel = find('[data-route-directions]');
  const inlinePanel = find('[data-route-inline]');
  const sidePanel = find('[data-route-side]');
  let round, challenge, trail, mode = 'write', checked = false;

  const point = index => landmarks[index];
  const current = () => trail[trail.length - 1];
  const maltese = index => point(index).maltese.toLocaleLowerCase('mt');
  const facing = heading => directions[heading].name;
  const reachedGoal = () => current().at === round.goal;
  const turnFrom = (heading, nextHeading) => (nextHeading - heading + directions.length) % directions.length;

  function adjacent(index, heading) {
    const { dx, dy } = directions[heading];
    const col = point(index).col + dx, row = point(index).row + dy;
    const next = row * columns + col;
    return col >= 0 && col < columns && point(next) ? next : -1;
  }

  function placeMarker(marker, index) {
    const { x, y } = point(index);
    marker.transform.baseVal.getItem(0).setTranslate(x, y);
  }

  function position() {
    const { at, heading } = current(), count = trail.length - 1;
    return `${point(at).maltese}. Facing ${facing(heading)}. ${count} ${count === 1 ? 'block' : 'blocks'} walked.`;
  }

  function placeDirections() {
    const inline = mode === 'live' && compact.matches;
    const panel = inline ? inlinePanel : sidePanel;
    if (directionsPanel.parentElement !== panel) panel.append(directionsPanel);
    inlinePanel.hidden = !inline;
    sidePanel.hidden = inline;
  }

  function challengeProgress() {
    if (!challenge) return '';
    const firstTurn = trail.findIndex(step => step.heading !== round.heading);
    const junction = firstTurn === -1 ? trail.length - 1 : firstTurn - 1;
    if (junction > challenge.junction) return 'late';
    if (firstTurn === -1) return 'pending';
    if (junction < challenge.junction) return 'early';
    return trail[firstTurn].heading === challenge.heading ? 'met' : 'wrong-side';
  }

  function refreshChallenge() {
    find('[data-route-challenge]').hidden = !challenge;
    if (!challenge) return;
    const side = sides[turnFrom(round.heading, challenge.heading)];
    const street = challenge.junction === 2 ? { mt: 'fit-tieni', en: 'second' } : { mt: 'fit-tielet', en: 'third' };
    say('[data-route-challenge-mt]', `Għaddi minn ħdejn ${maltese(challenge.landmark)} u dur fuq ${side.mt} ${street.mt} triq.`);
    say('[data-route-challenge-en]', `Go past ${point(challenge.landmark).english}, then turn ${side.en} at the ${street.en} street.`);
    const messages = {
      late: 'You passed the required turn. Undo back to that street.',
      early: 'You turned too early. Undo your first turn and go straight to the required street.',
      'wrong-side': `You reached the right street. Undo the turn and turn ${side.en}.`,
      met: 'You passed the landmark and made the required turn.'
    };
    say('[data-route-challenge-status]', messages[challengeProgress()] || '');
  }

  function refreshDirections() {
    const live = mode === 'live';
    const hasMoves = trail.length > 1;
    form.hidden = live;
    find('#route-write-help').hidden = live;
    find('[data-route-live-empty]').hidden = !live || hasMoves;
    find('[data-route-compare]').hidden = live;
    say('#route-write-heading', live ? 'Live directions' : 'Give directions');
    const liveTitle = reachedGoal() ? 'Directions to the goal' : 'Directions so far';
    say('#route-model-title', live ? liveTitle : 'Model for your route');
    const showModel = live ? hasMoves : checked;
    model.hidden = !showModel;
    if (showModel) modelRoute();
  }

  function refreshFeedback() {
    let message = '';
    if (reachedGoal()) {
      if (challenge && challengeProgress() !== 'met') message = 'You reached the goal. Undo moves to follow the challenge instruction.';
      else if (challenge && (checked || mode === 'live')) message = 'Challenge complete. You reached the goal.';
      else if (checked) message = 'Your route reaches the goal.';
      else if (mode === 'live') message = 'You reached the goal.';
      else message = 'You reached the goal. Check the route after you write your directions.';
    }
    say('[data-route-feedback]', message);
  }

  function draw() {
    trailPoints.clear();
    for (const step of trail) {
      const vertex = map.createSVGPoint();
      vertex.x = point(step.at).x;
      vertex.y = point(step.at).y;
      trailPoints.appendItem(vertex);
    }
    placeMarker(walker, current().at);
    walker.transform.baseVal.getItem(1).setRotate(current().heading * 90, 0, 0);
    const next = reachedGoal() ? [] : directions.map((_, heading) => adjacent(current().at, heading));
    dots.forEach(dot => { dot.r.baseVal.value = next.includes(Number(dot.dataset.routeDot)) ? 8 : 4; });
    find('[data-route-start-ring]').r.baseVal.value = next.includes(round.start) ? 18 : 0;
    find('[data-route-goal-ring]').r.baseVal.value = next.includes(round.goal) ? 18 : 0;
    find('[data-route-undo]').disabled = trail.length === 1;
    say('[data-route-position]', position());
    checked = false;
    refreshChallenge();
    refreshDirections();
    refreshFeedback();
  }

  function newRound(withChallenge = false) {
    const pool = withChallenge ? challengeRounds : rounds;
    const next = pool.filter(candidate => candidate !== round);
    round = next[Math.floor(Math.random() * next.length)];
    challenge = withChallenge ? {
      landmark: adjacent(round.start, round.heading),
      junction: Math.abs(point(round.goal).col - point(round.start).col),
      heading: point(round.goal).row > point(round.start).row ? 2 : 0
    } : null;
    trail = [{ at: round.start, heading: round.heading }];
    description.value = '';
    say('[data-route-start-name]', point(round.start).maltese);
    say('[data-route-goal-name]', point(round.goal).maltese);
    say('[data-route-start-heading]', `Start facing ${facing(round.heading)}`);
    placeMarker(find('[data-route-start-marker]'), round.start);
    placeMarker(find('[data-route-goal-marker]'), round.goal);
    draw();
    say('[data-route-position]', `New ${challenge ? 'challenge' : 'route'} to ${point(round.goal).maltese}. ${position()}`);
  }

  function travel(heading, missing = 'There is no road that way.') {
    if (reachedGoal()) {
      refreshFeedback();
      return;
    }
    const destination = heading === -1 ? -1 : adjacent(current().at, heading);
    if (destination === -1) {
      say('[data-route-position]', `${missing} ${position()}`);
      return;
    }
    trail.push({ at: destination, heading });
    draw();
  }

  function modelRoute() {
    const legs = [];
    trail.slice(1).forEach((step, index) => {
      const previous = trail[index], last = legs[legs.length - 1];
      if (last?.heading === step.heading) last.stops.push(step.at);
      else legs.push({ from: previous.at, turn: turnFrom(previous.heading, step.heading), heading: step.heading, stops: [step.at] });
    });
    const mt = [], en = [];
    for (const { from, turn, stops } of legs) {
      if (turn === 2) {
        mt.push(`Dur lura ħdejn ${maltese(from)}.`);
        en.push(`Turn back by ${point(from).english}.`);
      } else if (turn) {
        mt.push(`Dur fuq ${sides[turn].mt} mal-kantuniera ħdejn ${maltese(from)}.`);
        en.push(`Turn ${sides[turn].en} at the corner by ${point(from).english}.`);
      }
      const goal = stops[stops.length - 1], passed = stops.slice(0, -1);
      mt.push(`Ibqa' sejjer dritt sakemm tasal ħdejn ${maltese(goal)}.`);
      en.push(`Keep going straight until you reach ${point(goal).english}.`);
      if (passed.length) {
        mt.push(passed.length === 1 ? 'Fit-triq, aqsam triq waħda.' : 'Fit-triq, aqsam żewġ toroq.');
        en.push(`On the way, cross ${passed.length === 1 ? 'one side street' : 'two side streets'}.`);
        for (const at of passed) {
          mt.push(`Għaddi minn ħdejn ${maltese(at)}.`);
          en.push(`Go past ${point(at).english}.`);
        }
      }
    }
    say('[data-route-model-mt]', mt.join(' '));
    say('[data-route-model-en]', en.join(' '));
  }

  root.querySelectorAll('[data-route-move]').forEach(button => {
    button.addEventListener('click', () => {
      const heading = (current().heading + Number(button.dataset.routeMove) + directions.length) % directions.length;
      travel(heading);
    });
  });
  map.addEventListener('click', event => {
    const node = event.target.closest('[data-route-node]');
    if (!node) return;
    const index = Number(node.dataset.routeNode);
    const heading = directions.findIndex((_, heading) => adjacent(current().at, heading) === index);
    travel(heading, 'Choose an intersection one block away.');
  });
  find('[data-route-undo]').addEventListener('click', () => {
    if (trail.length > 1) { trail.pop(); draw(); }
  });
  find('[data-route-new]').addEventListener('click', () => newRound());
  find('[data-route-challenge-new]').addEventListener('click', () => newRound(true));
  modes.forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.routeMode;
    modes.forEach(option => { option.ariaPressed = String(option === button); });
    placeDirections();
    refreshDirections();
    refreshFeedback();
  }));
  compact.addEventListener('change', placeDirections);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!reachedGoal()) {
      say('[data-route-feedback]', `You are at ${point(current().at).maltese}. Keep going to ${point(round.goal).maltese}.`);
      return;
    }
    if (challenge && challengeProgress() !== 'met') {
      refreshFeedback();
      return;
    }
    if (!description.value.trim()) {
      say('[data-route-feedback]', 'Write your directions in Maltese, then check the route.');
      description.focus();
      return;
    }
    checked = true;
    refreshDirections();
    refreshFeedback();
    find('#route-model-title').focus();
  });
  placeDirections();
  newRound();
})();
