// Full-screen workout view. It follows the page theme. The current step's color shows
// in the label, the countdown ring and the pause button, so work and rest look
// different at a glance.
//
// When the timer reaches the end it reports the run straight away via onFinish and
// shows a summary. Stopping early with × or the device Back button confirms first;
// holding the background for HOLD_TO_EXIT_MS exits without asking. Both report a
// partial run. `exit` in the result says which way it ended.
import { useEffect, useMemo, useRef, useState } from "react";
import { HOLD_TO_EXIT_MS, KIND_LABEL } from "../lib/constants.js";
import { useBackButton } from "../lib/backNav.js";
import { fmtClock, fmtShort } from "../lib/format.js";
import { useBodyScrollLock, useWakeLock } from "../lib/hooks.js";
import { I } from "../lib/icons.jsx";
import { useLockScreen } from "../lib/lockScreen.js";
import { useRunner } from "../lib/runner.js";
import { flatten } from "../lib/timerModel.js";
import { ui } from "../lib/ui.js";

const R = 92;
const CIRC = 2 * Math.PI * R;

// The ring empties as the step runs down.
function Ring({ kind, fraction, children }) {
  return (
    <div className="relative aspect-square" style={{ width: "min(78vw, 44vh, 340px)" }}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="100" cy="100" r={R} fill="none" className="stroke-surface" strokeWidth="7" />
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          className={`stroke-${kind}`}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - fraction)}
          style={{ transition: "stroke-dashoffset .1s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

function RunScreen({ timer, soundOn, lockMode, onToggleSound, onFinish, onClose }) {
  useBodyScrollLock();
  const segments = useMemo(() => flatten(timer), [timer]);
  const [summary, setSummary] = useState(null);

  const run = useRunner(segments, {
    soundOn,
    onDone: (result) => {
      setSummary(result);
      onFinish({ ...result, exit: "done" });
    },
  });
  useWakeLock(!run.done);
  useLockScreen(lockMode, timer, run);

  const exit = (how) => {
    onFinish({ ...run.result(), exit: how });
    onClose();
  };

  const requestClose = () => {
    if (run.done) {
      onClose();
      return true;
    }
    if (!confirm("Stop this workout? What you've done so far is saved to History.")) return false;
    exit("stop");
    return true;
  };
  useBackButton(true, requestClose);

  // --- Hold to exit -------------------------------------------
  // Only presses on the background count, not on buttons. Moving more than a few
  // pixels (a scroll or swipe) or lifting early cancels.
  const [holding, setHolding] = useState(false);
  const hold = useRef(null);
  const cancelHold = () => {
    if (!hold.current) return;
    clearTimeout(hold.current.timer);
    hold.current = null;
    setHolding(false);
  };
  const startHold = (e) => {
    if (run.done || e.button > 0 || e.target.closest("button")) return;
    cancelHold();
    hold.current = {
      x: e.clientX,
      y: e.clientY,
      timer: setTimeout(() => {
        hold.current = null;
        setHolding(false);
        exit("hold");
      }, HOLD_TO_EXIT_MS),
    };
    setHolding(true);
  };
  const moveHold = (e) => {
    const h = hold.current;
    if (h && Math.hypot(e.clientX - h.x, e.clientY - h.y) > 12) cancelHold();
  };
  useEffect(() => () => clearTimeout(hold.current?.timer), []);

  const seg = segments[run.index];
  const next = segments[run.index + 1];
  const kind = seg.kind;
  const progress = run.totalMs ? run.posMs / run.totalMs : 0;
  const stepLeft = run.remainingMs / (seg.seconds * 1000);

  return (
    <div
      className="fixed inset-0 z-50 bg-bg text-ink flex flex-col select-none"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)", WebkitTouchCallout: "none" }}
      data-testid="run-screen"
      data-kind={run.done ? "done" : kind}
      onPointerDown={startHold}
      onPointerMove={moveHold}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
      onPointerLeave={cancelHold}
      onContextMenu={(e) => e.preventDefault()}
    >
      {holding && (
        <div className="absolute inset-x-0 top-0 z-10 flex justify-center pointer-events-none" style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }} data-testid="run-hold">
          <div className="rounded-full bg-brand-soft text-sm font-medium px-4 py-2 overflow-hidden relative shadow-lg">
            <span className="absolute inset-0 bg-brand hold-fill" style={{ animationDuration: `${HOLD_TO_EXIT_MS}ms` }} />
            <span className="relative text-on-brand">Keep holding to exit</span>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 px-4 h-14 shrink-0">
        <button type="button" onClick={requestClose} aria-label={run.done ? "Close" : "Stop"} data-testid="run-stop" className={`${ui.icon} w-10 h-10`}>
          <I.x size={18} />
        </button>
        <p className="flex-1 text-center text-sm font-medium text-muted truncate" data-testid="run-title">{timer.name || "Untitled timer"}</p>
        <button
          type="button"
          onClick={onToggleSound}
          aria-label={soundOn ? "Mute" : "Unmute"}
          aria-pressed={!soundOn}
          data-testid="run-sound"
          className={`${ui.icon} w-10 h-10`}
        >
          {soundOn ? <I.volume size={18} /> : <I.volumeOff size={18} />}
        </button>
      </div>

      {run.done ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center" data-testid="run-done">
          <span className="w-20 h-20 rounded-full bg-rest text-on-brand flex items-center justify-center pop">
            <I.check size={40} strokeWidth={2.75} />
          </span>
          <h2 className="font-display font-bold text-3xl tracking-tight mt-6">Nice work!</h2>
          <p className="text-muted mt-1.5" data-testid="run-done-time">
            {fmtShort(summary?.elapsedSec ?? 0)} of {timer.name || "your timer"}, all done.
          </p>
          <button type="button" onClick={onClose} data-testid="run-done-close" className={`${ui.primary} mt-8 px-10 py-3.5 text-base`}>
            Done
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center min-h-0 gap-5">
            <div>
              <p className={`text-sm font-semibold uppercase tracking-[0.14em] text-${kind}-ink`} data-testid="run-kind">
                {run.paused ? "Paused" : KIND_LABEL[kind]}
              </p>
              <h2 className="font-display font-bold text-3xl tracking-tight mt-1 max-w-[85vw] truncate" data-testid="run-step-name">
                {seg.name}
              </h2>
            </div>
            <Ring kind={kind} fraction={stepLeft}>
              <p
                className={`font-display font-bold tabular tracking-tight leading-none transition-opacity ${run.paused ? "opacity-40" : ""}`}
                style={{ fontSize: "min(20vw, 11vh, 88px)" }}
                data-testid="run-remaining"
              >
                {fmtClock(Math.ceil(run.remainingMs / 1000))}
              </p>
              {kind !== "ready" && seg.reps > 1 && (
                <p className="text-sm text-muted mt-2" data-testid="run-round">
                  Round {seg.rep} of {seg.reps}
                  {seg.blockName && <> · {seg.blockName}</>}
                </p>
              )}
            </Ring>
            <p className="text-sm text-muted" data-testid="run-next">
              {next ? (
                <>
                  Next: <span className="text-ink font-medium">{next.name}</span> {fmtClock(next.seconds)}
                </>
              ) : (
                "Last one!"
              )}
            </p>
          </div>

          <div className="px-6 pb-6 shrink-0 max-w-md w-full mx-auto">
            <div className="h-1 rounded-full bg-surface overflow-hidden">
              <div className="h-full bg-ink/70 rounded-full" style={{ width: `${progress * 100}%` }} data-testid="run-progress" />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-muted tabular">
              <span>{fmtClock(run.posMs / 1000)}</span>
              <span>−{fmtClock((run.totalMs - run.posMs) / 1000)}</span>
            </div>
            <div className="flex items-center justify-center gap-8 mt-4">
              <button type="button" onClick={run.back} aria-label="Back" data-testid="run-back" className={`${ui.icon} w-14 h-14`}>
                <I.skipBack size={20} />
              </button>
              <button
                type="button"
                onClick={run.togglePause}
                aria-label={run.paused ? "Resume" : "Pause"}
                data-testid="run-pause"
                className={`w-20 h-20 rounded-full bg-${kind} text-on-brand flex items-center justify-center active:scale-95 transition`}
              >
                {run.paused ? <I.play size={28} className="ml-1" /> : <I.pause size={28} />}
              </button>
              <button type="button" onClick={run.skip} aria-label="Skip" data-testid="run-skip" className={`${ui.icon} w-14 h-14`}>
                <I.skipForward size={20} />
              </button>
            </div>
            <p className="text-center text-xs text-faint mt-4">Hold anywhere to exit</p>
          </div>
        </>
      )}
    </div>
  );
}

export { RunScreen };
