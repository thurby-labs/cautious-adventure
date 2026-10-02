/* Open Grass engine: coverage simulation, scoring, and play adjustments.
   Units are yards. x runs 0..30 sideline to sideline, y is yards downfield from the line of scrimmage. */
const DT = 0.05, TMAX = 4.0, TMAX_RUN = 6.0, FIELD_W = 30, MID = 15;
const playTime = play => play.handoff && !play.handoff.thenPass ? TMAX_RUN : TMAX;

const SNAP_T = 0.2, PASS_SPEED = 13, PITCH_SPEED = 8;

const COVERAGES = {
  c1: {
    id: 'c1', name: 'Cover 1', short: 'C1', blitzer: 'LB',
    defenders: [
      { id: 'CBL', label: 'CB', pos: [5, 5], zone: { c: [5, 6], rx: 4.5, ry: 3.5 } },
      { id: 'SS', label: 'SS', pos: [11, 5], zone: { c: [10.5, 6.5], rx: 3.5, ry: 3.5 } },
      { id: 'LB', label: 'LB', pos: [17, 5], zone: { c: [17.5, 6.5], rx: 3.5, ry: 3.5 } },
      { id: 'CBR', label: 'CB', pos: [25, 5], zone: { c: [25, 6], rx: 4.5, ry: 3.5 } },
      { id: 'FS', label: 'FS', pos: [15, 12], zone: { c: [15, 14], rx: 9, ry: 6 }, deep: true }
    ],
    spot: 'One deep safety. The other four sit about 5 yards off the ball.',
    strength: 'Short passes and the run.',
    weakness: 'Covering more than one deep route.',
    beat: 'Buy time and send two or more deep routes so the lone safety has to pick one.',
    blitz: 'QB spots the blitzer before the snap.',
    concepts: ['Three receivers vertical to outnumber the lone safety', 'Two deep routes with a crosser underneath', 'A post with a wheel up the sideline behind it']
  },
  c2: {
    id: 'c2', name: 'Cover 2', short: 'C2', blitzer: 'LB',
    defenders: [
      { id: 'CBL', label: 'CB', pos: [4.5, 5], zone: { c: [4.5, 5.5], rx: 3.5, ry: 3.5 } },
      { id: 'LB', label: 'LB', pos: [15, 5], zone: { c: [15, 6.5], rx: 3.5, ry: 3.5 } },
      { id: 'CBR', label: 'CB', pos: [25.5, 5], zone: { c: [25.5, 5.5], rx: 3.5, ry: 3.5 } },
      { id: 'FS', label: 'FS', pos: [9, 12], zone: { c: [8.5, 14], rx: 6.5, ry: 6 }, deep: true },
      { id: 'SS', label: 'SS', pos: [21, 12], zone: { c: [21.5, 14], rx: 6.5, ry: 6 }, deep: true }
    ],
    spot: 'Two deep safeties. Corners play about 5 yards off.',
    strength: 'Balanced. Takes away the big play.',
    weakness: 'The middle of the field, especially when the LB blitzes.',
    beat: 'Throw short into the holes between the corners and the LB, then run after the catch.',
    blitz: 'QB spots the blitzer before the snap.',
    concepts: ['Split field: slant-flat on one side, hitch-corner on the other', 'Every receiver runs a 5-yard hitch', 'Flood one side with a go, a crosser and a flat']
  },
  c3: {
    id: 'c3', name: 'Cover 3', short: 'C3', blitzer: 'FS',
    defenders: [
      { id: 'WS', label: 'WS', pos: [4.5, 12], zone: { c: [4.5, 14], rx: 5, ry: 6 }, deep: true },
      { id: 'FS', label: 'FS', pos: [15, 12.5], zone: { c: [15, 14], rx: 5, ry: 6 }, deep: true },
      { id: 'SS', label: 'SS', pos: [25.5, 12], zone: { c: [25.5, 14], rx: 5, ry: 6 }, deep: true },
      { id: 'CBL', label: 'CB', pos: [10, 6], zone: { c: [10, 6.5], rx: 4.5, ry: 3.5 } },
      { id: 'CBR', label: 'CB', pos: [20, 6], zone: { c: [20, 6.5], rx: 4.5, ry: 3.5 } }
    ],
    spot: 'Three deep defenders across the field.',
    strength: 'Deep passes and long catch-and-runs.',
    weakness: 'Large holes in the short zones, especially the flats.',
    beat: 'Throw short to players who can make a defender miss.',
    blitz: 'QB spots the blitzer before the snap.',
    concepts: ['Split field: slant-flat on one side, hitch-corner on the other', 'Quick hitches into the flats', 'Flood one side with a go, a crosser and a flat']
  },
  man: {
    id: 'man', name: 'Man to Man', short: 'Man', blitzer: 'FS',
    defenders: [
      { id: 'CBL', label: 'CB', man: true },
      { id: 'LB', label: 'LB', man: true },
      { id: 'SS', label: 'SS', man: true },
      { id: 'CBR', label: 'CB', man: true },
      { id: 'FS', label: 'FS', pos: [15, 12], zone: { c: [15, 13], rx: 10, ry: 6 }, deep: true }
    ],
    spot: 'Defenders call out their man and line up close to the ball.',
    strength: 'Tough to beat when their athletes are better.',
    weakness: 'High risk. One missed step can be a touchdown.',
    beat: 'Crossing and rub routes free a receiver in space.',
    blitz: 'The fifth defender either blitzes or plays deep safety.',
    concepts: ['Slant-flat with the two routes crossing close (a rub)', 'Two shallow crossers passing close to each other', 'A post with a wheel up the sideline behind it']
  }
};
const COV_ORDER = ['c1', 'c2', 'c3', 'man'];

