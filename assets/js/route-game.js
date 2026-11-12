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
  const model = find('[data-route-model]');
  const form = find('[data-route-form]');
  const modes = [...root.querySelectorAll('[data-route-mode]')];
  const description = find('[data-route-description]');
  const map = find('[data-route-map]');
  const trailPoints = find('[data-route-trail]').points;
  const walker = find('[data-route-walker]');
  let round, trail, mode = 'write', checked = false;

  const point = index => landmarks[index];
  const current = () => trail[trail.length - 1];
  const maltese = index => point(index).maltese.toLocaleLowerCase('mt');
  const facing = heading => directions[heading].name;
  const reachedGoal = () => current().at === round.goal;

  function placeMarker(marker, index) {
    const { x, y } = point(index);
    marker.transform.baseVal.getItem(0).setTranslate(x, y);
  }

  function position() {
    const { at, heading } = current(), count = trail.length - 1;
    return `${point(at).maltese}. Facing ${facing(heading)}. ${count} ${count === 1 ? 'block' : 'blocks'} walked.`;
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
      if (checked && mode === 'write') message = 'Your route reaches the goal.';
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
    find('[data-route-undo]').disabled = trail.length === 1;
    say('[data-route-position]', position());
    checked = false;
    refreshDirections();
    refreshFeedback();
  }

  function newRound() {
    const next = rounds.filter(candidate => candidate !== round);
    round = next[Math.floor(Math.random() * next.length)];
    trail = [{ at: round.start, heading: round.heading }];
    description.value = '';
    say('[data-route-start-name]', point(round.start).maltese);
    say('[data-route-goal-name]', point(round.goal).maltese);
    say('[data-route-start-heading]', `Start facing ${facing(round.heading)}`);
    placeMarker(find('[data-route-start-marker]'), round.start);
    placeMarker(find('[data-route-goal-marker]'), round.goal);
    draw();
    say('[data-route-position]', `New route to ${point(round.goal).maltese}. ${position()}`);
  }

  function move(turn) {
    const { at, heading } = current();
    if (reachedGoal()) {
      say('[data-route-feedback]', mode === 'live' ? 'You are at the goal. Undo a move or start a new route.' : 'You are at the goal. Check your route or undo a move.');
      return;
    }
    const nextHeading = (heading + turn + directions.length) % directions.length;
    const { dx, dy } = directions[nextHeading];
    const col = point(at).col + dx, row = point(at).row + dy;
    const destination = col < 0 || col >= columns || row < 0 ? undefined : point(row * columns + col);
    if (!destination) {
      say('[data-route-position]', `There is no road that way. ${position()}`);
      return;
    }
    trail.push({ at: row * columns + col, heading: nextHeading });
    draw();
  }

  function modelRoute() {
    const legs = [];
    trail.slice(1).forEach((step, index) => {
      const previous = trail[index], last = legs[legs.length - 1];
      if (last?.heading === step.heading) last.stops.push(step.at);
      else legs.push({ from: previous.at, turn: (step.heading - previous.heading + 4) % 4, heading: step.heading, stops: [step.at] });
    });
    const mt = [], en = [];
    for (const { from, turn, stops } of legs) {
      if (turn) {
        mt.push(`Dur fuq ${turn === 1 ? 'il-lemin' : 'ix-xellug'} mal-kantuniera ħdejn ${maltese(from)}.`);
        en.push(`Turn ${turn === 1 ? 'right' : 'left'} at the corner by ${point(from).english}.`);
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
    button.addEventListener('click', () => move(Number(button.dataset.routeMove)));
  });
  find('[data-route-undo]').addEventListener('click', () => {
    if (trail.length > 1) { trail.pop(); draw(); }
  });
  find('[data-route-new]').addEventListener('click', newRound);
  modes.forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.routeMode;
    modes.forEach(option => { option.ariaPressed = String(option === button); });
    refreshDirections();
    refreshFeedback();
  }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!reachedGoal()) {
      say('[data-route-feedback]', `You are at ${point(current().at).maltese}. Keep going to ${point(round.goal).maltese}.`);
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
  newRound();
})();
