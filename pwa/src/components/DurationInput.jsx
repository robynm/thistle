// A duration in m:ss with −/+ buttons (5 seconds a tap). The text field also accepts
// a plain number of seconds; unreadable input reverts when the field loses focus.
import { useEffect, useState } from "react";
import { MAX_STEP_SECONDS } from "../lib/constants.js";
import { fmtClock, parseClock } from "../lib/format.js";
import { I } from "../lib/icons.jsx";
import { ui } from "../lib/ui.js";

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

  return (
    <div className="flex items-center gap-1">
      <button type="button" className={`${ui.icon} w-9 h-9 bg-bg`} onClick={down} disabled={seconds <= min} aria-label={`Shorter ${label}`} data-testid={`${testId}-minus`}>
        <I.minus size={14} />
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
        className="w-16 text-center rounded-lg bg-transparent py-1.5 font-semibold text-ink tabular outline-none focus:bg-bg focus:ring-2 focus:ring-brand"
      />
      <button type="button" className={`${ui.icon} w-9 h-9 bg-bg`} onClick={up} disabled={seconds >= MAX_STEP_SECONDS} aria-label={`Longer ${label}`} data-testid={`${testId}-plus`}>
        <I.plus size={14} />
      </button>
    </div>
  );
}

export { DurationInput };