/* Coaching tips used to explain suggested adjustments, by coverage and route family. */
const TIPS = {
  c1: { deep: 'Cover 1 has a single safety. A second deep route on the other side forces him to pick one.',
        short: 'Cover 1 keeps four defenders underneath, so short throws only open up when one of them blitzes.',
        middle: 'A route that breaks behind the underneath layer gets in front of the lone safety.' },
  c2: { deep: 'The two safeties split the deep field. The seam between them is open if the LB does not carry it.',
        short: 'Cover 2 corners sit in the flats, so quick outside throws need the corner to bite inside.',
        middle: 'The hole between the corner and the LB is the soft spot in Cover 2.' },
  c3: { deep: 'Three deep defenders take away vertical routes in Cover 3.',
        short: 'Cover 3 leaves the flats empty. Quick outside throws beat it.',
        middle: 'Two underneath defenders cannot cover three short routes. Flood the hook zones.' },
  man: { deep: 'A straight vertical lets a man defender run in-phase. It only wins with a faster athlete.',
         short: 'A hard break makes a man defender react, and that reaction is your separation.',
         middle: 'Crossers and rubs make man defenders fight through traffic.' }
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const clone = o => JSON.parse(JSON.stringify(o));

function turnAngle(a, b, c) {
  const v1 = [b[0] - a[0], b[1] - a[1]], v2 = [c[0] - b[0], c[1] - b[1]];
  const m = Math.hypot(...v1) * Math.hypot(...v2);
  if (!m) return 0;
  return Math.acos(clamp((v1[0] * v2[0] + v1[1] * v2[1]) / m, -1, 1)) * 180 / Math.PI;
}

/* Turn a player's route into timed keyframes; sharp cuts cost a beat and are remembered (man defenders lose a step there). */
function buildPath(pl) {
  const pts = [[pl.start[0], pl.start[1], 0], ...pl.route.map(p => [p[0], p[1], p[2] || 0])];
  let t = pl.delay || 0;
  const keys = [{ t: 0, p: [pts[0][0], pts[0][1]] }, { t, p: [pts[0][0], pts[0][1]] }];
  const cuts = [], ptTimes = [t];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (i >= 2 && turnAngle(pts[i - 2], a, b) > 45) { t += 0.12; keys.push({ t, p: [a[0], a[1]] }); cuts.push(t); }
    t += dist(a, b) / pl.speed;
    keys.push({ t, p: [b[0], b[1]] });
    ptTimes.push(t);
    if (b[2]) { t += b[2]; keys.push({ t, p: [b[0], b[1]] }); }
  }
  return { keys, cuts, ptTimes, window: catchWindow(pts, ptTimes, pl) };
}

