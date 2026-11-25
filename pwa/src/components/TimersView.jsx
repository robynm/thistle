import { SectionLabel } from "./SectionLabel.jsx";
import { TimerCard } from "./TimerCard.jsx";

function TimersView({ timers, onRun, onEdit }) {
  return (
    <section data-testid="timers-view">
      <SectionLabel count={timers.length}>Your timers</SectionLabel>
      {timers.length === 0 ? (
        <p className="text-xs italic text-ink-400 py-10 text-center" data-testid="timers-empty">
          No timers yet — tap New to make one.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {timers.map((t, i) => (
            <TimerCard key={t.id} timer={t} index={i} onRun={() => onRun(t)} onEdit={() => onEdit(t)} />
          ))}
        </div>
      )}
    </section>
  );
}

export { TimersView };
