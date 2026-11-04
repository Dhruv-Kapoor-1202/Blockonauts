/**
 * StarField: a deterministic scatter of twinkling stars for scene backgrounds. Positions come from
 * a tiny seeded generator so the sky is stable across renders and tests; the look is supplied by
 * the caller's class names (themes decide colour, size and animation).
 */
import { memo, type CSSProperties, type ReactElement } from 'react';

const DEFAULT_COUNT = 90;
const DEFAULT_SEED = 7;
const MAX_TOP_PERCENT = 80;
const BIG_STAR_CHANCE = 0.15;
const BIG_STAR_SIZE = '3px';
const MAX_DELAY_SECONDS = 2.6;
const MIN_OPACITY = 0.3;

interface Star {
  style: CSSProperties;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Builds the star styles for a seed. Exported for tests. */
export function buildStars(count: number, seed: number): Star[] {
  const random = mulberry32(seed);
  return Array.from({ length: count }, () => {
    const style: CSSProperties = {
      left: `${random() * 100}%`,
      top: `${random() * MAX_TOP_PERCENT}%`,
      animationDelay: `${(random() * MAX_DELAY_SECONDS).toFixed(2)}s`,
      opacity: Number((MIN_OPACITY + random() * (1 - MIN_OPACITY)).toFixed(2)),
    };
    if (random() < BIG_STAR_CHANCE) {
      style.width = BIG_STAR_SIZE;
      style.height = BIG_STAR_SIZE;
    }
    return { style };
  });
}

/** Props of {@link StarField}. */
export interface StarFieldProps {
  /** Classes of each star (position is inline). */
  starClassName: string;
  /** Number of stars. */
  count?: number;
  /** Seed of the scatter. */
  seed?: number;
}

/** Renders absolutely positioned stars; place it inside a `relative`/`fixed` container. */
export const StarField = memo(function StarField({
  starClassName,
  count = DEFAULT_COUNT,
  seed = DEFAULT_SEED,
}: StarFieldProps): ReactElement {
  const stars = buildStars(count, seed);
  return (
    <div aria-hidden="true">
      {stars.map((star, index) => (
        <i key={index} className={starClassName} style={star.style} />
      ))}
    </div>
  );
});
