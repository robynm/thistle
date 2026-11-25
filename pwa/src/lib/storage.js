// localStorage helpers. Everything Thistle stores is small JSON, so there is no
// IndexedDB store. Reads and writes never throw: a failed read returns the fallback,
// and a failed write logs and (once per session) tells the user storage is full.
import { Log } from "./log.js";

let warnedFull = false;

export function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    Log.error("storage.write.failed", { key, error: e?.name || String(e) });
    if (!warnedFull && e?.name === "QuotaExceededError") {
      warnedFull = true;
      alert("Your device storage is full, so Thistle couldn't save your latest change. Free up some space and try again.");
    }
    return false;
  }
}

// Asks the browser not to evict our data under storage pressure. Best effort.
export async function requestPersistence() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch { /* unsupported */ }
}
