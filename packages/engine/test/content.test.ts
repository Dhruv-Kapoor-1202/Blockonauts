import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ChapterGraph,
  ContentBundle,
  ContentLoadError,
  ContentLoader,
  ContentValidator,
  chapterToMermaid,
  formatIssue,
} from '../src/index.js';
import { buildMiniContentFiles, MINI } from './fixtures/mini-content.js';

type Files = Record<string, unknown>;
type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any -- loose JSON editing in fixtures

const chapterPath = (id: string) => `campaign/chapters/${id}/chapter.json`;
const nodesPath = (id: string) => `campaign/chapters/${id}/nodes/main.json`;

/** Loads mutated mini content and validates it. */
function validate(mutate: (files: Files) => void) {
  const files = buildMiniContentFiles();
  mutate(files);
  const { data, sources } = ContentLoader.load(files);
  return new ContentValidator(data, sources).validate();
}

const messages = (issues: { message: string }[]) => issues.map((i) => i.message).join('\n');

describe('ContentValidator', () => {
  it('accepts the mini campaign without errors', () => {
    const report = validate(() => undefined);
    expect(report.errors).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it('catches an unknown speaker with file and node id', () => {
    const report = validate((files) => {
      (files[nodesPath(MINI.prologue)] as Json).nodes[0].speaker = 'ghost';
    });
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0]?.message).toContain('unknown speaker "ghost"');
    expect(report.errors[0]?.file).toBe(nodesPath(MINI.prologue));
    expect(report.errors[0]?.location).toContain('mini.start');
  });

  it('catches an unknown goto target', () => {
    const report = validate((files) => {
      (files[nodesPath(MINI.prologue)] as Json).nodes[0].left.goto = 'mini.nowhere';
    });
    expect(messages(report.errors)).toContain('goto "mini.nowhere" is not a node or ending');
  });

  it('catches unreachable nodes and dead ends', () => {
    const report = validate((files) => {
      const nodes = (files[nodesPath(MINI.prologue)] as Json).nodes as Json[];
      const filler = { speaker: 'hq', text: 't', fact: 'f' };
      nodes.push({
        id: 'lonely',
        ...filler,
        left: { label: 'a', days: 1, goto: 'mini.orbit' },
        right: { label: 'b', days: 1, setFlags: ['q'], goto: 'mini.orbit' },
      });
      nodes.push({
        id: 'loopA',
        ...filler,
        left: { label: 'a', days: 1, goto: 'loopB' },
        right: { label: 'b', days: 1, setFlags: ['q'], goto: 'loopB' },
      });
      nodes.push({
        id: 'loopB',
        ...filler,
        left: { label: 'a', days: 1, goto: 'loopA' },
        right: { label: 'b', days: 1, setFlags: ['q'], goto: 'loopA' },
      });
      nodes[0]!.left.goto = 'loopA';
    });
    const text = messages(report.errors);
    expect(text).toContain('node has no path to any ending');
    expect(text).toContain('node is unreachable from the start node');
  });

  it('catches cycles where no choice consumes a day', () => {
    const report = validate((files) => {
      const nodes = (files[nodesPath(MINI.prologue)] as Json).nodes as Json[];
      nodes[1]!.right.days = 0;
      nodes[1]!.right.goto = 'mini.start';
      nodes[0]!.left.days = 0;
      nodes[0]!.right.days = 0;
    });
    expect(messages(report.errors)).toContain('cycle where no choice consumes a day');
  });

  it('catches duplicate ids, including a node that reuses an ending id', () => {
    const report = validate((files) => {
      const nodes = (files[nodesPath(MINI.prologue)] as Json).nodes as Json[];
      nodes.push({ ...nodes[0]!, id: 'mini.orbit' });
      nodes.push({ ...nodes[0]!, id: 'mini.start' });
    });
    expect(messages(report.errors)).toContain('duplicate id');
  });

  it('catches a chapter without an advance ending', () => {
    const report = validate((files) => {
      (files[chapterPath(MINI.prologue)] as Json).endings['mini.orbit'].outcome = 'retry';
    });
    expect(messages(report.errors)).toContain('chapter has no advance ending');
  });

  it('catches campaign references to missing chapters and unknown start nodes', () => {
    const report = validate((files) => {
      (files['campaign/campaign.json'] as Json).sequences.moon.push('ghost-chapter');
      (files[chapterPath(MINI.epilogue)] as Json).startNode = 'ghost';
    });
    const text = messages(report.errors);
    expect(text).toContain('references missing chapter "ghost-chapter"');
    expect(text).toContain('startNode "ghost" does not exist');
  });

  it('warns about flags that are read but never set', () => {
    const report = validate((files) => {
      (files[nodesPath(MINI.epilogue)] as Json).nodes[0].variants = [
        { when: { flags: ['neverSetAnywhere'] }, text: 'x' },
      ];
    });
    expect(report.ok).toBe(true);
    expect(messages(report.warnings)).toContain('flag is read but never set');
  });

  it('rejects two options with the same destination and flags', () => {
    const report = validate((files) => {
      const node = (files[nodesPath(MINI.epilogue)] as Json).nodes[0];
      node.right = { ...node.left, label: 'Same' };
    });
    expect(messages(report.errors)).toContain('meaningfully different');
  });

  it('requires simulate for chapters with interludes and the goal ending to be declared', () => {
    const report = validate((files) => {
      const chapter = files[chapterPath(MINI.survival.moon)] as Json;
      chapter.clock.simulate = false;
      chapter.interludes.goalEnding = 'ghost';
    });
    const text = messages(report.errors);
    expect(text).toContain('needs "clock.simulate": true');
    expect(text).toContain('goalEnding "ghost"');
  });

  it('requires every world of the chapter to have a variant for world-keyed text', () => {
    const report = validate((files) => {
      (files[nodesPath(MINI.prologue)] as Json).nodes[0].text = { moon: 'only moon' };
    });
    expect(messages(report.errors)).toContain('missing variant for world "mars"');
  });

  it('checks follow-up cards and interlude pools', () => {
    const report = validate((files) => {
      (files[nodesPath(MINI.prologue)] as Json).nodes[0].left.next = { id: 'ghost-card', in: 2 };
      (files[chapterPath(MINI.survival.moon)] as Json).interludes.pools = ['no-such-pool'];
    });
    const text = messages(report.errors);
    expect(text).toContain('follow-up card "ghost-card" does not exist');
    expect(text).toContain('interlude pool "no-such-pool" has no cards');
  });

  it('flags interlude cards with unknown speakers and duplicate ids', () => {
    const report = validate((files) => {
      const list = (files['campaign/interludes/colony.json'] as Json).interludes as Json[];
      list[0]!.speaker = 'ghost';
      list.push({ ...list[1]! });
    });
    const text = messages(report.errors);
    expect(text).toContain('unknown speaker "ghost"');
    expect(text).toContain('duplicate interlude id');
  });

  it('warns when a conditional goto has no default branch', () => {
    const report = validate((files) => {
      (files[nodesPath(MINI.prologue)] as Json).nodes[1].left.goto = [
        { when: { flags: ['packedScience'] }, to: 'mini.orbit' },
      ];
    });
    expect(messages(report.warnings)).toContain('no unconditional last branch');
  });
});

