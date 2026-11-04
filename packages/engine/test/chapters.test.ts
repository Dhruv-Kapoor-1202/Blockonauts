import { describe, expect, it } from 'vitest';
import type { GameEvent } from '../src/index.js';
import { labNode, startLab } from './lab.js';

const sink = { goto: 'lab.win' };

describe('chapter outcomes', () => {
  const second = {
    startNode: 'n1',
    endings: { 'n.win': { outcome: 'missionEnd', title: 'FINAL', text: 'Won.' } },
    nodes: [
      labNode(
        'n1',
        { label: 'L', days: 3, goto: 'n.win' },
        { label: 'R', days: 1, setFlags: ['other'], goto: 'n.win' },
      ),
    ],
  };

  it('advances to the next chapter keeping resources and flags, applying ending flags and carry effects', () => {
    const session = startLab({
      nodes: [
        labNode(
          'a',
          { label: 'L', days: 2, effects: { W: -10 }, setFlags: ['kept'], goto: 'lab.advance' },
          { label: 'R', days: 0, goto: 'lab.retry' },
        ),
      ],
      endings: {
        'lab.advance': {
          outcome: 'advance',
          title: 'ADV',
          text: 't',
          setFlags: ['advancedFlag'],
          carryEffects: { P: -5 },
        },
        'lab.retry': { outcome: 'retry', title: 'RETRY', text: 't' },
      },
      clock: { startDay: 10 },
      followingChapters: [second],
    });
    session.choose('left');
    expect(session.view()).toMatchObject({
      status: 'chapterResult',
      ending: { outcome: 'advance', next: 'continue', title: 'ADV' },
    });
    expect(session.view().resources).toMatchObject({ W: 45, P: 67 });
    session.proceed();
    const view = session.view();
    expect(view.status).toBe('playing');
    expect(view.chapter).toMatchObject({ index: 1, id: 'lab2', count: 2 });
    expect(view.day).toBe(12);
    session.choose('left');
    expect(session.view()).toMatchObject({ status: 'missionOver', day: 15 });
    expect(session.view().report).toMatchObject({
      result: 'win',
      title: 'FINAL',
      chaptersCleared: 2,
      chaptersTotal: 2,
    });
  });

  it('resets the chapter clock when a chapter declares startDay and rebases delayed effects', () => {
    const session = startLab({
      nodes: [
        labNode(
          'a',
          {
            label: 'L',
            days: 1,
            later: { in: 3, effects: { M: -30 }, message: 'LATE' },
            goto: 'lab.advance',
          },
          { label: 'R', days: 0, goto: 'lab.retry' },
        ),
      ],
      clock: { startDay: 50 },
      followingChapters: [{ ...second, clock: { startDay: 1 } }],
    });
    session.choose('left');
    session.proceed();
    expect(session.view().day).toBe(1);
    const before = session.view().resources.M;
    session.choose('left');
    expect(session.view().resources.M).toBe(before - 30);
  });

  it('treats an advance ending in the final chapter as a mission win', () => {
    const session = startLab({
      nodes: [
        labNode(
          'a',
          { label: 'L', days: 0, goto: 'lab.advance' },
          { label: 'R', days: 0, goto: 'lab.loss' },
        ),
      ],
    });
    session.choose('left');
    expect(session.view()).toMatchObject({ status: 'missionOver', report: { result: 'win' } });
  });

  it('reports a mission loss for a losing missionEnd ending', () => {
    const session = startLab({
      nodes: [
        labNode(
          'a',
          { label: 'L', days: 0, goto: 'lab.advance' },
          { label: 'R', days: 0, goto: 'lab.loss' },
        ),
      ],
    });
    session.choose('right');
    expect(session.view().report).toMatchObject({ result: 'loss', title: 'LOSS' });
  });
});

describe('retries and checkpoints', () => {
  const nodes = [
    labNode(
      'a',
      {
        label: 'Break',
        days: 1,
        effects: { P: -30, M: 20 },
        setFlags: ['broke'],
        goto: 'lab.retry',
      },
      { label: 'Fine', days: 0, goto: 'lab.win' },
      { variants: [{ when: { chapterRetries: 1 }, text: 'Second try' }] },
    ),
  ];

  it('restores the chapter-start checkpoint on retry and counts retries', () => {
    const session = startLab({ nodes });
    session.choose('left');
    expect(session.view()).toMatchObject({
      status: 'chapterResult',
      ending: { outcome: 'retry', next: 'retry', retriesLeft: 3 },
    });
    session.proceed();
    const view = session.view();
    expect(view.resources.P).toBe(72);
    expect(view.resources.M).toBe(70);
    expect(view.day).toBe(1);
    expect(view.chapter.retries).toBe(1);
    expect(view.card?.text).toBe('Second try');
  });

  it('allows unlimited retries on cadet', () => {
    const session = startLab({ nodes }, { difficulty: 'cadet' });
    for (let i = 0; i < 8; i += 1) {
      session.choose('left');
      expect(session.view().status).toBe('chapterResult');
      session.proceed();
    }
    expect(session.view().chapter.retries).toBe(8);
    expect(session.view().chapter.retryLimit).toBeNull();
  });

  it('ends the mission when commander retries run out (3) and veteran retries run out (1)', () => {
    const commander = startLab({ nodes });
    for (let i = 0; i < 3; i += 1) {
      commander.choose('left');
      commander.proceed();
    }
    commander.choose('left');
    expect(commander.view()).toMatchObject({
      status: 'missionOver',
      report: { result: 'loss', retries: 3 },
    });

    const veteran = startLab({ nodes }, { difficulty: 'veteran' });
    veteran.choose('left');
    veteran.proceed();
    veteran.choose('left');
    expect(veteran.view().status).toBe('missionOver');
    expect(veteran.view().ending).toMatchObject({ next: 'report', retriesLeft: 0 });
  });

  it('subtracts a retry penalty from the final score', () => {
    const clean = startLab({ nodes });
    clean.choose('right');
    const retried = startLab({ nodes });
    retried.choose('left');
    retried.proceed();
    retried.choose('right');
    expect((clean.view().report?.score ?? 0) - (retried.view().report?.score ?? 0)).toBe(150);
  });
});

