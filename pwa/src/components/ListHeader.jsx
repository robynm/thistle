// A list's section header on the Timers tab: grip, collapse toggle, name, count, edit.
import { I } from "../lib/icons.jsx";
import { ui } from "../lib/ui.js";
import { DragGrip } from "./DragGrip.jsx";

function ListHeader({ list, count, open, onToggle, onEdit, gripProps }) {
  return (
    <div className="flex items-center gap-1 pl-2 pr-1 py-1 bg-bg rounded-[18px]" data-testid="list-header">
      <DragGrip handleProps={gripProps} label={`Move list ${list.name}`} testId="list-grip" />
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        data-testid="list-toggle"
        className="flex-1 min-w-0 flex items-center gap-2 py-2 text-left active:opacity-70"
      >
        <I.chevronRight size={16} className={`text-muted shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
        <span className="font-display font-semibold text-lg text-ink truncate" data-testid="list-name">{list.name || "Untitled list"}</span>
        <span className="text-sm text-muted tabular" data-testid="list-count">{count}</span>
      </button>
      <button type="button" onClick={onEdit} aria-label={`Edit list ${list.name}`} data-testid="list-edit" className={`${ui.icon} w-9 h-9 bg-transparent text-muted`}>
        <I.pencil size={15} />
      </button>
    </div>
  );
}

export { ListHeader };
