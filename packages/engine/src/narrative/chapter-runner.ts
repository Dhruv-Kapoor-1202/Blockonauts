/**
 * ChapterRunner: a read-only helper around one chapter. It knows the start node, how to classify
 * a `goto` target (node / ending / `$interludes`), the clock settings and survival goal.
 */
import { INTERLUDES_TARGET } from '../domain/ids.js';
import type { ChapterContent } from '../content/bundle.js';
import { ChapterGraph } from '../content/chapter-graph.js';
import type { ChapterDef, Ending, StoryNode } from '../content/schemas/index.js';

/** What a `goto` target points at. */
export type TargetKind = 'node' | 'ending' | 'interludes' | 'unknown';

/** Wraps one chapter's content. */
export class ChapterRunner {
  private readonly nodes: Map<string, StoryNode>;
  private cachedGraph?: ChapterGraph;

  /** @param content chapter definition and nodes. */
  constructor(readonly content: ChapterContent) {
    this.nodes = new Map(content.nodes.map((node) => [node.id, node]));
  }

  get def(): ChapterDef {
    return this.content.def;
  }

  get id(): string {
    return this.def.id;
  }

  /** Whether the daily world rules (drain, phases, supply, random events) run in this chapter. */
  get simulate(): boolean {
    return this.def.clock?.simulate ?? false;
  }

  /** Day shown when the chapter starts, or undefined to continue from the current day. */
  get startDay(): number | undefined {
    return this.def.clock?.startDay;
  }

  /** Whether interlude side-cards are drawn between story nodes. */
  get usesInterludes(): boolean {
    return this.simulate && Boolean(this.def.interludes);
  }

  /** The survival goal day: the chapter's `untilDay` or the world's goal. */
  goalDay(worldGoalDay: number): number {
    return this.def.interludes?.untilDay ?? worldGoalDay;
  }

  /** Looks up a story node. */
  node(id: string): StoryNode | undefined {
    return this.nodes.get(id);
  }

  /** Looks up a declared ending. */
  ending(id: string): Ending | undefined {
    return this.def.endings[id];
  }

  /** Classifies a `goto` target. */
  classify(target: string): TargetKind {
    if (target === INTERLUDES_TARGET) return 'interludes';
    if (this.def.endings[target]) return 'ending';
    return this.nodes.has(target) ? 'node' : 'unknown';
  }

  /** Lazily built graph (used for the progress meter). */
  get graph(): ChapterGraph {
    this.cachedGraph ??= new ChapterGraph(this.content);
    return this.cachedGraph;
  }
}
