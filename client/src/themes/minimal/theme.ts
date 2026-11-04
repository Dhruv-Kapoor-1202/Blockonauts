/**
 * minimal theme definition: ties together the tokens, class recipes, portraits, scene and motion
 * timings. Inter is bundled locally with @fontsource (no CDN), so the game works offline. The
 * colour scheme follows `prefers-color-scheme` through CSS variables only (see tokens.css).
 */
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import './tokens.css';
import './worlds.css';
import './motion.css';
import type { ThemeDefinition } from '../types';
import { MinimalBackground } from './Background';
import { MinimalPortrait } from './portraits';
import * as game from './recipes/game';
import { report } from './recipes/report';
import { chapter, landing, select, shared } from './recipes/shared';

/** Clean, light/dark-aware UI: Inter, hairline borders, rounded corners, restrained motion. */
export const minimal: ThemeDefinition = {
  id: 'minimal',
  name: 'Minimal',
  tokensClass: 'theme-minimal',
  worldTokens: { moon: 'world-minimal-moon', mars: 'world-minimal-mars' },
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
  Portrait: MinimalPortrait,
  Background: MinimalBackground,
  motion: { cardDealMs: 300, flyOutMs: 240, stickerMs: 1200 },
};
