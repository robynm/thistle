// The run engine: steps through a flattened timer and plays the cues.
//
// Position on the timeline is advanced from Date.now() deltas, not by counting ticks,
// so the countdown stays right when the browser throttles timers in the background.
// If the page was hidden through several steps, it lands on the right step and plays
// a single cue. (Tests drive it with cy.clock, which controls Date and setInterval.)
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BACK_RESTART_MS } from "./constants.js";
import { Beep } from "./sound.js";

const TICK_MS = 100;

export function useRunner(segments, { soundOn, onDone }) {
  // offsets[i] is when segment i starts (ms); offsets[n] is the end.
  const offsets = useMemo(() => {
    const out = [0];
    for (const s of segments) out.push(out[out.length - 1] + s.seconds * 1000);
    return out;
  }, [segments]);
  const total = offsets[offsets.length - 1];
  const readyMs = segments[0]?.kind === "ready" ? segments[0].seconds * 1000 : 0;

  const opts = useRef({ soundOn, onDone });
  opts.current = { soundOn, onDone };

  const st = useRef({ pos: 0, last: Date.now(), paused: false, activeMs: 0, done: false, index: 0, lastWhole: null });

  const indexAt = useCallback((pos) => {
    let i = 0;
    while (i < segments.length - 1 && offsets[i + 1] <= pos) i++;
    return i;
  }, [segments, offsets]);

  const snapshot = () => {
    const s = st.current;
    return {
      index: s.index,
      remainingMs: Math.max(0, offsets[s.index + 1] - s.pos),
      posMs: s.pos,
      paused: s.paused,
      done: s.done,
    };
  };
  const [snap, setSnap] = useState(snapshot);

  // Only the part of the run after get-ready counts towards progress.
  const result = () => {
    const s = st.current;
    const span = total - readyMs;
    return {
      completed: s.done,
      elapsedSec: Math.round(s.activeMs / 1000),
      progress: span > 0 ? Math.min(1, Math.max(0, (s.pos - readyMs) / span)) : 1,
    };
  };

  const advance = useCallback(() => {
    const s = st.current;
    if (s.done) return;
    const now = Date.now();
    if (!s.paused) {
      const prev = s.pos;
      s.pos = Math.min(total, s.pos + Math.max(0, now - s.last));
      s.activeMs += Math.max(0, s.pos - Math.max(prev, readyMs));
    }
    s.last = now;

    const sound = opts.current.soundOn;
    const i = indexAt(s.pos);
    const whole = Math.ceil((offsets[i + 1] - s.pos) / 1000);
    if (s.pos >= total) {
      s.done = true;
      if (sound) Beep.finish();
      opts.current.onDone?.(result());
    } else if (i !== s.index) {
      s.index = i;
      if (sound) Beep.go();
    } else if (!s.paused && s.lastWhole !== null && whole < s.lastWhole && whole >= 1 && whole <= 3) {
      if (sound) Beep.count();
    }
    s.lastWhole = whole;
    setSnap(snapshot());
  }, [indexAt, offsets, total, readyMs]);

  useEffect(() => {
    const id = setInterval(advance, TICK_MS);
    document.addEventListener("visibilitychange", advance);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", advance);
    };
  }, [advance]);

  // Moves to the start of a segment. `pick` gets the up-to-date state and returns the
  // segment index; segments.length means "the end".
  const jumpTo = (pick) => {
    advance();
    const s = st.current;
    if (s.done) return;
    const target = pick(s);
    s.pos = offsets[target];
    s.last = Date.now();
    s.lastWhole = null;
    if (s.pos >= total) {
      advance();
      return;
    }
    s.index = target;
    if (opts.current.soundOn) Beep.go();
    setSnap(snapshot());
  };

  return {
    ...snap,
    segments,
    totalMs: total,
    readyMs,
    togglePause() {
      advance();
      st.current.paused = !st.current.paused;
      st.current.last = Date.now();
      setSnap(snapshot());
    },
    skip() {
      jumpTo((s) => s.index + 1);
    },
    back() {
      jumpTo((s) => (s.pos - offsets[s.index] > BACK_RESTART_MS || s.index === 0 ? s.index : s.index - 1));
    },
    result,
  };
}
