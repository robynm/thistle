// The timer data model and the pure functions the editor, cards and runner share.
//
// A timer is a list of blocks; each block is a list of steps repeated `reps` times:
//   { id, name, createdAt, updatedAt,
//     blocks: [{ id, name, reps, steps: [{ id, kind, name, seconds }] }] }
// `kind` is one of STEP_KINDS. Array order is the run order.
import { GET_READY_SECONDS, KIND_LABEL, MAX_REPS, MAX_STEP_SECONDS, STEP_KINDS } from "./constants.js";

// --- Ids and builders -----------------------------------------
export const uid = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const newStep = (kind = "work", seconds = kind === "rest" ? 20 : 40) => ({ id: uid("s"), kind, name: "", seconds });

export const newBlock = () => ({ id: uid("b"), name: "", reps: 1, steps: [newStep("work"), newStep("rest")] });

export function newTimer() {
  const block = newBlock();
  block.reps = 8;
  return { id: uid("t"), name: "", blocks: [block], createdAt: null, updatedAt: null };
}

// A one-block timer built from the Quick start fields. Not saved to the timers list.
export function quickTimer({ work, rest, rounds }) {
  const steps = [{ id: "q_work", kind: "work", name: "", seconds: work }];
  if (rest > 0) steps.push({ id: "q_rest", kind: "rest", name: "", seconds: rest });
  return { id: "quick", name: "Quick start", blocks: [{ id: "q_block", name: "", reps: rounds, steps }] };
}

// --- Sequence -------------------------------------------------
// Expands a timer into the flat list of segments the runner steps through, with a
// get-ready countdown first. Zero-length steps are dropped, and so are rest steps at
// the very end, since resting after the last rep does nothing.
export function flatten(timer, { getReady = GET_READY_SECONDS } = {}) {
  const out = [];
  timer.blocks.forEach((block, bi) => {
    for (let rep = 1; rep <= block.reps; rep++) {
      for (const step of block.steps) {
        if (step.seconds <= 0) continue;
        out.push({
          kind: step.kind,
          name: step.name || KIND_LABEL[step.kind],
          seconds: step.seconds,
          blockIndex: bi,
          blockName: block.name,
          rep,
          reps: block.reps,
        });
      }
    }
  });
  while (out.length && out[out.length - 1].kind === "rest") out.pop();
  if (out.length && getReady > 0) {
    out.unshift({ kind: "ready", name: KIND_LABEL.ready, seconds: getReady, blockIndex: -1, blockName: "", rep: 1, reps: 1 });
  }
  return out;
}

// Total running time in seconds, not counting get-ready.
export const totalSeconds = (timer) => flatten(timer, { getReady: 0 }).reduce((sum, s) => sum + s.seconds, 0);

// Seconds per kind, for the proportional color bar on cards.
export function kindBreakdown(timer) {
  const out = {};
  for (const s of flatten(timer, { getReady: 0 })) out[s.kind] = (out[s.kind] || 0) + s.seconds;
  return out;
}

export const stepCount = (timer) => timer.blocks.reduce((n, b) => n + b.steps.length, 0);

// --- Cleaning -------------------------------------------------
// Coerces anything timer-shaped (from storage or a backup file) into a valid timer,
// or returns null if it isn't one.
const KIND_IDS = new Set(STEP_KINDS.map((k) => k.id));
const clampInt = (v, lo, hi, fallback) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};

export function cleanTimer(t) {
  if (!t || typeof t !== "object" || typeof t.id !== "string" || !Array.isArray(t.blocks)) return null;
  const blocks = t.blocks
    .filter((b) => b && Array.isArray(b.steps))
    .map((b) => ({
      id: typeof b.id === "string" ? b.id : uid("b"),
      name: typeof b.name === "string" ? b.name : "",
      reps: clampInt(b.reps, 1, MAX_REPS, 1),
      steps: b.steps
        .filter((s) => s && KIND_IDS.has(s.kind))
        .map((s) => ({
          id: typeof s.id === "string" ? s.id : uid("s"),
          kind: s.kind,
          name: typeof s.name === "string" ? s.name : "",
          seconds: clampInt(s.seconds, 0, MAX_STEP_SECONDS, 0),
        })),
    }));
  return {
    id: t.id,
    name: typeof t.name === "string" ? t.name : "",
    blocks,
    createdAt: typeof t.createdAt === "string" ? t.createdAt : null,
    updatedAt: typeof t.updatedAt === "string" ? t.updatedAt : null,
  };
}

export function cleanHistoryEntry(h) {
  if (!h || typeof h !== "object" || typeof h.id !== "string" || typeof h.startedAt !== "string") return null;
  return {
    id: h.id,
    timerId: typeof h.timerId === "string" ? h.timerId : null,
    timerName: typeof h.timerName === "string" ? h.timerName : "",
    source: h.source === "quick" ? "quick" : "timer",
    startedAt: h.startedAt,
    finishedAt: typeof h.finishedAt === "string" ? h.finishedAt : h.startedAt,
    elapsedSec: clampInt(h.elapsedSec, 0, 1e7, 0),
    plannedSec: clampInt(h.plannedSec, 0, 1e7, 0),
    progress: Math.min(1, Math.max(0, Number(h.progress) || 0)),
    completed: Boolean(h.completed),
  };
}
