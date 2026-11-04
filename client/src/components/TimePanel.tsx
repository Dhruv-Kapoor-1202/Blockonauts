/**
 * TimePanel: the clock of the game screen: unit label and zero-padded day text with a flip
 * animation, the `+N DAYS` preview badge, status chips, the ARIA button with its speech bubble, the
 * timeline strip and the chapter header with goal progress. Presentational: it receives everything
 * (including how to ask ARIA) as props.
 */
import type { ChapterView, ChipView, TimelineCell } from '@commander/engine';
import type { ReactElement, ReactNode } from 'react';
import type { Timing } from '../game/timing';
import { useTheme } from '../themes/ThemeProvider';
import { Chip, Panel } from './primitives';
import { cx } from './cx';
import { TimelineStrip } from './TimelineStrip';
import { useAriaBubble } from './use-aria-bubble';

/** Fixed copy of the panel. */
export interface TimePanelCopy {
  ariaLabel: string;
  ariaButton: string;
  ariaBubbleTitle: string;
  /** Builds the chapter kicker, e.g. `CH 2`. */
  chapterKicker: (chapter: ChapterView) => string;
}

/** Props of {@link TimePanel}. */
export interface TimePanelProps {
  unitLabel: string;
  dayText: string;
  /** Changes whenever the day changes (restarts the flip animation). */
  dayTick: number;
  /** `+N DAYS` text while an option is previewed, or `null`. */
  previewText: string | null;
  chips: readonly ChipView[];
  timeline: readonly TimelineCell[];
  chapter: ChapterView;
  /** ARIA button pulses when true. */
  alert: boolean;
  /** Returns ARIA's advice, or `null` when it cannot answer. */
  ask: () => string | null;
  /** True while a turn plays back (hides the bubble). */
  busy: boolean;
  timing: Timing;
  copy: TimePanelCopy;
  /** Extra controls placed at the end of the chapter header row (e.g. the settings gear). */
  actions?: ReactNode;
  /** Grid placement classes. */
  className?: string;
}

/** The time panel. */
export function TimePanel(props: TimePanelProps): ReactElement {
  const { theme } = useTheme();
  const t = theme.classes.time;
  const { chapter, copy } = props;
  const bubble = useAriaBubble(props.ask, props.timing, props.busy);
  return (
    <Panel as="section" className={cx(t.root, props.className)}>
      <div className={t.chapter}>
        <span className={t.chapterKicker}>{copy.chapterKicker(chapter)}</span>
        <span className={t.chapterTitle}>{chapter.title}</span>
        {props.actions && <span className="ml-auto flex-none self-center">{props.actions}</span>}
      </div>
      <div className={t.row}>
        <div className={t.day}>
          <small className={t.unit}>{props.unitLabel}</small>
          <b key={props.dayTick} className={t.number} data-testid="day">
            {props.dayText}
          </b>
          <span
            className={t.preview}
            data-on={props.previewText !== null}
            data-testid="day-preview"
          >
            {props.previewText}
          </span>
        </div>
        <div className={t.chips}>
          {props.chips.map((chip, index) => (
            <Chip key={chip.id} hot={chip.hot} className={index >= 2 ? t.chipExtra : undefined}>
              {chip.text}
            </Chip>
          ))}
        </div>
        <button
          type="button"
          className={t.aria}
          data-alert={props.alert}
          aria-label={copy.ariaLabel}
          onClick={bubble.toggle}
        >
          {copy.ariaButton}
        </button>
      </div>
      <TimelineStrip cells={props.timeline} />
      <div>
        <div className={t.goal}>{chapter.goal}</div>
        <div
          className={t.goalBar}
          role="progressbar"
          aria-label={chapter.goal}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(chapter.progress * 100)}
        >
          <i className={t.goalFill} style={{ width: `${Math.min(1, chapter.progress) * 100}%` }} />
        </div>
      </div>
      {bubble.text !== null && (
        <div className={t.bubble} role="status">
          <b className={t.bubbleTitle}>{copy.ariaBubbleTitle}</b>
          {bubble.text}
        </div>
      )}
    </Panel>
  );
}
