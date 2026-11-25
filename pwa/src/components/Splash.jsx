// First-visit landing page for people who open Thistle in a browser tab rather than
// the installed app. Shown once; dismissing it is remembered.
import { isIOS } from "../lib/hooks.js";
import { I } from "../lib/icons.jsx";
import { BrandMark } from "./BrandMark.jsx";

const FEATURES = [
  { Icon: I.repeat, tone: "petal", title: "Your intervals, your way", text: "Stack blocks of work and rest, repeat them, and save the timer for next time." },
  { Icon: I.volume, tone: "leaf", title: "Eyes off the screen", text: "Beeps count you down, and the screen stays awake while you move." },
  { Icon: I.wifiOff, tone: "plum", title: "Works offline", text: "Everything stays on your phone. No account, no signal needed." },
];

function Splash({ install, onContinue }) {
  const doInstall = async () => {
    if (await install.prompt()) onContinue();
  };
  return (
    <div className="min-h-full thistle-wash flex flex-col items-center justify-center px-6 py-12 text-center" data-testid="splash">
      <BrandMark size={88} className="bloom" />
      <h1 className="font-display font-bold text-4xl tracking-tight text-ink-900 mt-6">Thistle</h1>
      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-thistle-600 mt-2">Work, rest, repeat</p>

      <ul className="mt-10 space-y-5 max-w-sm text-left">
        {FEATURES.map(({ Icon, tone, title, text }, i) => (
          <li key={title} className="flex gap-4 fade-up" style={{ animationDelay: `${120 + i * 80}ms` }}>
            <span className={`w-11 h-11 rounded-full bg-${tone}-50 text-${tone}-600 flex items-center justify-center shrink-0`}>
              <Icon size={20} />
            </span>
            <div>
              <h2 className="font-display font-bold text-ink-900">{title}</h2>
              <p className="text-sm text-ink-600">{text}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 w-full max-w-sm">
        {install.canPrompt ? (
          <button
            type="button"
            onClick={doInstall}
            data-testid="splash-install"
            className="w-full inline-flex items-center justify-center gap-2 bg-thistle-500 text-white rounded-full px-6 py-3.5 text-xs font-bold uppercase tracking-[0.15em] shadow-brand active:scale-95 transition-transform"
          >
            <I.smartphone size={14} /> Install Thistle
          </button>
        ) : (
          <p className="rounded-2xl bg-card border-2 border-cream-100 shadow-card px-4 py-3 text-sm text-ink-700" data-testid="splash-howto">
            {isIOS() ? (
              <>To install, tap <I.share size={14} className="inline -mt-1" /> <b>Share</b>, then <b>Add to Home Screen</b>.</>
            ) : (
              <>To install, open your browser menu and choose <b>Install app</b> or <b>Add to Home screen</b>.</>
            )}
          </p>
        )}
        <button type="button" onClick={onContinue} data-testid="splash-continue" className="mt-4 text-[11px] font-bold uppercase tracking-[0.15em] text-ink-500 active:scale-95 transition-transform">
          Continue in browser
        </button>
      </div>
    </div>
  );
}

export { Splash };
