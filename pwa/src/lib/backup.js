// Export everything to one JSON file, and read it back.
//
// File shape: { format: "thistle-backup-v1", exportedAt, counts, data: { timers, history, quick } }
// Import supports "merge" (add records whose id isn't already here, keep the rest) and
// "replace" (the backup's records become the whole collection). Settings such as theme
// and sound are per-device and are not included.
import { BACKUP_FORMAT, QUICK_DEFAULTS } from "./constants.js";
import { cleanHistoryEntry, cleanTimer } from "./timerModel.js";

// --- Export ---------------------------------------------------
export function buildBackup({ timers, history, quick }) {
  return {
    format: BACKUP_FORMAT,
    exportedAt: new Date().toISOString(),
    counts: { timers: timers.length, history: history.length },
    data: { timers, history, quick },
  };
}

export function backupFileName(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `thistle-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}

export function downloadJson(obj, fileName) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// --- Import ---------------------------------------------------
// Returns cleaned collections, or throws an Error whose message is safe to show.
// Records that fail validation are dropped and counted in `skipped`.
export function parseBackup(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  if (!obj || obj.format !== BACKUP_FORMAT || !obj.data || typeof obj.data !== "object") {
    throw new Error("That file isn't a Thistle backup.");
  }
  const rawTimers = Array.isArray(obj.data.timers) ? obj.data.timers : [];
  const rawHistory = Array.isArray(obj.data.history) ? obj.data.history : [];
  const timers = rawTimers.map(cleanTimer).filter(Boolean);
  const history = rawHistory.map(cleanHistoryEntry).filter(Boolean);
  const q = obj.data.quick;
  const quick = q && typeof q === "object" ? { ...QUICK_DEFAULTS, ...q } : null;
  return {
    timers,
    history,
    quick,
    skipped: rawTimers.length - timers.length + (rawHistory.length - history.length),
  };
}

// Adds incoming records whose id isn't present. Returns the merged list and how many were added.
export function mergeById(existing, incoming) {
  const have = new Set(existing.map((r) => r.id));
  const added = incoming.filter((r) => !have.has(r.id));
  return { list: [...existing, ...added], added: added.length };
}
