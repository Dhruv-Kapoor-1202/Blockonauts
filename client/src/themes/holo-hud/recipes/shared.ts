/**
 * holo-hud recipes for the shared building blocks: glass panels with corner brackets, chamfered
 * neon buttons, telemetry chips, stickers, the settings menu and the landing / selection /
 * chapter screens. Colour, glow and geometry all come from the `--t-*` tokens.
 */
import type { ThemeClasses } from '../../types';

const bracketsBase = [
  'relative before:pointer-events-none before:absolute before:z-[1] before:content-[""]',
  'before:[background:var(--t-brackets)]',
].join(' ');

/** Four thin corner brackets drawn by a pseudo-element just outside the box. */
export const brackets = `${bracketsBase} before:[inset:calc(var(--t-bracket-gap)*-1)]`;

/** The same brackets inside the box (for elements that clip their overflow). */
export const bracketsInside = `${bracketsBase} before:inset-0`;

const stickerBase = [
  'fixed left-1/2 top-[44%] desk:top-[40%] z-40 pointer-events-none max-w-[88vw]',
  'bg-(--t-glass-solid) border-bw px-5 py-3 text-center font-display text-[clamp(.95rem,4vw,1.5rem)]',
  'font-bold uppercase leading-tight tracking-[.12em]',
  'animate-[h-sticker_var(--t-dur-sticker)_var(--t-ease-sticker)_forwards] motion-reduce:animate-none',
].join(' ');

const buttonBase = [
  'relative font-display text-[.78rem] font-bold uppercase tracking-[.16em] px-5 py-3.5',
  '[clip-path:var(--t-clip-cut)] transition-[filter,background-color,box-shadow] duration-(--t-dur-fast)',
  'focus-visible:outline-offset-[-4px] active:brightness-90 disabled:pointer-events-none disabled:opacity-50',
].join(' ');

export const shared: Pick<
  ThemeClasses,
  | 'panel'
  | 'heading'
  | 'label'
  | 'button'
  | 'field'
  | 'chip'
  | 'sticker'
  | 'stickerDetail'
  | 'offlineChip'
  | 'menu'
> = {
  panel: `${brackets} rounded-box border-bw border-line bg-surface shadow-panel backdrop-blur-(--t-glass-blur)`,
  heading:
    'font-display text-[clamp(1.4rem,5vw,2.2rem)] font-bold uppercase leading-tight tracking-[.08em] [text-shadow:var(--t-text-glow)]',
  label: 'text-[.68rem] uppercase tracking-[.18em] text-accent',
  button: {
    primary: `${buttonBase} bg-accent text-on-accent hover:brightness-125`,
    secondary: `${buttonBase} bg-accent/15 text-accent shadow-option hover:bg-accent/25 hover:shadow-option-hover`,
  },
  field: [
    'w-[min(260px,70vw)] border-bw border-line bg-well px-3.5 py-3 text-base uppercase tracking-[.12em]',
    'text-ink placeholder:text-placeholder focus:border-accent focus:shadow-hard',
  ].join(' '),
  chip: [
    'whitespace-nowrap border-bw border-line bg-surface-2 px-1.5 py-0.5 text-[.64rem] tiny:text-[.58rem]',
    'uppercase tracking-[.1em] text-copy',
    'data-[hot=true]:border-accent-2 data-[hot=true]:bg-accent-2/15 data-[hot=true]:text-accent-2',
    'data-[hot=true]:shadow-[0_0_10px_-2px_var(--t-accent-2)]',
  ].join(' '),
  sticker: {
    neutral: `${stickerBase} border-accent text-accent shadow-edge-lg`,
    good: `${stickerBase} border-good text-good shadow-[0_0_28px_-2px_var(--t-good)]`,
    bad: `${stickerBase} border-bad text-bad shadow-[0_0_28px_-2px_var(--t-bad)]`,
    time: `${stickerBase} border-accent-2 text-accent-2 shadow-[0_0_28px_-2px_var(--t-accent-2)]`,
  },
  stickerDetail: 'mt-1.5 block text-[.72rem] font-normal normal-case tracking-normal text-copy',
  offlineChip: [
    'fixed left-1/2 top-0 z-[60] -translate-x-1/2 border-bw border-t-0 border-bad bg-bad/20 px-2 py-0.5',
    'text-[.6rem] uppercase tracking-[.16em] text-bad',
  ].join(' '),
  menu: {
    trigger: [
      'grid size-8 place-items-center border-bw border-line bg-surface text-accent shadow-hard-xs',
      'transition-[border-color,box-shadow] duration-(--t-dur-fast) hover:border-accent hover:shadow-hard',
    ].join(' '),
    panel: [
      'absolute right-0 top-full z-[70] mt-2 flex min-w-48 flex-col gap-1 border-bw border-accent',
      'bg-(--t-glass-solid) p-2 shadow-panel',
    ].join(' '),
    title: 'px-2 pb-1 text-[.62rem] uppercase tracking-[.18em] text-muted',
    item: [
      'border-bw border-transparent px-2 py-1.5 text-left text-[.72rem] uppercase tracking-[.1em] text-copy',
      'hover:border-line hover:text-ink',
      'data-[active=true]:border-accent data-[active=true]:bg-accent/10 data-[active=true]:text-accent',
    ].join(' '),
  },
};

