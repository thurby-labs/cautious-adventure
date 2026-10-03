/* ---------- AI: describe a play, or read a diagram ----------
   AI drafting goes through the Open Grass Worker (worker/ folder), which holds the Anthropic key
   and the play-drawing prompts. Set AI_ENDPOINT to the Worker's URL after `npm run deploy`;
   leave it empty and the New play dialog shows AI drafting as unavailable.
   Never put API keys in this file: it ships to every browser. */
const AI_ENDPOINT = 'https://open-grass-ai.thurby-labs.workers.dev';
const AI_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const AI_MAX_IMAGE = 5 * 1024 * 1024;

function aiProvider() {
  if (!AI_ENDPOINT) return null;
  return {
    // input: { description } or { image: File }. Resolves to the raw play object; throws { code }.
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
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal
        });
      } catch (e) { throw { code: e && e.name === 'AbortError' ? 'cancelled' : 'network' }; }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.play) throw { code: (data && data.code) || 'upstream_error' };
      return data.play;
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
  const raw = await ai.json(input, { signal: aiCtl.signal });
  return normalizePlay(raw, 'd' + rid());
}
const AI_UNAVAILABLE = 'AI drafting needs the AI-enabled version of Open Grass. You can still import a play file.';
const AI_ERRORS = {
  unavailable: AI_UNAVAILABLE,
  rate_limited: 'Too many requests right now. Wait a minute and try again.',
  image_rejected: 'That image couldn’t be read. Try a PNG or JPG screenshot.', images_unavailable: 'Reading images isn’t available here. Describe the play instead.',
  refused: 'The AI couldn’t draw that one. Try describing it differently.', invalid_json: 'The answer didn’t come back as a play. Try again or add more detail.',
  empty_completion: 'No answer came back. Add more detail and try again.', prompt_too_large: 'That’s too long. Shorten the description.',
  image_too_large: 'That image is over 5 MB. Try a smaller screenshot.', network: 'Couldn’t reach the AI. Check your connection and try again.'
};
const aiError = e => e && e.code ? (AI_ERRORS[e.code] || (e.code === 'cancelled' ? '' : 'Something went wrong reaching the AI. Try again.')) : (e && e.message) || 'That play couldn’t be built. Try again.';
