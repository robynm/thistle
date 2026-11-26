import { useState } from "react";
import { useBackButton } from "../lib/backNav.js";
import { I } from "../lib/icons.jsx";
import { ui } from "../lib/ui.js";

// Shows the current view's title. `action` is that view's one header button, if any.
function AppHeader({ title, subtitle, action, theme, onToggleTheme, onOpenBackup, onOpenLockScreen }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  useBackButton(menuOpen, closeMenu);

  const nextTheme = theme === "dusk" ? { label: "Light theme", Icon: I.sun } : { label: "Dark theme", Icon: I.moon };
  const row = "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-ink active:bg-surface text-left";

  return (
    <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-display font-bold text-[28px] tracking-tight leading-tight text-ink" data-testid="view-title">{title}</h1>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
        {action}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            data-testid="menu-button"
            className={`${ui.icon} w-9 h-9 bg-transparent`}
          >
            <I.more size={20} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={closeMenu} />
              <div className="absolute right-0 top-full mt-1 z-50 bg-bg rounded-2xl shadow-[0_12px_32px_-12px_rgba(0,0,0,0.25)] ring-1 ring-line min-w-[200px] overflow-hidden py-1 fade-up" data-testid="menu">
                <button type="button" className={row} data-testid="menu-theme" onClick={() => { closeMenu(); onToggleTheme(); }}>
                  <nextTheme.Icon size={16} /> {nextTheme.label}
                </button>
                <button type="button" className={row} data-testid="menu-lockscreen" onClick={() => { closeMenu(); onOpenLockScreen(); }}>
                  <I.smartphone size={16} /> Lock screen
                </button>
                <button type="button" className={row} data-testid="menu-backup" onClick={() => { closeMenu(); onOpenBackup(); }}>
                  <I.download size={16} /> Backup &amp; restore
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export { AppHeader };
