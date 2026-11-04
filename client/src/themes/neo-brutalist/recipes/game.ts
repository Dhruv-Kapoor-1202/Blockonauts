/**
 * neo-brutalist recipes for the game screen: time panel, timeline strip, resource meters, the card
 * stage, option buttons and field notes. Mobile-first with the prototype's `desk:` (>=980px) and
 * `short:` (low landscape) variants.
 */
import type { ThemeClasses } from '../../types';

export const time: ThemeClasses['time'] = {
  root: 'relative flex flex-col gap-[7px] px-2.5 py-2 desk:gap-3 desk:p-4',
  row: 'flex items-center gap-2.5 desk:flex-wrap',
  day: 'relative flex items-baseline gap-1.5',
  unit: 'font-pixel text-[.8rem] desk:text-base text-accent uppercase tracking-[.06em]',
  number:
    'font-display text-[2.2rem] short:text-[1.8rem] desk:text-[4rem] leading-none tabular-nums tracking-[.01em] animate-flip',
  preview: [
    'absolute left-full top-[-6px] ml-1 whitespace-nowrap rotate-[4deg] scale-0',
    'bg-accent text-on-accent border-bw-sm border-edge px-[5px] py-0.5 font-pixel text-[.66rem] uppercase',
    'transition-transform duration-(--t-dur-pop) data-[on=true]:scale-100',
  ].join(' '),
  chips:
    'ml-auto flex flex-col items-end gap-1 desk:order-3 desk:ml-0 desk:w-full desk:flex-row desk:flex-wrap desk:items-start',
  chipExtra: 'hidden desk:inline-block',
  aria: [
    'size-10 desk:size-12 desk:ml-auto flex-none bg-aria text-on-accent border-bw border-ink shadow-hard-xs',
    'font-pixel text-[.8rem] data-[alert=true]:animate-alert',
  ].join(' '),
  bubble: [
    'absolute right-1.5 top-[calc(100%+10px)] desk:left-[-20px] desk:right-auto z-20 w-[min(300px,86vw)]',
    'bg-aria text-on-accent border-bw border-ink shadow-edge-md px-3 py-2.5',
    'font-mono text-[.8rem] leading-[1.4] animate-bubble',
  ].join(' '),
  bubbleTitle: 'mb-[3px] block font-pixel text-[.7rem]',
  chapter: 'flex min-w-0 items-baseline gap-2',
  chapterKicker:
    'whitespace-nowrap bg-accent-2 text-on-accent px-1.5 py-0.5 font-pixel text-[.62rem] uppercase',
  chapterTitle: 'min-w-0 truncate font-display text-[.8rem] desk:text-[.95rem] uppercase',
  goal: 'hidden desk:block font-pixel text-[.68rem] text-muted uppercase',
  goalBar: 'h-1.5 desk:h-2.5 desk:mt-1 border-bw-sm border-ink bg-well',
  goalFill: 'block h-full bg-accent transition-[width] duration-(--t-dur-goal)',
};

export const timeline = 'grid h-3 desk:h-[18px] gap-0.5';

export const timelineCell = [
  'relative bg-cell data-[tone=lit]:bg-cell-lit data-[tone=dark]:bg-cell-dark',
  'data-[tone=now]:bg-accent data-[tone=storm]:bg-cell-storm',
  'data-[past=true]:opacity-35 data-[now=true]:z-[1] data-[now=true]:outline-bw-sm data-[now=true]:outline-ink',
  'after:absolute after:left-1/2 after:top-[-6px] after:-translate-x-1/2 after:border-[length:var(--t-marker-size)]',
  'after:border-transparent after:border-t-accent-2 after:content-[""] after:opacity-0',
  'data-[supply=true]:after:opacity-100',
].join(' ');

const resourceFrame = [
  'absolute left-0 bottom-0 right-0 transition-[height,width] duration-(--t-dur-bar) ease-(--t-ease-bar)',
  'desk:inset-y-0 desk:right-auto desk:h-auto',
].join(' ');

