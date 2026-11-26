// Create or edit a counter. Works on a private draft; nothing is saved until Save.
// Closing with unsaved changes asks first. "Show on lock screen" is part of the draft
// too, though it's stored per device rather than on the counter.
import { useMemo, useState } from "react";
import { COUNTER_COLORS } from "../lib/constants.js";
import { clampCount } from "../lib/counterModel.js";
import { I } from "../lib/icons.jsx";
import { notifySupported, requestNotifyPermission } from "../lib/lockScreen.js";
import { ui } from "../lib/ui.js";
import { Modal } from "./Modal.jsx";

function CounterEditorModal({ counter, lists, isNew, pinned, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(() => ({ ...counter, pinned }));
  const [countText, setCountText] = useState(String(counter.count));
  const [error, setError] = useState("");
  const initial = useMemo(() => JSON.stringify({ ...counter, pinned }), [counter, pinned]);
  const dirty = JSON.stringify(draft) !== initial;
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const requestClose = () => {
    if (dirty && !confirm("Discard your changes to this counter?")) return false;
    onClose();
    return true;
  };

  const save = (e) => {
    e?.preventDefault();
    const { pinned: pin, ...rest } = draft;
    // Read the count field directly, in case it still has focus.
    onSave({ ...rest, name: rest.name.trim(), count: clampCount(countText) }, pin);
  };

  const commitCount = () => {
    const n = clampCount(countText);
    setCountText(String(n));
    set({ count: n });
  };

  const reset = () => {
    if (!confirm("Reset this counter to 0?")) return;
    setCountText("0");
    set({ count: 0 });
  };

  const togglePin = async () => {
    setError("");
    if (!draft.pinned && !(await requestNotifyPermission())) {
      setError("Notifications are blocked for Thistle. Allow them in your browser's site settings, then try again.");
      return;
    }
    set({ pinned: !draft.pinned });
  };

  const footer = (
    <div className="flex items-center gap-2">
      {!isNew && (
        <button type="button" className={`${ui.icon} w-10 h-10`} onClick={onDelete} aria-label="Delete counter" data-testid="counter-editor-delete">
          <I.trash size={16} />
        </button>
      )}
      <span className="flex-1" />
      <button type="button" onClick={save} data-testid="counter-editor-save" className={`${ui.primary} px-6`}>
        Save
      </button>
    </div>
  );

  return (
    <Modal name="counter-editor" title={isNew ? "New counter" : "Edit counter"} onClose={requestClose} footer={footer}>
      <form onSubmit={save}>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Name, e.g. Push-ups"
          aria-label="Counter name"
          maxLength={60}
          data-testid="counter-editor-name"
          className={`${ui.input} w-full font-semibold`}
        />
      </form>

      <div className="flex gap-2 mt-3" role="radiogroup" aria-label="Color">
        {COUNTER_COLORS.map((c) => {
          const active = draft.color === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={c.label}
              onClick={() => set({ color: c.id })}
              data-testid={`counter-editor-color-${c.id}`}
              className={`w-9 h-9 rounded-full bg-${c.token} flex items-center justify-center text-on-brand transition-transform active:scale-95 ${active ? "ring-2 ring-offset-2 ring-offset-bg ring-ink" : ""}`}
            >
              {active && <I.check size={16} strokeWidth={3} />}
            </button>
          );
        })}
      </div>

      {lists.length > 0 && (
        <label className="flex items-center justify-between gap-3 mt-3 pl-3.5 pr-2 py-1.5 rounded-xl bg-surface">
          <span className="text-sm text-muted">List</span>
          <select
            value={draft.listId ?? ""}
            onChange={(e) => set({ listId: e.target.value || null })}
            data-testid="counter-editor-list"
            className="bg-transparent text-ink font-medium text-right py-1 outline-none max-w-[60%]"
          >
            <option value="">No list</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>{l.name || "Untitled list"}</option>
            ))}
          </select>
        </label>
      )}

      <div className="flex items-center justify-between gap-3 mt-2 pl-3.5 pr-2 py-1.5 rounded-xl bg-surface">
        <span className="text-sm text-muted">Count</span>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={countText}
            onChange={(e) => setCountText(e.target.value.replace(/\D/g, ""))}
            onBlur={commitCount}
            onFocus={(e) => e.currentTarget.select()}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            aria-label="Count"
            data-testid="counter-editor-count"
            className="w-24 text-right bg-transparent font-semibold text-ink tabular py-1 outline-none rounded-lg focus:bg-bg focus:ring-2 focus:ring-brand px-2"
          />
          <button type="button" onClick={reset} disabled={draft.count === 0} data-testid="counter-editor-reset" className={`${ui.secondary} bg-bg py-1.5 px-3`}>
            Reset
          </button>
        </div>
      </div>

      {notifySupported() && (
        <button
          type="button"
          role="switch"
          aria-checked={draft.pinned}
          onClick={togglePin}
          data-testid="counter-editor-pin"
          className="w-full flex items-center justify-between gap-3 mt-2 px-3.5 py-3 rounded-xl bg-surface text-left"
        >
          <span>
            <span className="block text-sm font-medium text-ink">Show on lock screen</span>
            <span className="block text-xs text-muted mt-0.5">A notification with − and + while Thistle is in the background. Replaces any other counter shown there.</span>
          </span>
          <span className={`w-11 h-6 rounded-full p-0.5 shrink-0 transition-colors ${draft.pinned ? "bg-brand" : "bg-surface-2"}`}>
            <span className={`block w-5 h-5 rounded-full bg-bg shadow transition-transform ${draft.pinned ? "translate-x-5" : ""}`} />
          </span>
        </button>
      )}

      {error && (
        <p className="mt-3 rounded-xl bg-work-soft text-work-ink text-sm px-3.5 py-2.5" role="alert" data-testid="counter-editor-error">
          {error}
        </p>
      )}
    </Modal>
  );
}

export { CounterEditorModal };
