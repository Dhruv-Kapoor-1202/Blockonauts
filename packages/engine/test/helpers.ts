/**
 * Shared test helpers: load the mini content bundle, build sessions, and play bots.
 */
import {
  ContentBundle,
  ContentLoader,
  ContentValidator,
  GameSessionFactory,
  SeededRandom,
} from '../src/index.js';
import type { ChoiceCommand, GameSession, Side } from '../src/index.js';
import { buildMiniContentFiles } from './fixtures/mini-content.js';

/** Loads the mini fixture into a validated bundle. */
export function loadMini(): ContentBundle {
  const { data } = ContentLoader.load(buildMiniContentFiles());
  return new ContentBundle(data);
}

/** The mini fixture together with its source index (for validator tests). */
export function loadMiniWithSources() {
  return ContentLoader.load(buildMiniContentFiles());
}

/** Starts a session on the mini campaign. */
export function startMini(
  options: { world?: string; difficulty?: string; seed?: number } = {},
  bundle: ContentBundle = loadMini(),
): GameSession {
  return GameSessionFactory.create({
    bundle,
    worldId: options.world ?? 'moon',
    difficultyId: options.difficulty ?? 'commander',
    seed: options.seed ?? 1,
    callsign: 'TEST',
  });
}

/** Plays a scripted list of sides, proceeding through results automatically. */
export function playSides(session: GameSession, sides: Side[]): void {
  for (const side of sides) {
    while (session.status === 'chapterResult') session.proceed();
    session.choose(side);
  }
}

/** Plays until the mission is over with a seeded random bot (retries and failures included). */
export function playToEnd(session: GameSession, botSeed = 1, limit = 3000): ChoiceCommand[] {
  const bot = new SeededRandom(botSeed);
  let step = 0;
  while (session.status !== 'missionOver' && step < limit) {
    if (session.status === 'chapterResult') session.proceed();
    else session.choose(bot.chance(0.5) ? 'left' : 'right');
    step += 1;
  }
  if (session.status !== 'missionOver') throw new Error('bot did not finish');
  return [...session.commandLog];
}

export { ContentValidator };
