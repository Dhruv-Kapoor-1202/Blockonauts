/**
 * Persistence and playback plumbing: saves and deletes stay ordered, a new run replaces older saves
 * (a resumed run does not), `?fast` zeroes every delay, and the playback runner honours exits and
 * cancellation.
 */
import { GameSessionFactory } from '@commander/engine';
import { describe, expect, it, vi } from 'vitest';
import type { FinishedRun, LeaderboardStore } from '../src/game/leaderboard-store';
import type { PlaybackStep } from '../src/game/playback-plan';
import { playSteps } from '../src/game/playback-runner';
import { RunPersistence } from '../src/game/run-persistence';
import { StickerQueue } from '../src/game/sticker-queue';
import { FAST_TIMING, REAL_TIMING, timingFromSearch } from '../src/game/timing';
import { FakeProgressStore, buildMiniBundle } from './support';

function session() {
  const s = GameSessionFactory.create({
    bundle: buildMiniBundle(),
    worldId: 'moon',
    difficultyId: 'cadet',
    seed: 3,
    callsign: 'ADA',
  });
  s.choose('left');
  return s;
}

const board: LeaderboardStore = {
  submit: (run: FinishedRun) =>
    Promise.resolve({ rows: [], highlightId: run.runId, source: 'local' as const }),
  top: () => Promise.resolve({ rows: [], highlightId: null, source: 'local' as const }),
};

describe('timing', () => {
  it('makes every delay zero with ?fast', async () => {
    expect(timingFromSearch('?fast')).toBe(FAST_TIMING);
    expect(timingFromSearch('')).toBe(REAL_TIMING);
    expect(FAST_TIMING.scale(1300)).toBe(0);
    await expect(FAST_TIMING.wait(10_000)).resolves.toBeUndefined();
  });
});

describe('RunPersistence', () => {
  it('keeps saves and the final delete in order even when a save is slow', async () => {
    const progress = new FakeProgressStore();
    const slowSave = progress.save.bind(progress);
    progress.save = async (runId, snapshot) => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      return slowSave(runId, snapshot);
    };
    const persistence = new RunPersistence(progress, board);
    const s = session();
    persistence.autosave('run-1', s.snapshot());
    const result = await persistence.finish({ runId: 'run-1', callsign: 'ADA' }, s, {
      score: 1,
    } as never);
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(result.highlightId).toBe('run-1');
    expect(progress.runs.has('run-1')).toBe(false);
  });

  it('removes older saves on the first autosave of a new run, but not for a resumed run', async () => {
    const progress = new FakeProgressStore();
    const s = session();
    await progress.save('old', s.snapshot());

    const fresh = new RunPersistence(progress, board);
    fresh.autosave('new', s.snapshot());
    await vi.waitFor(() => expect([...progress.runs.keys()]).toEqual(['new']));

    const resumed = new RunPersistence(progress, board);
    await progress.save('other', s.snapshot());
    resumed.skipPurge('new');
    resumed.autosave('new', s.snapshot());
    await vi.waitFor(() => expect(progress.saves).toBeGreaterThan(3));
    expect(progress.runs.has('other')).toBe(true);
  });

  it('swallows storage failures so play is never interrupted', async () => {
    const progress = new FakeProgressStore();
    progress.save = () => Promise.reject(new Error('disk full'));
    const persistence = new RunPersistence(progress, board);
    persistence.autosave('run-1', session().snapshot());
    await expect(
      persistence.finish({ runId: 'run-1', callsign: 'ADA' }, session(), { score: 1 } as never),
    ).resolves.toBeDefined();
  });
});

describe('playSteps', () => {
  const env = (overrides: Partial<Parameters<typeof playSteps>[1]> = {}) => {
    const applied: PlaybackStep[] = [];
    const stickers = new StickerQueue(FAST_TIMING);
    const enqueue = vi.spyOn(stickers, 'enqueue');
    return {
      applied,
      enqueue,
      env: {
        timing: FAST_TIMING,
        stickers,
        stickerMs: 1300,
        isCancelled: () => false,
        apply: (step: PlaybackStep) => void applied.push(step),
        ...overrides,
      },
    };
  };

  it('applies state steps, queues stickers and stops at the exit', async () => {
    const { applied, enqueue, env: e } = env();
    const exit = await playSteps(
      [
        { kind: 'wait', ms: 5 },
        { kind: 'note', fact: 'x' },
        { kind: 'sticker', sticker: { title: 'HI', tone: 'good' } },
        { kind: 'exit', destination: 'missionReport' },
        { kind: 'note', fact: 'never' },
      ],
      e,
    );
    expect(exit).toBe('missionReport');
    expect(applied).toEqual([{ kind: 'note', fact: 'x' }]);
    expect(enqueue).toHaveBeenCalledWith({ title: 'HI', tone: 'good' }, 1300);
  });

  it('stops quietly when cancelled', async () => {
    let calls = 0;
    const { applied, env: e } = env({ isCancelled: () => (calls += 1) > 1 });
    const exit = await playSteps(
      [
        { kind: 'note', fact: 'one' },
        { kind: 'note', fact: 'two' },
        { kind: 'exit', destination: 'chapterResult' },
      ],
      e,
    );
    expect(exit).toBeNull();
    expect(applied).toHaveLength(1);
  });
});

describe('StickerQueue', () => {
  it('shows stickers one at a time in order', async () => {
    vi.useFakeTimers();
    const queue = new StickerQueue(REAL_TIMING);
    queue.enqueue({ title: 'A', tone: 'good' }, 1300);
    queue.enqueue({ title: 'B', tone: 'bad' }, 1300);
    expect(queue.getSnapshot()?.title).toBe('A');
    vi.advanceTimersByTime(1299);
    expect(queue.getSnapshot()?.title).toBe('A');
    vi.advanceTimersByTime(2);
    expect(queue.getSnapshot()?.title).toBe('B');
    vi.advanceTimersByTime(1300);
    expect(queue.getSnapshot()).toBeNull();
    vi.useRealTimers();
  });
});
