import { useState } from "react";
import { useBackButton } from "../lib/backNav.js";
import { I } from "../lib/icons.jsx";
import { BrandMark } from "./BrandMark.jsx";

// `action` is the current view's one header button, if it has one.
function AppHeader({ action, theme, onToggleTheme, onOpenBackup }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  useBackButton(menuOpen, closeMenu);

  const nextTheme = theme === "dusk" ? { label: "Switch to Thistle", Icon: I.sun } : { label: "Switch to Dusk", Icon: I.moon };
  const row = "w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-ink-700 active:bg-cream-50 text-left";

  return (
    <header className="sticky top-0 z-30 bg-card border-b-2 border-cream-100 shadow-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
        <BrandMark size={36} className="bloom" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-ink-900 leading-none">Thistle</h1>
          <p className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.25em] text-ink-400 mt-1">Work, rest, repeat</p>
        </div>
        {action}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            data-testid="menu-button"
            className="w-9 h-9 rounded-full bg-cream-50 border-2 border-cream-100 text-ink-600 flex items-center justify-center active:scale-90 transition-transform"
          >
            <I.more size={18} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={closeMenu} />
              <div className="absolute right-0 top-full mt-2 z-50 bg-card rounded-2xl shadow-card-hi border-2 border-cream-100 min-w-[200px] overflow-hidden fade-up" data-testid="menu">
                <button type="button" className={row} data-testid="menu-theme" onClick={() => { closeMenu(); onToggleTheme(); }}>
                  <nextTheme.Icon size={15} /> {nextTheme.label}
                </button>
                <div className="h-px bg-cream-100 mx-4" />
                <button type="button" className={row} data-testid="menu-backup" onClick={() => { closeMenu(); onOpenBackup(); }}>
                  <I.download size={15} /> Backup &amp; restore
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
