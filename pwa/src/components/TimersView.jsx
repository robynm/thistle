// The Timers tab: saved timers grouped into lists (see GroupedItems).
import { GroupedItems } from "./GroupedItems.jsx";
import { TimerCard } from "./TimerCard.jsx";

function TimersView({ timers, completedCounts, lists, openLists, onToggleList, onRun, onEdit, onEditList, onNewList, onMoveTimer, onReorderLists }) {
  return (
    <GroupedItems
      testId="timers-view"
      noun="timer"
      items={timers}
      lists={lists}
      openLists={openLists}
      empty={<>No timers yet. Tap <b className="text-ink">New</b> to make one.</>}
      renderItem={(t, grip) => (
        <TimerCard timer={t} completed={completedCounts.get(t.id) ?? 0} onRun={() => onRun(t)} onEdit={() => onEdit(t)} grip={grip} />
      )}
      onToggleList={onToggleList}
      onEditList={onEditList}
      onNewList={onNewList}
      onMoveItem={onMoveTimer}
      onReorderLists={onReorderLists}
    />
  );
}

export { TimersView };
