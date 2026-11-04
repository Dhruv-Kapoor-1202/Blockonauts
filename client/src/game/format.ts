/**
 * Pure text formatters for durations and previews (`T+2 DAYS`, `NO TIME`, `+3 SOLS`), shared by
 * the option buttons and the day-counter preview badge.
 */

/** The unit word for `days`: singular for exactly one, upper-cased. */
export function unitWord(days: number, unit: string, units: string): string {
  return (days === 1 ? unit : units).toUpperCase();
}

/** Option badge: `NO TIME` for zero days, otherwise `T+N DAYS`. */
export function durationBadge(days: number, unit: string, units: string, noTime: string): string {
  return days === 0 ? noTime : `T+${days} ${unitWord(days, unit, units)}`;
}

/** Day-counter preview badge `+N DAYS`, or `null` when the option takes no time. */
export function dayPreview(days: number, unit: string, units: string): string | null {
  return days > 0 ? `+${days} ${unitWord(days, unit, units)}` : null;
}
