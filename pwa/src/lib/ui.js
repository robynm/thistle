// Shared class strings for the few control styles used across the app, so buttons and
// inputs look the same everywhere. Components add sizing or layout on top.

export const ui = {
  // Main action on a screen: sunflower fill, dark text.
  primary:
    "inline-flex items-center justify-center gap-1.5 rounded-full bg-brand text-on-brand font-semibold text-sm px-4 py-2.5 active:scale-[0.97] transition-transform disabled:opacity-40",
  // Everything else: grey block.
  secondary:
    "inline-flex items-center justify-center gap-1.5 rounded-full bg-surface text-ink font-semibold text-sm px-4 py-2.5 active:bg-surface-2 active:scale-[0.97] transition disabled:opacity-40",
  // Round icon-only button. Add a size (w-9 h-9 etc.).
  icon:
    "inline-flex items-center justify-center rounded-full bg-surface text-ink active:bg-surface-2 active:scale-95 transition disabled:opacity-30 shrink-0",
  input:
    "rounded-xl bg-surface text-ink placeholder:text-faint px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brand",
  label: "text-xs font-medium text-muted",
};
