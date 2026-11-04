/**
 * neo-brutalist theme definition: ties together the tokens, class recipes, portraits, scene and
 * motion timings. Fonts are bundled locally with @fontsource (no CDN), so the game works offline.
 */
import '@fontsource/archivo-black/400.css';
import '@fontsource/silkscreen/400.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import './tokens.css';
import type { ThemeDefinition } from '../types';
import { NeoBackground } from './Background';
import { NeoPortrait } from './portraits';
import * as game from './recipes/game';
import { report } from './recipes/report';
import { chapter, landing, select, shared } from './recipes/shared';

/** The faithful port of the original prototype: thick ink borders, hard shadows, pixel planet. */
export const neoBrutalist: ThemeDefinition = {
  id: 'neo-brutalist',
  name: 'Neo-Brutalist',
  tokensClass: 'theme-neo',
  worldTokens: { moon: 'world-moon', mars: 'world-mars' },
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
  Portrait: NeoPortrait,
  Background: NeoBackground,
  motion: { cardDealMs: 380, flyOutMs: 300, stickerMs: 1300 },
};
