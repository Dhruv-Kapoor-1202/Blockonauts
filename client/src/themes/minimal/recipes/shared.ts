/**
 * minimal recipes for the shared building blocks: panels, buttons, chips, stickers, the settings
 * menu and the landing / selection / chapter screens. Hairline borders, rounded-xl corners and
 * soft shadows; colour and geometry come from the `--t-*` tokens through Tailwind names.
 */
import type { ThemeClasses } from '../../types';

const stickerBase = [
  'fixed left-1/2 top-[44%] desk:top-[40%] z-40 pointer-events-none max-w-[88vw] rounded-box',
  'border-bw bg-surface px-5 py-3 text-center text-[clamp(1rem,4vw,1.25rem)] font-semibold',
  'leading-tight shadow-edge-lg',
  'animate-[m-sticker_var(--t-dur-sticker)_var(--t-ease-sticker)_forwards] motion-reduce:animate-none',
].join(' ');

const buttonBase = [
  'rounded-box px-5 py-3 text-[.95rem] font-medium tracking-[-.005em]',
  'transition-[background-color,border-color,box-shadow,transform] duration-(--t-dur-fast)',
  'active:scale-[.98] disabled:pointer-events-none disabled:opacity-50',
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
  panel: 'rounded-box border-bw border-line bg-surface shadow-panel',
  heading:
    'font-display text-[clamp(1.6rem,5vw,2.3rem)] font-semibold leading-[1.1] tracking-[-.03em]',
  label: 'text-xs font-medium uppercase tracking-[.08em] text-muted',
  button: {
    primary: `${buttonBase} bg-accent text-on-accent shadow-hard hover:shadow-hard-hover hover:brightness-110`,
    secondary: `${buttonBase} border-bw border-line bg-surface text-ink shadow-hard hover:border-edge hover:bg-surface-2`,
  },
  field: [
    'w-[min(260px,70vw)] rounded-box border-bw border-line bg-surface px-4 py-3 text-base text-ink',
    'tracking-[.04em] placeholder:text-placeholder focus:border-accent',
  ].join(' '),
  chip: [
    'whitespace-nowrap rounded-pill border-bw border-line bg-surface-2 px-2.5 py-0.5',
    'text-[.7rem] tiny:text-[.64rem] font-medium text-muted',
    'data-[hot=true]:border-accent/40 data-[hot=true]:bg-accent/12 data-[hot=true]:text-accent',
  ].join(' '),
  sticker: {
    neutral: `${stickerBase} border-line text-ink`,
    good: `${stickerBase} border-good/50 text-good`,
    bad: `${stickerBase} border-bad/50 text-bad`,
    time: `${stickerBase} border-ink bg-ink text-on-ink`,
  },
  stickerDetail: 'mt-1 block text-[.78rem] font-normal opacity-70',
  offlineChip: [
    'fixed left-1/2 top-2 z-[60] -translate-x-1/2 rounded-pill bg-bad px-3 py-0.5',
    'text-[.65rem] font-semibold uppercase tracking-[.08em] text-on-accent shadow-edge-sm',
  ].join(' '),
  menu: {
    trigger: [
      'grid size-9 place-items-center rounded-pill border-bw border-line bg-surface text-ink',
      'shadow-hard-xs transition-colors duration-(--t-dur-fast) hover:bg-surface-2',
    ].join(' '),
    panel: [
      'absolute right-0 top-full z-[70] mt-2 flex min-w-48 flex-col gap-0.5 rounded-box',
      'border-bw border-line bg-surface p-1.5 shadow-edge-lg',
    ].join(' '),
    title: 'px-2.5 pb-1 pt-1 text-[.68rem] font-medium uppercase tracking-[.08em] text-muted',
    item: [
      'rounded-(--t-radius-sm) px-2.5 py-1.5 text-left text-sm text-ink hover:bg-surface-2',
      'data-[active=true]:bg-accent/12 data-[active=true]:font-medium data-[active=true]:text-accent',
    ].join(' '),
  },
};

