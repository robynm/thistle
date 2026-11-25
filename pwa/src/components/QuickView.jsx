// A one-off work/rest/rounds timer. The fields remember their last values.
import { MAX_REPS } from "../lib/constants.js";
import { fmtShort } from "../lib/format.js";
import { I } from "../lib/icons.jsx";
import { quickTimer, totalSeconds } from "../lib/timerModel.js";
import { DurationInput } from "./DurationInput.jsx";
import { SectionLabel } from "./SectionLabel.jsx";
import { Stepper } from "./Stepper.jsx";

function Field({ tone, label, children }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl border-2 border-${tone}-100 bg-${tone}-50 px-4 py-3`}>
      <span className={`text-[11px] font-bold uppercase tracking-[0.15em] text-${tone}-700`}>{label}</span>
      {children}
    </div>
  );
}

function QuickView({ quick, onChange, onStart }) {
  const set = (patch) => onChange({ ...quick, ...patch });
  const total = totalSeconds(quickTimer(quick));
  return (
    <section data-testid="quick-view" className="max-w-md mx-auto">
      <SectionLabel tone="petal">Quick start</SectionLabel>
      <div className="bg-card rounded-3xl border-2 border-cream-100 shadow-card p-4 space-y-3 fade-up">
        <Field tone="petal" label="Work">
          <DurationInput seconds={quick.work} min={1} onChange={(work) => set({ work })} label="work length" testId="quick-work" />
        </Field>
        <Field tone="leaf" label="Rest">
          <DurationInput seconds={quick.rest} onChange={(rest) => set({ rest })} label="rest length" testId="quick-rest" />
        </Field>
        <Field tone="thistle" label="Rounds">
          <Stepper value={quick.rounds} min={1} max={MAX_REPS} onChange={(rounds) => set({ rounds })} label="rounds" testId="quick-rounds" />
        </Field>
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-400">Total</p>
            <p className="font-display font-bold text-2xl text-ink-900 tabular" data-testid="quick-total">{fmtShort(total)}</p>
          </div>
          <button
            type="button"
            onClick={onStart}
            data-testid="quick-start"
            className="inline-flex items-center gap-2 bg-thistle-500 text-white rounded-full px-6 py-3.5 text-xs font-bold uppercase tracking-[0.15em] shadow-brand active:scale-95 transition-transform"
          >
            <I.play size={14} /> Start
          </button>
        </div>
      </div>
      <p className="text-xs text-ink-400 text-center mt-4">The last rest is skipped — you're done after the final round of work.</p>
    </section>
  );
}

export { QuickView };
