/* ---------- Guided tour: a 5-step spotlight walkthrough of the core loop ----------
   Starts once on a new visitor's first visit (og-tour-done), never on a share link. Replay from the header Tour button or the footer link.
   The tour loads a starter play (TOUR_PLAY) that grades C against Cover 2 and has route fixes to an A, so every step has something to show.
   Step 5's "Draw this play" is a scripted demo: no AI call, nothing saved, the visitor's free draft is untouched.
   When it ends, the coach's previous play, coverage and route changes come back. */
const TOUR_PLAY = 'p15', TOUR_COV = 'c2';
const TOUR_DESC = 'Trips right. Z runs a 5-yard out, Y a go up the sideline, C drags across to the left. X runs a slant from the left. QB drops back.';
const TOUR_DEMO = { name: 'Trips Right, Z Out', concept: 'Trips right, out under a go', players: [
  { id: 'X', start: [4.5, 0], route: [[4.5, 2], [9.5, 6]], routeName: 'Slant' },
  { id: 'C', start: [15, 0], route: [[15, 2.5], [6, 3.5]], routeName: 'Drag left' },
  { id: 'Q', start: [15, -4], route: [[15, -5]], routeName: 'Drop' },
  { id: 'Z', start: [20, 0], route: [[20, 5], [26, 5]], routeName: 'Out (5)', star: true },
  { id: 'Y', start: [26.5, 0], route: [[26.5, 18]], routeName: 'Go' }] };

const tour = { on: false, i: 0, prev: null, el: null, poll: null };
const readCards = () => [...$('read').querySelectorAll('.card')];
const TOUR_STEPS = [
  { target: () => document.querySelector('.cov[data-cov="c2"]'), title: 'Pick a defense',
    body: 'Tap <b>Cover 2</b> to put it on the field and see how this play holds up against it.',
    wait: 'Tap Cover 2 to continue', done: () => state.cov === TOUR_COV },
  { target: () => [$('fieldWrap'), document.querySelector('.timeline')], title: 'Run the play',
    body: 'Press <b>play</b> and watch the defenders react. Drag the slider to step through it. Before the snap, you can drag any defender to match what you see on game day.',
    wait: 'Press play to continue', done: () => state.t > 0 && !state.playing, avoid: () => document.querySelector('.timeline') },
  { target: () => readCards().slice(1, 3), title: 'Read the verdict',
    body: 'Every play gets a grade against the defense. The QB reads show each receiver as <b>open</b>, <b>tight</b> or <b>covered</b>. Tap one to jump to their best moment.' },
  { target: () => readCards().find(c => c.querySelector('[data-sug]')) || readCards()[3], title: 'Fix what isn’t working',
    body: () => `${state.run ? `${/^[AF]/.test(state.run.ev.grade) ? 'An' : 'A'} ${state.run.ev.grade} won’t cut it. ` : ''}These route changes would beat Cover 2. Tap <b>Try it</b> and watch the grade change.`,
    wait: 'Tap Try it to continue', done: () => Object.keys(state.changes).length > 0,
    after: () => { if (state.run) toast(`Now it’s ${/^[AF]/.test(state.run.ev.grade) ? 'an' : 'a'} ${state.run.ev.grade} against Cover 2.`); } },
  { target: () => $('newPlayBtn'), title: 'Now bring your own plays',
    body: 'That’s the real point of Open Grass: test <b>your</b> playbook. Describe a play or snap a photo of a play card, and it’s drawn for you. Here’s how.',
    next: 'Show me', action: () => tourDemo() },
  // Side by side (wide screens) light up the field and the grades; stacked, just the grades so they fit on screen
  { target: () => [...(innerWidth > 980 ? [$('fieldWrap')] : []), ...readCards().slice(0, 2)], title: 'Drawn and graded', count: 5,
    body: () => (account.user || gate.open)
      ? 'That’s it: your play, on the field, graded against every defense. Try it with one of your own plays.'
      : 'That’s it: your play, on the field, graded against every defense. Create a free account to save your playbook and test every play. Free while in beta.',
    final: true }
];

