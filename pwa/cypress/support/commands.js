// Custom commands. Keys mirror STORAGE_KEYS in src/lib/constants.js.
const KEYS = {
  timers: "thistle:timers:v1",
  lists: "thistle:lists:v1",
  listsOpen: "thistle:listsOpen:v1",
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

// Drags the item that owns `gripId` (match number `gripIndex`) so it lands just before or just
// after the element matching `targetId`, using real PointerEvents.
//
// The press happens first; then, once the app has re-rendered (a list drag collapses
// the sections) and measured, the move and release are sent together. Sending them in
// one go means auto-scroll never runs mid-drag, so the drop point is exact.
Cypress.Commands.add("dragGrip", (gripId, targetId, { place = "after", gripIndex = 0, targetIndex = 0 } = {}) => {
  const fire = (win, el, type, x, y) =>
    el.dispatchEvent(new win.PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerId: 1, isPrimary: true }));
  let x;
  let startY;
  let grabOffset;
  let itemHeight;
  cy.tid(gripId).eq(gripIndex).scrollIntoView({ offset: { top: -250, left: 0 } });
  cy.tid(gripId).eq(gripIndex).then(($grip) => {
    const win = $grip[0].ownerDocument.defaultView;
    const grip = $grip[0].getBoundingClientRect();
    const item = $grip[0].closest("[data-sort-key]").getBoundingClientRect();
    x = grip.left + grip.width / 2;
    startY = grip.top + grip.height / 2;
    grabOffset = startY - item.top;
    itemHeight = item.height;
    fire(win, $grip[0], "pointerdown", x, startY);
  });
  cy.wait(80);
  cy.tid(targetId).eq(targetIndex).then(($target) => {
    const win = $target[0].ownerDocument.defaultView;
    const target = $target[0].getBoundingClientRect();
    // Put the dragged item's centre a quarter of the way into the target, on the chosen side.
    const centre = place === "after" ? target.top + target.height * 0.75 : target.top + target.height * 0.25;
    const endY = centre - itemHeight / 2 + grabOffset;
    fire(win, win, "pointermove", x, endY);
    fire(win, win, "pointerup", x, endY);
  });
});