export const landing: ThemeClasses['landing'] = {
  root: 'relative mx-auto flex h-full max-w-[760px] flex-col items-start justify-center gap-5 px-[clamp(20px,6vw,64px)] py-8',
  eyebrow: [
    'rounded-pill border-bw border-line bg-surface/70 px-3 py-1 text-[.7rem] font-medium uppercase',
    'tracking-[.1em] text-muted',
  ].join(' '),
  title:
    'font-display text-[clamp(2.8rem,13vw,6.2rem)] font-semibold leading-[.95] tracking-[-.05em]',
  titleAccent: 'text-accent',
  subtitle: 'max-w-[520px] text-[clamp(.95rem,2.4vw,1.1rem)] leading-relaxed text-copy',
  subtitleMark:
    'font-medium text-ink underline decoration-accent/50 decoration-2 underline-offset-4',
  form: 'flex flex-wrap items-stretch gap-2.5',
  credit: 'text-xs text-muted',
  ticker: [
    'fixed inset-x-0 bottom-0 overflow-hidden whitespace-nowrap border-t-bw border-line',
    'bg-surface/80 py-2.5 text-xs text-muted',
  ].join(' '),
  tickerTrack:
    'inline-block pl-[100%] animate-ticker motion-reduce:animate-none motion-reduce:pl-4',
};

export const select: ThemeClasses['select'] = {
  root: 'mx-auto flex h-full max-w-[980px] flex-col gap-4 overflow-y-auto px-[clamp(14px,4vw,40px)] py-6',
  worlds: 'grid grid-cols-2 gap-4',
  world: [
    'group relative flex flex-col gap-3 overflow-hidden rounded-box border-bw border-line bg-surface',
    'p-4 text-left shadow-panel transition-[border-color,box-shadow] duration-(--t-dur-snap)',
    'hover:border-edge data-[selected=true]:border-accent data-[selected=true]:shadow-world-selected',
  ].join(' '),
  worldDisc:
    'aspect-square w-[clamp(64px,14vw,96px)] rounded-pill shadow-hard [background:var(--t-disc-bg)]',
  worldLocation: 'text-xs font-medium uppercase tracking-[.08em] text-accent',
  worldName:
    'font-display text-[clamp(1.3rem,4.5vw,1.9rem)] font-semibold leading-tight tracking-[-.02em]',
  specList: 'grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t-bw border-line pt-3 text-[.78rem]',
  specTerm: 'text-muted',
  specValue: 'text-ink',
  selectedTag: [
    'absolute right-3 top-3 rounded-pill bg-accent px-2 py-0.5 text-[.65rem] font-semibold uppercase',
    'tracking-[.08em] text-on-accent opacity-0 transition-opacity duration-(--t-dur-snap)',
    'group-data-[selected=true]:opacity-100',
  ].join(' '),
  difficulties: 'flex flex-wrap gap-2.5',
  difficulty: [
    'group min-w-[120px] flex-1 rounded-box border-bw border-line bg-surface px-3.5 py-3 text-left',
    'text-[.95rem] font-semibold text-ink transition-colors duration-(--t-dur-fast)',
    'hover:border-edge data-[selected=true]:border-accent data-[selected=true]:bg-accent/10',
  ].join(' '),
  difficultyHint: 'mt-0.5 block text-[.72rem] font-normal text-muted',
  actions: 'mt-auto flex flex-wrap justify-end gap-3 pt-2',
};

export const chapter: ThemeClasses['chapter'] = {
  root: 'mx-auto flex h-full w-full max-w-[640px] flex-col justify-center overflow-y-auto px-3.5 py-5',
  card: 'relative flex flex-col gap-4 rounded-box border-bw border-line bg-surface px-6 pb-6 pt-14 shadow-panel',
  kicker: 'text-xs font-medium uppercase tracking-[.1em] text-accent',
  title:
    'font-display text-[clamp(1.8rem,7vw,2.8rem)] font-semibold leading-[1.05] tracking-[-.03em]',
  text: 'text-[.95rem] leading-relaxed text-copy',
  lesson: 'border-l-bw-sm border-accent/60 pl-3 text-[.88rem] leading-relaxed text-copy',
  meta: 'text-xs font-medium text-muted',
  stamp: [
    'absolute left-6 top-5 rounded-pill border-bw border-bad/50 bg-bad/10 px-3 py-1 text-xs',
    'font-semibold uppercase tracking-[.08em] text-bad',
    'data-[tone=good]:border-good/50 data-[tone=good]:bg-good/10 data-[tone=good]:text-good',
  ].join(' '),
  actions: 'flex flex-wrap gap-3 [&>*]:flex-1',
};
