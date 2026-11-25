# Design System

The visual language and interaction patterns for apps in this style: warm, playful, mobile-first, and tactile. Pair this with [SCAFFOLDING.md](SCAFFOLDING.md), which covers project structure, testing and deployment.

Names in angle brackets are placeholders. Pick a brand name for the primary color (a flower, a fruit, a mineral) and use it consistently as the Tailwind color name.

---

## 1. Personality

- **Warm and friendly, not corporate.** Rounded shapes, soft tinted shadows, a cream background instead of pure white, a characterful serif for headings.
- **Colorful with a system.** One bold brand color leads. Several accent hues each have a fixed meaning (a category of data, a tab, a kind of tag), so color helps people find things at a glance.
- **Tactile.** Everything you can tap shrinks slightly when pressed. Things enter with a gentle rise or a springy "bloom".
- **Phone first.** Designed at 390 × 844 and scaled up. The installed, full-screen app is the primary experience; the browser tab is a fallback.
- **Quiet chrome, rich content.** White header and tab bar, cream page, and the user's own content (photos, cards) carries the color.

---

## 2. Color

### Token architecture

All colors are CSS variables on `:root`, mapped into Tailwind with `@theme inline` so that utilities like `bg-<brand>-500` read the variable at runtime. A second theme overrides the same variables under `[data-theme="<alt>"]`, and every utility follows automatically, with no `dark:` variants in markup.

| Scale | Steps | Role |
|---|---|---|
| `<brand>` | 50–900 | Primary actions, active states, brand accents, focus rings |
| `cream` (surface) | 50–700 | Page background (50), subtle fills (100), borders and dividers (100–200) |
| `ink` (text) | 50–900 | Text: 900 headings, 800 body, 600–700 secondary, 400 muted/placeholder |
| 4–6 accent hues | 50–700 | Each assigned one meaning (a tab, a tag group, a status) |

Accent hues used in the reference app: a yellow, a green, a pink, a blue, a purple. Name them evocatively (`buttercup`, `leaf`, `petal`, `sky2`, `plum`) and avoid names that clash with Tailwind's built-in palette.

Rules:

- Build each scale so **50 is a tint for backgrounds, 100 for borders, 500 is the solid "active" fill (with white text), 600–700 is text on a 50 background.**
- Neutrals are warm (brown-tinted ink, peach-tinted cream), not gray. The alternate theme may swap them to cool slate.
- Shadows are tinted with the brand or a dark warm color, not black.

### `styles.css` template

```css
@import "tailwindcss";

/* Classes built at runtime (e.g. `bg-${tone}-50`) must be listed here. */
@source inline("{bg,text,border}-{<brand>,cream,ink,<accent1>,<accent2>,<accent3>}-{50,100,200,300,400,500,600,700,800,900}");

@theme inline {
  --color-<brand>-50: var(--<brand>-50);
  /* …one line per step per scale… */
  --shadow-brand:   var(--sh-brand);
  --shadow-card:    var(--sh-card);
  --shadow-card-hi: var(--sh-card-hi);
  --shadow-pop:     var(--sh-pop);
}

:root {
  /* --<brand>-50 … --<brand>-900, --cream-50 … , --ink-50 … , accents */
  --sh-brand:   0 12px 32px -12px rgba(<brand-500 rgb>, 0.45);
  --sh-card:    0 4px 16px -6px  rgba(<dark warm rgb>, 0.10);
  --sh-card-hi: 0 18px 36px -16px rgba(<dark warm rgb>, 0.20);
  --sh-pop:     0 8px 24px -8px  rgba(<dark warm rgb>, 0.18);
  --wash: radial-gradient(circle at 90% -10%, rgba(<brand rgb>,0.10), transparent 40%),
          radial-gradient(circle at -10% 110%, rgba(<accent rgb>,0.10), transparent 45%);
}

[data-theme="<alt>"] {
  /* same variable names, different values */
}

html, body, #root { height: 100%; margin: 0; padding: 0; background: var(--cream-50); }
body {
  font-family: '<Body font>', -apple-system, system-ui, sans-serif;
  color: var(--ink-800);
  -webkit-tap-highlight-color: transparent;
  overscroll-behavior-y: none;
}
.font-display { font-family: '<Display font>', Georgia, serif; }
.<brand>-wash { background-image: var(--wash); }
```

### Theme switching

- Theme is stored in localStorage and applied to `<html data-theme>` by an inline script in `index.html` **before first paint**, so there's no flash.
- Toggle lives in the header menu, labelled with the theme you'd switch *to*.
- Themes are named after a mood or season, not just "dark/light". Both are light-background palettes in the reference app; a true dark theme follows the same mechanism.

---

## 3. Typography

| Role | Font | Treatment |
|---|---|---|
| Display (app title, screen and section headings, card titles) | A soft, characterful serif with an optical-size axis (e.g. Fraunces) | `font-display font-bold`, `tracking-tight`, `text-ink-900` |
| Body and UI | A rounded sans (e.g. Nunito), weights 400–900 | `text-sm`, `text-ink-600`–`800` |
| Micro-label (chips, buttons, eyebrows, nav, badges) | Body font | `text-[10px]`–`text-[11px] font-bold uppercase tracking-[0.1em]`–`tracking-[0.25em]` |

