// A duration in m:ss with −/+ buttons (5 seconds a tap). The text field also accepts
// a plain number of seconds; unreadable input reverts when the field loses focus.
import { useEffect, useState } from "react";
import { MAX_STEP_SECONDS } from "../lib/constants.js";
import { fmtClock, parseClock } from "../lib/format.js";
import { I } from "../lib/icons.jsx";

const STEP = 5;

function DurationInput({ seconds, onChange, label, testId, min = 0 }) {
  const [text, setText] = useState(fmtClock(seconds));
  useEffect(() => setText(fmtClock(seconds)), [seconds]);

  const set = (v) => onChange(Math.min(MAX_STEP_SECONDS, Math.max(min, v)));
  const commit = () => {
    const v = parseClock(text);
    if (v === null) setText(fmtClock(seconds));
    else set(v);
  };
  // Snap to the nearest multiple of STEP, so 0:42 goes to 0:40 / 0:45.
  const down = () => set(seconds % STEP ? seconds - (seconds % STEP) : seconds - STEP);
  const up = () => set(seconds - (seconds % STEP) + STEP);

  const btn = "w-8 h-8 rounded-full bg-cream-50 border-2 border-cream-100 text-ink-600 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40 shrink-0";
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" className={btn} onClick={down} disabled={seconds <= min} aria-label={`Shorter ${label}`} data-testid={`${testId}-minus`}>
        <I.minus size={12} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        aria-label={label}
        data-testid={testId}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        onFocus={(e) => e.currentTarget.select()}
        className="w-16 text-center rounded-full border-2 border-cream-100 bg-cream-50 py-1 font-bold text-ink-900 tabular focus:outline-none focus:border-thistle-500"
      />
      <button type="button" className={btn} onClick={up} disabled={seconds >= MAX_STEP_SECONDS} aria-label={`Longer ${label}`} data-testid={`${testId}-plus`}>
        <I.plus size={12} />
      </button>
    </div>
  );
}

export { DurationInput };
