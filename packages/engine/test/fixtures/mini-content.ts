/**
 * Mini campaign fixture shared by engine, server and client tests. It loads the real catalogue
 * files (config, worlds, characters, interludes...) and adds a tiny hand-written campaign, so tests
 * stay fast, deterministic and independent of the story authors' work in progress.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const contentDir = fileURLToPath(new URL('../../../../content/', import.meta.url));

function readJson(relative: string): unknown {
  return JSON.parse(readFileSync(join(contentDir, relative), 'utf8'));
}

/** Ids and numbers a test might want to assert on. */
export const MINI = {
  prologue: 'mini-ch0',
  epilogue: 'mini-end',
  survival: { moon: 'mini-survival-moon', mars: 'mini-survival-mars' },
  /** The survival chapter ends when the day counter reaches this value. */
  survivalGoalDay: 5,
} as const;

const node = (
  id: string,
  text: string,
  left: Record<string, unknown>,
  right: Record<string, unknown>,
  extra: Record<string, unknown> = {},
) => ({ id, speaker: 'hq', tag: 'TEST', text, fact: `Fact for ${id}.`, left, right, ...extra });

function prologue() {
  return {
    def: {
      id: MINI.prologue,
      title: 'Mini Launch',
      worlds: ['moon', 'mars'],
      goal: 'Reach orbit.',
      startNode: 'mini.start',
      clock: { startDay: -3, unitOverride: 'day' },
      endings: {
        'mini.orbit': {
          outcome: 'advance',
          title: 'ORBIT',
          text: 'You made it.',
          setFlags: ['cleanLaunch'],
        },
        'mini.scrub': {
          outcome: 'retry',
          title: 'SCRUBBED',
          text: 'Try again.',
          lesson: 'Checks matter.',
        },
      },
      resourceFailure: { outcome: 'retry' },
    },
    nodes: [
      node(
        'mini.start',
        'Load food or science?',
        {
          label: 'Food',
          days: 1,
          effects: { F: 5 },
          setFlags: ['packedExtraFood'],
          goto: 'mini.leak',
        },
        {
          label: 'Science',
          days: 1,
          effects: { M: 5 },
          setFlags: ['packedScience'],
          goto: 'mini.leak',
        },
      ),
      node(
        'mini.leak',
        'Skip the leak test?',
        {
          label: 'Skip',
          days: 0,
          setFlags: ['skippedLeakTest'],
          goto: [{ when: { flags: ['packedScience'] }, to: 'mini.scrub' }, { to: 'mini.orbit' }],
        },
        { label: 'Test', days: 1, effects: { P: -3 }, goto: 'mini.orbit' },
        {
          variants: [
            { when: { flags: ['packedExtraFood'] }, text: 'Heavy ship. Skip the leak test?' },
          ],
        },
      ),
    ],
  };
}

function survival(world: 'moon' | 'mars') {
  return {
    def: {
      id: MINI.survival[world],
      title: `Mini Survival (${world})`,
      worlds: [world],
      goal: 'Hold on.',
      startNode: 'surv.brief',
      clock: { startDay: 1, simulate: true },
      endings: {
        'surv.done': { outcome: 'advance', title: 'HELD ON', text: 'Crew rotation arrives.' },
      },
      resourceFailure: { outcome: 'retry' },
      interludes: {
        pools: ['colony', world, 'followup', 'injected'],
        every: [2, 3],
        untilDay: MINI.survivalGoalDay,
        goalEnding: 'surv.done',
      },
    },
    nodes: [
      node(
        'surv.brief',
        'Welcome to the base.',
        { label: 'Ready', days: 0, goto: 'surv.first' },
        { label: 'Go', days: 0, setFlags: ['eager'], goto: 'surv.first' },
        { speaker: 'aria' },
      ),
      node(
        'surv.first',
        'First decision.',
        { label: 'Hold', days: 1, goto: '$interludes' },
        { label: 'Push', days: 1, effects: { P: -2 }, setFlags: ['pushed'], goto: '$interludes' },
      ),
    ],
  };
}

function epilogue() {
  return {
    def: {
      id: MINI.epilogue,
      title: 'Mini Epilogue',
      worlds: ['moon', 'mars'],
      goal: 'Go home.',
      startNode: 'end.start',
      endings: { 'end.win': { outcome: 'missionEnd', title: 'HOME', text: 'Mission complete.' } },
      resourceFailure: { outcome: 'missionEnd', title: 'LOST' },
    },
    nodes: [
      node(
        'end.start',
        'Ready to leave?',
        { label: 'Leave', days: 1, goto: 'end.win' },
        { label: 'Stay', days: 1, setFlags: ['lingered'], goto: 'end.win' },
      ),
    ],
  };
}

/** Builds the `relative path -> JSON` map the ContentLoader expects for the mini campaign. */
export function buildMiniContentFiles(): Record<string, unknown> {
  const files: Record<string, unknown> = {};
  for (const name of [
    'config',
    'resources',
    'characters',
    'difficulties',
    'achievements',
    'facts-and-tips',
  ]) {
    files[`${name}.json`] = readJson(`${name}.json`);
  }
  for (const world of ['moon', 'mars'])
    files[`worlds/${world}.json`] = readJson(`worlds/${world}.json`);
  for (const name of readdirSync(join(contentDir, 'campaign', 'interludes'))) {
    if (name.endsWith('.json') && !name.startsWith('story-')) {
      files[`campaign/interludes/${name}`] = readJson(`campaign/interludes/${name}`);
    }
  }
  files['campaign/campaign.json'] = {
    sequences: {
      moon: [MINI.prologue, MINI.survival.moon, MINI.epilogue],
      mars: [MINI.prologue, MINI.survival.mars, MINI.epilogue],
    },
    flagLabels: { packedExtraFood: 'Packed extra food', skippedLeakTest: 'Skipped the leak test' },
  };
  for (const chapter of [prologue(), survival('moon'), survival('mars'), epilogue()]) {
    files[`campaign/chapters/${chapter.def.id}/chapter.json`] = chapter.def;
    files[`campaign/chapters/${chapter.def.id}/nodes/main.json`] = { nodes: chapter.nodes };
  }
  return files;
}
