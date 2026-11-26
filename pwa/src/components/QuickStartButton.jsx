// The split Quick start button that floats above the bottom nav on the Timers tab.
// The left side starts a run with the last-used settings; the right side opens them.
import { fmtClock } from "../lib/format.js";
import { I } from "../lib/icons.jsx";

function QuickStartButton({ quick, onStart, onEdit }) {
  const half = "flex items-center gap-2 bg-brand text-on-brand active:bg-brand/85 transition-colors";
  return (
    <div
      className="fixed inset-x-0 z-30 flex justify-center pointer-events-none"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 80px)" }}
    >
      <div className="pointer-events-auto flex rounded-full overflow-hidden shadow-[0_10px_28px_-10px_rgba(0,0,0,0.45)]" data-testid="quick-button">
        <button type="button" onClick={onStart} data-testid="quick-play" className={`${half} pl-5 pr-4 py-3`}>
          <I.play size={14} />
          <span className="text-left leading-tight">
            <span className="block text-sm font-semibold">Quick start</span>
            <span className="block text-[11px] opacity-70 tabular" data-testid="quick-summary">
              {quick.rounds} × {fmtClock(quick.work)} / {fmtClock(quick.rest)}
            </span>
          </span>
        </button>
        <span className="w-px bg-on-brand/20" aria-hidden="true" />
        <button type="button" onClick={onEdit} aria-label="Quick start settings" data-testid="quick-edit" className={`${half} px-4`}>
          <I.pencil size={16} />
        </button>
      </div>
    </div>
  );
}

export { QuickStartButton };