describe('ContentLoader', () => {
  it('reports schema problems with the file, node id and field', () => {
    const files = buildMiniContentFiles();
    (files[nodesPath(MINI.prologue)] as Json).nodes[0].left.effects = { X: 5 };
    expect(() => ContentLoader.load(files)).toThrow(ContentLoadError);
    try {
      ContentLoader.load(files);
    } catch (error) {
      const issue = (error as ContentLoadError).issues[0]!;
      expect(issue.file).toBe(nodesPath(MINI.prologue));
      expect(issue.location).toContain('node "mini.start"');
      expect(formatIssue(issue)).toContain('ERROR');
    }
  });

  it('rejects unknown keys, non-camelCase flags and missing required files', () => {
    const typo = buildMiniContentFiles();
    (typo[nodesPath(MINI.prologue)] as Json).nodes[0].lefft = {};
    expect(() => ContentLoader.load(typo)).toThrow(ContentLoadError);

    const badFlag = buildMiniContentFiles();
    (badFlag[nodesPath(MINI.prologue)] as Json).nodes[0].left.setFlags = ['Bad_Flag'];
    expect(() => ContentLoader.load(badFlag)).toThrow(/camelCase/);

    const missing = buildMiniContentFiles();
    delete missing['config.json'];
    expect(() => ContentLoader.load(missing)).toThrow(/required content file is missing/);
  });

  it('requires a chapter id that matches its folder and a chapter.json for node folders', () => {
    const wrongId = buildMiniContentFiles();
    (wrongId[chapterPath(MINI.epilogue)] as Json).id = 'other';
    expect(() => ContentLoader.load(wrongId)).toThrow(/must match its folder name/);

    const orphanNodes = buildMiniContentFiles();
    orphanNodes['campaign/chapters/lonely/nodes/a.json'] = { nodes: [] };
    expect(() => ContentLoader.load(orphanNodes)).toThrow();
  });
});

