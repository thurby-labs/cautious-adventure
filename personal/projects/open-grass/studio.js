/* ---------- Studio: My plays, favorites, AI drafting, uploads, share links, GIFs, exports ---------- */
const SITE_URL = 'https://open-grass.com/';
const rid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);

function toast(msg) {
  const el = $('toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 2800);
}

/* Each coach's plays and favorites live in this browser's storage (no account or backend). */
const store = {
  local(k, v) {
    try {
      if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null');
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) { if (v !== undefined) throw e; return null; }
  },
  async loadMine() { return this.local('og-mine') || []; },
  async saveMine(play) {
    const list = (this.local('og-mine') || []).filter(p => p.id !== play.id);
    list.push(play); this.local('og-mine', list);
  },
  async deleteMine(id) {
    this.local('og-mine', (this.local('og-mine') || []).filter(p => p.id !== id));
  },
  async loadFavs() { return this.local('og-favs') || []; },
  async saveFavs(ids) {
    try { this.local('og-favs', ids); } catch (e) { toast('Couldn’t save favorites. Try again.'); }
  }
};

/* Custom plays travel inside the share link itself: "#j-<base64url JSON>.<coverage>". Nothing is uploaded. */
const r2 = v => Math.round(v * 100) / 100;
const pts = a => a.map(p => p.map(r2));
function packPlay(play) {
  const o = { name: play.name, concept: play.concept, players: play.players.map(p => {
    const q = { id: p.id, start: p.start.map(r2), route: pts(p.route), routeName: p.routeName };
    if (p.shape === 'star') q.star = true;
    if (p.dashed) q.dashed = true;
    if (p.fake) q.fake = true;
    if (p.motion) q.motion = pts(p.motion);
    return q;
  }) };
  if (play.handoff) o.handoff = play.handoff;
  const bytes = new TextEncoder().encode(JSON.stringify(o));
  let bin = ''; bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unpackPlay(tok) {
  const bin = atob(tok.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
}
const shortHash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

/* ---------- turning AI output or an imported file into a safe, complete play ---------- */
const DEFAULTS = { X: ['orange', 'Orange', [5, 0]], Y: ['purple', 'Purple', [25, 0]], Z: ['green', 'Green', [20, -2]], C: ['ink', 'Center', [15, 0]], Q: ['red', 'Quarterback', [15, -3.5]] };
const num = (v, lo, hi, d) => { const n = Number(v); return Number.isFinite(n) ? clamp(n, lo, hi) : d; };
const toPt = (p, d) => {
  if (!Array.isArray(p) || p.length < 2) return null;
  const q = [num(p[0], 0.5, 29.5, d[0]), num(p[1], -9, 20, d[1])];
  if (p[2]) q.push(num(p[2], 0, 2, 0));
  return q;
};
function normalizePlay(raw, id) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.players)) throw new Error('That doesn’t look like a play: no players found.');
  const players = [];
  for (const pid of ['X', 'C', 'Q', 'Z', 'Y']) {
    let r = raw.players.find(p => p && String(p.id || p.label || '').toUpperCase() === pid);
    const [color, name, s0] = DEFAULTS[pid];
    if (!r) { if (pid === 'Q' || pid === 'C') r = {}; else continue; }
    const start = toPt(r.start, s0) || s0;
    let route = (Array.isArray(r.route) ? r.route : []).map(p => toPt(p, start)).filter(Boolean).slice(0, 12);
    if (!route.length) route = pid === 'Q' ? [[start[0], start[1] - 1]] : [[start[0], start[1] + 5]];
    const p = {
      id: pid, label: pid, name, color, start, route,
      routeName: String(r.routeName || (pid === 'Q' ? 'Drop' : 'Route')).slice(0, 40),
      delay: pid === 'C' ? 0.35 : pid === 'Q' ? 0.15 : 0,
      speed: pid === 'Q' ? 3.4 : pid === 'C' ? 5.0 : start[1] < -1 ? 5.4 : 5.6
    };
    if (pid === 'Q') p.qb = true; else p.eligible = true;
    if (r.star || r.shape === 'star') p.shape = 'star';
    if (r.dashed) p.dashed = true;
    if (r.fake) p.fake = true;
    if (Array.isArray(r.motion) && r.motion.length) p.motion = r.motion.map(m => toPt(m, start)).filter(Boolean).slice(0, 4).map(m => m.slice(0, 2));
    players.push(p);
  }
  if (players.filter(p => p.eligible).length < 2) throw new Error('A play needs at least two receivers.');
  let handoff = null;
  if (raw.handoff && typeof raw.handoff === 'object') {
    const to = String(raw.handoff.to || '').toUpperCase(), c = players.find(p => p.id === to && p.eligible);
    if (c) {
      handoff = { to, at: Math.round(num(raw.handoff.at, 0, c.route.length - 1, 0)) };
      if (raw.handoff.thenPass || raw.type === 'trick') handoff.thenPass = true;
    }
  }
  const play = {
    id: id || 'u' + rid(), series: 'mine',
    name: String(raw.name || 'Untitled play').replace(/^\d+\s*·\s*/, '').slice(0, 80),
    type: handoff ? (handoff.thenPass ? 'trick' : 'run') : 'pass',
    concept: String(raw.concept || (handoff ? 'Run' : 'Pass')).slice(0, 60),
    players
  };
  if (handoff) play.handoff = handoff;
  return play;
}
const stripFlags = p => { const c = clone(p); delete c.draft; delete c.mine; delete c.shared; delete c.option; delete c.optionOn; return c; };

