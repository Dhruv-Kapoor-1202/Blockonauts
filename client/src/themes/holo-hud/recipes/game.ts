/**
 * holo-hud recipes for the game screen: telemetry time panel, segmented timeline, glowing
 * resource gauges, the holo card stage, chamfered option buttons and field notes. Same responsive
 * structure as the reference theme (mobile-first, `desk:` from 980px, `short:` for low landscape).
 */
import type { ThemeClasses } from '../../types';
import { brackets, bracketsInside } from './shared';

export const time: ThemeClasses['time'] = {
  root: 'relative z-20 flex flex-col gap-2 px-3 py-2.5 desk:gap-3 desk:p-4',
  row: 'flex items-center gap-2.5 desk:flex-wrap',
  day: 'relative flex items-baseline gap-1.5',
  unit: 'text-[.75rem] desk:text-sm uppercase tracking-[.2em] text-accent',
  number:
    'font-display text-[2rem] short:text-[1.7rem] desk:text-[3.4rem] font-bold leading-none tabular-nums tracking-[.04em] [text-shadow:var(--t-text-glow)] animate-flip',
  preview: [
    'absolute left-full top-0 ml-1.5 scale-0 whitespace-nowrap bg-accent-2 px-1.5 py-0.5 text-[.66rem] uppercase',
    'text-on-accent [clip-path:var(--t-clip-cut-sm)] transition-transform duration-(--t-dur-pop) data-[on=true]:scale-100',
  ].join(' '),
  chips:
    'ml-auto flex flex-col items-end gap-1 desk:order-3 desk:ml-0 desk:w-full desk:flex-row desk:flex-wrap desk:items-start',
  chipExtra: 'hidden desk:inline-block',
  aria: [
    'grid size-10 desk:size-12 desk:ml-auto flex-none place-items-center rounded-pill border-bw border-aria',
    'bg-aria/15 text-[.72rem] font-bold text-aria shadow-hard-xs data-[alert=true]:animate-alert',
  ].join(' '),
  bubble: [
    'absolute right-1.5 top-[calc(100%+10px)] desk:left-[-10px] desk:right-auto z-20 w-[min(300px,86vw)]',
    'border-bw border-aria bg-(--t-glass-solid) px-3 py-2.5 text-[.76rem] leading-[1.5] text-copy',
    'shadow-edge-md animate-bubble',
  ].join(' '),
  bubbleTitle: 'mb-1 block font-display text-[.66rem] uppercase tracking-[.16em] text-aria',
  chapter: 'flex min-w-0 items-center gap-2',
  chapterKicker:
    'whitespace-nowrap border-bw border-accent-2/50 px-1.5 py-0.5 text-[.62rem] uppercase tracking-[.14em] text-accent-2',
  chapterTitle:
    'min-w-0 truncate font-display text-[.72rem] desk:text-[.82rem] font-bold uppercase tracking-[.12em]',
  goal: 'hidden desk:block text-[.66rem] uppercase tracking-[.14em] text-muted',
  goalBar: 'h-1.5 desk:h-2 desk:mt-1 border-bw border-line bg-well',
  goalFill:
    'block h-full bg-accent shadow-hard transition-[width] duration-(--t-dur-goal) ease-out',
};

export const timeline = 'grid h-3 desk:h-4 gap-0.5';

export const timelineCell = [
  'relative bg-cell data-[tone=lit]:bg-cell-lit data-[tone=dark]:bg-cell-dark',
  'data-[tone=now]:bg-accent data-[tone=now]:shadow-hard-xs data-[tone=storm]:bg-cell-storm',
  'data-[past=true]:opacity-40 data-[now=true]:z-[1] data-[now=true]:outline-bw-sm data-[now=true]:outline-ink',
  'after:absolute after:left-1/2 after:top-[-6px] after:-translate-x-1/2 after:border-[length:var(--t-marker-size)]',
  'after:border-transparent after:border-t-accent-2 after:content-[""] after:opacity-0',
  'data-[supply=true]:after:opacity-100',
].join(' ');

const resourceFrame = [
  'absolute left-0 bottom-0 right-0 transition-[height,width] duration-(--t-dur-bar) ease-(--t-ease-bar)',
  'desk:inset-y-0 desk:right-auto desk:h-auto',
].join(' ');

const popBase = [
  'pointer-events-none absolute left-1/2 top-[-6px] z-[6] -translate-x-1/2 whitespace-nowrap border-bw',
  'bg-(--t-glass-solid) px-1.5 py-px font-display text-[.9rem] font-bold',
  'desk:left-auto desk:-right-1.5 desk:-top-3 desk:translate-x-0',
  'animate-[h-pop_var(--t-dur-float)_var(--t-ease-float)_forwards] motion-reduce:animate-none',
].join(' ');

