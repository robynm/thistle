// Shared shell for every modal: a bottom sheet on phones, a centered dialog from `sm` up.
// Locks body scroll and makes the device Back button close it.
import { useBackButton } from "../lib/backNav.js";
import { useBodyScrollLock } from "../lib/hooks.js";
import { I } from "../lib/icons.jsx";

function Modal({ name, eyebrow, eyebrowIcon: EyebrowIcon, title, blurb, onClose, children, wide = false }) {
  useBodyScrollLock();
  useBackButton(true, onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid={`${name}-modal`}
        className={`relative bg-card w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"} max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl fade-up`}
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          data-testid={`${name}-close`}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-cream-50 border-2 border-cream-100 text-ink-600 flex items-center justify-center active:scale-90 transition-transform"
        >
          <I.x size={16} />
        </button>
        {eyebrow && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-thistle-50 rounded-full text-thistle-700 text-[10px] font-bold uppercase tracking-[0.2em]">
            {EyebrowIcon && <EyebrowIcon size={12} />}
            {eyebrow}
          </div>
        )}
        <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-ink-900 mt-3 pr-10">{title}</h2>
        {blurb && <p className="text-sm text-ink-600 mt-1.5">{blurb}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export { Modal };