/* ---------- AI drafts (see ai.js) ---------- */
function useDraft(play) {
  play.draft = true;
  closeDialog();
  loadPlay(play);
  toast('Draft ready. Save it to keep it.');
}

/* ---------- dialog shell ---------- */
function openDialog(html, onClose) {
  $('dialog').innerHTML = html;
  $('scrim').hidden = false;
  openDialog.onClose = onClose;
  const f = $('dialog').querySelector('textarea, input, button:not([data-close])');
  if (f) f.focus();
}
function closeDialog() {
  if (aiCtl) { aiCtl.abort(); aiCtl = null; }
  $('scrim').hidden = true; $('dialog').innerHTML = '';
  if (openDialog.onClose) { openDialog.onClose(); openDialog.onClose = null; }
}
$('scrim').addEventListener('click', e => { if (e.target === $('scrim') || e.target.closest('[data-close]')) closeDialog(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('scrim').hidden) closeDialog(); });
const dlgHead = title => `<div class="dialog-head"><h3 id="dlgTitle">${title}</h3><button class="act" data-close>Close</button></div>`;

/* ---------- New play studio ---------- */
const EXAMPLES = [
  'Trips right. X runs a flat to the left, Z a short corner, Y a go, C an out to the right. QB drops back.',
  'Split T run: Z takes the handoff and runs off-tackle left. X and Y run go routes as decoys, C releases right.',
  'Bunch left. Y slants under, X runs a corner, Z sits at 5 yards, C runs an out right. Throw to Y.'
];
async function openStudio(tab) {
  const sample = aiProvider();
  const lim = sample ? await sample.limits().catch(() => null) : null;
  tab = tab || (sample ? 'text' : 'file');
  const img = lim && lim.images;
  openDialog(`${dlgHead('New play')}
    <div class="tabs" role="tablist">
      <button class="tab" role="tab" data-tab="text">Describe it</button>
      <button class="tab" role="tab" data-tab="image">From a diagram</button>
      <button class="tab" role="tab" data-tab="file">Import file</button>
    </div>
    <div class="pane" data-pane="text">
      <label class="eyebrow" for="aiText">Describe the play in your own words</label>
      <textarea id="aiText" placeholder="Formation, each player's route, and who gets the ball."></textarea>
      <div class="examples">${EXAMPLES.map(x => `<button class="chipbtn" data-ex>${esc(x)}</button>`).join('')}</div>
      <div><button class="act primary" id="aiGo" ${sample ? '' : 'disabled'}>Draw this play</button></div>
      <p class="status${sample ? '' : ' err'}" id="aiStatus">${sample ? '' : AI_UNAVAILABLE}</p>
    </div>
    <div class="pane" data-pane="image" hidden>
      <p class="muted">Upload a screenshot or photo of a play card. The AI reads the players, routes, motion and fakes, and draws it as a draft you can test and save.</p>
      <input type="file" id="imgFile" accept="${img ? esc(img.mediaTypes.join(',')) : 'image/*'}" ${img ? '' : 'disabled'}>
      <img class="preview-img" id="imgPrev" alt="Uploaded diagram" hidden>
      <div><button class="act primary" id="imgGo" disabled>Read this diagram</button></div>
      <p class="status${img ? '' : ' err'}" id="imgStatus">${img ? '' : sample ? 'Reading images isn’t available here. Describe the play instead.' : AI_UNAVAILABLE}</p>
    </div>
    <div class="pane" data-pane="file" hidden>
      <p class="muted">Import plays from an Open Grass playbook file (.json), like the one Export favorites saves. They go into My plays.</p>
      <input type="file" id="jsonFile" accept=".json,application/json">
      <p class="status" id="fileStatus"></p>
    </div>`);
  const d = $('dialog');
  const show = name => {
    d.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === name));
    d.querySelectorAll('.pane').forEach(p => { p.hidden = p.dataset.pane !== name; });
  };
  show(tab);
  d.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => show(b.dataset.tab)));
  d.querySelectorAll('[data-ex]').forEach(b => b.addEventListener('click', () => { $('aiText').value = b.textContent; $('aiText').focus(); }));

  $('aiGo').addEventListener('click', async () => {
    const text = $('aiText').value.trim(), st = $('aiStatus');
    if (!text) { st.className = 'status err'; st.textContent = 'Describe the play first.'; return; }
    $('aiGo').disabled = true;
    try { useDraft(await askAI({ description: text }, st)); }
    catch (e) { if ($('aiStatus')) { st.className = 'status err'; st.textContent = aiError(e); } }
    finally { if ($('aiGo')) $('aiGo').disabled = false; }
  });

  let file = null;
  $('imgFile').addEventListener('change', e => {
    file = e.target.files[0] || null;
    const pv = $('imgPrev');
    if (file) { pv.src = URL.createObjectURL(file); pv.hidden = false; } else pv.hidden = true;
    $('imgGo').disabled = !file;
  });
  $('imgGo').addEventListener('click', async () => {
    const st = $('imgStatus');
    $('imgGo').disabled = true;
    try { useDraft(await askAI({ image: file }, st)); }
    catch (e) { if ($('imgStatus')) { st.className = 'status err'; st.textContent = aiError(e); } }
    finally { if ($('imgGo')) $('imgGo').disabled = false; }
  });

  $('jsonFile').addEventListener('change', async e => {
    const f = e.target.files[0], st = $('fileStatus');
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const list = Array.isArray(data) ? data : Array.isArray(data.plays) ? data.plays : [data];
      const plays = list.map(p => normalizePlay(p));
      for (const p of plays) await store.saveMine(p);
      plays.forEach(p => { p.mine = true; library.mine.push(p); });
      library.version++;
      closeDialog();
      loadPlay(plays[0]);
      toast(`Imported ${plays.length} play${plays.length > 1 ? 's' : ''} into My plays.`);
    } catch (err) {
      st.className = 'status err';
      st.textContent = err instanceof SyntaxError ? 'That file isn’t valid JSON.' : (err.message || 'Those plays couldn’t be imported.');
    }
  });
}

