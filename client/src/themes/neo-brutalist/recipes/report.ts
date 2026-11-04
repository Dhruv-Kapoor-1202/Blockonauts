/**
 * neo-brutalist recipes for the mission report (stamp, stats, badges, leaderboard).
 */
import type { ThemeClasses } from '../../types';

export const report: ThemeClasses['report'] = {
  root: 'relative m-auto flex w-[min(100%,640px)] flex-col gap-4 bg-surface border-bw border-ink shadow-panel px-5 pb-5 pt-[66px]',
  stamp: [
    'absolute right-3.5 top-4 rotate-[8deg] border-bw-lg border-bad px-2.5 py-1.5 text-bad',
    'font-display text-[clamp(1rem,4vw,1.5rem)] data-[tone=win]:border-good data-[tone=win]:text-good',
  ].join(' '),
  title: 'font-display text-[clamp(2rem,8vw,3.4rem)] leading-[.9] max-w-[80%]',
  text: 'font-mono text-[.85rem] leading-[1.55] text-copy',
  stats: 'grid grid-cols-3 gap-2.5',
  stat: 'bg-well border-bw border-ink p-2.5',
  statValue: 'block font-display text-[clamp(1.4rem,5vw,2rem)] leading-none',
  statLabel: 'font-pixel text-[.6rem] text-muted uppercase',
  section: 'flex flex-col',
  sectionTitle: 'mb-2 font-pixel text-[.72rem] text-accent uppercase tracking-[.06em]',
  badges: 'flex flex-wrap gap-1.5',
  badge: [
    'font-mono text-[.72rem] px-2 py-1 border-bw-sm border-ink opacity-30 border-dashed',
    'data-[earned=true]:border-solid data-[earned=true]:border-edge data-[earned=true]:bg-accent',
    'data-[earned=true]:text-on-accent data-[earned=true]:opacity-100',
  ].join(' '),
  list: 'list-disc pl-[18px] font-mono text-[.78rem] leading-[1.5] text-copy',
  board: 'flex list-none flex-col gap-1 font-mono text-[.8rem]',
  boardRow:
    'flex justify-between gap-3 border-bw-sm border-line px-2.5 py-1.5 data-[me=true]:border-accent data-[me=true]:bg-edge',
  actions: 'flex flex-wrap gap-3 [&>*]:flex-1',
};
