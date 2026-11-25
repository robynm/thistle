// Custom commands. Keys mirror STORAGE_KEYS in src/lib/constants.js.
const KEYS = {
  timers: "thistle:timers:v1",
  history: "thistle:history:v1",
  quick: "thistle:quick:v1",
  sound: "thistle:sound:v1",
  theme: "thistle:theme:v1",
  splashSeen: "thistle:splashSeen:v1",
};

// Boots the app from a known state. Clears storage, skips the first-run splash (unless
// `skipGating: true`), writes any collections given, and turns sound off unless asked.
Cypress.Commands.add("gotoApp", (state = {}) => {
  const { skipGating = false, sound = false, ...collections } = state;
  cy.visit("/", {
    onBeforeLoad(win) {
      win.localStorage.clear();
      if (!skipGating) win.localStorage.setItem(KEYS.splashSeen, "true");
      win.localStorage.setItem(KEYS.sound, JSON.stringify(sound));
      for (const [name, value] of Object.entries(collections)) {
        if (!KEYS[name]) throw new Error(`gotoApp: unknown state key "${name}"`);
        win.localStorage.setItem(KEYS[name], JSON.stringify(value));
      }
    },
  });
  cy.tid(skipGating ? "splash" : "nav-timers").should("exist");
});

Cypress.Commands.add("tid", (id, options) => cy.get(`[data-testid="${id}"]`, options));

Cypress.Commands.add("tab", (name) => cy.tid(`nav-${name}`).click());

// Answers every native confirm() for the rest of the test.
Cypress.Commands.add("confirmDialogs", (accept = true) => {
  cy.on("window:confirm", () => accept);
});

Cypress.Commands.add("readStore", (name) =>
  cy.window().then((win) => JSON.parse(win.localStorage.getItem(KEYS[name]) ?? "null")),
);
