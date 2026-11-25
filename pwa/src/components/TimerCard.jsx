import { KIND_TONE, STEP_KINDS } from "../lib/constants.js";
import { fmtClock, fmtShort } from "../lib/format.js";
import { I } from "../lib/icons.jsx";
import { kindBreakdown, totalSeconds } from "../lib/timerModel.js";

// "8× Work 0:40 · Rest 0:20"
const blockSummary = (b) =>
  `${b.reps > 1 ? `${b.reps}× ` : ""}${b.steps.map((s) => `${s.name || STEP_KINDS.find((k) => k.id === s.kind)?.label} ${fmtClock(s.seconds)}`).join(" · ")}`;

function TimerCard({ timer, onRun, onEdit, index = 0 }) {
  const total = totalSeconds(timer);
  const parts = kindBreakdown(timer);
  return (
    <div
      className="bg-card rounded-2xl border-2 border-cream-100 shadow-card overflow-hidden card-lift fade-up"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      data-testid="timer-card"
    >
      {/* Proportional bar: how much of the timer is each kind of step. */}
      <div className="flex h-1.5">
        {STEP_KINDS.filter((k) => parts[k.id]).map((k) => (
          <span key={k.id} className={`bg-${KIND_TONE[k.id]}-400`} style={{ flexGrow: parts[k.id] }} />
        ))}
      </div>
      <div className="flex items-center gap-3 p-4">
        <button type="button" onClick={onEdit} className="flex-1 min-w-0 text-left active:scale-[0.98] transition-transform" data-testid="timer-card-edit">
          <h3 className="font-display font-bold text-lg tracking-tight text-ink-900 truncate" data-testid="timer-card-name">
            {timer.name || "Untitled timer"}
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-thistle-600 mt-0.5" data-testid="timer-card-total">
            {fmtShort(total)} · {timer.blocks.length} {timer.blocks.length === 1 ? "block" : "blocks"}
          </p>
          <div className="mt-1.5 space-y-0.5">
            {timer.blocks.slice(0, 3).map((b) => (
              <p key={b.id} className="text-xs text-ink-600 truncate">
                {b.name && <span className="font-bold text-ink-700">{b.name}: </span>}
                {blockSummary(b)}
              </p>
            ))}
            {timer.blocks.length > 3 && <p className="text-xs text-ink-400 italic">+{timer.blocks.length - 3} more</p>}
          </div>
        </button>
        <button
          type="button"
          onClick={onRun}
          disabled={total === 0}
          aria-label={`Start ${timer.name || "timer"}`}
          data-testid="timer-card-run"
          className="w-14 h-14 rounded-full bg-thistle-500 text-white shadow-brand flex items-center justify-center active:scale-95 transition-transform shrink-0 disabled:opacity-40"
        >
          <I.play size={22} className="ml-0.5" />
        </button>
      </div>
    </div>
  );
}

export { TimerCard };
