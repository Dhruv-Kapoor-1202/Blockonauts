/**
 * Helpers shared by the content validator: issue collection with source-file lookup, and
 * extraction of flag reads/writes and goto targets from cards.
 */
import type { ContentIssue, SourceIndex } from './loader.js';
import { isChoice } from './world-keyed.js';
import type { Choice, Condition, Goto, Interlude, StoryNode } from './schemas/index.js';

/** Collects errors and warnings, attaching the source file when known. */
export class IssueCollector {
  readonly errors: ContentIssue[] = [];
  readonly warnings: ContentIssue[] = [];

  constructor(private readonly sources: SourceIndex = {}) {}

  error(sourceKey: string | undefined, location: string, message: string): void {
    this.errors.push({ severity: 'error', file: this.file(sourceKey), location, message });
  }

  warn(sourceKey: string | undefined, location: string, message: string): void {
    this.warnings.push({ severity: 'warning', file: this.file(sourceKey), location, message });
  }

  private file(key: string | undefined): string | undefined {
    return key ? this.sources[key] : undefined;
  }
}

/** All concrete choices of a card (one per world variant). */
export function choicesOf(
  card: StoryNode | Interlude,
): { side: 'left' | 'right'; choice: Choice }[] {
  const result: { side: 'left' | 'right'; choice: Choice }[] = [];
  for (const side of ['left', 'right'] as const) {
    const raw = card[side];
    const list = isChoice(raw) ? [raw] : Object.values(raw);
    list.forEach((choice) => result.push({ side, choice }));
  }
  return result;
}

/** Every goto spec a choice can follow, with its conditions. */
export function gotoTargets(choice: Choice): { to: string; when?: Condition }[] {
  const specs: (Goto | undefined)[] = choice.gamble
    ? [choice.gamble.winGoto ?? choice.goto, choice.gamble.loseGoto ?? choice.goto]
    : [choice.goto];
  const targets: { to: string; when?: Condition }[] = [];
  for (const spec of specs) {
    if (spec === undefined) continue;
    if (typeof spec === 'string') targets.push({ to: spec });
    else spec.forEach((branch) => targets.push({ to: branch.to, when: branch.when }));
  }
  return targets;
}

/** Flags a condition reads. */
export function flagsRead(when: Condition | undefined): string[] {
  return when ? [...(when.flags ?? []), ...(when.notFlags ?? []), ...(when.anyFlags ?? [])] : [];
}

/** Flags read by a card (variants, conditional gotos, interlude eligibility). */
export function cardFlagReads(card: StoryNode | Interlude): string[] {
  const reads = (card.variants ?? []).flatMap((variant) => flagsRead(variant.when));
  for (const { choice } of choicesOf(card)) {
    gotoTargets(choice).forEach((target) => reads.push(...flagsRead(target.when)));
  }
  if ('when' in card) reads.push(...flagsRead(card.when));
  return reads;
}

/** Flags a card sets or clears. */
export function cardFlagWrites(card: StoryNode | Interlude): string[] {
  const writes = 'setFlags' in card ? [...(card.setFlags ?? [])] : [];
  for (const { choice } of choicesOf(card))
    writes.push(...(choice.setFlags ?? []), ...(choice.clearFlags ?? []));
  return writes;
}

/** Stable signature of what a side does narratively: where it goes and which flags it changes. */
export function narrativeSignature(card: StoryNode, side: 'left' | 'right'): string {
  const raw = card[side];
  const list = isChoice(raw) ? [raw] : Object.values(raw);
  return JSON.stringify(
    list.map((choice) => ({
      goto: gotoTargets(choice)
        .map((t) => `${t.to}|${JSON.stringify(t.when ?? null)}`)
        .sort(),
      set: [...(choice.setFlags ?? [])].sort(),
      clear: [...(choice.clearFlags ?? [])].sort(),
    })),
  );
}
