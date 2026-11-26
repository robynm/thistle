# Thistle

Thistle is an interval timer for workouts, installable on your phone as an app. You build timers out of blocks of work and rest steps, set how many times each block repeats, and save them to run again later, organised into lists if you like. While a timer runs, the screen takes on the color of the current step, beeps count you down, and the screen stays awake. There is also a one-off Quick start timer (the split button at the bottom of Timers), simple named counters with − and + buttons, and a History of past workouts. Everything is stored on your device, and the app works offline.

## What's where

```
thistle/
├── README.md              ← this file
├── DESIGN.md              ← Thistle's colors, type and screen rules
├── package.json           ← root command proxy; scripts run inside pwa/
├── release.sh             ← one-command release: build, commit, tag vN, push
├── thistle-mark.svg       ← source brand mark (icons are generated from it)
├── project-template/      ← the general style and structure templates this project started from
├── .github/workflows/
│   ├── e2e.yml            ← e2e suite on every pull request
│   ├── deploy.yml         ← on push to main: e2e gate, then build + publish to Pages
│   └── release.yml        ← on a v* tag: build, zip, attach to a GitHub Release
└── pwa/                   ← the app (Vite + React + Tailwind); see pwa/README.md
```

## Local development

Every command runs from the repo root. You need Node 22 or newer.

| Command | What it does |
|---|---|
| `npm run setup` | Install the app's dependencies (`pwa/node_modules`) |
| `npm run dev` | Dev server at http://localhost:5173 (no service worker) |
| `npm run build` | Production build into `pwa/dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run test:e2e` | Run the Cypress suite headless (what CI runs) |
| `npm run cypress:open` | Interactive Cypress; start `npm run dev` first |
| `npm run icons` | Regenerate `pwa/public/icons/` from `thistle-mark.svg` |
| `npm run release` | Cut the next numbered release (see below) |

## Testing

End-to-end only, with Cypress at a 390 × 844 phone viewport. Specs are in `pwa/cypress/e2e/`, one per feature area. To run a single spec:

```sh
npm --prefix pwa run cypress:run -- --spec cypress/e2e/run.cy.js
```

## Deploying

The app is served by GitHub Pages at https://thistle.robynm.net (the domain in `pwa/public/CNAME`), from the root path `/`.

1. Work on a short-lived branch and open a pull request into `main`. `e2e.yml` runs the suite.
2. Merge. `deploy.yml` runs the suite again as a gate, then builds and publishes `pwa/dist/`.
3. To cut a numbered release, run `npm run release` from an up-to-date `main`. It builds, commits any changes as `vN`, tags `vN` and pushes. The tag triggers `release.yml`, which attaches a zip of the build to a GitHub Release. Versions are plain integers (`v1`, `v2`, …).

### One-time GitHub setup

- Settings → Pages → Source: **GitHub Actions**.
- Custom domain: set it under Settings → Pages, and keep `pwa/public/CNAME` matching it. That file is published with every deploy. Turn on **Enforce HTTPS** once the certificate is issued, since service workers and installing the app need HTTPS.

## Updating an installed app

Installed copies check for a new version in the background and switch to it the next time they launch. To force it, fully close the app and reopen it. If that doesn't work, clear the site's cache in your browser settings. Updating never touches your timers or history.

## Where your data lives

Everything stays on the device, in the browser's localStorage:

| Key | Contents |
|---|---|
| `thistle:timers:v1` | Saved timers, in your order |
| `thistle:lists:v1` | Lists, in your order |
| `thistle:listsOpen:v1` | Which lists are expanded on this device |
| `thistle:history:v1` | Past workouts |
| `thistle:quick:v1` | Last Quick start values |
| `thistle:counters:v1` | Counters and their counts, in your order |
| `thistle:counterLists:v1` | Counter lists, in your order (separate from timer lists) |
| `thistle:counterListsOpen:v1` | Which counter lists are expanded on this device |
| `thistle:sound:v1`, `thistle:theme:v1`, `thistle:lockScreen:v1` | Per-device settings |
| `thistle:lockCounter:v1` | Which counter is shown in the lock-screen notification on this device |
| `thistle:splashSeen:v1` | Whether the welcome screen was dismissed |
| `thistle:log:v1` | The last 200 diagnostic log entries |

Nothing is sent anywhere. If you clear your browser's site data, or uninstall the app on iOS, everything is erased. To keep a copy, use ⋯ → **Backup & restore** → **Export**. That saves a JSON file you can import later (merge or replace), on this device or another.

## Known constraints

- **iOS sound:** when the ringer switch is on silent, iOS mutes web audio, so the beeps won't play.
- **iOS background:** if you lock the phone or switch apps mid-workout, iOS pauses the page. The timer stays accurate (it works from timestamps), but no beeps play until you come back. The wake lock keeps the screen on while you stay in the app.
- **Lock-screen counters** use a notification with − and + buttons, which only Android browsers support. Changes made there are held by the service worker (in IndexedDB, `thistle-sw`) until the app next opens.
- **Install on iOS** works from Safari only: Share → **Add to Home Screen**.
- **Vibration** is not used, because iOS doesn't support it.
