/**
 * Lab fixture: builds a single-chapter campaign from arbitrary nodes so tests can exercise one
 * engine rule at a time (gambles, delayed effects, gotos, endings, retries...).
 */
import { ContentBundle, ContentLoader, GameSessionFactory } from '../src/index.js';
import type { GameSession, StoryNode } from '../src/index.js';
import { buildMiniContentFiles } from './fixtures/mini-content.js';

/** Options for a lab chapter. */
export interface LabOptions {
  nodes: unknown[];
  endings?: Record<string, unknown>;
  startNode?: string;
  clock?: Record<string, unknown>;
  interludes?: unknown;
  resourceFailure?: Record<string, unknown>;
  /** Extra chapters appended after the lab chapter (they get ids lab2, lab3...). */
  followingChapters?: {
    endings: Record<string, unknown>;
    nodes: unknown[];
    startNode: string;
    clock?: Record<string, unknown>;
  }[];
}

/** Shorthand for a node object. */
export function labNode(
  id: string,
  left: Record<string, unknown>,
  right: Record<string, unknown>,
  extra: Record<string, unknown> = {},
): StoryNode {
  return {
    id,
    speaker: 'hq',
    text: `Text of ${id}`,
    fact: `Fact of ${id}`,
    left,
    right,
    ...extra,
  } as StoryNode;
}

const DEFAULT_ENDINGS = {
  'lab.win': { outcome: 'missionEnd', title: 'WIN', text: 'Done.' },
  'lab.advance': {
    outcome: 'advance',
    title: 'ADVANCE',
    text: 'Next.',
    setFlags: ['advancedFlag'],
  },
  'lab.retry': { outcome: 'retry', title: 'RETRY', text: 'Again.', lesson: 'Careful.' },
  'lab.loss': { outcome: 'missionEnd', result: 'loss', title: 'LOSS', text: 'Lost.' },
};

/** Builds content files for a campaign made of the lab chapter(s) on both worlds. */
export function labFiles(options: LabOptions): Record<string, unknown> {
  const files = buildMiniContentFiles();
  for (const key of Object.keys(files)) {
    if (key.startsWith('campaign/chapters/')) delete files[key];
  }
  const chapters: {
    id: string;
    endings: Record<string, unknown>;
    nodes: unknown[];
    startNode: string;
    clock?: Record<string, unknown>;
  }[] = [
    {
      id: 'lab',
      endings: options.endings ?? DEFAULT_ENDINGS,
      nodes: options.nodes,
      startNode: options.startNode ?? (options.nodes[0] as { id: string }).id,
      clock: options.clock,
    },
    ...(options.followingChapters ?? []).map((chapter, index) => ({
      id: `lab${index + 2}`,
      ...chapter,
    })),
  ];
  chapters.forEach((chapter, index) => {
    const isFirst = index === 0;
    files[`campaign/chapters/${chapter.id}/chapter.json`] = {
      id: chapter.id,
      title: `Lab ${index + 1}`,
      worlds: ['moon', 'mars'],
      goal: 'Test.',
      startNode: chapter.startNode,
      ...(chapter.clock ? { clock: chapter.clock } : {}),
      ...(isFirst && options.interludes ? { interludes: options.interludes } : {}),
      endings: chapter.endings,
      resourceFailure: isFirst
        ? (options.resourceFailure ?? { outcome: 'retry' })
        : { outcome: 'retry' },
    };
    files[`campaign/chapters/${chapter.id}/nodes/main.json`] = { nodes: chapter.nodes };
  });
  const ids = chapters.map((chapter) => chapter.id);
  files['campaign/campaign.json'] = { sequences: { moon: ids, mars: ids } };
  return files;
}

/** Loads lab files into a bundle. */
export function labBundle(options: LabOptions): ContentBundle {
  return new ContentBundle(ContentLoader.load(labFiles(options)).data);
}

/** Starts a session from raw content files (for tests that tweak config or catalogue data). */
export function startFromFiles(
  files: Record<string, unknown>,
  session: { world?: string; difficulty?: string; seed?: number } = {},
): GameSession {
  return GameSessionFactory.create({
    bundle: new ContentBundle(ContentLoader.load(files).data),
    worldId: session.world ?? 'moon',
    difficultyId: session.difficulty ?? 'commander',
    seed: session.seed ?? 7,
    callsign: 'LAB',
  });
}

/** Starts a lab session. */
export function startLab(
  options: LabOptions,
  session: { world?: string; difficulty?: string; seed?: number } = {},
): GameSession {
  return GameSessionFactory.create({
    bundle: labBundle(options),
    worldId: session.world ?? 'moon',
    difficultyId: session.difficulty ?? 'commander',
    seed: session.seed ?? 7,
    callsign: 'LAB',
  });
}
