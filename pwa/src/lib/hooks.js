// Shared hooks: body scroll lock, install prompt, screen wake lock.
import { useEffect, useState } from "react";
import { Log } from "./log.js";

// --- Body scroll lock -----------------------------------------
// Counted, so nested overlays don't unlock the page when the inner one closes.
let locks = 0;
export function useBodyScrollLock() {
  useEffect(() => {
    if (locks++ === 0) document.body.style.overflow = "hidden";
    return () => {
      if (--locks === 0) document.body.style.overflow = "";
    };
  }, []);
}

// --- Install --------------------------------------------------
export function isStandalone() {
  try {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  } catch {
    return false;
  }
}

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

// The `beforeinstallprompt` event fires early, often before React mounts, so it is
// captured at import time and handed to whichever component asks for it.
let deferred = null;
const listeners = new Set();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    listeners.forEach((fn) => fn(e));
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((fn) => fn(null));
  });
}

export function useInstallPrompt() {
  const [evt, setEvt] = useState(deferred);
  useEffect(() => {
    listeners.add(setEvt);
    return () => listeners.delete(setEvt);
  }, []);
  const prompt = async () => {
    if (!evt) return false;
    try {
      evt.prompt();
      const { outcome } = await evt.userChoice;
      deferred = null;
      setEvt(null);
      return outcome === "accepted";
    } catch (e) {
      Log.warn("install.failed", { error: String(e) });
      return false;
    }
  };
  return { canPrompt: Boolean(evt), prompt };
}

// --- Wake lock ------------------------------------------------
// Keeps the screen on while `active`. The browser drops the lock whenever the page
// is hidden, so it is taken again each time the page becomes visible.
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return undefined;
    let lock = null;
    let cancelled = false;
    const acquire = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const l = await navigator.wakeLock.request("screen");
        if (cancelled) l.release().catch(() => {});
        else lock = l;
      } catch (e) {
        Log.warn("wakeLock.failed", { error: e?.name || String(e) });
      }
    };
    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", acquire);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
