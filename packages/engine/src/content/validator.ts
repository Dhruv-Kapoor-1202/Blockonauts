/**
 * ContentValidator: cross-file checks that schemas alone cannot do. Fails with the file and the
 * node id for unknown speakers, nodes, endings and worlds; duplicate ids; unreachable nodes;
 * dead ends; day-free cycles; chapters without an advance ending; and broken campaign links.
 * Flags that are read but never set are reported as warnings (likely typos).
 */
import type { ContentBundle, ContentData } from './bundle.js';
import { ChapterGraph } from './chapter-graph.js';
import { sourceKey, type ContentIssue, type SourceIndex } from './loader.js';
import { InterludeChecker } from './validate-interludes.js';
import {
  IssueCollector,
  cardFlagReads,
  cardFlagWrites,
  choicesOf,
  gotoTargets,
  narrativeSignature,
} from './validation-support.js';
import { INTERLUDES_TARGET } from '../domain/ids.js';
import type { ChapterContent } from './bundle.js';
import type { Choice, Goto, StoryNode } from './schemas/index.js';

/** Outcome of validation. */
export interface ValidationReport {
  errors: ContentIssue[];
  warnings: ContentIssue[];
  ok: boolean;
}

/** Validates a loaded content bundle. */
export class ContentValidator {
  private readonly issues: IssueCollector;
  private readonly characters: Set<string>;
  private readonly worlds: Set<string>;
  private readonly flagReads = new Set<string>();
  private readonly flagWrites = new Set<string>();

  /** @param sources optional map from item to file, for friendlier messages. */
  constructor(
    private readonly data: ContentData,
    sources: SourceIndex = {},
  ) {
    this.issues = new IssueCollector(sources);
    this.characters = new Set(data.characters.map((c) => c.id));
    this.worlds = new Set(data.worlds.map((w) => w.id));
  }

  /** Convenience for a bundle instance. */
  static validateBundle(bundle: ContentBundle, sources: SourceIndex = {}): ValidationReport {
    return new ContentValidator(bundle.data, sources).validate();
  }

  /** Runs every check. */
  validate(): ValidationReport {
    this.checkCampaign();
    for (const chapter of Object.values(this.data.chapters)) this.checkChapter(chapter);
    new InterludeChecker(this.data, this.issues, this.flagReads, this.flagWrites).check();
    this.checkFlags();
    return {
      errors: this.issues.errors,
      warnings: this.issues.warnings,
      ok: this.issues.errors.length === 0,
    };
  }

  private checkCampaign(): void {
    const { campaign, chapters } = this.data;
    const referenced = new Set<string>();
    for (const [world, ids] of Object.entries(campaign.sequences)) {
      if (!this.worlds.has(world))
        this.issues.error(undefined, 'campaign.json', `sequence for unknown world "${world}"`);
      for (const id of ids) {
        referenced.add(id);
        const chapter = chapters[id];
        if (!chapter) {
          this.issues.error(
            undefined,
            'campaign.json',
            `world "${world}" references missing chapter "${id}"`,
          );
        } else if (!chapter.def.worlds.includes(world)) {
          this.issues.error(
            sourceKey.chapter(id),
            id,
            `chapter is in the "${world}" sequence but does not list "${world}" in "worlds"`,
          );
        }
      }
    }
    for (const id of Object.keys(chapters)) {
      if (!referenced.has(id))
        this.issues.warn(sourceKey.chapter(id), id, 'chapter is not part of any campaign sequence');
    }
    for (const world of this.worlds) {
      if (!campaign.sequences[world])
        this.issues.error(undefined, 'campaign.json', `world "${world}" has no chapter sequence`);
    }
  }

  private checkChapter(chapter: ChapterContent): void {
    const { def } = chapter;
    const chapterKey = sourceKey.chapter(def.id);
    for (const world of def.worlds) {
      if (!this.worlds.has(world))
        this.issues.error(chapterKey, def.id, `unknown world "${world}"`);
    }
    this.checkChapterShape(chapter);
    const ids = new Set<string>();
    for (const node of chapter.nodes) {
      const key = sourceKey.node(def.id, node.id);
      if (ids.has(node.id) || def.endings[node.id]) {
        this.issues.error(
          key,
          `${def.id} › ${node.id}`,
          'duplicate id (nodes and endings share one namespace per chapter)',
        );
      }
      ids.add(node.id);
      this.checkNode(chapter, node);
    }
    for (const ending of Object.values(def.endings))
      ending.setFlags?.forEach((f) => this.flagWrites.add(f));
    this.checkGraph(chapter);
  }

  private checkChapterShape(chapter: ChapterContent): void {
    const { def } = chapter;
    const key = sourceKey.chapter(def.id);
    if (!chapter.nodes.some((n) => n.id === def.startNode)) {
      this.issues.error(key, def.id, `startNode "${def.startNode}" does not exist`);
    }
    const winnable = Object.values(def.endings).some(
      (e) => e.outcome === 'advance' || (e.outcome === 'missionEnd' && e.result !== 'loss'),
    );
    if (!winnable)
      this.issues.error(key, def.id, 'chapter has no advance ending (or missionEnd win)');
    const config = def.interludes;
    if (config) {
      const goal = def.endings[config.goalEnding];
      if (!goal)
        this.issues.error(
          key,
          def.id,
          `interludes.goalEnding "${config.goalEnding}" is not a declared ending`,
        );
      else if (goal.outcome === 'retry')
        this.issues.error(
          key,
          def.id,
          'interludes.goalEnding must be an advance or missionEnd ending',
        );
      if (!def.clock?.simulate)
        this.issues.error(key, def.id, 'a chapter with interludes needs "clock.simulate": true');
    } else if (def.clock?.simulate) {
      this.issues.warn(key, def.id, 'clock.simulate is on but the chapter has no interludes');
    }
  }

