/**
 * useAriaBubble: state of the ARIA speech bubble. Clicking the ARIA button asks the engine for its
 * current advice and shows it; clicking again (or waiting six seconds, or making a choice) hides it.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ARIA_BUBBLE_MS } from '../game/constants';
import type { Timing } from '../game/timing';

/** What {@link useAriaBubble} returns. */
export interface AriaBubbleState {
  /** The advice on screen, or `null`. */
  text: string | null;
  /** Shows or hides the bubble. */
  toggle: () => void;
}

/**
 * @param ask returns the advice, or `null` when ARIA cannot answer right now.
 * @param hideWhen hides the bubble whenever this becomes true (a turn is playing back).
 */
export function useAriaBubble(
  ask: () => string | null,
  timing: Timing,
  hideWhen: boolean,
): AriaBubbleState {
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setText(null);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (hideWhen) hide();
  }, [hideWhen, hide]);

  const toggle = useCallback(() => {
    if (text !== null) {
      hide();
      return;
    }
    const advice = ask();
    if (advice === null) return;
    setText(advice);
    clearTimeout(timer.current);
    timer.current = setTimeout(hide, timing.scale(ARIA_BUBBLE_MS));
  }, [ask, hide, text, timing]);

  return { text, toggle };
}
