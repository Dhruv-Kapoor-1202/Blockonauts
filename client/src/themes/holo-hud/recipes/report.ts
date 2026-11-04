/**
 * holo-hud recipes for the mission report (stamp, telemetry stats, badges, leaderboard).
 */
import type { ThemeClasses } from '../../types';
import { brackets } from './shared';

export const report: ThemeClasses['report'] = {
  root: `${brackets} m-auto flex w-[min(100%,640px)] flex-col gap-4 border-bw border-line bg-surface px-5 pb-5 pt-16 shadow-panel backdrop-blur-(--t-glass-blur)`,
  stamp: [
    'absolute left-5 top-4 border-bw-lg border-bad px-2.5 py-1 font-display text-[clamp(.8rem,3.4vw,1.2rem)]',
    'font-bold uppercase tracking-[.14em] text-bad shadow-[0_0_14px_-4px_var(--t-bad)]',
    'data-[tone=win]:border-good data-[tone=win]:text-good data-[tone=win]:shadow-[0_0_14px_-4px_var(--t-good)]',
  ].join(' '),
  title:
    'font-display text-[clamp(1.6rem,6.5vw,2.8rem)] font-bold uppercase leading-[1.05] tracking-[.06em] [text-shadow:var(--t-text-glow)]',
  text: 'text-[.85rem] leading-[1.65] text-copy',
  stats: 'grid grid-cols-3 gap-2.5',
  stat: 'border-bw border-line bg-well p-2.5',
  statValue:
    'block font-display text-[clamp(1.2rem,4.6vw,1.8rem)] font-bold leading-none tabular-nums text-ink [text-shadow:var(--t-text-glow)]',
  statLabel: 'mt-1 block text-[.6rem] uppercase tracking-[.14em] text-muted',
  section: 'flex flex-col',
  sectionTitle: 'mb-2 text-[.7rem] uppercase tracking-[.18em] text-accent',
  badges: 'flex flex-wrap gap-1.5',
  badge: [
    'border-bw border-dashed border-line px-2 py-1 text-[.7rem] text-muted opacity-50',
    'data-[earned=true]:border-solid data-[earned=true]:border-accent data-[earned=true]:bg-accent/10',
    'data-[earned=true]:text-accent data-[earned=true]:opacity-100 data-[earned=true]:shadow-hard-xs',
  ].join(' '),
  list: 'list-disc pl-[18px] text-[.78rem] leading-[1.6] text-copy marker:text-accent',
  board: 'flex list-none flex-col gap-1 text-[.78rem]',
  boardRow: [
    'flex justify-between gap-3 border-bw border-line px-2.5 py-1.5 tabular-nums text-copy',
    'data-[me=true]:border-accent data-[me=true]:bg-accent/10 data-[me=true]:text-ink',
  ].join(' '),
  actions: 'flex flex-wrap gap-3 [&>*]:flex-1',
};
