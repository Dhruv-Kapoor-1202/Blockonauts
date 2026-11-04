/**
 * neo-brutalist recipes for the shared building blocks: panels, buttons, chips, stickers, the
 * settings menu and the landing / selection / chapter screens. Ported from the prototype's CSS.
 */
import type { ThemeClasses } from '../../types';

const stickerBase = [
  'fixed left-1/2 top-[44%] desk:top-[40%] z-40 pointer-events-none max-w-[88vw]',
  'font-display text-[clamp(1.3rem,5vw,2rem)] uppercase leading-none text-center text-on-accent',
  'border-bw border-edge shadow-edge-xl px-[18px] py-3 animate-sticker',
].join(' ');

const buttonBase = [
  'font-display uppercase tracking-[.04em] text-base px-[22px] py-3.5',
  'border-bw border-ink shadow-hard transition-[transform,translate,box-shadow] duration-(--t-dur-fast)',
  'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-hover',
  'active:translate-x-1 active:translate-y-1 active:shadow-hard-press',
  'disabled:opacity-50 disabled:pointer-events-none',
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
  panel: 'bg-surface border-bw border-ink shadow-panel',
  heading: 'font-display text-[clamp(1.8rem,6vw,3rem)] leading-none',
  label: 'font-pixel text-xs text-muted uppercase tracking-[.06em]',
  button: {
    primary: `${buttonBase} bg-accent text-on-accent`,
    secondary: `${buttonBase} bg-surface text-ink`,
  },
  field: [
    'font-mono text-base px-3.5 py-3 bg-edge text-ink border-bw border-ink',
    'w-[min(260px,70vw)] uppercase tracking-[.08em] placeholder:text-placeholder',
  ].join(' '),
  chip: [
    'font-pixel text-[.64rem] tiny:text-[.58rem] px-1.5 py-0.5 border-bw-sm border-ink',
    'whitespace-nowrap uppercase tracking-[.06em]',
    'data-[hot=true]:bg-accent data-[hot=true]:text-on-accent',
  ].join(' '),
  sticker: {
    neutral: `${stickerBase} bg-accent`,
    good: `${stickerBase} bg-good`,
    bad: `${stickerBase} bg-bad`,
    time: `${stickerBase} bg-ink`,
  },
  stickerDetail: 'block font-mono text-[.78rem] normal-case font-normal mt-1.5',
  offlineChip: [
    'fixed top-0 left-1/2 -translate-x-1/2 z-[60] font-pixel text-[.6rem] uppercase tracking-[.06em]',
    'bg-bad text-on-accent border-bw-sm border-edge border-t-0 px-2 py-0.5',
  ].join(' '),
  menu: {
    trigger: [
      'grid size-8 place-items-center bg-surface text-ink border-bw-sm border-ink shadow-hard-xs',
      'transition-[transform,translate,box-shadow] duration-(--t-dur-fast)',
      'hover:-translate-x-px hover:-translate-y-px active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-press',
    ].join(' '),
    panel:
      'absolute right-0 top-full z-[70] mt-2 flex min-w-48 flex-col gap-1 bg-surface border-bw border-ink shadow-panel p-2',
    title: 'font-pixel text-[.62rem] text-muted uppercase tracking-[.06em] px-2 pb-1',
    item: [
      'font-pixel text-[.7rem] uppercase tracking-[.06em] text-left px-2 py-1.5 border-bw-sm border-transparent',
      'hover:border-ink data-[active=true]:bg-accent data-[active=true]:text-on-accent',
    ].join(' '),
  },
};

export const landing: ThemeClasses['landing'] = {
  root: 'relative mx-auto flex h-full max-w-[900px] flex-col items-start justify-center gap-[18px] px-[clamp(20px,6vw,80px)] py-7',
  eyebrow:
    'font-pixel text-xs bg-ink text-on-ink px-2 py-1 -rotate-[1.5deg] uppercase tracking-[.06em]',
  title:
    'font-display text-[clamp(3rem,15vw,8.5rem)] leading-[.82] tracking-[-.02em] [text-shadow:var(--t-title-shadow)]',
  titleAccent:
    'text-transparent [-webkit-text-stroke:var(--t-title-stroke)_var(--t-ink)] [text-shadow:none]',
  subtitle: 'font-mono text-[clamp(.85rem,2.4vw,1.05rem)] max-w-[540px] leading-[1.55] text-copy',
  subtitleMark: 'bg-accent text-on-accent px-1',
  form: 'flex flex-wrap items-stretch gap-2.5',
  credit: 'font-mono text-[.68rem] text-muted',
  ticker: [
    'absolute inset-x-0 bottom-0 overflow-hidden whitespace-nowrap border-t-bw border-ink',
    'bg-accent text-on-accent font-pixel text-[.8rem] py-2 uppercase',
  ].join(' '),
  tickerTrack: 'inline-block pl-[100%] animate-ticker',
};

