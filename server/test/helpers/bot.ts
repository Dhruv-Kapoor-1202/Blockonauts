/**
 * Test bot: plays a session to `missionOver` with a seeded random chooser, proceeding through
 * chapter results. A mission lost to a retry limit still counts as a finished run. Used to
 * produce valid, deterministic command logs.
 */
import {
  GameSessionFactory,
  SeededRandom,
  type ChoiceCommand,
  type ContentBundle,
  type GameSession,
} from '@commander/engine';

const STEP_LIMIT = 3000;

/** Plays `session` until the mission is over and returns its command log. */
export function playToEnd(session: GameSession, botSeed = 1): ChoiceCommand[] {
  const bot = new SeededRandom(botSeed);
  for (let step = 0; session.status !== 'missionOver'; step += 1) {
    if (step >= STEP_LIMIT) throw new Error('bot did not finish the mission');
    if (session.status === 'chapterResult') session.proceed();
    else session.choose(bot.chance(0.5) ? 'left' : 'right');
  }
  return [...session.commandLog];
}

/** Options of a bot run. */
export interface BotRun {
  worldId?: string;
  difficultyId?: string;
  seed?: number;
  botSeed?: number;
  callsign?: string;
}

/** Creates a session and plays it to the end; returns everything a test needs to submit it. */
export function playRun(bundle: ContentBundle, run: BotRun = {}) {
  const options = {
    bundle,
    worldId: run.worldId ?? 'moon',
    difficultyId: run.difficultyId ?? 'commander',
    seed: run.seed ?? 1,
    callsign: run.callsign ?? 'TESTER',
  };
  const session = GameSessionFactory.create(options);
  const commands = playToEnd(session, run.botSeed);
  const report = session.view().report;
  if (!report) throw new Error('finished run has no report');
  return { ...options, commands, report, session };
}
