/**
 * Small shared service helpers: the injectable clock (deterministic time in tests) and a guard
 * that resolves an existing player or raises 404.
 */
import { NotFoundError } from '../errors/app-error.js';
import type { Player } from '../domain/models.js';
import type { IPlayerRepository } from '../repositories/interfaces/repositories.js';

/** Source of the current time. */
export type Clock = () => Date;

/** Wall-clock time. */
export const systemClock: Clock = () => new Date();

/** @throws NotFoundError (`PLAYER_NOT_FOUND`) when the player is not registered. */
export async function requirePlayer(players: IPlayerRepository, playerId: string): Promise<Player> {
  const player = await players.findById(playerId);
  if (!player) throw new NotFoundError(`Player ${playerId} not found`, 'PLAYER_NOT_FOUND');
  return player;
}
