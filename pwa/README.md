# Thistle app

The Vite + React + Tailwind v4 PWA. Run commands from the repo root (see the root README), or from here with plain `npm run <script>`.

## Layout

```
pwa/
├── index.html            ← meta tags, fonts, pre-paint theme script, inline loading state
├── vite.config.js        ← base path, PWA manifest + service worker
├── scripts/make-icons.mjs← renders public/icons/ from ../thistle-mark.svg
├── public/icons/         ← generated icons (commit them)
├── src/
│   ├── main.jsx          ← mounts <App />
│   ├── App.jsx           ← view state, persisted collections, overlays, theme
│   ├── styles.css        ← Tailwind import, Thistle + Dusk theme tokens, global classes
│   ├── seed.js           ← starter timers for a fresh install (empty)
│   ├── components/       ← one component per file
│   └── lib/
│       ├── constants.js  ← storage keys, step kinds and colors, timings
│       ├── timerModel.js ← timer shape, flatten-to-segments, totals, validation
│       ├── runner.js     ← useRunner: the countdown engine and cues
│       ├── sound.js      ← Web Audio beeps
│       ├── storage.js    ← localStorage helpers
│       ├── backup.js     ← export / import
│       ├── backNav.js    ← device Back closes the top overlay
│       ├── hooks.js      ← scroll lock, install prompt, wake lock
│       ├── log.js        ← persisted diagnostics log
│       ├── format.js     ← duration and date formatting
│       └── icons.jsx     ← inline SVG icons
└── cypress/              ← e2e specs, support commands, fixtures
```

## Timers

A timer is a list of **blocks**. Each block is a list of **steps** (Work, Rest, Warm-up or Cool-down, with an optional name and a length), and it repeats `reps` times. To run a timer, `flatten()` expands it into a flat list of segments:

- a 5-second **Get ready** segment comes first;
- steps with zero length are dropped;
- rest steps at the very end are dropped, since resting after the last rep does nothing.

`useRunner` moves through those segments using `Date.now()` differences rather than counting ticks, so it stays correct when the browser throttles a background tab. It beeps at 3-2-1 before each step ends, at the start of each step, and when the timer finishes. **Back** restarts the current step if you're more than 3 seconds into it, and goes to the previous step otherwise.

## History

A run is saved to History when it finishes, or when you stop it after at least 10 seconds of active time. Get-ready and paused time don't count. Stopped runs are saved as **Partial**, with how far through the timer you got.

## Theming

The visual rules are in [DESIGN.md](../DESIGN.md) at the repo root. In code, every color is a semantic CSS variable on `:root` (the light Thistle theme). `[data-theme="dusk"]` redefines the same variables for the dark theme, so no `dark:` variants are needed. Use the semantic utilities (`bg-surface`, `text-muted`, `bg-brand text-on-brand`, …), and use `lib/ui.js` for buttons and inputs.

Each step kind's id is also its color name: `bg-work`, `text-rest-ink`, `bg-cooldown-soft`, and `ready` for get-ready. Those classes are built at runtime, so they are listed in the `@source inline(...)` line at the top of `styles.css`.

## Offline

`npm run build` generates a Workbox service worker that precaches the app shell and icons, and caches Google Fonts as they're used. The dev server has no service worker.
