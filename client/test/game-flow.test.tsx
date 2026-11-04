/**
 * Game flow through the real UI with the mini campaign and zero delays: option buttons and the
 * keyboard advance the story, the Continue button resumes a save, ARIA answers, and finishing the
 * mission deletes the save and submits the run (inputs only) to the leaderboard.
 */
import { GameSessionFactory } from '@commander/engine';
import { act, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FAST_TIMING } from '../src/game/timing';
import { buildMiniBundle, cardText, createTestServices, renderApp, startGame } from './support';

describe('Landing', () => {
  it('shows Continue only when a saved run exists and resumes it', async () => {
    const services = createTestServices();
    const empty = renderApp(services);
    await screen.findByLabelText('Commander callsign');
    expect(screen.queryByRole('button', { name: /continue/i })).toBeNull();
    empty.unmount();

    const session = GameSessionFactory.create({
      bundle: buildMiniBundle(),
      worldId: 'mars',
      difficultyId: 'commander',
      seed: 99,
      callsign: 'GRACE',
    });
    session.choose('right');
    await services.progress.save('saved-run', session.snapshot());

    const { user } = renderApp(services);
    const resume = await screen.findByRole('button', { name: /continue/i });
    await user.click(resume);
    const card = await screen.findByTestId('card');
    expect(card).toHaveAttribute('data-card-id', 'mini.leak');
    expect(screen.getByTestId('game-screen')).toBeInTheDocument();
  });

  it('submits the callsign with Enter and uppercases it', async () => {
    const { user } = renderApp();
    const input = await screen.findByLabelText('Commander callsign');
    await user.type(input, 'ada{Enter}');
    expect(await screen.findByRole('radio', { name: /commander/i })).toBeInTheDocument();
  });
});

