// Slim strip above the header when the browser can install the app and the splash
// was dismissed. Hiding it lasts for this session only.
import { I } from "../lib/icons.jsx";

function InstallBanner({ onInstall, onDismiss }) {
  return (
    <div className="bg-thistle-500 text-white" style={{ paddingTop: "env(safe-area-inset-top)" }} data-testid="install-banner">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 text-sm">
        <I.smartphone size={16} />
        <span className="flex-1">Install Thistle for a full-screen timer.</span>
        <button type="button" onClick={onInstall} className="px-3 py-1 rounded-full bg-white text-thistle-500 text-[11px] font-bold uppercase tracking-[0.1em] active:scale-95" data-testid="install-banner-install">
          Install
        </button>
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center active:scale-90" data-testid="install-banner-dismiss">
          <I.x size={14} />
        </button>
      </div>
    </div>
  );
}

export { InstallBanner };
