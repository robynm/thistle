// Covers: creating, editing, duplicating and deleting timers; validation; unsaved-change guard;
// reordering blocks and steps; the card's kind bar and completion badge.
import { historyEntry, simpleTimer } from "../support/builders.js";

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
    // Arrow keys on a grip move the item; ArrowDown on the last step does nothing.
    cy.tid("block-0-step-1-grip").trigger("keydown", { key: "ArrowDown" });
    cy.tid("block-0-step-1-grip").trigger("keydown", { key: "ArrowUp" });
    cy.tid("editor-save").click();
    cy.tid("timer-card-name").should("have.text", "Leg day");
    cy.readStore("timers").then(([t]) => {
      expect(t.id).to.eq("t1");
      expect(t.blocks[0].steps.map((s) => s.kind)).to.deep.eq(["rest", "work"]);
    });
  });

  it("reorders blocks by dragging", () => {
    const t = simpleTimer("t1", "Legs");
    t.blocks.push({ ...t.blocks[0], id: "t1_b2", name: "Second", steps: t.blocks[0].steps.map((s) => ({ ...s, id: `${s.id}2` })) });
    t.blocks[0].name = "First";
    cy.gotoApp({ timers: [t] });
    cy.tid("timer-card-edit").click();
    cy.tid("block-0-name").should("have.value", "First");
    cy.dragGrip("block-1-grip", "block-0", { place: "before" });
    cy.tid("block-0-name").should("have.value", "Second");
    cy.tid("block-1-name").should("have.value", "First");
    cy.tid("editor-save").click();
    cy.readStore("timers").then(([saved]) => {
      expect(saved.blocks.map((b) => b.name)).to.deep.eq(["Second", "First"]);
    });
  });

  it("reorders steps by dragging", () => {
    cy.gotoApp({ timers: [simpleTimer("t1", "Legs")] });
    cy.tid("timer-card-edit").click();
    cy.dragGrip("block-0-step-0-grip", "block-0-step-1", { place: "after" });
    cy.tid("block-0-step-0-kind-rest").should("have.attr", "aria-checked", "true");
    cy.tid("block-0-step-1-kind-work").should("have.attr", "aria-checked", "true");
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

  it("orders the card's bar warm-up first, whatever the step order", () => {
    const t = simpleTimer("t1", "Mixed");
    t.blocks[0].steps = [
      { id: "s1", kind: "cooldown", name: "", seconds: 30 },
      { id: "s2", kind: "work", name: "", seconds: 30 },
      { id: "s3", kind: "warmup", name: "", seconds: 30 },
    ];
    cy.gotoApp({ timers: [t] });
    cy.tid("timer-card-bar").then(($bars) => {
      expect(Array.from($bars, (b) => b.dataset.kind)).to.deep.eq(["warmup", "work", "cooldown"]);
    });
  });

  it("badges each card with its finished runs from History", () => {
    const run = (id, timerId, completed) => ({ ...historyEntry(id, "x", { completed }), timerId });
    cy.gotoApp({
      timers: [simpleTimer("t1", "Done twice"), simpleTimer("t2", "Never done")],
      history: [run("h1", "t1", true), run("h2", "t1", true), run("h3", "t1", false), run("h4", "t2", false)],
    });
    cy.tid("timer-card").eq(0).find('[data-testid="timer-card-done"]').should("contain", "2").and("have.attr", "aria-label", "Completed 2 times");
    cy.tid("timer-card").eq(1).find('[data-testid="timer-card-done"]').should("not.exist");
  });
});
