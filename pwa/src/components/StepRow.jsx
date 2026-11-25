import { KIND_LABEL, STEP_KINDS } from "../lib/constants.js";
import { I } from "../lib/icons.jsx";
import { ui } from "../lib/ui.js";
import { DurationInput } from "./DurationInput.jsx";

const ghost = `${ui.icon} w-8 h-8 bg-transparent text-muted`;

function StepRow({ step, testId, onChange, onMoveUp, onMoveDown, onRemove, canRemove }) {
  return (
    <div className="bg-bg rounded-2xl p-2.5 space-y-2" data-testid={testId}>
      <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Step kind">
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
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${active ? `bg-${k.id} text-on-brand` : "text-muted active:bg-surface"}`}
            >
              {k.label}
            </button>
          );
        })}
      </div>
      <input
        type="text"
        value={step.name}
        placeholder={step.kind === "work" ? "Name, e.g. Burpees" : `Name (optional): ${KIND_LABEL[step.kind]}`}
        onChange={(e) => onChange({ name: e.target.value })}
        maxLength={40}
        aria-label="Step name"
        data-testid={`${testId}-name`}
        className={`${ui.input} w-full py-2 text-sm`}
      />
      <div className="flex items-center justify-between gap-2">
        <div className="bg-surface rounded-full">
          <DurationInput seconds={step.seconds} onChange={(seconds) => onChange({ seconds })} label="step length" testId={`${testId}-seconds`} />
        </div>
        <div className="flex">
          <button type="button" className={ghost} onClick={onMoveUp} disabled={!onMoveUp} aria-label="Move step up" data-testid={`${testId}-up`}>
            <I.chevronUp size={16} />
          </button>
          <button type="button" className={ghost} onClick={onMoveDown} disabled={!onMoveDown} aria-label="Move step down" data-testid={`${testId}-down`}>
            <I.chevronDown size={16} />
          </button>
          <button type="button" className={ghost} onClick={onRemove} disabled={!canRemove} aria-label="Remove step" data-testid={`${testId}-remove`}>
            <I.trash size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export { StepRow };
