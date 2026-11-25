# Project Scaffolding

How to set up and organize a new app in this style: a local-first, installable web app (PWA) built with Vite + React + Tailwind, tested end to end with Cypress, and deployed as static files to GitHub Pages. The visual and interaction style is covered in [DESIGN.md](DESIGN.md).

Replace `<app>` with the project's short lowercase name and `<App>` with its display name.

---

## 1. Principles

- **Local-first.** The device is the source of truth. Data lives in the browser (localStorage for metadata, IndexedDB for blobs). The app works offline and with no backend configured.
- **Optional cloud mirror.** Any server sync is opt-in through build-time env vars. With them unset, every sync call does nothing and the app behaves as a purely local app. The test suite runs with sync off.
- **Few dependencies.** React, React DOM, and the build/test tools. No router, no state library, no component kit, no icon package. Add a dependency only when writing it yourself would clearly cost more.
- **Static hosting.** The build output is plain files. GitHub Pages serves them; no server code.
- **Every command runs from the repo root.**
- **The user can always get their data out.** A backup/export to a single portable file and a matching import exist from the first release.

---

## 2. Repository layout

```
<app>/
├── README.md              ← what it is, how to run, test, deploy; where data lives
├── package.json           ← root command proxy (no deps); forwards scripts into the app folder
├── release.sh             ← one-command release: build, commit, tag vN, push
├── .gitignore
├── .claude/launch.json    ← dev-server launch config (optional)
├── .github/workflows/
│   ├── e2e.yml            ← e2e suite on every pull request
│   ├── deploy.yml         ← on push to main: e2e gate, then build + publish to Pages
│   └── release.yml        ← on a v* tag: build, zip, attach to a GitHub Release
├── *_PLAN.md              ← longer design/planning docs live at the root, not in code
└── pwa/                   ← the app itself (a standalone Vite project)
    ├── README.md          ← app-level details: layout, storage, offline behavior
    ├── index.html         ← Vite entry, meta tags, fonts, pre-paint theme script, inline loading state
    ├── package.json
    ├── vite.config.js     ← base path, build dir, PWA manifest + service worker
    ├── postcss.config.js
    ├── cypress.config.js
    ├── public/            ← copied as-is to the site root: icons/, CNAME
    ├── src/
    │   ├── main.jsx       ← imports styles + logger, mounts the root component
    │   ├── App.jsx        ← root component: view state, load/migrate, persistence wiring
    │   ├── styles.css     ← Tailwind import, theme tokens, the few global classes
    │   ├── seed.js        ← starter data (empty by default)
    │   ├── components/    ← one React component per file
    │   └── lib/           ← non-visual modules (see §4)
    └── cypress/
        ├── e2e/           ← one spec per feature area: <area>.cy.js
        ├── support/       ← commands.js (custom commands), e2e.js (global hooks)
        └── fixtures/      ← sample images, valid + invalid import files
```

The app sits in its own subfolder so the repo root can hold release tooling, plans, brand source files and, later, other targets (for example a native wrapper) without mixing them into the app.

---

## 3. Toolchain

| Concern | Choice |
|---|---|
| Build / dev server | Vite (`@vitejs/plugin-react`) |
| UI | React (function components and hooks only), plain JSX (no TypeScript) |
| Styling | Tailwind CSS v4, CSS-first config (`@tailwindcss/postcss`; no `tailwind.config.js`) |
| PWA | `vite-plugin-pwa` (Workbox), `registerType: 'autoUpdate'` |
| E2E tests | Cypress + `start-server-and-test` |
| Node | 22 (CI and local) |
| Module format | ES modules (`"type": "module"`) |

### Root `package.json` (command proxy)

