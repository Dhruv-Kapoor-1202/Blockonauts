/**
 * WorldRegistry (Factory): maps a world definition's `strategy` to its World class.
 * To add a world with new rules, write one class and add one entry here.
 */
import type { WorldDef } from '../content/schemas/index.js';
import { MarsWorld } from './mars-world.js';
import { MoonWorld } from './moon-world.js';
import type { World } from './world.js';

/** Builds the World strategy for a definition. */
export function createWorld(def: WorldDef): World {
  switch (def.strategy) {
    case 'lunar':
      return new MoonWorld(def);
    case 'dust':
      return new MarsWorld(def);
  }
}
