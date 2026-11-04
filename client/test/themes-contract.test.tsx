/**
 * Theme contract, run for EVERY theme in the registry: complete recipe objects, unique token
 * classes, every Tailwind-mapped token declared in the theme's CSS, portraits for the real
 * characters (and safe against hostile character data), and scene backgrounds for every world
 * and phase. Adding a theme to `registry.ts` automatically puts it under these tests.
 */
import type { CharacterDef, WorldId } from '@commander/engine';
import { render } from '@testing-library/react';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadBundledContent } from '../src/api/bundled-content';
import { THEMES } from '../src/themes/registry';
import type { ThemeDefinition } from '../src/themes/types';

const THEMES_DIR = fileURLToPath(new URL('../src/themes', import.meta.url));
const INDEX_CSS = fileURLToPath(new URL('../src/styles/index.css', import.meta.url));
const WORLDS: readonly WorldId[] = ['moon', 'mars'];
const characters = loadBundledContent().data.characters;
const reference = THEMES[0] as ThemeDefinition;

/** Every leaf path of a nested object, e.g. `card.stamp.left`. */
function leafPaths(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

function leafValue(value: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], value);
}

function themeFiles(theme: ThemeDefinition, extension: RegExp): string[] {
  return readdirSync(join(THEMES_DIR, theme.id), { recursive: true, encoding: 'utf8' })
    .filter((file) => extension.test(file))
    .map((file) => join(THEMES_DIR, theme.id, file));
}

const cssOf = (theme: ThemeDefinition) =>
  themeFiles(theme, /\.css$/)
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');

describe('registry', () => {
  it('lists unique ids, token classes and world classes', () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(3);
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    const classes = THEMES.flatMap((t) => [t.tokensClass, ...Object.values(t.worldTokens)]);
    expect(classes.every((name) => /^[a-z][a-z0-9-]*$/.test(name))).toBe(true);
    expect(new Set(classes).size).toBe(classes.length);
  });

  it('ships the three documented themes', () => {
    expect(THEMES.map((t) => t.id)).toEqual(
      expect.arrayContaining(['neo-brutalist', 'minimal', 'holo-hud']),
    );
  });
});

describe.each(THEMES.map((theme) => [theme.id, theme] as const))('theme %s', (_id, theme) => {
  it('fills every recipe key with a non-empty class string', () => {
    const expected = leafPaths(reference.classes).sort();
    expect(leafPaths(theme.classes).sort()).toEqual(expected);
    const empty = expected.filter((path) => {
      const value = leafValue(theme.classes, path);
      return typeof value !== 'string' || value.trim() === '';
    });
    expect(empty).toEqual([]);
  });

  it('defines a sticker recipe per tone and a world class for moon and mars', () => {
    expect(Object.keys(theme.classes.sticker).sort()).toEqual(['bad', 'good', 'neutral', 'time']);
    for (const world of WORLDS) expect(theme.worldTokens[world]).toBeTruthy();
    expect(theme.name.trim()).not.toBe('');
  });

  it('has sane motion timings', () => {
    const { cardDealMs, flyOutMs, stickerMs } = theme.motion;
    for (const ms of [cardDealMs, flyOutMs, stickerMs]) {
      expect(ms).toBeGreaterThan(0);
      expect(ms).toBeLessThanOrEqual(2000);
    }
  });

  it('declares its token class, world classes and every token the Tailwind mapping reads', () => {
    const css = cssOf(theme);
    expect(css).toContain(`.${theme.tokensClass}`);
    for (const world of WORLDS) expect(css).toContain(`.${theme.worldTokens[world]}`);
    const mapped = new Set(
      [...readFileSync(INDEX_CSS, 'utf8').matchAll(/var\((--t-[a-z0-9-]+)\)/g)].map((m) => m[1]),
    );
    const missing = [...mapped].filter((token) => !css.includes(`${token}:`));
    expect(missing).toEqual([]);
  });

  it('keeps raw colours and font names out of the TypeScript sources', () => {
    for (const file of themeFiles(theme, /\.tsx?$/)) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(source, file).not.toMatch(/rgba?\(|hsla?\(/);
    }
  });

  it('renders a portrait for every real character without scripts or event handlers', () => {
    expect(characters.length).toBeGreaterThan(5);
    for (const character of characters) {
      const { container, unmount } = render(<theme.Portrait character={character} />);
      expect(container.querySelector('svg'), character.id).not.toBeNull();
      expect(container.querySelectorAll('svg *').length, character.id).toBeGreaterThan(2);
      expect(container.querySelector('script, foreignObject, iframe, image')).toBeNull();
      const handlers = [...container.querySelectorAll('*')].flatMap((el) =>
        el.getAttributeNames().filter((name) => name.startsWith('on')),
      );
      expect(handlers).toEqual([]);
      unmount();
    }
  });

  it('does not inject markup from hostile character data', () => {
    const payload = '"><script>window.__pwned=1</script><img src=x onerror=window.__pwned=1>';
    for (const kind of ['human', 'ai', 'earth'] as const) {
      const hostile = {
        id: 'x',
        name: payload,
        role: payload,
        color: payload,
        skin: payload,
        hair: payload,
        kind,
        hairStyle: 'long',
        hat: 'hard',
        glasses: true,
        headset: true,
      } as unknown as CharacterDef;
      const { container, unmount } = render(<theme.Portrait character={hostile} />);
      expect(container.querySelector('script, img')).toBeNull();
      expect((window as { __pwned?: number }).__pwned).toBeUndefined();
      unmount();
    }
  });

  it('draws different portraits for different crew members', () => {
    const humans = characters.filter((c) => c.kind === 'human');
    const markup = humans.map((character) => {
      const { container, unmount } = render(<theme.Portrait character={character} />);
      const html = container.innerHTML.replace(/:r[0-9a-z]+:/g, '');
      unmount();
      return html;
    });
    expect(new Set(markup).size).toBeGreaterThan(humans.length / 2);
  });

  it.each([
    [null, false, false],
    ['moon', true, false],
    ['mars', false, true],
    ['mars', true, true],
  ] as const)('renders the scene for world %s (night %s, storm %s)', (world, night, storm) => {
    const { container } = render(<theme.Background world={world} phase={{ night, storm }} />);
    expect(container.firstElementChild).not.toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    const calm = render(<theme.Background world={world} phase={{ night: false, storm: false }} />);
    if (night || storm) expect(container.innerHTML).not.toBe(calm.container.innerHTML);
    expect(container.querySelector('script')).toBeNull();
  });
});
