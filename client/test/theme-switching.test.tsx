/**
 * Theme switching: choosing another theme from the gear menu swaps the <html> token class and the
 * recipes WITHOUT remounting the running game (same DOM node, same day, same card), and the choice
 * is persisted; `?theme=` overrides the stored choice.
 */
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY, resolveInitialTheme } from '../src/themes/ThemeProvider';
import { neoBrutalist } from '../src/themes/neo-brutalist/theme';
import type { ThemeDefinition } from '../src/themes/types';
import { createTestServices, renderApp, startGame } from './support';

const alternate: ThemeDefinition = {
  ...neoBrutalist,
  id: 'alt',
  name: 'Alternate',
  tokensClass: 'theme-alt',
  worldTokens: { moon: 'alt-moon', mars: 'alt-mars' },
  classes: {
    ...neoBrutalist.classes,
    option: `${neoBrutalist.classes.option} alt-option`,
    panel: 'alt-panel',
  },
  Portrait: () => <svg data-testid="alt-portrait" />,
};

describe('theme switching', () => {
  it('applies the new tokens class and recipes without remounting the game', async () => {
    const { user } = renderApp(createTestServices(), [neoBrutalist, alternate]);
    await startGame(user);
    await user.keyboard('d');
    await screen.findByText('Skip the leak test?');

    const html = document.documentElement;
    expect(html).toHaveClass('theme-neo');
    expect(html).toHaveClass('world-moon');
    const card = screen.getByTestId('card');
    const gameScreen = screen.getByTestId('game-screen');
    const option = screen.getByRole('button', { name: /Right option/ });
    expect(option.className).not.toContain('alt-option');
    const day = screen.getByTestId('day');
    const dayText = day.textContent;
    expect(within(card).queryByTestId('alt-portrait')).toBeNull();

    await user.click(screen.getAllByRole('button', { name: 'Settings' })[0] as HTMLElement);
    await user.click(await screen.findByRole('menuitemradio', { name: 'Alternate' }));

    expect(html).toHaveClass('theme-alt');
    expect(html).not.toHaveClass('theme-neo');
    expect(html).toHaveClass('alt-moon');
    expect(screen.getByTestId('card')).toBe(card);
    expect(screen.getByTestId('game-screen')).toBe(gameScreen);
    expect(screen.getByRole('button', { name: /Right option/ })).toBe(option);
    expect(option.className).toContain('alt-option');
    expect(screen.getByTestId('day')).toHaveTextContent(dayText ?? '');
    expect(within(card).getByTestId('alt-portrait')).toBeInTheDocument();
    expect(screen.getByText('Skip the leak test?')).toBeInTheDocument();
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('alt');
  });

  it('lists every registered theme in the menu', async () => {
    const { user } = renderApp(createTestServices(), [neoBrutalist, alternate]);
    await user.click(
      (await screen.findAllByRole('button', { name: 'Settings' }))[0] as HTMLElement,
    );
    const items = await screen.findAllByRole('menuitemradio');
    expect(items.map((item) => item.textContent)).toEqual(['Neo-Brutalist', 'Alternate']);
    expect(items[0]).toHaveAttribute('aria-checked', 'true');
  });
});

describe('resolveInitialTheme', () => {
  const themes = [neoBrutalist, alternate];
  const storageWith = (value: string | null) => ({ getItem: () => value });

  it('defaults to the first theme', () => {
    expect(resolveInitialTheme(themes, '', storageWith(null)).id).toBe('neo-brutalist');
  });

  it('uses the stored choice, and ?theme= overrides it', () => {
    expect(resolveInitialTheme(themes, '', storageWith('alt')).id).toBe('alt');
    expect(resolveInitialTheme(themes, '?theme=neo-brutalist', storageWith('alt')).id).toBe(
      'neo-brutalist',
    );
  });

  it('ignores unknown ids', () => {
    expect(resolveInitialTheme(themes, '?theme=nope', storageWith('also-nope')).id).toBe(
      'neo-brutalist',
    );
  });
});