Scale in use:

- App title: `text-2xl sm:text-3xl`, tagline beneath as a micro-label, hidden on phones.
- Modal title: `text-2xl sm:text-3xl`, preceded by an **eyebrow pill** (§5).
- Section heading: `text-xl` (via `SectionLabel`).
- Card title: `text-xs font-semibold` display font, truncated; meta line `text-[8px]`–`[9px]` micro-label in brand color.
- Empty-state text: `text-xs italic text-ink-400`.

Load both fonts from Google Fonts with `preconnect` and `display=swap`; the service worker caches them.

---

## 4. Shape, depth, and motion

### Shape

- **Pills everywhere for controls:** chips, buttons, badges, icon buttons are `rounded-full`.
- **Cards:** `rounded-2xl`, `bg-white`, `border-2 border-cream-100`, `shadow-card`.
- **Modals and sheets:** `rounded-3xl` (top corners only on phones: `rounded-t-3xl sm:rounded-3xl`).
- **Borders are 2px** (`border-2`) on interactive and container elements, which gives the chunky, friendly feel. Hairline `h-px bg-cream-100` dividers inside menus and lists.
- Square media: `aspect-square` with `object-contain` on a soft brand-to-cream gradient placeholder.

### Depth

| Shadow | Use |
|---|---|
| `shadow-card` | Resting cards, header |
| `shadow-card-hi` | Dropdown menus, bottom nav, hovered cards |
| `shadow-pop` | Active chips, solid buttons, badges |
| `shadow-brand` | The brand mark and the primary call to action |
| `shadow-2xl` | Modals |

Selection and drop targets: `border-<brand>-500 ring-4 ring-<brand>-500/25`.

### Motion

```css
@keyframes fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.fade-up { animation: fade-up .45s cubic-bezier(.2,.7,.2,1) both; }

@keyframes bloom { 0% { transform: scale(.6); opacity: 0; } 60% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); } }
.bloom { animation: bloom .55s cubic-bezier(.34,1.56,.64,1) both; }
```

- `fade-up` on modals, sheets and newly rendered cards.
- `bloom` (springy overshoot) on the brand mark, the loading screen and celebratory moments.
- **Press feedback on every tappable element:** `active:scale-95` (small controls), `active:scale-[0.98]` (cards), `active:scale-90` (tiny icon buttons).
- Card hover (desktop only): lift 3px and deepen the shadow.
- Long grids: `content-visibility: auto` with a `contain-intrinsic-size` on cards.
- Custom thin scrollbar with a translucent brand-colored thumb.

---

## 5. Components

### Chip (filter / tag)

Toggleable pill. Variant chosen by a `tone` prop that maps to the accent assigned to that kind of data.

```jsx
const tones = {
  default:  active ? "bg-<brand>-500 text-white border-<brand>-500 shadow-pop"
                   : "bg-<brand>-50 text-<brand>-700 border-<brand>-100",
  <kindA>:  active ? "bg-<accent1>-500 text-white border-<accent1>-500 shadow-pop"
                   : "bg-<accent1>-50 text-<accent1>-700 border-<accent1>-100",
  // one entry per kind of tag
};
<button className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-bold
  uppercase tracking-[0.1em] border-2 rounded-full transition-all active:scale-95 ${tones[tone]}`} />
```

**RemovableChip** is the active style plus a small round `×` button (`bg-white/25`, `aria-label="Remove filter"`), used to show applied filters above a list.

### SectionLabel

A small brand-colored dot, a display-font heading, an optional count pill (`bg-<brand>-50 text-<brand>-600` micro-label), and a hairline that fills the remaining width.

### Buttons

- **Primary:** `bg-<brand>-500 text-white rounded-full px-3.5 py-2` micro-label text, `shadow-pop`, `active:scale-95`, often with a leading 12px icon.
- **Secondary / icon button:** `w-9 h-9 rounded-full bg-cream-50 border-2 border-cream-100 text-ink-600`.
- **Upload target:** full-width `border-2 border-dashed border-<brand>-200 bg-<brand>-50/50 rounded-3xl py-8`, a round tinted icon, and a micro-label caption.
- Context-specific header action: the current view can place one primary button in the header; its color follows that view's tab color.

### Cards

White, `rounded-2xl`, `border-2 border-cream-100`, `shadow-card`, `overflow-hidden`. Media on top, then a `border-t-2 border-cream-100` footer with a display-font title and a micro-label meta line. Overlay controls (select checkbox, drag handle) are small white circles with `shadow-card` in the corners.

### Modal

```
fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6
├─ backdrop: absolute inset-0 bg-ink-900/40 backdrop-blur-sm   (click closes)
└─ panel:    relative bg-white w-full sm:max-w-lg max-h-[85vh] overflow-y-auto
             rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl fade-up
             data-testid="<name>-modal"
    ├─ close button top-right (data-testid="<name>-close")
    ├─ eyebrow pill: inline-flex gap-2 px-3 py-1 bg-<brand>-50 rounded-full
    │                12px icon + text-[10px] tracking-[0.2em] uppercase text-<brand>-700
    ├─ title (display font)
    ├─ one-line friendly explanation (text-sm text-ink-600)
    └─ content / actions