/* When a receiver starts looking for the ball: out of the first break, or 7 yards into a straight vertical. */
function catchWindow(pts, ptTimes, pl) {
  const i = pts.findIndex((p, k) => k > 0 && p[1] >= 0);
  if (i < 0) return Infinity;
  const prev = pts[i - 1];
  const vertical = i === pts.length - 1 && pts[i][1] >= 10 && Math.abs(pts[i][0] - prev[0]) < 4;
  if (!vertical) return ptTimes[i];
  const y0 = Math.max(prev[1], 0), frac = clamp((7 - prev[1]) / (pts[i][1] - prev[1]), 0, 1);
  return ptTimes[i - 1] + (ptTimes[i] - ptTimes[i - 1]) * frac + (y0 > 7 ? 0 : 0);
}

function posAt(path, t) {
  const k = path.keys;
  if (t <= k[0].t) return [...k[0].p];
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i].t) {
      const span = k[i].t - k[i - 1].t || 1;
      const u = (t - k[i - 1].t) / span;
      return [k[i - 1].p[0] + (k[i].p[0] - k[i - 1].p[0]) * u, k[i - 1].p[1] + (k[i].p[1] - k[i - 1].p[1]) * u];
    }
  }
  return [...k[k.length - 1].p];
}

function clampToEllipse(p, z) {
  const dx = p[0] - z.c[0], dy = p[1] - z.c[1];
  const n = Math.sqrt((dx / z.rx) ** 2 + (dy / z.ry) ** 2);
  return n <= 1 ? [...p] : [z.c[0] + dx / n, z.c[1] + dy / n];
}

function buildDefense(covId, play, opts = {}) {
  const T = COVERAGES[covId];
  const defs = T.defenders.map(d => ({ ...clone(d), role: d.man ? 'man' : 'zone' }));
  if (covId === 'man') {
    const elig = play.players.filter(p => p.eligible).slice().sort((a, b) => a.start[0] - b.start[0] || b.start[1] - a.start[1]);
    const mids = elig.slice(1, -1).sort((a, b) => b.start[1] - a.start[1]);
    const assign = { CBL: elig[0], CBR: elig[elig.length - 1], LB: mids[0], SS: mids[1] };
    defs.forEach(d => {
      if (d.role !== 'man') return;
      const r = assign[d.id];
      if (!r) { d.role = 'zone'; d.pos = [MID, 8]; d.zone = { c: [MID, 8], rx: 5, ry: 4 }; return; }
      d.man = r.id;
      d.pos = r.start[1] >= -0.5 ? [r.start[0], 4.5] : [r.start[0] + (r.start[0] <= MID ? -3 : 3), 5];
    });
  }
  if (opts.blitz) {
    const b = defs.find(d => d.id === T.blitzer);
    if (b) { b.role = 'rush'; b.pos = [MID, 7]; }
  }
  const nudges = opts.nudges || {};
  defs.forEach(d => {
    const n = nudges[d.id];
    if (!n || d.role === 'rush') return;
    d.pos = [d.pos[0] + n[0], d.pos[1] + n[1]];
    if (d.zone) d.zone.c = [d.zone.c[0] + n[0], d.zone.c[1] + n[1]];
  });
  return { id: covId, defenders: defs };
}

