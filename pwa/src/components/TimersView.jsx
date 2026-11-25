import { TimerCard } from "./TimerCard.jsx";

function TimersView({ timers, onRun, onEdit }) {
  return (
    <section data-testid="timers-view">
      {timers.length === 0 ? (
        <p className="text-sm text-muted py-16 text-center" data-testid="timers-empty">
          No timers yet. Tap <b className="text-ink">New</b> to make one.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {timers.map((t) => (
            <TimerCard key={t.id} timer={t} onRun={() => onRun(t)} onEdit={() => onEdit(t)} />
          ))}
        </div>
      )}
    </section>
  );
}

export { TimersView };
