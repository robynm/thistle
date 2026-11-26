// Export everything to one JSON file, and read it back.
//
// File shape: { format: "thistle-backup-v1", exportedAt, counts,
//               data: { timers, lists, history, quick, counters, counterLists } }
// `lists` was added later; backups without it import with every timer at the top level.
// `counters` and `counterLists` were added later still; a backup without them leaves
// this device's counters alone, even on "replace".
// Import supports "merge" (add records whose id isn't already here, keep the rest) and
// "replace" (the backup's records become the whole collection). Settings such as theme
// and sound are per-device and are not included.
import { BACKUP_FORMAT, QUICK_DEFAULTS } from "./constants.js";
import { cleanCounter } from "./counterModel.js";
import { cleanHistoryEntry, cleanList, cleanTimer } from "./timerModel.js";

// --- Export ---------------------------------------------------
export function buildBackup({ timers, lists, history, quick, counters, counterLists }) {
  return {
    format: BACKUP_FORMAT,
    exportedAt: new Date().toISOString(),
    counts: { timers: timers.length, lists: lists.length, history: history.length, counters: counters.length, counterLists: counterLists.length },
    data: { timers, lists, history, quick, counters, counterLists },
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
  const rawLists = Array.isArray(obj.data.lists) ? obj.data.lists : [];
  const timers = rawTimers.map(cleanTimer).filter(Boolean);
  const lists = rawLists.map(cleanList).filter(Boolean);
  const history = rawHistory.map(cleanHistoryEntry).filter(Boolean);
  // null (not []) when the backup predates counters, so import can leave them alone.
  const hasCounters = Array.isArray(obj.data.counters);
  const rawCounters = hasCounters ? obj.data.counters : [];
  const rawCounterLists = Array.isArray(obj.data.counterLists) ? obj.data.counterLists : [];
  const counters = hasCounters ? rawCounters.map(cleanCounter).filter(Boolean) : null;
  const counterLists = hasCounters ? rawCounterLists.map(cleanList).filter(Boolean) : null;
  const q = obj.data.quick;
  const quick = q && typeof q === "object" ? { ...QUICK_DEFAULTS, ...q } : null;
  return {
    timers,
    lists,
    history,
    quick,
    counters,
    counterLists,
    skipped:
      rawTimers.length - timers.length +
      (rawHistory.length - history.length) +
      (rawLists.length - lists.length) +
      (counters ? rawCounters.length - counters.length + (rawCounterLists.length - counterLists.length) : 0),
  };
}

// Adds incoming records whose id isn't present. Returns the merged list and how many were added.
export function mergeById(existing, incoming) {
  const have = new Set(existing.map((r) => r.id));
  const added = incoming.filter((r) => !have.has(r.id));
  return { list: [...existing, ...added], added: added.length };
}
