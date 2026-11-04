/**
 * Meter motion hooks: the count-up number, the fill/ghost bars (drain trail / gain flash), the
 * shake/colour "hit" flash and the floating `+N/-N` pops of one resource meter. Pure view concerns;
 * every duration is scaled by `Timing` so `?fast` and tests skip them.
 */
import { useEffect, useRef, useState } from 'react';
import { METER, METER_START_VALUE } from '../game/constants';
import type { ResourceMotion } from '../game/presented-state';
import type { Timing } from '../game/timing';

/** True when the user asked the OS for reduced motion. */
function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

/** Animates an integer from its currently shown value to `value`. */
export function useCountUp(value: number, timing: Timing): number {
  const [shown, setShown] = useState(METER_START_VALUE);
  const shownRef = useRef(METER_START_VALUE);

  useEffect(() => {
    const duration = prefersReducedMotion() ? 0 : timing.scale(METER.countUpMs);
    const start = shownRef.current;
    if (duration <= 0 || start === value) {
      shownRef.current = Math.round(value);
      setShown(shownRef.current);
      return undefined;
    }
    let frame = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - t0) / duration);
      shownRef.current = Math.round(start + (value - start) * progress);
      setShown(shownRef.current);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, timing]);

  return shown;
}

/** Bar levels for one meter. */
export interface BarLevels {
  /** Fill level, 0..100. */
  fill: number;
  /** Ghost level, 0..100 (trails behind on drains, leads on gains). */
  ghost: number;
  /** True while the ghost shows a gain flash. */
  gain: boolean;
}

/** Drives the fill and ghost bars so CSS transitions animate drains (trail) and gains (flash). */
export function useBarLevels(value: number, timing: Timing): BarLevels {
  const [levels, setLevels] = useState<BarLevels>({
    fill: METER_START_VALUE,
    ghost: METER_START_VALUE,
    gain: false,
  });
  const previous = useRef(METER_START_VALUE);

  useEffect(() => {
    // `previous` only advances inside the frame callbacks so a re-run of this effect (React
    // StrictMode, or a quick second change) never loses the animation.
    const before = previous.current;
    if (value === before) return undefined;
    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (value < before) {
      setLevels((state) => ({ fill: value, ghost: state.ghost, gain: false }));
      frame = requestAnimationFrame(() => {
        previous.current = value;
        setLevels({ fill: value, ghost: value, gain: false });
      });
    } else {
      frame = requestAnimationFrame(() => {
        previous.current = value;
        setLevels({ fill: value, ghost: value, gain: true });
        timer = setTimeout(
          () => setLevels((state) => ({ ...state, gain: false })),
          timing.scale(METER.gainFlashMs),
        );
      });
    }
    return () => {
      cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
    };
  }, [value, timing]);

  return levels;
}

/** A floating number. */
export interface Pop {
  id: number;
  up: boolean;
  text: string;
}

/** What the "hit" flash and pops of a meter currently show. */
export interface HitState {
  hit: 'up' | 'down' | 'none';
  pops: Pop[];
}

const MINUS = '−';

/** Reacts to a resource change: flashes the meter and spawns a `+N/-N` pop (not for upkeep). */
export function useHitFeedback(motion: ResourceMotion | undefined, timing: Timing): HitState {
  const [state, setState] = useState<HitState>({ hit: 'none', pops: [] });
  const seen = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      clearTimeout(hitTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!motion || motion.seq === seen.current) return;
    seen.current = motion.seq;
    const delta = Math.round(motion.to) - Math.round(motion.from);
    if (!motion.pop || delta === 0) return;
    const up = delta > 0;
    const pop: Pop = { id: motion.seq, up, text: `${up ? '+' : MINUS}${Math.abs(delta)}` };
    setState((current) => ({ hit: up ? 'up' : 'down', pops: [...current.pops, pop] }));
    clearTimeout(hitTimer.current);
    hitTimer.current = setTimeout(
      () => setState((current) => ({ ...current, hit: 'none' })),
      timing.scale(METER.hitMs),
    );
    timers.current.push(
      setTimeout(
        () =>
          setState((current) => ({
            ...current,
            pops: current.pops.filter((p) => p.id !== pop.id),
          })),
        timing.scale(METER.popMs),
      ),
    );
  }, [motion, timing]);

  return state;
}
