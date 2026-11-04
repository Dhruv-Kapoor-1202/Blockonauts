/**
 * useCardDrag: pointer-drag behaviour of the card, as in the prototype: pointer capture, the card
 * follows the pointer and tilts (`dx / 14` degrees), a preview is reported while dragging, and on
 * release the card either commits (past `min(110, width * 0.28)`) or snaps back. Movement is written
 * straight to the element's style for smoothness; React state only carries the preview.
 */
import { useCallback, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import type { Side } from '@commander/engine';
import { DRAG } from '../game/constants';

/** Options of {@link useCardDrag}. */
export interface CardDragOptions {
  /** Dragging is ignored while false (a turn is playing back). */
  enabled: boolean;
  /** The drag passed the threshold. */
  onCommit: (side: Side) => void;
  /** Reports the side being dragged and how far (1 = at the threshold), or `null` to clear. */
  onPreview: (side: Side | null, strength: number) => void;
}

/** What {@link useCardDrag} returns. */
export interface CardDrag {
  ref: RefObject<HTMLDivElement | null>;
  handlers: {
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
  };
}

interface DragState {
  startX: number;
  startY: number;
  dx: number;
}

/** Wires pointer dragging to a card element. */
export function useCardDrag({ enabled, onCommit, onPreview }: CardDragOptions): CardDrag {
  const ref = useRef<HTMLDivElement | null>(null);
  const drag = useRef<DragState | null>(null);

  const threshold = useCallback(
    () => Math.min(DRAG.maxThresholdPx, (ref.current?.offsetWidth ?? 0) * DRAG.thresholdRatio),
    [],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!enabled || !el) return;
      drag.current = { startX: event.clientX, startY: event.clientY, dx: 0 };
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic pointers (tests, some browsers) cannot be captured; dragging still works.
      }
      el.style.transition = 'none';
    },
    [enabled],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const state = drag.current;
      const el = ref.current;
      if (!state || !el) return;
      state.dx = event.clientX - state.startX;
      const dy = (event.clientY - state.startY) * DRAG.verticalFactor;
      el.style.transform = `translate(${state.dx}px, ${dy}px) rotate(${state.dx / DRAG.rotationDivisor}deg)`;
      if (Math.abs(state.dx) < DRAG.deadZonePx) onPreview(null, 0);
      else onPreview(state.dx < 0 ? 'left' : 'right', Math.abs(state.dx) / threshold());
    },
    [onPreview, threshold],
  );

  const end = useCallback(() => {
    const state = drag.current;
    const el = ref.current;
    drag.current = null;
    if (!state || !el) return;
    if (Math.abs(state.dx) > threshold()) {
      onCommit(state.dx < 0 ? 'left' : 'right');
      return;
    }
    el.style.transition = 'transform var(--t-dur-snap) var(--t-ease-snap)';
    el.style.transform = '';
    onPreview(null, 0);
  }, [onCommit, onPreview, threshold]);

  return {
    ref,
    handlers: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end },
  };
}