function tourCss() {
  if ($('tourCss')) return;
  const s = document.createElement('style'); s.id = 'tourCss';
  s.textContent = `
.tour { position: fixed; inset: 0; z-index: 55; pointer-events: none; }
.tour svg.shade { position: absolute; inset: 0; width: 100%; height: 100%; }
.tour svg.shade path { fill: rgba(10, 16, 12, .6); pointer-events: auto; fill-rule: evenodd; }
.tour .ring { position: absolute; border: 2.5px solid var(--hole); border-radius: 12px; box-shadow: 0 0 0 4px color-mix(in srgb, var(--hole) 30%, transparent); transition: all .25s ease; }
.tour .tcard { position: absolute; pointer-events: auto; width: min(340px, calc(100vw - 32px)); background: var(--panel); color: var(--ink); border: 1px solid var(--line); border-radius: 14px; padding: 16px; display: grid; gap: 10px; box-shadow: 0 18px 44px rgba(0,0,0,.32); }
.tour .tcard h3 { font-family: var(--f-display); font-weight: 800; font-size: 22px; text-transform: uppercase; margin: 0; line-height: 1; }
.tour .tcard p { margin: 0; font-size: 14px; }
.tour .tcard .wait { color: var(--muted); font-size: 13px; font-style: italic; }
.tour .tnav { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.tour .tnav .sp { flex: 1; }
.tour .dots { display: flex; gap: 5px; }
.tour .dots i { width: 7px; height: 7px; border-radius: 50%; background: var(--line); }
.tour .dots i.on { background: var(--accent); }
@media (max-width: 640px) { .tour .tcard { left: 16px !important; right: 16px; top: auto !important; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); width: auto; } }
.tour-demo-note { background: var(--hole); color: #1d2208; border-radius: 8px; padding: 6px 10px; font-size: 13px; font-weight: 600; margin: 0; }`;
  document.head.appendChild(s);
}

function startTour(trigger) {
  if (tour.on) return;
  closeDialog();
  tourCss();
  tour.on = true; tour.i = 0;
  tour.prev = { base: clone(state.basePlay), play: clone(state.play), changes: clone(state.changes), cov: state.cov, nudges: clone(state.nudges), blitz: state.blitz };
  state.blitz = false; $('blitzT').checked = false;
  loadPlay(PLAYS.find(p => p.id === TOUR_PLAY), null);
  const el = document.createElement('div');
  el.className = 'tour';
  el.innerHTML = `<svg class="shade" aria-hidden="true"><path/></svg><div class="ring"></div>
    <div class="tcard" role="dialog" aria-modal="false" aria-labelledby="tourTitle" aria-live="polite"></div>`;
  document.body.appendChild(el);
  tour.el = el;
  // Clicks outside the spotlight land on the shade: they end the tour instead of reaching the page
  el.querySelector('path').addEventListener('click', () => endTour('skip'));
  addEventListener('scroll', tourPlace, { passive: true });
  addEventListener('resize', tourPlace);
  document.addEventListener('click', tourWatch, true);
  track('tour_start', { trigger, signed_in: !!account.user });
  tourShow(0);
}

function tourShow(i) {
  tour.i = i;
  const s = TOUR_STEPS[i];
  clearInterval(tour.poll);
  // Steps 2–4 need Cover 2 on the field (the coach may have pressed Next on step 1 instead of tapping it).
  // Set directly, not through setCoverage, so it isn't tracked as the coach's own pick.
  if (i >= 1 && i <= 3 && state.cov !== TOUR_COV) { state.cov = TOUR_COV; state.nudges = {}; stop(); recompute(); setT(0); }
  tour.el.hidden = false;
  const n = TOUR_STEPS.length - 1, num = s.count || i + 1;
  const body = typeof s.body === 'function' ? s.body() : s.body;
  const signedIn = account.user || gate.open;
  let nav;
  if (s.final) nav = signedIn
    ? `<button class="act primary" data-t="newplay">New play</button><button class="linkbtn" data-t="done">Done</button>`
    : `<button class="act primary" data-t="signup">Create free account</button><button class="act" data-t="signin">Sign in</button><button class="linkbtn" data-t="done">Maybe later</button>`;
  else nav = `${i > 0 ? '<button class="linkbtn" data-t="back">Back</button>' : '<button class="linkbtn" data-t="skip">Skip tour</button>'}<span class="sp"></span><button class="act primary" data-t="next">${s.next || 'Next'}</button>`;
  const card = tour.el.querySelector('.tcard');
  card.innerHTML = `<div class="tnav"><span class="eyebrow">Tour · ${num} of ${n}</span><span class="sp"></span><button class="linkbtn" data-t="skip" aria-label="Close the tour">✕</button></div>
    <h3 id="tourTitle">${s.title}</h3><p>${body}</p>${s.wait ? `<p class="wait">${s.wait}, or press Next.</p>` : ''}
    <div class="tnav">${nav}</div>
    <div class="dots" aria-hidden="true">${TOUR_STEPS.slice(0, n).map((_, k) => `<i class="${k < num ? 'on' : ''}"></i>`).join('')}</div>`;
  card.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => tourAct(b.dataset.t)));
  tourScroll();
  tourPlace();
  setTimeout(tourPlace, 350);   // after smooth scrolling settles
  (card.querySelector('.act.primary') || card.querySelector('button')).focus({ preventScroll: true });
  track('tour_step', { step: num });
}

