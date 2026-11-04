/**
 * Theme contract. A theme is a plain object (`ThemeDefinition`) that supplies design tokens (via a
 * CSS class), Tailwind class recipes, character portraits, a scene background and motion timings.
 * Components read it through `useTheme()` and never branch on the theme id, so a new theme is a
 * new folder plus one line in `registry.ts`.
 */
import type { CharacterDef, Tone, WorldId } from '@commander/engine';
import type { ComponentType } from 'react';

/** Which weather overlays the scene should show. */
export interface ScenePhase {
  /** Lunar night: the scene darkens. */
  night: boolean;
  /** Dust storm: the scene gets a swirling red veil. */
  storm: boolean;
}

/** Props of a theme's character portrait. */
export interface PortraitProps {
  character: CharacterDef;
}

/** Props of a theme's full-screen scene background. */
export interface BackgroundProps {
  world: WorldId | null;
  phase: ScenePhase;
}

/** Timings (milliseconds) that pace the card and sticker animations. */
export interface ThemeMotion {
  /** Duration of the "deal" animation of a freshly shown card. */
  cardDealMs: number;
  /** How long the fly-out animation runs; playback waits this long before applying events. */
  flyOutMs: number;
  /** How long each sticker occupies the sticker queue. */
  stickerMs: number;
}

/**
 * Class recipes for the shared components.
 *
 * **State contract.** Components expose their state to recipes as `data-*` attributes, so a recipe
 * styles states with Tailwind data variants (`data-[highlighted=true]:bg-ink`) and never needs the
 * theme id. The attributes are documented on each key below.
 */
export interface ThemeClasses {
  /** Boxed surface (time panel and chapter/report cards). */
  panel: string;
  /** Section heading. */
  heading: string;
  /** Small caption / eyebrow label. */
  label: string;
  /** Buttons. */
  button: { primary: string; secondary: string };
  /** Text input. */
  field: string;
  /** Status chip. State: `data-hot="true|false"`. */
  chip: string;
  /** Sticker (one complete recipe per tone; fixed-position, animates on mount). */
  sticker: Record<Tone, string>;
  /** Secondary line inside a sticker. */
  stickerDetail: string;
  /** "OFFLINE" chip. */
  offlineChip: string;
  /** Gear/settings menu. State: item `data-active="true|false"`. */
  menu: { trigger: string; panel: string; title: string; item: string };

  /** Landing screen parts. */
  landing: {
    root: string;
    eyebrow: string;
    title: string;
    /** Second half of the title word (the outlined letters in neo). */
    titleAccent: string;
    subtitle: string;
    subtitleMark: string;
    form: string;
    credit: string;
    ticker: string;
    tickerTrack: string;
  };

  /** World/difficulty selection parts. State: world and difficulty `data-selected`. */
  select: {
    root: string;
    worlds: string;
    world: string;
    worldDisc: string;
    worldLocation: string;
    worldName: string;
    specList: string;
    specTerm: string;
    specValue: string;
    selectedTag: string;
    difficulties: string;
    difficulty: string;
    difficultyHint: string;
    actions: string;
  };

  /** Chapter intro and chapter result screens. State: stamp `data-tone="good|bad"`. */
  chapter: {
    root: string;
    card: string;
    kicker: string;
    title: string;
    text: string;
    lesson: string;
    meta: string;
    stamp: string;
    actions: string;
  };

  /** Time panel parts. State: preview `data-on`, aria `data-alert`. */
  time: {
    root: string;
    row: string;
    day: string;
    unit: string;
    number: string;
    preview: string;
    chips: string;
    /** Extra classes for chips after the second one (hidden on narrow screens in neo). */
    chipExtra: string;
    aria: string;
    bubble: string;
    bubbleTitle: string;
    chapter: string;
    chapterKicker: string;
    chapterTitle: string;
    goal: string;
    goalBar: string;
    goalFill: string;
  };
  /** Timeline strip container. */
  timeline: string;
  /**
   * One timeline cell. State: `data-tone="lit|dark|storm|now"`, `data-past`, `data-now`,
   * `data-supply`.
   */
  timelineCell: string;

  /** Card stage and card parts. The stamps' opacity is driven inline by the drag distance. */
  card: {
    stage: string;
    /** Stacked deck backs. State: `data-depth="1|2"`. */
    deck: string;
    root: string;
    /** Class toggled on the card root to replay the deal animation. */
    enter: string;
    art: string;
    meta: string;
    tag: string;
    face: string;
    plate: string;
    plateRole: string;
    body: string;
    text: string;
    hint: string;
    stamp: { left: string; right: string };
  };
  /** Option button. State: `data-side="left|right"`, `data-highlighted="true|false"`. */
  option: string;
  optionTitle: string;
  /** Duration badge inside an option. State: `data-long="true|false"`. */
  optionBadge: string;

  /**
   * Resource meter. State on `root`: `data-state="normal|low|critical"`, `data-hit="up|down|none"`.
   * The component sets CSS variables `--v` (bar fill %), `--g` (ghost %) and `--rc` (colour from
   * content) on `root`. State on `ghost`: `data-gain`. State on `dot`: `data-state="off|small|big"`,
   * `data-kind="certain|uncertain"`, `data-tone="neutral|up|down"`. `root` is a Tailwind group named
   * `res`, so child recipes can use `group-data-[state=low]/res:`.
   */
  resource: {
    /** Extra classes of the panel that wraps the list (padding, alignment). */
    wrap: string;
    /** Caption row above the list ("SYSTEMS" + base name). */
    header: string;
    list: string;
    root: string;
    icon: string;
    name: string;
    value: string;
    bar: string;
    fill: string;
    ghost: string;
    dot: string;
    pop: { up: string; down: string };
  };

  /** Field notes panel. State: item `data-new`. */
  notes: string;
  notesHeader: string;
  notesList: string;
  notesItem: string;

  /** Mission report parts. State: stamp `data-tone="win|loss"`, badge `data-earned`, row `data-me`. */
  report: {
    root: string;
    stamp: string;
    title: string;
    text: string;
    stats: string;
    stat: string;
    statValue: string;
    statLabel: string;
    section: string;
    sectionTitle: string;
    badges: string;
    badge: string;
    list: string;
    board: string;
    boardRow: string;
    actions: string;
  };
}

/** Everything the app needs to render one visual theme. */
export interface ThemeDefinition {
  /** Stable id used in `?theme=` and localStorage. */
  id: string;
  /** Human name shown in the settings menu. */
  name: string;
  /** Class put on `<html>`; defines every `--t-*` design token. */
  tokensClass: string;
  /** Per-world accent override classes (applied on `<html>`, or on a card to scope a world). */
  worldTokens: Record<WorldId, string>;
  /** Class recipes. */
  classes: ThemeClasses;
  /** Character art. */
  Portrait: ComponentType<PortraitProps>;
  /** Full-screen scene (stars, planet, veils, grain...). */
  Background: ComponentType<BackgroundProps>;
  /** Animation timings. */
  motion: ThemeMotion;
}