function simulate(play, defense, opts = {}) {
  const paths = {};
  const ho = play.handoff;
  play.players.forEach(p => {
    // the ball carrier keeps running upfield after the drawn path ends
    const pl = ho && ho.to === p.id && !ho.thenPass ? { ...p, route: [...p.route, [p.route[p.route.length - 1][0], 40]] } : p;
    paths[p.id] = buildPath(pl);
  });
  let ballRun = null;
  if (ho) {
    // the exchange happens when the carrier reaches the spot, or when a pitch can get there, whichever is later
    const tReach = paths[ho.to].ptTimes[ho.at + 1];
    const qbAt = posAt(paths[play.players.find(p => p.qb).id], tReach), spot = posAt(paths[ho.to], tReach);
    const d = dist(qbAt, spot);
    ballRun = { id: ho.to, th: d > 1.5 ? Math.max(tReach, SNAP_T + d / PITCH_SPEED) : tReach, tackle: null, thenPass: !!ho.thenPass };
  }
  const elig = play.players.filter(p => p.eligible);
  const qb = play.players.find(p => p.qb);
  // fakes and decoys: players drawn dashed or marked fake, other than the ball carrier
  const fakers = ho ? play.players.filter(p => (p.dashed || p.fake) && p.id !== ho.to) : [];
  const defs = defense.defenders.map(d => ({ ...d, p: [...d.pos], cushion: null, rubbed: new Set(), rubLag: 0 }));
  const frames = [];
  const steps = Math.round(playTime(play) / DT);
  let pressure = null;
  for (let k = 0; k <= steps; k++) {
    const t = +(k * DT).toFixed(3);
    const off = {};
    play.players.forEach(p => { off[p.id] = posAt(paths[p.id], t); });
    if (ballRun && ballRun.tackle) off[ballRun.id] = [...ballRun.tackle.pos];
    const carrier = ballRun && t >= ballRun.th ? off[ballRun.id] : null;
    if (k > 0) {
      for (const d of defs) {
        let target = d.p, speed = 0;
        if (carrier && d.bites === undefined) {
          // at the exchange, a defender whose nearest offensive player is a faker bites on the fake for a beat
          let near = null, nd = Infinity;
          play.players.forEach(p => { if (!p.qb || fakers.includes(p)) { const q = dist(off[p.id], d.p); if (q < nd) { nd = q; near = p; } } });
          d.bites = fakers.includes(near) ? near.id : null;
        }
        // youth defenders take a moment to recognize the run; biting on a fake costs more
        const read = (d.role === 'man' ? 0.8 : d.deep ? 0.6 : 0.5) + (d.bites ? 0.8 : 0);
        const chases = !ballRun || !ballRun.thenPass || d.role === 'rush' || (d.role === 'zone' && !d.deep);
        const sees = carrier && chases && t >= ballRun.th + read;
        if (d.role === 'rush') { target = carrier || off[qb.id]; speed = 5.4; }
        else if (t < 0.25) { /* reading the snap */ }
        else if (carrier && d.bites && !sees && chases) { target = off[d.bites]; speed = 5.3; }
        else if (sees) {
          // run recognized: take a pursuit angle on the ball carrier
          const ahead = ballRun.tackle ? carrier : posAt(paths[ballRun.id], t + 0.35);
          target = ahead; speed = d.deep ? 4.8 : 5.1;
        }
        else if (d.role === 'man') {
          const rp = paths[d.man];
          for (const o of play.players) {
            if (o.id === d.man || o.qb || d.rubbed.has(o.id)) continue;
            if (dist(off[o.id], d.p) < 1.3) { d.rubbed.add(o.id); d.rubLag += 0.45; }
          }
          const cutsPassed = rp.cuts.filter(c => c <= t).length;
          const lag = Math.min(1.3, 0.28 + 0.32 * cutsPassed + d.rubLag);
          const r0 = play.players.find(p => p.id === d.man).start;
          if (!d.cushion) d.cushion = [d.pos[0] - r0[0], d.pos[1] - r0[1]];
          const fade = Math.max(0, 1 - t / 1.2);
          const tp = posAt(rp, Math.max(0, t - lag));
          target = [tp[0] + d.cushion[0] * fade, tp[1] + d.cushion[1] * fade];
          speed = 6.0;
        } else {
          const z = d.zone;
          let best = null, bd = Infinity;
          for (const r of elig) {
            const rp = off[r.id];
            if (rp[1] < -0.5) continue;
            const nd = ((rp[0] - z.c[0]) / z.rx) ** 2 + ((rp[1] - z.c[1]) / z.ry) ** 2;
            if (nd > 1.7) continue;
            const s = d.deep ? -rp[1] : dist(rp, d.p);
            if (s < bd) { bd = s; best = rp; }
          }
          if (!best) target = z.c;
          else if (d.deep) target = [clamp(best[0], z.c[0] - z.rx, z.c[0] + z.rx), Math.max(best[1] + 2.2, z.c[1] - z.ry * 0.5)];
          else target = clampToEllipse(best, z);
          speed = d.deep ? 4.8 : 5.0;
        }
        const dx = target[0] - d.p[0], dy = target[1] - d.p[1], m = Math.hypot(dx, dy);
        const step = speed * DT;
        if (m > 0) d.p = m <= step ? [...target] : [d.p[0] + dx / m * step, d.p[1] + dy / m * step];
      }
    }
    if (carrier && !ballRun.tackle) {
      const i = defs.findIndex(d => dist(d.p, carrier) < 1.0);
      if (i >= 0) ballRun.tackle = { t, pos: [...carrier], by: defs[i].label };
    }
    frames.push({ t, off, def: defs.map(d => [...d.p]) });
    const rusher = defs.find(d => d.role === 'rush');
    if (!ballRun && rusher && pressure === null && dist(rusher.p, off[qb.id]) < 1.2) pressure = t;
  }
  const throwBy = opts.throwBy || 3.0;
  let deadline = pressure !== null ? Math.min(throwBy, pressure) : throwBy;
  if (ballRun && ballRun.thenPass) deadline = ballRun.tackle ? ballRun.tackle.t : Math.min(playTime(play), ballRun.th + 2.2);
  return { frames, pressure, deadline, roles: defs.map(d => d.role), paths, ballRun };
}