```json
{
  "name": "<app>-workspace",
  "private": true,
  "description": "Repo-root command proxy. The app lives in pwa/; these scripts run there so everything works from the repo root.",
  "scripts": {
    "setup": "npm --prefix pwa install",
    "dev": "npm --prefix pwa run dev",
    "build": "npm --prefix pwa run build",
    "preview": "npm --prefix pwa run preview",
    "test:e2e": "npm --prefix pwa run test:e2e",
    "cypress:open": "npm --prefix pwa run cypress:open",
    "release": "./release.sh"
  }
}
```

### `pwa/package.json`

```json
{
  "name": "<app>",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "cypress:open": "cypress open",
    "cypress:run": "cypress run",
    "test:e2e": "start-server-and-test dev http://localhost:5173 cypress:run"
  },
  "dependencies": { "react": "^19", "react-dom": "^19" },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@vitejs/plugin-react": "*",
    "cypress": "*",
    "postcss": "^8",
    "start-server-and-test": "*",
    "tailwindcss": "^4",
    "vite": "*",
    "vite-plugin-pwa": "*"
  }
}
```

Pin to the current major versions when creating the project.

### `pwa/postcss.config.js`

```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

### `pwa/vite.config.js`

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Served from the root of a custom domain, so assets live at '/'.
export default defineConfig({
  base: '/',
  build: { outDir: 'dist', emptyOutDir: true },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: '<App>',
        short_name: '<App>',
        description: '<one-line tagline>',
        id: '/', start_url: '/', scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '<surface-50 hex>',
        theme_color: '<brand-500 hex>',
        lang: 'en',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],
        runtimeCaching: [{
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'google-fonts',
            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] },
          },
        }],
      },
    }),
  ],
});
```

The service worker is generated only by `npm run build`. The dev server runs without one, so tests and development never hit a stale cache. There is no cache version to bump by hand.

### `pwa/index.html` essentials

- Viewport: `width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no`.
- `theme-color`, `apple-mobile-web-app-*` and `mobile-web-app-capable` meta tags, favicon and apple-touch-icon.
- Google Fonts `preconnect` + stylesheet for the display and body fonts.
- A tiny inline script that reads the saved theme from localStorage and sets `document.documentElement.dataset.theme` **before first paint**, wrapped in `try/catch`.
- Inline markup inside `#root` showing the brand mark and "Loading…" so the first paint isn't blank. React replaces it on mount.

### `src/main.jsx`

```jsx
import "./styles.css";
import "./lib/log.js";          // installs global error hooks before anything else runs
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);
```

### `.gitignore` (key entries)

`node_modules/`, `dist/`, `.vite/`, `*.local`, `.env` and `.env.*` (but keep `!.env.example`), logs, `coverage/`, `pwa/cypress/{videos,screenshots,downloads}/`, `.DS_Store`, editor folders.

---

## 4. Source organization

### `components/`

- One component per file, file named after the component (`ItemCard.jsx` exports `ItemCard`).
- **Named exports only**, collected in a single `export { X };` at the bottom of the file.
- Kinds of components, by naming suffix:
  - `…View` — a top-level screen reached from the bottom tab bar.
  - `…Modal` — centered dialog (bottom sheet on phones).
  - `…Sheet` / `…Drawer` — slide-up panel for actions or detail.
  - `…Card` — a tile in a grid or list.
  - Small primitives with plain names: `Chip`, `RemovableChip`, `SectionLabel`, `SortMenu`, `FilterRow`.
  - The brand mark is its own component.
- Props are plain values and callbacks (`onClose`, `onSave`, `onFile`). No context providers unless state is genuinely global.
- Overlay components call `useBodyScrollLock()` and `useBackButton(true, onClose)` at the top.

### `lib/`

Non-visual modules, each with one job. The standard set:

