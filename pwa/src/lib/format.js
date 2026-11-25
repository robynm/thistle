// Display formatting and parsing for durations and dates.

// plural(1, "timer") -> "1 timer", plural(2, "entry", "entries") -> "2 entries"
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// 75 -> "1:15", 3725 -> "1:02:05"
export function fmtClock(totalSec) {
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

// 45 -> "45s", 90 -> "1m 30s", 1260 -> "21m", 3900 -> "1h 5m"
export function fmtShort(totalSec) {
  const s = Math.max(0, Math.round(totalSec));
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  if (h) return m ? `${h}h ${m}m` : `${h}h`;
  return rem ? `${m}m ${rem}s` : `${m}m`;
}

// Accepts "m:ss", "h:mm:ss" or a plain number of seconds. Returns null if unreadable.
export function parseClock(text) {
  const t = String(text).trim();
  if (!t) return null;
  if (/^\d+$/.test(t)) return Number(t);
  if (!/^\d+(:\d{1,2}){1,2}$/.test(t)) return null;
  return t.split(":").map(Number).reduce((acc, n) => acc * 60 + n, 0);
}

// "Today, 7:42 AM" / "Yesterday, 6:10 PM" / "Mon 3 Nov, 6:10 PM"
export function fmtWhen(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(new Date()) - startOf(d)) / 86400000);
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  const date = d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
  return `${date}, ${time}`;
}
