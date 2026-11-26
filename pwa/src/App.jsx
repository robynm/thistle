// Root component. Owns the current view (there is no router), every persisted
// collection, which overlays are open, and the theme. Views get data and callbacks.
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "./components/AppHeader.jsx";
import { BackupModal } from "./components/BackupModal.jsx";
import { BottomNav } from "./components/BottomNav.jsx";
import { HistoryView } from "./components/HistoryView.jsx";
import { ListModal } from "./components/ListModal.jsx";
import { LockScreenModal } from "./components/LockScreenModal.jsx";
import { InstallBanner } from "./components/InstallBanner.jsx";
import { QuickView } from "./components/QuickView.jsx";
import { RunScreen } from "./components/RunScreen.jsx";
import { Splash } from "./components/Splash.jsx";
import { TimerEditorModal } from "./components/TimerEditorModal.jsx";
import { TimersView } from "./components/TimersView.jsx";
import { mergeById } from "./lib/backup.js";
import { MIN_HISTORY_SECONDS, QUICK_DEFAULTS, STORAGE_KEYS } from "./lib/constants.js";
import { isStandalone, useInstallPrompt } from "./lib/hooks.js";
import { plural } from "./lib/format.js";
import { LOCK_MODES, primeLockScreen } from "./lib/lockScreen.js";
import { I } from "./lib/icons.jsx";
import { Log } from "./lib/log.js";
import { unlockAudio } from "./lib/sound.js";
import { lsGet, lsSet, requestPersistence } from "./lib/storage.js";
import { ui } from "./lib/ui.js";
import { cleanHistoryEntry, cleanList, cleanTimer, groupTimers, moveTimer, newTimer, quickTimer, totalSeconds, uid } from "./lib/timerModel.js";
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
  return groupTimers(timers, loadLists());
}
function loadOpenLists() {
  const raw = lsGet(STORAGE_KEYS.listsOpen, []);
  return Array.isArray(raw) ? raw.filter((id) => typeof id === "string") : [];
}
function loadHistory() {
  const raw = lsGet(STORAGE_KEYS.history, []);
  return Array.isArray(raw) ? raw.map(cleanHistoryEntry).filter(Boolean) : [];
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
  const [soundOn, setSoundOn] = useState(() => lsGet(STORAGE_KEYS.sound, true) !== false);
  const [lockMode, setLockMode] = useState(() => {
    const m = lsGet(STORAGE_KEYS.lockScreen, "off");
    return LOCK_MODES.includes(m) ? m : "off";
  });
  const [theme, setTheme] = useState(() => (lsGet(STORAGE_KEYS.theme, "thistle") === "dusk" ? "dusk" : "thistle"));
  const [showSplash, setShowSplash] = useState(() => !isStandalone() && !lsGet(STORAGE_KEYS.splashSeen, false));
  const [bannerHidden, setBannerHidden] = useState(false);
  const [editor, setEditor] = useState(null); // { timer, isNew }
  const [listEditor, setListEditor] = useState(null); // { list, isNew }
  const [run, setRun] = useState(null); // { timer, source, startedAt }
  const [backupOpen, setBackupOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const install = useInstallPrompt();

  useEffect(() => {
    Log.info("load", { timers: timers.length, lists: lists.length, history: history.length });
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
    setTimers((list) => groupTimers(before && !moved ? list.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...list.filter((t) => t.id !== saved.id)], lists));
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
      return groupTimers(i < 0 ? [copy, ...list] : [...list.slice(0, i + 1), copy, ...list.slice(i + 1)], lists);
    });
    Log.info("timer.saved", { id: copy.id, blocks: copy.blocks.length, steps: copy.blocks.reduce((n, b) => n + b.steps.length, 0), created: true });
    setEditor(null);
  };

  const moveTimerTo = (id, listId, index) => {
    const t = timers.find((x) => x.id === id);
    setTimers(moveTimer(timers, lists, id, listId, index));
    if (t && t.listId !== listId) Log.info("timer.moved", { id, from: t.listId, to: listId });
  };

  // --- Lists ----------------------------------------------------
  const saveList = (list) => {
    const exists = lists.some((l) => l.id === list.id);
    setLists((ls) => (exists ? ls.map((l) => (l.id === list.id ? list : l)) : [...ls, list]));
    Log.info("list.saved", { id: list.id, created: !exists });
    setListEditor(null);
  };

  // The list's timers move to the top level rather than being deleted.
  const deleteList = (list) => {
    const count = timers.filter((t) => t.listId === list.id).length;
    const name = list.name || "Untitled list";
    const msg = count
      ? `Delete the list "${name}"? Its ${plural(count, "timer")} will move to the top of your Timers.`
      : `Delete the list "${name}"?`;
    if (!confirm(msg)) return;
    const rest = lists.filter((l) => l.id !== list.id);
    setLists(rest);
    setTimers((ts) => groupTimers(ts.map((t) => (t.listId === list.id ? { ...t, listId: null } : t)), rest));
    setOpenLists((o) => o.filter((id) => id !== list.id));
    Log.info("list.deleted", { id: list.id, timersMoved: count });
    setListEditor(null);
  };

  const reorderLists = (next) => {
    setLists(next);
    setTimers((ts) => groupTimers(ts, next));
  };

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
      setTimers(groupTimers(data.timers, data.lists));
      setHistory([...data.history].sort(byNewest));
      if (data.quick) setQuick(data.quick);
      added = { timers: data.timers.length, history: data.history.length, lists: data.lists.length };
    } else {
      const l = mergeById(lists, data.lists);
      const t = mergeById(timers, data.timers);
      const h = mergeById(history, data.history);
      setLists(l.list);
      setTimers(groupTimers(t.list, l.list));
      setHistory(h.list.sort(byNewest));
      added = { timers: t.added, history: h.added, lists: l.added };
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

  const headerAction = view === "timers" && (
    <button type="button" onClick={() => setEditor({ timer: newTimer(), isNew: true })} data-testid="timers-new" className={`${ui.primary} py-2 pl-3`}>
      <I.plus size={16} /> New
    </button>
  );
  const titles = {
    timers: { title: "Timers", subtitle: timers.length ? plural(timers.length, "saved timer") : null },
    quick: { title: "Quick start", subtitle: "Work, rest, repeat. No saving needed." },
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-2 pb-32">
        {view === "timers" && (
          <TimersView
            timers={timers}
            completedCounts={completedCounts}
            lists={lists}
            openLists={openLists}
            onToggleList={toggleList}
            onRun={(t) => startRun(t, "timer")}
            onEdit={(t) => setEditor({ timer: t, isNew: false })}
            onEditList={(l) => setListEditor({ list: l, isNew: false })}
            onNewList={() => setListEditor({ list: { id: uid("l"), name: "", createdAt: new Date().toISOString() }, isNew: true })}
            onMoveTimer={moveTimerTo}
            onReorderLists={reorderLists}
          />
        )}
        {view === "quick" && <QuickView quick={quick} onChange={setQuick} onStart={() => startRun(quickTimer(quick), "quick")} />}
        {view === "history" && <HistoryView history={history} onClear={clearHistory} />}
      </main>
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
        <BackupModal timers={timers} lists={lists} history={history} quick={quick} onImport={importBackup} onClose={() => setBackupOpen(false)} />
      )}
      {lockOpen && <LockScreenModal mode={lockMode} onChange={setLockMode} onClose={() => setLockOpen(false)} />}
      {listEditor && (
        <ListModal
          list={listEditor.list}
          isNew={listEditor.isNew}
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