| Module | Purpose |
|---|---|
| `constants.js` | Option lists, the `STORAGE_KEYS` map, backup format id, brand asset data URIs |
| `storage.js` | `lsGet` / `lsSet` (JSON, try/catch, quota handling), an IndexedDB blob store wrapper, object-URL cache, one-time migrations |
| `log.js` | Persisted diagnostics ring buffer + global error hooks (see §6) |
| `hooks.js` | Shared hooks: body scroll lock, install prompt, drag-reorder, etc. |
| `backNav.js` | Makes the device Back button close the top overlay (see DESIGN.md) |
| `backup.js` | Export everything to one JSON file; validate and import (merge or replace) |
| `icons.jsx` | Inline SVG `Icon` base + an `I` map of named icons (`<I.plus size={12} />`) |
| `images.js` | Resize/compress on upload, data URL ⇄ Blob helpers |
| `format.js` | Display formatting (dates, counts, sizes) |
| `share.js` | Web Share API with fallbacks |
| `<backend>.js` + `cloudSync.js` | Optional cloud client, created only when env vars are present; sync functions no-op otherwise |

Each module groups related code under a divider comment: `// --- Section name ---------------------------------`.

### `App.jsx`

The root component owns:

- Current view (a `useState` string; there is no router).
- All persisted collections as state, loaded once on mount.
- Which overlays are open.
- Theme state, mirrored to `document.documentElement.dataset.theme` and localStorage.
- Persistence: an effect per collection writes back with `lsSet` after load completes.
- First-run gates: seed, migrations, and splash dismissal, each tracked by its own flag key.

Child views receive data and callbacks as props.

---

## 5. Data and persistence conventions

- **Storage keys** are namespaced and versioned: `"<app>:<thing>:v1"`, listed in one `STORAGE_KEYS` object. Never inline a key string elsewhere.
- **Small structured data → localStorage** as JSON via `lsGet(key, fallback)` / `lsSet(key, value)`. Both swallow exceptions; a write that fails on quota shows one alert per session and logs an error.
- **Binary data → IndexedDB**, a single object store keyed by the owning record's id, values are `Blob`s. Ask for persistent storage (`navigator.storage.persist()`) on first load.
- **Every record has a string `id`.** Order of an array is meaningful (user reorder is stored as array order).
- **Migrations** are one-time functions that run on load, guarded by a `"<app>:<migration>:v1"` flag key that is set when they finish. Legacy keys are read for the migration (and for old backups) and kept until it's safe to remove them. A migration must be safe to run twice.
- **Backups** are a single JSON object: `{ format: "<app>-backup-v1", exportedAt, counts, data: { ... } }`, with blobs converted to data URLs at the boundary. Import validates `format`, offers **merge** (add by id, keep existing) or **replace** (with `confirm()`), and accepts older backup shapes by translating them on the way in.
- **Optional cloud mirror** (if used): build-time `VITE_*` env vars; anonymous per-device auth; metadata as one JSON row per user; blobs as one storage object per id. Pushes are debounced. On load, re-download anything the device lost. Never commit `.env.local`; CI reads the values from repository secrets.

---

## 6. Logging

`lib/log.js` exports `Log` with `info`, `warn`, `error`, `entries()` and `clear()`.

- Each entry is `{ t: ISO timestamp, level, event, data? }`, stored in a localStorage ring buffer capped at ~200 entries and mirrored to the console as `[<app>] <event>`.
- `Error` objects are flattened to `{ name, message, stack }` so they survive JSON.
- It installs `window.error` and `unhandledrejection` listeners once.
- The buffer can be viewed and copied from a screen inside the app (e.g. the Backup screen), because problems on a phone happen where devtools aren't available.

Event names are dotted `area.action` or `area.action.outcome`, with a small data object:

```js
Log.info("load", { items: 42, photos: 40 });
Log.warn("load.photosMissing", { count: 2 });
Log.error("putImage.failed", { id, error: String(e) });
Log.info("cloud.healed", { photos: 3 });
```

Log data changes (load summaries, migrations, imports, sync results) and every failure, including partial ones. Don't log routine reads or no-op steps.

---

## 7. Testing

