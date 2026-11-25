function SectionLabel({ children, count, tone = "thistle", action }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className={`w-2 h-2 rounded-full bg-${tone}-500 shrink-0`} />
      <h2 className="font-display font-bold text-xl tracking-tight text-ink-900">{children}</h2>
      {count !== undefined && (
        <span className={`px-2 py-0.5 rounded-full bg-${tone}-50 text-${tone}-600 text-[10px] font-bold uppercase tracking-[0.1em]`}>{count}</span>
      )}
      <span className="h-px bg-cream-100 flex-1" />
      {action}
    </div>
  );
}

export { SectionLabel };