function tourAct(a) {
  const s = TOUR_STEPS[tour.i];
  if (a === 'next') { if (s.action) s.action(); else tourShow(tour.i + 1); }
  else if (a === 'back') tourShow(tour.i - 1);
  else if (a === 'skip') endTour('skip');
  else if (a === 'done') endTour('complete');
  else if (a === 'newplay') { endTour('complete'); openStudio(); }
  else if (a === 'signup' || a === 'signin') { endTour('complete'); openClerk(a === 'signup' ? 'sign_up' : 'sign_in', 'tour'); }
}

// Action steps move on by themselves once the coach does the thing (step 2 waits for the play to finish running).
function tourWatch(e) {
  if (!tour.on || tour.el.hidden) return;
  const s = TOUR_STEPS[tour.i];
  if (!s.done || (tour.el.contains(e.target))) return;
  clearInterval(tour.poll);
  const at = tour.i;
  tour.poll = setInterval(() => {
    if (!tour.on || tour.i !== at) { clearInterval(tour.poll); return; }
    if (s.done()) {
      clearInterval(tour.poll);
      if (s.after) s.after();
      setTimeout(() => { if (tour.on && tour.i === at) tourShow(at + 1); }, s.after ? 1400 : 300);
    }
  }, 150);
  setTimeout(() => clearInterval(tour.poll), 15000);
}
// Tapping a coverage card goes through pointer events; catch those too.
document.addEventListener('pointerup', e => { if (tour.on && tour.i === 0) tourWatch(e); }, true);

