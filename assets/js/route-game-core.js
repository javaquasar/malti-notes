(() => {
  'use strict';

  const columns = 4, rows = 5;
  const headings = [
    { dx: 0, dy: -1, name: 'north' }, { dx: 1, dy: 0, name: 'east' },
    { dx: 0, dy: 1, name: 'south' }, { dx: -1, dy: 0, name: 'west' }
  ];
  const sides = { 1: { mt: 'il-lemin', en: 'right' }, 3: { mt: 'ix-xellug', en: 'left' } };
  const ordinals = { 2: { mt: 'fit-tieni', en: 'second' }, 3: { mt: 'fit-tielet', en: 'third' } };
  const crossings = [
    null, { mt: 'triq waħda', en: 'one side street' },
    { mt: 'żewġ toroq', en: 'two side streets' }, { mt: 'tliet toroq', en: 'three side streets' }
  ];
  // Direction patterns follow the Lesson 05 dialogue bank on directions_town.html.
  const landmarks = {
    post: ['Il-posta', 'the post office'], church: ['Il-knisja', 'the church'],
    bakery: ['Il-forn', 'the bakery'], bank: ['Il-bank', 'the bank'],
    garden: ['Il-ġnien', 'the garden'], square: ['Il-pjazza', 'the square'],
    school: ['L-iskola', 'the school'], clinic: ['Il-klinika', 'the clinic'],
    shop: ['Il-ħanut', 'the shop'], cinema: ['Iċ-ċinema', 'the cinema'],
    museum: ['Il-mużew', 'the museum'], pharmacy: ['L-ispiżerija', 'the pharmacy'],
    library: ['Il-librerija', 'the library'], cafe: ['Il-kafetterija', 'the café'],
    market: ['Is-suq', 'the market'], chapel: ['Il-kappella', 'the chapel'],
    theatre: ['It-teatru', 'the theatre'], bus: ['Il-waqfa', 'the bus stop'],
    fountain: ['Il-funtana', 'the fountain'], tower: ['It-torri', 'the tower'],
    harbour: ['Il-port', 'the harbour']
  };
  const neighbourhoods = [
    {
      id: 'open', name: 'Open Quarter', difficulty: 'Beginner',
      places: [
        'post', 'church', 'bakery', 'bank', 'garden', 'square', 'school', 'clinic',
        'shop', 'cinema', 'museum', 'pharmacy', 'library', 'cafe', 'market', 'chapel',
        'theatre', 'bus', 'fountain', 'tower'
      ],
      missions: [
        { start: 0, heading: 1, pass: 1, turnAt: 2, side: 1, via: 5, goal: 10 },
        { start: 12, heading: 1, pass: 13, turnAt: 15, side: 3, via: 11, goal: 4 },
        { start: 3, heading: 2, pass: 7, turnAt: 11, side: 1, via: 9, goal: 16 },
        { start: 17, heading: 0, pass: 13, turnAt: 9, side: 1, via: 10, goal: 3 }
      ]
    },
    {
      id: 'old-town', name: 'Old Town', difficulty: 'Intermediate',
      places: [
        'library', 'chapel', 'bakery', 'square', 'post', 'cafe', 'school', 'bank',
        'garden', 'museum', 'church', 'pharmacy', 'theatre', 'cinema', 'market', 'clinic',
        'bus', 'fountain', 'shop', 'tower'
      ],
      missing: ['0-1', '3-7', '5-9', '8-12', '13-17', '15-19', '16-17'],
      missions: [
        { start: 0, heading: 2, pass: 4, turnAt: 8, side: 3, via: 10, goal: 15 },
        { start: 4, heading: 1, pass: 5, turnAt: 6, side: 1, via: 14, goal: 7 },
        { start: 3, heading: 3, pass: 2, turnAt: 1, side: 3, via: 4, goal: 14 },
        { start: 18, heading: 0, pass: 14, turnAt: 10, side: 3, via: 8, goal: 2 }
      ]
    },
    {
      id: 'harbour', name: 'Harbour Lanes', difficulty: 'Advanced',
      places: [
        'tower', 'market', 'bank', 'library', 'post', 'school', 'cafe', 'pharmacy',
        'church', 'garden', 'bakery', 'clinic', 'cinema', 'square', 'museum', 'bus',
        'chapel', 'fountain', 'shop', 'harbour'
      ],
      missing: ['0-4', '3-7', '12-16', '15-19'],
      closed: ['1-2', '5-9', '10-11', '13-14', '17-18'],
      missions: [
        { start: 4, heading: 1, pass: 5, turnAt: 6, side: 1, via: 14, goal: 11 },
        { start: 7, heading: 3, pass: 6, turnAt: 5, side: 1, via: 4, goal: 13 },
        { start: 2, heading: 2, pass: 6, turnAt: 10, side: 1, via: 13, goal: 4 },
        { start: 17, heading: 0, pass: 13, turnAt: 9, side: 1, via: 10, goal: 7 }
      ]
    }
  ];

  const rotate = (heading, turn) => (heading + turn + headings.length) % headings.length;
  const turnFrom = (heading, next) => rotate(next, -heading);
  const col = index => index % columns;
  const row = index => Math.floor(index / columns);
  const edgeKey = (from, to) => from < to ? `${from}-${to}` : `${to}-${from}`;
  const place = (map, index) => landmarks[map.places[index]];
  const mt = (map, index) => place(map, index)[0].toLocaleLowerCase('mt');
  const en = (map, index) => place(map, index)[1];

  function roadState(map, edge) {
    if (map.closed?.includes(edge)) return 'closed';
    return map.missing?.includes(edge) ? 'missing' : 'open';
  }

  function gridNeighbour(index, heading) {
    const { dx, dy } = headings[heading];
    const x = col(index) + dx, y = row(index) + dy;
    return x < 0 || x >= columns || y < 0 || y >= rows ? -1 : y * columns + x;
  }

  function neighbour(map, from, heading) {
    const to = gridNeighbour(from, heading);
    return to !== -1 && roadState(map, edgeKey(from, to)) === 'open' ? to : -1;
  }

  function isJunction(map, at, heading) {
    return [-1, 1].some(side => neighbour(map, at, rotate(heading, side)) !== -1);
  }

  function junctionsAhead(map, from, heading) {
    const junctions = [];
    for (let next = neighbour(map, from, heading); next !== -1; next = neighbour(map, next, heading)) {
      if (isJunction(map, next, heading)) junctions.push(next);
    }
    return junctions;
  }

  function freeRounds(map) {
    return map.places.flatMap((_, start) => map.places.flatMap((_, goal) => {
      const dx = col(goal) - col(start), dy = row(goal) - row(start);
      if (!dx || !dy || Math.abs(dx) + Math.abs(dy) < 3) return [];
      const horizontal = dx > 0 ? 1 : 3, vertical = dy > 0 ? 2 : 0;
      const preferred = Math.abs(dx) >= Math.abs(dy) ? [horizontal, vertical] : [vertical, horizontal];
      const heading = [...preferred, 0, 1, 2, 3].find(value => neighbour(map, start, value) !== -1);
      return [{ id: `free-${start}-${goal}`, start, heading, goal }];
    }));
  }

  function missionRounds(map) {
    return map.missions.map(mission => ({
      ...mission, id: `mission-${mission.start}-${mission.goal}`,
      ordinal: junctionsAhead(map, mission.start, mission.heading).indexOf(mission.turnAt) + 1
    }));
  }

  function instructions(map, round) {
    const side = sides[round.side], ordinal = ordinals[round.ordinal];
    return [
      { mt: `Għaddi minn ħdejn ${mt(map, round.pass)}.`, en: `Go past ${en(map, round.pass)}.` },
      { mt: `Dur fuq ${side.mt} ${ordinal.mt} triq.`, en: `Turn ${side.en} at the ${ordinal.en} street.` },
      { mt: `Mur ħdejn ${mt(map, round.via)} qabel ma tasal ħdejn ${mt(map, round.goal)}.`,
        en: `Go via ${en(map, round.via)} before reaching ${en(map, round.goal)}.` }
    ];
  }

  function evaluateMission(map, round, trail) {
    const current = trail.at(-1).at;
    const turnIndex = trail.findIndex(step => step.heading !== round.heading);
    const beforeTurn = turnIndex === -1 ? trail.length : turnIndex;
    const passIndex = trail.findIndex((step, index) => step.at === round.pass && index > 0 && index + 1 < beforeTurn);
    const pass = passIndex !== -1
      ? { state: 'done' }
      : {
          state: turnIndex === -1 ? 'pending' : 'missed',
          at: turnIndex === -1 ? current : trail[turnIndex - 1].at,
          message: turnIndex !== -1 && trail[turnIndex - 1].at === round.pass
            ? `You turned at ${en(map, round.pass)}. Go straight past it before turning.`
            : turnIndex !== -1
              ? `Your first turn at ${en(map, trail[turnIndex - 1].at)} came before passing ${en(map, round.pass)}. Undo that turn.`
              : `Go straight past ${en(map, round.pass)} before your first turn.`
        };
    const ordinal = ordinals[round.ordinal].en;
    const turnPoint = turnIndex === -1 ? current : trail[turnIndex - 1].at;
    const expectedHeading = rotate(round.heading, round.side);
    const travelled = Math.abs(col(turnPoint) - col(round.start)) + Math.abs(row(turnPoint) - row(round.start));
    const toTurn = Math.abs(col(round.turnAt) - col(round.start)) + Math.abs(row(round.turnAt) - row(round.start));
    let turn;
    if (travelled > toTurn) {
      turn = { state: 'missed', at: round.turnAt, message: `You passed the ${ordinal} street at ${en(map, round.turnAt)}. Undo back to that junction.` };
    } else if (turnIndex === -1) {
      turn = { state: 'pending', at: current, message: `Make your first turn ${sides[round.side].en} at the ${ordinal} street.` };
    } else if (turnPoint !== round.turnAt) {
      turn = { state: 'missed', at: turnPoint, message: `You turned too early at ${en(map, turnPoint)}. Continue to the ${ordinal} street before turning.` };
    } else if (trail[turnIndex].heading !== expectedHeading) {
      turn = { state: 'missed', at: turnPoint, message: `At ${en(map, turnPoint)}, undo the turn and turn ${sides[round.side].en}.` };
    } else {
      turn = { state: 'done' };
    }
    const viaReached = turn.state === 'done' && trail.slice(turnIndex).some(step => step.at === round.via);
    const via = viaReached
      ? { state: 'done' }
      : {
          state: current === round.goal ? 'missed' : 'pending',
          at: current,
          message: current === round.goal
            ? `You reached ${en(map, round.goal)} without going via ${en(map, round.via)} after your turn.`
            : `Go via ${en(map, round.via)} after making the required turn.`
        };
    return [pass, turn, via];
  }

  function routePhrases(map, trail, round) {
    const legs = [];
    for (let index = 1; index < trail.length; index += 1) {
      const step = trail[index], last = legs.at(-1);
      if (last?.heading === step.heading) last.end = index;
      else legs.push({ start: index - 1, end: index, heading: step.heading });
    }
    const phrases = [];
    const firstTurn = trail.findIndex(step => step.heading !== trail[0].heading);
    const add = (mt, en, from, to) => phrases.push({ mt, en, from, to });
    for (const { start, end, heading } of legs) {
      const from = trail[start].at, goal = trail[end].at;
      const turn = turnFrom(trail[start].heading, heading);
      const turnStart = Math.max(0, start - 1);
      if (turn === 2) {
        add(`Dur lura ħdejn ${mt(map, from)}.`, `Turn back by ${en(map, from)}.`, turnStart, start + 1);
      } else if (turn) {
        const ordinal = start + 1 === firstTurn && from === round?.turnAt ? ordinals[round.ordinal] : null;
        const malteseTurn = ordinal ? `${ordinal.mt} triq` : `mal-kantuniera ħdejn ${mt(map, from)}`;
        const englishTurn = ordinal ? `at the ${ordinal.en} street` : `at the corner by ${en(map, from)}`;
        add(`Dur fuq ${sides[turn].mt} ${malteseTurn}.`, `Turn ${sides[turn].en} ${englishTurn}.`, turnStart, start + 1);
      }
      add(`Ibqa' sejjer dritt sakemm tasal ħdejn ${mt(map, goal)}.`,
        `Keep going straight until you reach ${en(map, goal)}.`, start, end);
      const passed = [];
      for (let index = start + 1; index < end; index += 1) passed.push(index);
      const junctions = passed.filter(index => isJunction(map, trail[index].at, heading));
      if (junctions.length) {
        const count = crossings[junctions.length];
        add(`Fit-triq, aqsam ${count.mt}.`, `On the way, cross ${count.en}.`, junctions[0] - 1, junctions.at(-1) + 1);
      }
      for (const index of passed) {
        const at = trail[index].at;
        add(`Għaddi minn ħdejn ${mt(map, at)}.`, `Go past ${en(map, at)}.`, index - 1, index + 1);
      }
    }
    return phrases;
  }

  const api = {
    columns, rows, headings, neighbourhoods, rotate, edgeKey, gridNeighbour, neighbour, roadState,
    place, freeRounds, missionRounds, instructions, evaluateMission, routePhrases
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.MaltiRouteGame = api;
})();