/* ---------- save, delete, favorite ---------- */
async function saveCurrentAsMine() {
  const edited = Object.keys(state.changes).length > 0 && !state.play.draft && !state.play.shared;
  const p = stripFlags(state.play);
  p.id = state.play.draft ? state.basePlay.id.replace(/^d/, 'u') : 'u' + rid();
  p.series = 'mine';
  p.name = (edited ? `${p.name.replace(/^\d+\s*·\s*/, '')} (edited)` : p.name).slice(0, 80);
  delete p.num;
  try {
    await store.saveMine(p);
    if (state.play.shared) library.shared = library.shared.filter(s => s.id !== state.basePlay.id);
    p.mine = true; library.mine.push(p); library.version++;
    loadPlay(p);
    toast('Saved to My plays in this browser.');
  } catch (e) { toast('Couldn’t save the play. Try again.'); }
}
$('saveDraftBtn').addEventListener('click', saveCurrentAsMine);

let delArm = null;
$('deletePlayBtn').addEventListener('click', async () => {
  const b = $('deletePlayBtn');
  if (!delArm) {
    b.textContent = 'Tap again to delete';
    delArm = setTimeout(() => { delArm = null; b.textContent = 'Delete play'; }, 4000);
    return;
  }
  clearTimeout(delArm); delArm = null; b.textContent = 'Delete play';
  const id = state.basePlay.id;
  try {
    await store.deleteMine(id);
    library.mine = library.mine.filter(p => p.id !== id);
    if (library.favs.includes(id)) { library.favs = library.favs.filter(f => f !== id); store.saveFavs(library.favs); }
    library.version++;
    loadPlay(PLAYS[0]);
    toast('Play deleted.');
  } catch (e) { toast('Couldn’t delete the play. Try again.'); }
});

