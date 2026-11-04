# Theming COMMANDER

The client has a swappable theme system. A theme is **a folder in `client/src/themes/` plus one line
in `registry.ts`**. Components never look at the theme id: they read class _recipes_, a portrait
component, a background component and motion timings from the active `ThemeDefinition`
(`useTheme()`). Switching a theme at runtime swaps classes only, so a running game is never
remounted.

Three themes ship, and all three support the whole game (landing, world select, chapter intro,
game, chapter result, mission report), mobile and desktop layouts, `prefers-reduced-motion` and the
Moon and Mars world accents:

| Theme                         | Folder                 | Look                                                                   |
| ----------------------------- | ---------------------- | ---------------------------------------------------------------------- |
| `neo-brutalist` (the default) | `themes/neo-brutalist` | Faithful port of the prototype: thick ink borders, hard offset shadows |
| `minimal`                     | `themes/minimal`       | Clean, light and dark aware, Inter, hairlines, soft shadows            |
| `holo-hud`                    | `themes/holo-hud`      | Spacecraft HUD: glass panels, neon glow, brackets, scanlines           |

**`neo-brutalist` is the canonical example.** When this document says "see the reference theme",
open `client/src/themes/neo-brutalist/`.

## 1. How a theme is built

```
client/src/themes/
  types.ts            ThemeDefinition, ThemeClasses (the contract, TSDoc on every key)
  registry.ts         THEMES: the single list (the first entry is the default)
  ThemeProvider.tsx   ThemeProvider, useTheme(), useWorldAccent(), resolveInitialTheme()
  <id>/
    tokens.css        every raw colour / font / border width / radius / shadow / easing (--t-*)
    worlds.css        optional: per-world accent classes (neo keeps them at the end of tokens.css)
    motion.css        optional: theme-specific keyframes (shared ones are in styles/motion.css)
    recipes/*.ts      Tailwind class recipes, split by area (shared, game, report)
    portraits.tsx     <Portrait character={...} />
    Background.tsx    <Background world phase />
    theme.ts          assembles the ThemeDefinition and imports fonts + CSS
client/src/styles/
  index.css           Tailwind entry: maps --t-* tokens to Tailwind names (@theme inline)
  motion.css          shared keyframes (they only read tokens)
```

Design rules (spec section 7.1):

1. **Tokens only.** Every colour, font, border width, radius, shadow and motion value is a CSS
   variable `--t-*` declared in the theme's CSS. `.ts` and `.tsx` files contain no hex colours and no
   font names. (The one exception: portraits may use per-character colours that come from
   `characters.json`.) A unit test enforces this for every registered theme.
2. **Tailwind utilities.** `styles/index.css` maps tokens to Tailwind names, so recipes are plain
   utility strings: `bg-surface text-ink border-bw border-line shadow-panel font-display`.
3. **State comes from `data-*` attributes.** Components expose state and recipes style it with
   data variants (`data-[highlighted=true]:bg-accent`, `group-data-[state=low]/res:text-warn`).
4. **The layout is shared.** The responsive grid lives in `screens/GameScreen.tsx`; themes skin its
   parts and never change the grid.
5. **No theme-id checks in components**, ever.

## 2. Design tokens (`--t-*`)

Declare all of them under the theme's root class (for example `.theme-minimal`). The test
`test/themes-contract.test.tsx` fails if a token that `styles/index.css` reads is missing.

### Colours (Tailwind: `bg-*`, `text-*`, `border-*`, `fill-*` ...)

