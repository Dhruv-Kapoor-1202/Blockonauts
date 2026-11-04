/**
 * neo-brutalist character portraits: flat, chunky SVG busts with a thick outline, ported from the
 * prototype. Per-character colours come from content (`characters.json`); the colours shared by
 * all portraits come from the theme's `--t-portrait-*` tokens.
 */
import type { CharacterDef } from '@commander/engine';
import type { ReactElement } from 'react';
import type { PortraitProps } from '../types';

const line = 'var(--t-portrait-line)';
const outline = { stroke: line, strokeWidth: 4, strokeLinejoin: 'round' } as const;
const fine = { stroke: line, strokeWidth: 3 } as const;
const FALLBACK_SKIN = 'var(--t-portrait-suit)';
const FALLBACK_HAIR = 'var(--t-portrait-line)';

function AiPortrait({ c }: { c: CharacterDef }): ReactElement {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <path
        d="M16 122 Q20 96 40 92 H80 Q100 96 104 122Z"
        fill="var(--t-portrait-ai-body)"
        {...outline}
      />
      <rect x="52" y="78" width="16" height="16" fill="var(--t-portrait-ai-neck)" {...outline} />
      <rect x="24" y="22" width="72" height="60" fill="var(--t-portrait-ai-head)" {...outline} />
      <rect x="31" y="29" width="58" height="46" fill="var(--t-portrait-ai-screen)" />
      <rect
        x="42"
        y="42"
        width="11"
        height="11"
        fill={c.color}
        className="origin-top animate-blink [transform-box:fill-box]"
      />
      <rect x="67" y="42" width="11" height="11" fill={c.color} />
      <rect x="46" y="60" width="28" height="4" fill={c.color} />
      <path d="M60 22V10" {...outline} />
      <circle cx="60" cy="9" r="4" fill={c.color} {...fine} />
    </svg>
  );
}

function EarthPortrait(): ReactElement {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="66" r="44" fill="var(--t-portrait-earth-ocean)" {...outline} />
      <path
        d="M34 50q10-14 24-8t6 16q-8 6-18 2t-12-10zM66 80q14-6 22 2t-4 16q-12 2-16-6t-2-12z"
        fill="var(--t-portrait-earth-land)"
        {...fine}
      />
      <path d="M60 22a44 44 0 0 1 0 88" fill="var(--t-portrait-earth-shade)" />
      <rect x="74" y="12" width="34" height="14" fill={line} />
      <text
        x="91"
        y="23"
        fontFamily="var(--t-font-mono)"
        fontSize="10"
        fill="var(--t-portrait-earth-label)"
        textAnchor="middle"
      >
        LIVE
      </text>
    </svg>
  );
}

function hairBehind(c: CharacterDef, hair: string): ReactElement | null {
  switch (c.hairStyle) {
    case 'long':
      return <rect x="32" y="34" width="56" height="58" rx="16" fill={hair} {...outline} />;
    case 'bun':
      return <circle cx="60" cy="20" r="11" fill={hair} {...outline} />;
    default:
      return null;
  }
}

function hairFront(c: CharacterDef, hair: string): ReactElement | null {
  switch (c.hairStyle) {
    case 'long':
      return (
        <path
          d="M37 54Q36 26 60 26Q84 26 83 54Q74 40 60 40Q46 40 37 54Z"
          fill={hair}
          {...outline}
        />
      );
    case 'short':
      return (
        <path d="M37 50Q35 24 60 24Q85 24 83 50L78 40Q60 33 42 40Z" fill={hair} {...outline} />
      );
    case 'bun':
      return (
        <path
          d="M37 50Q36 26 60 26Q84 26 83 50Q72 38 60 38Q48 38 37 50Z"
          fill={hair}
          {...outline}
        />
      );
    case 'curly':
      return (
        <g fill={hair} {...fine}>
          <circle cx="42" cy="36" r="9" />
          <circle cx="54" cy="28" r="10" />
          <circle cx="68" cy="28" r="10" />
          <circle cx="79" cy="37" r="9" />
        </g>
      );
    case 'cap':
      return (
        <>
          <path d="M37 46Q37 22 60 22Q83 22 83 46Z" fill={c.color} {...outline} />
          <path d="M60 44H96" stroke={line} strokeWidth="6" />
          <path d="M62 44H94" stroke={c.color} strokeWidth="2" />
        </>
      );
    default:
      return null;
  }
}

function headgear(c: CharacterDef): ReactElement | null {
  if (c.hat === 'hard') {
    return (
      <>
        <path d="M33 46Q33 16 60 16Q87 16 87 46Z" fill="var(--t-portrait-hardhat)" {...outline} />
        <rect x="27" y="42" width="66" height="8" fill="var(--t-portrait-hardhat)" {...outline} />
        <rect x="56" y="18" width="8" height="26" fill="var(--t-portrait-hardhat-band)" />
      </>
    );
  }
  if (c.hat === 'chef') {
    return (
      <path
        d="M40 38Q28 16 44 14Q50 2 62 9Q74 1 78 15Q94 15 80 38Z"
        fill="var(--t-portrait-chef)"
        {...outline}
      />
    );
  }
  return null;
}

function accessories(c: CharacterDef): ReactElement {
  return (
    <>
      {c.glasses && (
        <>
          <g fill="var(--t-portrait-glass)" {...fine}>
            <rect x="42" y="48" width="16" height="13" />
            <rect x="62" y="48" width="16" height="13" />
          </g>
          <path d="M58 54H62" {...fine} />
        </>
      )}
      {c.headset && (
        <>
          <path d="M35 58Q33 20 60 20Q87 20 85 58" fill="none" stroke={line} strokeWidth="5" />
          <rect x="29" y="50" width="10" height="16" fill={c.color} {...fine} />
          <path d="M36 66Q40 76 52 73" fill="none" {...fine} />
        </>
      )}
    </>
  );
}

function HumanPortrait({ c }: { c: CharacterDef }): ReactElement {
  const skin = c.skin ?? FALLBACK_SKIN;
  const hair = c.hair ?? FALLBACK_HAIR;
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      {hairBehind(c, hair)}
      <path d="M14 122Q16 92 44 87H76Q104 92 106 122Z" fill="var(--t-portrait-suit)" {...outline} />
      <path d="M44 87L60 106L76 87" fill="none" stroke={c.color} strokeWidth="6" />
      <path d="M44 87L60 106L76 87" fill="none" stroke={line} strokeWidth="2" />
      <rect x="80" y="100" width="13" height="10" fill={c.color} {...fine} />
      <rect x="52" y="74" width="16" height="16" fill={skin} {...outline} />
      <rect x="38" y="30" width="44" height="50" rx="19" fill={skin} {...outline} />
      {hairFront(c, hair)}
      {headgear(c)}
      <rect x="47" y="51" width="6" height="7" fill={line} />
      <rect x="67" y="51" width="6" height="7" fill={line} />
      <rect x="42" y="61" width="7" height="3" fill="var(--t-portrait-blush)" opacity=".55" />
      <rect x="71" y="61" width="7" height="3" fill="var(--t-portrait-blush)" opacity=".55" />
      <path
        d="M53 68Q60 73 67 68"
        fill="none"
        stroke={line}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {accessories(c)}
    </svg>
  );
}

/** Neo-brutalist portrait of a character (human bust, ARIA's screen face, or Earth). */
export function NeoPortrait({ character }: PortraitProps): ReactElement {
  if (character.kind === 'ai') return <AiPortrait c={character} />;
  if (character.kind === 'earth') return <EarthPortrait />;
  return <HumanPortrait c={character} />;
}