```

On phones it is a bottom sheet; from `sm` up it is a centered dialog. Every overlay locks body scroll and registers with the Back-button stack (§6).

### Dropdown menu

Opened from the header's `⋯` button. A full-screen transparent click-catcher at `z-40`, then the panel at `z-50`: `absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-card-hi border-2 border-cream-100 min-w-[180px]`. Rows are `px-4 py-3 text-sm font-bold text-ink-700 active:bg-cream-50` with a 15px leading icon, separated by inset hairlines.

### Icons

Inline SVG, Lucide-style: 24×24 viewBox, `stroke="currentColor"`, round caps and joins, default stroke 2. One `Icon` base component, and an `I` object of named icons (`<I.plus size={12} />`). Icons inherit color from text classes. Copy path data for only the icons you use rather than installing an icon package.

---

## 6. Layout and navigation

### App shell

```
┌─────────────────────────────────────┐
│ HEADER  sticky top-0 z-30 bg-white  │  brand mark (brand-colored circle) + display title
│         border-b shadow-card        │  right: [view action button] [⋯ menu]
├─────────────────────────────────────┤
│                                     │
│  MAIN   bg-cream-50 + wash gradient │  max-w-6xl mx-auto px-4 sm:px-6
│         bottom padding clears nav   │
│                                     │
├─────────────────────────────────────┤
│ BOTTOM NAV  fixed bottom-0 z-40     │  3–4 tabs, grid-cols-N, icon only
│ bg-white border-t shadow-card-hi    │  padding-bottom: env(safe-area-inset-bottom)
└─────────────────────────────────────┘
```

- **No router.** The current view is a state string in the root component. Tabs switch it.
- **Bottom tabs** are icon-only (with `aria-label`). Each tab has its own accent color: the active tab shows a soft tinted pill behind it and a solid round icon well with a white icon; inactive tabs are `text-ink-400`. An optional count badge sits on the icon's corner.
- The header menu holds app-level actions: theme toggle, stats/about, backup & restore, sync status.
- Content width caps at `max-w-6xl`; grids go from 2–3 columns on phones to more on wider screens.

### Safe areas

In `@layer base` (so Tailwind padding utilities still win), pad `header`, `main` and `footer` with `env(safe-area-inset-*)`. The bottom nav pads itself with `safe-area-inset-bottom`.

### Device Back button

Since there's no router, Android's Back button would exit the app. `useBackButton(open, onClose)` keeps one throwaway history entry while any overlay is open; Back closes the top-most overlay, one at a time, before it is allowed to leave the app. Every modal, sheet, drawer and menu uses it.

---

## 7. Lifecycle screens

- **Loading:** static HTML in `index.html` (brand mark with `bloom`, "Loading…" micro-label on cream) so the first paint is never blank.
- **Splash / landing:** shown once to visitors in a browser tab (not the installed app). Brand mark, tagline, 3 feature rows (round tinted icon + title + one line), a primary **Install** button, and a quiet "continue in browser" link. Uses the native install prompt when available; otherwise shows platform-specific steps (iOS: Share → Add to Home Screen). The dismissal is remembered.
- **Install banner:** a slim strip above the header when install is possible but the splash was dismissed.
- **Empty states:** a short, friendly italic line in `text-ink-400` that says what to do next ("No items yet — tap + to add one").

---

## 8. Copy and tone

- Second person, short, warm: "Pick from your gallery or snap a new photo. We'll resize it to save space."
- Name things with the app's own vocabulary and keep it consistent across tabs, headings and buttons.
- Micro-labels are 1–3 words, uppercase via CSS (write them in sentence case in source).
- Destructive actions confirm with a native `confirm()` that names what will be lost. Success shows as an inline banner in the relevant modal rather than a toast.
- Explain storage plainly: what stays on the device, how to back up, what clearing browser data does.

---

## 9. Accessibility and testability

- Icon-only buttons get an `aria-label`.
- Tap targets are at least 36px (`w-9 h-9`); primary nav icons are 44px (`w-11 h-11`).
- Text on accent fills uses the 500 step with white; text on tints uses 600–700.
- Every interactive element and every modal root gets a kebab-case `data-testid` (`<area>-<thing>`); tests select only by these.
- `-webkit-tap-highlight-color: transparent` and `overscroll-behavior-y: none` on `body` so the app feels native rather than like a web page.

---

## 10. Brand assets

- One square source mark (SVG and a transparent PNG) at the repo root.
- Exported icon set in `pwa/public/icons/`: 16, 32, 64, 128, 192, 256, 512, 1024, a maskable 512 with safe padding, `apple-touch-icon.png`, `favicon.png`.
- Manifest `theme_color` = brand 500; `background_color` = cream 50.
- In the header, the mark sits in a small brand-colored circle with `shadow-brand`.
- A standalone `themes-preview.html` at the repo root is a useful place to try out palette changes before putting them into `styles.css`.
