// Loaded into the generated service worker (workbox.importScripts in vite.config.js).
// The run notification's buttons arrive here; the open page owns the timer, so they are
// passed on to it. The message type must match SW_MESSAGE in src/lib/lockScreen.js.
self.addEventListener("notificationclick", (event) => {
  const action = event.action;
  event.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (action) {
        wins.forEach((w) => w.postMessage({ type: "thistle:run-action", action }));
        return;
      }
      // A tap on the notification body opens the app. If the app was closed the run
      // is gone, so the notification goes too.
      if (wins[0]) return wins[0].focus();
      event.notification.close();
      return self.clients.openWindow("/");
    })(),
  );
});