/* How open is a receiver at one moment: space to the nearest cover defender, minus anyone sitting in the throwing lane. */
function openness(rp, qp, defPos, roles) {
  let sep = Infinity, lane = 0;
  const vx = rp[0] - qp[0], vy = rp[1] - qp[1], L2 = vx * vx + vy * vy || 1;
  defPos.forEach((p, i) => {
    if (roles[i] === 'rush') return;
    sep = Math.min(sep, dist(rp, p));
    const u = ((p[0] - qp[0]) * vx + (p[1] - qp[1]) * vy) / L2;
    if (u > 0.15 && u < 0.92) {
      const d = dist(p, [qp[0] + vx * u, qp[1] + vy * u]);
      if (d < 1.0) lane = Math.max(lane, (1.0 - d) * 2.5);
    }
  });
  return { sep, lane, eff: sep - lane };
}

function throwValue(eff, y) {
  const q = clamp((eff - 1) / 4, 0, 1);
  let v = q * (0.55 + 0.45 * clamp(y, 0, 12) / 12);
  if (y < 0) v *= 0.5;
  return v;
}

function evaluate(play, sim) {
  if (sim.ballRun && !sim.ballRun.thenPass) {
    const br = sim.ballRun, last = sim.frames[sim.frames.length - 1];
    const end = br.tackle ? br.tackle.pos : last.off[br.id];
    const yards = end[1];
    const score = clamp(yards / 8, -0.2, 1.4);
    return {
      run: { id: br.id, yards, th: br.th, t: br.tackle ? br.tackle.t : null, by: br.tackle ? br.tackle.by : null, pos: end },
      receivers: { [br.id]: { best: { v: score, t: br.th, eff: yards, pos: end }, series: [] } },
      order: [br.id], score, grade: gradeFor(score)
    };
  }
  const trick = sim.ballRun && sim.ballRun.thenPass ? { passer: sim.ballRun.id, th: sim.ballRun.th } : null;
  const passer = trick ? trick.passer : play.players.find(p => p.qb).id;
  const tMin = trick ? trick.th + 0.3 : 0.7;
  const out = {};
  play.players.filter(p => p.eligible && p.id !== passer).forEach(r => {
    let best = { v: 0, t: null, eff: 0, pos: null };
    const series = sim.frames.map(f => {
      const o = openness(f.off[r.id], f.off[passer], f.def, sim.roles);
      if (f.t >= Math.max(tMin, sim.paths[r.id].window) && f.t <= sim.deadline + 1e-6) {
        const v = throwValue(o.eff, f.off[r.id][1]);
        if (v > best.v) best = { v, t: f.t, eff: o.eff, pos: f.off[r.id], lane: o.lane };
      }
      return o.eff;
    });
    out[r.id] = { best, series };
  });
  const order = Object.keys(out).sort((a, b) => out[b].best.v - out[a].best.v);
  const score = (out[order[0]]?.best.v || 0) + 0.35 * (out[order[1]]?.best.v || 0);
  return { receivers: out, order, score, grade: gradeFor(score), trick, passer };
}

