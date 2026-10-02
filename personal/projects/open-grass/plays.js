/* Play library, transcribed from the coach's playbook_combined.pdf (numbers and names are the coach's own).
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

const SERIES = { core: 'Core plays', red: 'Red series', orange: 'Orange series', levels: 'Levels', z: 'Z series', y: 'Y series' };

const PLAYS = [
{ num: 1, series: 'core', id: 'p1', name: 'Split T, Z Fake Left, Center Out', type: 'pass', concept: 'Play-action bootleg right', players: [
  X_([5, 0], [[5, 14], [3.5, 19]], 'Go (fade)'),
  C_([15, 0], [[15, 4], [19.5, 4]], 'Out (4)', { shape: 'star' }),
  QB(15, -2.5, [[18.5, -4.5]], 'Bootleg right'),
  Z_([15, -5.5], [[14.2, -3.4, 0.35], [13.2, -0.5], [12.5, 16]], 'Fake left, seam', { delay: 0.1, speed: 5.2 }),
  Y_([24, 0], [[24, 18]], 'Go') ] },

{ num: 2, series: 'core', id: 'p2', name: 'Twins Right, Z Slot, Z Reverse', type: 'run', concept: 'Reverse left', handoff: { to: 'Z', at: 0 }, players: [
  C_([15, 0], [[16.2, 3.9], [24.8, 3.9]], 'Out right'),
  X_([19.5, 0], [[15, 4]], 'Pick (sit)'),
  Y_([27.3, 0], [[27.6, 9], [28, 17]], 'Go'),
  QB(15, -4.3, [[18.3, -4.3], [24.6, -4.3]], 'Hand off, fake right', { dashed: true }),
  Z_([23.3, -2.7], [[18.3, -3.9], [13, -4.4], [7, -2.7], [5, 1], [5, 8]], 'Reverse left', { shape: 'star', delay: 0.2, speed: 5.4 }) ] },

{ num: 3, series: 'core', id: 'p3', name: 'Twins Right, Z Slot, Center Flat Right', type: 'pass', concept: 'Sprint right, fake reverse', players: [
  C_([15, 0], [[17.6, 3.9], [24.6, 3.9]], 'Flat right', { shape: 'star' }),
  X_([19.5, 0], [[15, 3.9]], 'Pick (sit)'),
  Y_([27.3, 0], [[27.8, 9], [28, 17]], 'Go'),
  QB(15, -4.3, [[25, -4.6]], 'Sprint right', { speed: 4.2 }),
  Z_([23.4, -2.6], [[7, -2.7]], 'Fake reverse left', { speed: 5.4, fake: true }) ] },

{ num: 4, series: 'core', id: 'p4', name: 'Twins Left, Z Slot Reverse', type: 'run', concept: 'Reverse left', handoff: { to: 'Z', at: 0 }, players: [
  Y_([3.3, 0], [[3, 9], [1.8, 17]], 'Go (fade)'),
  X_([8.9, 0], [[15.2, 9]], 'Seam slant'),
  C_([15, 0], [[21.4, 5.6]], 'Release right'),
  QB(15, -4.3, [[18.9, -4.3], [24, -4.3]], 'Hand off, fake right', { dashed: true }),
  Z_([24.4, -2.7], [[18.9, -3.9], [13, -4.4], [7.2, -1.6], [5.5, 1.5], [5, 8]], 'Reverse left', { shape: 'star', delay: 0.2, speed: 5.4 }) ] },

{ num: 5, series: 'core', id: 'p5', name: 'Split T, Z Right Hustle', type: 'run', concept: 'Dive right', handoff: { to: 'Z', at: 0 }, players: [
  Y_([4.9, 0], [[4.6, 9], [2.7, 17]], 'Go (fade)'),
  C_([15, 0], [[15, 4], [12.1, 11]], 'Seam, bend left'),
  QB(15, -2.7, [[14.8, -3.2]], 'Hand off'),
  Z_([15, -5.3], [[16, -3], [16.6, 0.5], [17.2, 7.7]], 'Hustle right', { shape: 'star', speed: 5.4 }),
  X_([25, 0], [[25.3, 9], [26.6, 17]], 'Go (fade)') ] },

{ num: 6, series: 'core', id: 'p6', name: 'Split T, Z Left Hustle', type: 'pass', concept: 'Fake hustle left, Y under', players: [
  X_([2.5, 0], [[2.8, 9], [4.3, 17]], 'Go'),
  Y_([12.2, 0], [[15, -1.3], [18.5, -0.5], [21, 2.3]], 'Under right'),
  C_([15, 0], [[15, 4], [17, 7], [20, 8.3]], 'Bend right'),
  QB(15, -4.2, [[15, -4.8]], 'Drop'),
  Z_([19.1, -4.1], [[14, -3], [10, 0.5], [7.4, 3.6]], 'Hustle left', { shape: 'star', speed: 5.4 }) ] },

{ num: 7, series: 'core', id: 'p7', name: 'Split T, Y Cross Left', type: 'pass', concept: 'Rollout left, shallow cross', players: [
  X_([4.3, 0], [[4.3, 9], [3, 17]], 'Go (fade)'),
  C_([15, 0], [[15, 17]], 'Seam'),
  QB(15, -4, [[9, -4.6]], 'Roll left'),
  Z_([19, -4], [[19.5, -0.5], [22, 2.3], [28, 3.8]], 'Arrow right', { delay: 0.1, speed: 5.4 }),
  Y_([27.5, 0], [[23.5, 2.5], [16, 4.5], [8, 5]], 'Shallow cross', { shape: 'star' }) ] },

{ num: 9, series: 'core', id: 'p9', name: 'Bunch, X Y Corners', type: 'pass', concept: 'Bunch corners', players: [
  Y_([12.3, 0], [[12.3, 6], [9.2, 8.6]], 'Corner left', { shape: 'star' }),
  C_([15, 0], [[15, 4.4], [7.2, 4.4]], 'Out left'),
  Z_([17.3, 0], [[17.6, 7.5], [17, 6.5]], 'Curl (7)'),
  X_([19.8, 0], [[19.8, 5.2], [22.8, 8.6]], 'Corner right'),
  QB(15, -4.3, [[15, -4.8]], 'Drop') ] },

{ num: 10, series: 'core', id: 'p10', name: 'Bunch 2', type: 'pass', concept: 'Bunch, two-way breaks', players: [
  X_([12.3, 0], [[12.3, 5.4], [9.5, 9.6]], 'Corner left'),
  C_([15, 0], [[15, 5.4], [10.5, 5.4]], 'Out left'),
  Z_([17.4, 0], [[17.4, 5.4], [20.9, 10.1]], 'Corner right'),
  Y_([19.8, 0], [[19.8, 6], [23.4, 6]], 'Out right'),
  QB(15, -4.3, [[15, -4.8]], 'Drop') ] },

{ num: 11, series: 'core', id: 'p11', name: 'Split T, Z Slot, X Post', type: 'pass', concept: 'Post over shallow', players: [
  X_([4.3, 0], [[4.3, 5.8], [12.4, 10.5]], 'Post (6)', { shape: 'star' }),
  C_([15, 0], [[15, 2], [13, 3.5], [7.5, 3.8]], 'Shallow left'),
  QB(15, -4.4, [[15, -5.2]], 'Drop'),
  Z_([20.8, -1.5], [[20.8, 5.6], [28, 5.6]], 'Out (5)'),
  Y_([25.2, 0], [[25.2, 9], [23.2, 7.5]], 'Curl (9)') ] },

{ num: 12, series: 'core', id: 'p12', name: 'Trips Right, X Flat Left', type: 'pass', concept: 'Trips, throwback flat', players: [
  C_([15, 0], [[15, 5.5], [21.9, 5.5]], 'Out right'),
  X_([19.4, 0], [[18, 3], [11.6, 3.6]], 'Flat left'),
  Z_([23, 0], [[23, 7.4], [25.9, 9.3]], 'Corner right'),
  Y_([26.2, 0], [[26.4, 9], [27.2, 17]], 'Go'),
  QB(15, -4.3, [[15, -4.8]], 'Drop') ] },

{ num: 13, series: 'core', id: 'p13', name: 'Trips Left, X Flat Right', type: 'pass', concept: 'Trips, throwback flat', players: [
  Y_([2.7, 0], [[2.5, 9], [2.2, 17]], 'Go'),
  Z_([7.3, 0], [[7.3, 6.9], [4.8, 10.8]], 'Corner left'),
  X_([11.6, 0], [[13, 2.5], [20.3, 3.2]], 'Flat right'),
  C_([15, 0], [[15, 5.5], [10.2, 5.5]], 'Out left'),
  QB(15, -4.3, [[15, -4.8]], 'Drop') ] },

{ num: 14, series: 'core', id: 'p14', name: 'Stack Left, X Fly', type: 'pass', concept: 'Stack release', players: [
  Y_([3.8, 0], [[3.8, 5.5], [8.4, 5.5]], 'In (5)'),
  X_([3.8, -2.3], [[3.5, 1], [2.4, 9], [2.2, 17]], 'Fly', { shape: 'star' }),
  C_([15, 0], [[15, 7.2]], 'Seam (7)'),
  QB(15, -4.3, [[15, -4.8]], 'Drop'),
  Z_([19, -4.3], [[19, 2.3], [20.5, 5], [23.7, 5.8]], 'Out right', { speed: 5.4 }) ] },

{ num: 15, series: 'core', id: 'p15', name: 'Split T, Z Motion Left, Z Flat', type: 'pass', concept: 'Motion to the flat', players: [
  X_([4.9, 0], [[4.9, 9], [2.7, 17]], 'Go (fade)'),
  C_([15, 0], [[15, 7], [16.8, 5.5]], 'Stop & out'),
  QB(15, -4.4, [[15, -5.2]], 'Drop'),
  Z_([11, -2], [[11, 0.5], [10, 2.5], [7.5, 3.5]], 'Flat left', { shape: 'star', motion: [[20.3, -2.3]] }),
  Y_([25.6, 0], [[25.6, 9], [21.5, 15]], 'Post') ] },

{ num: 16, series: 'core', id: 'p16', name: 'Split T, Y Double Pass, Z Flat', type: 'trick', concept: 'Lateral, then Y throws', handoff: { to: 'Y', at: 0, thenPass: true }, players: [
  Y_([5, 0], [[5.2, -3.2]], 'Drop for lateral', { shape: 'star' }),
  C_([15, 0], [[10.3, 11]], 'Seam left'),
  QB(15, -2.2, [[15, -2.6]], 'Lateral left'),
  Z_([15, -5.3], [[14.2, -2], [12, 2], [8, 6], [4.5, 7.8]], 'Wheel left', { speed: 5.4 }),
  X_([25.2, 0], [[25.5, 9], [26.7, 17]], 'Go (fade)') ] },

{ num: 17, series: 'core', id: 'p17', name: 'Trips Right, X Motion Flat', type: 'pass', concept: 'Motion to the flat', players: [
  C_([15, 0], [[15, 2.8], [12, 2.8]], 'Out left (short)'),
  Y_([19.1, 0], [[19.2, 9], [20.2, 17]], 'Go'),
  Z_([23, 0], [[23, 6.2], [25.6, 8.9]], 'Corner right'),
  X_([12.5, -1.6], [[10, -0.8], [7.1, 2.8]], 'Flat left', { shape: 'star', motion: [[26.6, 0], [25, -1.6]] }),
  QB(15, -4.2, [[15, -4.8]], 'Drop') ] },

{ num: 18, series: 'core', id: 'p18', name: 'Twins Right, Z Pitch+Pass, C Slant', type: 'trick', concept: 'Pitch, then Z throws', handoff: { to: 'Z', at: 0, thenPass: true }, players: [
  C_([10.4, 0], [[18.6, 5]], 'Slant right'),
  QB(10.3, -2.7, [[10.8, -3.6]], 'Pitch right'),
  X_([16, 0], [[13.5, -0.8], [9, -0.6], [4, 3.7]], 'Jet left (decoy)', { fake: true }),
  Z_([10.3, -5.5], [[15.4, -5.3], [21, -3.5], [23.5, -1.2]], 'Pitch sweep right', { shape: 'star', dashed: true, speed: 5.4 }),
  Y_([21.5, 0], [[22, 8], [23.3, 17]], 'Go') ] },

{ num: 19, series: 'core', id: 'p19', name: 'Twins Right, Z Shovel Pass', type: 'pass', concept: 'Roll left, shovel', players: [
  C_([15, 0], [[14, 3], [8.8, 7.2]], 'Bend left'),
  X_([20.6, 0], [[20.6, 5.3], [17.3, 10.5]], 'Post'),
  Y_([26.2, 0], [[26.4, 9], [27.5, 17]], 'Go'),
  QB(15, -4.3, [[10.5, -4.3]], 'Roll left'),
  Z_([19.4, -4.5], [[10.5, 1], [7, 2.5]], 'Shovel cross left', { shape: 'star', speed: 5.4 }) ] },

{ num: 20, series: 'core', id: 'p20', name: 'Trips Right, X Motion, X Wheel', type: 'pass', concept: 'Motion wheel', players: [
  C_([15, 0], [[15, 2.2], [10.8, 2.6]], 'Out left (short)'),
  Y_([19.1, 0], [[19.6, 9], [20, 17]], 'Go'),
  Z_([23, 0], [[23, 7.9], [25.6, 9.2]], 'Corner right'),
  X_([12, -1.7], [[11, -0.5], [8.5, 2.2], [6.5, 5], [4.9, 12], [4.6, 17]], 'Wheel left', { shape: 'star', motion: [[26.6, 0], [25, -1.7]] }),
  QB(15, -4.3, [[15, -4.8]], 'Drop') ] },

{ num: 21, series: 'core', id: 'p21', name: 'Trips Right, X Motion, X Wheel, C Shovel Option', type: 'pass', concept: 'Motion wheel, shovel option', players: [
  C_([15, 0], [[13.5, 1.5], [11.5, 2.1]], 'Shovel left', { shape: 'star' }),
  Y_([19.1, 0], [[19.5, 9], [20, 17]], 'Go'),
  Z_([22.9, 0], [[23, 8.4], [25.8, 9.3]], 'Corner right'),
  X_([11.7, -1.7], [[11, 0.5], [8, 2.5], [5.5, 5], [4.3, 12], [4, 17]], 'Wheel left', { motion: [[26.6, 0], [25, -1.7]] }),
  QB(15, -4.3, [[15, -4.8]], 'Drop') ] },

{ num: 22, series: 'core', id: 'p22', name: 'Split T, X Fly', type: 'pass', concept: 'Inside fly', players: [
  Y_([4.8, 0], [[4.8, 7.4], [5.6, 6.4]], 'Curl (7)'),
  X_([10.5, 0], [[10.6, 12], [10.6, 17]], 'Fly', { shape: 'star' }),
  C_([15, 0], [[15.2, 5.8], [15.6, 4.8]], 'Hitch (5)'),
  Z_([23, 0], [[23, 7.7], [18.9, 7.7]], 'In (7)'),
  QB(15, -4.3, [[15, -4.8]], 'Drop') ] },

{ num: 24, series: 'core', id: 'p24', name: 'Trips Left, Y Under', type: 'pass', concept: 'Trips verticals, Y under', players: [
  Y_([3.3, 0], [[8, -1.3], [14, -1.7], [18, 0.5], [21.7, 3.4]], 'Under right'),
  X_([7.2, 0], [[7.2, 9], [7.2, 17]], 'Go'),
  Z_([11.2, 0], [[11.2, 9], [11.2, 17]], 'Go'),
  C_([15, 0], [[15.3, 5], [15.6, 4]], 'Hitch (4)', { shape: 'star' }),
  QB(15, -2.5, [[15, -3]], 'Drop') ] },

{ num: 30, series: 'red', id: 'p30', name: 'Split T, Z Fake, X Fake Reverse, Pass', type: 'pass', concept: 'Double fake, C seam', players: [
  Y_([5, 0], [[4.5, 9], [3, 17]], 'Go (fade)'),
  C_([15, 0], [[14.5, 3], [16, 7], [18.7, 9]], 'Seam, bend right', { shape: 'star' }),
  QB(15, -2.5, [[15, -3.2, 0.6]], 'Fake, fake, throw'),
  Z_([15, -5.9], [[15.5, -2], [16.9, 3.5]], 'Fake dive', { speed: 5.4 }),
  X_([25.1, 0], [[20, -2.5], [15, -3.8], [10, -2.5], [7.3, -0.4]], 'Fake reverse left', { fake: true }) ] },

{ num: 33, series: 'orange', id: 'p33', name: 'Whip', type: 'run', concept: 'Reverse left', handoff: { to: 'X', at: 0 }, players: [
  Y_([7.3, 0], [[15.6, 9.7]], 'Post right'),
  C_([15, 0], [[22.9, 9.9]], 'Corner right'),
  QB(15, -2.2, [[18, -2.2]], 'Pitch right', { speed: 5.0 }),
  X_([24.5, -3.6], [[24, -3, 0.5], [14, -3.4], [6, -2.8], [2.5, 0], [1.6, 7.3]], 'Whip left', { shape: 'star', speed: 5.6 }),
  Z_([15, -5.9], [[22, -5], [27, -3], [28.6, 0.5], [28.8, 3]], 'Swing right (decoy)', { speed: 5.4, fake: true }) ] },

{ num: 35, series: 'orange', id: 'p35', name: 'Countertop', type: 'run', concept: 'Counter right', handoff: { to: 'X', at: 1 }, players: [
  Y_([7.8, 0], [[6.5, 4], [5, 11.3], [5, 17]], 'Go'),
  C_([15, 0], [[14, 4], [10.5, 11.3]], 'Bend left'),
  QB(15, -3, [[15.2, -3.3]], 'Hand off'),
  Z_([18.9, -1.4], [[12, -1.4], [9, 0], [8.3, 4], [8.3, 11.3]], 'Fake left (motion)', { dashed: true, motion: [[26.7, -1.4]], speed: 5.4 }),
  X_([15, -7], [[12.3, -7], [15.5, -3.6], [21.3, 0], [23.4, 11.3]], 'Counter right', { shape: 'star', speed: 5.4 }) ] },

{ num: 36, series: 'levels', id: 'p36', name: '3D', type: 'pass', concept: 'Levels: sit, cross, swing', players: [
  X_([8.4, 0], [[8.4, 9.6], [15.2, 13], [26, 17]], 'Deep cross right'),
  Y_([12.3, 0], [[12.3, 8.3]], 'Sit (8)', { shape: 'star' }),
  C_([15, 0], [[16, 2.5], [18.5, 4], [23.4, 5.5]], 'Out right'),
  QB(15, -2.6, [[15, -4.5]], 'Drop'),
  Z_([10.5, -2.2], [[6, -2.3], [3.3, 0], [1.8, 6.7]], 'Swing left', { speed: 5.4 }) ] },

{ num: 38, series: 'z', id: 'p38', name: 'Split-Back Z Sweep Left Y Post', type: 'run', concept: 'Pitch sweep left', handoff: { to: 'Z', at: 0 }, players: [
  X_([6.1, 0], [[6.1, 3.3], [13.5, 12.6]], 'Post'),
  C_([15, 0], [[22.4, 7]], 'Slant right'),
  QB(15, -2.6, [[15, -3.2]], 'Pitch left'),
  Y_([11.6, -6.1], [[11.6, -1], [12.5, 3], [17.7, 11]], 'Post', { dashed: true, speed: 5.4 }),
  Z_([18.4, -6.25], [[15, -6.2], [11.6, -6.1], [5, -4], [2, 0], [1.2, 6.5]], 'Sweep left', { shape: 'star', speed: 5.4 }) ] },

{ num: 39, series: 'y', id: 'p39', name: 'Cross Criss', type: 'run', concept: 'Criss-cross counter', handoff: { to: 'Y', at: 1 }, players: [
  C_([15, 0], [[10.6, 7]], 'Slant left'),
  X_([26.6, 0], [[26.8, 9], [28, 17]], 'Go (fade)'),
  QB(15, -2.6, [[15, -3]], 'Hand off'),
  Z_([19.4, -6.1], [[15, -3.5], [7.1, -0.5]], 'Fake cross left', { dashed: true, speed: 5.4 }),
  Y_([10.5, -6.25], [[13.5, -5], [15.6, -3.2], [19.4, 2.3], [20.5, 11.8]], 'Cross right, up', { shape: 'star', speed: 5.4 }) ] },

{ num: 40, series: 'y', id: 'p40', name: 'Diamond', type: 'run', concept: 'Inside run, fakes outside', handoff: { to: 'X', at: 1 }, players: [
  C_([15, 0], [[5, 6.6]], 'Slant left'),
  QB(15, -2.6, [[15, -3]], 'Hand off'),
  Y_([12.3, -5.1], [[17.7, -5.1], [21, 0], [25.8, 6.6]], 'Fake right', { dashed: true, speed: 5.4 }),
  Z_([17.7, -5.1], [[18.5, 0], [19.3, 6.6]], 'Fake up', { dashed: true, speed: 5.4 }),
  X_([15, -8.1], [[16.3, -7.4], [15.4, -3.4], [13, 1], [11.8, 13]], 'Up the middle', { shape: 'star', speed: 5.4 }) ] },

{ num: 44, series: 'y', id: 'p44', name: 'Y Reverse, Z Fake Right', type: 'run', concept: 'Reverse run', handoff: { to: 'Y', at: 0 }, players: [
  X_([3.1, 0], [[3.1, 9], [1.8, 17]], 'Go (fade)'),
  C_([15, 0], [[20, 5.6], [21.5, 8]], 'Release right'),
  QB(15, -2.4, [[15.3, -3.2]], 'Pitch'),
  Z_([10.6, -5.2], [[19.3, -1.6], [24, 0.5]], 'Fake sweep right', { dashed: true, speed: 5.4 }),
  Y_([19.8, -5.2], [[15.7, -4.6], [12.5, -2.2], [11.2, 1.5], [11, 6]], 'Reverse left', { shape: 'star', speed: 5.4 }) ] },

{ num: 45, series: 'core', id: 'p45', name: 'X Corner, Backs Release', type: 'pass', concept: 'Two-back flood left', players: [
  X_([6.6, 0], [[6.6, 5.8], [3.8, 9.5]], 'Corner (6)', { shape: 'star' }),
  C_([15, 0], [[15, 6], [11.5, 6]], 'Out left (6)'),
  QB(15, -2.5, [[15, -3.5]], 'Drop'),
  Z_([10.4, -5.2], [[10.5, 0.5], [9, 2.5], [5, 3]], 'Flat left', { delay: 0.1, speed: 5.4 }),
  Y_([19.8, -5.2], [[19.8, 4.5], [20.5, 7.5], [23, 10]], 'Corner right', { delay: 0.1, speed: 5.4 }) ] }
];
PLAYS.forEach(p => { if (p.num) p.name = `${p.num} · ${p.name}`; });
