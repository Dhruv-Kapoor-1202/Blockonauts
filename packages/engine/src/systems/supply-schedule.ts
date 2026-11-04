/**
 * SupplySchedule: when resupply drops land. Every `every` days, on the day where
 * `day % every === offset`.
 */
export class SupplySchedule {
  /** @param every period in days. @param offset remainder on which supplies land. */
  constructor(
    readonly every: number,
    readonly offset: number,
  ) {}

  /** Whether supplies land on this day. */
  isSupplyDay(day: number): boolean {
    return day % this.every === this.offset;
  }

  /** Days until the next landing (1..every). */
  daysUntilNext(day: number): number {
    for (let ahead = 1; ahead <= this.every; ahead += 1) {
      if (this.isSupplyDay(day + ahead)) return ahead;
    }
    return this.every;
  }
}
