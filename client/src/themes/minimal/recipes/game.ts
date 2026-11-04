/**
 * minimal recipes for the game screen: time panel, timeline strip, resource meters, card stage,
 * option buttons and field notes. Same responsive structure as the reference theme (mobile-first,
 * `desk:` from 980px, `short:` for low landscape), restyled with rounded shapes and soft fades.
 */
import type { ThemeClasses } from '../../types';

export const time: ThemeClasses['time'] = {
  root: 'relative z-20 flex flex-col gap-2 px-3 py-2.5 desk:gap-3.5 desk:p-5',
  row: 'flex items-center gap-3 desk:flex-wrap',
  day: 'relative flex items-baseline gap-1.5',
  unit: 'text-xs font-medium uppercase tracking-[.1em] text-muted desk:text-sm',
  number:
    'text-[2rem] short:text-[1.7rem] desk:text-[3.5rem] font-semibold leading-none tabular-nums tracking-[-.03em] animate-[m-fade_var(--t-dur-flip)_ease-out]',
  preview: [
    'absolute left-full top-0 ml-2 whitespace-nowrap rounded-pill bg-ink px-2 py-0.5 text-[.7rem]',
    'font-medium text-on-ink opacity-0 transition-opacity duration-(--t-dur-pop) data-[on=true]:opacity-100',
  ].join(' '),
  chips:
    'ml-auto flex flex-col items-end gap-1 desk:order-3 desk:ml-0 desk:w-full desk:flex-row desk:flex-wrap desk:items-start',
  chipExtra: 'hidden desk:inline-block',
  aria: [
    'grid size-10 desk:size-11 desk:ml-auto flex-none place-items-center rounded-pill bg-aria',
    'text-xs font-semibold text-on-accent shadow-hard-xs data-[alert=true]:animate-alert',
  ].join(' '),
  bubble: [
    'absolute right-1.5 top-[calc(100%+8px)] desk:left-0 desk:right-auto z-20 w-[min(300px,86vw)]',
    'rounded-box border-bw border-line bg-surface px-3.5 py-3 text-[.82rem] leading-snug text-copy',
    'shadow-edge-lg animate-bubble',
  ].join(' '),
  bubbleTitle: 'mb-1 block text-[.7rem] font-semibold uppercase tracking-[.08em] text-aria',
  chapter: 'flex min-w-0 items-center gap-2',
  chapterKicker:
    'whitespace-nowrap rounded-pill bg-accent/12 px-2 py-0.5 text-[.65rem] font-semibold uppercase tracking-[.08em] text-accent',
  chapterTitle: 'min-w-0 truncate text-[.85rem] desk:text-[.95rem] font-semibold',
  goal: 'hidden desk:block text-[.78rem] text-muted',
  goalBar: 'h-1.5 desk:mt-1.5 overflow-hidden rounded-pill bg-well',
  goalFill:
    'block h-full rounded-pill bg-accent transition-[width] duration-(--t-dur-goal) ease-out',
};

export const timeline = 'grid h-1.5 desk:h-2 gap-0.5';

export const timelineCell = [
  'relative rounded-pill bg-cell data-[tone=lit]:bg-cell-lit data-[tone=dark]:bg-cell-dark',
  'data-[tone=now]:bg-accent data-[tone=storm]:bg-cell-storm data-[past=true]:opacity-40',
  'data-[now=true]:z-[1] data-[now=true]:scale-y-[1.7]',
  'after:absolute after:left-1/2 after:top-[-7px] after:size-[var(--t-marker-size)] after:-translate-x-1/2',
  'after:rounded-pill after:bg-accent-2 after:content-[""] after:opacity-0 data-[supply=true]:after:opacity-100',
].join(' ');

const resourceFrame = [
  'absolute left-0 bottom-0 right-0 rounded-pill transition-[height,width] duration-(--t-dur-bar) ease-(--t-ease-bar)',
  'desk:inset-y-0 desk:right-auto desk:h-auto',
].join(' ');

const popBase = [
  'pointer-events-none absolute left-1/2 top-[-6px] z-[6] -translate-x-1/2 whitespace-nowrap rounded-pill',
  'px-2 py-px text-[.8rem] font-semibold text-on-accent shadow-edge-sm',
  'desk:left-auto desk:-right-1.5 desk:-top-3 desk:translate-x-0',
  'animate-[m-pop_var(--t-dur-float)_var(--t-ease-float)_forwards] motion-reduce:animate-none',
].join(' ');

