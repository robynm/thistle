// A number with − and + buttons, for reps and rounds.
import { I } from "../lib/icons.jsx";

function Stepper({ value, min = 1, max = 99, onChange, label, testId, suffix }) {
  const set = (v) => onChange(Math.min(max, Math.max(min, v)));
  const btn = "w-9 h-9 rounded-full bg-cream-50 border-2 border-cream-100 text-ink-600 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40";
  return (
    <div className="flex items-center gap-2" data-testid={testId}>
      <button type="button" className={btn} onClick={() => set(value - 1)} disabled={value <= min} aria-label={`Fewer ${label}`} data-testid={`${testId}-minus`}>
        <I.minus size={14} />
      </button>
      <span className="min-w-[3ch] text-center font-display font-bold text-lg text-ink-900 tabular" data-testid={`${testId}-value`}>
        {value}
        {suffix && <span className="text-xs font-bold text-ink-400 ml-0.5">{suffix}</span>}
      </span>
      <button type="button" className={btn} onClick={() => set(value + 1)} disabled={value >= max} aria-label={`More ${label}`} data-testid={`${testId}-plus`}>
        <I.plus size={14} />
      </button>
    </div>
  );
}

export { Stepper };