$('favBtn').addEventListener('click', async () => {
  if (state.play.draft) return;
  if (state.play.shared) { await saveCurrentAsMine(); }
  const id = state.basePlay.id;
  const on = !library.favs.includes(id);
  library.favs = on ? [...library.favs, id] : library.favs.filter(f => f !== id);
  store.saveFavs(library.favs);
  buildSelect(); renderHead();
  toast(on ? 'Added to favorites.' : 'Removed from favorites.');
});

/* ---------- share links ---------- */
// Only a plain #token reaches the page from a link, so the token is "<playId>.<coverage>" for a built-in play,
// or "j-<packed play>.<coverage>" for a custom, edited or draft play (the whole play rides in the link).
// A built-in play with its option toggled on uses "<playId>~opt".
function openShare() {
  const custom = state.play.draft || state.play.mine || state.play.shared || Object.keys(state.changes).length > 0;
  const covTok = state.cov || 'none';
  let url = '', err = '';
  try { url = `${SITE_URL}#${custom ? 'j-' + packPlay(stripFlags(state.play)) : state.basePlay.id + (state.basePlay.optionOn ? '~opt' : '')}.${covTok}`; }
  catch (e) { err = 'Couldn’t create the link. Try again.'; }
  const note = custom
    ? 'This play is stored in the link itself, so anyone with it can open it. They can save it to their own My plays.'
    : 'Anyone with the link can open it.';
  openDialog(`${dlgHead('Share this play')}
    <div class="sharebox">
      <label class="eyebrow" for="shareUrl">Link</label>
      <input id="shareUrl" readonly value="${esc(url)}">
      <div><button class="act primary" id="copyLink" ${url ? '' : 'disabled'}>Copy link</button></div>
      <p class="status${err ? ' err' : ''}" id="shareStatus">${err || `Opens ${esc(state.play.name)} vs ${state.cov ? COVERAGES[state.cov].name : 'no defense'}. ${note}`}</p>
    </div>`);
  $('copyLink').addEventListener('click', async () => {
    const inp = $('shareUrl');
    try { await navigator.clipboard.writeText(inp.value); toast('Link copied.'); }
    catch (e) { inp.focus(); inp.select(); toast('Press Ctrl+C or ⌘C to copy.'); }
  });
}
$('shareBtn').addEventListener('click', openShare);

