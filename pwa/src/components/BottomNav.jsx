import { I } from "../lib/icons.jsx";

const TABS = [
  { id: "timers", label: "Timers", Icon: I.timer },
  { id: "counters", label: "Counters", Icon: I.hash },
  { id: "history", label: "History", Icon: I.history },
];

function BottomNav({ view, onChange }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-bg border-t border-line" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="max-w-md mx-auto grid grid-cols-3 pt-2 pb-2">
        {TABS.map(({ id, label, Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={active ? "page" : undefined}
              data-testid={`nav-${id}`}
              className={`flex flex-col items-center gap-1 text-[11px] active:scale-95 transition-transform ${active ? "text-ink font-semibold" : "text-muted"}`}
            >
              <span className={`w-14 h-8 rounded-full flex items-center justify-center transition-colors ${active ? "bg-brand text-on-brand" : ""}`}>
                <Icon size={20} />
              </span>
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export { BottomNav, TABS };
