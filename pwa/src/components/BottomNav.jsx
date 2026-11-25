import { I } from "../lib/icons.jsx";

const TABS = [
  { id: "timers", label: "Timers", Icon: I.timer, tone: "thistle" },
  { id: "quick", label: "Quick start", Icon: I.zap, tone: "petal" },
  { id: "history", label: "History", Icon: I.history, tone: "plum" },
];

function BottomNav({ view, onChange }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-card border-t-2 border-cream-100 shadow-card-hi"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-md mx-auto grid grid-cols-3 h-16">
        {TABS.map(({ id, label, Icon, tone }) => {
          const active = view === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              data-testid={`nav-${id}`}
              className="flex items-center justify-center active:scale-95 transition-transform"
            >
              <span className={`flex items-center justify-center rounded-full px-3 py-1 transition-colors ${active ? `bg-${tone}-50` : ""}`}>
                <span className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${active ? `bg-${tone}-500 text-white shadow-pop` : "text-ink-400"}`}>
                  <Icon size={20} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export { BottomNav, TABS };
