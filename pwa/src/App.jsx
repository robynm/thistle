// Root component. Owns the current view (there is no router), every persisted
// collection, which overlays are open, and the theme. Views get data and callbacks.
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "./components/AppHeader.jsx";
import { BackupModal } from "./components/BackupModal.jsx";
import { BottomNav } from "./components/BottomNav.jsx";
import { CounterEditorModal } from "./components/CounterEditorModal.jsx";
import { CountersView } from "./components/CountersView.jsx";
import { HistoryView } from "./components/HistoryView.jsx";
import { ListModal } from "./components/ListModal.jsx";
import { LockScreenModal } from "./components/LockScreenModal.jsx";
import { InstallBanner } from "./components/InstallBanner.jsx";
import { QuickModal } from "./components/QuickModal.jsx";
import { QuickStartButton } from "./components/QuickStartButton.jsx";
import { RunScreen } from "./components/RunScreen.jsx";
import { Splash } from "./components/Splash.jsx";
import { TimerEditorModal } from "./components/TimerEditorModal.jsx";
import { TimersView } from "./components/TimersView.jsx";
import { mergeById } from "./lib/backup.js";
import { MIN_HISTORY_SECONDS, QUICK_DEFAULTS, STORAGE_KEYS } from "./lib/constants.js";
import { cleanCounter, clampCount, newCounter } from "./lib/counterModel.js";
import { useCounterLockScreen } from "./lib/counterLock.js";
import { isStandalone, useInstallPrompt } from "./lib/hooks.js";
import { plural } from "./lib/format.js";
import { LOCK_MODES, primeLockScreen } from "./lib/lockScreen.js";
import { I } from "./lib/icons.jsx";
import { Log } from "./lib/log.js";
import { unlockAudio } from "./lib/sound.js";
import { lsGet, lsSet, requestPersistence } from "./lib/storage.js";
import { ui } from "./lib/ui.js";
import { cleanHistoryEntry, cleanList, cleanTimer, groupByList, moveToList, newTimer, quickTimer, totalSeconds, uid } from "./lib/timerModel.js";
import { SEED_TIMERS } from "./seed.js";

// --- Loading --------------------------------------------------
function loadLists() {
  const raw = lsGet(STORAGE_KEYS.lists, []);
  return Array.isArray(raw) ? raw.map(cleanList).filter(Boolean) : [];
}
function loadTimers() {
  const raw = lsGet(STORAGE_KEYS.timers, null);
  if (raw === null) return SEED_TIMERS;
  const timers = Array.isArray(raw) ? raw.map(cleanTimer).filter(Boolean) : [];
  return groupByList(timers, loadLists());
}
function loadOpenLists() {
  const raw = lsGet(STORAGE_KEYS.listsOpen, []);
  return Array.isArray(raw) ? raw.filter((id) => typeof id === "string") : [];
}
function loadHistory() {
  const raw = lsGet(STORAGE_KEYS.history, []);
  return Array.isArray(raw) ? raw.map(cleanHistoryEntry).filter(Boolean) : [];
}
function loadCounterLists() {
  const raw = lsGet(STORAGE_KEYS.counterLists, []);
  return Array.isArray(raw) ? raw.map(cleanList).filter(Boolean) : [];
}
function loadCounters() {
  const raw = lsGet(STORAGE_KEYS.counters, []);
  const counters = Array.isArray(raw) ? raw.map(cleanCounter).filter(Boolean) : [];
  return groupByList(counters, loadCounterLists());
}
function loadCounterListsOpen() {
  const raw = lsGet(STORAGE_KEYS.counterListsOpen, []);
  return Array.isArray(raw) ? raw.filter((id) => typeof id === "string") : [];
}
function loadQuick() {
  const q = lsGet(STORAGE_KEYS.quick, null);
  return q && typeof q === "object" ? { ...QUICK_DEFAULTS, ...q } : QUICK_DEFAULTS;
}

