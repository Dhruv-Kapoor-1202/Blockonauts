/**
 * ChapterGraph: the branching structure of one chapter as a directed graph. It powers the
 * content validator (reachability, dead ends, day-free cycles), the Mermaid exporter and the
 * chapter progress meter. Branches may merge, so the graph is a DAG in practice.
 */
import { INTERLUDES_TARGET } from '../domain/ids.js';
import type { ChapterContent } from './bundle.js';
import { isChoice, localizeDays } from './world-keyed.js';
import type { Choice, Condition, Goto, StoryNode } from './schemas/index.js';

/** One edge of the graph. */
export interface GraphEdge {
  from: string;
  to: string;
  side: 'left' | 'right';
  label: string;
  /** Short note when the edge is conditional or comes from a gamble. */
  note?: string;
  /** Minimum days this edge consumes across all worlds the chapter supports (0 = free). */
  minDays: number;
}

/** Describes a condition in a few words for graph labels. */
export function describeCondition(when: Condition | undefined): string {
  if (!when) return 'otherwise';
  const parts: string[] = [];
  if (when.flags) parts.push(...when.flags);
  if (when.notFlags) parts.push(...when.notFlags.map((f) => `!${f}`));
  if (when.anyFlags) parts.push(when.anyFlags.join('|'));
  if (when.minDay !== undefined) parts.push(`day≥${when.minDay}`);
  if (when.maxDay !== undefined) parts.push(`day≤${when.maxDay}`);
  if (when.chapterRetries !== undefined) parts.push(`retries≥${when.chapterRetries}`);
  for (const [k, v] of Object.entries(when.resourceAbove ?? {})) parts.push(`${k}>${v}`);
  for (const [k, v] of Object.entries(when.resourceBelow ?? {})) parts.push(`${k}<${v}`);
  return parts.join(' & ') || 'always';
}

/** Graph over a chapter's nodes and endings. */
export class ChapterGraph {
  readonly edges: GraphEdge[] = [];
  private readonly outgoing = new Map<string, GraphEdge[]>();
  private readonly distances = new Map<string, number>();

  /** @param chapter chapter content. */
  constructor(private readonly chapter: ChapterContent) {
    for (const node of chapter.nodes) this.addNode(node);
    this.addInterludeEdge();
    this.computeDistances();
  }

  /** Ids of all declared endings. */
  get endingIds(): string[] {
    return Object.keys(this.chapter.def.endings);
  }

  /** Outgoing edges of a node. */
  from(id: string): GraphEdge[] {
    return this.outgoing.get(id) ?? [];
  }

  /** Every node id reachable from the start node (endings included). */
  reachable(): Set<string> {
    const seen = new Set<string>();
    const stack = [this.chapter.def.startNode];
    while (stack.length > 0) {
      const id = stack.pop() as string;
      if (seen.has(id)) continue;
      seen.add(id);
      this.from(id).forEach((edge) => stack.push(edge.to));
    }
    return seen;
  }

  /** Whether some path leads from this node to any ending. */
  canReachEnding(id: string): boolean {
    return this.distances.has(id);
  }

  /** Fewest decisions between this node and an ending (0 for an ending). */
  distanceToEnding(id: string): number | undefined {
    return this.distances.get(id);
  }

  /** Node ids that sit on a cycle in which every edge consumes zero days. */
  dayFreeCycleNodes(): string[] {
    const free = new Map<string, string[]>();
    for (const edge of this.edges) {
      if (edge.minDays === 0) free.set(edge.from, [...(free.get(edge.from) ?? []), edge.to]);
    }
    const onCycle = new Set<string>();
    for (const start of free.keys()) {
      const stack = [...(free.get(start) ?? [])];
      const seen = new Set<string>();
      while (stack.length > 0) {
        const id = stack.pop() as string;
        if (id === start) {
          onCycle.add(start);
          break;
        }
        if (seen.has(id)) continue;
        seen.add(id);
        stack.push(...(free.get(id) ?? []));
      }
    }
    return [...onCycle];
  }

  private addNode(node: StoryNode): void {
    for (const side of ['left', 'right'] as const) {
      const raw = node[side];
      const variants = isChoice(raw) ? [raw] : Object.values(raw);
      for (const choice of variants) this.addChoice(node.id, side, choice);
    }
  }

  private addChoice(from: string, side: 'left' | 'right', choice: Choice): void {
    const days = Math.min(...this.worlds().map((w) => localizeDays(choice.days, w)));
    const targets: { goto: Goto | undefined; note?: string }[] = choice.gamble
      ? [
          { goto: choice.gamble.winGoto ?? choice.goto, note: 'gamble win' },
          { goto: choice.gamble.loseGoto ?? choice.goto, note: 'gamble lose' },
        ]
      : [{ goto: choice.goto }];
    for (const { goto, note } of targets) {
      if (goto === undefined) continue;
      const branches = typeof goto === 'string' ? [{ to: goto, when: undefined }] : goto;
      for (const branch of branches) {
        const conditional = typeof goto !== 'string' ? describeCondition(branch.when) : undefined;
        this.push({
          from,
          to: branch.to,
          side,
          label: choice.label,
          note: [note, conditional].filter(Boolean).join(', ') || undefined,
          minDays: days,
        });
      }
    }
  }

  private worlds(): string[] {
    return this.chapter.def.worlds;
  }

  private addInterludeEdge(): void {
    const config = this.chapter.def.interludes;
    if (config)
      this.push({
        from: INTERLUDES_TARGET,
        to: config.goalEnding,
        side: 'left',
        label: 'goal day',
        minDays: 1,
      });
  }

  private push(edge: GraphEdge): void {
    this.edges.push(edge);
    this.outgoing.set(edge.from, [...(this.outgoing.get(edge.from) ?? []), edge]);
  }

  private computeDistances(): void {
    const queue: string[] = [];
    for (const id of this.endingIds) {
      this.distances.set(id, 0);
      queue.push(id);
    }
    const incoming = new Map<string, string[]>();
    for (const edge of this.edges)
      incoming.set(edge.to, [...(incoming.get(edge.to) ?? []), edge.from]);
    while (queue.length > 0) {
      const id = queue.shift() as string;
      const distance = this.distances.get(id) as number;
      for (const parent of incoming.get(id) ?? []) {
        if (!this.distances.has(parent)) {
          this.distances.set(parent, distance + 1);
          queue.push(parent);
        }
      }
    }
  }
}
