// Settings for the one-off work/rest/rounds timer, opened from the edit half of the
// Quick start button. The fields remember their last values; Start runs it.
import { MAX_REPS } from "../lib/constants.js";
import { fmtShort } from "../lib/format.js";
import { I } from "../lib/icons.jsx";
import { quickTimer, totalSeconds } from "../lib/timerModel.js";
import { ui } from "../lib/ui.js";
import { DurationInput } from "./DurationInput.jsx";
import { Modal } from "./Modal.jsx";
import { Stepper } from "./Stepper.jsx";

function Row({ dot, label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="flex items-center gap-2.5 font-medium text-ink">
        {dot && <span className={`w-2.5 h-2.5 rounded-full bg-${dot}`} />}
        {label}
      </span>
      {children}
    </div>
  );
}

function QuickModal({ quick, onChange, onStart, onClose }) {
  const set = (patch) => onChange({ ...quick, ...patch });
  const total = totalSeconds(quickTimer(quick));
  return (
    <Modal name="quick" title="Quick start" blurb="Work, rest, repeat. No saving needed." onClose={onClose}>
      <section data-testid="quick-view">
        <div className="bg-surface rounded-[20px] px-4 py-1.5 divide-y divide-line">
          <Row dot="work" label="Work">
            <DurationInput seconds={quick.work} min={1} onChange={(work) => set({ work })} label="work length" testId="quick-work" />
          </Row>
          <Row dot="rest" label="Rest">
            <DurationInput seconds={quick.rest} onChange={(rest) => set({ rest })} label="rest length" testId="quick-rest" />
          </Row>
          <Row label="Rounds">
            <Stepper value={quick.rounds} min={1} max={MAX_REPS} onChange={(rounds) => set({ rounds })} label="rounds" testId="quick-rounds" />
          </Row>
        </div>
        <div className="flex items-center justify-between mt-5 px-1">
          <div>
            <p className="text-xs text-muted">Total</p>
            <p className="font-display font-bold text-2xl text-ink tabular leading-tight" data-testid="quick-total">{fmtShort(total)}</p>
          </div>
          <button type="button" onClick={onStart} data-testid="quick-start" className={`${ui.primary} px-7 py-3.5 text-base`}>
            <I.play size={14} /> Start
          </button>
        </div>
        <p className="text-xs text-muted mt-6 px-1">The last rest is skipped, so the timer ends on your final round of work.</p>
      </section>
    </Modal>
  );
}

export { QuickModal };