export const resource: ThemeClasses['resource'] = {
  wrap: 'px-2 pb-2 pt-2.5 desk:self-center desk:px-4 desk:pb-[18px] desk:pt-4',
  header:
    'mb-3 hidden justify-between border-b-bw border-dashed border-line pb-2 text-[.68rem] uppercase tracking-[.16em] text-muted desk:flex',
  list: 'grid grid-cols-[repeat(7,minmax(0,1fr))] gap-1.5 desk:grid-cols-1 desk:gap-3.5',
  root: [
    'group/res relative grid justify-items-center gap-1 [grid-template-areas:"bar"_"rv"]',
    'data-[hit=down]:animate-shake',
    'desk:grid-cols-[38px_minmax(0,1fr)_auto] desk:[grid-template-areas:"ri_rn_rv"_"ri_bar_bar"]',
    'desk:items-center desk:justify-items-stretch desk:gap-x-3 desk:gap-y-1',
  ].join(' '),
  icon: [
    '[grid-area:bar] desk:[grid-area:ri] z-[2] mb-1.5 grid size-6 self-end place-items-center',
    'border-bw border-resource/60 bg-(--t-glass-solid) text-resource pointer-events-none [&_svg]:size-[14px]',
    'desk:mb-0 desk:size-auto desk:self-stretch desk:[&_svg]:size-5',
  ].join(' '),
  name: 'hidden desk:block [grid-area:rn] text-[.68rem] uppercase tracking-[.14em] text-copy',
  value: [
    '[grid-area:rv] font-display text-[.8rem] tiny:text-[.7rem] desk:text-xl desk:text-right font-bold',
    'leading-none tabular-nums text-ink group-data-[state=low]/res:text-warn group-data-[state=critical]/res:text-bad',
  ].join(' '),
  bar: [
    '[grid-area:bar] relative h-[62px] short:h-[46px] desk:h-[18px] w-full max-w-7 desk:max-w-none',
    'border-bw border-line bg-well after:absolute after:inset-0 after:pointer-events-none after:content-[""]',
    'after:[background:var(--t-bar-ticks-v)] desk:after:[background:var(--t-bar-ticks-h)]',
    'group-data-[state=low]/res:border-warn group-data-[state=critical]/res:border-bad',
    'group-data-[state=critical]/res:animate-crit group-data-[hit=up]/res:border-good group-data-[hit=down]/res:border-bad',
  ].join(' '),
  fill: `${resourceFrame} h-[calc(var(--v)*1%)] desk:w-[calc(var(--v)*1%)] bg-resource shadow-[0_0_12px_var(--rc)]`,
  ghost: [
    resourceFrame,
    'h-[calc(var(--g)*1%)] desk:w-[calc(var(--g)*1%)] bg-ink/40 delay-(--t-dur-bar)',
    'duration-(--t-dur-ghost) ease-out data-[gain=true]:bg-good data-[gain=true]:transition-none',
  ].join(' '),
  dot: [
    'absolute z-[3] size-2 rounded-pill border-bw border-edge bg-ink shadow-hard-xs',
    'left-1/2 top-[-11px] -translate-x-1/2 scale-0 transition-transform duration-(--t-dur-pop)',
    'desk:left-auto desk:-right-4 desk:top-1/2 desk:translate-x-0 desk:-translate-y-1/2',
    'data-[state=small]:scale-100 data-[state=big]:scale-[1.7]',
    'data-[kind=uncertain]:border-dashed data-[kind=uncertain]:border-ink data-[kind=uncertain]:bg-transparent',
    'data-[tone=up]:bg-good data-[tone=down]:bg-bad',
  ].join(' '),
  pop: {
    up: `${popBase} border-good text-good shadow-[0_0_12px_-2px_var(--t-good)]`,
    down: `${popBase} border-bad text-bad shadow-[0_0_12px_-2px_var(--t-bad)]`,
  },
};

const cardSize =
  'w-[min(100%,380px)] h-[min(100%,500px)] desk:w-[min(100%,420px)] desk:h-[min(100%,560px)]';

const stampBase = [
  'pointer-events-none absolute top-[calc(46%+10px)] z-[5] max-w-[70%] bg-(--t-glass-solid) px-2.5 py-1.5',
  'font-display text-base font-bold uppercase leading-[1.05] tracking-[.1em] opacity-0',
  '[clip-path:var(--t-clip-cut-sm)] transition-opacity duration-(--t-dur-stamp)',
].join(' ');

