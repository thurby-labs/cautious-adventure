/* Play library: the coach's 15-play catalog. 1-8 are the wristband plays, 9-15 the alternates (names are the coach's own).
   Units: yards. x 0..30 sideline to sideline (ball usually at 15), y = yards past the line of scrimmage.
   Route points are [x, y] or [x, y, holdSeconds]. A star (shape: 'star') marks the player the diagram highlights.
   motion: pre-snap path ending at the alignment. dashed: fake or ball-carrier path.
   handoff: { to, at } ball is handed or pitched to `to` at route point index `at`; thenPass: that player throws. */
const QB = (x, y, route, routeName, extra = {}) => ({ id: 'Q', label: 'Q', name: 'Quarterback', color: 'red', start: [x, y], route, routeName, delay: 0.15, speed: 3.4, qb: true, ...extra });
const P = (id, color, name, start, route, routeName, extra = {}) => ({ id, label: id, name, color, start, route, routeName, delay: id === 'C' ? 0.35 : 0, speed: id === 'C' ? 5.0 : 5.6, eligible: true, ...extra });
const X_ = (s, r, n, e) => P('X', 'orange', 'Orange', s, r, n, e);
const Y_ = (s, r, n, e) => P('Y', 'purple', 'Purple', s, r, n, e);
const Z_ = (s, r, n, e) => P('Z', 'green', 'Green', s, r, n, e);
const C_ = (s, r, n, e) => P('C', 'ink', 'Center', s, r, n, e);

const SERIES = { wristband: 'Wristband (1-8)', alternates: 'Alternates (9-15)' };

