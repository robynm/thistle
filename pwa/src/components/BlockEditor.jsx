import { MAX_REPS } from "../lib/constants.js";
import { I } from "../lib/icons.jsx";
import { newStep } from "../lib/timerModel.js";
import { ui } from "../lib/ui.js";
import { Stepper } from "./Stepper.jsx";
import { StepRow } from "./StepRow.jsx";

const ghost = `${ui.icon} w-8 h-8 bg-transparent text-muted`;

const swap = (arr, i, j) => {
  const out = [...arr];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
};

function BlockEditor({ block, index, onChange, onMoveUp, onMoveDown, onRemove, canRemove }) {
  const testId = `block-${index}`;
  const setSteps = (steps) => onChange({ steps });
  const updateStep = (si, patch) => setSteps(block.steps.map((s, i) => (i === si ? { ...s, ...patch } : s)));

  return (
    <div className="rounded-[20px] bg-surface p-2.5 space-y-2" data-testid={testId}>
      <div className="flex items-center gap-1 pl-1.5">
        <input
          type="text"
          value={block.name}
          placeholder={`Block ${index + 1}`}
          onChange={(e) => onChange({ name: e.target.value })}
          maxLength={40}
          aria-label="Block name"
          data-testid={`${testId}-name`}
          className="flex-1 min-w-0 bg-transparent font-display font-semibold text-base text-ink placeholder:text-faint outline-none"
        />
        <button type="button" className={ghost} onClick={onMoveUp} disabled={!onMoveUp} aria-label="Move block up" data-testid={`${testId}-up`}>
          <I.chevronUp size={16} />
        </button>
        <button type="button" className={ghost} onClick={onMoveDown} disabled={!onMoveDown} aria-label="Move block down" data-testid={`${testId}-down`}>
          <I.chevronDown size={16} />
        </button>
        <button type="button" className={ghost} onClick={onRemove} disabled={!canRemove} aria-label="Remove block" data-testid={`${testId}-remove`}>
          <I.trash size={15} />
        </button>
      </div>

      <div className="flex items-center justify-between pl-1.5">
        <span className="flex items-center gap-1.5 text-sm text-muted">
          <I.repeat size={15} /> Repeat
        </span>
        <Stepper value={block.reps} min={1} max={MAX_REPS} onChange={(reps) => onChange({ reps })} label="repeats" testId={`${testId}-reps`} suffix="×" />
      </div>

      {block.steps.map((s, si) => (
        <StepRow
          key={s.id}
          step={s}
          testId={`${testId}-step-${si}`}
          onChange={(patch) => updateStep(si, patch)}
          onMoveUp={si > 0 ? () => setSteps(swap(block.steps, si, si - 1)) : null}
          onMoveDown={si < block.steps.length - 1 ? () => setSteps(swap(block.steps, si, si + 1)) : null}
          onRemove={() => setSteps(block.steps.filter((_, i) => i !== si))}
          canRemove={block.steps.length > 1}
        />
      ))}

      <button
        type="button"
        onClick={() => setSteps([...block.steps, newStep(block.steps[block.steps.length - 1]?.kind === "work" ? "rest" : "work")])}
        data-testid={`${testId}-add-step`}
        className="w-full flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-sm font-medium text-muted active:bg-surface-2 transition-colors"
      >
        <I.plus size={14} /> Add step
      </button>
    </div>
  );
}

export { BlockEditor, swap };