End-to-end only, with Cypress driving the real app against the Vite dev server.

### `pwa/cypress.config.js`

```js
import { defineConfig } from "cypress";
import { readdirSync } from "node:fs";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: "cypress/support/e2e.js",
    fixturesFolder: "cypress/fixtures",
    downloadsFolder: "cypress/downloads",
    viewportWidth: 390,     // mobile-first: test at a phone viewport
    viewportHeight: 844,
    video: false,
    retries: { runMode: 1, openMode: 0 },
    setupNodeEvents(on) {
      on("task", {
        listDownloads(dir) {
          try { return readdirSync(dir); } catch { return []; }
        },
      });
    },
  },
});
```

### Conventions

- **One spec per feature area** (`backup.cy.js`, `navigation.cy.js`, …). Each opens with a one-line comment listing what it covers.
- **Select by `data-testid` only**, never by class or text that might change. Test ids are kebab-case `area-thing` (`nav-home`, `menu-backup`, `backup-modal`, `backup-close`, `add-item-file`). Add a test id to every control a test touches.
- **Deterministic state through `cy.gotoApp(state)`**, defined in `support/commands.js`. It calls `cy.visit("/")` with an `onBeforeLoad` that:
  1. clears localStorage and deletes the IndexedDB database;
  2. sets every first-run/migration/splash flag so the app boots straight to the main screen (unless `skipGating: true` is passed to test those flows);
  3. writes the requested collections to their storage keys;
  4. stubs browser APIs missing in headless Electron (e.g. `navigator.share`);
  5. then waits for the app shell (a nav test id) to appear.
- Other standard commands: `cy.uploadPhoto(testid, fixture)` (uses `selectFile` with `force`), `cy.seedImages({ id: dataUrl })` (writes IndexedDB directly, then reloads), `cy.confirmDialogs(accept)` (answers native `confirm()`), `cy.tab(name)`.
- Small data builders at the top of a spec (`const record = (id, name) => ({ ... })`) and a `readX()` helper that reads back from localStorage to assert what was persisted.
- `support/e2e.js` ignores only known headless-only exceptions (by message regex) and rethrows everything else.
- Fixtures include a real decodable image and both a valid and an invalid import file.

### Running

```sh
npm run test:e2e                                        # headless; what CI runs
npm run cypress:open                                    # interactive; run `npm run dev` first
npm --prefix pwa run cypress:run -- --spec cypress/e2e/backup.cy.js   # one spec
```

---

## 8. Deployment and releases

### Branch and PR flow

1. Work on a short-lived feature branch.
2. Open a pull request into `main`. `e2e.yml` runs the suite.
3. Merge. Pushing to `main` triggers `deploy.yml`: run the e2e suite as a gate, then build and publish `pwa/dist/` to GitHub Pages. A failing suite blocks the deploy.
4. To cut a numbered release, run `npm run release` from `main`.

### `release.sh`

```bash
#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

# Next version from the latest vN tag.
latest=$(git tag --sort=-v:refname | grep -E '^v[0-9]+$' | head -1)
if [ -z "$latest" ]; then
  next=1
else
  next=$(( ${latest#v} + 1 ))
fi
version="v$next"
echo "Releasing $version..."

( cd pwa && npm run build )      # fail fast if it doesn't build

git add -A
if git diff --cached --quiet; then
  echo "No changes to commit — tagging current HEAD as $version."
else
  git commit -m "$version"
fi
git tag "$version"
git push
git push --tags
echo "Done — $version pushed and tagged."
```

Versions are plain increasing integers (`v1`, `v2`, …), not semver. Pushing the tag triggers `release.yml`.

### Workflows

All three use `actions/checkout@v4`, `actions/setup-node@v4` with `node-version: 22`, `cache: npm`, `cache-dependency-path: pwa/package-lock.json`, and run `npm ci` with `working-directory: pwa`.

