// Drag-to-reorder for vertical lists. Drag starts only from a grip handle, so taps,
// scrolling and long-presses elsewhere keep working. Works with touch, mouse and pen
// (pointer events), and with ArrowUp/ArrowDown while the grip has focus.
//
// Items are the elements under `containerRef` that match `selector`; each carries
// `data-sort-key`. While dragging, items are moved with CSS transforms only (React
// doesn't re-render per frame). On release, `onDrop({ key, to, keys })` is called:
// `keys` is the item order when the drag began, and `to` is the dragged item's new
// index in that list once the dragged item is taken out.
//
// Measuring waits for the first animation frame, so `onStart` can change the layout
// (e.g. collapse sections) before positions are read. The dragged item's position is
// always worked out from the pointer, so layout shifts and scrolling don't throw it off.
import { useRef } from "react";
import { flushSync } from "react-dom";

const EDGE = 72; // px from a scroll edge where auto-scroll starts
const MAX_SPEED = 16; // px per frame
const BOTTOM_CHROME = 80; // fixed bottom nav covers this much of the window

function scrollParent(el) {
  for (let p = el?.parentElement; p; p = p.parentElement) {
    const oy = getComputedStyle(p).overflowY;
    if (oy === "auto" || oy === "scroll") return p;
  }
  return null;
}

export function useSortable({ containerRef, selector, onDrop, onStart, onEnd }) {
  const drag = useRef(null);
  const cb = useRef({});
  cb.current = { onDrop, onStart, onEnd };

  const items = () => (containerRef.current ? [...containerRef.current.querySelectorAll(selector)] : []);
  const scrollY = (sc) => (sc ? sc.scrollTop : window.scrollY);

  function measure(d) {
    d.els = items();
    d.keys = d.els.map((e) => e.dataset.sortKey);
    d.from = d.keys.indexOf(d.key);
    d.rects = d.els.map((e) => e.getBoundingClientRect());
    d.scroll0 = scrollY(d.scroller);
    const next = d.rects[d.from + 1] || null;
    const prev = d.rects[d.from - 1] || null;
    const gap = next ? next.top - d.rects[d.from].bottom : prev ? d.rects[d.from].top - prev.bottom : 0;
    d.shift = d.rects[d.from].height + Math.max(0, gap);
    d.measured = true;
  }

  // Positions every item for the current pointer and returns the drop index.
  function layout(d) {
    const ds = scrollY(d.scroller) - d.scroll0;
    const top = (i) => d.rects[i].top - ds;
    const dragTop = d.pointerY - d.grabOffset;
    const center = dragTop + d.rects[d.from].height / 2;
    let to = 0;
    d.els.forEach((_, i) => {
      if (i !== d.from && top(i) + d.rects[i].height / 2 < center) to++;
    });
    d.els.forEach((el, i) => {
      if (i === d.from) {
        el.style.transform = `translateY(${dragTop - top(i)}px)`;
        return;
      }
      const j = i < d.from ? i : i - 1; // index once the dragged item is removed
      let ty = 0;
      if (i < d.from && j >= to) ty = d.shift;
      if (i > d.from && j < to) ty = -d.shift;
      el.style.transform = ty ? `translateY(${ty}px)` : "";
    });
    return to;
  }

  function autoScroll(d) {
    const top = d.scroller ? d.scroller.getBoundingClientRect().top : 0;
    const bottom = d.scroller ? d.scroller.getBoundingClientRect().bottom : window.innerHeight - BOTTOM_CHROME;
    let v = 0;
    if (d.pointerY < top + EDGE) v = -MAX_SPEED * Math.min(1, (top + EDGE - d.pointerY) / EDGE);
    else if (d.pointerY > bottom - EDGE) v = MAX_SPEED * Math.min(1, (d.pointerY - bottom + EDGE) / EDGE);
    if (!v) return;
    if (d.scroller) d.scroller.scrollTop += v;
    else window.scrollBy(0, v);
  }

  function frame() {
    const d = drag.current;
    if (!d) return;
    if (!d.measured) {
      measure(d);
      const el = d.els[d.from];
      if (el) {
        el.dataset.dragging = "true";
        el.style.position = "relative";
        el.style.zIndex = "20";
        el.style.transition = "none";
      }
      d.els.forEach((e, i) => {
        if (i !== d.from) e.style.transition = "transform .15s ease";
      });
    }
    autoScroll(d);
    layout(d);
    d.raf = requestAnimationFrame(frame);
  }

  function finish(commit) {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    cancelAnimationFrame(d.raf);
    window.removeEventListener("pointermove", d.move);
    window.removeEventListener("pointerup", d.up);
    window.removeEventListener("pointercancel", d.cancel);
    if (!d.measured) measure(d);
    const to = d.from >= 0 ? layout(d) : d.from;
    // Re-render in the new order before clearing transforms, so nothing jumps back.
    flushSync(() => {
      if (commit && d.from >= 0 && to !== d.from) cb.current.onDrop?.({ key: d.key, to, keys: d.keys });
      cb.current.onEnd?.(d.key);
    });
    d.els.forEach((el) => {
      el.style.transform = "";
      el.style.transition = "";
      el.style.position = "";
      el.style.zIndex = "";
      delete el.dataset.dragging;
    });
  }

  function onPointerDown(e) {
    if (e.button > 0 || drag.current) return;
    const item = e.currentTarget.closest(selector);
    if (!item) return;
    e.preventDefault();
    const d = {
      key: item.dataset.sortKey,
      pointerY: e.clientY,
      grabOffset: e.clientY - item.getBoundingClientRect().top,
      scroller: scrollParent(containerRef.current),
      measured: false,
    };
    d.move = (ev) => { d.pointerY = ev.clientY; };
    d.up = () => finish(true);
    d.cancel = () => finish(false);
    window.addEventListener("pointermove", d.move);
    window.addEventListener("pointerup", d.up);
    window.addEventListener("pointercancel", d.cancel);
    drag.current = d;
    cb.current.onStart?.(d.key);
    d.raf = requestAnimationFrame(frame);
  }

  function onKeyDown(e) {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    const item = e.currentTarget.closest(selector);
    if (!item) return;
    e.preventDefault();
    const keys = items().map((el) => el.dataset.sortKey);
    const from = keys.indexOf(item.dataset.sortKey);
    const to = e.key === "ArrowUp" ? from - 1 : from + 1;
    if (to < 0 || to >= keys.length) return;
    cb.current.onDrop?.({ key: item.dataset.sortKey, to, keys });
    // Keep focus on the grip of the item that moved.
    const grip = e.currentTarget;
    requestAnimationFrame(() => grip.isConnected && grip.focus());
  }

  return {
    handleProps: { onPointerDown, onKeyDown, style: { touchAction: "none" } },
  };
}
