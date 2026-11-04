/**
 * minimal character portraits: a flat avatar disc tinted by the character's content colour. Crew
 * members get their initials, ARIA a small waveform and Earth a simple globe. Only the content
 * colour (`character.color`) and the `--t-portrait-ink` token are used.
 */
import type { CharacterDef } from '@commander/engine';
import type { ReactElement } from 'react';
import type { PortraitProps } from '../types';

const ink = 'var(--t-portrait-ink)';
const MAX_INITIALS = 2;

/** Initials of a callsign-style name: first letters of the first and last word (or two letters). */
export function initialsOf(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return (words[0] ?? '').slice(0, MAX_INITIALS);
  return `${words[0]?.[0] ?? ''}${words[words.length - 1]?.[0] ?? ''}`;
}

function Disc({ color }: { color: string }): ReactElement {
  return (
    <>
      <circle cx="60" cy="60" r="58" fill="none" stroke={color} strokeOpacity=".35" />
      <circle cx="60" cy="60" r="50" fill={color} />
    </>
  );
}

function Initials({ c }: { c: CharacterDef }): ReactElement {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <Disc color={c.color} />
      <text
        x="60"
        y="60"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="38"
        fontWeight="600"
        letterSpacing="-1"
        fill={ink}
        className="font-display"
      >
        {initialsOf(c.name)}
      </text>
    </svg>
  );
}

function Waveform({ c }: { c: CharacterDef }): ReactElement {
  const heights = [14, 30, 46, 30, 14];
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <Disc color={c.color} />
      {heights.map((h, i) => (
        <rect key={i} x={36 + i * 12} y={60 - h / 2} width="7" height={h} rx="3.5" fill={ink} />
      ))}
    </svg>
  );
}

function Globe({ c }: { c: CharacterDef }): ReactElement {
  const stroke = { fill: 'none', stroke: ink, strokeWidth: 3, strokeOpacity: 0.8 } as const;
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <Disc color={c.color} />
      <circle cx="60" cy="60" r="30" {...stroke} />
      <ellipse cx="60" cy="60" rx="13" ry="30" {...stroke} />
      <path d="M30 60H90" {...stroke} />
    </svg>
  );
}

/** Minimal portrait: an initials avatar (or waveform / globe) on a tinted disc. */
export function MinimalPortrait({ character }: PortraitProps): ReactElement {
  if (character.kind === 'ai') return <Waveform c={character} />;
  if (character.kind === 'earth') return <Globe c={character} />;
  return <Initials c={character} />;
}
