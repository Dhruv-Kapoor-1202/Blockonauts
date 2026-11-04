/**
 * PlayerRegistry: remembers which server-side player this browser is. The first run registers the
 * callsign with `POST /api/players` and stores the returned id in localStorage; a different
 * callsign later registers a new player so leaderboard rows carry the right name.
 */
import type { ApiClient } from './types';

interface StoredPlayer {
  playerId: string;
  callsign: string;
}

/** Maps this browser to a server player id. */
export class PlayerRegistry {
  constructor(
    private readonly api: ApiClient,
    private readonly storage: Pick<Storage, 'getItem' | 'setItem'>,
    private readonly storageKey: string,
  ) {}

  /** The stored player id, if this browser has registered before. */
  currentId(): string | null {
    return this.read()?.playerId ?? null;
  }

  /** The stored player id for `callsign`, registering with the server when needed. */
  async ensure(callsign: string): Promise<string> {
    const stored = this.read();
    if (stored && stored.callsign === callsign) return stored.playerId;
    const player = await this.api.createPlayer(callsign);
    this.write({ playerId: player.playerId, callsign: player.callsign });
    return player.playerId;
  }

  private read(): StoredPlayer | null {
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<StoredPlayer>;
      return typeof parsed.playerId === 'string' && typeof parsed.callsign === 'string'
        ? { playerId: parsed.playerId, callsign: parsed.callsign }
        : null;
    } catch {
      return null;
    }
  }

  private write(player: StoredPlayer): void {
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(player));
    } catch {
      // Storage unavailable: the player is simply re-registered next time.
    }
  }
}