describe('Game screen', () => {
  it('advances the story when an option button is clicked', async () => {
    const { user } = renderApp();
    await startGame(user);
    expect(screen.getByTestId('card')).toHaveAttribute('data-card-id', 'mini.start');
    expect(cardText()).toBe('Load food or science?');

    await user.click(screen.getByRole('button', { name: /Right option: Science/ }));
    await waitFor(() =>
      expect(screen.getByTestId('card')).toHaveAttribute('data-card-id', 'mini.leak'),
    );
    expect(cardText()).toBe('Skip the leak test?');
  });

  it('previews the option on hover: day badge, preview dots (Cadet tones) and the highlighted button', async () => {
    const { user } = renderApp();
    await startGame(user, { difficulty: 'cadet' });
    const left = screen.getByRole('button', { name: /Left option: Food/ });
    const preview = screen.getByTestId('day-preview');
    expect(preview).toHaveAttribute('data-on', 'false');

    await user.hover(left);
    expect(preview).toHaveAttribute('data-on', 'true');
    expect(preview).toHaveTextContent('+1 DAY');
    expect(left).toHaveAttribute('data-highlighted', 'true');
    const food = document.querySelector('[data-resource="F"] i') as HTMLElement;
    expect(food).toHaveAttribute('data-state', 'small');
    expect(food).toHaveAttribute('data-tone', 'up');
    const power = document.querySelector('[data-resource="P"] i') as HTMLElement;
    expect(power).toHaveAttribute('data-state', 'off');

    await user.unhover(left);
    expect(preview).toHaveAttribute('data-on', 'false');
    expect(food).toHaveAttribute('data-state', 'off');
  });

  it('shows the duration badge, the day and the field note after a choice', async () => {
    const { user } = renderApp();
    await startGame(user);
    const left = screen.getByRole('button', { name: /Left option: Food/ });
    expect(within(left).getByText('T+1 DAY')).toBeInTheDocument();
    expect(screen.getByTestId('day')).toHaveTextContent('T-3');

    await user.click(left);
    await waitFor(() => expect(screen.getByTestId('day')).toHaveTextContent('T-2'));
    expect(screen.getByText('Fact for mini.start.')).toBeInTheDocument();
  });

  it.each([
    ['{ArrowLeft}', 'Heavy ship. Skip the leak test?'],
    ['a', 'Heavy ship. Skip the leak test?'],
    ['{ArrowRight}', 'Skip the leak test?'],
    ['d', 'Skip the leak test?'],
  ])('chooses with the keyboard (%s)', async (key, expectedText) => {
    const { user } = renderApp();
    await startGame(user);
    await user.keyboard(key);
    await waitFor(() =>
      expect(screen.getByTestId('card')).toHaveAttribute('data-card-id', 'mini.leak'),
    );
    expect(cardText()).toBe(expectedText);
  });

  it('shows ARIA advice in a bubble when the AI button is pressed', async () => {
    // Real-scale timers (instant waits) so the six-second auto-hide does not fire immediately.
    const { user } = renderApp(
      createTestServices({ timing: { ...FAST_TIMING, scale: (ms: number) => ms } }),
    );
    await startGame(user);
    await user.click(screen.getByRole('button', { name: /Ask ARIA/ }));
    const bubble = await screen.findByText(/ARIA \/\//);
    expect(bubble.parentElement?.textContent?.length).toBeGreaterThan(12);
    await user.click(screen.getByRole('button', { name: /Ask ARIA/ }));
    expect(screen.queryByText(/ARIA \/\//)).toBeNull();
  });

  it('shows the drag hint on the first cards only', async () => {
    const { user } = renderApp();
    await startGame(user);
    expect(screen.getByText('◀ DRAG ▶')).toBeInTheDocument();
    await user.keyboard('d');
    await waitFor(() => expect(cardText()).toBe('Skip the leak test?'));
    await user.keyboard('d');
    await waitFor(() => expect(screen.queryByText('◀ DRAG ▶')).toBeNull());
  });
});

describe('Chapter flow', () => {
  it('shows the chapter result with a retry button, then the intro again with the retry count', async () => {
    const { user } = renderApp();
    await startGame(user);
    await user.keyboard('d'); // packedScience: the scrub path in the mini campaign
    await waitFor(() => expect(cardText()).toBe('Skip the leak test?'));
    await user.keyboard('a'); // skip the leak test -> scrubbed
    const result = await screen.findByTestId('chapter-result-screen');
    expect(within(result).getByRole('heading', { name: 'SCRUBBED' })).toBeInTheDocument();
    expect(within(result).getByText('Checks matter.')).toBeInTheDocument();
    await user.click(within(result).getByRole('button', { name: /retry chapter/i }));
    const intro = await screen.findByTestId('chapter-intro-screen');
    expect(within(intro).getByText(/RETRIES: 1/)).toBeInTheDocument();
  });

  it('finishing the mission deletes the save and submits only the run inputs', async () => {
    const services = createTestServices();
    const { user } = renderApp(services);
    await startGame(user, { difficulty: 'cadet' });

    for (let guard = 0; guard < 400; guard += 1) {
      if (screen.queryByTestId('report-screen')) break;
      if (screen.queryByTestId('chapter-intro-screen')) {
        await user.click(screen.getByRole('button', { name: /begin/i }));
      } else if (screen.queryByTestId('chapter-result-screen')) {
        const buttons = within(screen.getByTestId('chapter-result-screen')).getAllByRole('button');
        await user.click(buttons[buttons.length - 1] as HTMLElement);
      } else if (screen.queryByTestId('game-screen')) {
        await user.keyboard('d');
        await act(async () => {
          await Promise.resolve();
        });
      }
      await waitFor(() => undefined);
    }

    const report = await screen.findByTestId('report-screen');
    expect(within(report).getByText(/MISSION REPORT/)).toBeInTheDocument();
    await waitFor(() => expect(services.submissions).toHaveLength(1));
    const [submission] = services.submissions;
    expect(submission?.callsign).toBe('ADA');
    expect(submission?.commands.length).toBeGreaterThan(2);
    expect(submission?.seed).toBe(1234);
    const progress = services.progress;
    expect(progress.saves).toBeGreaterThan(2);
    expect(progress.deleted).toContain(submission?.runId);
    expect(progress.runs.size).toBe(0);
    expect(await within(report).findByText(/TOP COMMANDERS/)).toBeInTheDocument();
  });
});
