// Timers with no list come first, then each list as a collapsible section.
//
// For dragging, the whole tab is one flat column: top-level timers, then each list's
// header followed by its timers when it's open. Where a dropped timer lands in that
// column decides its list (the nearest header above it, or none). Dropping just below
// a collapsed header puts the timer at the end of that list.
//
// Lists are dragged by their own grip. While one is dragged every list collapses, so
// the headers sit next to each other.
import { useRef, useState } from "react";
import { I } from "../lib/icons.jsx";
import { useSortable } from "../lib/sortable.js";
import { ui } from "../lib/ui.js";
import { DragGrip } from "./DragGrip.jsx";
import { ListHeader } from "./ListHeader.jsx";
import { TimerCard } from "./TimerCard.jsx";

function TimersView({ timers, lists, openLists, onToggleList, onRun, onEdit, onEditList, onNewList, onMoveTimer, onReorderLists }) {
  const ref = useRef(null);
  const [draggingLists, setDraggingLists] = useState(false);
  const isOpen = (listId) => listId === null || (!draggingLists && openLists.includes(listId));
  const listIds = new Set(lists.map((l) => l.id));

  const timerSort = useSortable({
    containerRef: ref,
    selector: "[data-timer-item]",
    onDrop: ({ key, to, keys }) => {
      if (listIds.has(key)) return;
      const order = keys.filter((k) => k !== key);
      order.splice(to, 0, key);
      let listId = null;
      let index = 0;
      for (const k of order) {
        if (k === key) break;
        if (listIds.has(k)) {
          listId = k;
          index = 0;
        } else index++;
      }
      onMoveTimer(key, listId, isOpen(listId) ? index : Infinity);
    },
  });

  const listSort = useSortable({
    containerRef: ref,
    selector: "[data-list-item]",
    onStart: () => setDraggingLists(true),
    onEnd: () => setDraggingLists(false),
    onDrop: ({ key, to }) => {
      const rest = lists.filter((l) => l.id !== key);
      rest.splice(to, 0, lists.find((l) => l.id === key));
      onReorderLists(rest);
    },
  });

  const timerItem = (t) => (
    <div key={t.id} data-timer-item data-sort-key={t.id}>
      <TimerCard
        timer={t}
        onRun={() => onRun(t)}
        onEdit={() => onEdit(t)}
        grip={<DragGrip handleProps={timerSort.handleProps} label={`Move ${t.name || "timer"}`} testId="timer-card-grip" />}
      />
    </div>
  );

  const topLevel = timers.filter((t) => !t.listId);

  return (
    <section data-testid="timers-view">
      {timers.length === 0 && lists.length === 0 ? (
        <p className="text-sm text-muted py-16 text-center" data-testid="timers-empty">
          No timers yet. Tap <b className="text-ink">New</b> to make one.
        </p>
      ) : (
        <div ref={ref} className="flex flex-col gap-2">
          {topLevel.map(timerItem)}
          {lists.map((l) => {
            const mine = timers.filter((t) => t.listId === l.id);
            const open = isOpen(l.id);
            return [
              <div key={l.id} data-timer-item data-list-item data-sort-key={l.id} className={topLevel.length || l !== lists[0] ? "mt-2" : ""}>
                <ListHeader
                  list={l}
                  count={mine.length}
                  open={open}
                  onToggle={() => onToggleList(l.id)}
                  onEdit={() => onEditList(l)}
                  gripProps={listSort.handleProps}
                />
              </div>,
              ...(open
                ? mine.length
                  ? mine.map(timerItem)
                  : [<p key={`${l.id}-empty`} className="text-sm text-muted px-4 py-3" data-testid="list-empty">Empty. Drag a timer here, or pick this list in a timer's editor.</p>]
                : []),
            ];
          })}
        </div>
      )}
      <button type="button" onClick={onNewList} data-testid="lists-new" className={`${ui.secondary} mt-6 bg-transparent text-muted`}>
        <I.folderPlus size={16} /> New list
      </button>
    </section>
  );
}

export { TimersView };
