// The Counters tab: counters grouped into their own lists (see GroupedItems).
import { CounterCard } from "./CounterCard.jsx";
import { GroupedItems } from "./GroupedItems.jsx";

function CountersView({ counters, lists, openLists, lockCounterId, onToggleList, onStep, onEdit, onEditList, onNewList, onMoveCounter, onReorderLists }) {
  return (
    <GroupedItems
      testId="counters-view"
      noun="counter"
      items={counters}
      lists={lists}
      openLists={openLists}
      empty={<>No counters yet. Tap <b className="text-ink">New</b> to make one.</>}
      renderItem={(c, grip) => (
        <CounterCard counter={c} pinned={c.id === lockCounterId} onStep={(d) => onStep(c.id, d)} onEdit={() => onEdit(c)} grip={grip} />
      )}
      onToggleList={onToggleList}
      onEditList={onEditList}
      onNewList={onNewList}
      onMoveItem={onMoveCounter}
      onReorderLists={onReorderLists}
    />
  );
}

export { CountersView };
