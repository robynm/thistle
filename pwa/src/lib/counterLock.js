// Shows one counter in a notification with − and + buttons while the app is hidden
// (Android only; see notifySupported in lockScreen.js).
//
// The service worker (public/notify-sw.js) handles the buttons by itself, because
// Android may freeze or close the page while the phone is locked. It updates the
// notification's count and adds the change to a per-counter total in IndexedDB. The
// page takes those totals (reading and clearing them in one transaction) when the
// worker says something changed, when it comes back into view, and on load.
//
// The database, store, tag, action names and title format are shared with
// public/notify-sw.js and must match it.
import { useEffect, useRef } from "react";
import { notifySupported } from "./lockScreen.js";
import { Log } from "./log.js";

const DB = "thistle-sw";
const STORE = "counterDeltas";
const TAG = "thistle-counter";
const SYNC_MESSAGE = "thistle:counter-sync";

export const counterTitle = (name, count) => `${name || "Untitled counter"}: ${count}`;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Returns { [counterId]: delta } and empties the store.
async function takeDeltas() {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const out = {};
      const tx = db.transaction(STORE, "readwrite");
      const cursor = tx.objectStore(STORE).openCursor();
      cursor.onsuccess = () => {
        const c = cursor.result;
        if (!c) return;
        out[c.key] = c.value;
        c.delete();
        c.continue();
      };
      tx.oncomplete = () => resolve(out);
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function registration() {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) throw new Error("NoServiceWorker");
  return reg;
}

async function closeCounterNotification() {
  const reg = await registration();
  (await reg.getNotifications({ tag: TAG })).forEach((n) => n.close());
}

async function showCounterNotification(counter) {
  const reg = await registration();
  await reg.showNotification(counterTitle(counter.name, counter.count), {
    tag: TAG,
    icon: "/icons/icon-192.png",
    silent: true,
    renotify: false,
    requireInteraction: true,
    data: { counterId: counter.id, name: counter.name, count: counter.count },
    actions: [
      { action: "counter-minus", title: "−" },
      { action: "counter-plus", title: "+" },
    ],
  });
}

const errName = (e) => (e?.name === "Error" ? e.message : e?.name || String(e));

// `counter` is the one to show, or null. `onDeltas({ [id]: delta })` applies changes
// made from the notification.
export function useCounterLockScreen(counter, onDeltas) {
  const live = useRef({ counter, onDeltas });
  live.current = { counter, onDeltas };
  const supported = notifySupported();

  // Changes made from the notification, picked up whenever they might be waiting.
  useEffect(() => {
    if (!supported) return undefined;
    const sync = async () => {
      try {
        const deltas = await takeDeltas();
        if (Object.keys(deltas).length) live.current.onDeltas(deltas);
      } catch (e) {
        Log.warn("lockscreen.counter.sync.failed", { error: errName(e) });
      }
    };
    const onMessage = (e) => e.data?.type === SYNC_MESSAGE && sync();
    sync();
    navigator.serviceWorker.addEventListener("message", onMessage);
    document.addEventListener("visibilitychange", sync);
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [supported]);

  // Shown while hidden, closed while visible. Not re-shown when a change comes in
  // from the notification while hidden: the worker has already updated it.
  const id = counter?.id ?? null;
  useEffect(() => {
    if (!supported) return undefined;
    const update = () => {
      const c = live.current.counter;
      const show = c && document.hidden && Notification.permission === "granted";
      (show ? showCounterNotification(c) : closeCounterNotification()).catch((e) =>
        Log.warn("lockscreen.notify.failed", { error: errName(e) }),
      );
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, [supported, id]);
}
