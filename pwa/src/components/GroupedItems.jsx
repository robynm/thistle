// A tab of items grouped into lists: items with no list first, then each list as a
// collapsible section. Used by the Timers and Counters tabs; `renderItem` draws one
// item and is handed the drag grip to put in it.
//
// For dragging, the whole tab is one flat column: top-level items, then each list's
// header followed by its items when it's open. Where a dropped item lands in that
// column decides its list (the nearest header above it, or none). Dropping just below
// a collapsed header puts the item at the end of that list.
//
// Lists are dragged by their own grip. While one is dragged every list collapses, so
// the headers sit next to each other.
import { useRef, useState } from "react";
import { I } from "../lib/icons.jsx";
import { useSortable } from "../lib/sortable.js";
import { ui } from "../lib/ui.js";
import { DragGrip } from "./DragGrip.jsx";
import { ListHeader } from "./ListHeader.jsx";

function GroupedItems({
  testId,
  items,
  lists,
  openLists,
  noun,
  empty,
  renderItem,
  onToggleList,
  onEditList,
  onNewList,
  onMoveItem,
  onReorderLists,
}) {
  const ref = useRef(null);
  const [draggingLists, setDraggingLists] = useState(false);
  const isOpen = (listId) => listId === null || (!draggingLists && openLists.includes(listId));
  const listIds = new Set(lists.map((l) => l.id));

  const itemSort = useSortable({
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
      onMoveItem(key, listId, isOpen(listId) ? index : Infinity);
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

  const item = (x) => (
    <div key={x.id} data-timer-item data-sort-key={x.id}>
      {renderItem(x, <DragGrip handleProps={itemSort.handleProps} label={`Move ${x.name || noun}`} testId={`${noun}-card-grip`} />)}
    </div>
  );

  const topLevel = items.filter((x) => !x.listId);

  return (
    <section data-testid={testId}>
      {items.length === 0 && lists.length === 0 ? (
        <p className="text-sm text-muted py-16 text-center" data-testid={`${testId.replace(/-view$/, "")}-empty`}>
          {empty}
        </p>
      ) : (
        <div ref={ref} className="flex flex-col gap-2">
          {topLevel.map(item)}
          {lists.map((l) => {
            const mine = items.filter((x) => x.listId === l.id);
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
                  ? mine.map(item)
                  : [<p key={`${l.id}-empty`} className="text-sm text-muted px-4 py-3" data-testid="list-empty">Empty. Drag a {noun} here, or pick this list in a {noun}'s editor.</p>]
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

export { GroupedItems };
