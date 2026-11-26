// Pause and Skip controls for a run while the phone is locked. The person picks one
// mode in the menu (stored under STORAGE_KEYS.lockScreen):
//
// - "media": loops a silent audio track so the run becomes the phone's "now playing"
//   item. The lock screen then shows the step, a countdown bar, and Pause/Skip. Playing
//   audio is the only way a web app gets there, and it pauses any other music.
// - "notify": a notification with Pause and Skip buttons, shown while the page is
//   hidden. Other audio keeps playing. Only Chromium browsers (Android) support
//   notification buttons, so the mode is unavailable elsewhere. A notification can't
//   tick, so it shows the clock time the step ends instead, and it can be swiped away.
//
// Neither mode offers a stop or dismiss control, on purpose.
import { useEffect, useRef, useState } from "react";
import { KIND_LABEL } from "./constants.js";
import { fmtClock } from "./format.js";
import { Log } from "./log.js";

export const LOCK_MODES = ["off", "notify", "media"];

export const mediaSupported = () => typeof navigator !== "undefined" && "mediaSession" in navigator;

export const notifySupported = () =>
  typeof window !== "undefined" &&
  "Notification" in window &&
  "serviceWorker" in navigator &&
  (Notification.maxActions ?? 0) >= 2;

// Returns true when notifications may be shown, asking the person if needed.
export async function requestNotifyPermission() {
  if (!notifySupported()) return false;
  if (Notification.permission === "granted") return true;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

// --- Silent audio (media mode) --------------------------------
// A 10 s silent WAV built in memory. Chrome only shows media controls for audio at
// least 5 s long, and building it here means no sound file to cache.
function silentWavUrl(seconds = 10, rate = 8000) {
  const n = seconds * rate;
  const buf = new ArrayBuffer(44 + n);
  const v = new DataView(buf);
  const str = (at, s) => { for (let i = 0; i < s.length; i++) v.setUint8(at + i, s.charCodeAt(i)); };
  str(0, "RIFF"); v.setUint32(4, 36 + n, true); str(8, "WAVE");
  str(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  str(36, "data"); v.setUint32(40, n, true);
  new Uint8Array(buf, 44).fill(128); // 8-bit PCM silence is the midpoint
  return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
}

let audio = null;
function playSilence() {
  try {
    if (!audio) {
      audio = new Audio(silentWavUrl());
      audio.loop = true;
    }
    audio.play().catch((e) => Log.warn("lockscreen.play.failed", { error: e?.name || String(e) }));
  } catch (e) {
    Log.warn("lockscreen.play.failed", { error: e?.name || String(e) });
  }
}
const pauseSilence = () => audio?.pause();

// Call from the tap that starts a run: browsers only let audio start inside a gesture.
export function primeLockScreen(mode) {
  if (mode === "media" && mediaSupported()) playSilence();
}

function setAction(action, fn) {
  try {
    navigator.mediaSession.setActionHandler(action, fn);
  } catch (e) {
    if (fn) Log.warn("lockscreen.action.failed", { action, error: e?.name || String(e) });
  }
}

// --- Notification (notify mode) -------------------------------
const TAG = "thistle-run";
// Must match the message type sent by public/notify-sw.js.
const SW_MESSAGE = "thistle:run-action";

// Shows and closes run in order, so a late "show" can't reopen a closed notification.
let queue = Promise.resolve();
function enqueue(fn) {
  queue = queue.then(async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) throw new Error("NoServiceWorker");
      await fn(reg);
    } catch (e) {
      Log.warn("lockscreen.notify.failed", { error: e?.name === "Error" ? e.message : e?.name || String(e) });
    }
  });
}

const showNotification = (title, opts) => enqueue((reg) => reg.showNotification(title, { tag: TAG, ...opts }));
const closeNotification = () =>
  enqueue(async (reg) => (await reg.getNotifications({ tag: TAG })).forEach((n) => n.close()));

// --- Hook -----------------------------------------------------
const roundText = (seg) => (seg.kind !== "ready" && seg.reps > 1 ? `Round ${seg.rep} of ${seg.reps}` : "");

