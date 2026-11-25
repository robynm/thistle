// Persisted diagnostics. Entries go to a localStorage ring buffer (so problems on a
// phone can be read later from the Backup screen) and are mirrored to the console.
// Also installs global error hooks once, on import.
import { STORAGE_KEYS } from "./constants.js";

const MAX_ENTRIES = 200;
const PREFIX = "[thistle]";

// --- Buffer ---------------------------------------------------
function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.log);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Errors don't survive JSON.stringify, so flatten them.
function clean(data) {
  if (data instanceof Error) return { name: data.name, message: data.message, stack: data.stack };
  if (data && typeof data === "object") {
    const out = {};
    for (const [k, v] of Object.entries(data)) out[k] = v instanceof Error ? clean(v) : v;
    return out;
  }
  return data;
}

function write(level, event, data) {
  const entry = { t: new Date().toISOString(), level, event };
  if (data !== undefined) entry.data = clean(data);
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  fn(`${PREFIX} ${event}`, data ?? "");
  try {
    const all = read();
    all.push(entry);
    localStorage.setItem(STORAGE_KEYS.log, JSON.stringify(all.slice(-MAX_ENTRIES)));
  } catch {
    // Storage full or blocked: the console copy is all we can keep.
  }
}

export const Log = {
  info: (event, data) => write("info", event, data),
  warn: (event, data) => write("warn", event, data),
  error: (event, data) => write("error", event, data),
  entries: read,
  clear() {
    try { localStorage.removeItem(STORAGE_KEYS.log); } catch { /* ignore */ }
  },
};

// --- Global hooks ---------------------------------------------
if (typeof window !== "undefined" && !window.__thistleLogHooks) {
  window.__thistleLogHooks = true;
  window.addEventListener("error", (e) => {
    Log.error("window.error", { message: e.message, source: e.filename, line: e.lineno, stack: e.error?.stack });
  });
  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason;
    Log.error("window.unhandledrejection", r instanceof Error ? r : { reason: String(r) });
  });
}
