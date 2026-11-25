// The thistle glyph on a sunflower circle. Same paths as /thistle-mark.svg at the repo root.
function BrandMark({ size = 36, className = "" }) {
  return (
    <div className={`rounded-full bg-brand text-on-brand flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 9.6V3.2M12 9.6 9 4.2M12 9.6l3-5.4M12 9.6 7.2 6.2M12 9.6l4.8-3.4" />
        <ellipse cx="12" cy="12.4" rx="3.4" ry="2.9" />
        <path d="M10 11.2l4 2.4M14 11.2l-4 2.4M12 15.3V21.5" />
        <path d="M12 19.2c-2.6 0-4.4-1.4-5-3.6 2.4-.2 4.2.8 5 3.6Z" />
        <path d="M12 18c2.6 0 4.4-1.4 5-3.6-2.4-.2-4.2.8-5 3.6Z" />
      </svg>
    </div>
  );
}

export { BrandMark };
