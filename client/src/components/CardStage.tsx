/**
 * CardStage: the area holding the stacked deck backs and the current card.
 */
import type { ReactElement } from 'react';
import { useTheme } from '../themes/ThemeProvider';
import { Card, type CardProps } from './Card';
import { cx } from './cx';

/** Props of {@link CardStage}: the card's props plus grid placement. */
export interface CardStageProps extends Omit<CardProps, 'card'> {
  /** The card, or `null` while none is on the table. */
  card: CardProps['card'] | null;
  /** Grid placement classes. */
  className?: string;
}

/** Deck backs plus the card. */
export function CardStage({ card, className, ...cardProps }: CardStageProps): ReactElement {
  const { theme } = useTheme();
  return (
    <div className={cx(theme.classes.card.stage, className)}>
      <div className={theme.classes.card.deck} data-depth="2" aria-hidden="true" />
      <div className={theme.classes.card.deck} data-depth="1" aria-hidden="true" />
      {card && <Card card={card} {...cardProps} />}
    </div>
  );
}
