// Export to a JSON file, import one back (merge or replace), and view the diagnostics log.
import { useRef, useState } from "react";
import { backupFileName, buildBackup, downloadJson, parseBackup } from "../lib/backup.js";
import { plural } from "../lib/format.js";
import { I } from "../lib/icons.jsx";
import { Log } from "../lib/log.js";
import { ui } from "../lib/ui.js";
import { Modal } from "./Modal.jsx";

const counts = (t, h, c = 0) =>
  c
    ? `${plural(t, "timer")}, ${plural(c, "counter")} and ${plural(h, "history entry", "history entries")}`
    : `${plural(t, "timer")} and ${plural(h, "history entry", "history entries")}`;

function BackupModal({ timers, lists, history, quick, counters, counterLists, onImport, onClose }) {
  const fileRef = useRef(null);
  const [pending, setPending] = useState(null);
  const [message, setMessage] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [logEntries, setLogEntries] = useState([]);

  const exportNow = () => {
    downloadJson(buildBackup({ timers, lists, history, quick, counters, counterLists }), backupFileName());
    setMessage({ ok: true, text: `Saved ${counts(timers.length, history.length, counters.length)} to your downloads.` });
  };

  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setPending(parseBackup(await file.text()));
      setMessage(null);
    } catch (err) {
      Log.error("backup.import.failed", { error: err.message });
      setPending(null);
      setMessage({ ok: false, text: err.message });
    }
  };

  const apply = (mode) => {
    if (mode === "replace" && !confirm(`Replace everything? Your current ${pending.counters ? "timers, counters and history" : "timers and history"} on this device will be overwritten by the backup.`)) return;
    const res = onImport(pending, mode);
    setPending(null);
    setMessage({
      ok: true,
      text: mode === "replace"
        ? `Restored ${counts(res.timers, res.history, res.counters)}.`
        : `Added ${counts(res.timers, res.history, res.counters)}. Anything you already had was kept.`,
    });
  };

  const toggleLog = () => {
    if (!showLog) setLogEntries(Log.entries().slice().reverse());
    setShowLog((s) => !s);
  };

  const copyLog = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(Log.entries(), null, 2));
      setMessage({ ok: true, text: "Log copied to your clipboard." });
    } catch {
      setMessage({ ok: false, text: "Couldn't copy. Your browser blocked clipboard access." });
    }
  };

  return (
    <Modal
      name="backup"
      title="Backup & restore"
      blurb="Your timers, counters and history live only on this device. Save a backup file now and then, so clearing your browser data or switching phones doesn't lose them."
      onClose={onClose}
    >
      {message && (
        <p
          className={`mb-4 rounded-xl px-3.5 py-2.5 text-sm ${message.ok ? "bg-rest-soft text-rest-ink" : "bg-work-soft text-work-ink"}`}
          data-testid={message.ok ? "backup-success" : "backup-error"}
        >
          {message.text}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={ui.primary} onClick={exportNow} data-testid="backup-export">
          <I.download size={15} /> Export
        </button>
        <button type="button" className={ui.secondary} onClick={() => fileRef.current?.click()} data-testid="backup-import">
          <I.upload size={15} /> Import
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={pickFile} data-testid="backup-file" />
      </div>

      {pending && (
        <div className="mt-4 rounded-2xl bg-surface p-4 fade-up" data-testid="backup-pending">
          <p className="text-sm text-ink">
            This backup has {counts(pending.timers.length, pending.history.length, pending.counters?.length ?? 0)}
            {pending.skipped > 0 && <> ({pending.skipped} unreadable, will be skipped)</>}.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button type="button" className={ui.primary} onClick={() => apply("merge")} data-testid="backup-merge">Merge</button>
            <button type="button" className={`${ui.secondary} bg-bg`} onClick={() => apply("replace")} data-testid="backup-replace">Replace all</button>
          </div>
          <p className="text-xs text-muted mt-2">Merge adds anything new and keeps what you have. Replace swaps in the backup.</p>
        </div>
      )}

      <div className="border-t border-line mt-6 pt-4">
        <button type="button" onClick={toggleLog} className="text-sm font-medium text-muted" data-testid="backup-log-toggle">
          {showLog ? "Hide" : "Show"} diagnostics log
        </button>
        {showLog && (
          <div className="mt-3" data-testid="backup-log">
            <div className="flex gap-2 mb-2">
              <button type="button" className={`${ui.secondary} py-2`} onClick={copyLog} data-testid="backup-log-copy"><I.copy size={14} /> Copy</button>
              <button type="button" className={`${ui.secondary} py-2`} onClick={() => { Log.clear(); setLogEntries([]); }} data-testid="backup-log-clear"><I.trash size={14} /> Clear</button>
            </div>
            {logEntries.length === 0 ? (
              <p className="text-sm text-muted">The log is empty.</p>
            ) : (
              <ul className="max-h-60 overflow-y-auto rounded-xl bg-surface p-3 space-y-1.5 font-mono text-[11px] text-muted">
                {logEntries.map((e, i) => (
                  <li key={i} className={e.level === "error" ? "text-work-ink" : e.level === "warn" ? "text-ready-ink" : ""}>
                    {e.t.slice(5, 19).replace("T", " ")} {e.event} {e.data ? JSON.stringify(e.data) : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export { BackupModal };
