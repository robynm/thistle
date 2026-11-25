// Covers: running a timer step by step, pause, skip, back, finishing, stopping early
// (× and hold-to-exit), and what gets saved to History. Time is driven with cy.clock / cy.tick.
import { simpleTimer } from "../support/builders.js";

// Sequence for this timer: get ready 5s, work 10s, rest 5s, work 10s (the trailing rest is dropped).
const timer = simpleTimer("t1", "Test run", { work: 10, rest: 5, reps: 2 });

describe("run", () => {
  beforeEach(() => {
    cy.clock(Date.UTC(2026, 10, 24, 8, 0, 0));
    cy.gotoApp({ timers: [timer] });
    cy.tid("timer-card-run").click();
    cy.tid("run-screen").should("have.attr", "data-kind", "ready");
    cy.tid("run-remaining").should("have.text", "0:05");
  });

  it("steps through every segment and saves a completed run", () => {
    cy.tick(5000);
    cy.tid("run-screen").should("have.attr", "data-kind", "work");
    cy.tid("run-remaining").should("have.text", "0:10");
    cy.tid("run-round").should("contain", "Round 1 of 2");
    cy.tid("run-next").should("contain", "Rest");

    cy.tick(10000);
    cy.tid("run-screen").should("have.attr", "data-kind", "rest");
    cy.tick(5000);
    cy.tid("run-screen").should("have.attr", "data-kind", "work");
    cy.tid("run-round").should("contain", "Round 2 of 2");
    cy.tid("run-next").should("contain", "Last one");

    cy.tick(10000);
    cy.tid("run-done").should("exist");
    cy.readStore("history").then((h) => {
      expect(h).to.have.length(1);
      expect(h[0]).to.include({ timerId: "t1", timerName: "Test run", completed: true, elapsedSec: 25, progress: 1 });
    });
    cy.tid("run-done-close").click();
    cy.tid("run-screen").should("not.exist");
    cy.tab("history");
    cy.tid("history-entry-status").should("contain", "Done");
  });

  it("pauses and resumes", () => {
    cy.tick(7000);
    cy.tid("run-remaining").should("have.text", "0:08");
    cy.tid("run-pause").click();
    cy.tid("run-kind").should("have.text", "Paused");
    cy.tick(5000);
    cy.tid("run-remaining").should("have.text", "0:08");
    cy.tid("run-pause").click();
    cy.tick(1000);
    cy.tid("run-remaining").should("have.text", "0:07");
  });

  it("skips forward and goes back", () => {
    cy.tid("run-skip").click();
    cy.tid("run-screen").should("have.attr", "data-kind", "work");
    cy.tid("run-remaining").should("have.text", "0:10");

    // More than 3s into a step, Back restarts it.
    cy.tick(4000);
    cy.tid("run-remaining").should("have.text", "0:06");
    cy.tid("run-back").click();
    cy.tid("run-screen").should("have.attr", "data-kind", "work");
    cy.tid("run-remaining").should("have.text", "0:10");

    // Within the first 3s, Back goes to the previous step.
    cy.tid("run-back").click();
    cy.tid("run-screen").should("have.attr", "data-kind", "ready");
  });

  it("saves a stopped run as partial", () => {
    cy.tick(5000 + 12000);
    cy.confirmDialogs(true);
    cy.tid("run-stop").click();
    cy.tid("run-screen").should("not.exist");
    cy.readStore("history").then((h) => {
      expect(h).to.have.length(1);
      expect(h[0]).to.include({ completed: false, elapsedSec: 12 });
      expect(h[0].progress).to.be.closeTo(12 / 25, 0.01);
    });
    cy.tab("history");
    cy.tid("history-entry-status").should("contain", "Partial · 48%");
  });

  it("exits on a 1 second hold, without asking, and saves a partial run", () => {
    cy.tick(5000 + 12000);
    cy.tid("run-screen").trigger("pointerdown", { button: 0, position: "left" });
    cy.tid("run-hold").should("exist");
    cy.tick(1000);
    cy.tid("run-screen").should("not.exist");
    cy.readStore("history").then((h) => {
      // The workout kept running during the hold.
      expect(h[0]).to.include({ completed: false, elapsedSec: 13 });
    });
  });

  it("cancels the hold if you let go early", () => {
    cy.tid("run-screen").trigger("pointerdown", { button: 0, position: "left" });
    cy.tick(600);
    cy.tid("run-screen").trigger("pointerup", { position: "left" });
    cy.tid("run-hold").should("not.exist");
    cy.tick(1000);
    cy.tid("run-screen").should("exist");
  });

  it("doesn't start a hold from a button", () => {
    cy.tid("run-pause").trigger("pointerdown", { button: 0 });
    cy.tid("run-hold").should("not.exist");
    cy.tick(1500);
    cy.tid("run-screen").should("exist");
  });

  it("keeps running if you cancel the stop", () => {
    cy.confirmDialogs(false);
    cy.tid("run-stop").click();
    cy.tid("run-screen").should("exist");
  });

  it("doesn't save runs shorter than 10 seconds", () => {
    cy.tick(5000 + 4000);
    cy.confirmDialogs(true);
    cy.tid("run-stop").click();
    cy.tid("run-screen").should("not.exist");
    cy.readStore("history").should("deep.eq", []);
  });

  it("remembers the mute setting", () => {
    cy.tid("run-sound").should("have.attr", "aria-pressed", "true");
    cy.tid("run-sound").click();
    cy.tid("run-sound").should("have.attr", "aria-pressed", "false");
    cy.readStore("sound").should("eq", true);
  });
});