- **`e2e.yml`** — `on: pull_request` and `workflow_dispatch`. Runs `npm run test:e2e`; on failure uploads `pwa/cypress/screenshots` as an artifact.
- **`deploy.yml`** — `on: push` to `main` and `workflow_dispatch`. Permissions `contents: read`, `pages: write`, `id-token: write`; `concurrency: { group: pages, cancel-in-progress: true }`. Job `test` runs the suite; job `deploy` (`needs: test`) builds with any `VITE_*` values from secrets, then `configure-pages@v5` → `upload-pages-artifact@v3` (path `./pwa/dist`) → `deploy-pages@v4`.
- **`release.yml`** — `on: push: tags: ["v*"]`, permission `contents: write`. Builds, zips `pwa/dist` to `<app>-pwa-<tag>.zip`, and publishes it with `softprops/action-gh-release@v2` and `generate_release_notes: true`.

### One-time GitHub setup

- Settings → Pages → Source: **GitHub Actions**.
- Custom domain under Settings → Pages, with a matching `pwa/public/CNAME` so it's re-published every deploy.
- Any `VITE_*` build values as repository secrets.

### Updating installed copies

With `autoUpdate`, installed apps fetch a new version in the background and switch to it on the next launch. Document in the README how to force it (close and reopen, or clear the app's cache) and that this does not erase user data.

---

## 9. Code style

- 2-space indent, double quotes in app code, semicolons, trailing commas (Prettier defaults).
- Function components declared with `function Name(props)`; small helpers as `const` arrows.
- Tailwind classes inline in JSX. Conditional classes via template literals. Variant styling via a `tones` / `toneMap` object keyed by variant name (see DESIGN.md).
- Classes built at runtime (e.g. `` `bg-${tone}-50` ``) must be covered by an `@source inline(...)` safelist in `styles.css`.
- Wrap every browser storage and platform API call in `try/catch`; fail soft and log.
- Comments are short and say what something does and why it is shaped that way, especially for browser quirks. Each `lib` module starts with a short block explaining its purpose and constraints.
- Native `confirm()` for destructive actions, native `alert()` only for rare hard failures (e.g. storage full).

---

## 10. Documentation

- **Root `README.md`:** one-paragraph description; annotated directory tree; Deploying; GitHub Actions setup; Local development with a command table; Testing; Updating an installed app; What lives where (which data is stored where, and that nothing leaves the device unless sync is on); Known constraints (iOS install quirks, storage limits).
- **`pwa/README.md`:** app-level layout, develop/test commands, storage details, offline behavior.
- **Planning docs** for larger efforts go at the repo root as `TOPIC_PLAN.md`.
- Keep the READMEs accurate when tooling changes (for example, the Tailwind config location).

---

## 11. New-project checklist

- [ ] Create the repo with the layout in §2; copy the root `package.json`, `release.sh` (make it executable), `.gitignore` and the three workflows.
- [ ] `npm create vite@latest pwa -- --template react`, then add Tailwind v4, `vite-plugin-pwa`, Cypress and `start-server-and-test`.
- [ ] Fill in `vite.config.js` manifest values and `index.html` meta tags, fonts and pre-paint theme script.
- [ ] Generate icons into `pwa/public/icons/` (16–512 px, maskable, apple-touch, favicon) from one source mark.
- [ ] Write `styles.css` from the token template in DESIGN.md.
- [ ] Add `lib/constants.js`, `storage.js`, `log.js`, `hooks.js`, `backNav.js`, `icons.jsx`, `backup.js`.
- [ ] Build the app shell: sticky header with menu, bottom tab bar, one placeholder view, Backup modal.
- [ ] Add `cypress/support/commands.js` with `gotoApp`, and a first `navigation.cy.js` spec.
- [ ] Turn on GitHub Pages (Actions source), add the custom domain and `CNAME`.
- [ ] Open a PR to confirm `e2e.yml` passes, merge, confirm the deploy.
