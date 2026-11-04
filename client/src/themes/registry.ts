/**
 * The single list of available themes. To add a theme: create `themes/<id>/` (tokens.css,
 * theme.ts, portraits.tsx, Background.tsx) and add one line here. The first entry is the default.
 */
import { holoHud } from './holo-hud/theme';
import { minimal } from './minimal/theme';
import { neoBrutalist } from './neo-brutalist/theme';
import type { ThemeDefinition } from './types';

/** Every theme the settings menu offers. */
export const THEMES: readonly ThemeDefinition[] = [neoBrutalist, minimal, holoHud];
