// Slim strip above the header when the browser can install the app and the splash
// was dismissed. Hiding it lasts for this session only.
import { I } from "../lib/icons.jsx";

function InstallBanner({ onInstall, onDismiss }) {
  return (
    <div className="bg-brand text-on-brand" style={{ paddingTop: "env(safe-area-inset-top)" }} data-testid="install-banner">
      <div className="max-w-3xl mx-auto px-4 py-2 flex items-center gap-3 text-sm">
        <span className="flex-1">Install Thistle for a full-screen timer.</span>
        <button type="button" onClick={onInstall} className="px-3 py-1 rounded-full bg-on-brand text-brand text-sm font-semibold active:scale-95" data-testid="install-banner-install">
          Install
        </button>
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90" data-testid="install-banner-dismiss">
          <I.x size={16} />
        </button>
      </div>
    </div>
  );
}

export { InstallBanner };
