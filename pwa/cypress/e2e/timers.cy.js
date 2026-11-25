// Covers: creating, editing, duplicating and deleting timers; validation; unsaved-change guard.
import { simpleTimer } from "../support/builders.js";

describe("timers", () => {
  it("creates a timer and keeps it after reload", () => {
    cy.gotoApp();
    cy.tid("timers-new").click();
    cy.tid("editor-modal").should("exist");
    cy.tid("editor-name").type("Morning HIIT");

    // New timers start with one block: 8 × (work 0:40, rest 0:20).
    cy.tid("block-0-reps-value").should("contain", "8");
    cy.tid("block-0-reps-minus").click().click().click(); // 5 reps
    cy.tid("block-0-step-0-seconds").clear().type("30{enter}");
    cy.tid("block-0-step-0-name").type("Burpees");
    // 5 × 30 + 5 × 20 − the trailing rest = 230s
    cy.tid("editor-total").should("have.text", "3m 50s");

    cy.tid("editor-add-block").click();
    cy.tid("block-1-step-0-kind-cooldown").click();
    cy.tid("block-1-step-1-remove").click();
    cy.tid("block-1-name").type("Stretch");

    cy.tid("editor-save").click();
    cy.tid("editor-modal").should("not.exist");
    cy.tid("timer-card").should("have.length", 1);
    cy.tid("timer-card-name").should("have.text", "Morning HIIT");

    cy.readStore("timers").then((timers) => {
      expect(timers).to.have.length(1);
      const [t] = timers;
      expect(t.name).to.eq("Morning HIIT");
      expect(t.blocks).to.have.length(2);
      expect(t.blocks[0].reps).to.eq(5);
      expect(t.blocks[0].steps[0]).to.include({ kind: "work", name: "Burpees", seconds: 30 });
      expect(t.blocks[1].steps).to.have.length(1);
      expect(t.blocks[1].steps[0].kind).to.eq("cooldown");
      expect(t.blocks[1].name).to.eq("Stretch");
    });
    cy.reload();
    cy.tid("timer-card-name").should("have.text", "Morning HIIT");
  });

  it("won't save a timer with no time in it", () => {
    cy.gotoApp();
    cy.tid("timers-new").click();
    cy.tid("block-0-step-0-seconds").clear().type("0{enter}");
    cy.tid("block-0-step-1-seconds").clear().type("0{enter}");
    cy.tid("editor-save").click();
    cy.tid("editor-error").should("exist");
    cy.tid("editor-modal").should("exist");
  });

  it("edits an existing timer", () => {
    cy.gotoApp({ timers: [simpleTimer("t1", "Legs")] });
    cy.tid("timer-card-edit").click();
    cy.tid("editor-name").clear().type("Leg day");
    cy.tid("block-0-step-1-down").should("be.disabled");
    cy.tid("block-0-step-1-up").click();
    cy.tid("editor-save").click();
    cy.tid("timer-card-name").should("have.text", "Leg day");
    cy.readStore("timers").then(([t]) => {
      expect(t.id).to.eq("t1");
      expect(t.blocks[0].steps.map((s) => s.kind)).to.deep.eq(["rest", "work"]);
    });
  });

  it("asks before discarding unsaved changes", () => {
    cy.gotoApp({ timers: [simpleTimer("t1", "Legs")] });
    cy.tid("timer-card-edit").click();
    cy.tid("editor-name").clear().type("Changed");
    cy.confirmDialogs(false);
    cy.tid("editor-close").click();
    cy.tid("editor-modal").should("exist");
  });

  it("duplicates and deletes", () => {
    cy.gotoApp({ timers: [simpleTimer("t1", "Legs"), simpleTimer("t2", "Arms")] });
    cy.tid("timer-card-edit").first().click();
    cy.tid("editor-duplicate").click();
    cy.tid("timer-card-name").then(($n) => {
      expect([...$n].map((n) => n.textContent)).to.deep.eq(["Legs", "Legs (copy)", "Arms"]);
    });

    cy.confirmDialogs(true);
    cy.tid("timer-card-edit").eq(1).click();
    cy.tid("editor-delete").click();
    cy.tid("timer-card").should("have.length", 2);
    cy.readStore("timers").then((timers) => {
      expect(timers.map((t) => t.name)).to.deep.eq(["Legs", "Arms"]);
    });
  });
});
