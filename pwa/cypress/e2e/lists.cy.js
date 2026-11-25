// Covers: creating, renaming and deleting lists; collapsed-by-default sections that
// remember being opened; moving timers between lists (editor and drag); reordering
// timers and lists.
import { list, simpleTimer } from "../support/builders.js";

const names = () => cy.tid("timer-card-name").then(($n) => [...$n].map((n) => n.textContent));

describe("lists", () => {
  it("creates a list that starts collapsed and remembers being opened", () => {
    cy.gotoApp({ timers: [simpleTimer("t1", "Squats")] });
    cy.tid("lists-new").click();
    cy.tid("list-save").click();
    cy.tid("list-error").should("exist");
    cy.tid("list-name-input").type("Legs");
    cy.tid("list-save").click();
    cy.tid("list-modal").should("not.exist");

    cy.tid("list-name").should("have.text", "Legs");
    cy.tid("list-count").should("have.text", "0");
    cy.tid("list-toggle").should("have.attr", "aria-expanded", "false");
    cy.tid("list-empty").should("not.exist");

    cy.tid("list-toggle").click();
    cy.tid("list-empty").should("exist");
    cy.reload();
    cy.tid("list-toggle").should("have.attr", "aria-expanded", "true");
    cy.readStore("lists").then((lists) => {
      expect(lists.map((l) => l.name)).to.deep.eq(["Legs"]);
    });
  });

  it("shows top-level timers first and hides a collapsed list's timers", () => {
    cy.gotoApp({
      lists: [list("l1", "Legs")],
      timers: [simpleTimer("t1", "Squats", { listId: "l1" }), simpleTimer("t2", "Tabata")],
    });
    names().should("deep.eq", ["Tabata"]);
    cy.tid("list-count").should("have.text", "1");
    cy.tid("list-toggle").click();
    names().should("deep.eq", ["Tabata", "Squats"]);
  });

  it("moves a timer into a list from the editor", () => {
    cy.gotoApp({ lists: [list("l1", "Legs")], timers: [simpleTimer("t1", "Squats")] });
    cy.tid("timer-card-edit").click();
    cy.tid("editor-list").select("Legs");
    cy.tid("editor-save").click();
    cy.tid("timer-card").should("not.exist");
    cy.tid("list-count").should("have.text", "1");
    cy.readStore("timers").then(([t]) => expect(t.listId).to.eq("l1"));
  });

  it("drags a timer onto a collapsed list, and back out of an open one", () => {
    cy.gotoApp({ lists: [list("l1", "Legs")], timers: [simpleTimer("t1", "Squats"), simpleTimer("t2", "Tabata")] });
    cy.dragGrip("timer-card-grip", "list-header", { place: "after" });
    cy.tid("list-count").should("have.text", "1");
    names().should("deep.eq", ["Tabata"]);
    cy.readStore("timers").then((ts) => {
      expect(ts.map((t) => [t.id, t.listId])).to.deep.eq([["t2", null], ["t1", "l1"]]);
    });

    cy.tid("list-toggle").click();
    names().should("deep.eq", ["Tabata", "Squats"]);
    // Drag Squats (second grip) above Tabata: it leaves the list.
    cy.dragGrip("timer-card-grip", "timer-card", { place: "before", gripIndex: 1 });
    cy.tid("list-count").should("have.text", "0");
    names().should("deep.eq", ["Squats", "Tabata"]);
  });

  it("reorders timers and lists with the arrow keys", () => {
    cy.gotoApp({
      lists: [list("l1", "Legs"), list("l2", "Core")],
      timers: [simpleTimer("t1", "One"), simpleTimer("t2", "Two")],
    });
    cy.tid("timer-card-grip").first().trigger("keydown", { key: "ArrowDown" });
    names().should("deep.eq", ["Two", "One"]);

    cy.tid("list-grip").first().trigger("keydown", { key: "ArrowDown" });
    cy.tid("list-name").then(($n) => expect([...$n].map((n) => n.textContent)).to.deep.eq(["Core", "Legs"]));
    cy.readStore("lists").then((ls) => expect(ls.map((l) => l.id)).to.deep.eq(["l2", "l1"]));
  });

  it("reorders lists by dragging", () => {
    cy.gotoApp({ lists: [list("l1", "Legs"), list("l2", "Core")], listsOpen: ["l1"], timers: [simpleTimer("t1", "Squats", { listId: "l1" })] });
    cy.dragGrip("list-grip", "list-header", { place: "after", targetIndex: 1 });
    cy.readStore("lists").then((ls) => expect(ls.map((l) => l.id)).to.deep.eq(["l2", "l1"]));
    // Lists collapse only while dragging; Legs is open again afterwards.
    cy.tid("list-toggle").eq(1).should("have.attr", "aria-expanded", "true");
  });

  it("renames a list, and deleting it moves its timers to the top level", () => {
    cy.gotoApp({ lists: [list("l1", "Legs")], timers: [simpleTimer("t1", "Squats", { listId: "l1" })] });
    cy.tid("list-edit").click();
    cy.tid("list-name-input").clear().type("Lower body");
    cy.tid("list-save").click();
    cy.tid("list-name").should("have.text", "Lower body");

    cy.confirmDialogs(true);
    cy.tid("list-edit").click();
    cy.tid("list-delete").click();
    cy.tid("list-header").should("not.exist");
    names().should("deep.eq", ["Squats"]);
    cy.readStore("timers").then(([t]) => expect(t.listId).to.eq(null));
    cy.readStore("lists").should("deep.eq", []);
  });
});