function gradeFor(s) {
  if (s >= 1.0) return 'A';
  if (s >= 0.8) return 'B';
  if (s >= 0.6) return 'C';
  if (s >= 0.4) return 'D';
  return 'F';
}

function statusFor(eff) { return eff >= 3 ? 'open' : eff >= 1.5 ? 'tight' : 'covered'; }

function runPlay(play, covId, opts) {
  const def = buildDefense(covId, play, opts);
  const sim = simulate(play, def, opts);
  return { def, sim, ev: evaluate(play, sim) };
}

/* Route library for suggested adjustments. dx is relative to the receiver's alignment; y is absolute depth. */
const ROUTES = [
  { key: 'hitch', name: 'Hitch (5)', fam: 'short', pts: (i, o) => [[0, 5.5], [i * 0.7, 4.7]] },
  { key: 'out', name: 'Out (5)', fam: 'short', pts: (i, o) => [[0, 5], [o * 5, 5]] },
  { key: 'flat', name: 'Flat (5)', fam: 'short', inside: true, pts: (i, o) => [[o * 3, 2], [o * 7, 5]] },
  { key: 'slant', name: 'Slant', fam: 'middle', pts: (i, o) => [[0, 2], [i * 5, 7]] },
  { key: 'in', name: 'In (5)', fam: 'middle', pts: (i, o) => [[0, 5], [i * 7, 5]] },
  { key: 'cross', name: 'Crosser (10)', fam: 'middle', pts: (i, o) => [[0, 2], [i * 5, 6], [i * 13, 10]] },
  { key: 'corner', name: 'Corner (7)', fam: 'deep', pts: (i, o) => [[0, 7], [o * 5, 12]] },
  { key: 'post', name: 'Post (7)', fam: 'deep', pts: (i, o) => [[0, 7], [i * 5, 14]] },
  { key: 'go', name: 'Go', fam: 'deep', pts: (i, o) => [[0, 18]] },
  { key: 'wheel', name: 'Wheel', fam: 'deep', inside: true, pts: (i, o) => [[o * 3, 0.5], [o * 6, 3], [o * 6.5, 15]] }
];

