/* ---------- Accounts: Clerk sign-in, plays and favorites synced through the Worker ----------
   Signing in is optional. Signed out, My plays and favorites stay in this browser (studio.js `store`).
   Signed in, they live in the coach's account (the Worker's D1 database) and follow them to any device;
   a copy is cached in this browser so the list still shows if the Worker can't be reached.
   The first time a browser signs in, the plays already saved in it move into the account.
   CLERK_PUBLISHABLE_KEY is public (it ships to every browser); keep it the same as in worker/wrangler.toml.
   Empty = no sign-in button, and the app works exactly as before. */
const CLERK_PUBLISHABLE_KEY = 'pk_test_YXB0LWdvcGhlci0zNDEzLmNsZXJrLmFjY291bnRzLmRldiQ';

const account = {
  user: null,          // { id, label } when signed in
  data: null,          // { plays, favs } from the account
  ready: false,        // Clerk has loaded (or there's no Clerk)
  cacheKey() { return 'og-cloud:' + this.user.id; },
  saveCache() { try { localStorage.setItem(this.cacheKey(), JSON.stringify(this.data)); } catch (e) {} },
  upsert(play) {
    const i = this.data.plays.findIndex(p => p.id === play.id);
    if (i >= 0) this.data.plays[i] = play; else this.data.plays.push(play);
    this.saveCache();
  },
  remove(id) {
    this.data.plays = this.data.plays.filter(p => p.id !== id);
    this.data.favs = this.data.favs.filter(f => f !== id);
    this.saveCache();
  },
  setFavs(ids) { this.data.favs = ids.slice(); this.saveCache(); }
};

async function authToken() {
  try { return account.user && window.Clerk && Clerk.session ? await Clerk.session.getToken() : null; } catch (e) { return null; }
}
async function authHeaders() {
  const t = await authToken();
  return t ? { Authorization: 'Bearer ' + t } : {};
}

