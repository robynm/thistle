import { useRef } from "react";
import { MAX_REPS } from "../lib/constants.js";
import { I } from "../lib/icons.jsx";
import { useSortable } from "../lib/sortable.js";
import { moveItem, newStep } from "../lib/timerModel.js";
import { ui } from "../lib/ui.js";
import { DragGrip } from "./DragGrip.jsx";
import { Stepper } from "./Stepper.jsx";
import { StepRow } from "./StepRow.jsx";

// `gripProps` drags the whole block (handled by the editor); steps are dragged within
// the block by their own grips.
function BlockEditor({ block, index, gripProps, onChange, onRemove, canRemove }) {
  const testId = `block-${index}`;
  const setSteps = (steps) => onChange({ steps });
  const updateStep = (si, patch) => setSteps(block.steps.map((s, i) => (i === si ? { ...s, ...patch } : s)));
  const stepsRef = useRef(null);
  const stepSort = useSortable({
    containerRef: stepsRef,
    selector: "[data-step-item]",
    onDrop: ({ key, to }) => setSteps(moveItem(block.steps, block.steps.findIndex((s) => s.id === key), to)),
  });

  return (
    <div className="rounded-[20px] bg-surface p-2.5 space-y-2" data-testid={testId}>
      <div className="flex items-center gap-1">
        <DragGrip handleProps={gripProps} label={`Move block ${index + 1}`} testId={`${testId}-grip`} />
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
        <button type="button" className={`${ui.icon} w-8 h-8 bg-transparent text-muted`} onClick={onRemove} disabled={!canRemove} aria-label="Remove block" data-testid={`${testId}-remove`}>
          <I.trash size={15} />
        </button>
      </div>

      <div className="flex items-center justify-between pl-1.5">
        <span className="flex items-center gap-1.5 text-sm text-muted">
          <I.repeat size={15} /> Repeat
        </span>
        <Stepper value={block.reps} min={1} max={MAX_REPS} onChange={(reps) => onChange({ reps })} label="repeats" testId={`${testId}-reps`} suffix="×" />
      </div>

      <div ref={stepsRef} className="flex flex-col gap-2">
        {block.steps.map((s, si) => (
          <div key={s.id} data-step-item data-sort-key={s.id}>
            <StepRow
              step={s}
              testId={`${testId}-step-${si}`}
              gripProps={stepSort.handleProps}
              onChange={(patch) => updateStep(si, patch)}
              onRemove={() => setSteps(block.steps.filter((_, i) => i !== si))}
              canRemove={block.steps.length > 1}
            />
          </div>
        ))}
      </div>

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

export { BlockEditor };