function routeVariants(pl) {
  const lead = pl.route.filter(p => p[1] < 0);            // keep any backfield action, like a play fake
  const base = lead.length ? lead[lead.length - 1] : pl.start;
  const bx = base[0];
  const central = Math.abs(bx - MID) < 4;
  const dirs = central ? [[-1, 1, ' right'], [1, -1, ' left']] : [[bx < MID ? 1 : -1, bx < MID ? -1 : 1, '']];
  const list = [];
  for (const R of ROUTES) {
    if (R.inside && !central) continue;
    const straight = R.key === 'go' || R.key === 'hitch';
    (straight ? dirs.slice(0, 1) : dirs).forEach(([i, o, tag]) => {
      const pts = R.pts(i, o).map(([dx, y]) => [clamp(bx + dx, 1, FIELD_W - 1), y]);
      const name = R.name + (straight ? '' : tag);
      if (name === pl.routeName || R.name.split(' (')[0] === pl.routeName.split(' (')[0]) return;
      list.push({ key: R.key + tag, name, fam: R.fam, route: [...lead, ...pts] });
    });
  }
  return list;
}

function runLanes(pl, at) {
  const lead = pl.route.slice(0, at + 1);
  const [hx, hy] = lead[lead.length - 1];
  const cx = x => clamp(x, 1.5, 28.5);
  return [
    { name: 'Sweep right', route: [[cx(hx + 6), Math.min(hy + 2, -1)], [27.5, 2], [27.5, 12]], dir: 1 },
    { name: 'Sweep left', route: [[cx(hx - 6), Math.min(hy + 2, -1)], [2.5, 2], [2.5, 12]], dir: -1 },
    { name: 'Off-tackle right', route: [[cx(hx + 3), 0.5], [cx(hx + 4.5), 12]], dir: 1 },
    { name: 'Off-tackle left', route: [[cx(hx - 3), 0.5], [cx(hx - 4.5), 12]], dir: -1 },
    { name: 'Straight upfield', route: [[hx, 0.5], [hx, 12]], dir: 0 }
  ].filter(l => l.name !== pl.routeName).map(l => ({ ...l, route: [...lead, ...l.route], hx }));
}

function laneTip(def, hx, dir) {
  if (!dir) return 'Hit it straight up the field before the defense can flow to the ball.';
  const side = def.defenders.filter(d => d.role !== 'rush' && d.pos[1] < 9 && (dir > 0 ? d.pos[0] > hx : d.pos[0] < hx)).length;
  const word = dir > 0 ? 'right' : 'left';
  return `Only ${side} short defender${side === 1 ? '' : 's'} line${side === 1 ? 's' : ''} up to the ${word} of the handoff. Run where the defense is thin.`;
}

function suggest(play, covId, opts, baseScore) {
  const out = [];
  const ho = play.handoff;
  const def0 = buildDefense(covId, play, opts);
  const tryChange = (pl, v) => {
    const trial = clone(play);
    const tp = trial.players.find(p => p.id === pl.id);
    tp.route = v.route; tp.routeName = v.name;
    return runPlay(trial, covId, opts);
  };
  play.players.filter(p => p.eligible).forEach(pl => {
    let best = null;
    const isCarrier = ho && ho.to === pl.id;
    if (isCarrier && ho.thenPass) return;            // the trick passer keeps their path
    const variants = isCarrier ? runLanes(pl, ho.at) : routeVariants(pl);
    for (const v of variants) {
      const r = tryChange(pl, v);
      const gain = r.ev.score - baseScore;
      if (!best || gain > best.gain) {
        const tip = isCarrier ? laneTip(def0, v.hx, v.dir)
          : ho && !ho.thenPass ? 'A better decoy. This route pulls a defender away from the ball carrier.'
          : TIPS[covId][v.fam];
        best = { id: pl.id, from: pl.routeName, to: v.name, fam: v.fam, route: v.route, gain, ev: r.ev, tip };
      }
    }
    if (best && best.gain > 0.06) out.push(best);
  });
  return out.sort((a, b) => b.gain - a.gain).slice(0, 3);
}


