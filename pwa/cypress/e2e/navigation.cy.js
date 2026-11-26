// Covers: first-run splash, tab switching, theme toggle, lock-screen setting, device Back closing overlays.

describe("navigation", () => {
  it("shows the splash once, then remembers it was dismissed", () => {
    cy.gotoApp({ skipGating: true });
    cy.tid("splash-continue").click();
    cy.tid("timers-view").should("exist");
    cy.reload();
    cy.tid("splash").should("not.exist");
    cy.tid("timers-view").should("exist");
  });

  it("switches between tabs", () => {
    cy.gotoApp();
    cy.tid("timers-empty").should("exist");
    cy.tab("counters");
    cy.tid("counters-empty").should("exist");
    cy.tid("counters-new").should("exist");
    cy.tid("timers-new").should("not.exist");
    cy.tab("history");
    cy.tid("history-empty").should("exist");
    cy.tab("timers");
    cy.tid("timers-new").should("exist");
  });

  it("toggles the Dusk theme and keeps it after reload", () => {
    cy.gotoApp();
    cy.get("html").should("have.attr", "data-theme", "thistle");
    cy.tid("menu-button").click();
    cy.tid("menu-theme").click();
    cy.get("html").should("have.attr", "data-theme", "dusk");
    cy.readStore("theme").should("eq", "dusk");
    cy.reload();
    cy.get("html").should("have.attr", "data-theme", "dusk");
  });

  it("closes the top overlay on Back instead of leaving the app", () => {
    cy.gotoApp();
    cy.tid("menu-button").click();
    cy.tid("menu").should("exist");
    cy.go("back");
    cy.tid("menu").should("not.exist");

    cy.tid("menu-button").click();
    cy.tid("menu-backup").click();
    cy.tid("backup-modal").should("exist");
    cy.go("back");
    cy.tid("backup-modal").should("not.exist");
    cy.tid("timers-view").should("exist");
  });

  it("picks a lock-screen mode and keeps it after reload", () => {
    cy.gotoApp();
    cy.readStore("lockScreen").should("eq", "off");
    cy.tid("menu-button").click();
    cy.tid("menu-lockscreen").click();
    cy.tid("lockscreen-off").should("have.attr", "aria-checked", "true");
    cy.tid("lockscreen-media").click();
    cy.tid("lockscreen-media").should("have.attr", "aria-checked", "true");
    cy.readStore("lockScreen").should("eq", "media");
    cy.reload();
    cy.tid("menu-button").click();
    cy.tid("menu-lockscreen").click();
    cy.tid("lockscreen-media").should("have.attr", "aria-checked", "true");
  });
});
