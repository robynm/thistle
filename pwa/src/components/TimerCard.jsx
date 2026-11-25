import { KIND_LABEL, STEP_KINDS } from "../lib/constants.js";
import { fmtClock, fmtShort } from "../lib/format.js";
import { I } from "../lib/icons.jsx";
import { kindBreakdown, totalSeconds } from "../lib/timerModel.js";

// One block: "8 × Work 0:40 · Rest 0:20". Several: "3 blocks".
function summary(timer) {
  if (timer.blocks.length !== 1) return `${timer.blocks.length} blocks`;
  const b = timer.blocks[0];
  const steps = b.steps.map((s) => `${s.name || KIND_LABEL[s.kind]} ${fmtClock(s.seconds)}`).join(" · ");
  return b.reps > 1 ? `${b.reps} × ${steps}` : steps;
}

function TimerCard({ timer, onRun, onEdit }) {
  const total = totalSeconds(timer);
  const parts = kindBreakdown(timer);
  return (
    <div className="bg-surface rounded-[18px] p-3.5 flex items-center gap-3" data-testid="timer-card">
      <button type="button" onClick={onEdit} className="flex-1 min-w-0 text-left active:opacity-70 transition-opacity" data-testid="timer-card-edit">
        <h3 className="font-display font-semibold text-base text-ink truncate" data-testid="timer-card-name">
          {timer.name || "Untitled timer"}
        </h3>
        <p className="text-xs text-muted truncate mt-0.5" data-testid="timer-card-total">
          {fmtShort(total)} · {summary(timer)}
        </p>
        {/* How much of the timer is each kind of step. */}
        <div className="flex gap-0.5 h-1 mt-2.5 rounded-full overflow-hidden">
          {STEP_KINDS.filter((k) => parts[k.id]).map((k) => (
            <span key={k.id} className={`bg-${k.id} rounded-full`} style={{ flexGrow: parts[k.id] }} />
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
