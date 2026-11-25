// Shared shell for every modal: a bottom sheet on phones, a centered dialog from `sm` up.
// Locks body scroll and makes the device Back button close it.
import { useBackButton } from "../lib/backNav.js";
import { useBodyScrollLock } from "../lib/hooks.js";
import { I } from "../lib/icons.jsx";
import { ui } from "../lib/ui.js";

function Modal({ name, title, blurb, onClose, children, footer }) {
  useBodyScrollLock();
  useBackButton(true, onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid={`${name}-modal`}
        className="relative bg-bg w-full sm:max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl fade-up"
      >
        <div className="flex items-start gap-3 px-5 pt-5 pb-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-2xl tracking-tight text-ink">{title}</h2>
            {blurb && <p className="text-sm text-muted mt-1">{blurb}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" data-testid={`${name}-close`} className={`${ui.icon} w-9 h-9`}>
            <I.x size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 flex-1" style={{ paddingBottom: footer ? "1.25rem" : "max(1.25rem, env(safe-area-inset-bottom))" }}>
          {children}
        </div>
        {footer && (
          <div className="border-t border-line px-5 pt-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export { Modal };
