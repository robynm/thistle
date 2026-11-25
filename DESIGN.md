# Thistle design

Thistle's own visual rules. `project-template/DESIGN.md` is the general starting template. Where the two disagree, this file wins: Thistle is cleaner and flatter than the template.

## Principles

- **Clean and minimal.** White page, grey blocks, no borders on cards, no shadows except on floating menus and modals.
- **One accent.** Sunflower yellow marks the main action on each screen and the active tab. Nothing else is yellow.
- **Color means step kind.** Work, Rest, Warm-up and Cool-down each have a color. It appears only where it tells you something: the bar on a timer card, the kind picker in the editor, and the run screen.
- **Light by default**, with a dark theme (Dusk) in the ⋯ menu.

## Color

All colors are semantic CSS variables in `pwa/src/styles.css`, exposed as Tailwind colors.

| Token | Thistle (light) | Dusk (dark) | Use |
|---|---|---|---|
| `bg` | `#FFFFFF` | `#131210` | Page, modals, run screen |
| `surface` | `#F4F3EF` | `#1F1E1A` | Cards, inputs, secondary buttons |
| `surface-2` | `#EBE9E3` | `#2A2924` | Pressed state |
| `ink` | `#17160F` | `#F4F2EC` | Text |
| `muted` | `#6F6B62` | `#A09C92` | Secondary text, idle icons |
| `faint` | `#A8A49B` | `#6B675F` | Placeholders |
| `line` | `#ECEAE4` | `#2A2925` | Hairline dividers |
| `brand` | `#FFC629` | same | Primary buttons, active tab |
| `on-brand` | `#17160F` | same | Text and icons on any bright fill |

**Text on yellow and on step colors is always dark** (`on-brand`), never white. This keeps the yellow bright and still passes WCAG AA.

### Step kinds

Each kind has three tokens: a fill, an `-ink` text color that's readable on `bg`, and a `-soft` tint.

| Kind | Fill | `-ink` (light) | Where |
|---|---|---|---|
| `work` | `#FF5E4F` coral | `#C93A2D` | |
| `rest` | `#2FCB7E` green | `#17804B` | also success ("Done") |
| `warmup` | `#A08CFF` violet | `#6A4FE0` | |
| `cooldown` | `#45B3FF` sky | `#1A6FB0` | |
| `ready` | `#FFC629` sunflower | `#8A6500` | get-ready countdown |

Use a fill with `on-brand` text on top (the kind picker, the pause button), the fill alone for graphics (ring, card bar), and `-ink` for colored text on the page.

## Type

- **Inter** for text and controls; **Inter Tight** (`font-display`) for titles, timer names and the countdown.
- Sentence case everywhere. The only uppercase text is the step kind label on the run screen.
- Scale in use: view title 28px bold; modal title 24px bold; card title 16px semibold; body 14–16px; secondary 12px `muted`.
- Use `tabular` on anything with changing digits.

## Shape and spacing

- Cards and blocks: `bg-surface`, radius 18–20px, no border.
- Buttons are pills (`rounded-full`). Shared styles are in `pwa/src/lib/ui.js`: `primary`, `secondary`, `icon`, `input`, `label`.
- Lists inside a block (Quick start fields, History) are split by `divide-line` hairlines, not boxed separately.
- Tap targets are at least 36px; main controls on the run screen are 56–80px.
- Press feedback is a light `active:scale-[0.97]` or a `surface-2` fill. Motion is limited to `fade-up` (modals) and `pop` (brand mark, finish check).

## Screens

- **Header:** the view title and a short subtitle, the view's one action (Timers: **New**), and ⋯. No logo.
- **Bottom nav:** icon plus label. The active tab gets a yellow pill behind its icon.
- **Reordering:** anything that can be reordered has a ⠿ grip (`DragGrip`) at its left. Drag only from the grip, so taps and scrolling elsewhere behave normally. The item being dragged lifts with a shadow.
- **Lists:** timers with no list come first, with no header. Each list is a section with a grip, a chevron, its name, a count and an edit button. Lists start collapsed.
- **Run screen:** follows the theme (white in Thistle). Holding the background for 1 second exits without asking: a pale yellow pill at the top fills while you hold. A faint "Hold anywhere to exit" line under the controls explains it. The kind label, the countdown ring and the pause button take the current step's color. The ring empties as the step runs down. Overall progress is a thin bar above the controls.
- **Modals:** a bottom sheet on phones, with the title and × at the top. Actions sit in a footer separated by a hairline.
