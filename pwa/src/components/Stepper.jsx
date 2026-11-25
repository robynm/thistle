// A number with − and + buttons, for reps and rounds.
import { I } from "../lib/icons.jsx";
import { ui } from "../lib/ui.js";

function Stepper({ value, min = 1, max = 99, onChange, label, testId, suffix }) {
  const set = (v) => onChange(Math.min(max, Math.max(min, v)));
  return (
    <div className="flex items-center gap-1" data-testid={testId}>
      <button type="button" className={`${ui.icon} w-9 h-9 bg-bg`} onClick={() => set(value - 1)} disabled={value <= min} aria-label={`Fewer ${label}`} data-testid={`${testId}-minus`}>
        <I.minus size={14} />
      </button>
      <span className="min-w-[3.5ch] text-center font-semibold text-ink tabular" data-testid={`${testId}-value`}>
        {value}
        {suffix && <span className="text-muted font-normal">{suffix}</span>}
      </span>
      <button type="button" className={`${ui.icon} w-9 h-9 bg-bg`} onClick={() => set(value + 1)} disabled={value >= max} aria-label={`More ${label}`} data-testid={`${testId}-plus`}>
        <I.plus size={14} />
      </button>
    </div>
  );
}

export { Stepper };
