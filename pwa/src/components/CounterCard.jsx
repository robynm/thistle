// One counter on the Counters tab: tap the name to edit, − and + to count.
import { counterColor } from "../lib/counterModel.js";
import { I } from "../lib/icons.jsx";
import { ui } from "../lib/ui.js";

function CounterCard({ counter, pinned, onStep, onEdit, grip }) {
  const { token } = counterColor(counter.color);
  const name = counter.name || "Untitled counter";
  return (
    <div className="bg-surface rounded-[18px] p-3 pl-2 flex items-center gap-2" data-testid="counter-card" data-color={counter.color}>
      {grip}
      <button type="button" onClick={onEdit} className="flex-1 min-w-0 text-left flex items-center gap-2.5 py-1 active:opacity-70 transition-opacity" data-testid="counter-card-edit">
        <span className={`w-3 h-3 rounded-full shrink-0 bg-${token}`} aria-hidden="true" />
        <span className="font-display font-semibold text-base text-ink truncate" data-testid="counter-card-name">{name}</span>
        {pinned && (
          <span className="text-muted shrink-0" title="Shown on the lock screen" aria-label="Shown on the lock screen" data-testid="counter-card-lock">
            <I.bell size={13} />
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => onStep(-1)}
        disabled={counter.count <= 0}
        aria-label={`Count down ${name}`}
        data-testid="counter-card-minus"
        className={`${ui.icon} w-11 h-11 bg-bg`}
      >
        <I.minus size={18} />
      </button>
      <span className="min-w-[3ch] text-center font-display font-bold text-2xl text-ink tabular" aria-live="polite" data-testid="counter-card-count">
        {counter.count}
      </span>
      <button
        type="button"
        onClick={() => onStep(1)}
        aria-label={`Count up ${name}`}
        data-testid="counter-card-plus"
        className={`w-11 h-11 rounded-full bg-${token} text-on-brand flex items-center justify-center active:scale-95 transition-transform shrink-0`}
      >
        <I.plus size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}

export { CounterCard };
