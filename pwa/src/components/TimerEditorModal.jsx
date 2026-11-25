// Create or edit a timer. Works on a private draft; nothing is saved until Save.
// Closing with unsaved changes asks first.
import { useMemo, useState } from "react";
import { fmtShort } from "../lib/format.js";
import { I } from "../lib/icons.jsx";
import { newBlock, totalSeconds } from "../lib/timerModel.js";
import { BlockEditor, swap } from "./BlockEditor.jsx";
import { Modal } from "./Modal.jsx";

function TimerEditorModal({ timer, isNew, onSave, onDelete, onDuplicate, onClose }) {
  const [draft, setDraft] = useState(() => structuredClone(timer));
  const [error, setError] = useState("");
  const initial = useMemo(() => JSON.stringify(timer), [timer]);
  const dirty = JSON.stringify(draft) !== initial;
  const total = totalSeconds(draft);

  const setBlocks = (blocks) => setDraft((d) => ({ ...d, blocks }));
  const updateBlock = (bi, patch) => setBlocks(draft.blocks.map((b, i) => (i === bi ? { ...b, ...patch } : b)));

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

  const secondary = "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-cream-50 border-2 border-cream-100 text-ink-600 text-[11px] font-bold uppercase tracking-[0.1em] active:scale-95 transition-transform";

  return (
    <Modal
      name="editor"
      eyebrow={isNew ? "New timer" : "Edit timer"}
      eyebrowIcon={I.timer}
      title={draft.name.trim() || (isNew ? "New timer" : "Untitled timer")}
      blurb="Build it from blocks. Each block runs its steps in order, then repeats."
      onClose={requestClose}
    >
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-500">Name</span>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder="e.g. Morning HIIT"
          maxLength={60}
          data-testid="editor-name"
          className="mt-1 w-full rounded-full border-2 border-cream-100 bg-cream-50 px-4 py-2.5 text-ink-900 font-bold placeholder:text-ink-400 placeholder:font-normal focus:outline-none focus:border-thistle-500"
        />
      </label>

      <div className="mt-5 space-y-3">
        {draft.blocks.map((b, bi) => (
          <BlockEditor
            key={b.id}
            block={b}
            index={bi}
            onChange={(patch) => updateBlock(bi, patch)}
            onMoveUp={bi > 0 ? () => setBlocks(swap(draft.blocks, bi, bi - 1)) : null}
            onMoveDown={bi < draft.blocks.length - 1 ? () => setBlocks(swap(draft.blocks, bi, bi + 1)) : null}
            onRemove={() => setBlocks(draft.blocks.filter((_, i) => i !== bi))}
            canRemove={draft.blocks.length > 1}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setBlocks([...draft.blocks, newBlock()])}
        data-testid="editor-add-block"
        className="mt-3 w-full flex flex-col items-center gap-2 border-2 border-dashed border-thistle-200 bg-thistle-50/50 rounded-3xl py-5 active:scale-[0.98] transition-transform"
      >
        <span className="w-9 h-9 rounded-full bg-thistle-100 text-thistle-700 flex items-center justify-center">
          <I.plus size={16} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-thistle-700">Add block</span>
      </button>

      {error && (
        <p className="mt-4 rounded-2xl bg-petal-50 border-2 border-petal-100 text-petal-700 text-sm px-4 py-2.5" data-testid="editor-error">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 -mx-6 sm:-mx-8 mt-5 px-6 sm:px-8 pt-3 pb-1 bg-card border-t-2 border-cream-100">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-400">Total</p>
            <p className="font-display font-bold text-xl text-ink-900 tabular" data-testid="editor-total">{fmtShort(total)}</p>
          </div>
          {!isNew && (
            <>
              <button type="button" className={secondary} onClick={() => onDuplicate(draft)} aria-label="Duplicate timer" data-testid="editor-duplicate">
                <I.copy size={12} />
              </button>
              <button type="button" className={secondary} onClick={onDelete} aria-label="Delete timer" data-testid="editor-delete">
                <I.trash size={12} />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={save}
            data-testid="editor-save"
            className="inline-flex items-center gap-1.5 bg-thistle-500 text-white rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] shadow-pop active:scale-95 transition-transform"
          >
            <I.check size={12} /> Save
          </button>
        </div>
      </div>
    </Modal>
  );
}

export { TimerEditorModal };
