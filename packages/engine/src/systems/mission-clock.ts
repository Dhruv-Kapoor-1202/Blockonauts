/**
 * MissionClock: the current day (or sol). A chapter may reset it (e.g. the survival chapter
 * starts at day 1) and it formats negative days as a launch countdown (T-3).
 */
export class MissionClock {
  private current: number;

  /** @param startDay the first day shown. */
  constructor(startDay = 1) {
    this.current = startDay;
  }

  /** The current day. */
  get day(): number {
    return this.current;
  }

  /** Moves forward one day. @returns the new day. */
  advance(): number {
    this.current += 1;
    return this.current;
  }

  /** Jumps to a specific day (chapter start or restore). */
  set(day: number): void {
    this.current = day;
  }

  /** Formats a day for display: `T-3` before day 1, otherwise zero-padded to three digits. */
  static format(day: number): string {
    return day < 1 ? `T${day === 0 ? '-0' : day}` : String(day).padStart(3, '0');
  }
}
