import { MAX_REPS } from "../lib/constants.js";
import { I } from "../lib/icons.jsx";
import { newStep } from "../lib/timerModel.js";
import { Stepper } from "./Stepper.jsx";
import { StepRow } from "./StepRow.jsx";

const iconBtn = "w-8 h-8 rounded-full bg-cream-50 border-2 border-cream-100 text-ink-600 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30";

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
    <div className="rounded-3xl border-2 border-cream-100 bg-cream-50/60 p-3.5 space-y-3" data-testid={testId}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={block.name}
          placeholder={`Block ${index + 1}`}
          onChange={(e) => onChange({ name: e.target.value })}
          maxLength={40}
          aria-label="Block name"
          data-testid={`${testId}-name`}
          className="flex-1 min-w-0 bg-transparent font-display font-bold text-lg text-ink-900 placeholder:text-ink-400 focus:outline-none border-b-2 border-transparent focus:border-thistle-500"
        />
        <button type="button" className={iconBtn} onClick={onMoveUp} disabled={!onMoveUp} aria-label="Move block up" data-testid={`${testId}-up`}>
          <I.chevronUp size={14} />
        </button>
        <button type="button" className={iconBtn} onClick={onMoveDown} disabled={!onMoveDown} aria-label="Move block down" data-testid={`${testId}-down`}>
          <I.chevronDown size={14} />
        </button>
        <button type="button" className={iconBtn} onClick={onRemove} disabled={!canRemove} aria-label="Remove block" data-testid={`${testId}-remove`}>
          <I.trash size={14} />
        </button>
      </div>

      <div className="flex items-center justify-between bg-card rounded-full border-2 border-cream-100 pl-4 pr-1.5 py-1">
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-600">
          <I.repeat size={14} /> Repeat
        </span>
        <Stepper value={block.reps} min={1} max={MAX_REPS} onChange={(reps) => onChange({ reps })} label="repeats" testId={`${testId}-reps`} suffix="×" />
      </div>

      <div className="space-y-2">
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
      </div>

      <button
        type="button"
        onClick={() => setSteps([...block.steps, newStep(block.steps[block.steps.length - 1]?.kind === "work" ? "rest" : "work")])}
        data-testid={`${testId}-add-step`}
        className="w-full flex items-center justify-center gap-1.5 border-2 border-dashed border-thistle-200 bg-thistle-50/50 rounded-full py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-thistle-700 active:scale-[0.98] transition-transform"
      >
        <I.plus size={12} /> Add step
      </button>
    </div>
  );
}

export { BlockEditor, swap };
