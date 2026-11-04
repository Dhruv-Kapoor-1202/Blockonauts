/**
 * AchievementTracker: evaluates declarative badge rules. Event-based rules (supplies landed,
 * storm weathered, mission won) are fed in with `markEvent`; the rest are derived from state.
 */
import type { AchievementDef } from '../content/schemas/index.js';
import type { ResourcePool } from './resource-pool.js';

/** State the rules look at. */
export interface AchievementContext {
  day: number;
  scienceCount: number;
  factsCount: number;
  resources: ResourcePool;
}

/** Tracks unlocked badges. */
export class AchievementTracker {
  private unlocked = new Set<string>();
  private events = new Set<string>();

  /** @param defs all achievement definitions. */
  constructor(private readonly defs: readonly AchievementDef[]) {}

  /** Records that a named event happened. */
  markEvent(event: string): void {
    this.events.add(event);
  }

  /** Unlocks every badge whose rule now holds. @returns only the newly unlocked ones. */
  evaluate(ctx: AchievementContext): AchievementDef[] {
    const fresh: AchievementDef[] = [];
    for (const def of this.defs) {
      if (this.unlocked.has(def.id) || !this.holds(def, ctx)) continue;
      this.unlocked.add(def.id);
      fresh.push(def);
    }
    return fresh;
  }

  /** Ids of all unlocked badges. */
  ids(): string[] {
    return [...this.unlocked];
  }

  /** Number of unlocked badges. */
  get count(): number {
    return this.unlocked.size;
  }

  /** Serialisable state. */
  snapshot(): { unlocked: string[]; events: string[] } {
    return { unlocked: [...this.unlocked], events: [...this.events] };
  }

  /** Restores state. */
  restore(state: { unlocked: string[]; events: string[] }): void {
    this.unlocked = new Set(state.unlocked);
    this.events = new Set(state.events);
  }

  private holds({ rule }: AchievementDef, ctx: AchievementContext): boolean {
    switch (rule.type) {
      case 'dayAtLeast':
        return ctx.day >= rule.day;
      case 'counterAtLeast':
        return (rule.counter === 'science' ? ctx.scienceCount : ctx.factsCount) >= rule.value;
      case 'event':
        return this.events.has(rule.event);
      case 'balanced':
        return ctx.day > rule.afterDay && ctx.resources.allAtLeast(rule.minEach);
    }
  }
}
