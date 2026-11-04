/**
 * FlagSet: the story flags a player has set. Flags are how choices in one chapter change
 * text, branches and interlude eligibility in later chapters.
 */
export class FlagSet {
  private readonly flags = new Set<string>();

  /** Sets a flag. */
  add(flag: string): void {
    this.flags.add(flag);
  }

  /** Clears a flag. */
  remove(flag: string): void {
    this.flags.delete(flag);
  }

  /** @returns true when the flag is set. */
  has(flag: string): boolean {
    return this.flags.has(flag);
  }

  /** @returns the set flags in insertion order. */
  all(): string[] {
    return [...this.flags];
  }

  /** Replaces the contents. */
  restore(flags: readonly string[]): void {
    this.flags.clear();
    flags.forEach((flag) => this.flags.add(flag));
  }
}