// Call the Worker's account routes. Resolves to the JSON reply (or a Response for raw=true); throws { code }.
async function accountApi(method, path, body, raw) {
  if (!AI_ENDPOINT) throw { code: 'unavailable' };
  let res;
  try {
    res = await fetch(AI_ENDPOINT.replace(/\/$/, '') + path, {
      method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(await authHeaders()) },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (e) { throw { code: 'network' }; }
  if (raw && res.ok) return res;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw { code: (data && data.code) || 'upstream_error' };
  return data;
}

/* ---------- Clerk ---------- */
const clerkHost = pk => atob(pk.split('_')[2] || '').replace(/\$$/, '');
function loadScript(src, attrs = {}) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true; s.crossOrigin = 'anonymous';
    Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

// onChange(user) runs once Clerk has loaded and again whenever a coach signs in or out.
// No way to sign in (accounts off, or Clerk didn't load): open the whole library rather than lock coaches out.
function openGate() {
  gate.open = true; library.version++;
  buildSelect(); renderHead(); recompute();
}
async function startAccounts(onChange) {
  if (!CLERK_PUBLISHABLE_KEY || !AI_ENDPOINT) { account.ready = true; openGate(); return; }
  $('acctBox').hidden = false;
  try {
    const host = clerkHost(CLERK_PUBLISHABLE_KEY);
    await Promise.all([
      loadScript(`https://${host}/npm/@clerk/ui@1/dist/ui.browser.js`),
      loadScript(`https://${host}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`, { 'data-clerk-publishable-key': CLERK_PUBLISHABLE_KEY })
    ]);
    await Clerk.load({ ui: { ClerkUI: window.__internal_ClerkUICtor } });
  } catch (e) {
    account.ready = true;
    $('acctBox').hidden = true;
    track('account_error', { stage: 'clerk_load' });
    openGate();
    return;
  }
  account.ready = true;
  let lastId = null;   // the page starts out showing this browser's plays, as if signed out
  let first = true;    // the first sync is a session restored on page load, not a sign-in
  const sync = () => {
    const u = Clerk.user;
    const id = u ? u.id : null;
    // The gate (app.src.html) follows the real sign-in state; og-signed is only a hint for the next page load.
    const wasSignedIn = gate.signedIn;
    gate.signedIn = !!u;
    try { u ? localStorage.setItem('og-signed', '1') : localStorage.removeItem('og-signed'); } catch (e) {}
    if (id === lastId) {
      first = false;
      if (wasSignedIn && !u) onChange(null);   // the hint said signed in, but the session is gone: lock again
      return;
    }
    // Analytics: the Clerk user id (never the email) ties a coach's devices together
    try {
      gtag('set', { user_id: id });
      gtag('set', 'user_properties', { signed_in: u ? 'yes' : 'no' });
    } catch (e) {}
    if (u && !first) track(Date.now() - new Date(u.createdAt).getTime() < 10 * 60 * 1000 ? 'sign_up' : 'login', { method: 'clerk' });
    else if (!u && lastId) track('logout');
    first = false;
    lastId = id;
    $('acctBtn').hidden = !!u;
    const ub = $('userBtn');
    ub.hidden = !u;
    if (u) Clerk.mountUserButton(ub); else { try { Clerk.unmountUserButton(ub); } catch (e) {} }
    onChange(u ? { id: u.id, label: (u.primaryEmailAddress && u.primaryEmailAddress.emailAddress) || u.fullName || 'your account' } : null);
  };
  $('acctBtn').hidden = false;
  Clerk.addListener(sync);
  sync();
}
// mode: 'sign_in' or 'sign_up'. from: what the coach clicked (header button, beta dialog, or a gate reason).
function openClerk(mode, from) {
  const ready = !!(window.Clerk && Clerk.loaded);
  track('sign_in_start', { ready, mode, from });
  if (!ready) { toast('Sign-in is still loading. Try again in a moment.'); return; }
  if (typeof closeDialog === 'function' && !$('scrim').hidden) closeDialog();
  mode === 'sign_up' ? Clerk.openSignUp() : Clerk.openSignIn();
}
$('acctBtn').addEventListener('click', () => openClerk('sign_in', 'header'));

/* Sign in: move this browser's plays into the account (first sign-in only), then load the account.
   Sign out: back to this browser's own plays. Resolves to a toast message, or ''. */
async function switchAccount(user) {
  if (!user) {
    account.user = null; account.data = null;
    return '';
  }
  account.user = user;
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(account.cacheKey()) || 'null'); } catch (e) {}
  const localPlays = store.local('og-mine') || [], localFavs = store.local('og-favs') || [];
  try {
    if (localPlays.length || localFavs.length) {
      const r = await accountApi('POST', '/sync', { plays: localPlays, favs: localFavs });
      account.data = { plays: r.plays, favs: r.favs, founding: !!r.founding, admin: !!r.admin };
      // The account has them now: clear this browser's copy so a later sign-in by someone else doesn't pick them up.
      try { localStorage.removeItem('og-mine'); localStorage.removeItem('og-favs'); } catch (e) {}
      account.saveCache();
      track('account_sync', { plays_moved: r.added || 0, favs_moved: localFavs.length });
      return r.added ? `Moved ${r.added} play${r.added > 1 ? 's' : ''} from this browser into your account.` : 'Signed in. Your plays are synced.';
    }
    account.data = await accountApi('GET', '/me');
    account.saveCache();
    return '';
  } catch (e) {
    track('account_error', { stage: localPlays.length || localFavs.length ? 'sync' : 'me' });
    account.data = cached || { plays: [], favs: [] };
    return cached ? 'Couldn’t reach your account. Showing the last synced copy.' : 'Couldn’t reach your account. Try reloading.';
  }
}

/* Privacy (see privacy.html): everything stored for the account, and deleting it.
   The Worker deletes the plays, favorites and photos, and the Clerk user too when it has CLERK_SECRET_KEY;
   otherwise (clerk: false) the Clerk user is deleted here through Clerk's own API. */
const exportAccountData = () => accountApi('GET', '/me/export');
async function deleteAccountData() {
  const key = account.cacheKey();
  const r = await accountApi('DELETE', '/me');
  if (!r.clerk) await Clerk.user.delete();
  try { localStorage.removeItem(key); } catch (e) {}
  try { await Clerk.signOut(); } catch (e) {}
}

/* The original play-card photo for an AI-drawn play (signed-in owner only). */
async function showPhoto(id, name) {
  let url;
  try {
    const res = await accountApi('GET', '/photos/' + id, null, true);
    url = URL.createObjectURL(await res.blob());
  } catch (e) {
    toast(e && e.code === 'not_found' ? 'That photo isn’t in your account anymore.' : 'Couldn’t load the photo. Try again.');
    return;
  }
  openDialog(`${dlgHead('Original diagram')}
    <img class="gifout" src="${url}" alt="Play card photo for ${esc(name)}">`, () => URL.revokeObjectURL(url));
}
