// Beeps made with Web Audio, so there are no sound files to cache.
//
// Browsers (iOS especially) only allow audio after a user gesture, so call
// `unlockAudio()` from the tap that starts a run. iOS also mutes Web Audio when
// the ringer switch is on silent; nothing in a web app can override that.
import { Log } from "./log.js";

let ctx = null;
let failed = false;

function getCtx() {
  if (ctx || failed) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  } catch (e) {
    failed = true;
    Log.warn("audio.failed", { error: String(e) });
  }
  return ctx;
}

export function unlockAudio() {
  const c = getCtx();
  if (!c) return;
  try {
    if (c.state === "suspended") c.resume();
    // A silent blip finishes the unlock on iOS.
    const buf = c.createBuffer(1, 1, 22050);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(c.destination);
    src.start(0);
  } catch (e) {
    Log.warn("audio.failed", { error: String(e) });
  }
}

function tone(freq, ms, { at = 0, gain = 0.35 } = {}) {
  const c = getCtx();
  if (!c) return;
  try {
    const t0 = c.currentTime + at;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    // Short attack and release so beeps don't click.
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
    g.gain.setValueAtTime(gain, t0 + ms / 1000 - 0.03);
    g.gain.linearRampToValueAtTime(0, t0 + ms / 1000);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + ms / 1000 + 0.02);
  } catch (e) {
    Log.warn("audio.failed", { error: String(e) });
  }
}

export const Beep = {
  // 3-2-1 before a step ends.
  count: () => tone(660, 120),
  // A new step starts.
  go: () => tone(990, 380),
  // The whole timer is done.
  finish: () => {
    tone(660, 160);
    tone(880, 160, { at: 0.18 });
    tone(1320, 420, { at: 0.36 });
  },
};
