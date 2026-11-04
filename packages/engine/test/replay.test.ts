import { describe, expect, it } from 'vitest';
import { GameSessionFactory } from '../src/index.js';
import { loadMini, playToEnd, startMini } from './helpers.js';

describe('deterministic replay', () => {
  const bundle = loadMini();

  it('reproduces the same final score from the same seed and commands', () => {
    const first = startMini({ seed: 99, difficulty: 'cadet' }, bundle);
    const commands = playToEnd(first);
    const replay = GameSessionFactory.replay(
      { bundle, worldId: 'moon', difficultyId: 'cadet', seed: 99, callsign: 'TEST' },
      commands,
    );
    expect(replay.view().report).toEqual(first.view().report);
    expect(replay.view().report?.score).toBeGreaterThan(0);
  });

  it('can differ across seeds (the run really depends on the seed)', () => {
    const results = new Set<string>();
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const session = startMini({ seed, difficulty: 'cadet' }, bundle);
      playToEnd(session);
      const report = session.view().report;
      results.add(`${report?.score}-${report?.day}-${session.snapshot().state.facts.length}`);
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it('rejects replays containing an invalid command', () => {
    expect(() =>
      GameSessionFactory.replay(
        { bundle, worldId: 'moon', difficultyId: 'commander', seed: 1, callsign: 'T' },
        [{ kind: 'proceed' }],
      ),
    ).toThrow();
  });

  it('restores a mid-run snapshot and finishes with the same report', () => {
    const original = startMini({ seed: 5, difficulty: 'cadet' }, bundle);
    original.choose('right');
    const snapshot = JSON.parse(JSON.stringify(original.snapshot()));
    const resumed = GameSessionFactory.restore(bundle, snapshot);
    playToEnd(original);
    playToEnd(resumed);
    expect(resumed.view().report).toEqual(original.view().report);
  });

  it('lists labelled flags as key decisions and tracks chapters cleared', () => {
    const session = startMini({ seed: 2, difficulty: 'cadet' }, bundle);
    session.choose('left');
    session.choose('right');
    expect(session.status).toBe('chapterResult');
    playToEnd(session);
    const report = session.view().report;
    expect(report?.result).toBe('win');
    expect(report?.keyDecisions.map((d) => d.flag)).toContain('packedExtraFood');
    expect(report?.chaptersCleared).toBe(3);
  });
});