function tourRect() {
  const t = TOUR_STEPS[tour.i].target();
  const els = (Array.isArray(t) ? t : [t]).filter(Boolean);
  if (!els.length) return null;
  const rs = els.map(e => e.getBoundingClientRect());
  return { left: Math.min(...rs.map(r => r.left)), top: Math.min(...rs.map(r => r.top)), right: Math.max(...rs.map(r => r.right)), bottom: Math.max(...rs.map(r => r.bottom)) };
}
function tourScroll() {
  const r = tourRect();
  if (!r) return;
  const phone = innerWidth <= 640, room = innerHeight - (phone ? 260 : 0);
  const h = r.bottom - r.top;
  if (r.top >= 12 && r.bottom <= room - 12) return;
  const y = scrollY + r.top - (h < room ? Math.max(12, (room - h) / 2) : 12);
  scrollTo({ top: Math.max(0, y), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
function tourPlace() {
  if (!tour.on || tour.el.hidden) return;
  const r = tourRect(), W = innerWidth, H = innerHeight, pad = 6;
  const path = tour.el.querySelector('path'), ring = tour.el.querySelector('.ring'), card = tour.el.querySelector('.tcard');
  let d = `M0 0H${W}V${H}H0Z`;
  if (r) {
    const x = r.left - pad, y = r.top - pad, w = r.right - r.left + pad * 2, h = r.bottom - r.top + pad * 2;
    d += `M${x} ${y}h${w}v${h}h${-w}Z`;
    Object.assign(ring.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', display: '' });
  } else ring.style.display = 'none';
  path.setAttribute('d', d);
  if (W <= 640) return;   // phones: the card is a bottom sheet (CSS)
  const cw = card.offsetWidth, ch = card.offsetHeight, gap = 14;
  let left, top;
  if (!r) { left = (W - cw) / 2; top = (H - ch) / 2; }
  else if (H - r.bottom - pad >= ch + gap * 2) { top = r.bottom + pad + gap; left = r.left; }
  else if (r.top - pad >= ch + gap * 2) { top = r.top - pad - gap - ch; left = r.left; }
  else if (W - r.right - pad >= cw + gap * 2) { left = r.right + pad + gap; top = r.top; }
  else if (r.left - pad >= cw + gap * 2) { left = r.left - pad - gap - cw; top = r.top; }
  else {
    // No room outside the spotlight: sit in a corner, away from the controls the step is about (avoid)
    const s = TOUR_STEPS[tour.i], a = s.avoid && s.avoid() && s.avoid().getBoundingClientRect();
    left = W - cw - 16; top = a && a.top + a.height / 2 > H / 2 ? 16 : H - ch - 16;
  }
  card.style.left = clamp(left, 16, W - cw - 16) + 'px';
  card.style.top = clamp(top, 16, H - ch - 16) + 'px';
}

/* Step 5: the New play dialog, scripted. It types a description, "draws" it after a short pause, and loads a ready-made play. */
function tourDemo() {
  tour.el.hidden = true;
  track('tour_demo_open');
  openDialog(`${dlgHead('New play')}
    <p class="tour-demo-note">Tour demo · nothing is sent or saved</p>
    <div class="tabs" role="tablist">
      <button class="tab" role="tab" aria-selected="true">Describe it</button>
      <button class="tab" role="tab" aria-selected="false" disabled>From a diagram</button>
      <button class="tab" role="tab" aria-selected="false" disabled>Import file</button>
    </div>
    <div class="pane">
      <label class="eyebrow" for="tourText">Describe the play in your own words</label>
      <textarea id="tourText" readonly></textarea>
      <div><button class="act primary" id="tourDraw" disabled>Draw this play</button></div>
      <p class="muted">Or use <b>From a diagram</b> to snap a photo of a play card.</p>
      <p class="status" id="tourStatus"></p>
    </div>`, () => { if (tour.on && tour.i === 4) tourShow(4); });
  const ta = $('tourText');
  let k = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const type = () => {
    if (!$('tourText')) return;
    k = reduce ? TOUR_DESC.length : Math.min(TOUR_DESC.length, k + 3);
    ta.value = TOUR_DESC.slice(0, k);
    if (k < TOUR_DESC.length) setTimeout(type, 22);
    else { $('tourDraw').disabled = false; $('tourDraw').focus(); $('tourStatus').textContent = 'Now tap Draw this play.'; }
  };
  type();
  $('tourDraw').addEventListener('click', () => {
    $('tourDraw').disabled = true;
    $('tourStatus').textContent = 'Drawing your play…';
    track('tour_demo_draw');
    setTimeout(() => {
      if (!tour.on) return;
      const p = normalizePlay(TOUR_DEMO, 'tour-demo');
      p.draft = true;
      openDialog.onClose = null;   // leaving the demo forward, not backing out
      closeDialog();
      loadPlay(p, TOUR_COV);
      tourShow(5);
    }, 1100);
  });
}

function endTour(how) {
  if (!tour.on) return;
  const step = TOUR_STEPS[tour.i].count || tour.i + 1;
  tour.on = false;
  clearInterval(tour.poll);
  if (!$('scrim').hidden) { openDialog.onClose = null; closeDialog(); }
  tour.el.remove(); tour.el = null;
  removeEventListener('scroll', tourPlace); removeEventListener('resize', tourPlace);
  document.removeEventListener('click', tourWatch, true);
  try { localStorage.setItem('og-tour-done', '1'); } catch (e) {}
  // Put back what the coach had before the tour
  const p = tour.prev;
  state.blitz = p.blitz; $('blitzT').checked = p.blitz;
  loadPlay(p.base, p.cov);
  state.play = p.play; state.changes = p.changes; state.nudges = p.nudges;
  recompute(); setT(0);
  track(how === 'complete' ? 'tour_complete' : 'tour_skip', { step, signed_in: !!account.user });
}
// Capture phase, before the dialog's own Escape handler: Escape in the step 5 demo goes back to the step, not out of the tour.
document.addEventListener('keydown', e => { if (e.key === 'Escape' && tour.on && $('scrim').hidden) endTour('skip'); }, true);
$('tourBtn').addEventListener('click', () => startTour('header'));
$('tourLink').addEventListener('click', () => startTour('footer'));

// First visit only: not from a share link, not for a browser that already has plays, favorites or an account.
(() => {
  let seen = true;
  try { seen = ['og-tour-done', 'og-mine', 'og-favs', 'og-signed', 'og-free-draft'].some(k => localStorage.getItem(k)); } catch (e) {}
  if (seen || location.hash) return;
  let tries = 0;
  const go = () => {
    // Wait for sign-in to settle and for nothing else (a dialog) to be open
    if (++tries > 40) return;
    if (!account.ready || !$('scrim').hidden) { setTimeout(go, 250); return; }
    startTour('auto');
  };
  setTimeout(go, 1200);
})();
