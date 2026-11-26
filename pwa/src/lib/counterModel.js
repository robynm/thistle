// Counters: a name, a color and a count that never goes below 0.
//   { id, name, color, count, listId, createdAt, updatedAt }
// Counters have their own lists (same shape as timer lists, stored separately), and
// use groupByList / moveToList from timerModel to stay grouped.
import { COUNTER_COLORS, MAX_COUNT } from "./constants.js";
import { uid } from "./timerModel.js";

const COLOR_IDS = new Set(COUNTER_COLORS.map((c) => c.id));

export const clampCount = (n) => Math.min(MAX_COUNT, Math.max(0, Math.round(Number(n) || 0)));

export const newCounter = () => ({
  id: uid("c"),
  name: "",
  color: COUNTER_COLORS[0].id,
  count: 0,
  listId: null,
  createdAt: null,
  updatedAt: null,
});

// Coerces anything counter-shaped (from storage or a backup file) into a valid
// counter, or returns null if it isn't one.
export function cleanCounter(c) {
  if (!c || typeof c !== "object" || typeof c.id !== "string") return null;
  return {
    id: c.id,
    name: typeof c.name === "string" ? c.name : "",
    color: COLOR_IDS.has(c.color) ? c.color : COUNTER_COLORS[0].id,
    count: clampCount(c.count),
    listId: typeof c.listId === "string" ? c.listId : null,
    createdAt: typeof c.createdAt === "string" ? c.createdAt : null,
    updatedAt: typeof c.updatedAt === "string" ? c.updatedAt : null,
  };
}

export const counterColor = (id) => COUNTER_COLORS.find((c) => c.id === id) ?? COUNTER_COLORS[0];