describe('resource failure', () => {
  const nodes = [
    labNode(
      'a',
      { label: 'Drain', days: 0, effects: { F: -60 }, goto: 'b' },
      { label: 'Other', days: 0, goto: 'b' },
    ),
    labNode(
      'b',
      { label: 'x', days: 0, ...sink },
      { label: 'y', days: 0, setFlags: ['z'], ...sink },
    ),
  ];

  it('fires the failure ending with the death text of the depleted resource', () => {
    const session = startLab({ nodes });
    session.choose('left');
    expect(session.view().resources.F).toBe(0);
    expect(session.view().ending).toMatchObject({
      title: 'OUT OF FOOD',
      outcome: 'retry',
      next: 'retry',
    });
  });

  it('uses the world-specific death text and honours missionEnd failures', () => {
    const power = [
      labNode(
        'a',
        { label: 'Drain', days: 0, effects: { P: -100 }, goto: 'lab.win' },
        { label: 'Other', days: 0, goto: 'lab.win', setFlags: ['q'] },
      ),
    ];
    const mars = startLab(
      { nodes: power, resourceFailure: { outcome: 'missionEnd', title: 'GAME OVER' } },
      { world: 'mars' },
    );
    mars.choose('left');
    expect(mars.view().report).toMatchObject({ result: 'loss', title: 'GAME OVER' });
    expect(mars.view().report?.text).toContain('dust storms');
  });
});

describe('snapshots', () => {
  it('captures and restores a session so play continues identically', () => {
    const files = {
      nodes: [
        labNode(
          'a',
          {
            label: 'L',
            days: 1,
            gamble: { p: 0.5, win: { M: 8 }, lose: { M: -8 }, winText: 'w', loseText: 'l' },
            goto: 'b',
          },
          { label: 'R', days: 1, goto: 'b', setFlags: ['r'] },
        ),
        labNode(
          'b',
          {
            label: 'L',
            days: 1,
            gamble: { p: 0.5, win: { P: 8 }, lose: { P: -8 }, winText: 'w', loseText: 'l' },
            goto: 'lab.win',
          },
          { label: 'R', days: 1, goto: 'lab.win', setFlags: ['s'] },
        ),
      ],
    };
    const original = startLab(files, { seed: 11 });
    original.choose('left');
    const snapshot = JSON.parse(JSON.stringify(original.snapshot()));
    expect(snapshot.commands).toEqual([{ kind: 'choose', side: 'left' }]);

    const copy = startLab(files, { seed: 11 });
    copy.restore(snapshot);
    expect(copy.view()).toEqual(original.view());
    original.choose('left');
    copy.choose('left');
    expect(copy.view()).toEqual(original.view());
    expect(copy.snapshot().commands).toHaveLength(2);
  });

  it('refuses snapshots from another world or difficulty', () => {
    const files = {
      nodes: [
        labNode(
          'a',
          { label: 'L', days: 0, goto: 'lab.win' },
          { label: 'R', days: 0, goto: 'lab.advance' },
        ),
      ],
    };
    const snapshot = startLab(files, { world: 'moon' }).snapshot();
    expect(() => startLab(files, { world: 'mars' }).restore(snapshot)).toThrow();
  });

  it('rejects a second start', () => {
    const session = startLab({
      nodes: [
        labNode(
          'a',
          { label: 'L', days: 0, goto: 'lab.win' },
          { label: 'R', days: 0, goto: 'lab.advance' },
        ),
      ],
    });
    expect(() => session.start()).toThrow();
  });
});

describe('type guard on events', () => {
  it('chapter ended events carry the ending view', () => {
    const session = startLab({
      nodes: [
        labNode(
          'a',
          { label: 'L', days: 0, goto: 'lab.retry' },
          { label: 'R', days: 0, goto: 'lab.win' },
        ),
      ],
    });
    const events: GameEvent[] = [];
    session.events.on('ChapterEnded', (e) => events.push(e));
    session.choose('left');
    expect(events[0]).toMatchObject({
      type: 'ChapterEnded',
      chapterId: 'lab',
      ending: { title: 'RETRY', lesson: 'Careful.' },
    });
  });
});