| Token                 | Tailwind name | Meaning                                                    |
| --------------------- | ------------- | ---------------------------------------------------------- |
| `--t-bg`              | `bg`          | Page background (also `<body>`)                            |
| `--t-surface`         | `surface`     | Panels, cards, buttons                                     |
| `--t-surface-2`       | `surface-2`   | Raised or secondary surface (deck cards, chips)            |
| `--t-well`            | `well`        | Recessed areas: bar tracks, input wells, stat boxes        |
| `--t-ink`             | `ink`         | Primary text and strong lines                              |
| `--t-muted`           | `muted`       | Secondary text, captions                                   |
| `--t-copy`            | `copy`        | Body copy (a little softer than ink)                       |
| `--t-placeholder`     | `placeholder` | Input placeholder                                          |
| `--t-line`            | `line`        | Hairlines, dividers, quiet borders                         |
| `--t-edge`            | `edge`        | Strong outline colour (neo: black; minimal: hover borders) |
| `--t-on-accent`       | `on-accent`   | Text on `accent`, `good`, `bad`, `aria` fills              |
| `--t-on-ink`          | `on-ink`      | Text on `ink` fills                                        |
| `--t-on-ink-soft`     | `on-ink-soft` | Secondary text on `ink` fills                              |
| `--t-accent`          | `accent`      | Brand / world accent (overridden per world)                |
| `--t-accent-2`        | `accent-2`    | Second accent (overridden per world)                       |
| `--t-good`, `--t-bad` | `good`, `bad` | Positive / negative tones                                  |
| `--t-warn`            | `warn`        | Low-resource warning                                       |
| `--t-aria`            | `aria`        | The ARIA assistant (button, bubble)                        |
| `--t-cell`            | `cell`        | Timeline cell (default)                                    |
| `--t-cell-lit`        | `cell-lit`    | Timeline: daylight                                         |
| `--t-cell-dark`       | `cell-dark`   | Timeline: lunar night                                      |
| `--t-cell-storm`      | `cell-storm`  | Timeline: dust storm                                       |
| `--t-art-shade`       | `art-shade`   | Shade under the portrait in the card art area              |
| `--t-veil-night`      | `veil-night`  | Scene tint during lunar night                              |
| `--t-veil-storm-tint` | `veil-storm`  | Scene tint during a dust storm                             |