// Keeps the lock-screen controls in step with a run. `run` is useRunner's result.
export function useLockScreen(mode, timer, run) {
  const active = !run.done;
  const media = active && mode === "media" && mediaSupported();
  const notify = active && mode === "notify" && notifySupported() && Notification.permission === "granted";

  const live = useRef(run);
  live.current = run;

  const seg = run.segments[run.index];
  const next = run.segments[run.index + 1];
  const wholeSec = Math.ceil(run.remainingMs / 1000);

  // Media mode: action handlers and the audio lifetime.
  useEffect(() => {
    if (!media) return undefined;
    const ms = navigator.mediaSession;
    setAction("play", () => {
      playSilence();
      if (live.current.paused) live.current.togglePause();
    });
    setAction("pause", () => {
      pauseSilence();
      if (!live.current.paused) live.current.togglePause();
    });
    setAction("nexttrack", () => live.current.skip());
    return () => {
      for (const a of ["play", "pause", "nexttrack"]) setAction(a, null);
      pauseSilence();
      ms.metadata = null;
      ms.playbackState = "none";
    };
  }, [media]);

  useEffect(() => {
    if (!media) return;
    if (run.paused) pauseSilence();
    else playSilence();
    navigator.mediaSession.playbackState = run.paused ? "paused" : "playing";
  }, [media, run.paused]);

  useEffect(() => {
    if (!media) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: seg.name,
        artist: [KIND_LABEL[seg.kind], roundText(seg)].filter(Boolean).join(" · "),
        album: timer.name || "Thistle",
        artwork: [{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }],
      });
    } catch (e) {
      Log.warn("lockscreen.action.failed", { action: "metadata", error: e?.name || String(e) });
    }
  }, [media, seg, timer.name]);

  // The bar shows time through the current step. The OS moves it along by itself, so a
  // resync once a second only corrects drift and jumps (skip, back, pause).
  useEffect(() => {
    if (!media || !navigator.mediaSession.setPositionState) return;
    const duration = seg.seconds;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        position: Math.min(duration, Math.max(0, duration - run.remainingMs / 1000)),
        playbackRate: 1,
      });
    } catch (e) {
      Log.warn("lockscreen.action.failed", { action: "positionState", error: e?.name || String(e) });
    }
  }, [media, seg, run.index, run.paused, wholeSec]);

  // Notify mode: shown only while the page is hidden (locked or in another app).
  const [hidden, setHidden] = useState(() => typeof document !== "undefined" && document.hidden);
  const shown = useRef(null); // { key, endMs } of the notification on screen
  useEffect(() => {
    if (!notify) return undefined;
    const onVis = () => setHidden(document.hidden);
    const onMessage = (e) => {
      if (e.data?.type !== SW_MESSAGE) return;
      if (e.data.action === "pause") live.current.togglePause();
      else if (e.data.action === "skip") live.current.skip();
    };
    onVis();
    document.addEventListener("visibilitychange", onVis);
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      navigator.serviceWorker.removeEventListener("message", onMessage);
      closeNotification();
      shown.current = null;
    };
  }, [notify]);

  // Runs on every runner tick while hidden, but only re-posts when the text would change or the
  // step's end time moved (Back restarting a step keeps the same index).
  useEffect(() => {
    if (!notify) return;
    if (!hidden) {
      if (shown.current) closeNotification();
      shown.current = null;
      return;
    }
    const left = run.remainingMs;
    const endMs = Date.now() + left;
    const key = `${run.index}|${run.paused}|${run.paused ? wholeSec : ""}`;
    const prev = shown.current;
    if (prev && prev.key === key && (run.paused || Math.abs(prev.endMs - endMs) < 1500)) return;
    shown.current = { key, endMs };

    const ends = new Date(endMs).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
    const title = [seg.name, roundText(seg)].filter(Boolean).join(" · ");
    const after = next ? `Next: ${next.name}` : "Last one";
    showNotification(title, {
      body: run.paused ? `Paused · ${fmtClock(wholeSec)} left` : `Until ${ends} · ${after}`,
      icon: "/icons/icon-192.png",
      silent: true,
      renotify: false,
      requireInteraction: true,
      actions: [
        { action: "pause", title: run.paused ? "Resume" : "Pause" },
        { action: "skip", title: "Skip" },
      ],
    });
  }, [notify, hidden, seg, next, run.index, run.paused, run.remainingMs, wholeSec]);
}
