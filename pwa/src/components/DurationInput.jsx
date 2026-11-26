// A duration with −/+ buttons (5 seconds a tap) and a field you type digits into.
// Digits fill from the right like a microwave: 1, 3, 0 reads 0:01, 0:13, 1:30. That
// works with a phone's number pad, which has no colon key. The last two digits are
// seconds and may be over 59 while typing ("90" saves as 1:30). Leaving the field
// without typing keeps the old value.
import { useRef, useState } from "react";
import { MAX_STEP_SECONDS } from "../lib/constants.js";
import { fmtClock } from "../lib/format.js";
import { I } from "../lib/icons.jsx";
import { ui } from "../lib/ui.js";

const STEP = 5;
const MAX_DIGITS = 4; // mm:ss

// "130" -> "1:30", "5" -> "0:05"
function showDigits(d) {
  const p = d.padStart(3, "0");
  return `${Number(p.slice(0, -2))}:${p.slice(-2)}`;
}
const digitsToSeconds = (d) => Number(d.slice(0, -2) || 0) * 60 + Number(d.slice(-2) || 0);

function DurationInput({ seconds, onChange, label, testId, min = 0 }) {
  // null when not typing; otherwise the digits typed since the field got focus.
  const [digits, setDigits] = useState(null);
  const cancelled = useRef(false);

  const set = (v) => onChange(Math.min(MAX_STEP_SECONDS, Math.max(min, v)));
  const commit = () => {
    if (digits !== null && !cancelled.current) set(digitsToSeconds(digits));
    cancelled.current = false;
    setDigits(null);
  };
  // Snap to the nearest multiple of STEP, so 0:42 goes to 0:40 / 0:45.
  const down = () => set(seconds % STEP ? seconds - (seconds % STEP) : seconds - STEP);
  const up = () => set(seconds - (seconds % STEP) + STEP);

  // Every digit in the field counts, so typing at the end appends and Backspace drops
  // the last one. The formatted text's padding zeros are leading, so they fall away.
  // The first keystroke starts over: focus selects the old value so typing replaces it,
  // and if the browser dropped that selection, only what was added after it is kept.
  const onType = (e) => {
    let raw = e.target.value;
    const shown = fmtClock(seconds);
    if (digits === null && raw.startsWith(shown)) raw = raw.slice(shown.length);
    const next = raw.replace(/\D/g, "").replace(/^0+/, "");
    if (next.length <= MAX_DIGITS) setDigits(next);
  };

  return (
    <div className="flex items-center gap-1">
      <button type="button" className={`${ui.icon} w-9 h-9 bg-bg`} onClick={down} disabled={seconds <= min} aria-label={`Shorter ${label}`} data-testid={`${testId}-minus`}>
        <I.minus size={14} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        value={digits === null ? fmtClock(seconds) : showDigits(digits)}
        aria-label={`${label}, type minutes then seconds`}
        data-testid={testId}
        onChange={onType}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            cancelled.current = true;
            e.currentTarget.blur();
          }
        }}
        onFocus={(e) => e.currentTarget.select()}
        className="w-16 text-center rounded-lg bg-transparent py-1.5 font-semibold text-ink tabular outline-none focus:bg-bg focus:ring-2 focus:ring-brand"
      />
      <button type="button" className={`${ui.icon} w-9 h-9 bg-bg`} onClick={up} disabled={seconds >= MAX_STEP_SECONDS} aria-label={`Longer ${label}`} data-testid={`${testId}-plus`}>
        <I.plus size={14} />
      </button>
    </div>
  );
}

export { DurationInput };
