// Covers: the Quick start button and its settings sheet: fields, typing durations as digits, remembering them, and logging a quick run to History.

describe("quick start", () => {
  it("remembers its values", () => {
    cy.gotoApp();
    cy.tid("quick-edit").click();
    cy.tid("quick-work").should("have.value", "0:40");
    cy.tid("quick-rounds-value").should("contain", "8");
    // 8 × 40 + 7 × 20 = 460s
    cy.tid("quick-total").should("have.text", "7m 40s");

    cy.tid("quick-work").clear().type("1:00{enter}");
    cy.tid("quick-rest-minus").click();
    cy.tid("quick-rounds-plus").click();
    cy.readStore("quick").should("deep.eq", { work: 60, rest: 15, rounds: 9 });
    cy.reload();
    cy.tid("quick-edit").click();
    cy.tid("quick-work").should("have.value", "1:00");
  });

  it("starts straight from the play side of the button", () => {
    cy.gotoApp({ quick: { work: 30, rest: 10, rounds: 4 } });
    cy.tid("quick-summary").should("have.text", "4 × 0:30 / 0:10");
    cy.tid("quick-play").click();
    cy.tid("run-title").should("have.text", "Quick start");
    cy.tid("quick-modal").should("not.exist");
  });

  it("only shows the button on the Timers tab", () => {
    cy.gotoApp();
    cy.tid("quick-button").should("exist");
    cy.tab("counters");
    cy.tid("quick-button").should("not.exist");
  });

  it("runs and is saved to History as Quick start", () => {
    cy.clock(Date.UTC(2026, 10, 24, 8, 0, 0));
    cy.gotoApp({ quick: { work: 5, rest: 5, rounds: 2 } });
    cy.tid("quick-edit").click();
    cy.tid("quick-start").click();
    cy.tid("quick-modal").should("not.exist");
    cy.tid("run-title").should("have.text", "Quick start");
    cy.tick(5000 + 15000);
    cy.tid("run-done").should("exist");
    cy.readStore("history").then(([h]) => {
      expect(h).to.include({ source: "quick", timerId: null, timerName: "Quick start", completed: true, elapsedSec: 15 });
    });
  });

  it("fills typed digits from the right, like a microwave", () => {
    cy.gotoApp();
    cy.tid("quick-edit").click();
    cy.tid("quick-work").focus().type("1");
    cy.tid("quick-work").should("have.value", "0:01");
    cy.tid("quick-work").type("3");
    cy.tid("quick-work").should("have.value", "0:13");
    cy.tid("quick-work").type("0{enter}");
    cy.tid("quick-work").should("have.value", "1:30");
    cy.readStore("quick").its("work").should("eq", 90);

    // Seconds over 59 roll into minutes when saved.
    cy.tid("quick-rest").focus().type("90{enter}");
    cy.tid("quick-rest").should("have.value", "1:30");

    // Backspace drops the last digit.
    cy.tid("quick-work").focus().type("245{backspace}{enter}");
    cy.tid("quick-work").should("have.value", "0:24");

    // Leaving without typing, or pressing Escape, keeps the old value.
    cy.tid("quick-work").focus().blur();
    cy.tid("quick-work").should("have.value", "0:24");
    cy.tid("quick-work").focus().type("5{esc}");
    cy.tid("quick-work").should("have.value", "0:24");
    cy.readStore("quick").its("work").should("eq", 24);
  });
});
