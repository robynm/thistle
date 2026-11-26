import { KIND_LABEL } from "../lib/constants.js";
import { fmtClock, fmtShort } from "../lib/format.js";
import { I } from "../lib/icons.jsx";
import { kindBreakdown, totalSeconds } from "../lib/timerModel.js";

// The bar reads in the order a workout usually goes, whatever order the steps are in.
const BAR_ORDER = ["warmup", "work", "rest", "cooldown"];

// One block: "8 × Work 0:40 · Rest 0:20". Several: "3 blocks".
function summary(timer) {
  if (timer.blocks.length !== 1) return `${timer.blocks.length} blocks`;
  const b = timer.blocks[0];
  const steps = b.steps.map((s) => `${s.name || KIND_LABEL[s.kind]} ${fmtClock(s.seconds)}`).join(" · ");
  return b.reps > 1 ? `${b.reps} × ${steps}` : steps;
}

function TimerCard({ timer, completed = 0, onRun, onEdit, grip }) {
  const total = totalSeconds(timer);
  const parts = kindBreakdown(timer);
  return (
    <div className="bg-surface rounded-[18px] p-3.5 pl-2 flex items-center gap-2" data-testid="timer-card">
      {grip}
      <button type="button" onClick={onEdit} className="flex-1 min-w-0 text-left active:opacity-70 transition-opacity" data-testid="timer-card-edit">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-display font-semibold text-base text-ink truncate" data-testid="timer-card-name">
            {timer.name || "Untitled timer"}
          </h3>
          {completed > 0 && (
            <span
              className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-rest-soft text-rest-ink text-[11px] font-semibold tabular px-1.5 py-0.5"
              title={`Completed ${completed} ${completed === 1 ? "time" : "times"}`}
              aria-label={`Completed ${completed} ${completed === 1 ? "time" : "times"}`}
              data-testid="timer-card-done"
            >
              <I.check size={11} strokeWidth={3} /> {completed}
            </span>
          )}
        </div>
        <p className="text-xs text-muted truncate mt-0.5" data-testid="timer-card-total">
          {fmtShort(total)} · {summary(timer)}
        </p>
        {/* How much of the timer is each kind of step. */}
        <div className="flex gap-0.5 h-1 mt-2.5 rounded-full overflow-hidden">
          {BAR_ORDER.filter((k) => parts[k]).map((k) => (
            <span key={k} className={`bg-${k} rounded-full`} style={{ flexGrow: parts[k] }} data-testid="timer-card-bar" data-kind={k} />
          ))}
        </div>
      </button>
      <button
        type="button"
        onClick={onRun}
        disabled={total === 0}
        aria-label={`Start ${timer.name || "timer"}`}
        data-testid="timer-card-run"
        className="w-11 h-11 rounded-full bg-brand text-on-brand flex items-center justify-center active:scale-95 transition-transform shrink-0 disabled:opacity-40"
      >
        <I.play size={16} className="ml-0.5" />
      </button>
    </div>
  );
}

export { TimerCard };
