/**
 * OptionButtons: the two choice buttons under the card. Each shows its label and a duration badge
 * (`T+N DAYS/SOLS` or `NO TIME`, accented for long choices). Hover and focus preview the option;
 * the button on the dragged side is highlighted.
 */
import type { ChoicePreview, Side } from '@commander/engine';
import type { ReactElement } from 'react';
import { LONG_OPTION_DAYS } from '../game/constants';
import { useTheme } from '../themes/ThemeProvider';
import { cx } from './cx';

/** Fixed copy of the buttons. */
export interface OptionCopy {
  /** Badge text for an option taking `days` days. */
  duration: (days: number) => string;
  /** Accessible name of the left/right option. */
  ariaLabel: (side: Side, label: string) => string;
}

/** Props of {@link OptionButtons}. */
export interface OptionButtonsProps {
  left: ChoicePreview;
  right: ChoicePreview;
  /** The side highlighted by dragging or hovering. */
  highlighted: Side | null;
  /** Buttons ignore input while a turn plays back. */
  disabled: boolean;
  copy: OptionCopy;
  onChoose: (side: Side) => void;
  /** Hover/focus preview (`null` clears it). */
  onPreview: (side: Side | null) => void;
  /** Grid placement classes. */
  className?: string;
}

const SIDES: readonly Side[] = ['left', 'right'];

/** The two option buttons. */
export function OptionButtons({
  left,
  right,
  highlighted,
  disabled,
  copy,
  onChoose,
  onPreview,
  className,
}: OptionButtonsProps): ReactElement {
  const { theme } = useTheme();
  const choices: Record<Side, ChoicePreview> = { left, right };
  return (
    <div
      className={cx(
        'grid grid-cols-2 gap-2.5 desk:w-[min(100%,420px)] desk:justify-self-center',
        className,
      )}
    >
      {SIDES.map((side) => {
        const choice = choices[side];
        return (
          <button
            key={side}
            type="button"
            className={theme.classes.option}
            data-side={side}
            data-highlighted={highlighted === side}
            aria-disabled={disabled}
            aria-label={copy.ariaLabel(side, choice.label)}
            onClick={() => !disabled && onChoose(side)}
            onPointerEnter={(event) =>
              event.pointerType === 'mouse' && !disabled && onPreview(side)
            }
            onPointerLeave={() => !disabled && onPreview(null)}
            onFocus={() => !disabled && onPreview(side)}
            onBlur={() => onPreview(null)}
          >
            <span className={theme.classes.optionTitle}>{choice.label}</span>
            <span className={theme.classes.optionBadge} data-long={choice.days >= LONG_OPTION_DAYS}>
              {copy.duration(choice.days)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
