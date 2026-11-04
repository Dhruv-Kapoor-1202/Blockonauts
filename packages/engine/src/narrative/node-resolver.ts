/**
 * NodeResolver: picks the text variant to show and the `goto` target to follow. Both use
 * "first match wins" over the declared order, evaluated against the current game state.
 */
import { localizeText } from '../content/world-keyed.js';
import type { Goto, Variant } from '../content/schemas/index.js';
import type { WorldId } from '../domain/ids.js';
import type { ConditionContext, ConditionEvaluator } from './condition-evaluator.js';

/** Anything with base text and optional variants. */
export interface VariantSource {
  text: string | Record<string, string>;
  variants?: Variant[];
}

/** Resolves variants and gotos. */
export class NodeResolver {
  /** @param conditions evaluator used for every `when`. */
  constructor(private readonly conditions: ConditionEvaluator) {}

  /** Text for the card: the first matching variant, otherwise the base text. */
  resolveText(source: VariantSource, world: WorldId, ctx: ConditionContext): string {
    const variant = source.variants?.find((candidate) =>
      this.conditions.matches(candidate.when, ctx),
    );
    return localizeText(variant ? variant.text : source.text, world);
  }

  /** The id a `goto` points at: a plain id, or the first branch whose condition holds.
   * @returns undefined when no branch matches. */
  resolveGoto(goto: Goto | undefined, ctx: ConditionContext): string | undefined {
    if (goto === undefined) return undefined;
    if (typeof goto === 'string') return goto;
    return goto.find((branch) => this.conditions.matches(branch.when, ctx))?.to;
  }
}
