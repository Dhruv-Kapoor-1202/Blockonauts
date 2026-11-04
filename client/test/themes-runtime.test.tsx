/**
 * Runtime theme selection, run for EVERY registered theme: `?theme=<id>` picks it, the settings
 * menu switches to it (persisting the choice in localStorage), a stored choice is restored on the
 * next start, and switching in the middle of a game keeps the same DOM (no remount).
 */
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY } from '../src/themes/ThemeProvider';
import { THEMES } from '../src/themes/registry';
import { createTestServices, renderApp, startGame } from './support';

const [first] = THEMES;
const others = THEMES.filter((theme) => theme !== first);

async function openMenu(user: ReturnType<typeof renderApp>['user']) {
  await user.click((await screen.findAllByRole('button', { name: 'Settings' }))[0] as HTMLElement);
}

describe.each(THEMES.map((theme) => [theme.name, theme] as const))('theme "%s"', (_name, theme) => {
  it('is selected by ?theme=<id> without being persisted', async () => {
    window.history.replaceState(null, '', `/?theme=${theme.id}`);
    renderApp(createTestServices());
    await screen.findByTestId('landing-screen');
    expect(document.documentElement).toHaveClass(theme.tokensClass);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('is chosen from the settings menu and persisted in localStorage', async () => {
    const { user } = renderApp(createTestServices());
    await openMenu(user);
    expect(await screen.findAllByRole('menuitemradio')).toHaveLength(THEMES.length);
    await user.click(await screen.findByRole('menuitemradio', { name: theme.name }));

    expect(document.documentElement).toHaveClass(theme.tokensClass);
    for (const other of THEMES.filter((t) => t !== theme))
      expect(document.documentElement).not.toHaveClass(other.tokensClass);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(theme.id);
    await openMenu(user);
    expect(screen.getByRole('menuitemradio', { name: theme.name })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('is restored from localStorage on the next start', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme.id);
    renderApp(createTestServices());
    await screen.findByTestId('landing-screen');
    expect(document.documentElement).toHaveClass(theme.tokensClass);
  });

  it('plays the first card with its world accent and recipes', async () => {
    window.history.replaceState(null, '', `/?theme=${theme.id}`);
    const { user } = renderApp(createTestServices());
    await startGame(user);

    expect(document.documentElement).toHaveClass(theme.tokensClass);
    expect(document.documentElement).toHaveClass(theme.worldTokens.moon);
    expect(screen.getByTestId('card').className).toContain(theme.classes.card.root);
    const right = screen.getByRole('button', { name: /Right option/ });
    expect(right).toHaveAttribute('data-side', 'right');
    expect(right.className).toBe(theme.classes.option);
    await user.keyboard('d');
    await screen.findByText('Skip the leak test?');
  });
});

describe('switching themes mid-game', () => {
  it.each(others.map((theme) => [theme.name, theme] as const))(
    'the first theme -> "%s" keeps the running game mounted',
    async (_name, target) => {
      const { user } = renderApp(createTestServices());
      await startGame(user);
      await user.keyboard('d');
      await screen.findByText('Skip the leak test?');
      const card = screen.getByTestId('card');
      const game = screen.getByTestId('game-screen');
      const day = screen.getByTestId('day').textContent;
      expect(document.documentElement).toHaveClass((first ?? target).tokensClass);

      await openMenu(user);
      await user.click(await screen.findByRole('menuitemradio', { name: target.name }));

      expect(document.documentElement).toHaveClass(target.tokensClass);
      expect(document.documentElement).toHaveClass(target.worldTokens.moon);
      expect(screen.getByTestId('card')).toBe(card);
      expect(screen.getByTestId('game-screen')).toBe(game);
      expect(screen.getByTestId('day')).toHaveTextContent(day ?? '');
      expect(screen.getByRole('button', { name: /Right option/ }).className).toBe(
        target.classes.option,
      );
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(target.id);
    },
  );
});