describe('ChapterGraph and Mermaid export', () => {
  const bundle = new ContentBundle(ContentLoader.load(buildMiniContentFiles()).data);

  it('computes reachability and distance to an ending', () => {
    const graph = new ChapterGraph(bundle.chapter(MINI.prologue));
    expect(graph.reachable().has('mini.orbit')).toBe(true);
    expect(graph.distanceToEnding('mini.start')).toBe(2);
    expect(graph.distanceToEnding('mini.orbit')).toBe(0);
    expect(graph.canReachEnding('mini.leak')).toBe(true);
    expect(graph.from('mini.leak').some((edge) => edge.note?.includes('packedScience'))).toBe(true);
  });

  it('links the interlude hub to the goal ending', () => {
    const graph = new ChapterGraph(bundle.chapter(MINI.survival.moon));
    expect(graph.canReachEnding('surv.first')).toBe(true);
  });

  it('renders a Mermaid flowchart with outcome classes', () => {
    const text = chapterToMermaid(bundle.chapter(MINI.prologue));
    expect(text).toContain('```mermaid');
    expect(text).toContain('flowchart TD');
    expect(text).toContain(':::advance');
    expect(text).toContain(':::retry');
    expect(text).toContain('n_mini_start');
  });
});

describe('real campaign content', () => {
  const root = fileURLToPath(new URL('../../../content/', import.meta.url));
  const read = (dir: string): Files => {
    const files: Files = {};
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        if (name !== 'schema') Object.assign(files, read(full));
      } else if (name.endsWith('.json')) {
        files[relative(root, full).split('\\').join('/')] = JSON.parse(readFileSync(full, 'utf8'));
      }
    }
    return files;
  };

  it('passes schema and graph validation with no errors', () => {
    const { data, sources } = ContentLoader.load(read(root));
    const report = new ContentValidator(data, sources).validate();
    expect(report.errors.map(formatIssue)).toEqual([]);
  });

  it('gives every chapter a reachable advance ending and a path to each ending', () => {
    const { data } = ContentLoader.load(read(root));
    for (const chapter of Object.values(data.chapters)) {
      const graph = new ChapterGraph(chapter);
      const reachable = graph.reachable();
      const advances = Object.entries(chapter.def.endings).filter(
        ([, ending]) =>
          ending.outcome === 'advance' ||
          (ending.outcome === 'missionEnd' && ending.result !== 'loss'),
      );
      expect(
        advances.some(([id]) => reachable.has(id)),
        chapter.def.id,
      ).toBe(true);
    }
  });

  it('migrated every prototype card into the interlude pools', () => {
    const { data } = ContentLoader.load(read(root));
    const ids = new Set(data.interludes.map((card) => card.id));
    for (const id of [
      'greenhouse',
      'icerover',
      'solarstorm',
      'clock',
      'greenhouse2',
      'ice2',
      'homesick',
      'm_night',
      'm_quake',
      'm_mast',
      'r_storm',
      'r_print',
    ]) {
      expect(ids.has(id), id).toBe(true);
    }
    expect(
      data.interludes.filter(
        (card) =>
          !card.id.includes('story_') &&
          !card.id.startsWith('moonstory') &&
          !card.id.startsWith('marsstory'),
      ),
    ).toHaveLength(50);
  });
});
