// Loaded into the generated service worker (workbox.importScripts in vite.config.js).
// Handles taps on Thistle's two notifications:
//
// - Run (Pause/Skip): the open page owns the timer, so the tap is passed on to it.
//   The message type must match SW_MESSAGE in src/lib/lockScreen.js.
// - Counter (− / +): handled here, since Android may have frozen or closed the page.
//   The notification is re-shown with the new count, and the change is added to a
//   per-counter total in IndexedDB for the page to apply. Names and the title format
//   must match src/lib/counterLock.js.

const DB = "thistle-sw";
const STORE = "counterDeltas";
const COUNTER_TAG = "thistle-counter";
const COUNTER_SYNC = "thistle:counter-sync";
const MAX_COUNT = 999999;

const counterTitle = (name, count) => `${name || "Untitled counter"}: ${count}`;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Adds `delta` to the counter's pending total in one transaction.
async function addDelta(counterId, delta) {
  const db = await openDb();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const get = store.get(counterId);
      get.onsuccess = () => store.put((get.result || 0) + delta, counterId);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function windows() {
  return self.clients.matchAll({ type: "window", includeUncontrolled: true });
}

// Taps are handled one at a time, each reading the count from the notification as it
// is now, so quick repeated taps aren't lost.
let counterQueue = Promise.resolve();

function stepCounter(step) {
  counterQueue = counterQueue.then(async () => {
    const [n] = await self.registration.getNotifications({ tag: COUNTER_TAG });
    if (!n || !n.data) return;
    const { counterId, name, count } = n.data;
    const next = Math.min(MAX_COUNT, Math.max(0, count + step));
    if (next === count) return;
    // Record first, so the notification never shows a count the app won't get.
    await addDelta(counterId, next - count);
    await self.registration.showNotification(counterTitle(name, next), {
      tag: COUNTER_TAG,
      icon: n.icon,
      silent: true,
      renotify: false,
      requireInteraction: true,
      data: { counterId, name, count: next },
      actions: n.actions,
    });
    (await windows()).forEach((w) => w.postMessage({ type: COUNTER_SYNC }));
  }).catch((e) => console.warn("[thistle] counter notification step failed", e));
  return counterQueue;
}

self.addEventListener("notificationclick", (event) => {
  const action = event.action;
  if (action === "counter-plus" || action === "counter-minus") {
    event.waitUntil(stepCounter(action === "counter-plus" ? 1 : -1));
    return;
  }
  event.waitUntil(
    (async () => {
      const wins = await windows();
      if (action) {
        wins.forEach((w) => w.postMessage({ type: "thistle:run-action", action }));
        return;
      }
      // A tap on the notification body opens the app. If the app was closed, a run is
      // gone, so its notification goes too; the app reopens either way.
      if (wins[0]) return wins[0].focus();
      if (event.notification.tag !== COUNTER_TAG) event.notification.close();
      return self.clients.openWindow("/");
    })(),
  );
});
