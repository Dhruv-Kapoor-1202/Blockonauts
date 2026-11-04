/**
 * AriaAdvisor: the colony AI's tip logic. The lowest resource wins when it is below the tip
 * threshold; otherwise a phase tip (night / storm); otherwise an "all nominal" message.
 * On Cadet difficulty it also reveals gamble odds.
 */
import type { FactsAndTips } from '../content/schemas/index.js';
import type { ResourceKey } from '../domain/ids.js';
import type { ResourcePool } from './resource-pool.js';

/** Inputs for a tip. */
export interface AdviceRequest {
  resources: ResourcePool;
  /** Phase tip supplied by the world, if any. */
  phaseTip: 'night' | 'storm' | null;
  /** Unit word ("day"/"sol") used in the nominal message. */
  unit: string;
  /** Show gamble odds when the current card is a gamble. */
  hints: boolean;
  gambleChance?: number;
  /** Tip threshold (value below which the lowest resource gets a dedicated tip). */
  tipThreshold: number;
}

/** Produces ARIA's advice. */
export class AriaAdvisor {
  /** @param copy tip copy from `facts-and-tips.json`. */
  constructor(private readonly copy: FactsAndTips) {}

  /** @returns the tip text. */
  advise(request: AdviceRequest): string {
    const lowest: ResourceKey = request.resources.lowest();
    let text: string;
    if (request.resources.get(lowest) < request.tipThreshold) text = this.copy.tips[lowest];
    else if (request.phaseTip) text = this.copy.aria[request.phaseTip];
    else text = this.copy.aria.nominal.replace(/\{D\}/g, request.unit);
    if (request.hints && request.gambleChance !== undefined) {
      text += ` ${this.copy.aria.gambleHint.replace('{pct}', String(Math.round(request.gambleChance * 100)))}`;
    }
    return text;
  }
}
