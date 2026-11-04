/**
 * Effect preview: turns an option's `ChoicePreview` into the dot shown above/next to each resource
 * meter while the card is dragged or an option is hovered. Dot size is big for |delta| >= 10,
 * uncertain keys (gambles, delayed effects) get a dashed `?` dot, and the up/down tone only shows
 * when the difficulty enables hints (Cadet).
 */
import type { ChoicePreview, ResourceKey } from '@commander/engine';
import { METER } from './constants';

/** State of one preview dot. */
export interface DotState {
  state: 'off' | 'small' | 'big';
  kind: 'certain' | 'uncertain';
  tone: 'neutral' | 'up' | 'down';
}

/** The hidden dot. */
export const NO_DOT: DotState = { state: 'off', kind: 'certain', tone: 'neutral' };

/** Computes the dot of a resource for a previewed choice (`null` hides every dot). */
export function dotFor(key: ResourceKey, preview: ChoicePreview | null, hints: boolean): DotState {
  if (!preview) return NO_DOT;
  const delta = preview.effects[key];
  if (delta) {
    return {
      state: Math.abs(delta) >= METER.bigDotDelta ? 'big' : 'small',
      kind: 'certain',
      tone: hints ? (delta > 0 ? 'up' : 'down') : 'neutral',
    };
  }
  if (preview.uncertain.includes(key))
    return { state: 'small', kind: 'uncertain', tone: 'neutral' };
  return NO_DOT;
}
