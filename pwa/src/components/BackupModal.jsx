// Export to a JSON file, import one back (merge or replace), and view the diagnostics log.
import { useRef, useState } from "react";
import { backupFileName, buildBackup, downloadJson, parseBackup } from "../lib/backup.js";
import { plural } from "../lib/format.js";
import { I } from "../lib/icons.jsx";
import { Log } from "../lib/log.js";
import { Modal } from "./Modal.jsx";

const primary = "inline-flex items-center justify-center gap-1.5 bg-thistle-500 text-white rounded-full px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] shadow-pop active:scale-95 transition-transform";
const secondary = "inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-cream-50 border-2 border-cream-100 text-ink-700 text-[11px] font-bold uppercase tracking-[0.1em] active:scale-95 transition-transform";

const counts = (t, h) => `${plural(t, "timer")} and ${plural(h, "history entry", "history entries")}`;

function BackupModal({ timers, history, quick, onImport, onClose }) {
  const fileRef = useRef(null);
  const [pending, setPending] = useState(null);
  const [message, setMessage] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [logEntries, setLogEntries] = useState([]);

  const exportNow = () => {
    downloadJson(buildBackup({ timers, history, quick }), backupFileName());
    setMessage({ ok: true, text: `Saved ${counts(timers.length, history.length)} to your downloads.` });
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
    if (mode === "replace" && !confirm("Replace everything? Your current timers and history on this device will be overwritten by the backup.")) return;
    const res = onImport(pending, mode);
    setPending(null);
    setMessage({
      ok: true,
      text: mode === "replace"
        ? `Restored ${counts(res.timers, res.history)}.`
        : `Added ${counts(res.timers, res.history)}. Anything you already had was kept.`,
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
      setMessage({ ok: false, text: "Couldn't copy — your browser blocked clipboard access." });
    }
  };

  return (
    <Modal
      name="backup"
      eyebrow="Your data"
      eyebrowIcon={I.download}
      title="Backup & restore"
      blurb="Your timers and history live only on this device. Save a backup file now and then, so clearing your browser data or switching phones doesn't lose them."
      onClose={onClose}
    >
      {message && (
        <p
          className={`mb-4 rounded-2xl border-2 px-4 py-2.5 text-sm ${message.ok ? "bg-leaf-50 border-leaf-100 text-leaf-700" : "bg-petal-50 border-petal-100 text-petal-700"}`}
          data-testid={message.ok ? "backup-success" : "backup-error"}
        >
          {message.text}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={primary} onClick={exportNow} data-testid="backup-export">
          <I.download size={12} /> Export
        </button>
        <button type="button" className={secondary} onClick={() => fileRef.current?.click()} data-testid="backup-import">
          <I.upload size={12} /> Import
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={pickFile} data-testid="backup-file" />
      </div>

      {pending && (
        <div className="mt-4 rounded-2xl border-2 border-thistle-100 bg-thistle-50 p-4 fade-up" data-testid="backup-pending">
          <p className="text-sm text-ink-800">
            This backup has {counts(pending.timers.length, pending.history.length)}
            {pending.skipped > 0 && <> ({pending.skipped} unreadable, will be skipped)</>}.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button type="button" className={primary} onClick={() => apply("merge")} data-testid="backup-merge">Merge</button>
            <button type="button" className={secondary} onClick={() => apply("replace")} data-testid="backup-replace">Replace all</button>
          </div>
          <p className="text-xs text-ink-500 mt-2">Merge adds anything new and keeps what you have. Replace swaps in the backup.</p>
        </div>
      )}

      <div className="h-px bg-cream-100 my-5" />

      <button type="button" onClick={toggleLog} className="text-[11px] font-bold uppercase tracking-[0.15em] text-ink-500" data-testid="backup-log-toggle">
        {showLog ? "Hide" : "Show"} diagnostics log
      </button>
      {showLog && (
        <div className="mt-3" data-testid="backup-log">
          <div className="flex gap-2 mb-2">
            <button type="button" className={secondary} onClick={copyLog} data-testid="backup-log-copy"><I.copy size={12} /> Copy</button>
            <button type="button" className={secondary} onClick={() => { Log.clear(); setLogEntries([]); }} data-testid="backup-log-clear"><I.trash size={12} /> Clear</button>
          </div>
          {logEntries.length === 0 ? (
            <p className="text-xs italic text-ink-400">The log is empty.</p>
          ) : (
            <ul className="max-h-60 overflow-y-auto rounded-2xl bg-cream-50 border-2 border-cream-100 p-3 space-y-1.5 font-mono text-[10px] text-ink-700">
              {logEntries.map((e, i) => (
                <li key={i} className={e.level === "error" ? "text-petal-600" : e.level === "warn" ? "text-thistle-700" : ""}>
                  {e.t.slice(5, 19).replace("T", " ")} {e.event} {e.data ? JSON.stringify(e.data) : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}

export { BackupModal };
