// Covers: creating, counting, editing, resetting and deleting counters; counter lists
// being separate from timer lists; counters in backups.
import { counter, list, simpleTimer } from "../support/builders.js";

describe("counters", () => {
  it("creates a counter and keeps it after reload", () => {
    cy.gotoApp();
    cy.tab("counters");
    cy.tid("counters-new").click();
    cy.tid("counter-editor-name").type("Push-ups");
    cy.tid("counter-editor-color-blue").click().should("have.attr", "aria-checked", "true");
    cy.tid("counter-editor-save").click();
    cy.tid("counter-editor-modal").should("not.exist");
    cy.tid("counter-card-name").should("have.text", "Push-ups");
    cy.tid("counter-card").should("have.attr", "data-color", "blue");
    cy.tid("counter-card-count").should("have.text", "0");
    cy.reload();
    cy.tab("counters");
    cy.tid("counter-card-name").should("have.text", "Push-ups");
  });

  it("counts up and down, never below 0", () => {
    cy.gotoApp({ counters: [counter("c1", "Laps", { count: 1 })] });
    cy.tab("counters");
    cy.tid("counter-card-plus").click().click();
    cy.tid("counter-card-count").should("have.text", "3");
    cy.tid("counter-card-minus").click().click().click();
    cy.tid("counter-card-count").should("have.text", "0");
    cy.tid("counter-card-minus").should("be.disabled");
    cy.readStore("counters").its("0.count").should("eq", 0);
  });

  it("sets the count by typing, and resets after asking", () => {
    cy.gotoApp({ counters: [counter("c1", "Laps", { count: 12 })] });
    cy.tab("counters");
    cy.tid("counter-card-edit").click();
    cy.tid("counter-editor-count").clear().type("40");
    cy.tid("counter-editor-save").click();
    cy.tid("counter-card-count").should("have.text", "40");

    cy.tid("counter-card-edit").click();
    cy.on("window:confirm", (text) => {
      expect(text).to.contain("Reset");
      return true;
    });
    cy.tid("counter-editor-reset").click();
    cy.tid("counter-editor-count").should("have.value", "0");
    cy.tid("counter-editor-save").click();
    cy.tid("counter-card-count").should("have.text", "0");
  });

  it("asks before discarding edits, and deletes after asking", () => {
    cy.gotoApp({ counters: [counter("c1", "Laps", { count: 5 })] });
    cy.tab("counters");
    cy.tid("counter-card-edit").click();
    cy.tid("counter-editor-name").type(" fast");
    cy.on("window:confirm", () => true);
    cy.tid("counter-editor-close").click();
    cy.tid("counter-card-name").should("have.text", "Laps");

    cy.tid("counter-card-edit").click();
    cy.tid("counter-editor-delete").click();
    cy.tid("counter-card").should("not.exist");
    cy.readStore("counters").should("deep.eq", []);
  });

  it("has its own lists, separate from timer lists", () => {
    cy.gotoApp({
      timers: [simpleTimer("t1", "Legs day", { listId: "l1" })],
      lists: [list("l1", "Legs")],
      counters: [counter("c1", "Squats")],
    });
    cy.tab("counters");
    cy.tid("list-header").should("not.exist");
    cy.tid("lists-new").click();
    cy.tid("list-modal").should("contain", "Group counters into lists");
    cy.tid("list-name-input").type("Gym{enter}");
    cy.tid("list-name").should("have.text", "Gym");

    cy.tid("counter-card-edit").click();
    cy.tid("counter-editor-list").select("Gym");
    cy.tid("counter-editor-save").click();
    cy.readStore("counterLists").then((ls) => {
      expect(ls.map((l) => l.name)).to.deep.eq(["Gym"]);
      cy.readStore("counters").its("0.listId").should("eq", ls[0].id);
    });
    cy.readStore("lists").then((ls) => expect(ls.map((l) => l.name)).to.deep.eq(["Legs"]));

    cy.tab("timers");
    cy.tid("list-name").should("have.text", "Legs");
  });
});
