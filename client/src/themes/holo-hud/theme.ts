/**
 * holo-hud theme definition: ties together the tokens, class recipes, portraits, scene and motion
 * timings. JetBrains Mono (telemetry) and Orbitron (headings) are bundled locally with
 * @fontsource (no CDN), so the game works offline.
 */
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import '@fontsource/orbitron/latin-500.css';
import '@fontsource/orbitron/latin-700.css';
import '@fontsource/orbitron/latin-900.css';
import './tokens.css';
import './worlds.css';
import './motion.css';
import type { ThemeDefinition } from '../types';
import { HoloBackground } from './Background';
import { HoloPortrait } from './portraits';
import * as game from './recipes/game';
import { report } from './recipes/report';
import { chapter, landing, select, shared } from './recipes/shared';

/** Sci-fi spacecraft HUD: dark glass, neon glows, corner brackets, scanlines, holographic busts. */
export const holoHud: ThemeDefinition = {
  id: 'holo-hud',
  name: 'Holo HUD',
  tokensClass: 'theme-holo',
  worldTokens: { moon: 'world-holo-moon', mars: 'world-holo-mars' },
  classes: {
    ...shared,
    landing,
    select,
    chapter,
    report,
    time: game.time,
    timeline: game.timeline,
    timelineCell: game.timelineCell,
    card: game.card,
    option: game.option,
    optionTitle: game.optionTitle,
    optionBadge: game.optionBadge,
    resource: game.resource,
    notes: game.notes,
    notesHeader: game.notesHeader,
    notesList: game.notesList,
    notesItem: game.notesItem,
  },
  Portrait: HoloPortrait,
  Background: HoloBackground,
  motion: { cardDealMs: 420, flyOutMs: 280, stickerMs: 1400 },
};
