// Toggleable pill. `tone` is a color scale name (thistle, petal, leaf, plum, sky2).
function Chip({ tone = "thistle", active = false, onClick, children, testId, className = "" }) {
  const style = active
    ? `bg-${tone}-500 text-white border-${tone}-500 shadow-pop`
    : `bg-${tone}-50 text-${tone}-700 border-${tone}-100`;
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] border-2 rounded-full transition-all active:scale-95 ${style} ${className}`}
    >
      {children}
    </button>
  );
}

export { Chip };
