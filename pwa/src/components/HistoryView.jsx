import { fmtShort, fmtWhen } from "../lib/format.js";
import { I } from "../lib/icons.jsx";
import { ui } from "../lib/ui.js";

function HistoryRow({ entry }) {
  const done = entry.completed;
  return (
    <li className="flex items-center gap-3 py-3" data-testid="history-entry">
      <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-rest-soft text-rest-ink" : "bg-surface text-muted"}`}>
        {done ? <I.check size={16} strokeWidth={2.5} /> : <I.pause size={12} />}
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-ink truncate" data-testid="history-entry-name">{entry.timerName || "Untitled timer"}</h3>
        <p className="text-xs text-muted">{fmtWhen(entry.startedAt)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-semibold text-ink tabular" data-testid="history-entry-time">{fmtShort(entry.elapsedSec)}</p>
        <p className={`text-xs ${done ? "text-rest-ink" : "text-muted"}`} data-testid="history-entry-status">
          {done ? "Done" : `Partial · ${Math.round(entry.progress * 100)}%`}
        </p>
      </div>
    </li>
  );
}

function HistoryView({ history, onClear }) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted py-16 text-center" data-testid="history-empty">
        Nothing here yet. Finish a workout and it'll show up.
      </p>
    );
  }
  const totalSec = history.reduce((n, h) => n + h.elapsedSec, 0);
  return (
    <section data-testid="history-view" className="max-w-2xl">
      <p className="text-sm text-muted" data-testid="history-summary">
        {history.length} {history.length === 1 ? "workout" : "workouts"}, {fmtShort(totalSec)} in total
      </p>
      <ul className="divide-y divide-line mt-2">
        {history.map((h) => <HistoryRow key={h.id} entry={h} />)}
      </ul>
      <button type="button" onClick={onClear} data-testid="history-clear" className={`${ui.secondary} mt-6`}>
        Clear history
      </button>
    </section>
  );
}

export { HistoryView };
