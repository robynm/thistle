// The interval-ring glyph on a sunflower circle: work and rest arcs around a play mark.
// Same paths as /thistle-mark.svg at the repo root.
function BrandMark({ size = 36, className = "" }) {
  return (
    <div className={`rounded-full bg-brand text-on-brand flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M13.17 3.68A8.4 8.4 0 0 1 17.4 18.43M15.15 19.79A8.4 8.4 0 0 1 5.38 17.17M4.11 14.87A8.4 8.4 0 0 1 9.4 4.01" />
        <path d="M10.4 9.2v5.6L15 12Z" />
      </svg>
    </div>
  );
}

export { BrandMark };