const PLAYS = [
{ num: 1, series: 'wristband', id: 'p6', name: 'Split T, Z Left Hustle', type: 'pass', concept: 'Fake hustle left, Y under', players: [
  X_([2.5, 0], [[2.8, 9], [4.3, 17]], 'Go'),
  Y_([12.2, 0], [[15, -1.3], [18.5, -0.5], [21, 2.3]], 'Under right'),
  C_([15, 0], [[15, 4], [17, 7], [20, 8.3]], 'Bend right'),
  QB(15, -4.2, [[15, -4.8]], 'Drop'),
  Z_([19.1, -4.1], [[14, -3], [10, 0.5], [7.4, 3.6]], 'Hustle left', { shape: 'star', speed: 5.4 }) ] },

{ num: 2, series: 'wristband', id: 'p7', name: 'Split T, Y Cross Left', type: 'pass', concept: 'Rollout left, shallow cross', players: [
  X_([4.3, 0], [[4.3, 9], [3, 17]], 'Go (fade)'),
  C_([15, 0], [[15, 17]], 'Seam'),
  QB(15, -4, [[9, -4.6]], 'Roll left'),
  Z_([19, -4], [[19.5, -0.5], [22, 2.3], [28, 3.8]], 'Arrow right', { delay: 0.1, speed: 5.4 }),
  Y_([27.5, 0], [[23.5, 2.5], [16, 4.5], [8, 5]], 'Shallow cross', { shape: 'star' }) ] },

{ num: 3, series: 'wristband', id: 'p1', name: 'Split T, Z Fake Left, Center Out', type: 'pass', concept: 'Play-action bootleg right', players: [
  X_([5, 0], [[5, 14], [3.5, 19]], 'Go (fade)'),
  C_([15, 0], [[15, 4], [19.5, 4]], 'Out (4)', { shape: 'star' }),
  QB(15, -2.5, [[18.5, -4.5]], 'Bootleg right'),
  Z_([15, -5.5], [[14.2, -3.4, 0.35], [13.2, -0.5], [12.5, 16]], 'Fake left, seam', { delay: 0.1, speed: 5.2 }),
  Y_([24, 0], [[24, 18]], 'Go') ] },

{ num: 4, series: 'wristband', id: 'p15', name: 'Split T, Z Motion Left, Z Flat', type: 'pass', concept: 'Motion to the flat', players: [
  X_([4.9, 0], [[4.9, 9], [2.7, 17]], 'Go (fade)'),
  C_([15, 0], [[15, 7], [16.8, 5.5]], 'Stop & out'),
  QB(15, -4.4, [[15, -5.2]], 'Drop'),
  Z_([11, -2], [[11, 0.5], [10, 2.5], [7.5, 3.5]], 'Flat left', { shape: 'star', motion: [[20.3, -2.3]] }),
  Y_([25.6, 0], [[25.6, 9], [21.5, 15]], 'Post') ] },

{ num: 5, series: 'wristband', id: 'p44', name: 'Split-Back Y Sweep Left (Z Fake Right)', type: 'run', concept: 'Sweep left, fake right', handoff: { to: 'Y', at: 0 }, players: [
  X_([3.8, 0], [[3.6, 9], [2.2, 17]], 'Go (fade)'),
  C_([15, 0], [[19.4, 4.1], [21, 6]], 'Release right'),
  QB(15, -2.1, [[15.2, -3.2]], 'Pitch'),
  Z_([10.7, -4.9], [[19, -1.4], [23, 0.5]], 'Fake sweep right', { dashed: true, speed: 5.4 }),
  Y_([19.4, -5], [[15.2, -4.6], [12.6, -1.4], [11.5, 3.2], [11.2, 8]], 'Sweep left', { shape: 'star', speed: 5.4 }) ] },

{ num: 6, series: 'wristband', id: 'p50', name: 'Split-Back X In', type: 'pass', concept: 'Split-back flood left', players: [
  X_([7.1, 0], [[7.1, 4], [5.2, 6.5]], 'Stem, angle (6)', { shape: 'star' }),
  C_([15, 0], [[15, 5.1], [12.1, 5.3]], 'Hook left (5)'),
  QB(15, -2, [[15, -3]], 'Drop'),
  Z_([10.8, -4.8], [[10.8, 0], [9.5, 1.5], [5.5, 1.7]], 'Flat left', { delay: 0.1, speed: 5.4 }),
  Y_([19.2, -4.8], [[19.2, 1.3], [20.2, 4.5], [21.7, 6.5]], 'Bend right', { delay: 0.1, speed: 5.4 }) ] },

{ num: 7, series: 'wristband', id: 'p11', name: 'Split T, Z Slot, X Post', type: 'pass', concept: 'Post over shallow', players: [
  X_([4.3, 0], [[4.3, 5.8], [12.4, 10.5]], 'Post (6)', { shape: 'star' }),
  C_([15, 0], [[15, 2], [13, 3.5], [7.5, 3.8]], 'Shallow left'),
  QB(15, -4.4, [[15, -5.2]], 'Drop'),
  Z_([20.8, -1.5], [[20.8, 5.6], [28, 5.6]], 'Out (5)'),
  Y_([25.2, 0], [[25.2, 9], [23.2, 7.5]], 'Curl (9)') ] },

{ num: 8, series: 'wristband', id: 'p18', name: 'Twins Right, Z Pitch+Pass, C Slant', type: 'trick', concept: 'Pitch, then Z throws', handoff: { to: 'Z', at: 0, thenPass: true }, players: [
  C_([10.4, 0], [[18.6, 5]], 'Slant right'),
  QB(10.3, -2.7, [[10.8, -3.6]], 'Pitch right'),
  X_([16, 0], [[13.5, -0.8], [9, -0.6], [4, 3.7]], 'Jet left (decoy)', { fake: true }),
  Z_([10.3, -5.5], [[15.4, -5.3], [21, -3.5], [23.5, -1.2]], 'Pitch sweep right', { shape: 'star', dashed: true, speed: 5.4 }),
  Y_([21.5, 0], [[22, 8], [23.3, 17]], 'Go') ] },

{ num: 9, series: 'alternates', id: 'p35', name: 'Countertop', type: 'run', concept: 'Counter right', handoff: { to: 'X', at: 1 }, players: [
  Y_([7.8, 0], [[6.5, 4], [5, 11.3], [5, 17]], 'Go'),
  C_([15, 0], [[14, 4], [10.5, 11.3]], 'Bend left'),
  QB(15, -3, [[15.2, -3.3]], 'Hand off'),
  Z_([18.9, -1.4], [[12, -1.4], [9, 0], [8.3, 4], [8.3, 11.3]], 'Fake left (motion)', { dashed: true, motion: [[26.7, -1.4]], speed: 5.4 }),
  X_([15, -7], [[12.3, -7], [15.5, -3.6], [21.3, 0], [23.4, 11.3]], 'Counter right', { shape: 'star', speed: 5.4 }) ] },

{ num: 10, series: 'alternates', id: 'p20', name: 'Trips Right, X Motion, X Wheel', type: 'pass', concept: 'Motion wheel', players: [
  C_([15, 0], [[15, 2.2], [10.8, 2.6]], 'Out left (short)'),
  Y_([19.1, 0], [[19.6, 9], [20, 17]], 'Go'),
  Z_([23, 0], [[23, 7.9], [25.6, 9.2]], 'Corner right'),
  X_([12, -1.7], [[11, -0.5], [8.5, 2.2], [6.5, 5], [4.9, 12], [4.6, 17]], 'Wheel left', { shape: 'star', motion: [[26.6, 0], [25, -1.7]] }),
  QB(15, -4.3, [[15, -4.8]], 'Drop') ] },

{ num: 11, series: 'alternates', id: 'p51', name: 'Bad Habit', type: 'pass', concept: 'Three-level stack left', players: [
  Y_([3.7, 0], [[3.7, 7.2], [14.1, 9.7]], 'Post (7)'),
  Z_([6.3, 0], [[6.3, 5.5], [0.8, 5.5]], 'Out left (5)'),
  X_([8.5, 0], [[8.5, 5.5], [15.1, 5.5]], 'In right (5)'),
  C_([15, 0], [[15, 2.2], [10, 2.2]], 'In left (2)'),
  QB(15, -2, [[15, -3]], 'Drop') ] },

{ num: 12, series: 'alternates', id: 'p52', name: 'Split T, Z Fake, X Reverse', type: 'run', concept: 'Fake dive, reverse left', handoff: { to: 'X', at: 1 }, players: [
  Y_([5.7, 0], [[5.2, 9], [3.5, 17]], 'Go (fade)'),
  C_([15, 0], [[15, 17]], 'Seam'),
  QB(15, -2, [[15.3, -2.6, 0.4]], 'Fake, hand off'),
  Z_([15.5, -5.6], [[16.5, -2], [18.5, 4.2]], 'Fake dive', { speed: 5.4, fake: true }),
  X_([24, 0], [[20, -2.2], [15.8, -2.8], [11, -2], [7, 0.5], [5.8, 7]], 'Reverse left', { shape: 'star', speed: 5.6 }) ] },

{ num: 13, series: 'alternates', id: 'p36', name: '3D', type: 'pass', concept: 'Levels: sit, cross, swing', players: [
  X_([8.4, 0], [[8.4, 9.6], [15.2, 13], [26, 17]], 'Deep cross right'),
  Y_([12.3, 0], [[12.3, 8.3]], 'Sit (8)', { shape: 'star' }),
  C_([15, 0], [[16, 2.5], [18.5, 4], [23.4, 5.5]], 'Out right'),
  QB(15, -2.6, [[15, -4.5]], 'Drop'),
  Z_([10.5, -2.2], [[6, -2.3], [3.3, 0], [1.8, 6.7]], 'Swing left', { speed: 5.4 }) ] },

{ num: 14, series: 'alternates', id: 'p19', name: 'Twins Right, Z Shovel Pass', type: 'pass', concept: 'Roll left, shovel', players: [
  C_([15, 0], [[14, 3], [8.8, 7.2]], 'Bend left'),
  X_([20.6, 0], [[20.6, 5.3], [17.3, 10.5]], 'Post'),
  Y_([26.2, 0], [[26.4, 9], [27.5, 17]], 'Go'),
  QB(15, -4.3, [[10.5, -4.3]], 'Roll left'),
  Z_([19.4, -4.5], [[10.5, 1], [7, 2.5]], 'Shovel cross left', { shape: 'star', speed: 5.4 }) ] },

{ num: 15, series: 'alternates', id: 'p30', name: 'Split T, Z Fake, X Fake Reverse, Pass', type: 'pass', concept: 'Double fake, C seam', players: [
  Y_([5, 0], [[4.5, 9], [3, 17]], 'Go (fade)'),
  C_([15, 0], [[14.5, 3], [16, 7], [18.7, 9]], 'Seam, bend right', { shape: 'star' }),
  QB(15, -2.5, [[15, -3.2, 0.6]], 'Fake, fake, throw'),
  Z_([15, -5.9], [[15.5, -2], [16.9, 3.5]], 'Fake dive', { speed: 5.4 }),
  X_([25.1, 0], [[20, -2.5], [15, -3.8], [10, -2.5], [7.3, -0.4]], 'Fake reverse left', { fake: true }) ] }
];
PLAYS.forEach(p => { if (p.num) p.name = `${p.num} · ${p.name}`; });