const byNewest = (a, b) => (a.startedAt < b.startedAt ? 1 : a.startedAt > b.startedAt ? -1 : 0);

// New ids throughout, so the copy and the original never share a block or step id.
const copyTimer = (t) => ({
  ...structuredClone(t),
  id: uid("t"),
  name: `${t.name || "Untitled timer"} (copy)`,
  blocks: t.blocks.map((b) => ({ ...b, id: uid("b"), steps: b.steps.map((s) => ({ ...s, id: uid("s") })) })),
});

function App() {
  const [view, setView] = useState("timers");
  const [timers, setTimers] = useState(loadTimers);
  const [lists, setLists] = useState(loadLists);
  const [openLists, setOpenLists] = useState(loadOpenLists);
  const [history, setHistory] = useState(loadHistory);
  const [quick, setQuick] = useState(loadQuick);
  const [counters, setCounters] = useState(loadCounters);
  const [counterLists, setCounterLists] = useState(loadCounterLists);
  const [openCounterLists, setOpenCounterLists] = useState(loadCounterListsOpen);
  const [lockCounterId, setLockCounterId] = useState(() => {
    const id = lsGet(STORAGE_KEYS.lockCounter, null);
    return typeof id === "string" ? id : null;
  });
  const [soundOn, setSoundOn] = useState(() => lsGet(STORAGE_KEYS.sound, true) !== false);
  const [lockMode, setLockMode] = useState(() => {
    const m = lsGet(STORAGE_KEYS.lockScreen, "off");
    return LOCK_MODES.includes(m) ? m : "off";
  });
  const [theme, setTheme] = useState(() => (lsGet(STORAGE_KEYS.theme, "thistle") === "dusk" ? "dusk" : "thistle"));
  const [showSplash, setShowSplash] = useState(() => !isStandalone() && !lsGet(STORAGE_KEYS.splashSeen, false));
  const [bannerHidden, setBannerHidden] = useState(false);
  const [editor, setEditor] = useState(null); // { timer, isNew }
  const [listEditor, setListEditor] = useState(null); // { list, isNew, kind: "timers" | "counters" }
  const [counterEditor, setCounterEditor] = useState(null); // { counter, isNew }
  const [quickOpen, setQuickOpen] = useState(false);
  const [run, setRun] = useState(null); // { timer, source, startedAt }
  const [backupOpen, setBackupOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const install = useInstallPrompt();

  useEffect(() => {
    Log.info("load", { timers: timers.length, lists: lists.length, history: history.length, counters: counters.length });
    requestPersistence();
  }, []);

  // --- Persistence ----------------------------------------------
  useEffect(() => { lsSet(STORAGE_KEYS.timers, timers); }, [timers]);
  useEffect(() => { lsSet(STORAGE_KEYS.lists, lists); }, [lists]);
  useEffect(() => { lsSet(STORAGE_KEYS.listsOpen, openLists); }, [openLists]);
  useEffect(() => { lsSet(STORAGE_KEYS.history, history); }, [history]);
  useEffect(() => { lsSet(STORAGE_KEYS.quick, quick); }, [quick]);
  useEffect(() => { lsSet(STORAGE_KEYS.sound, soundOn); }, [soundOn]);
  useEffect(() => { lsSet(STORAGE_KEYS.lockScreen, lockMode); }, [lockMode]);
  useEffect(() => { lsSet(STORAGE_KEYS.counters, counters); }, [counters]);
  useEffect(() => { lsSet(STORAGE_KEYS.counterLists, counterLists); }, [counterLists]);
  useEffect(() => { lsSet(STORAGE_KEYS.counterListsOpen, openCounterLists); }, [openCounterLists]);
  useEffect(() => { lsSet(STORAGE_KEYS.lockCounter, lockCounterId); }, [lockCounterId]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    lsSet(STORAGE_KEYS.theme, theme);
  }, [theme]);

  // --- Timers ---------------------------------------------------
  const saveTimer = (draft) => {
    const now = new Date().toISOString();
    const before = timers.find((t) => t.id === draft.id);
    const saved = { ...draft, createdAt: draft.createdAt || now, updatedAt: now };
    // A timer that changes list goes to the front of its new list.
    const moved = before && before.listId !== saved.listId;
    setTimers((list) => groupByList(before && !moved ? list.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...list.filter((t) => t.id !== saved.id)], lists));
    Log.info("timer.saved", { id: saved.id, blocks: saved.blocks.length, steps: saved.blocks.reduce((n, b) => n + b.steps.length, 0), created: !before });
    if (moved) Log.info("timer.moved", { id: saved.id, from: before.listId, to: saved.listId });
    setEditor(null);
  };

  const deleteTimer = (timer) => {
    if (!confirm(`Delete "${timer.name || "Untitled timer"}"? This can't be undone. Its past runs stay in History.`)) return;
    setTimers((list) => list.filter((t) => t.id !== timer.id));
    Log.info("timer.deleted", { id: timer.id });
    setEditor(null);
  };

  const duplicateTimer = (source) => {
    const now = new Date().toISOString();
    const copy = { ...copyTimer(source), createdAt: now, updatedAt: now };
    setTimers((list) => {
      const i = list.findIndex((t) => t.id === source.id);
      return groupByList(i < 0 ? [copy, ...list] : [...list.slice(0, i + 1), copy, ...list.slice(i + 1)], lists);
    });
    Log.info("timer.saved", { id: copy.id, blocks: copy.blocks.length, steps: copy.blocks.reduce((n, b) => n + b.steps.length, 0), created: true });
    setEditor(null);
  };

  const moveTimerTo = (id, listId, index) => {
    const t = timers.find((x) => x.id === id);
    setTimers(moveToList(timers, lists, id, listId, index));
    if (t && t.listId !== listId) Log.info("timer.moved", { id, from: t.listId, to: listId });
  };

  // --- Lists ----------------------------------------------------
  // Timer lists and counter lists share the list editor; `kind` says which is open.
  const saveList = (list) => {
    if (listEditor?.kind === "counters") return saveCounterList(list);
    const exists = lists.some((l) => l.id === list.id);
    setLists((ls) => (exists ? ls.map((l) => (l.id === list.id ? list : l)) : [...ls, list]));
    Log.info("list.saved", { id: list.id, created: !exists });
    setListEditor(null);
  };

  // The list's timers move to the top level rather than being deleted.
  const deleteList = (list) => {
    if (listEditor?.kind === "counters") return deleteCounterList(list);
    const count = timers.filter((t) => t.listId === list.id).length;
    const name = list.name || "Untitled list";
    const msg = count
      ? `Delete the list "${name}"? Its ${plural(count, "timer")} will move to the top of your Timers.`
      : `Delete the list "${name}"?`;
    if (!confirm(msg)) return;
    const rest = lists.filter((l) => l.id !== list.id);
    setLists(rest);
    setTimers((ts) => groupByList(ts.map((t) => (t.listId === list.id ? { ...t, listId: null } : t)), rest));
    setOpenLists((o) => o.filter((id) => id !== list.id));
    Log.info("list.deleted", { id: list.id, timersMoved: count });
    setListEditor(null);
  };

  const reorderLists = (next) => {
    setLists(next);
    setTimers((ts) => groupByList(ts, next));
  };

  // --- Counters -------------------------------------------------
  // −/+ taps aren't logged: they're frequent and would crowd everything else out of
  // the log.
  const stepCounter = (id, delta) =>
    setCounters((cs) => cs.map((c) => (c.id === id ? { ...c, count: clampCount(c.count + delta) } : c)));

  // Changes made from the lock-screen notification while the app was in the background.
  const applyCounterDeltas = (deltas) =>
    setCounters((cs) => cs.map((c) => (deltas[c.id] ? { ...c, count: clampCount(c.count + deltas[c.id]) } : c)));

  const lockCounter = counters.find((c) => c.id === lockCounterId) ?? null;
  useCounterLockScreen(lockCounter, applyCounterDeltas);

  const saveCounter = (draft, pinned) => {
    const now = new Date().toISOString();
    const before = counters.find((c) => c.id === draft.id);
    const saved = { ...draft, createdAt: draft.createdAt || now, updatedAt: now };
    // A counter that changes list goes to the front of its new list.
    const moved = before && before.listId !== saved.listId;
    setCounters((cs) =>
      groupByList(before && !moved ? cs.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...cs.filter((c) => c.id !== saved.id)], counterLists),
    );
    Log.info("counter.saved", { id: saved.id, created: !before });
    if (moved) Log.info("counter.moved", { id: saved.id, from: before.listId, to: saved.listId });
    if (before && before.count > 0 && saved.count === 0) Log.info("counter.reset", { id: saved.id, from: before.count });
    if (pinned) setLockCounterId(saved.id);
    else if (lockCounterId === saved.id) setLockCounterId(null);
    setCounterEditor(null);
  };

  const deleteCounter = (counter) => {
    const name = counter.name || "Untitled counter";
    if (!confirm(`Delete "${name}"? Its count of ${counter.count} will be lost. This can't be undone.`)) return;
    setCounters((cs) => cs.filter((c) => c.id !== counter.id));
    if (lockCounterId === counter.id) setLockCounterId(null);
    Log.info("counter.deleted", { id: counter.id, count: counter.count });
    setCounterEditor(null);
  };

  const moveCounterTo = (id, listId, index) => {
    const c = counters.find((x) => x.id === id);
    setCounters(moveToList(counters, counterLists, id, listId, index));
    if (c && c.listId !== listId) Log.info("counter.moved", { id, from: c.listId, to: listId });
  };

  const saveCounterList = (list) => {
    const exists = counterLists.some((l) => l.id === list.id);
    setCounterLists((ls) => (exists ? ls.map((l) => (l.id === list.id ? list : l)) : [...ls, list]));
    Log.info("counterList.saved", { id: list.id, created: !exists });
    setListEditor(null);
  };

  // The list's counters move to the top level rather than being deleted.
  const deleteCounterList = (list) => {
    const count = counters.filter((c) => c.listId === list.id).length;
    const name = list.name || "Untitled list";
    const msg = count
      ? `Delete the list "${name}"? Its ${plural(count, "counter")} will move to the top of your Counters.`
      : `Delete the list "${name}"?`;
    if (!confirm(msg)) return;
    const rest = counterLists.filter((l) => l.id !== list.id);
    setCounterLists(rest);
    setCounters((cs) => groupByList(cs.map((c) => (c.listId === list.id ? { ...c, listId: null } : c)), rest));
    setOpenCounterLists((o) => o.filter((id) => id !== list.id));
    Log.info("counterList.deleted", { id: list.id, countersMoved: count });
    setListEditor(null);
  };

  const reorderCounterLists = (next) => {
    setCounterLists(next);
    setCounters((cs) => groupByList(cs, next));
  };

  const toggleCounterList = (id) => setOpenCounterLists((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));

  // Finished runs per timer, for the badge on each card. Runs stopped early don't count.
  const completedCounts = useMemo(() => {
    const out = new Map();
    for (const h of history) if (h.completed && h.timerId) out.set(h.timerId, (out.get(h.timerId) ?? 0) + 1);
    return out;
  }, [history]);

  const toggleList = (id) => setOpenLists((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));

  // --- Runs -----------------------------------------------------
  // Called from the tap that starts the run, so audio can be unlocked inside the gesture.
  const startRun = (timer, source) => {
    if (soundOn) unlockAudio();
    primeLockScreen(lockMode);
    setRun({ timer, source, startedAt: new Date().toISOString() });
  };

  const startQuick = () => {
    setQuickOpen(false);
    startRun(quickTimer(quick), "quick");
  };

  const recordRun = (result) => {
    if (!run) return;
    if (!result.completed && result.elapsedSec < MIN_HISTORY_SECONDS) return;
    const entry = {
      id: uid("h"),
      timerId: run.source === "quick" ? null : run.timer.id,
      timerName: run.timer.name,
      source: run.source,
      startedAt: run.startedAt,
      finishedAt: new Date().toISOString(),
      elapsedSec: result.elapsedSec,
      plannedSec: totalSeconds(run.timer),
      progress: result.progress,
      completed: result.completed,
    };
    setHistory((h) => [entry, ...h]);
    Log.info("run.finished", { timerId: entry.timerId, completed: entry.completed, elapsedSec: entry.elapsedSec, exit: result.exit });
  };

  const clearHistory = () => {
    if (!confirm(`Clear all ${history.length} workouts from History? This can't be undone. Export a backup first if you want to keep them.`)) return;
    Log.info("history.cleared", { count: history.length });
    setHistory([]);
  };

  // --- Backup ---------------------------------------------------
  const importBackup = (data, mode) => {
    let added;
    if (mode === "replace") {
      setLists(data.lists);
      setTimers(groupByList(data.timers, data.lists));
      setHistory([...data.history].sort(byNewest));
      if (data.quick) setQuick(data.quick);
      if (data.counters) {
        setCounterLists(data.counterLists);
        setCounters(groupByList(data.counters, data.counterLists));
        if (!data.counters.some((c) => c.id === lockCounterId)) setLockCounterId(null);
      }
      added = { timers: data.timers.length, history: data.history.length, lists: data.lists.length, counters: data.counters?.length ?? 0 };
    } else {
      const l = mergeById(lists, data.lists);
      const t = mergeById(timers, data.timers);
      const h = mergeById(history, data.history);
      setLists(l.list);
      setTimers(groupByList(t.list, l.list));
      setHistory(h.list.sort(byNewest));
      const cl = mergeById(counterLists, data.counterLists ?? []);
      const c = mergeById(counters, data.counters ?? []);
      setCounterLists(cl.list);
      setCounters(groupByList(c.list, cl.list));
      added = { timers: t.added, history: h.added, lists: l.added, counters: c.added };
    }
    Log.info("backup.imported", { mode, ...added, skipped: data.skipped });
    return added;
  };

  // --- Render ---------------------------------------------------
  if (showSplash) {
    return (
      <Splash
        install={install}
        onContinue={() => {
          lsSet(STORAGE_KEYS.splashSeen, true);
          setShowSplash(false);
        }}
      />
    );
  }

  const headerAction =
    view === "timers" ? (
      <button type="button" onClick={() => setEditor({ timer: newTimer(), isNew: true })} data-testid="timers-new" className={`${ui.primary} py-2 pl-3`}>
        <I.plus size={16} /> New
      </button>
    ) : view === "counters" ? (
      <button type="button" onClick={() => setCounterEditor({ counter: newCounter(), isNew: true })} data-testid="counters-new" className={`${ui.primary} py-2 pl-3`}>
        <I.plus size={16} /> New
      </button>
    ) : null;
  const titles = {
    timers: { title: "Timers", subtitle: timers.length ? plural(timers.length, "saved timer") : null },
    counters: { title: "Counters", subtitle: counters.length ? plural(counters.length, "counter") : null },
    history: { title: "History", subtitle: null },
  };

  return (
    <div className="min-h-full">
      {install.canPrompt && !bannerHidden && <InstallBanner onInstall={install.prompt} onDismiss={() => setBannerHidden(true)} />}
      <AppHeader
        title={titles[view].title}
        subtitle={titles[view].subtitle}
        action={headerAction}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dusk" ? "thistle" : "dusk"))}
        onOpenBackup={() => setBackupOpen(true)}
        onOpenLockScreen={() => setLockOpen(true)}
      />
      {/* Extra bottom room on Timers so the Quick start button never covers the last card. */}
      <main className={`max-w-3xl mx-auto px-4 sm:px-6 pt-2 ${view === "timers" ? "pb-48" : "pb-32"}`}>
        {view === "timers" && (
          <TimersView
            timers={timers}
            completedCounts={completedCounts}
            lists={lists}
            openLists={openLists}
            onToggleList={toggleList}
            onRun={(t) => startRun(t, "timer")}
            onEdit={(t) => setEditor({ timer: t, isNew: false })}
            onEditList={(l) => setListEditor({ list: l, isNew: false, kind: "timers" })}
            onNewList={() => setListEditor({ list: { id: uid("l"), name: "", createdAt: new Date().toISOString() }, isNew: true, kind: "timers" })}
            onMoveTimer={moveTimerTo}
            onReorderLists={reorderLists}
          />
        )}
        {view === "counters" && (
          <CountersView
            counters={counters}
            lists={counterLists}
            openLists={openCounterLists}
            lockCounterId={lockCounterId}
            onToggleList={toggleCounterList}
            onStep={stepCounter}
            onEdit={(c) => setCounterEditor({ counter: c, isNew: false })}
            onEditList={(l) => setListEditor({ list: l, isNew: false, kind: "counters" })}
            onNewList={() => setListEditor({ list: { id: uid("cl"), name: "", createdAt: new Date().toISOString() }, isNew: true, kind: "counters" })}
            onMoveCounter={moveCounterTo}
            onReorderLists={reorderCounterLists}
          />
        )}
        {view === "history" && <HistoryView history={history} onClear={clearHistory} />}
      </main>
      {view === "timers" && <QuickStartButton quick={quick} onStart={() => startRun(quickTimer(quick), "quick")} onEdit={() => setQuickOpen(true)} />}
      <BottomNav view={view} onChange={setView} />

      {editor && (
        <TimerEditorModal
          timer={editor.timer}
          lists={lists}
          isNew={editor.isNew}
          onSave={saveTimer}
          onDelete={() => deleteTimer(editor.timer)}
          onDuplicate={duplicateTimer}
          onClose={() => setEditor(null)}
        />
      )}
      {backupOpen && (
        <BackupModal
          timers={timers}
          lists={lists}
          history={history}
          quick={quick}
          counters={counters}
          counterLists={counterLists}
          onImport={importBackup}
          onClose={() => setBackupOpen(false)}
        />
      )}
      {lockOpen && <LockScreenModal mode={lockMode} onChange={setLockMode} onClose={() => setLockOpen(false)} />}
      {quickOpen && <QuickModal quick={quick} onChange={setQuick} onStart={startQuick} onClose={() => setQuickOpen(false)} />}
      {counterEditor && (
        <CounterEditorModal
          counter={counterEditor.counter}
          lists={counterLists}
          isNew={counterEditor.isNew}
          pinned={lockCounterId === counterEditor.counter.id}
          onSave={saveCounter}
          onDelete={() => deleteCounter(counterEditor.counter)}
          onClose={() => setCounterEditor(null)}
        />
      )}
      {listEditor && (
        <ListModal
          list={listEditor.list}
          isNew={listEditor.isNew}
          noun={listEditor.kind}
          onSave={saveList}
          onDelete={() => deleteList(listEditor.list)}
          onClose={() => setListEditor(null)}
        />
      )}
      {run && (
        <RunScreen
          key={run.startedAt}
          timer={run.timer}
          soundOn={soundOn}
          lockMode={lockMode}
          onToggleSound={() => setSoundOn((s) => !s)}
          onFinish={recordRun}
          onClose={() => setRun(null)}
        />
      )}
    </div>
  );
}

export { App };
