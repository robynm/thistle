// App-wide constants: storage keys, step kinds and their colors, and fixed timings.
// Storage keys live only here; never inline a key string elsewhere.

// --- Storage keys ---------------------------------------------
export const STORAGE_KEYS = {
  timers: "thistle:timers:v1",
  history: "thistle:history:v1",
  quick: "thistle:quick:v1",
  sound: "thistle:sound:v1",
  theme: "thistle:theme:v1",
  splashSeen: "thistle:splashSeen:v1",
  log: "thistle:log:v1",
};

export const BACKUP_FORMAT = "thistle-backup-v1";

// --- Step kinds -----------------------------------------------
// Each kind's id is also its color name in styles.css (`bg-work`, `text-rest-ink`, …).
// "ready" is the get-ready countdown the runner adds; it can't be chosen in the editor.
export const STEP_KINDS = [
  { id: "work", label: "Work" },
  { id: "rest", label: "Rest" },
  { id: "warmup", label: "Warm-up" },
  { id: "cooldown", label: "Cool-down" },
];

export const KIND_LABEL = {
  ready: "Get ready",
  ...Object.fromEntries(STEP_KINDS.map((k) => [k.id, k.label])),
};

// --- Timings --------------------------------------------------
export const GET_READY_SECONDS = 5;
// Runs shorter than this (not counting get-ready or pauses) aren't saved to History.
export const MIN_HISTORY_SECONDS = 10;
// Pressing Back this far into a step restarts it; earlier, it goes to the previous step.
export const BACK_RESTART_MS = 3000;
export const MAX_STEP_SECONDS = 99 * 60 + 59;
export const MAX_REPS = 99;

export const QUICK_DEFAULTS = { work: 40, rest: 20, rounds: 8 };
