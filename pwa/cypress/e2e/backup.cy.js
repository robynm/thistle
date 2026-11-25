// Covers: exporting a backup file, importing with merge and replace, rejecting bad files, the log viewer.
import { historyEntry, simpleTimer } from "../support/builders.js";

const openBackup = () => {
  cy.tid("menu-button").click();
  cy.tid("menu-backup").click();
  cy.tid("backup-modal").should("exist");
};

describe("backup", () => {
  it("exports a file", () => {
    cy.gotoApp({ timers: [simpleTimer("t1", "Legs")] });
    openBackup();
    cy.tid("backup-export").click();
    cy.tid("backup-success").should("contain", "1 timer and 0 history entries");
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const file = `${Cypress.config("downloadsFolder")}/thistle-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
    cy.readFile(file).then((backup) => {
      expect(backup.format).to.eq("thistle-backup-v1");
      expect(backup.data.timers.map((t) => t.id)).to.deep.eq(["t1"]);
    });
  });

  it("merges a backup, keeping what's already here", () => {
    cy.gotoApp({ timers: [simpleTimer("t_existing", "Mine")], history: [historyEntry("h_mine", "Mine")] });
    openBackup();
    cy.tid("backup-file").selectFile("cypress/fixtures/backup-valid.json", { force: true });
    cy.tid("backup-pending").should("contain", "2 timers and 1 history entry");
    cy.tid("backup-merge").click();
    cy.tid("backup-success").should("contain", "Added 1 timer and 1 history entry");
    cy.readStore("timers").then((timers) => {
      expect(timers.map((t) => t.name)).to.deep.eq(["Mine", "Backup Tabata"]);
    });
    cy.readStore("history").then((h) => {
      expect(h.map((e) => e.id)).to.deep.eq(["h_backup1", "h_mine"]);
    });
    cy.readStore("lists").then((lists) => expect(lists.map((l) => l.id)).to.deep.eq(["l_backup"]));
  });

  it("replaces everything after confirming", () => {
    cy.gotoApp({ timers: [simpleTimer("t_mine", "Mine")] });
    openBackup();
    cy.confirmDialogs(true);
    cy.tid("backup-file").selectFile("cypress/fixtures/backup-valid.json", { force: true });
    cy.tid("backup-replace").click();
    cy.tid("backup-success").should("contain", "Restored 2 timers");
    // Grouped: the top-level timer first, then the one in "Backup list".
    cy.readStore("timers").then((timers) => {
      expect(timers.map((t) => t.id)).to.deep.eq(["t_existing", "t_backup1"]);
    });
    cy.readStore("lists").then((lists) => expect(lists.map((l) => l.name)).to.deep.eq(["Backup list"]));
    cy.readStore("quick").should("deep.eq", { work: 30, rest: 15, rounds: 6 });
  });

  it("rejects a file that isn't a Thistle backup", () => {
    cy.gotoApp({ timers: [simpleTimer("t1", "Legs")] });
    openBackup();
    cy.tid("backup-file").selectFile("cypress/fixtures/backup-invalid.json", { force: true });
    cy.tid("backup-error").should("contain", "isn't a Thistle backup");
    cy.tid("backup-pending").should("not.exist");
    cy.readStore("timers").should("have.length", 1);
  });

  it("shows the diagnostics log", () => {
    cy.gotoApp();
    openBackup();
    cy.tid("backup-log-toggle").click();
    cy.tid("backup-log").should("contain", "load");
  });
});
