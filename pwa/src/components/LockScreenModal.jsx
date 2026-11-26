// Picks how a run can be controlled while the phone is locked. See lib/lockScreen.js
// for what each mode does and why each has its trade-off.
import { useState } from "react";
import { mediaSupported, notifySupported, requestNotifyPermission } from "../lib/lockScreen.js";
import { Modal } from "./Modal.jsx";

const OPTIONS = [
  { id: "off", title: "Off", text: "Nothing on the lock screen.", supported: () => true },
  {
    id: "notify",
    title: "Notification",
    text: "Pause and Skip buttons in a notification, with when the step ends. Your music keeps playing.",
    supported: notifySupported,
  },
  {
    id: "media",
    title: "Media controls",
    text: "Pause, Skip and a live countdown on the lock screen. Pauses any music you're playing.",
    supported: mediaSupported,
  },
];

function LockScreenModal({ mode, onChange, onClose }) {
  const [error, setError] = useState(null);

  const pick = async (id) => {
    setError(null);
    if (id === "notify" && !(await requestNotifyPermission())) {
      setError("Notifications are blocked for Thistle. Allow them in your browser's site settings, then try again.");
      return;
    }
    onChange(id);
  };

  return (
    <Modal name="lockscreen" title="Lock screen" blurb="Control a running timer without unlocking your phone." onClose={onClose}>
      <div role="radiogroup" aria-label="Lock screen controls" className="flex flex-col gap-2">
        {OPTIONS.map((o) => {
          const ok = o.supported();
          const active = mode === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={!ok}
              onClick={() => pick(o.id)}
              data-testid={`lockscreen-${o.id}`}
              className={`text-left rounded-2xl px-4 py-3 transition disabled:opacity-40 ${active ? "bg-brand-soft ring-2 ring-brand" : "bg-surface active:bg-surface-2"}`}
            >
              <span className={`block text-sm font-semibold ${active ? "text-on-brand" : "text-ink"}`}>{o.title}</span>
              <span className={`block text-xs mt-0.5 ${active ? "text-on-brand/75" : "text-muted"}`}>{ok ? o.text : "Not available in this browser."}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-work-ink mt-3" role="alert" data-testid="lockscreen-error">{error}</p>}
      {notifySupported() && (
        <p className="text-xs text-muted mt-4 px-1">
          This setting is for running timers. To keep a counter on the lock screen, open it and turn on Show on lock screen.
        </p>
      )}
    </Modal>
  );
}

export { LockScreenModal };
