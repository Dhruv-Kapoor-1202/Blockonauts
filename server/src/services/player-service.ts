/**
 * PlayerService: registers players. Ids come from `crypto.randomUUID()`; the callsign has already
 * been normalised by the request schema.
 */
import { randomUUID } from 'node:crypto';
import type { Player } from '../domain/models.js';
import type { IPlayerRepository } from '../repositories/interfaces/repositories.js';
import type { Clock } from './shared.js';

/** Use cases around players. */
export class PlayerService {
  constructor(
    private readonly players: IPlayerRepository,
    private readonly clock: Clock,
  ) {}

  /** Registers a player with a fresh id. */
  async register(callsign: string): Promise<Player> {
    const player: Player = {
      id: randomUUID(),
      callsign,
      createdAt: this.clock().toISOString(),
    };
    await this.players.create(player);
    return player;
  }
}
