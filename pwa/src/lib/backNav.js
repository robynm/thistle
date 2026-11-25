// Makes the device Back button close the top-most overlay instead of leaving the app.
//
// While overlays are open we keep one throwaway history entry per overlay. Back pops
// one entry and closes the top overlay. When an overlay closes some other way (its ×
// button), we remove its entry ourselves and ignore the popstate that causes.
//
// Opening and closing often happen in the same render (a menu closes as the modal it
// launched opens), so history is reconciled once after the render, not per overlay.
//
// An overlay's onClose may return `false` to stay open (e.g. the user cancels a
// confirm); its history entry is then put back.
import { useEffect, useRef } from "react";

const stack = [];
let pushed = 0;
let ignorePops = 0;
let scheduled = false;

function reconcile() {
  scheduled = false;
  const want = stack.length;
  try {
    if (pushed < want) {
      while (pushed < want) {
        history.pushState({ thistleOverlay: pushed + 1 }, "");
        pushed++;
      }
    } else if (pushed > want) {
      const n = pushed - want;
      pushed = want;
      ignorePops++;
      history.go(-n);
    }
  } catch { /* history API unavailable */ }
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  setTimeout(reconcile, 0);
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    if (ignorePops) {
      ignorePops--;
      return;
    }
    if (pushed === 0) return;
    pushed--;
    const top = stack[stack.length - 1];
    if (top && top.close() === false) schedule();
  });
}

export function useBackButton(open, onClose) {
  const ref = useRef(onClose);
  ref.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const entry = { close: () => ref.current() };
    stack.push(entry);
    schedule();
    return () => {
      const i = stack.indexOf(entry);
      if (i >= 0) stack.splice(i, 1);
      schedule();
    };
  }, [open]);
}
