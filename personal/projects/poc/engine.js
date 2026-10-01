/* Open Grass engine: coverage simulation, scoring, and play adjustments.
   Units are yards. x runs 0..30 sideline to sideline, y is yards downfield from the line of scrimmage. */
const DT = 0.05, TMAX = 4.0, FIELD_W = 30, MID = 15;

const PLAYS = [{
  id: 'split-t-z-fake-left-center-out',
  name: 'Split T, Z Fake Left, Center Out',
  formation: 'Split T',
  concept: 'Play-action bootleg right',
  players: [
    { id: 'X', label: 'X', name: 'Orange WR', color: 'orange', start: [5, 0], route: [[5, 14], [3.5, 19]], routeName: 'Go (fade)', delay: 0, speed: 5.6, eligible: true },
    { id: 'C', label: 'C', name: 'Center', color: 'ink', shape: 'star', start: [15, 0], route: [[15, 4], [19.5, 4]], routeName: 'Out (4)', delay: 0.35, speed: 5.0, eligible: true },
    { id: 'Q', label: 'Q', name: 'Quarterback', color: 'red', start: [15, -2.5], route: [[18.5, -4.5]], routeName: 'Bootleg right', delay: 0.15, speed: 3.4, qb: true },
    { id: 'Z', label: 'Z', name: 'Back', color: 'green', start: [15, -5.5], route: [[14.2, -3.4, 0.35], [13.2, -0.5], [12.5, 16]], routeName: 'Fake left, seam', delay: 0.1, speed: 5.2, eligible: true },
    { id: 'Y', label: 'Y', name: 'Purple WR', color: 'purple', start: [24, 0], route: [[24, 18]], routeName: 'Go', delay: 0, speed: 5.6, eligible: true }
  ]
}];

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
    calls: '#13 Three Verts, #21 Deep Cross, #23 Post-Wheel'
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
    calls: '#11 Dragon-Smash, #12 All Hitches, #21 Deep Cross'
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
    calls: '#11 Dragon-Smash, #12 All Hitches, #21 Deep Cross'
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
    calls: '#11 Dragon-Smash, #22 Mesh, #23 Post-Wheel'
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
  play.players.forEach(p => { paths[p.id] = buildPath(p); });
  const elig = play.players.filter(p => p.eligible);
  const qb = play.players.find(p => p.qb);
  const defs = defense.defenders.map(d => ({ ...d, p: [...d.pos], cushion: null, rubbed: new Set(), rubLag: 0 }));
  const frames = [];
  const steps = Math.round(TMAX / DT);
  let pressure = null;
  for (let k = 0; k <= steps; k++) {
    const t = +(k * DT).toFixed(3);
    const off = {};
    play.players.forEach(p => { off[p.id] = posAt(paths[p.id], t); });
    if (k > 0) {
      for (const d of defs) {
        let target = d.p, speed = 0;
        if (d.role === 'rush') { target = off[qb.id]; speed = 5.4; }
        else if (t < 0.25) { /* reading the snap */ }
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
    frames.push({ t, off, def: defs.map(d => [...d.p]) });
    const rusher = defs.find(d => d.role === 'rush');
    if (rusher && pressure === null && dist(rusher.p, off[qb.id]) < 1.2) pressure = t;
  }
  const throwBy = opts.throwBy || 3.0;
  return { frames, pressure, deadline: pressure !== null ? Math.min(throwBy, pressure) : throwBy, roles: defs.map(d => d.role), paths };
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
  const qb = play.players.find(p => p.qb);
  const out = {};
  play.players.filter(p => p.eligible).forEach(r => {
    let best = { v: 0, t: null, eff: 0, pos: null };
    const series = sim.frames.map(f => {
      const o = openness(f.off[r.id], f.off[qb.id], f.def, sim.roles);
      if (f.t >= Math.max(0.7, sim.paths[r.id].window) && f.t <= sim.deadline + 1e-6) {
        const v = throwValue(o.eff, f.off[r.id][1]);
        if (v > best.v) best = { v, t: f.t, eff: o.eff, pos: f.off[r.id], lane: o.lane };
      }
      return o.eff;
    });
    out[r.id] = { best, series };
  });
  const order = Object.keys(out).sort((a, b) => out[b].best.v - out[a].best.v);
  const score = (out[order[0]]?.best.v || 0) + 0.35 * (out[order[1]]?.best.v || 0);
  return { receivers: out, order, score, grade: gradeFor(score) };
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
      if (name === pl.routeName) return;
      list.push({ key: R.key + tag, name, fam: R.fam, route: [...lead, ...pts] });
    });
  }
  return list;
}

function suggest(play, covId, opts, baseScore) {
  const out = [];
  play.players.filter(p => p.eligible).forEach(pl => {
    let best = null;
    for (const v of routeVariants(pl)) {
      const trial = clone(play);
      const tp = trial.players.find(p => p.id === pl.id);
      tp.route = v.route; tp.routeName = v.name;
      const r = runPlay(trial, covId, opts);
      const gain = r.ev.score - baseScore;
      if (!best || gain > best.gain) best = { id: pl.id, from: pl.routeName, to: v.name, fam: v.fam, route: v.route, gain, ev: r.ev, tip: TIPS[covId][v.fam] };
    }
    if (best && best.gain > 0.06) out.push(best);
  });
  return out.sort((a, b) => b.gain - a.gain).slice(0, 3);
}

if (typeof module !== 'undefined') module.exports = { PLAYS, COVERAGES, COV_ORDER, runPlay, suggest, statusFor, routeVariants };