export const resource: ThemeClasses['resource'] = {
  wrap: 'px-2 pb-2 pt-2.5 desk:self-center desk:px-4 desk:pb-[18px] desk:pt-4',
  header:
    'mb-3 hidden justify-between border-b-bw-sm border-dashed border-line pb-2 font-pixel text-xs text-muted uppercase desk:flex',
  list: 'grid grid-cols-[repeat(7,minmax(0,1fr))] gap-1.5 desk:grid-cols-1 desk:gap-3.5',
  root: [
    'group/res relative grid justify-items-center gap-1 [grid-template-areas:"bar"_"rv"]',
    'data-[hit=down]:animate-shake',
    'desk:grid-cols-[40px_minmax(0,1fr)_auto] desk:[grid-template-areas:"ri_rn_rv"_"ri_bar_bar"]',
    'desk:items-center desk:justify-items-stretch desk:gap-x-3 desk:gap-y-1',
  ].join(' '),
  icon: [
    '[grid-area:bar] desk:[grid-area:ri] z-[2] mb-1.5 grid size-6 self-end place-items-center',
    'bg-resource text-on-accent border-bw-sm border-edge pointer-events-none [&_svg]:size-[15px]',
    'desk:mb-0 desk:size-auto desk:self-stretch desk:border-bw desk:border-ink desk:[&_svg]:size-[22px]',
  ].join(' '),
  name: 'hidden desk:block [grid-area:rn] font-pixel text-[.72rem] tracking-[.04em] uppercase',
  value: [
    '[grid-area:rv] font-display text-[.95rem] tiny:text-[.8rem] desk:text-2xl desk:text-right',
    'leading-none tabular-nums group-data-[state=low]/res:text-warn group-data-[state=critical]/res:text-bad',
  ].join(' '),
  bar: [
    '[grid-area:bar] relative h-[62px] short:h-[46px] desk:h-[22px] w-full overflow-hidden bg-well',
    'border-bw border-ink after:absolute after:inset-0 after:pointer-events-none after:content-[""]',
    'after:[background:var(--t-bar-ticks-v)] desk:after:[background:var(--t-bar-ticks-h)]',
    'group-data-[state=critical]/res:border-bad group-data-[state=critical]/res:animate-crit',
    'group-data-[hit=down]/res:border-bad group-data-[hit=up]/res:border-good',
  ].join(' '),
  fill: `${resourceFrame} h-[calc(var(--v)*1%)] desk:w-[calc(var(--v)*1%)] bg-resource`,
  ghost: [
    resourceFrame,
    'h-[calc(var(--g)*1%)] desk:w-[calc(var(--g)*1%)] bg-ink delay-(--t-dur-bar)',
    'duration-(--t-dur-ghost) ease-out data-[gain=true]:bg-good data-[gain=true]:transition-none',
  ].join(' '),
  dot: [
    'absolute z-[3] size-2 rounded-pill border-bw-sm border-edge bg-ink',
    'left-1/2 top-[-11px] -translate-x-1/2 scale-0 transition-transform duration-(--t-dur-pop)',
    'desk:left-auto desk:-right-4 desk:top-1/2 desk:translate-x-0 desk:-translate-y-1/2',
    'data-[state=small]:scale-100 data-[state=big]:scale-[1.7]',
    'data-[kind=uncertain]:bg-transparent data-[kind=uncertain]:border-dashed data-[kind=uncertain]:border-ink',
    'data-[tone=up]:bg-good data-[tone=down]:bg-bad',
  ].join(' '),
  pop: {
    up: 'pointer-events-none absolute left-1/2 top-[-6px] desk:left-auto desk:-right-1.5 desk:-top-3 z-[6] whitespace-nowrap bg-good text-on-accent border-bw-sm border-edge shadow-edge-sm px-1.5 py-px font-display text-[1.05rem] animate-pop',
    down: 'pointer-events-none absolute left-1/2 top-[-6px] desk:left-auto desk:-right-1.5 desk:-top-3 z-[6] whitespace-nowrap bg-bad text-on-accent border-bw-sm border-edge shadow-edge-sm px-1.5 py-px font-display text-[1.05rem] animate-pop',
  },
};

const cardSize =
  'w-[min(100%,380px)] h-[min(100%,500px)] desk:w-[min(100%,420px)] desk:h-[min(100%,560px)]';