export const resource: ThemeClasses['resource'] = {
  wrap: 'px-2.5 pb-3 pt-3.5 desk:self-center desk:px-5 desk:pb-5 desk:pt-4',
  header:
    'mb-4 hidden justify-between border-b-bw border-line pb-3 text-[.7rem] font-medium uppercase tracking-[.08em] text-muted desk:flex',
  list: 'grid grid-cols-[repeat(7,minmax(0,1fr))] gap-1.5 desk:grid-cols-1 desk:gap-4',
  root: [
    'group/res relative grid justify-items-center gap-1.5 [grid-template-areas:"bar"_"rv"]',
    'data-[hit=down]:animate-shake',
    'desk:grid-cols-[36px_minmax(0,1fr)_auto] desk:[grid-template-areas:"ri_rn_rv"_"ri_bar_bar"]',
    'desk:items-center desk:justify-items-stretch desk:gap-x-3 desk:gap-y-1.5',
  ].join(' '),
  icon: [
    '[grid-area:bar] desk:[grid-area:ri] z-[2] mb-1.5 grid size-6 self-end place-items-center',
    'rounded-pill bg-resource text-(color:--t-on-resource) border-bw border-ink/10 pointer-events-none',
    '[&_svg]:size-3.5 desk:mb-0 desk:size-9 desk:self-center desk:[&_svg]:size-[18px]',
  ].join(' '),
  name: 'hidden desk:block [grid-area:rn] text-[.72rem] font-medium uppercase tracking-[.08em] text-muted',
  value: [
    '[grid-area:rv] text-[.8rem] tiny:text-[.7rem] desk:text-lg desk:text-right font-semibold',
    'leading-none tabular-nums group-data-[state=low]/res:text-warn group-data-[state=critical]/res:text-bad',
  ].join(' '),
  bar: [
    '[grid-area:bar] relative h-[62px] short:h-[46px] desk:h-2 w-full max-w-7 desk:max-w-none',
    'overflow-hidden rounded-pill bg-well',
    'group-data-[state=low]/res:bg-warn/20 group-data-[state=critical]/res:bg-bad/20',
    'group-data-[state=critical]/res:animate-crit',
  ].join(' '),
  fill: `${resourceFrame} h-[calc(var(--v)*1%)] desk:w-[calc(var(--v)*1%)] bg-resource shadow-[inset_0_0_0_1px_var(--t-fill-edge)]`,
  ghost: [
    resourceFrame,
    'h-[calc(var(--g)*1%)] desk:w-[calc(var(--g)*1%)] bg-ink/25 delay-(--t-dur-bar)',
    'duration-(--t-dur-ghost) ease-out data-[gain=true]:bg-good/50 data-[gain=true]:transition-none',
  ].join(' '),
  dot: [
    'absolute z-[3] size-2 rounded-pill border-bw border-surface bg-ink',
    'left-1/2 top-[-11px] -translate-x-1/2 scale-0 transition-transform duration-(--t-dur-pop)',
    'desk:left-auto desk:-right-4 desk:top-1/2 desk:translate-x-0 desk:-translate-y-1/2',
    'data-[state=small]:scale-100 data-[state=big]:scale-[1.7]',
    'data-[kind=uncertain]:border-dashed data-[kind=uncertain]:border-ink data-[kind=uncertain]:bg-transparent',
    'data-[tone=up]:bg-good data-[tone=down]:bg-bad',
  ].join(' '),
  pop: { up: `${popBase} bg-good`, down: `${popBase} bg-bad` },
};

const cardSize =
  'w-[min(100%,380px)] h-[min(100%,500px)] desk:w-[min(100%,420px)] desk:h-[min(100%,560px)]';

const stampBase = [
  'pointer-events-none absolute top-[calc(46%+12px)] z-[5] max-w-[70%] rounded-pill px-3.5 py-1.5',
  'text-sm font-semibold leading-tight opacity-0 shadow-edge-md transition-opacity duration-(--t-dur-stamp)',
].join(' ');

