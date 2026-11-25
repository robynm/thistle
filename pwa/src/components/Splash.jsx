// First-visit landing page for people who open Thistle in a browser tab rather than
// the installed app. Shown once; dismissing it is remembered.
import { isIOS } from "../lib/hooks.js";
import { I } from "../lib/icons.jsx";
import { ui } from "../lib/ui.js";
import { BrandMark } from "./BrandMark.jsx";

const FEATURES = [
  { Icon: I.repeat, title: "Your intervals, your way", text: "Stack blocks of work and rest, repeat them, and save the timer for next time." },
  { Icon: I.volume, title: "Eyes off the screen", text: "Beeps count you down, and the screen stays awake while you move." },
  { Icon: I.wifiOff, title: "Works offline", text: "Everything stays on your phone. No account, no signal needed." },
];

function Splash({ install, onContinue }) {
  const doInstall = async () => {
    if (await install.prompt()) onContinue();
  };
  return (
    <div className="min-h-full flex flex-col justify-center px-6 py-12 max-w-sm mx-auto" data-testid="splash">
      <BrandMark size={64} className="pop" />
      <h1 className="font-display font-bold text-4xl tracking-tight text-ink mt-6">Thistle</h1>
      <p className="text-muted mt-1">Interval timers for work, rest and reps.</p>

      <ul className="mt-10 space-y-5">
        {FEATURES.map(({ Icon, title, text }) => (
          <li key={title} className="flex gap-4">
            <span className="w-10 h-10 rounded-full bg-surface text-ink flex items-center justify-center shrink-0">
              <Icon size={18} />
            </span>
            <div>
              <h2 className="font-semibold text-ink">{title}</h2>
              <p className="text-sm text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        {install.canPrompt ? (
          <button type="button" onClick={doInstall} data-testid="splash-install" className={`${ui.primary} w-full py-3.5 text-base`}>
            <I.smartphone size={16} /> Install Thistle
          </button>
        ) : (
          <p className="rounded-2xl bg-surface px-4 py-3 text-sm text-ink" data-testid="splash-howto">
            {isIOS() ? (
              <>To install, tap <I.share size={14} className="inline -mt-1" /> <b>Share</b>, then <b>Add to Home Screen</b>.</>
            ) : (
              <>To install, open your browser menu and choose <b>Install app</b> or <b>Add to Home screen</b>.</>
            )}
          </p>
        )}
        <button type="button" onClick={onContinue} data-testid="splash-continue" className="w-full mt-3 py-2.5 text-sm font-medium text-muted">
          Continue in browser
        </button>
      </div>
    </div>
  );
}

export { Splash };
