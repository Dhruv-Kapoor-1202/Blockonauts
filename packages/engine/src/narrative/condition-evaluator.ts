/**
 * ConditionEvaluator: decides whether a `when` condition holds. All fields are AND-ed; an
 * empty condition is always true. Used by text variants, conditional gotos and interludes.
 */
import type { ResourceValues, WorldId } from '../domain/ids.js';
import type { Condition } from '../content/schemas/index.js';

/** The slice of game state a condition may inspect. */
export interface ConditionContext {
  hasFlag(flag: string): boolean;
  worldId: WorldId;
  day: number;
  resources: ResourceValues;
  /** Retries already used in the current chapter. */
  chapterRetries: number;
}

/** Stateless evaluator for {@link Condition}. */
export class ConditionEvaluator {
  /** @returns true when every present field of the condition holds. */
  matches(condition: Condition | undefined, ctx: ConditionContext): boolean {
    if (!condition) return true;
    const {
      flags,
      notFlags,
      anyFlags,
      world,
      minDay,
      maxDay,
      resourceAbove,
      resourceBelow,
      chapterRetries,
    } = condition;
    if (flags && !flags.every((flag) => ctx.hasFlag(flag))) return false;
    if (notFlags && notFlags.some((flag) => ctx.hasFlag(flag))) return false;
    if (anyFlags && !anyFlags.some((flag) => ctx.hasFlag(flag))) return false;
    if (world !== undefined && !(Array.isArray(world) ? world : [world]).includes(ctx.worldId))
      return false;
    if (minDay !== undefined && ctx.day < minDay) return false;
    if (maxDay !== undefined && ctx.day > maxDay) return false;
    if (
      resourceAbove &&
      !this.compare(resourceAbove, ctx.resources, (value, limit) => value > limit)
    )
      return false;
    if (
      resourceBelow &&
      !this.compare(resourceBelow, ctx.resources, (value, limit) => value < limit)
    )
      return false;
    return chapterRetries === undefined || ctx.chapterRetries >= chapterRetries;
  }

  private compare(
    limits: Partial<Record<keyof ResourceValues, number>>,
    values: ResourceValues,
    test: (value: number, limit: number) => boolean,
  ): boolean {
    return (Object.entries(limits) as [keyof ResourceValues, number][]).every(([key, limit]) =>
      test(values[key], limit),
    );
  }
}
