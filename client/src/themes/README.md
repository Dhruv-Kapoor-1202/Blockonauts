# COMMANDER themes

A theme is **a folder plus one line in `registry.ts`**. Components never look at the theme id;
they read class recipes, a portrait component, a background component and motion timings from the
active `ThemeDefinition` (`useTheme()`), so any theme can drive the whole game.

```
themes/
  types.ts            ThemeDefinition, ThemeClasses (the contract, with TSDoc per key)
  registry.ts         THEMES: the single list (first entry is the default)
  ThemeProvider.tsx   ThemeProvider, useTheme(), useWorldAccent(), resolveInitialTheme()
  neo-brutalist/      the reference theme (faithful port of the prototype)
    tokens.css        every raw colour / font stack / border width / radius / shadow / easing
    recipes/*.ts      Tailwind class recipes, split by area (shared, game, report)
    portraits.tsx     <Portrait character={...}/>
    Background.tsx    <Background world phase/> (stars, planet, veils, grain)
    theme.ts          assembles the ThemeDefinition and imports fonts + tokens.css
  minimal/            light/dark-aware theme (same file layout + worlds.css, motion.css)
  holo-hud/           sci-fi HUD theme (same layout + portrait-human.tsx)
```

The full guide (token list, every recipe key and its `data-*` state attributes, adding a theme,
fonts, accessibility, theme comparison) is [docs/THEMING.md](../../../docs/THEMING.md).

## How switching works

- `ThemeProvider` puts `theme.tokensClass` (e.g. `theme-neo`) and, while a world is active,
  `theme.worldTokens[worldId]` (e.g. `world-moon`) on `<html>`. Nothing else changes in the DOM
  tree, so **switching themes never remounts the game**; the session lives above the provider's
  consumers and only recipes/portrait/background swap.
- The choice is stored in `localStorage` (`commander.theme`); `?theme=<id>` overrides it for that
  page load. The gear menu lists `THEMES`.
- A world class can also be put on any element (the world cards do this) to scope that world's
  accent there; it must therefore define every world-dependent token, not just the accent.

## Rules

1. **Tokens only.** Every colour, font, border width, radius, shadow and motion value comes from a
   CSS variable `--t-*` declared in `<id>/tokens.css`. No hex values or font names in `.ts/.tsx`
   (the only exception is per-character colour data from `characters.json`).
2. **Tailwind mapping.** `styles/index.css` maps tokens into Tailwind with `@theme inline`
   (`--color-surface: var(--t-surface)` gives `bg-surface`, `text-surface`, ...). `inline` matters:
   utilities then reference the variable at the element, so scoped overrides (world classes) work.
   Available names: colours `bg surface surface-2 well ink muted copy placeholder line edge on-accent
on-ink on-ink-soft accent accent-2 good bad warn aria cell cell-lit cell-dark cell-storm art-shade
veil-night veil-storm speaker resource`; fonts `font-display|mono|pixel|body`; shadows
   `shadow-panel|notes|hard|hard-hover|hard-press|hard-xs|option|option-hover|option-press|line|
line-sm|accent-sm|world-selected|edge-sm|edge|edge-md|edge-lg|edge-xl`; radii `rounded-box|pill`;
   animations `animate-twinkle|storm|ticker|flip|alert|crit|shake|pop|deal|sticker|bubble|type|blink`;
   border widths `border-bw|bw-sm|bw-lg|bw-hair` (and `border-t-bw`, `border-b-bw`, ...);
   breakpoints `desk:` (>= 980px), custom variants `short:` and `tiny:`.
   A theme may define more tokens, and may add Tailwind names in `styles/index.css`.
3. **State contract.** Components expose state as `data-*` attributes; recipes style them with
   data variants (`data-[highlighted=true]:bg-ink`, `group-data-[state=low]/res:text-warn`). The
   attributes per recipe key are documented in `types.ts`.
4. **Layout is shared.** The responsive grid (mobile: time, resources, card, options, notes;
   desktop: resources | card + options | time + notes) lives in `screens/GameScreen.tsx`. Themes
   skin the parts (padding inside panels, card size, bar orientation via `desk:`), not the grid.
5. **Support `prefers-reduced-motion`.** `styles/index.css` shortens all animations/transitions
   globally; keep new motion in CSS (keyframes in `styles/motion.css` or your own file), not in JS
   timers or SMIL.
6. **Fonts** are bundled with `@fontsource/*` imports in `theme.ts` (no CDN).

## Adding a theme (e.g. `minimal`)

1. Copy `neo-brutalist/` to `minimal/`.
2. `tokens.css`: rename the root class (`.theme-minimal`), then change the `--t-*` values. Keep the
   token **names**. Re-declare `.world-moon` / `.world-mars` (accent overrides; moon vs mars
   artwork tokens) under your class.
3. `recipes/*.ts`: rewrite the class strings. Every key in `ThemeClasses` must be filled (the
   compiler enforces it). Start from the neo recipes; most structure (data variants, `desk:`
   layout) can stay and only the look changes.
4. `portraits.tsx`: export your `Portrait` (`({character}) => <svg/>`). `character.kind` is
   `human | ai | earth`; humans carry `skin`, `hair`, `hairStyle`, `hat`, `glasses`, `headset`
   and `color`.
5. `Background.tsx`: export your scene. It receives `world` and `phase` (`night`, `storm`); a theme
   that has no scene can render only the veils.
6. `theme.ts`: export a `ThemeDefinition` with `id`, `name`, `tokensClass`, `worldTokens`,
   `classes`, `Portrait`, `Background`, `motion` and import its fonts and `tokens.css`.
7. `registry.ts`: add the theme to `THEMES`.
8. Check it: `npm run dev -w @commander/client`, open `/?theme=minimal` at ~390px and ~1280px,
   play a chapter, then switch themes from the gear menu mid-game (state must be preserved).
   `npm test -w @commander/client` runs the theme contract and runtime tests
   (`test/themes-contract.test.tsx`, `test/themes-runtime.test.tsx`) against every registered theme;
   add theme-specific assertions to `test/theme-switching.test.tsx` only if you need them.

## `ThemeClasses` keys beyond the original spec

The spec's keys (`panel`, `button`, `card.{root,art,body,plate,stamp}`, `option`, `chip`,
`sticker`, `resource.{root,bar,fill,ghost,pop}`, `notes`, `timeline`, `heading`, `label`) are all
present. The neo port needed finer parts, added generically: `field`, `stickerDetail`,
`offlineChip`, `menu`, `landing`, `select`, `chapter`, `time`, `timelineCell`,
`card.{stage,deck,enter,meta,tag,face,plateRole,text,hint}`, `optionTitle`, `optionBadge`,
`resource.{wrap,header,list,icon,name,value,dot}`, `notesHeader`, `notesList`, `notesItem` and
`report`. Each is documented in `types.ts`.
