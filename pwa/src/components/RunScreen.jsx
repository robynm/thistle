// Full-screen workout view. The background takes the color of the current step's kind
// so you can tell work from rest across the room.
//
// When the timer reaches the end it reports the run straight away via onFinish and
// shows a summary. Stopping early (× or the device Back button) confirms first, then
// reports a partial run.
import { useMemo, useState } from "react";
import { KIND_LABEL, KIND_TONE } from "../lib/constants.js";
import { useBackButton } from "../lib/backNav.js";
import { fmtClock, fmtShort } from "../lib/format.js";
import { useBodyScrollLock, useWakeLock } from "../lib/hooks.js";
import { I } from "../lib/icons.jsx";
import { useRunner } from "../lib/runner.js";
import { flatten } from "../lib/timerModel.js";

const ctrl = "rounded-full bg-white/20 text-white flex items-center justify-center active:scale-90 transition-transform";

function RunScreen({ timer, soundOn, onToggleSound, onFinish, onClose }) {
  useBodyScrollLock();
  const segments = useMemo(() => flatten(timer), [timer]);
  const [summary, setSummary] = useState(null);

  const run = useRunner(segments, {
    soundOn,
    onDone: (result) => {
      setSummary(result);
      onFinish(result);
    },
  });
  useWakeLock(!run.done);

  const requestClose = () => {
    if (run.done) {
      onClose();
      return true;
    }
    if (!confirm("Stop this workout? What you've done so far is saved to History.")) return false;
    onFinish(run.result());
    onClose();
    return true;
  };
  useBackButton(true, requestClose);

  const seg = segments[run.index];
  const next = segments[run.index + 1];
  const tone = run.done ? "leaf" : KIND_TONE[seg.kind];
  const progress = run.totalMs ? run.posMs / run.totalMs : 0;
  const stepProgress = seg ? 1 - run.remainingMs / (seg.seconds * 1000) : 1;

  return (
    <div
      className={`fixed inset-0 z-50 bg-${tone}-500 text-white flex flex-col transition-colors duration-300`}
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      data-testid="run-screen"
      data-kind={run.done ? "done" : seg.kind}
    >
      <div className="flex items-center gap-3 px-4 h-16 shrink-0">
        <button type="button" onClick={requestClose} aria-label={run.done ? "Close" : "Stop"} data-testid="run-stop" className={`${ctrl} w-10 h-10`}>
          <I.x size={18} />
        </button>
        <p className="flex-1 text-center font-display font-bold text-lg truncate" data-testid="run-title">{timer.name || "Untitled timer"}</p>
        <button
          type="button"
          onClick={onToggleSound}
          aria-label={soundOn ? "Mute" : "Unmute"}
          aria-pressed={!soundOn}
          data-testid="run-sound"
          className={`${ctrl} w-10 h-10`}
        >
          {soundOn ? <I.volume size={18} /> : <I.volumeOff size={18} />}
        </button>
      </div>

      {run.done ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center" data-testid="run-done">
          <span className="w-24 h-24 rounded-full bg-white text-leaf-500 flex items-center justify-center bloom shadow-2xl">
            <I.check size={48} strokeWidth={3} />
          </span>
          <h2 className="font-display font-bold text-4xl tracking-tight mt-6">Nice work!</h2>
          <p className="text-white/85 mt-2" data-testid="run-done-time">
            {fmtShort(summary?.elapsedSec ?? 0)} of {timer.name || "your timer"}, all done.
          </p>
          <button
            type="button"
            onClick={onClose}
            data-testid="run-done-close"
            className="mt-8 bg-white text-leaf-500 rounded-full px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] shadow-pop active:scale-95 transition-transform"
          >
            Done
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center min-h-0">
            <span className="px-3 py-1 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-[0.25em]" data-testid="run-kind">
              {run.paused ? "Paused" : KIND_LABEL[seg.kind]}
            </span>
            <h2 className="font-display font-bold text-4xl sm:text-5xl tracking-tight mt-4 max-w-full truncate" data-testid="run-step-name">
              {seg.name}
            </h2>
            <p
              className={`font-display font-bold tabular leading-none mt-4 transition-opacity ${run.paused ? "opacity-50" : ""}`}
              style={{ fontSize: "min(32vw, 30vh)" }}
              data-testid="run-remaining"
            >
              {fmtClock(Math.ceil(run.remainingMs / 1000))}
            </p>
            <div className="w-full max-w-xs h-1.5 rounded-full bg-white/25 mt-4 overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${stepProgress * 100}%` }} />
            </div>
            {seg.kind !== "ready" && seg.reps > 1 && (
              <p className="mt-4 text-sm font-bold text-white/90" data-testid="run-round">
                Round {seg.rep} of {seg.reps}
                {seg.blockName && <span className="text-white/70"> · {seg.blockName}</span>}
              </p>
            )}
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/75" data-testid="run-next">
              {next ? `Next: ${next.name} ${fmtClock(next.seconds)}` : "Last one!"}
            </p>
          </div>

          <div className="px-6 pb-6 shrink-0">
            <div className="h-1 rounded-full bg-white/25 overflow-hidden">
              <div className="h-full bg-white/80" style={{ width: `${progress * 100}%` }} data-testid="run-progress" />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/75 tabular">
              <span>{fmtClock(run.posMs / 1000)}</span>
              <span>−{fmtClock((run.totalMs - run.posMs) / 1000)}</span>
            </div>
            <div className="flex items-center justify-center gap-6 mt-5">
              <button type="button" onClick={run.back} aria-label="Back" data-testid="run-back" className={`${ctrl} w-14 h-14`}>
                <I.skipBack size={22} />
              </button>
              <button
                type="button"
                onClick={run.togglePause}
                aria-label={run.paused ? "Resume" : "Pause"}
                data-testid="run-pause"
                className={`w-20 h-20 rounded-full bg-white text-${tone}-500 flex items-center justify-center shadow-2xl active:scale-95 transition-transform`}
              >
                {run.paused ? <I.play size={32} className="ml-1" /> : <I.pause size={30} />}
              </button>
              <button type="button" onClick={run.skip} aria-label="Skip" data-testid="run-skip" className={`${ctrl} w-14 h-14`}>
                <I.skipForward size={22} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export { RunScreen };
