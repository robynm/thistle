// Small data builders shared by specs.
const T0 = "2026-11-01T08:00:00.000Z";

// One block: `reps` × (work, rest).
export const simpleTimer = (id, name, { work = 10, rest = 5, reps = 2, listId = null } = {}) => ({
  id,
  name,
  listId,
  createdAt: T0,
  updatedAt: T0,
  blocks: [
    {
      id: `${id}_b`,
      name: "",
      reps,
      steps: [
        { id: `${id}_w`, kind: "work", name: "", seconds: work },
        { id: `${id}_r`, kind: "rest", name: "", seconds: rest },
      ],
    },
  ],
});

export const historyEntry = (id, name, { completed = true, elapsedSec = 600, progress = 1, startedAt = T0 } = {}) => ({
  id,
  timerId: null,
  timerName: name,
  source: "timer",
  startedAt,
  finishedAt: startedAt,
  elapsedSec,
  plannedSec: 600,
  progress,
  completed,
});

export const list = (id, name) => ({ id, name, createdAt: T0 });
