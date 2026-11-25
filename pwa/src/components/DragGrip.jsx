// The ⠿ handle that starts a drag. `handleProps` comes from useSortable.
import { I } from "../lib/icons.jsx";

function DragGrip({ handleProps, label, testId, className = "" }) {
  return (
    <button
      type="button"
      {...handleProps}
      aria-label={`${label}. Drag, or use the arrow keys, to reorder.`}
      data-testid={testId}
      className={`w-8 h-9 -ml-1 flex items-center justify-center rounded-lg text-faint cursor-grab active:cursor-grabbing active:text-ink shrink-0 select-none ${className}`}
    >
      <I.grip size={16} />
    </button>
  );
}

export { DragGrip };