const halftoneDisc = [
  'after:absolute after:inset-0 after:rounded-pill after:content-[""]',
  'after:[background-image:var(--t-halftone)] after:[background-size:var(--t-halftone-size)]',
  'after:[mask-image:var(--t-halftone-mask)]',
].join(' ');

export const select: ThemeClasses['select'] = {
  root: 'mx-auto flex h-full max-w-[980px] flex-col gap-4 overflow-y-auto px-[clamp(14px,4vw,40px)] py-[22px]',
  worlds: 'grid grid-cols-2 gap-4',
  world: [
    'group relative flex flex-col gap-2.5 overflow-hidden bg-surface border-bw border-ink p-3.5 text-left shadow-line',
    'transition-[transform,translate,box-shadow] duration-(--t-dur-fast)',
    'hover:-translate-x-0.5 hover:-translate-y-0.5 data-[selected=true]:shadow-world-selected',
  ].join(' '),
  worldDisc: [
    'relative aspect-square w-[clamp(70px,16vw,120px)] rounded-pill border-bw border-edge shadow-edge-md',
    '[background:var(--t-disc-bg)]',
    halftoneDisc,
  ].join(' '),
  worldLocation: 'font-pixel text-[.7rem] text-accent uppercase tracking-[.06em]',
  worldName: 'font-display text-[clamp(1.4rem,5vw,2.2rem)] leading-none',
  specList:
    'grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1 border-t-bw-sm border-dashed border-line pt-2 font-mono text-[.74rem]',
  specTerm: 'text-muted uppercase',
  specValue: 'text-ink',
  selectedTag: [
    'absolute right-2.5 top-2.5 bg-accent text-on-accent border-bw-sm border-edge px-1.5 py-[3px]',
    'font-pixel text-[.7rem] uppercase opacity-0 group-data-[selected=true]:opacity-100',
  ].join(' '),
  difficulties: 'flex flex-wrap gap-2.5',
  difficulty: [
    'group min-w-[120px] flex-1 bg-surface text-left border-bw border-ink px-3 py-2.5 shadow-line-sm',
    'font-display text-[.95rem]',
    'data-[selected=true]:bg-ink data-[selected=true]:text-on-ink data-[selected=true]:shadow-accent-sm',
  ].join(' '),
  difficultyHint:
    'mt-0.5 block font-mono text-[.68rem] font-normal text-muted group-data-[selected=true]:text-on-ink-soft',
  actions: 'mt-auto flex flex-wrap justify-end gap-3 pt-1.5',
};

export const chapter: ThemeClasses['chapter'] = {
  root: 'mx-auto flex h-full w-full max-w-[640px] flex-col justify-center overflow-y-auto px-3.5 py-5',
  card: 'relative flex flex-col gap-4 bg-surface border-bw border-ink shadow-panel px-5 pb-5 pt-16',
  kicker: 'font-pixel text-xs text-accent uppercase tracking-[.06em]',
  title: 'font-display text-[clamp(2rem,8vw,3.4rem)] leading-[.9] max-w-[80%]',
  text: 'font-mono text-[.85rem] leading-[1.55] text-copy',
  lesson: 'font-mono text-[.78rem] leading-[1.5] text-copy border-l-bw-sm pl-3 border-accent',
  meta: 'font-pixel text-[.7rem] text-muted uppercase tracking-[.06em]',
  stamp: [
    'absolute right-3.5 top-4 rotate-[8deg] border-bw-lg border-bad px-2.5 py-1.5 text-bad',
    'font-display text-[clamp(1rem,4vw,1.5rem)] uppercase data-[tone=good]:border-good data-[tone=good]:text-good',
  ].join(' '),
  actions: 'flex flex-wrap gap-3 [&>*]:flex-1',
};
