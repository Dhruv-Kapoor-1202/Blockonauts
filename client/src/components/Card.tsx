/**
 * Card: the draggable speaker card: art header in the speaker's colour with the theme's portrait,
 * FILE number and tag, the name plate, the text, the first-cards drag hint and the left/right
 * stamps that fade in with the drag distance. It restarts the "deal" animation for every new card
 * and flies out when told to. Purely presentational; the parent decides what a commit means.
 */
import type { CardView, CharacterDef, Side } from '@commander/engine';
import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactElement } from 'react';
import { FLY_OUT } from '../game/constants';
import { useTheme } from '../themes/ThemeProvider';
import { useCardDrag } from './use-card-drag';

/** Fixed copy of the card. */
export interface CardCopy {
  /** Formats the FILE number, e.g. `FILE 001`. */
  file: (fileNumber: number) => string;
  /** The hint on the first cards. */
  dragHint: string;
}

/** Props of {@link Card}. */
export interface CardProps {
  card: CardView;
  /** The speaker (undefined if content lacks it; the card then shows the speaker id). */
  speaker: CharacterDef | undefined;
  /** Changes for every newly dealt card (restarts the deal animation). */
  dealKey: number;
  /** Side the card is flying out to, or `null`. */
  flyOut: Side | null;
  /** Dragging allowed. */
  enabled: boolean;
  /** Show the "◀ DRAG ▶" hint. */
  showHint: boolean;
  /** Opacity (0..1) of each stamp. */
  stamps: Record<Side, number>;
  copy: CardCopy;
  onCommit: (side: Side) => void;
  onPreview: (side: Side | null, strength: number) => void;
}

/** The current card. */
export function Card({
  card,
  speaker,
  dealKey,
  flyOut,
  enabled,
  showHint,
  stamps,
  copy,
  onCommit,
  onPreview,
}: CardProps): ReactElement {
  const { theme } = useTheme();
  const c = theme.classes.card;
  const { ref, handlers } = useCardDrag({ enabled, onCommit, onPreview });
  const enterClasses = useRef(c.enter);
  enterClasses.current = c.enter;

  // Replays the deal animation for each new card (not when only the theme changes).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const names = enterClasses.current.split(' ').filter(Boolean);
    el.style.transition = 'none';
    el.style.transform = '';
    el.style.opacity = '1';
    names.forEach((name) => el.classList.remove(name));
    void el.offsetWidth;
    names.forEach((name) => el.classList.add(name));
  }, [dealKey, ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !flyOut) return;
    const direction = flyOut === 'left' ? -1 : 1;
    const ms = theme.motion.flyOutMs;
    el.style.transition = `transform ${ms}ms var(--t-ease-fly), opacity ${ms}ms var(--t-ease-fly)`;
    el.style.transform = `translate(${direction * FLY_OUT.distancePercent}%, ${FLY_OUT.dropPx}px) rotate(${direction * FLY_OUT.rotationDeg}deg)`;
    el.style.opacity = '0';
  }, [flyOut, theme.motion.flyOutMs, ref]);

  const name = speaker?.name ?? card.speakerId.toUpperCase();
  const artStyle = { '--c': speaker?.color ?? 'var(--t-accent)' } as CSSProperties;
  const Portrait = theme.Portrait;

  return (
    <div
      ref={ref}
      className={c.root}
      tabIndex={0}
      role="group"
      aria-label={`${name}: ${card.text}`}
      data-testid="card"
      data-card-id={card.id}
      {...handlers}
    >
      <div className={c.art} style={artStyle}>
        <div className={c.meta}>
          <span>{copy.file(card.fileNumber)}</span>
          {card.tag && <span className={c.tag}>{card.tag}</span>}
        </div>
        <div className={c.face}>{speaker && <Portrait character={speaker} />}</div>
        <div className={c.plate}>
          {name}
          {speaker && <small className={c.plateRole}>{speaker.role}</small>}
        </div>
      </div>
      <div className={c.body}>
        <p className={c.text}>{card.text}</p>
        {showHint && <span className={c.hint}>{copy.dragHint}</span>}
      </div>
      <div className={c.stamp.left} style={{ opacity: stamps.left }} aria-hidden="true">
        {card.left.label}
      </div>
      <div className={c.stamp.right} style={{ opacity: stamps.right }} aria-hidden="true">
        {card.right.label}
      </div>
    </div>
  );
}
