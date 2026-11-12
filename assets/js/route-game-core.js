(() => {
  'use strict';

  const columns = 4;
  const headings = [
    { dx: 0, dy: -1, name: 'north' }, { dx: 1, dy: 0, name: 'east' },
    { dx: 0, dy: 1, name: 'south' }, { dx: -1, dy: 0, name: 'west' }
  ];
  const sides = { 1: { mt: 'il-lemin', en: 'right' }, 3: { mt: 'ix-xellug', en: 'left' } };
  const ordinals = { 2: { mt: 'fit-tieni', en: 'second' }, 3: { mt: 'fit-tielet', en: 'third' } };
  const crossings = [
    null, { mt: 'triq waħda', en: 'one side street' },
    { mt: 'żewġ toroq', en: 'two side streets' }, { mt: 'tliet toroq', en: 'three side streets' },
    { mt: "erba' toroq", en: 'four side streets' }, { mt: 'ħames toroq', en: 'five side streets' }
  ];
  const serviceTypes = {
    bus: { label: 'Bus', plural: 'Buses', maltese: 'il-karozza tal-linja', numberPrefix: ' numru', icon: 'bus' },
    ferry: { label: 'Ferry', plural: 'Ferries', maltese: 'il-lanċa', numberPrefix: '', icon: 'quay' }
  };
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
    harbour: ['Il-port', 'the harbour'],
    'quay-a': ['Il-moll A', 'Quay A', 'quay'], 'quay-b': ['Il-moll B', 'Quay B', 'quay'],
    'quay-c': ['Il-moll C', 'Quay C', 'quay'],
    'stop-a': ['Il-waqfa A', 'Stop A', 'bus'], 'stop-b': ['Il-waqfa B', 'Stop B', 'bus'],
    'stop-c': ['Il-waqfa C', 'Stop C', 'bus']
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
    },
    {
      id: 'ferry-crossing', name: 'Ferry Crossing', difficulty: 'Ferry routes',
      places: [
        'post', 'church', 'cafe', 'bank', 'school', 'square', 'bakery', 'library',
        'garden', 'market', 'quay-a', 'shop',
        null, null, null, null, null, null, null, null,
        'fountain', 'quay-b', 'museum', 'quay-c', 'pharmacy', 'bus', 'tower', 'cinema'
      ],
      services: [
        {
          kind: 'ferry', number: 'F1', from: 10, to: 21, destination: 'South Quay', returnDestination: 'North Quay',
          via: [{ x: 269, y: 265 }, { x: 227, y: 307 }, { x: 174, y: 359 }, { x: 163, y: 408 }],
          label: { x: 215, y: 322 }
        },
        {
          kind: 'ferry', number: 'F2', from: 10, to: 23, destination: 'East Quay', returnDestination: 'North Quay',
          via: [{ x: 286, y: 264 }, { x: 337, y: 311 }, { x: 374, y: 362 }, { x: 379, y: 412 }],
          label: { x: 348, y: 327 }
        }
      ],
      missions: [
        { start: 0, heading: 1, rides: [{ from: 10, number: 'F1' }], goal: 26 },
        { start: 4, heading: 1, rides: [{ from: 10, number: 'F2' }], goal: 27 },
        { start: 24, heading: 1, rides: [{ from: 21, number: 'F1' }], goal: 3 },
        { start: 27, heading: 0, rides: [{ from: 23, number: 'F2' }], goal: 7 }
      ]
    },
    {
      id: 'bus-link', name: 'Bus Link', difficulty: 'Intertown routes',
      places: [
        'school', 'square', 'pharmacy', 'post', 'library', 'garden', 'bank', 'cafe',
        'clinic', 'shop', 'stop-a', 'church',
        null, null, null, null, null, null, null, null,
        'bakery', 'stop-b', 'chapel', 'stop-c', 'fountain', 'museum', 'market', 'tower'
      ],
      missing: ['21-22', '25-26'],
      services: [
        {
          kind: 'bus', number: '31', from: 10, to: 21, destination: 'Garden Town', returnDestination: 'North Town',
          via: [{ x: 271, y: 265 }, { x: 219, y: 306 }, { x: 166, y: 360 }, { x: 163, y: 430 }],
          label: { x: 208, y: 322 }
        },
        {
          kind: 'bus', number: '47', from: 10, to: 23, destination: 'Market Town', returnDestination: 'North Town',
          via: [{ x: 288, y: 263 }, { x: 341, y: 311 }, { x: 374, y: 364 }, { x: 379, y: 430 }],
          label: { x: 352, y: 329 }
        }
      ],
      missions: [
        { start: 0, heading: 1, rides: [{ from: 10, number: '31' }], goal: 25 },
        { start: 3, heading: 2, rides: [{ from: 10, number: '47' }], goal: 26 },
        { start: 24, heading: 0, rides: [{ from: 21, number: '31' }], goal: 3 },
        { start: 27, heading: 0, rides: [{ from: 23, number: '47' }], goal: 11 }
      ]
    },
    {
      id: 'bus-to-ferry', name: 'Bus to Ferry', difficulty: 'Transfer challenge',
      places: [
        'post', 'church', 'square', 'library', 'school', 'garden', 'stop-a', 'pharmacy',
        'stop-b', 'cafe', 'harbour', 'stop-c', 'bakery', 'bank', 'quay-a', 'market',
        null, null, null, null,
        'fountain', 'quay-b', 'clinic', 'quay-c', 'museum', 'tower', 'shop', 'chapel'
      ],
      missing: ['4-8', '5-9', '6-10', '7-11', '10-11', '14-15'],
      services: [
        {
          kind: 'bus', number: '31', from: 6, to: 8, destination: 'Harbour', returnDestination: 'North Town',
          via: [{ x: 255, y: 161 }, { x: 184, y: 182 }, { x: 108, y: 185 }, { x: 55, y: 201 }],
          label: { x: 133, y: 185 }
        },
        {
          kind: 'bus', number: '47', from: 6, to: 11, destination: 'Market Town', returnDestination: 'North Town',
          via: [{ x: 286, y: 155 }, { x: 329, y: 169 }, { x: 366, y: 186 }, { x: 379, y: 205 }],
          label: { x: 335, y: 172 }
        },
        {
          kind: 'ferry', number: 'F1', from: 14, to: 21, destination: 'South Quay', returnDestination: 'Harbour',
          via: [{ x: 271, y: 344 }, { x: 231, y: 387 }, { x: 174, y: 423 }, { x: 163, y: 453 }],
          label: { x: 216, y: 398 }
        },
        {
          kind: 'ferry', number: 'F2', from: 14, to: 23, destination: 'East Quay', returnDestination: 'Harbour',
          via: [{ x: 286, y: 341 }, { x: 334, y: 382 }, { x: 370, y: 424 }, { x: 379, y: 453 }],
          label: { x: 347, y: 398 }
        }
      ],
      missions: [
        { start: 0, heading: 1, rides: [{ from: 6, number: '31' }, { from: 14, number: 'F1' }], goal: 24 },
        { start: 3, heading: 3, rides: [{ from: 6, number: '31' }, { from: 14, number: 'F2' }], goal: 27 }
      ]
    }
  ];

  const rotate = (heading, turn) => (heading + turn + headings.length) % headings.length;
  const turnFrom = (heading, next) => rotate(next, -heading);
  const col = index => index % columns;
  const row = index => Math.floor(index / columns);
  const edgeKey = (from, to) => from < to ? `${from}-${to}` : `${to}-${from}`;
  const place = (map, index) => landmarks[map.places[index]];
  const mt = (map, index) => {
    const name = place(map, index)[0];
    return name[0].toLocaleLowerCase('mt') + name.slice(1);
  };
  const en = (map, index) => place(map, index)[1];

  function roadState(map, edge) {
    if (edge.split('-').some(index => !map.places[Number(index)])) return 'missing';
    if (map.closed?.includes(edge)) return 'closed';
    return map.missing?.includes(edge) ? 'missing' : 'open';
  }

  function gridNeighbour(map, index, heading) {
    const { dx, dy } = headings[heading];
    const x = col(index) + dx, y = row(index) + dy;
    const target = y * columns + x;
    return x < 0 || x >= columns || y < 0 || !map.places[target] ? -1 : target;
  }

  function neighbour(map, from, heading) {
    const to = gridNeighbour(map, from, heading);
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

  function departures(map, from) {
    return (map.services || []).flatMap(service => {
      if (service.from === from) return [{ ...service, heading: 2 }];
      if (service.to !== from) return [];
      return [{
        ...service, from, to: service.from, heading: 0, destination: service.returnDestination,
        via: [...service.via].reverse()
      }];
    });
  }

  const serviceName = service => `${serviceTypes[service.kind].label} ${service.number}`;

  function passInstruction(map, at) {
    return { mt: `Għaddi minn ħdejn ${mt(map, at)}.`, en: `Go past ${en(map, at)}.` };
  }

  function rideInstruction(map, service, includeNumber = true) {
    const type = serviceTypes[service.kind];
    const maltese = includeNumber ? `${type.maltese}${type.numberPrefix} ${service.number}` : type.maltese;
    const english = includeNumber ? serviceName(service) : `the ${type.label.toLowerCase()}`;
    return {
      mt: `Aqbad ${maltese} u inżel ħdejn ${mt(map, service.to)}.`,
      en: `Take ${english} and get off at ${en(map, service.to)}.`
    };
  }

  function freeRounds(map) {
    return map.places.flatMap((startPlace, start) => map.places.flatMap((goalPlace, goal) => {
      if (!startPlace || !goalPlace) return [];
      const dx = col(goal) - col(start), dy = row(goal) - row(start);
      if (!dx || !dy || Math.abs(dx) + Math.abs(dy) < 3) return [];
      const horizontal = dx > 0 ? 1 : 3, vertical = dy > 0 ? 2 : 0;
      const preferred = Math.abs(dx) >= Math.abs(dy) ? [horizontal, vertical] : [vertical, horizontal];
      const heading = [...preferred, 0, 1, 2, 3].find(value => neighbour(map, start, value) !== -1);
      return [{ id: `free-${start}-${goal}`, start, heading, goal }];
    }));
  }

  function missionRounds(map) {
    return map.missions.map(mission => {
      const id = `mission-${mission.start}-${mission.goal}`;
      if (mission.rides) {
        const rides = mission.rides.map(({ from, number }) =>
          departures(map, from).find(service => service.number === number));
        return { ...mission, id, rides };
      }
      return { ...mission, id, ordinal: junctionsAhead(map, mission.start, mission.heading).indexOf(mission.turnAt) + 1 };
    });
  }

  function instructions(map, round) {
    if (round.rides) {
      const walk = at => ({ mt: `Wara, mur bil-mixi ħdejn ${mt(map, at)}.`, en: `Then walk to ${en(map, at)}.` });
      const steps = round.rides.flatMap((ride, index) => [
        index === 0 ? { mt: `Mur ħdejn ${mt(map, ride.from)}.`, en: `Walk to ${en(map, ride.from)}.` } : walk(ride.from),
        rideInstruction(map, ride, round.rides.length === 1)
      ]);
      return [...steps, walk(round.goal)];
    }
    const side = sides[round.side], ordinal = ordinals[round.ordinal];
    return [
      passInstruction(map, round.pass),
      { mt: `Dur fuq ${side.mt} ${ordinal.mt} triq.`, en: `Turn ${side.en} at the ${ordinal.en} street.` },
      { mt: `Mur ħdejn ${mt(map, round.via)} qabel ma tasal ħdejn ${mt(map, round.goal)}.`,
        en: `Go via ${en(map, round.via)} before reaching ${en(map, round.goal)}.` }
    ];
  }

  function evaluateTransit(map, round, trail) {
    const boardings = trail.flatMap(({ ride }, index) => ride ? [{ ride, index }] : []);
    const current = trail.at(-1).at;
    const done = { state: 'done' };
    const progress = Array(round.rides.length * 2 + 1).fill({ state: 'pending' });
    let lastArrival = 0;
    for (const [index, expected] of round.rides.entries()) {
      const boarding = boardings[index];
      const actual = boarding?.ride;
      const walkedToStop = trail.slice(lastArrival, boarding?.index).some(step => step.at === expected.from);
      progress[index * 2] = walkedToStop ? done : {
        state: actual ? 'missed' : 'pending',
        at: actual?.from ?? current,
        message: `Walk to ${en(map, expected.from)} before boarding.`
      };
      if (actual?.number !== expected.number || actual.from !== expected.from || actual.to !== expected.to) {
        progress[index * 2 + 1] = {
          state: actual ? 'missed' : 'pending',
          at: actual?.from ?? expected.from,
          message: actual
            ? `You took ${serviceName(actual)} from ${en(map, actual.from)}. Undo the ride and take ${serviceName(expected)} from ${en(map, expected.from)}.`
            : `Take ${serviceName(expected)} to ${en(map, expected.to)}.`
        };
        return progress;
      }
      progress[index * 2 + 1] = done;
      lastArrival = boarding.index;
    }

    const extra = boardings[round.rides.length]?.ride;
    const finish = progress.length - 1;
    if (extra) {
      progress[finish] = {
        state: 'missed', at: extra.from,
        message: `You took an extra ride on ${serviceName(extra)}. Undo it and walk to ${en(map, round.goal)}.`
      };
    } else {
      progress[finish] = current === round.goal ? done : {
        state: 'pending', at: current,
        message: `After getting off at ${en(map, round.rides.at(-1).to)}, walk to ${en(map, round.goal)}.`
      };
    }
    return progress;
  }

  function evaluateMission(map, round, trail) {
    if (round.rides) return evaluateTransit(map, round, trail);
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
      if (step.ride) legs.push({ start: index - 1, end: index, ride: step.ride });
      else if (last?.heading === step.heading) last.end = index;
      else legs.push({ start: index - 1, end: index, heading: step.heading });
    }
    const phrases = [];
    const firstTurn = trail.findIndex(step => step.heading !== trail[0].heading);
    const add = (mt, en, from, to, tapFrom) => phrases.push({ mt, en, from, to, tapFrom });
    for (const { start, end, heading, ride } of legs) {
      if (ride) {
        const sentence = rideInstruction(map, ride);
        add(sentence.mt, sentence.en, start, end, start);
        continue;
      }
      const from = trail[start].at, goal = trail[end].at;
      const turn = turnFrom(trail[start].heading, heading);
      const turnStart = trail[start].ride ? start : Math.max(0, start - 1);
      // Show the approach when highlighting a turn. Its tap target starts at the corner.
      if (turn === 2) {
        add(`Dur lura ħdejn ${mt(map, from)}.`, `Turn back by ${en(map, from)}.`, turnStart, start + 1, start);
      } else if (turn) {
        const ordinal = start + 1 === firstTurn && from === round?.turnAt ? ordinals[round.ordinal] : null;
        const malteseTurn = ordinal ? `${ordinal.mt} triq` : `mal-kantuniera ħdejn ${mt(map, from)}`;
        const englishTurn = ordinal ? `at the ${ordinal.en} street` : `at the corner by ${en(map, from)}`;
        add(`Dur fuq ${sides[turn].mt} ${malteseTurn}.`, `Turn ${sides[turn].en} ${englishTurn}.`, turnStart, start + 1, start);
      }
      add(`Ibqa' sejjer dritt sakemm tasal ħdejn ${mt(map, goal)}.`,
        `Keep going straight until you reach ${en(map, goal)}.`, start, end, turn ? start + 1 : start);
      const passed = [];
      for (let index = start + 1; index < end; index += 1) passed.push(index);
      const junctions = passed.filter(index => isJunction(map, trail[index].at, heading));
      if (junctions.length) {
        const count = crossings[junctions.length];
        add(`Fit-triq, aqsam ${count.mt}.`, `On the way, cross ${count.en}.`, junctions[0] - 1, junctions.at(-1) + 1);
      }
      for (const index of passed) {
        const sentence = passInstruction(map, trail[index].at);
        add(sentence.mt, sentence.en, index - 1, index + 1);
      }
    }
    return phrases;
  }

  const api = {
    columns, headings, neighbourhoods, rotate, edgeKey, gridNeighbour, neighbour, roadState,
    place, freeRounds, missionRounds, instructions, evaluateMission, routePhrases, departures, serviceTypes, serviceName, passInstruction
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.MaltiRouteGame = api;
})();
