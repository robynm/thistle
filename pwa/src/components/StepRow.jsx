import { KIND_LABEL, KIND_TONE, STEP_KINDS } from "../lib/constants.js";
import { I } from "../lib/icons.jsx";
import { DurationInput } from "./DurationInput.jsx";

const iconBtn = "w-8 h-8 rounded-full bg-cream-50 border-2 border-cream-100 text-ink-600 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30";

function StepRow({ step, testId, onChange, onMoveUp, onMoveDown, onRemove, canRemove }) {
  const tone = KIND_TONE[step.kind];
  return (
    <div className={`rounded-2xl border-2 border-${tone}-100 bg-${tone}-50 p-3 space-y-2.5`} data-testid={testId}>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Step kind">
        {STEP_KINDS.map((k) => {
          const active = step.kind === k.id;
          return (
            <button
              key={k.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange({ kind: k.id })}
              data-testid={`${testId}-kind-${k.id}`}
              className={`px-2.5 py-1 rounded-full border-2 text-[10px] font-bold uppercase tracking-[0.1em] active:scale-95 transition-all ${
                active ? `bg-${k.tone}-500 border-${k.tone}-500 text-white shadow-pop` : "bg-card border-cream-100 text-ink-500"
              }`}
            >
              {k.label}
            </button>
          );
        })}
      </div>
      <input
        type="text"
        value={step.name}
        placeholder={`Name (optional) — e.g. ${step.kind === "work" ? "Burpees" : KIND_LABEL[step.kind]}`}
        onChange={(e) => onChange({ name: e.target.value })}
        maxLength={40}
        aria-label="Step name"
        data-testid={`${testId}-name`}
        className="w-full rounded-full border-2 border-cream-100 bg-card px-3.5 py-1.5 text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-thistle-500"
      />
      <div className="flex items-center justify-between gap-2">
        <DurationInput seconds={step.seconds} onChange={(seconds) => onChange({ seconds })} label="step length" testId={`${testId}-seconds`} />
        <div className="flex gap-1.5">
          <button type="button" className={iconBtn} onClick={onMoveUp} disabled={!onMoveUp} aria-label="Move step up" data-testid={`${testId}-up`}>
            <I.chevronUp size={14} />
          </button>
          <button type="button" className={iconBtn} onClick={onMoveDown} disabled={!onMoveDown} aria-label="Move step down" data-testid={`${testId}-down`}>
            <I.chevronDown size={14} />
          </button>
          <button type="button" className={iconBtn} onClick={onRemove} disabled={!canRemove} aria-label="Remove step" data-testid={`${testId}-remove`}>
            <I.trash size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export { StepRow };
