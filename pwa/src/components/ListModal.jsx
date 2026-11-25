// Create, rename or delete a list. Deleting moves its timers to the top level.
import { useState } from "react";
import { ui } from "../lib/ui.js";
import { Modal } from "./Modal.jsx";

function ListModal({ list, isNew, onSave, onDelete, onClose }) {
  const [name, setName] = useState(list.name);
  const [error, setError] = useState("");

  const save = (e) => {
    e?.preventDefault();
    if (!name.trim()) {
      setError("Give the list a name.");
      return;
    }
    onSave({ ...list, name: name.trim() });
  };

  const footer = (
    <div className="flex gap-2">
      {!isNew && (
        <button type="button" onClick={onDelete} data-testid="list-delete" className={ui.secondary}>
          Delete list
        </button>
      )}
      <span className="flex-1" />
      <button type="button" onClick={save} data-testid="list-save" className={`${ui.primary} px-6`}>
        Save
      </button>
    </div>
  );

  return (
    <Modal name="list" title={isNew ? "New list" : "Edit list"} blurb="Group timers into lists to keep them tidy." onClose={onClose} footer={footer}>
      <form onSubmit={save}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name, e.g. Legs"
          aria-label="List name"
          maxLength={40}
          autoFocus
          data-testid="list-name-input"
          className={`${ui.input} w-full font-semibold`}
        />
      </form>
      {error && (
        <p className="mt-3 rounded-xl bg-work-soft text-work-ink text-sm px-3.5 py-2.5" data-testid="list-error">
          {error}
        </p>
      )}
    </Modal>
  );
}

export { ListModal };