/* ---------- GIF: render each frame of the field and encode an animated GIF ---------- */
function lzwEncode(px, out) {
  const minSize = 8, clear = 256, eoi = 257;
  let codeSize = 9, next = 258, dict = new Map(), cur = 0, bits = 0;
  const buf = [];
  const emit = c => {
    cur |= c << bits; bits += codeSize;
    while (bits >= 8) { buf.push(cur & 255); cur >>>= 8; bits -= 8; }
    if (next > (1 << codeSize) - 1 && codeSize < 12) codeSize++;
  };
  out.push(minSize);
  emit(clear);
  let prefix = px[0];
  for (let i = 1; i < px.length; i++) {
    const k = px[i], key = (prefix << 8) | k, v = dict.get(key);
    if (v !== undefined) { prefix = v; continue; }
    emit(prefix);
    if (next < 4096) dict.set(key, next++);
    else { emit(clear); dict = new Map(); codeSize = 9; next = 258; }
    prefix = k;
  }
  emit(prefix); emit(eoi);
  if (bits > 0) buf.push(cur & 255);
  for (let i = 0; i < buf.length; i += 255) {
    const n = Math.min(255, buf.length - i);
    out.push(n);
    for (let j = 0; j < n; j++) out.push(buf[i + j]);
  }
  out.push(0);
}
function encodeGif(frames, w, h, palette) {
  const out = [];
  const b = v => out.push(v & 255), w16 = v => { b(v); b(v >> 8); }, str = s => { for (const ch of s) b(ch.charCodeAt(0)); };
  str('GIF89a'); w16(w); w16(h); b(0xF7); b(0); b(0);
  for (let i = 0; i < 256; i++) { const c = palette[i] || [0, 0, 0]; b(c[0]); b(c[1]); b(c[2]); }
  b(0x21); b(0xFF); b(11); str('NETSCAPE2.0'); b(3); b(1); w16(0); b(0);
  for (const f of frames) {
    b(0x21); b(0xF9); b(4); b(0); w16(f.delay); b(0); b(0);
    b(0x2C); w16(0); w16(0); w16(w); w16(h); b(0);
    lzwEncode(f.idx, out);
  }
  b(0x3B);
  return new Uint8Array(out);
}
const bucket = (r, g, b) => ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
function buildPalette(samples) {
  const counts = new Map();
  for (const d of samples) for (let i = 0; i < d.length; i += 8) { const k = bucket(d[i], d[i + 1], d[i + 2]); counts.set(k, (counts.get(k) || 0) + 1); }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 256)
    .map(([k]) => [((k >> 10) & 31) << 3 | 4, ((k >> 5) & 31) << 3 | 4, (k & 31) << 3 | 4]);
}
function indexer(palette) {
  const cache = new Int16Array(32768).fill(-1);
  return (d) => {
    const idx = new Uint8Array(d.length / 4);
    for (let i = 0, j = 0; i < d.length; i += 4, j++) {
      const k = bucket(d[i], d[i + 1], d[i + 2]);
      let c = cache[k];
      if (c < 0) {
        let best = 0, bd = Infinity;
        const r = ((k >> 10) & 31) << 3 | 4, g = ((k >> 5) & 31) << 3 | 4, bl = (k & 31) << 3 | 4;
        for (let p = 0; p < palette.length; p++) {
          const q = palette[p], dd = (q[0] - r) ** 2 + (q[1] - g) ** 2 + (q[2] - bl) ** 2;
          if (dd < bd) { bd = dd; best = p; }
        }
        c = cache[k] = best;
      }
      idx[j] = c;
    }
    return idx;
  };
}
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
async function renderGif(progress) {
  const W = 540, FH = 504, CAP = 46, H = FH + CAP, fps = 10, T = tEnd();
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const cs = getComputedStyle(document.documentElement);
  const tok = v => cs.getPropertyValue(v).trim() || '#000';
  const resolve = s => s.replace(/var\((--[\w-]+)\)/g, (m, v) => tok(v))
    .replace(/class="lbl"/g, 'font-family="Barlow, Arial, sans-serif" font-weight="700"')
    .replace(/class="def[^"]*"/g, '');
  const title = `${state.play.name}  ·  vs ${state.cov ? COVERAGES[state.cov].name : 'no defense'}${state.blitz ? ' + blitz' : ''}`;
  const draw = async t => {
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 336" width="${W}" height="${FH}">${resolve(fieldMarkup(t))}</svg>`;
    const img = await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr));
    ctx.fillStyle = tok('--panel'); ctx.fillRect(0, 0, W, CAP);
    ctx.fillStyle = tok('--ink'); ctx.font = '700 17px Barlow, Arial, sans-serif'; ctx.textBaseline = 'middle';
    let tt = title; while (ctx.measureText(tt).width > W - 130 && tt.length > 10) tt = tt.slice(0, -2);
    ctx.fillText(tt === title ? tt : tt + '…', 14, CAP / 2);
    ctx.fillStyle = tok('--muted'); ctx.font = '600 13px Barlow, Arial, sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(`${t.toFixed(1)}s · Open Grass`, W - 14, CAP / 2); ctx.textAlign = 'left';
    ctx.drawImage(img, 0, CAP, W, FH);
    return ctx.getImageData(0, 0, W, H).data;
  };
  const times = [];
  for (let k = 0; k <= Math.round(T * fps); k++) times.push(k / fps);
  const samples = [];
  for (const t of [0, T / 3, (2 * T) / 3, T]) samples.push(await draw(t));
  const palette = buildPalette(samples), toIdx = indexer(palette);
  const frames = [];
  for (let i = 0; i < times.length; i++) {
    frames.push({ idx: toIdx(await draw(times[i])), delay: i === 0 ? 80 : i === times.length - 1 ? 180 : 10 });
    progress(i / times.length);
    if (i % 4 === 3) await new Promise(r => setTimeout(r, 0));
  }
  return new Blob([encodeGif(frames, W, H, palette)], { type: 'image/gif' });
}
const slug = s => s.replace(/^\d+\s*·\s*/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'play';
const MIME = { gif: 'image/gif', json: 'application/json', csv: 'text/csv;charset=utf-8' };
function saveFile(filename, data) {
  try {
    const blob = data instanceof Blob ? data : new Blob([data], { type: MIME[filename.split('.').pop()] || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.hidden = true;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return true;
  } catch (e) { toast('Couldn’t save the file. Try again.'); return false; }
}
$('gifBtn').addEventListener('click', async () => {
  const b = $('gifBtn'), label = b.lastChild;
  if (!state.run) { toast('Drop a coverage on the field first.'); return; }
  stop();
  const keepT = state.t;
  b.disabled = true;
  let blob;
  try { blob = await renderGif(p => { label.textContent = `Rendering ${Math.round(p * 100)}%`; }); }
  catch (e) { toast('Couldn’t make the GIF. Try again.'); }
  finally { b.disabled = false; label.textContent = 'Save GIF'; setT(keepT); }
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const name = `${slug(state.play.name)}-vs-${state.cov}.gif`;
  openDialog(`${dlgHead('Animated play')}
    <img class="gifout" src="${url}" alt="Animated GIF of ${esc(state.play.name)}">
    <p class="status">${(blob.size / 1024 / 1024).toFixed(1)} MB · ${esc(name)}</p>
    <div><button class="act primary" id="gifSave">Save GIF</button></div>`, () => URL.revokeObjectURL(url));
  $('gifSave').addEventListener('click', async () => { if (await saveFile(name, blob)) toast('GIF saved.'); });
});

/* ---------- export favorites ---------- */
$('exportBtn').addEventListener('click', () => {
  const favs = library.favs.map(findPlay).filter(Boolean);
  if (!favs.length) { toast('Star a play with Favorite first.'); return; }
  openDialog(`${dlgHead('Export favorites')}
    <p class="status">${favs.length} favorite play${favs.length > 1 ? 's' : ''}: ${favs.map(p => esc(p.name)).join(', ')}</p>
    <div class="pane">
      <div><button class="act primary" id="expJson">Playbook file (.json)</button></div>
      <p class="muted">Every route and alignment. Import it on another device with New play → Import file, or share it with another coach.</p>
      <div><button class="act" id="expCsv">Scouting sheet (.csv)</button></div>
      <p class="muted">One row per play with its grade against Cover 1, 2, 3 and Man. Opens in Excel or Google Sheets.</p>
    </div>`);
  $('expJson').addEventListener('click', async () => {
    const data = JSON.stringify({ app: 'Open Grass', format: 1, exportedAt: new Date().toISOString(), plays: favs.map(stripFlags) }, null, 1);
    if (await saveFile('open-grass-favorites.json', data)) toast('Playbook file saved.');
  });
  $('expCsv').addEventListener('click', async () => {
    const q = v => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [['Play', 'Type', 'Concept', ...COV_ORDER.map(c => COVERAGES[c].name), ...COV_ORDER.map(c => COVERAGES[c].name + ' + blitz')]];
    favs.forEach(p => rows.push([p.name, p.type, p.concept,
      ...COV_ORDER.map(c => runPlay(p, c, {}).ev.grade), ...COV_ORDER.map(c => runPlay(p, c, { blitz: true }).ev.grade)]));
    if (await saveFile('open-grass-favorites.csv', rows.map(r => r.map(q).join(',')).join('\n'))) toast('Scouting sheet saved.');
  });
});
$('newPlayBtn').addEventListener('click', () => openStudio());

/* ---------- startup: links, then the coach's saved plays and favorites ---------- */
function parseHash() {
  const m = /^(s-|j-)?([A-Za-z0-9_~-]+)(?:\.(c1|c2|c3|man|none))?$/.exec((location.hash || '').slice(1));
  return m ? { shared: !!m[1], packed: m[1] === 'j-', id: m[2], cov: m[3] === 'none' ? null : m[3] } : null;
}
const link = parseHash();
if (link && !link.shared) {
  const opt = link.id.endsWith('~opt');
  const p = PLAYS.find(x => x.id === link.id.replace(/~opt$/, ''));
  if (p) loadPlay(p, link.cov === undefined ? state.cov : link.cov, opt);
}
(async () => {
  try {
    const [mine, favs] = await Promise.all([store.loadMine(), store.loadFavs()]);
    library.mine = mine.map(p => { try { const n = normalizePlay(p, p.id); n.mine = true; return n; } catch (e) { return null; } }).filter(Boolean);
    library.favs = favs.filter(id => typeof id === 'string');
  } catch (e) { toast('Couldn’t load your saved plays.'); }
  if (link && link.shared) {
    try {
      // "s-" links came from the old hosted version, whose shared plays lived in its database
      const raw = link.packed ? unpackPlay(link.id) : null;
      if (raw) {
        const p = normalizePlay(raw, 's' + shortHash(link.id)); p.shared = true; p.series = 'shared';
        library.shared.push(p);
        library.version++;
        loadPlay(p, link.cov === undefined ? state.cov : link.cov);
        return;
      }
      toast('That shared play link is from an older version of Open Grass and can’t be opened here.');
    } catch (e) { toast('Couldn’t open the shared play.'); }
  } else if (!link) {
    let saved = null;
    try { saved = localStorage.getItem('og-play'); } catch (e) {}
    const p = saved && library.mine.find(x => x.id === saved);
    if (p) { library.version++; loadPlay(p); return; }
  }
  library.version++;
  buildSelect(); renderHead();
})();
