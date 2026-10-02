/* ---------- AI: describe a play, or read a diagram ----------
   The static site (open-grass.com) has no AI backend, so aiProvider() returns null and the
   New play dialog shows AI drafting as unavailable. To turn it back on, return an object here with
     json(prompt, { signal, images }) -> Promise<raw play object>   (errors: throw { code } using AI_ERRORS keys)
     limits() -> Promise<{ images: { mediaTypes: [...] } } | null>
   backed by a server-side proxy. Never put API keys in this file: it ships to every browser. */
function aiProvider() { return null; }

const slim = p => ({ name: p.name.replace(/^\d+\s*·\s*/, ''), type: p.type, concept: p.concept, players: p.players.map(q => ({ id: q.id, start: q.start, route: q.route, routeName: q.routeName, ...(q.shape === 'star' ? { star: true } : {}) })) });
const PLAY_FORMAT = `Return ONLY one JSON object describing a youth 5v5 flag football play, in this shape:
{"name": string, "type": "pass"|"run"|"trick", "concept": short string,
 "handoff": {"to": id, "at": routeIndex, "thenPass": boolean}   (only for runs and trick passes),
 "players": [{"id": "X"|"Y"|"Z"|"C"|"Q", "start": [x, y], "route": [[x, y], ...], "routeName": short string,
   "star": true (exactly one: the designed target or ball carrier), "dashed": true (fake or decoy path),
   "motion": [[x, y]] (only if the player motions before the snap: where the motion begins)}]}
Field, in yards: x runs 0 (left sideline) to 30 (right sideline); the ball and C start at [15, 0]. y is yards past the line of scrimmage; negative is the backfield.
Players: C is the center (snaps, then runs a route). Q is the quarterback, about [15, -3] to [15, -4.5]; Q's route is the drop or rollout, like [[15, -5]] or [[9, -4.5]]. X is orange, Y purple, Z green. Wideouts usually line up 3-6 yards from a sideline, slots 4-8 yards from the ball, backs at y -4 to -6.
A route lists waypoints after the start; an optional third number is a pause in seconds. Depths: slant breaks at 2 and ends near 6; hitch runs to 5 and comes back to 4.5; outs and ins break at 5; corners and posts break at 6-7 then angle 4-6 yards; go routes end at y 17; flats end at y 3-5 near the sideline.
Run play: "handoff.to" is the ball carrier and "at" is the index in that player's route where they meet Q. Trick pass: the same with "thenPass": true; the carrier throws from behind the line.
Name the play by formation and key action, like "Trips Right, X Flat Left". Never use play names from published playbooks.
Example of the format: ${JSON.stringify(slim(PLAYS.find(p => p.id === 'p12')))}`;

let aiCtl = null;
async function askAI(prompt, images, statusEl) {
  const ai = aiProvider();
  if (!ai) throw { code: 'unavailable' };
  if (aiCtl) aiCtl.abort();
  aiCtl = new AbortController();
  statusEl.className = 'status'; statusEl.textContent = 'Drawing the play…';
  const raw = await ai.json(prompt, { signal: aiCtl.signal, ...(images ? { images } : {}) });
  return normalizePlay(raw, 'd' + rid());
}
const AI_UNAVAILABLE = 'AI drafting needs the AI-enabled version of Open Grass. You can still import a play file.';
const AI_ERRORS = {
  unavailable: AI_UNAVAILABLE,
  rate_limited: 'Too many requests right now. Wait a minute and try again.',
  image_rejected: 'That image couldn’t be read. Try a PNG or JPG screenshot.', images_unavailable: 'Reading images isn’t available here. Describe the play instead.',
  refused: 'The AI couldn’t draw that one. Try describing it differently.', invalid_json: 'The answer didn’t come back as a play. Try again or add more detail.',
  empty_completion: 'No answer came back. Add more detail and try again.', prompt_too_large: 'That’s too long. Shorten the description.'
};
const aiError = e => e && e.code ? (AI_ERRORS[e.code] || (e.code === 'cancelled' ? '' : 'Something went wrong reaching the AI. Try again.')) : (e && e.message) || 'That play couldn’t be built. Try again.';