  private checkNode(chapter: ChapterContent, node: StoryNode): void {
    const { def } = chapter;
    const key = sourceKey.node(def.id, node.id);
    const where = `${def.id} › ${node.id}`;
    if (!this.characters.has(node.speaker))
      this.issues.error(key, where, `unknown speaker "${node.speaker}"`);
    this.checkWorldKeys(key, where, node, def.worlds);
    cardFlagReads(node).forEach((f) => this.flagReads.add(f));
    cardFlagWrites(node).forEach((f) => this.flagWrites.add(f));

    for (const { side, choice } of choicesOf(node)) {
      const targets = gotoTargets(choice);
      if (targets.length === 0) this.issues.error(key, `${where} › ${side}`, 'choice has no goto');
      for (const { to } of targets) this.checkTarget(chapter, key, `${where} › ${side}`, to);
      if (choice.gamble && !choice.gamble.winGoto && !choice.gamble.loseGoto && !choice.goto) {
        this.issues.error(
          key,
          `${where} › ${side}`,
          'gamble needs goto, or both winGoto and loseGoto',
        );
      }
      this.checkFollowUps(key, `${where} › ${side}`, choice);
      this.checkGotoDefaults(key, `${where} › ${side}`, choice.goto);
    }
    if (narrativeSignature(node, 'left') === narrativeSignature(node, 'right')) {
      this.issues.error(
        key,
        where,
        'both options lead to the same place and set the same flags; make them meaningfully different',
      );
    }
  }

  private checkTarget(chapter: ChapterContent, key: string, where: string, to: string): void {
    const { def } = chapter;
    if (to === INTERLUDES_TARGET) {
      if (!def.interludes)
        this.issues.error(
          key,
          where,
          `"${INTERLUDES_TARGET}" needs the chapter to define interludes`,
        );
    } else if (!def.endings[to] && !chapter.nodes.some((n) => n.id === to)) {
      this.issues.error(key, where, `goto "${to}" is not a node or ending of this chapter`);
    }
  }

  private checkFollowUps(key: string, where: string, choice: Choice): void {
    const refs = [choice.next?.id, choice.gamble?.winNext].filter((id): id is string =>
      Boolean(id),
    );
    for (const id of refs) {
      if (!this.data.interludes.some((card) => card.id === id))
        this.issues.error(key, where, `follow-up card "${id}" does not exist`);
    }
  }

  private checkGotoDefaults(key: string, where: string, goto: Goto | undefined): void {
    if (!Array.isArray(goto)) return;
    if (goto[goto.length - 1]?.when) {
      this.issues.warn(
        key,
        where,
        'conditional goto has no unconditional last branch; it may match nothing',
      );
    }
  }

  private checkWorldKeys(key: string, where: string, node: StoryNode, worlds: string[]): void {
    const fields: [string, unknown][] = [
      ['text', node.text],
      ['fact', node.fact],
    ];
    for (const [name, value] of fields) {
      if (typeof value === 'object' && value !== null)
        this.requireWorlds(key, `${where} › ${name}`, Object.keys(value), worlds);
    }
    for (const side of ['left', 'right'] as const) {
      const raw = node[side];
      if (typeof (raw as { label?: unknown }).label !== 'string')
        this.requireWorlds(key, `${where} › ${side}`, Object.keys(raw), worlds);
    }
  }

  private requireWorlds(key: string, where: string, present: string[], worlds: string[]): void {
    for (const world of worlds) {
      if (!present.includes(world))
        this.issues.error(key, where, `missing variant for world "${world}"`);
    }
  }

  private checkGraph(chapter: ChapterContent): void {
    const { def } = chapter;
    const graph = new ChapterGraph(chapter);
    const reachable = graph.reachable();
    for (const node of chapter.nodes) {
      const key = sourceKey.node(def.id, node.id);
      if (!reachable.has(node.id))
        this.issues.error(key, `${def.id} › ${node.id}`, 'node is unreachable from the start node');
      else if (!graph.canReachEnding(node.id))
        this.issues.error(key, `${def.id} › ${node.id}`, 'node has no path to any ending');
    }
    for (const id of Object.keys(def.endings)) {
      if (!reachable.has(id))
        this.issues.warn(sourceKey.chapter(def.id), `${def.id} › ${id}`, 'ending is never reached');
    }
    for (const id of graph.dayFreeCycleNodes()) {
      this.issues.error(
        sourceKey.node(def.id, id),
        `${def.id} › ${id}`,
        'cycle where no choice consumes a day (infinite loop)',
      );
    }
  }

  private checkFlags(): void {
    for (const flag of this.flagReads) {
      if (!this.flagWrites.has(flag))
        this.issues.warn(
          undefined,
          `flag "${flag}"`,
          'flag is read but never set anywhere (typo?)',
        );
    }
    for (const flag of Object.keys(this.data.campaign.flagLabels ?? {})) {
      if (!this.flagWrites.has(flag))
        this.issues.warn(
          undefined,
          `flag "${flag}"`,
          'flag has a label in campaign.json but is never set',
        );
    }
  }
}