export const landing: ThemeClasses['landing'] = {
  root: 'relative mx-auto flex h-full max-w-[900px] flex-col items-start justify-center gap-[18px] px-[clamp(20px,6vw,80px)] py-7',
  eyebrow:
    'border-bw border-accent bg-accent/10 px-2 py-1 text-[.7rem] uppercase tracking-[.2em] text-accent',
  title:
    'font-display text-[clamp(2rem,10.5vw,5.4rem)] font-black leading-[.95] tracking-[.04em] [text-shadow:var(--t-title-glow)]',
  titleAccent: 'text-accent-2 [text-shadow:var(--t-title-glow-2)]',
  subtitle: 'max-w-[540px] text-[clamp(.8rem,2.3vw,1rem)] leading-[1.7] text-copy',
  subtitleMark: 'font-bold text-accent',
  form: 'flex flex-wrap items-stretch gap-2.5',
  credit: 'text-[.68rem] text-muted',
  ticker: [
    'fixed inset-x-0 bottom-0 overflow-hidden whitespace-nowrap border-t-bw border-line',
    'bg-(--t-glass-solid) py-2 text-[.72rem] uppercase tracking-[.1em] text-accent',
  ].join(' '),
  tickerTrack:
    'inline-block pl-[100%] animate-ticker motion-reduce:animate-none motion-reduce:pl-3',
};

export const select: ThemeClasses['select'] = {
  root: 'mx-auto flex h-full max-w-[980px] flex-col gap-4 overflow-y-auto px-[clamp(14px,4vw,40px)] py-[22px]',
  worlds: 'grid grid-cols-2 gap-4',
  world: [
    'group relative flex flex-col gap-2.5 overflow-hidden border-bw border-line bg-surface p-3.5 text-left',
    'backdrop-blur-(--t-glass-blur) transition-[border-color,box-shadow,background-color] duration-(--t-dur-snap)',
    'hover:border-accent data-[selected=true]:border-accent data-[selected=true]:bg-accent/10',
    'data-[selected=true]:shadow-world-selected',
  ].join(' '),
  worldDisc: [
    'relative aspect-square w-[clamp(64px,14vw,96px)] rounded-pill border-bw border-accent [background:var(--t-disc-bg)]',
    'shadow-hard before:absolute before:inset-y-0 before:inset-x-[30%] before:rounded-pill before:border-bw',
    'before:border-accent/70 before:content-[""] after:absolute after:inset-x-0 after:inset-y-[36%]',
    'after:rounded-pill after:border-bw after:border-accent/70 after:content-[""]',
  ].join(' '),
  worldLocation: 'text-[.7rem] uppercase tracking-[.16em] text-accent',
  worldName:
    'font-display text-[clamp(1.2rem,4.6vw,2rem)] font-bold uppercase leading-none tracking-[.08em]',
  specList:
    'grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1 border-t-bw border-dashed border-line pt-2 text-[.72rem]',
  specTerm: 'uppercase text-muted',
  specValue: 'text-copy',
  selectedTag: [
    'absolute right-2.5 top-2.5 border-bw border-accent bg-accent px-1.5 py-px text-[.62rem] uppercase',
    'tracking-[.14em] text-on-accent opacity-0 group-data-[selected=true]:opacity-100',
  ].join(' '),
  difficulties: 'flex flex-wrap gap-2.5',
  difficulty: [
    'group min-w-[120px] flex-1 border-bw border-line bg-surface px-3 py-2.5 text-left font-display',
    'text-[.8rem] uppercase tracking-[.12em] text-copy transition-[border-color,background-color] duration-(--t-dur-fast)',
    'hover:border-accent data-[selected=true]:border-accent data-[selected=true]:bg-accent/15',
    'data-[selected=true]:text-accent data-[selected=true]:shadow-hard',
  ].join(' '),
  difficultyHint:
    'mt-1 block text-[.66rem] font-normal normal-case tracking-normal text-muted group-data-[selected=true]:text-copy',
  actions: 'mt-auto flex flex-wrap justify-end gap-3 pt-1.5',
};

export const chapter: ThemeClasses['chapter'] = {
  root: 'mx-auto flex h-full w-full max-w-[640px] flex-col justify-center overflow-y-auto px-4 py-5',
  card: `${brackets} flex flex-col gap-4 border-bw border-line bg-surface px-5 pb-5 pt-16 shadow-panel backdrop-blur-(--t-glass-blur)`,
  kicker: 'text-[.7rem] uppercase tracking-[.2em] text-accent-2',
  title:
    'font-display text-[clamp(1.6rem,6.5vw,2.8rem)] font-bold uppercase leading-[1.05] tracking-[.06em] [text-shadow:var(--t-text-glow)]',
  text: 'text-[.85rem] leading-[1.65] text-copy',
  lesson: 'border-l-bw-sm border-accent pl-3 text-[.78rem] leading-[1.6] text-copy',
  meta: 'text-[.7rem] uppercase tracking-[.14em] text-muted',
  stamp: [
    'absolute left-5 top-4 border-bw-lg border-bad px-2.5 py-1 font-display text-[clamp(.8rem,3.4vw,1.2rem)]',
    'font-bold uppercase tracking-[.14em] text-bad shadow-[0_0_14px_-4px_var(--t-bad)]',
    'data-[tone=good]:border-good data-[tone=good]:text-good data-[tone=good]:shadow-[0_0_14px_-4px_var(--t-good)]',
  ].join(' '),
  actions: 'flex flex-wrap gap-3 [&>*]:flex-1',
};
