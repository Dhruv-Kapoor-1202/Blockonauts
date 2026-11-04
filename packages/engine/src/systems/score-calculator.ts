/**
 * ScoreCalculator: the prototype formula (days, facts, badges, win bonus) plus a bonus for each
 * chapter cleared and a penalty for each chapter retry. The server uses it for verified scores.
 */
import type { GameConfig } from '../content/schemas/index.js';

/** Inputs to the score. */
export interface ScoreInput {
  day: number;
  factsLogged: number;
  achievements: number;
  won: boolean;
  chaptersCleared: number;
  retries: number;
}

/** Computes the final score. */
export class ScoreCalculator {
  /** @param scoring tuning from `config.json`. */
  constructor(private readonly scoring: GameConfig['scoring']) {}

  /** @returns a non-negative integer score. */
  compute(input: ScoreInput): number {
    const s = this.scoring;
    const raw =
      Math.max(0, input.day) * s.perDay +
      input.factsLogged * s.perFact +
      input.achievements * s.perAchievement +
      (input.won ? s.winBonus : 0) +
      input.chaptersCleared * s.perChapterCleared -
      input.retries * s.perRetry;
    return Math.max(0, Math.round(raw));
  }
}
