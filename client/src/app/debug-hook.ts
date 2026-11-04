/**
 * Dev-only debug hook, mirroring the prototype's `window.__g`: `S` (getter for the current
 * GameView), `choose`, `start`, `setMode` and `setDiff`. It is imported dynamically behind
 * `import.meta.env.DEV`, so the production bundle contains none of it.
 */
import type { GameView, Side } from '@commander/engine';

/** What the app lets the debug hook do. */
export interface DebugApi {
  getView: () => GameView | null;
  choose: (side: Side) => void;
  start: () => void;
  setWorld: (worldId: string) => void;
  setDifficulty: (difficultyId: string) => void;
}

/** The shape of `window.__g`. */
export interface DebugHook {
  readonly S: GameView | null;
  choose: (side: 'L' | 'R' | Side) => void;
  start: () => void;
  setMode: (worldId: string) => void;
  setDiff: (difficultyId: string) => void;
}

declare global {
  interface Window {
    __g?: DebugHook;
  }
}

function toSide(side: 'L' | 'R' | Side): Side {
  return side === 'L' || side === 'left' ? 'left' : 'right';
}

/** Installs `window.__g`. @returns a function that removes it. */
export function installDebugHook(api: DebugApi): () => void {
  window.__g = {
    get S() {
      return api.getView();
    },
    choose: (side) => api.choose(toSide(side)),
    start: api.start,
    setMode: api.setWorld,
    setDiff: api.setDifficulty,
  };
  return () => {
    delete window.__g;
  };
}