export const card: ThemeClasses['card'] = {
  stage: 'relative flex min-h-0 items-center justify-center [perspective:1000px]',
  deck: `absolute ${cardSize} rounded-box border-bw border-line bg-surface-2 data-[depth=1]:translate-y-2 data-[depth=1]:scale-[.97] data-[depth=2]:translate-y-4 data-[depth=2]:scale-[.94] data-[depth=2]:opacity-60`,
  root: `relative z-[2] flex min-h-[300px] ${cardSize} cursor-grab touch-none flex-col overflow-hidden rounded-box border-bw border-line bg-surface shadow-edge-lg will-change-transform active:cursor-grabbing`,
  enter: 'animate-[m-deal_var(--t-dur-deal)_var(--t-ease-deal)]',
  art: [
    'relative flex flex-[0_0_46%] short:basis-[40%] items-center justify-center overflow-hidden pb-11',
    'border-b-bw border-line bg-speaker/15 before:absolute before:inset-0 before:content-[""]',
    'before:[background-image:var(--t-art-glow)]',
  ].join(' '),
  meta: 'absolute inset-x-3 top-2.5 z-[2] flex items-center justify-between text-[.68rem] font-medium tabular-nums text-muted',
  tag: 'rounded-pill bg-surface/70 px-2 py-0.5 text-ink',
  face: 'relative z-[1] aspect-square h-full max-h-[120px] [&_svg]:block [&_svg]:size-full',
  plate:
    'absolute inset-x-0 bottom-2.5 z-[3] px-3 text-center text-[.9rem] font-semibold leading-tight text-ink',
  plateRole: 'mt-0.5 block text-[.62rem] font-medium uppercase tracking-[.1em] text-muted',
  body: 'relative flex flex-1 items-center px-5 pb-8 pt-4 short:px-4 short:pb-6 short:pt-3',
  text: 'text-[clamp(1rem,2.6vh,1.15rem)] desk:text-[1.15rem] short:text-[.95rem] font-medium leading-[1.45] text-ink',
  hint: 'absolute inset-x-0 bottom-2.5 text-center text-[.65rem] tracking-[.08em] text-muted',
  stamp: {
    left: `${stampBase} right-4 bg-ink text-on-ink`,
    right: `${stampBase} left-4 bg-accent text-on-accent`,
  },
};

export const option = [
  'flex min-h-[58px] short:min-h-[50px] desk:min-h-[68px] flex-col items-start gap-1.5 text-left',
  'rounded-box border-bw border-line bg-surface px-3.5 py-2.5 short:px-3 short:py-2 desk:px-4 desk:py-3',
  'text-ink shadow-option transition-[background-color,border-color,box-shadow,transform] duration-(--t-dur-fast)',
  'hover:border-edge hover:shadow-option-hover active:scale-[.985] active:shadow-option-press',
  'data-[side=right]:items-end data-[side=right]:text-right',
  'data-[highlighted=true]:border-accent data-[highlighted=true]:bg-accent/10 data-[highlighted=true]:shadow-option-hover',
].join(' ');

export const optionTitle =
  'text-[.88rem] tiny:text-[.8rem] desk:text-[.95rem] font-semibold leading-tight';

export const optionBadge = [
  'rounded-pill border-bw border-line bg-surface-2 px-2 py-px text-[.65rem] font-medium tabular-nums text-muted',
  'data-[long=true]:border-accent/40 data-[long=true]:bg-accent/12 data-[long=true]:text-accent',
].join(' ');

export const notes = [
  'flex min-h-[52px] short:min-h-0 items-start gap-3 rounded-box border-bw border-line bg-surface',
  'px-3.5 py-2.5 shadow-notes desk:flex-col desk:self-start desk:px-5 desk:py-4',
].join(' ');

export const notesHeader =
  'mt-0.5 whitespace-nowrap text-[.65rem] font-semibold uppercase tracking-[.1em] text-accent';

export const notesList =
  'list-none text-[.78rem] leading-snug text-copy desk:flex desk:flex-col desk:gap-2.5 desk:text-[.82rem]';

export const notesItem = [
  'line-clamp-2 [&:not(:first-child)]:hidden data-[new=true]:animate-[m-fade_var(--t-dur-type)_ease-out]',
  'desk:line-clamp-none desk:[&:not(:first-child)]:block desk:[&:not(:first-child)]:opacity-45',
  'desk:[&:nth-child(n+4)]:hidden',
].join(' ');
