/**
 * InterludeChecker: validation for the survival side-cards (`campaign/interludes/*.json`):
 * unknown speakers, duplicate ids, missing world variants, unknown follow-ups and pools.
 */
import type { ContentData } from './bundle.js';
import { sourceKey } from './loader.js';
import { INJECTED_POOL } from '../systems/interlude-selector.js';
import {
  type IssueCollector,
  cardFlagReads,
  cardFlagWrites,
  choicesOf,
} from './validation-support.js';

/** Validates interlude cards. */
export class InterludeChecker {
  constructor(
    private readonly data: ContentData,
    private readonly issues: IssueCollector,
    private readonly flagReads: Set<string>,
    private readonly flagWrites: Set<string>,
  ) {}

  /** Runs all interlude checks. */
  check(): void {
    const ids = new Set<string>();
    const referenced = new Set<string>();
    const speakers = new Set(this.data.characters.map((c) => c.id));
    const worlds = this.data.worlds.map((w) => w.id);
    const pools = new Set(this.data.interludes.map((c) => c.pool));

    for (const card of this.data.interludes) {
      const key = sourceKey.interlude(card.id);
      if (ids.has(card.id)) this.issues.error(key, card.id, 'duplicate interlude id');
      ids.add(card.id);
      if (!speakers.has(card.speaker))
        this.issues.error(key, card.id, `unknown speaker "${card.speaker}"`);
      cardFlagReads(card).forEach((f) => this.flagReads.add(f));
      cardFlagWrites(card).forEach((f) => this.flagWrites.add(f));
      this.checkWorldVariants(card, key, card.worlds ?? worlds);
      for (const { choice } of choicesOf(card)) {
        if (choice.next) referenced.add(choice.next.id);
        if (choice.gamble?.winNext) referenced.add(choice.gamble.winNext);
        if (choice.goto) this.issues.warn(key, card.id, 'interlude choices ignore "goto"');
      }
    }
    this.checkReferences(ids, referenced);
    this.checkChapterPools(pools);
  }

  private checkWorldVariants(
    card: ContentData['interludes'][number],
    key: string,
    worlds: string[],
  ): void {
    const fields: [string, unknown][] = [
      ['text', card.text],
      ['fact', card.fact],
      ['left', card.left],
      ['right', card.right],
    ];
    for (const [name, value] of fields) {
      const keyed =
        typeof value === 'object' &&
        value !== null &&
        typeof (value as { label?: unknown }).label !== 'string';
      if (!keyed) continue;
      for (const world of worlds) {
        if (!(world in (value as object)))
          this.issues.error(key, `${card.id} › ${name}`, `missing variant for world "${world}"`);
      }
    }
  }

  private checkReferences(ids: Set<string>, referenced: Set<string>): void {
    for (const id of referenced) {
      if (!ids.has(id))
        this.issues.error(
          undefined,
          `interlude "${id}"`,
          'follow-up card is referenced but does not exist',
        );
    }
    const injected = new Set<string>();
    for (const world of this.data.worlds) {
      const params = world.params as Record<string, unknown>;
      for (const name of ['warningCard', 'stormCard'])
        if (typeof params[name] === 'string') injected.add(params[name] as string);
    }
    for (const id of injected) {
      if (!ids.has(id))
        this.issues.error(
          undefined,
          `interlude "${id}"`,
          'world injects this card but it does not exist',
        );
    }
    for (const card of this.data.interludes) {
      const key = sourceKey.interlude(card.id);
      if (card.followUp && !referenced.has(card.id))
        this.issues.warn(key, card.id, 'follow-up card is never queued by any choice');
      if (card.pool === INJECTED_POOL && !injected.has(card.id))
        this.issues.warn(key, card.id, 'injected card is not referenced by any world');
    }
  }

  private checkChapterPools(pools: Set<string>): void {
    for (const chapter of Object.values(this.data.chapters)) {
      for (const pool of chapter.def.interludes?.pools ?? []) {
        if (!pools.has(pool)) {
          this.issues.error(
            sourceKey.chapter(chapter.def.id),
            chapter.def.id,
            `interlude pool "${pool}" has no cards`,
          );
        }
      }
    }
  }
}
