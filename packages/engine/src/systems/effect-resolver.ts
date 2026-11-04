/**
 * EffectResolver: turns a choice into concrete consequences. Immediate effects are merged with
 * a gamble outcome (rolled with the injected RNG); delayed effects are returned separately.
 * It also builds the preview shown while a card is dragged.
 */
import { localizeDays } from '../content/world-keyed.js';
import type { Choice, Goto } from '../content/schemas/index.js';
import {
  RESOURCE_KEYS,
  type ResourceDelta,
  type ResourceKey,
  type Tone,
  type WorldId,
} from '../domain/ids.js';
import type { ChoicePreview } from '../domain/view.js';
import type { RandomSource } from '../random/seeded-random.js';

/** Outcome of a rolled gamble. */
export interface GambleOutcome {
  won: boolean;
  message: string;
  tone: Tone;
  goto?: Goto;
  winNext?: string;
}

/** Everything that happens immediately when a choice is made. */
export interface ResolvedChoice {
  /** Immediate deltas, gamble result included. */
  effects: ResourceDelta;
  gamble?: GambleOutcome;
}

/** Adds two deltas. */
export function mergeDeltas(a: ResourceDelta, b: ResourceDelta): ResourceDelta {
  const merged: ResourceDelta = { ...a };
  for (const key of RESOURCE_KEYS) {
    if (b[key] !== undefined) merged[key] = (merged[key] ?? 0) + (b[key] as number);
  }
  return merged;
}

/** Resolves choices into effects. */
export class EffectResolver {
  /** Rolls any gamble and merges it with the choice's fixed effects. */
  resolve(choice: Choice, rng: RandomSource): ResolvedChoice {
    const effects: ResourceDelta = { ...(choice.effects ?? {}) };
    if (!choice.gamble) return { effects };
    const gamble = choice.gamble;
    const won = rng.chance(gamble.p);
    return {
      effects: mergeDeltas(effects, won ? gamble.win : gamble.lose),
      gamble: {
        won,
        message: won ? gamble.winText : gamble.loseText,
        tone: won ? 'good' : 'bad',
        goto: won ? gamble.winGoto : gamble.loseGoto,
        winNext: won ? gamble.winNext : undefined,
      },
    };
  }

  /** Builds the preview for one option (certain effects, uncertain keys, days). */
  preview(choice: Choice, world: WorldId): ChoicePreview {
    const effects = { ...(choice.effects ?? {}) };
    const uncertain = new Set<ResourceKey>();
    const addUnknown = (delta: ResourceDelta | undefined) => {
      for (const key of RESOURCE_KEYS)
        if (delta?.[key] !== undefined && !(key in effects)) uncertain.add(key);
    };
    if (choice.gamble) {
      addUnknown(choice.gamble.win);
      addUnknown(choice.gamble.lose);
    }
    addUnknown(choice.later?.effects);
    return {
      label: choice.label,
      days: localizeDays(choice.days, world),
      effects,
      uncertain: [...uncertain],
      hasGamble: Boolean(choice.gamble),
    };
  }
}
