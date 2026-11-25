import { fmtShort, fmtWhen } from "../lib/format.js";
import { I } from "../lib/icons.jsx";
import { SectionLabel } from "./SectionLabel.jsx";

function HistoryRow({ entry }) {
  const done = entry.completed;
  return (
    <li className="bg-card rounded-2xl border-2 border-cream-100 shadow-card p-4 flex items-center gap-3" data-testid="history-entry">
      <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-leaf-500 text-white" : "bg-cream-100 text-ink-500"}`}>
        {done ? <I.check size={18} /> : <I.pause size={14} />}
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-bold text-base text-ink-900 truncate" data-testid="history-entry-name">
          {entry.timerName || "Untitled timer"}
        </h3>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-plum-600 mt-0.5">{fmtWhen(entry.startedAt)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-ink-800 tabular" data-testid="history-entry-time">{fmtShort(entry.elapsedSec)}</p>
        <span
          className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.12em] ${done ? "bg-leaf-50 text-leaf-700" : "bg-thistle-50 text-thistle-700"}`}
          data-testid="history-entry-status"
        >
          {done ? "Done" : `Partial · ${Math.round(entry.progress * 100)}%`}
        </span>
      </div>
    </li>
  );
}

function HistoryView({ history, onClear }) {
  const totalSec = history.reduce((n, h) => n + h.elapsedSec, 0);
  return (
    <section data-testid="history-view">
      <SectionLabel tone="plum" count={history.length}>History</SectionLabel>
      {history.length === 0 ? (
        <p className="text-xs italic text-ink-400 py-10 text-center" data-testid="history-empty">
          Nothing here yet — finish a workout and it'll show up.
        </p>
      ) : (
        <>
          <p className="text-sm text-ink-600 mb-3" data-testid="history-summary">
            {history.length} {history.length === 1 ? "workout" : "workouts"}, {fmtShort(totalSec)} in total.
          </p>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {history.map((h) => <HistoryRow key={h.id} entry={h} />)}
          </ul>
          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={onClear}
              data-testid="history-clear"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-cream-50 border-2 border-cream-100 text-ink-600 text-[11px] font-bold uppercase tracking-[0.1em] active:scale-95 transition-transform"
            >
              <I.trash size={12} /> Clear history
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export { HistoryView };
