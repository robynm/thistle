// Create or edit a timer. Works on a private draft; nothing is saved until Save.
// Closing with unsaved changes asks first.
import { useMemo, useRef, useState } from "react";
import { fmtShort } from "../lib/format.js";
import { I } from "../lib/icons.jsx";
import { moveItem, newBlock, totalSeconds } from "../lib/timerModel.js";
import { useSortable } from "../lib/sortable.js";
import { ui } from "../lib/ui.js";
import { BlockEditor } from "./BlockEditor.jsx";
import { Modal } from "./Modal.jsx";

function TimerEditorModal({ timer, lists, isNew, onSave, onDelete, onDuplicate, onClose }) {
  const [draft, setDraft] = useState(() => structuredClone(timer));
  const [error, setError] = useState("");
  const initial = useMemo(() => JSON.stringify(timer), [timer]);
  const dirty = JSON.stringify(draft) !== initial;
  const total = totalSeconds(draft);

  const setBlocks = (blocks) => setDraft((d) => ({ ...d, blocks }));
  const updateBlock = (bi, patch) => setBlocks(draft.blocks.map((b, i) => (i === bi ? { ...b, ...patch } : b)));
  const blocksRef = useRef(null);
  const blockSort = useSortable({
    containerRef: blocksRef,
    selector: "[data-block-item]",
    onDrop: ({ key, to }) => setBlocks(moveItem(draft.blocks, draft.blocks.findIndex((b) => b.id === key), to)),
  });

  // Returns false to stay open, which the Back button handling relies on.
  const requestClose = () => {
    if (dirty && !confirm("Discard your changes to this timer?")) return false;
    onClose();
    return true;
  };

  const save = () => {
    if (total === 0) {
      setError("Give at least one step some time before saving.");
      return;
    }
    onSave({ ...draft, name: draft.name.trim() });
  };

  const footer = (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <p className="text-xs text-muted">Total</p>
        <p className="font-display font-bold text-lg text-ink tabular leading-tight" data-testid="editor-total">{fmtShort(total)}</p>
      </div>
      {!isNew && (
        <>
          <button type="button" className={`${ui.icon} w-10 h-10`} onClick={() => onDuplicate(draft)} aria-label="Duplicate timer" data-testid="editor-duplicate">
            <I.copy size={16} />
          </button>
          <button type="button" className={`${ui.icon} w-10 h-10`} onClick={onDelete} aria-label="Delete timer" data-testid="editor-delete">
            <I.trash size={16} />
          </button>
        </>
      )}
      <button type="button" onClick={save} data-testid="editor-save" className={`${ui.primary} px-6`}>
        Save
      </button>
    </div>
  );

  return (
    <Modal name="editor" title={isNew ? "New timer" : "Edit timer"} onClose={requestClose} footer={footer}>
      <input
        type="text"
        value={draft.name}
        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
        placeholder="Name, e.g. Morning HIIT"
        aria-label="Timer name"
        maxLength={60}
        data-testid="editor-name"
        className={`${ui.input} w-full font-semibold`}
      />
      {lists.length > 0 && (
        <label className="flex items-center justify-between gap-3 mt-2 pl-3.5 pr-2 py-1.5 rounded-xl bg-surface">
          <span className="text-sm text-muted">List</span>
          <select
            value={draft.listId ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, listId: e.target.value || null }))}
            data-testid="editor-list"
            className="bg-transparent text-ink font-medium text-right py-1 outline-none max-w-[60%]"
          >
            <option value="">No list</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>{l.name || "Untitled list"}</option>
            ))}
          </select>
        </label>
      )}
      <p className="text-xs text-muted mt-3 mb-2 px-1">Each block runs its steps in order, then repeats.</p>

      <div ref={blocksRef} className="flex flex-col gap-2">
        {draft.blocks.map((b, bi) => (
          <div key={b.id} data-block-item data-sort-key={b.id}>
            <BlockEditor
              block={b}
              index={bi}
              gripProps={blockSort.handleProps}
              onChange={(patch) => updateBlock(bi, patch)}
              onRemove={() => setBlocks(draft.blocks.filter((_, i) => i !== bi))}
              canRemove={draft.blocks.length > 1}
            />
          </div>
        ))}
      </div>

      <button type="button" onClick={() => setBlocks([...draft.blocks, newBlock()])} data-testid="editor-add-block" className={`${ui.secondary} w-full mt-2 py-3`}>
        <I.plus size={14} /> Add block
      </button>

      {error && (
        <p className="mt-3 rounded-xl bg-work-soft text-work-ink text-sm px-3.5 py-2.5" data-testid="editor-error">
          {error}
        </p>
      )}
    </Modal>
  );
}

export { TimerEditorModal };