Two colours are **not** tokens but per-element inline variables set from content, available as
Tailwind names: `speaker` (`--c`, the character's colour, `bg-speaker`, `text-speaker`) and
`resource` (`--rc`, the resource colour, `bg-resource`). Opacity modifiers work on every colour
(`bg-accent/15`, `border-resource/60`).

### Type, shape and focus

| Token                                             | Tailwind name                   | Meaning                                                                              |
| ------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------ |
| `--t-font-display`                                | `font-display`                  | Headings, big numbers                                                                |
| `--t-font-mono`                                   | `font-mono`                     | Telemetry, copy (neo)                                                                |
| `--t-font-pixel`                                  | `font-pixel`                    | Tiny labels and chips                                                                |
| `--t-font-body`                                   | `font-body`                     | Default body font                                                                    |
| `--t-bw`, `--t-bw-sm`, `--t-bw-lg`, `--t-bw-hair` | `border-bw`, `border-bw-sm` ... | Border widths (also `border-t-bw`, `border-b-bw`, `border-l-bw-sm`, `outline-bw-sm`) |
| `--t-marker-size`                                 | (used in recipes)               | Size of the timeline supply marker                                                   |
| `--t-radius`                                      | `rounded-box`                   | Corner radius of boxes (neo `0`, minimal `14px`)                                     |
| `--t-radius-round`                                | `rounded-pill`                  | Fully round shapes (circles, pills)                                                  |
| `--t-focus-outline`, `--t-focus-offset`           | (global `:focus-visible`)       | Keyboard focus ring                                                                  |

### Shadows (Tailwind `shadow-*`)

The names come from the neo-brutalist theme; other themes re-purpose them. Keep the name, change the
value: `panel`, `notes`, `hard`, `hard-hover`, `hard-press`, `hard-xs`, `option`, `option-hover`,
`option-press`, `line`, `line-sm`, `accent-sm`, `world-selected`, `edge-sm`, `edge`, `edge-md`,
`edge-lg`, `edge-xl` map to `--t-shadow-<name>`. In practice: `panel`/`notes`/`option*` are resting
and hover elevations of boxes, `hard*` belong to buttons, `world-selected` marks the chosen world
card, and `edge-*` are for floating things (stickers, pops, menus, bubbles).

### Motion

Durations (`--t-dur-<name>`): `fast` (button press), `snap`, `pop` (preview dot, day badge),
`stamp` (card stamps), `bar` (resource fill), `ghost` (trail), `goal` (goal bar), `flip` (day
number), `deal` (new card), `world` (planet transition), `veil` (night / storm fade), `float` (value
pops), `sticker`, `ticker`, `twinkle`, `storm`, `alert`, `crit`, `shake`, `bubble`, `type` (new note),
`blink`. Easings (`--t-ease-<name>`): `bar`, `deal`, `snap`, `float`, `sticker`, `fly` (the card's
fly-out, applied inline by `Card`). Tailwind animation names built on them: `animate-twinkle`,
`storm`, `ticker`, `flip`, `alert`, `crit`, `shake`, `pop`, `deal`, `sticker`, `bubble`, `type`,
`blink`. Keyframes shared by all themes live in `styles/motion.css`; a theme that wants different
motion adds its own keyframes in `<id>/motion.css` and uses `animate-[my-keyframes_var(--t-dur-x)_...]`.

### Optional, theme-private tokens

A theme can declare anything else it needs and read it with arbitrary values
(`[background:var(--t-planet-bg)]`, `shadow-(--t-my-glow)`). Examples: neo's grain and halftone
tokens, minimal's `--t-on-resource` and `--t-fill-edge`, holo's `--t-brackets`, `--t-clip-cut`,
`--t-scanlines` and `--t-grid-*`. Per-world artwork follows the same pattern
(`--t-planet-bg`, `--t-sat-bg`, `--t-disc-bg`, `--t-sat-size`, ...), set by the world classes.

### World classes

`worldTokens: { moon: 'world-moon', mars: 'world-mars' }`. The provider puts the active world's class
on `<html>`; the world cards also put it on themselves to scope their own accent. A world class must
therefore **redeclare every world-dependent token**: the accent pair, the artwork tokens and every
token derived from the accent through `var()` (a custom property that references `--t-accent` is
resolved where it is declared, so a card scoped to another world does not see the new accent unless
the derived token is declared again inside the world class; holo-hud does this for its glow and
`--t-shadow-world-selected`). Use unique class names per theme (`world-minimal-moon`,
`world-holo-mars`); the contract test checks uniqueness across the registry.

## 3. The `ThemeDefinition` object

```ts
interface ThemeDefinition {
  id: string; // used in ?theme= and localStorage; also the folder name by convention
  name: string; // shown in the settings menu
  tokensClass: string; // root class on <html> that declares every --t-* token
  worldTokens: Record<WorldId, string>; // per-world accent classes
  classes: ThemeClasses; // the recipes below
  Portrait: ComponentType<{ character: CharacterDef }>;
  Background: ComponentType<{ world: WorldId | null; phase: { night: boolean; storm: boolean } }>;
  motion: { cardDealMs: number; flyOutMs: number; stickerMs: number };
}
```

`motion` paces JS-driven timing: `flyOutMs` is how long playback waits for the card fly-out,
`stickerMs` is how long a sticker occupies the queue, `cardDealMs` mirrors your deal animation.
Keep them in step with the CSS durations. The compiler enforces that every key of `ThemeClasses` is
present; `types.ts` has a TSDoc comment per key.

### Recipes (`classes`) and the state attributes that drive them

Every value is a string of Tailwind classes. Several recipes are combined by components with
`cx()` (no class merging), so **do not put conflicting utilities in a recipe and its parent**: for
example `panel` must not set padding if `time.root` does.

| Key                                                                                                                                                   | Styles                                                                                                                          | State attributes                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `panel`                                                                                                                                               | Boxed surface: time panel and the resources panel                                                                               |                                                                                                                                                                                                  |
| `heading`, `label`                                                                                                                                    | Section heading, small caption / eyebrow                                                                                        |                                                                                                                                                                                                  |
| `button.primary`, `button.secondary`                                                                                                                  | Buttons                                                                                                                         | `:disabled`                                                                                                                                                                                      |
| `field`                                                                                                                                               | Callsign input                                                                                                                  |                                                                                                                                                                                                  |
| `chip`                                                                                                                                                | Status chips (chapter, decision, night in N ...)                                                                                | `data-hot="true\|false"`                                                                                                                                                                         |
| `sticker.{neutral,good,bad,time}`, `stickerDetail`                                                                                                    | Fixed centre-screen sticker per tone (must animate itself) and its second line                                                  |                                                                                                                                                                                                  |
| `offlineChip`                                                                                                                                         | "OFFLINE" tag                                                                                                                   |                                                                                                                                                                                                  |
| `menu.{trigger,panel,title,item}`                                                                                                                     | Gear button and theme list                                                                                                      | item `data-active`                                                                                                                                                                               |
| `landing.{root,eyebrow,title,titleAccent,subtitle,subtitleMark,form,credit,ticker,tickerTrack}`                                                       | Title screen                                                                                                                    |                                                                                                                                                                                                  |
| `select.{root,worlds,world,worldDisc,worldLocation,worldName,specList,specTerm,specValue,selectedTag,difficulties,difficulty,difficultyHint,actions}` | World and difficulty selection                                                                                                  | `world`/`difficulty` `data-selected`; `selectedTag` uses `group-data-[selected=true]:`                                                                                                           |
| `chapter.{root,card,kicker,title,text,lesson,meta,stamp,actions}`                                                                                     | Chapter intro and chapter result                                                                                                | stamp `data-tone="good\|bad"`                                                                                                                                                                    |
| `time.{root,row,day,unit,number,preview,chips,chipExtra,aria,bubble,bubbleTitle,chapter,chapterKicker,chapterTitle,goal,goalBar,goalFill}`            | Time panel, ARIA button and bubble, chapter header, goal progress                                                               | preview `data-on`, aria `data-alert`                                                                                                                                                             |
| `timeline`, `timelineCell`                                                                                                                            | Timeline strip and its cells                                                                                                    | cell `data-tone="lit\|dark\|storm\|now"`, `data-past`, `data-now`, `data-supply`                                                                                                                 |
| `card.{stage,deck,root,enter,art,meta,tag,face,plate,plateRole,body,text,hint,stamp.left,stamp.right}`                                                | The draggable speaker card. `enter` is replayed for every new card; stamp opacity is set inline                                 | deck `data-depth="1\|2"`                                                                                                                                                                         |
| `option`, `optionTitle`, `optionBadge`                                                                                                                | The two choice buttons                                                                                                          | option `data-side="left\|right"`, `data-highlighted`; badge `data-long`                                                                                                                          |
| `resource.{wrap,header,list,root,icon,name,value,bar,fill,ghost,dot,pop.up,pop.down}`                                                                 | Resource meters. `root` is the Tailwind group `res`; the component sets inline `--v` (fill %), `--g` (ghost %), `--rc` (colour) | root `data-state="normal\|low\|critical"`, `data-hit="up\|down\|none"`; ghost `data-gain`; dot `data-state="off\|small\|big"`, `data-kind="certain\|uncertain"`, `data-tone="neutral\|up\|down"` |
| `notes`, `notesHeader`, `notesList`, `notesItem`                                                                                                      | Field notes                                                                                                                     | item `data-new`                                                                                                                                                                                  |
| `report.{root,stamp,title,text,stats,stat,statValue,statLabel,section,sectionTitle,badges,badge,list,board,boardRow,actions}`                         | Mission report                                                                                                                  | stamp `data-tone="win\|loss"`, badge `data-earned`, row `data-me`                                                                                                                                |

Responsive helpers available in every recipe: `desk:` (width at least 980px, the desktop layout),
`short:` (landscape phones, height at most 720px) and `tiny:` (width at most 370px).

### `Portrait` and `Background`

- `Portrait({ character })` returns an `<svg viewBox="0 0 120 120" aria-hidden="true">` (the card
  scales it to its container with `[&_svg]:size-full`). `character.kind` is `human`, `ai` or
  `earth`; humans carry `skin`, `hair`, `hairStyle` (`long short bun curly cap bald`), `hat`
  (`hard chef`), `glasses`, `headset` and `color`. Render these as React attributes, never as raw
  HTML. Several portraits can exist at once, so ids inside the SVG must come from `useId()`.
- `Background({ world, phase })` renders the full-screen scene. It sits beside the app (not
  inside it) and must be `aria-hidden`. `phase.night` and `phase.storm` should visibly change it
  (the shipped themes fade veils in with `data-active`). `world` is `null` on the landing page. A
  theme with no scene may render only veils. Fixed overlays that sit above the UI must be
  `pointer-events-none` and stay below the menu (`z-[60]`).

## 4. Adding a theme

Example: a theme called `retro`.

1. **Copy the folder.** `Copy-Item -Recurse client/src/themes/minimal client/src/themes/retro`
   (copy `neo-brutalist` if you want the hard-shadow structure instead, `holo-hud` for layered
   scenes). Use the folder name as the theme id.
2. **Rename the root class** in `tokens.css` (`.theme-retro`) and the world classes in `worlds.css`
   (`.world-retro-moon`, `.world-retro-mars`; names must be unique across themes).
3. **Change the tokens.** Keep every token name from section 2; change the values. If the theme
   has a light and a dark palette, switch the colour tokens in a `@media (prefers-color-scheme: dark)`
   block like `minimal/tokens.css` does.
4. **Fill the recipes** in `recipes/*.ts`. Start from the copied strings: most of the structure
   (data variants, `desk:` layout) can stay; change the look. Use only token-backed utilities.
5. **Write the portraits** in `portraits.tsx` and the **background** in `Background.tsx`.
6. **Assemble `theme.ts`:** `id`, `name`, `tokensClass`, `worldTokens`, `classes`, `Portrait`,
   `Background`, `motion`, and import the fonts and the CSS files there (section 6).
7. **Register it:** add one line to `client/src/themes/registry.ts`:
   `import { retro } from './retro/theme';` and append `retro` to `THEMES`.
8. **Test it.** `npm test -w @commander/client` runs `test/themes-contract.test.tsx` and
   `test/themes-runtime.test.tsx` against **every theme in the registry**: complete non-empty
   recipes, unique classes, all tokens declared, no hex or font names in TypeScript, portraits for
   all real characters (and safe against hostile data), backgrounds for each world and phase,
   `?theme=`, the settings menu, localStorage and no remount when switching mid-game.
9. **Look at it.** `npm run dev -w @commander/client`, open `/?fast&theme=retro` at about 390 px and
   1280 px and play a chapter: landing, world select (both worlds), chapter intro, a card with the
   timeline and resource bars, chapter result and the mission report. Switch themes from the gear
   mid-game. Emulate `prefers-reduced-motion`, and for a light/dark theme both colour schemes.
10. **Check the rest:** `npm run typecheck`, `npx eslint client`, `npx prettier --check client docs`.

Keep files small (about 200 lines): split recipes into several modules, as the shipped themes do.
Give every module a header comment and TSDoc on its exports.

## 5. Selecting a theme at runtime

- `ThemeProvider` resolves the initial theme: `?theme=<id>` first, then the id stored in
  `localStorage` under `commander.theme`, then the first entry of `THEMES`. Unknown ids are ignored.
- `?theme=` applies to that page load only and is **not** written to storage.
- The gear menu (`ThemeMenu`) lists `THEMES`. Choosing an entry calls `setThemeId`, which swaps the
  `<html>` class and the context value and stores the id.
- The provider keeps `theme.tokensClass` and, on screens that have a world, `theme.worldTokens[world]`
  on `<html>`. Nothing else in the DOM changes, so the game session, the card element and the timers
  survive a switch.
- `?fast` (unrelated to themes) removes every delay and is handy while styling.

## 6. Fonts

Fonts are bundled with `@fontsource/*` packages (no CDN, the game works offline). Each theme imports
the weights it needs in `theme.ts`, for example:

```ts
import '@fontsource/inter/latin-400.css';
import '@fontsource/orbitron/latin-700.css';
```

Import the `latin-<weight>.css` files unless you need other scripts: they ship one small `woff2`
per weight instead of every Unicode subset. Vite emits the font files with the build. Add the
package to `client/package.json` (all fonts used so far are already dependencies), then reference
the family only inside `tokens.css` (`--t-font-display: 'Inter', system-ui, sans-serif;`). Always
give a system fallback stack. Characters such as the arrows in button labels are not in Latin
subsets and fall back to a system font; that is expected.

## 7. Accessibility and motion expectations

- **Contrast.** Text needs at least 4.5:1 against its surface (3:1 for large text and UI
  boundaries), in **every** world and scheme: check `accent` on `surface`, `on-accent` on `accent`
  and `muted` on `surface` for moon and mars. Resource colours come from content (the colour of Crew
  Health is near white) and must stay readable on your bar track.
- **Focus.** Keep a visible `:focus-visible` ring (`--t-focus-outline`). `clip-path` clips outlines
  outside the box: on clipped elements use a negative offset (`focus-visible:outline-offset-[-4px]`),
  as `holo-hud` does.
- **Do not rely on colour alone.** Low and critical resources also change the value colour, the bar
  border and (critical) blink; selected items change shape or border, not only hue.
- **Reduced motion.** `styles/index.css` shortens every animation and transition to about 0 and
  runs animations once when `prefers-reduced-motion: reduce`. That is not enough for animations that
  end invisible (`forwards` stickers and pops) or that move content to its end position (the
  ticker, ambient loops), so give those `motion-reduce:animate-none` and, where needed, a static
  resting state (`motion-reduce:pl-4` on the ticker track). Keep decorative loops slow and subtle;
  never animate more than a few elements at once.
- **Targets and layout.** Interactive elements are at least 32 px (the gear is the smallest) and
  buttons and options are comfortably larger on mobile. Test at
  360 to 390 px: nothing may overflow horizontally. Do not put `transform`, `filter`, `backdrop-filter`
  or `clip-path` on a screen root: they would trap the `fixed` gear menu. Panels that contain
  dropdowns (the time panel holds the gear menu and the ARIA bubble) must not clip their overflow and
  need a `z-*` so they paint above the later panels; make dropdown surfaces opaque when the panel has
  `backdrop-filter`.
- **No grain or flashing.** Nothing may flash more than three times per second.

## 8. Known limits of the system

- Some shared names are neo-flavoured: the shadow names (`hard`, `edge`, ...) and Tailwind
  animations such as `animate-flip`, `animate-twinkle`, `animate-type` and `animate-alert` use
  `steps()` easing in `styles/index.css`. Duration is a token, the stepped easing is not. Themes that
  want smooth motion define their own keyframes (as `minimal` does for the day number, new notes, the
  card deal, stickers and pops).
- The deal / sticker / pop keyframes in `styles/motion.css` rotate and overshoot; use your own for a
  calmer look.
- `Card` flies out with inline `transform`/`transition` using `--t-ease-fly`, so a theme can only
  change its duration (`motion.flyOutMs`) and easing.

## 9. The shipped themes at a glance

| Aspect          | `neo-brutalist`                                      | `minimal`                               | `holo-hud`                                                                |
| --------------- | ---------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| Mood            | Loud, tactile, prototype-faithful                    | Calm, airy, editorial                   | Sci-fi cockpit, luminous                                                  |
| Scheme          | Dark only                                            | Light and dark (`prefers-color-scheme`) | Dark only                                                                 |
| Fonts           | Archivo Black, Space Mono, Silkscreen, Space Grotesk | Inter                                   | Orbitron headings, JetBrains Mono                                         |
| Borders         | 3 px solid ink, hard shadows                         | 1 px hairlines, soft shadows            | 1 px translucent cyan, neon glow, corner brackets                         |
| Corners         | Square                                               | Rounded (`14px`), pills for chips       | Square, chamfered buttons and options                                     |
| Surfaces        | Opaque                                               | Opaque soft neutrals                    | Translucent glass with `backdrop-blur`                                    |
| Resource bars   | Ticked blocks with a ghost trail                     | Thin capsules                           | Segmented glowing gauges                                                  |
| Portraits       | Chunky flat busts                                    | Initials avatar on a tinted disc        | Wireframe duotone hologram with scanlines                                 |
| Scene           | Dotted sky, pixel planet, grain, halftone            | Gradient wash, faint planet and specks  | Star field, perspective grid, rotating wireframe planet, scanline overlay |
| Night / storm   | Dark veil / red stripes                              | Gentle tints                            | Violet scanline veil / red colour shift                                   |
| Motion          | Stepped, snappy, big overshoot                       | Short fades                             | Glows, scan flicker, slow ambient loops                                   |
| World accents   | Moon cyan, Mars orange                               | Indigo base, moon teal, Mars rust       | Cyan + magenta, Mars orange + amber                                       |
| Reference files | `neo-brutalist/theme.ts`, `tokens.css`               | `minimal/tokens.css` (light and dark)   | `holo-hud/tokens.css`, `Background.tsx`                                   |
