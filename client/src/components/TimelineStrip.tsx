/**
 * TimelineStrip: the row of day cells under the day counter (moon: a 28-day lit/dark cycle; mars:
 * a rolling window with storm days; supply markers). Renders nothing when the engine sends no
 * cells (story chapters).
 */
import type { TimelineCell } from '@commander/engine';
import type { ReactElement } from 'react';
import { useTheme } from '../themes/ThemeProvider';

/** Props of {@link TimelineStrip}. */
export interface TimelineStripProps {
  cells: readonly TimelineCell[];
}

function toneOf(cell: TimelineCell): 'lit' | 'dark' | 'storm' | 'now' {
  if (cell.storm) return 'storm';
  if (cell.now) return 'now';
  return cell.kind;
}

/** The timeline strip, or nothing when there are no cells. */
export function TimelineStrip({ cells }: TimelineStripProps): ReactElement | null {
  const { theme } = useTheme();
  if (cells.length === 0) return null;
  return (
    <div
      className={theme.classes.timeline}
      style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}
      aria-hidden="true"
      data-testid="timeline"
    >
      {cells.map((cell, index) => (
        <i
          key={index}
          className={theme.classes.timelineCell}
          data-tone={toneOf(cell)}
          data-past={cell.past}
          data-now={cell.now}
          data-supply={cell.supply}
        />
      ))}
    </div>
  );
}
