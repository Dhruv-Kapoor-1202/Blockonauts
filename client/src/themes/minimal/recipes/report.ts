/**
 * minimal recipes for the mission report (stamp, stats, badges, leaderboard).
 */
import type { ThemeClasses } from '../../types';

export const report: ThemeClasses['report'] = {
  root: 'relative m-auto flex w-[min(100%,640px)] flex-col gap-4 rounded-box border-bw border-line bg-surface px-6 pb-6 pt-14 shadow-panel',
  stamp: [
    'absolute left-6 top-5 rounded-pill border-bw border-bad/50 bg-bad/10 px-3 py-1 text-xs',
    'font-semibold uppercase tracking-[.08em] text-bad',
    'data-[tone=win]:border-good/50 data-[tone=win]:bg-good/10 data-[tone=win]:text-good',
  ].join(' '),
  title:
    'font-display text-[clamp(1.8rem,7vw,2.8rem)] font-semibold leading-[1.05] tracking-[-.03em]',
  text: 'text-[.95rem] leading-relaxed text-copy',
  stats: 'grid grid-cols-3 gap-2.5',
  stat: 'rounded-(--t-radius-sm) bg-surface-2 p-3',
  statValue:
    'block text-[clamp(1.3rem,5vw,1.8rem)] font-semibold leading-none tabular-nums tracking-[-.02em]',
  statLabel: 'mt-1.5 block text-[.65rem] font-medium uppercase tracking-[.08em] text-muted',
  section: 'flex flex-col',
  sectionTitle: 'mb-2 text-[.7rem] font-semibold uppercase tracking-[.1em] text-accent',
  badges: 'flex flex-wrap gap-1.5',
  badge: [
    'rounded-pill border-bw border-dashed border-line px-2.5 py-1 text-[.72rem] text-muted opacity-60',
    'data-[earned=true]:border-solid data-[earned=true]:border-accent/40 data-[earned=true]:bg-accent/12',
    'data-[earned=true]:text-accent data-[earned=true]:opacity-100',
  ].join(' '),
  list: 'list-disc pl-5 text-[.85rem] leading-relaxed text-copy marker:text-muted',
  board: 'flex list-none flex-col gap-1 text-[.82rem]',
  boardRow: [
    'flex justify-between gap-3 rounded-(--t-radius-sm) border-bw border-transparent px-3 py-1.5',
    'tabular-nums text-copy data-[me=true]:border-accent/40 data-[me=true]:bg-accent/10 data-[me=true]:text-ink',
  ].join(' '),
  actions: 'flex flex-wrap gap-3 [&>*]:flex-1',
};