export const card: ThemeClasses['card'] = {
  stage: 'relative flex min-h-0 items-center justify-center [perspective:1000px]',
  deck: `absolute ${cardSize} bg-surface-2 border-bw border-ink data-[depth=1]:translate-x-[7px] data-[depth=1]:translate-y-[7px] data-[depth=2]:translate-x-[14px] data-[depth=2]:translate-y-[14px] data-[depth=2]:opacity-50`,
  root: `relative z-[2] flex min-h-[300px] ${cardSize} cursor-grab touch-none flex-col overflow-hidden bg-surface border-bw border-ink will-change-transform active:cursor-grabbing`,
  enter: 'animate-deal',
  art: [
    'relative flex flex-[0_0_46%] short:basis-[40%] items-end justify-center overflow-hidden',
    'bg-speaker border-b-bw border-ink',
    'before:absolute before:inset-0 before:content-[""] before:[background-image:var(--t-art-dots)]',
    'before:[background-size:var(--t-art-dots-size)] before:[mask-image:var(--t-art-dots-mask)]',
    'after:absolute after:-inset-x-[10%] after:-bottom-[40%] after:h-[70%] after:rounded-pill',
    'after:bg-art-shade after:content-[""]',
  ].join(' '),
  meta: 'absolute inset-x-2.5 top-2 z-[2] flex justify-between font-pixel text-[.66rem] text-on-accent',
  tag: 'bg-edge text-speaker px-1.5 py-0.5',
  face: 'relative z-[1] aspect-square h-[88%] [&_svg]:block [&_svg]:size-full',
  plate: [
    'absolute bottom-[-1px] left-3 z-[3] origin-bottom-left -rotate-2 bg-edge text-ink',
    'border-bw border-b-0 border-ink px-[9px] pb-1 pt-[5px] font-display text-[.92rem] leading-[1.05]',
  ].join(' '),
  plateRole: 'block font-pixel text-[.6rem] font-normal text-speaker',
  body: 'relative flex flex-1 items-center px-[18px] pb-[34px] pt-4 short:px-3.5 short:pb-[26px] short:pt-3',
  text: 'text-[clamp(1rem,2.6vh,1.18rem)] desk:text-[1.2rem] short:text-[.95rem] font-medium leading-[1.42]',
  hint: 'absolute inset-x-0 bottom-2 text-center font-pixel text-[.6rem] text-muted',
  stamp: {
    left: [
      'pointer-events-none absolute right-3 top-[calc(46%+12px)] z-[5] max-w-[70%] rotate-[5deg] opacity-0',
      'bg-ink text-on-ink border-bw border-edge shadow-edge px-2.5 py-1.5 font-display text-[1.15rem]',
      'uppercase leading-[1.05] transition-opacity duration-(--t-dur-stamp)',
    ].join(' '),
    right: [
      'pointer-events-none absolute left-3 top-[calc(46%+12px)] z-[5] max-w-[70%] -rotate-[5deg] opacity-0',
      'bg-accent text-on-accent border-bw border-edge shadow-edge px-2.5 py-1.5 font-display text-[1.15rem]',
      'uppercase leading-[1.05] transition-opacity duration-(--t-dur-stamp)',
    ].join(' '),
  },
};

export const option = [
  'flex min-h-[58px] short:min-h-[50px] desk:min-h-[68px] flex-col items-start gap-1 text-left',
  'bg-surface border-bw border-ink shadow-option px-[11px] py-[9px] short:px-[9px] short:py-[7px] desk:px-3.5 desk:py-3',
  'transition-[transform,translate,box-shadow,background-color] duration-(--t-dur-fast)',
  'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-option-hover',
  'active:translate-x-[3px] active:translate-y-[3px] active:shadow-option-press',
  'data-[side=right]:items-end data-[side=right]:text-right',
  'data-[highlighted=true]:not-active:-translate-x-0.5 data-[highlighted=true]:not-active:-translate-y-0.5',
  'data-[highlighted=true]:not-active:shadow-option-hover data-[highlighted=true]:bg-ink data-[highlighted=true]:text-on-ink',
  'data-[highlighted=true]:data-[side=right]:bg-accent data-[highlighted=true]:data-[side=right]:text-on-accent',
].join(' ');

export const optionTitle =
  'font-display text-[.9rem] tiny:text-[.8rem] desk:text-base uppercase leading-[1.1]';

export const optionBadge = [
  'bg-edge text-ink border-bw-hair border-ink px-[5px] py-px font-pixel text-[.62rem]',
  'data-[long=true]:bg-accent data-[long=true]:text-on-accent',
].join(' ');

export const notes = [
  'flex min-h-[52px] short:min-h-0 items-start gap-2.5 bg-surface border-bw border-ink shadow-notes px-3 py-2',
  'desk:flex-col desk:self-start desk:px-4 desk:py-3.5',
].join(' ');

export const notesHeader =
  'mt-0.5 whitespace-nowrap bg-accent-2 text-on-accent px-[5px] py-0.5 font-pixel text-[.62rem] uppercase';

export const notesList =
  'list-none font-mono text-[.76rem] leading-[1.4] text-copy desk:flex desk:flex-col desk:gap-2.5 desk:text-[.8rem]';

export const notesItem = [
  'line-clamp-2 [&:not(:first-child)]:hidden data-[new=true]:animate-type',
  'desk:line-clamp-none desk:[&:not(:first-child)]:block desk:[&:not(:first-child)]:opacity-45',
  'desk:[&:nth-child(n+4)]:hidden',
].join(' ');
