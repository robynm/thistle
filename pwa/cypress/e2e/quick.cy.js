// Covers: Quick start fields, remembering them, and logging a quick run to History.

describe("quick start", () => {
  it("remembers its values", () => {
    cy.gotoApp();
    cy.tab("quick");
    cy.tid("quick-work").should("have.value", "0:40");
    cy.tid("quick-rounds-value").should("contain", "8");
    // 8 × 40 + 7 × 20 = 460s
    cy.tid("quick-total").should("have.text", "7m 40s");

    cy.tid("quick-work").clear().type("1:00{enter}");
    cy.tid("quick-rest-minus").click();
    cy.tid("quick-rounds-plus").click();
    cy.readStore("quick").should("deep.eq", { work: 60, rest: 15, rounds: 9 });
    cy.reload();
    cy.tab("quick");
    cy.tid("quick-work").should("have.value", "1:00");
  });

  it("runs and is saved to History as Quick start", () => {
    cy.clock(Date.UTC(2026, 10, 24, 8, 0, 0));
    cy.gotoApp({ quick: { work: 5, rest: 5, rounds: 2 } });
    cy.tab("quick");
    cy.tid("quick-start").click();
    cy.tid("run-title").should("have.text", "Quick start");
    cy.tick(5000 + 15000);
    cy.tid("run-done").should("exist");
    cy.readStore("history").then(([h]) => {
      expect(h).to.include({ source: "quick", timerId: null, timerName: "Quick start", completed: true, elapsedSec: 15 });
    });
  });
});