export const card: ThemeClasses['card'] = {
  stage: 'relative flex min-h-0 items-center justify-center [perspective:1000px]',
  deck: `absolute ${cardSize} border-bw border-line bg-surface-2 data-[depth=1]:translate-y-[7px] data-[depth=1]:scale-[.97] data-[depth=2]:translate-y-3.5 data-[depth=2]:scale-[.94] data-[depth=2]:opacity-50`,
  root: `${bracketsInside} z-[2] flex min-h-[300px] ${cardSize} cursor-grab touch-none flex-col overflow-hidden border-bw border-line bg-surface shadow-panel backdrop-blur-(--t-glass-blur) will-change-transform active:cursor-grabbing`,
  enter: 'animate-[h-deal_var(--t-dur-deal)_var(--t-ease-deal)]',
  art: [
    'relative flex flex-[0_0_46%] short:basis-[40%] items-end justify-center overflow-hidden border-b-bw border-line',
    '[background:linear-gradient(180deg,color-mix(in_srgb,var(--c)_26%,transparent),transparent_95%)]',
    'before:absolute before:inset-0 before:content-[""] before:[background-image:var(--t-art-grid)]',
    'before:[background-size:var(--t-art-grid-size)] before:[mask-image:var(--t-art-mask)]',
    'after:absolute after:inset-x-[22%] after:bottom-0 after:h-1.5 after:rounded-pill after:bg-speaker',
    'after:blur-md after:content-[""]',
  ].join(' '),
  meta: 'absolute inset-x-2.5 top-2 z-[2] flex justify-between text-[.64rem] uppercase tracking-[.14em] text-speaker',
  tag: 'border-bw border-speaker/60 bg-(--t-glass-solid) px-1.5 text-speaker',
  face: 'relative z-[1] aspect-square h-[90%] [filter:drop-shadow(0_0_8px_var(--c))] [&_svg]:block [&_svg]:size-full',
  plate: [
    'absolute bottom-0 left-0 z-[3] border-bw border-b-0 border-l-0 border-line bg-(--t-glass-solid)',
    'px-2.5 pb-1 pt-1.5 font-display text-[.78rem] font-bold uppercase leading-tight tracking-[.12em]',
    'text-ink [clip-path:var(--t-clip-cut-sm)]',
  ].join(' '),
  plateRole: 'block text-[.58rem] font-normal tracking-[.16em] text-speaker',
  body: 'relative flex flex-1 items-center px-4 pb-8 pt-4 short:px-3.5 short:pb-6 short:pt-3',
  text: 'text-[clamp(.88rem,2.3vh,1.02rem)] desk:text-[1.02rem] short:text-[.86rem] leading-[1.6] text-ink',
  hint: 'absolute inset-x-0 bottom-2 text-center text-[.6rem] tracking-[.2em] text-muted',
  stamp: {
    left: `${stampBase} right-3 border-bw border-accent-2 text-accent-2`,
    right: `${stampBase} left-3 border-bw border-accent text-accent`,
  },
};

export const option = [
  'flex min-h-[58px] short:min-h-[50px] desk:min-h-[68px] flex-col items-start gap-1 text-left',
  'bg-surface-2 px-3 py-2 short:px-2.5 short:py-1.5 desk:px-3.5 desk:py-3 text-copy shadow-option',
  '[clip-path:var(--t-clip-cut)] transition-[background-color,box-shadow] duration-(--t-dur-fast)',
  'focus-visible:outline-offset-[-4px] hover:bg-accent/12 hover:text-ink hover:shadow-option-hover',
  'active:bg-accent/20 active:shadow-option-press',
  'data-[side=right]:items-end data-[side=right]:text-right',
  'data-[highlighted=true]:bg-accent/15 data-[highlighted=true]:text-ink data-[highlighted=true]:shadow-option-hover',
].join(' ');

export const optionTitle =
  'font-display text-[.78rem] tiny:text-[.7rem] desk:text-[.88rem] font-bold uppercase leading-[1.15] tracking-[.1em]';

export const optionBadge = [
  'border-bw border-line bg-well px-1.5 py-px text-[.62rem] tracking-[.08em] text-muted',
  'data-[long=true]:border-accent-2 data-[long=true]:text-accent-2',
].join(' ');

export const notes = [
  `${brackets} flex min-h-[52px] short:min-h-0 items-start gap-2.5 border-bw border-line bg-surface`,
  'px-3 py-2 shadow-notes backdrop-blur-(--t-glass-blur) desk:flex-col desk:self-start desk:px-4 desk:py-3.5',
].join(' ');

export const notesHeader =
  'mt-0.5 whitespace-nowrap text-[.62rem] uppercase tracking-[.16em] text-accent-2';

export const notesList =
  'list-none text-[.72rem] leading-[1.5] text-copy desk:flex desk:flex-col desk:gap-2.5 desk:text-[.76rem]';

export const notesItem = [
  'line-clamp-2 [&:not(:first-child)]:hidden data-[new=true]:animate-type',
  'desk:line-clamp-none desk:[&:not(:first-child)]:block desk:[&:not(:first-child)]:opacity-45',
  'desk:[&:nth-child(n+4)]:hidden',
].join(' ');
