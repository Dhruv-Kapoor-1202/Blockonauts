/**
 * Keyboard controls of the game screen: ArrowLeft / A choose the left option and ArrowRight / D the
 * right one. Ignored while typing in a field or when a modifier key is held.
 */
import type { Side } from '@commander/engine';
import { useEffect } from 'react';

const LEFT_KEYS = new Set(['arrowleft', 'a']);
const RIGHT_KEYS = new Set(['arrowright', 'd']);

/** Maps a keyboard event to a side, or `null`. Exported for tests. */
export function sideForKey(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey'>,
): Side | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  const key = event.key.toLowerCase();
  if (LEFT_KEYS.has(key)) return 'left';
  if (RIGHT_KEYS.has(key)) return 'right';
  return null;
}

/** Calls `onChoose` for the pressed side while `enabled`. */
export function useChoiceKeys(enabled: boolean, onChoose: (side: Side) => void): void {
  useEffect(() => {
    if (!enabled) return undefined;
    const handle = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      const side = sideForKey(event);
      if (side) onChoose(side);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [enabled, onChoose]);
}
