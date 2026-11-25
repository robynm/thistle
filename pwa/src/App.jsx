// Root component. Owns the current view (there is no router), every persisted
// collection, which overlays are open, and the theme. Views get data and callbacks.
import { useEffect, useState } from "react";
import { AppHeader } from "./components/AppHeader.jsx";
import { BackupModal } from "./components/BackupModal.jsx";
import { BottomNav } from "./components/BottomNav.jsx";
import { HistoryView } from "./components/HistoryView.jsx";
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
import { I } from "./lib/icons.jsx";
import { Log } from "./lib/log.js";
import { unlockAudio } from "./lib/sound.js";
import { lsGet, lsSet, requestPersistence } from "./lib/storage.js";
import { ui } from "./lib/ui.js";
import { cleanHistoryEntry, cleanTimer, newTimer, quickTimer, totalSeconds, uid } from "./lib/timerModel.js";
import { SEED_TIMERS } from "./seed.js";

// --- Loading --------------------------------------------------
function loadTimers() {
  const raw = lsGet(STORAGE_KEYS.timers, null);
  if (raw === null) return SEED_TIMERS;
  return Array.isArray(raw) ? raw.map(cleanTimer).filter(Boolean) : [];
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
  const [history, setHistory] = useState(loadHistory);
  const [quick, setQuick] = useState(loadQuick);
  const [soundOn, setSoundOn] = useState(() => lsGet(STORAGE_KEYS.sound, true) !== false);
  const [theme, setTheme] = useState(() => (lsGet(STORAGE_KEYS.theme, "thistle") === "dusk" ? "dusk" : "thistle"));
  const [showSplash, setShowSplash] = useState(() => !isStandalone() && !lsGet(STORAGE_KEYS.splashSeen, false));
  const [bannerHidden, setBannerHidden] = useState(false);
  const [editor, setEditor] = useState(null); // { timer, isNew }
  const [run, setRun] = useState(null); // { timer, source, startedAt }
  const [backupOpen, setBackupOpen] = useState(false);
  const install = useInstallPrompt();

  useEffect(() => {
    Log.info("load", { timers: timers.length, history: history.length });
    requestPersistence();
  }, []);

  // --- Persistence ----------------------------------------------
  useEffect(() => { lsSet(STORAGE_KEYS.timers, timers); }, [timers]);
  useEffect(() => { lsSet(STORAGE_KEYS.history, history); }, [history]);
  useEffect(() => { lsSet(STORAGE_KEYS.quick, quick); }, [quick]);
  useEffect(() => { lsSet(STORAGE_KEYS.sound, soundOn); }, [soundOn]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    lsSet(STORAGE_KEYS.theme, theme);
  }, [theme]);

  // --- Timers ---------------------------------------------------
  const saveTimer = (draft) => {
    const now = new Date().toISOString();
    const exists = timers.some((t) => t.id === draft.id);
    const saved = { ...draft, createdAt: draft.createdAt || now, updatedAt: now };
    setTimers((list) => (exists ? list.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...list]));
    Log.info("timer.saved", { id: saved.id, blocks: saved.blocks.length, steps: saved.blocks.reduce((n, b) => n + b.steps.length, 0), created: !exists });
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
      return i < 0 ? [copy, ...list] : [...list.slice(0, i + 1), copy, ...list.slice(i + 1)];
    });
    Log.info("timer.saved", { id: copy.id, blocks: copy.blocks.length, steps: copy.blocks.reduce((n, b) => n + b.steps.length, 0), created: true });
    setEditor(null);
  };

  // --- Runs -----------------------------------------------------
  // Called from the tap that starts the run, so audio can be unlocked inside the gesture.
  const startRun = (timer, source) => {
    if (soundOn) unlockAudio();
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
    Log.info("run.finished", { timerId: entry.timerId, completed: entry.completed, elapsedSec: entry.elapsedSec });
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
      setTimers(data.timers);
      setHistory([...data.history].sort(byNewest));
      if (data.quick) setQuick(data.quick);
      added = { timers: data.timers.length, history: data.history.length };
    } else {
      const t = mergeById(timers, data.timers);
      const h = mergeById(history, data.history);
      setTimers(t.list);
      setHistory(h.list.sort(byNewest));
      added = { timers: t.added, history: h.added };
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
      />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-2 pb-32">
        {view === "timers" && (
          <TimersView timers={timers} onRun={(t) => startRun(t, "timer")} onEdit={(t) => setEditor({ timer: t, isNew: false })} />
        )}
        {view === "quick" && <QuickView quick={quick} onChange={setQuick} onStart={() => startRun(quickTimer(quick), "quick")} />}
        {view === "history" && <HistoryView history={history} onClear={clearHistory} />}
      </main>
      <BottomNav view={view} onChange={setView} />

      {editor && (
        <TimerEditorModal
          timer={editor.timer}
          isNew={editor.isNew}
          onSave={saveTimer}
          onDelete={() => deleteTimer(editor.timer)}
          onDuplicate={duplicateTimer}
          onClose={() => setEditor(null)}
        />
      )}
      {backupOpen && (
        <BackupModal timers={timers} history={history} quick={quick} onImport={importBackup} onClose={() => setBackupOpen(false)} />
      )}
      {run && (
        <RunScreen
          key={run.startedAt}
          timer={run.timer}
          soundOn={soundOn}
          onToggleSound={() => setSoundOn((s) => !s)}
          onFinish={recordRun}
          onClose={() => setRun(null)}
        />
      )}
    </div>
  );
}

export { App };
