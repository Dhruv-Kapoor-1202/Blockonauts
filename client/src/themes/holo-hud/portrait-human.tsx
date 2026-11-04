/**
 * holo-hud human portrait: a holographic bust drawn from the character data. Outlines use the
 * character's content colour, the face is a faint duotone of the skin tone, hair / hat / glasses /
 * headset follow the data, and a scanline pattern plus a sweeping beam sell the projection.
 * Colours shared by all portraits come from `--t-portrait-*` tokens.
 */
import type { CharacterDef } from '@commander/engine';
import { useId, type ReactElement } from 'react';

const FALLBACK_SKIN = 'var(--t-portrait-glass)';

interface Line {
  stroke: string;
  strokeWidth: number;
  strokeLinejoin: 'round';
}

function hairBehind(c: CharacterDef, hair: string, line: Line): ReactElement | null {
  switch (c.hairStyle) {
    case 'long':
      return (
        <rect
          x="32"
          y="34"
          width="56"
          height="58"
          rx="16"
          fill={hair}
          fillOpacity=".55"
          {...line}
        />
      );
    case 'bun':
      return <circle cx="60" cy="20" r="11" fill={hair} fillOpacity=".55" {...line} />;
    default:
      return null;
  }
}

function hairFront(c: CharacterDef, hair: string, line: Line): ReactElement | null {
  const fill = { fill: hair, fillOpacity: 0.6, ...line };
  switch (c.hairStyle) {
    case 'long':
      return <path d="M37 54Q36 26 60 26Q84 26 83 54Q74 40 60 40Q46 40 37 54Z" {...fill} />;
    case 'short':
      return <path d="M37 50Q35 24 60 24Q85 24 83 50L78 40Q60 33 42 40Z" {...fill} />;
    case 'bun':
      return <path d="M37 50Q36 26 60 26Q84 26 83 50Q72 38 60 38Q48 38 37 50Z" {...fill} />;
    case 'curly':
      return (
        <g {...fill}>
          <circle cx="42" cy="36" r="9" />
          <circle cx="54" cy="28" r="10" />
          <circle cx="68" cy="28" r="10" />
          <circle cx="79" cy="37" r="9" />
        </g>
      );
    case 'cap':
      return (
        <>
          <path d="M37 46Q37 22 60 22Q83 22 83 46Z" fill={c.color} fillOpacity=".4" {...line} />
          <path d="M60 44H96" {...line} strokeWidth="3" />
        </>
      );
    default:
      return null;
  }
}

function headgear(c: CharacterDef, line: Line): ReactElement | null {
  if (c.hat === 'hard') {
    return (
      <>
        <path d="M33 46Q33 16 60 16Q87 16 87 46Z" fill={c.color} fillOpacity=".35" {...line} />
        <rect x="27" y="42" width="66" height="8" fill={c.color} fillOpacity=".35" {...line} />
        <path d="M60 18V42" {...line} />
      </>
    );
  }
  if (c.hat === 'chef') {
    return (
      <path
        d="M40 38Q28 16 44 14Q50 2 62 9Q74 1 78 15Q94 15 80 38Z"
        fill={c.color}
        fillOpacity=".22"
        {...line}
      />
    );
  }
  return null;
}

function accessories(c: CharacterDef, line: Line): ReactElement {
  return (
    <>
      {c.glasses && (
        <>
          <g fill="var(--t-portrait-glass)" {...line}>
            <rect x="42" y="48" width="16" height="13" />
            <rect x="62" y="48" width="16" height="13" />
          </g>
          <path d="M58 54H62" {...line} />
        </>
      )}
      {c.headset && (
        <>
          <path d="M35 58Q33 20 60 20Q87 20 85 58" fill="none" {...line} strokeWidth="3" />
          <rect x="29" y="50" width="10" height="16" fill={c.color} fillOpacity=".5" {...line} />
          <path d="M36 66Q40 76 52 73" fill="none" {...line} />
        </>
      )}
    </>
  );
}

/** Holographic bust of a human crew member. */
export function HoloHuman({ c }: { c: CharacterDef }): ReactElement {
  const id = useId();
  const line = { stroke: c.color, strokeWidth: 1.6, strokeLinejoin: 'round' } as const;
  const skin = c.skin ?? FALLBACK_SKIN;
  const hair = c.hair ?? c.color;
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <pattern id={`${id}-scan`} width="4" height="3" patternUnits="userSpaceOnUse">
          <rect width="4" height="1" fill="var(--t-portrait-mask-off)" />
        </pattern>
        <mask id={`${id}-mask`}>
          <rect width="120" height="120" fill="var(--t-portrait-mask-on)" />
          <rect width="120" height="120" fill={`url(#${id}-scan)`} />
        </mask>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset=".7" stopColor={c.color} stopOpacity=".28" />
          <stop offset="1" stopColor={c.color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <g mask={`url(#${id}-mask)`}>
        {hairBehind(c, hair, line)}
        <path d="M14 122Q16 92 44 87H76Q104 92 106 122Z" fill={`url(#${id}-fade)`} {...line} />
        <path d="M44 87L60 106L76 87" fill="none" {...line} />
        <rect x="52" y="74" width="16" height="16" fill={skin} fillOpacity=".3" {...line} />
        <rect
          x="38"
          y="30"
          width="44"
          height="50"
          rx="19"
          fill={skin}
          fillOpacity=".34"
          {...line}
        />
        <path
          d="M40 55H80M42 67H78"
          stroke={c.color}
          strokeOpacity=".35"
          strokeWidth=".8"
          fill="none"
        />
        {hairFront(c, hair, line)}
        {headgear(c, line)}
        <rect x="47" y="51" width="6" height="4" fill={c.color} />
        <rect x="67" y="51" width="6" height="4" fill={c.color} />
        <path d="M53 68Q60 72 67 68" fill="none" {...line} />
        {accessories(c, line)}
      </g>
      <rect
        x="26"
        width="68"
        height="1.5"
        y="10"
        fill="var(--t-portrait-beam)"
        className="animate-[h-sweep_var(--t-dur-scan)_linear_infinite] motion-reduce:animate-none"
      />
    </svg>
  );
}
