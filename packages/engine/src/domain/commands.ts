/**
 * Command pattern: every player input is a serialisable command. Replaying the commands of a
 * run against the same seed reproduces it exactly, which is how the server verifies scores.
 */
import type { Side } from './ids.js';

/** Pick the left or right option of the current card. */
export interface ChooseCommand {
  kind: 'choose';
  side: Side;
}

/** Leave the chapter result screen: continue to the next chapter or retry this one. */
export interface ProceedCommand {
  kind: 'proceed';
}

/** A player input. */
export type ChoiceCommand = ChooseCommand | ProceedCommand;
