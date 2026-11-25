// Covers: listing past runs with their status, and clearing History.
import { historyEntry } from "../support/builders.js";

describe("history", () => {
  const history = [
    historyEntry("h2", "Leg day", { completed: false, elapsedSec: 300, progress: 0.5, startedAt: "2026-11-02T08:00:00.000Z" }),
    historyEntry("h1", "Tabata", { elapsedSec: 240, startedAt: "2026-11-01T08:00:00.000Z" }),
  ];

  it("lists runs with their status", () => {
    cy.gotoApp({ history });
    cy.tab("history");
    cy.tid("history-entry").should("have.length", 2);
    cy.tid("history-entry-name").first().should("have.text", "Leg day");
    cy.tid("history-entry-status").first().should("have.text", "Partial · 50%");
    cy.tid("history-entry-status").last().should("have.text", "Done");
    cy.tid("history-summary").should("contain", "2 workouts").and("contain", "9m");
  });

  it("clears only after confirming", () => {
    cy.gotoApp({ history });
    cy.tab("history");
    cy.on("window:confirm", () => false);
    cy.tid("history-clear").click();
    cy.tid("history-entry").should("have.length", 2);
  });

  it("clears everything", () => {
    cy.gotoApp({ history });
    cy.tab("history");
    cy.confirmDialogs(true);
    cy.tid("history-clear").click();
    cy.tid("history-empty").should("exist");
    cy.readStore("history").should("deep.eq", []);
  });
});
