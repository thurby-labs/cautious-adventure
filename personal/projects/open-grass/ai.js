/* ---------- AI: describe a play, or read a diagram ----------
   AI drafting goes through the Open Grass Worker (worker/ folder), which holds the Anthropic key
   and the play-drawing prompts. Set AI_ENDPOINT to the Worker's URL after `npm run deploy`;
   leave it empty and the New play dialog shows AI drafting as unavailable.
   Never put API keys in this file: it ships to every browser. */
const AI_ENDPOINT = 'https://open-grass-ai.thurby-labs.workers.dev';
const AI_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const AI_MAX_IMAGE = 5 * 1024 * 1024;

/* Owner override: open the site once with #owner=<OWNER_TOKEN> to save the token in this browser
   (#owner=off forgets it). It's sent as X-OG-Owner and skips the Worker's daily limits.
   The token is removed from the address bar right away and never lives in this file. */
(() => {
  const m = /^#owner=(.+)$/.exec(location.hash || '');
  if (!m) return;
  try { m[1] === 'off' ? localStorage.removeItem('og-owner') : localStorage.setItem('og-owner', decodeURIComponent(m[1])); } catch (e) {}
  history.replaceState(null, '', location.pathname + location.search);
})();
function ownerToken() { try { return localStorage.getItem('og-owner') || ''; } catch (e) { return ''; } }

function aiProvider() {
  if (!AI_ENDPOINT) return null;
  return {
    // input: { description } or { image: File }. Resolves to { play: raw play object, photo: stored photo id or undefined }; throws { code }.
    // Signed in (account.js), the session token goes along so the Worker can keep the photo in the coach's account.
    async json(input, { signal } = {}) {
      let body;
      if (input.image) {
        const f = input.image;
        if (!AI_IMAGE_TYPES.includes(f.type)) throw { code: 'image_rejected' };
        if (f.size > AI_MAX_IMAGE) throw { code: 'image_too_large' };
        body = { image: { mediaType: f.type, data: await fileToBase64(f) } };
      } else body = { description: input.description };
      let res;
      try {
        res = await fetch(AI_ENDPOINT.replace(/\/$/, '') + '/draft', {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...(ownerToken() ? { 'X-OG-Owner': ownerToken() } : {}), ...(await authHeaders()) }, body: JSON.stringify(body), signal
        });
      } catch (e) { throw { code: e && e.name === 'AbortError' ? 'cancelled' : 'network' }; }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.play) throw { code: (data && data.code) || 'upstream_error' };
      return { play: data.play, photo: data.photo };
    },
    limits: async () => ({ images: { mediaTypes: AI_IMAGE_TYPES } })
  };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject({ code: 'image_rejected' });
    r.readAsDataURL(file);
  });
}

let aiCtl = null;
async function askAI(input, statusEl) {
  const ai = aiProvider();
  if (!ai) throw { code: 'unavailable' };
  if (aiCtl) aiCtl.abort();
  aiCtl = new AbortController();
  statusEl.className = 'status'; statusEl.textContent = 'Drawing the play…';
  const { play: raw, photo } = await ai.json(input, { signal: aiCtl.signal });
  const play = normalizePlay(raw, 'd' + rid());
  if (photo) play.photo = photo;
  return play;
}
const AI_UNAVAILABLE = 'AI drafting needs the AI-enabled version of Open Grass. You can still import a play file.';
const AI_ERRORS = {
  unavailable: AI_UNAVAILABLE,
  rate_limited: 'Too many requests right now. Wait a minute and try again.',
  signed_out: 'AI drafting needs a free account. Sign in and try again.',
  daily_limit_ip: 'You’ve used today’s AI drafts. They reset at midnight UTC. You can still build or import plays by hand.',
  daily_limit: 'AI drafting has hit its limit for today. Try again tomorrow, or build or import the play by hand.',
  image_rejected: 'That image couldn’t be read. Try a PNG or JPG screenshot.', images_unavailable: 'Reading images isn’t available here. Describe the play instead.',
  refused: 'The AI couldn’t draw that one. Try describing it differently.', invalid_json: 'The answer didn’t come back as a play. Try again or add more detail.',
  empty_completion: 'No answer came back. Add more detail and try again.', prompt_too_large: 'That’s too long. Shorten the description.',
  image_too_large: 'That image is over 5 MB. Try a smaller screenshot.', network: 'Couldn’t reach the AI. Check your connection and try again.'
};
const aiError = e => e && e.code ? (AI_ERRORS[e.code] || (e.code === 'cancelled' ? '' : 'Something went wrong reaching the AI. Try again.')) : (e && e.message) || 'That play couldn’t be built. Try again.';
