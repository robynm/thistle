import "./commands.js";

// Headless Electron has no audio output and may refuse wake locks; the app logs these
// and carries on, so ignore them if they surface. Everything else fails the test.
const IGNORED = [/AudioContext/i, /wakeLock|Wake Lock/i, /ResizeObserver loop/i];

Cypress.on("uncaught:exception", (err) => {
  if (IGNORED.some((re) => re.test(err.message))) return false;
  return undefined;
});
