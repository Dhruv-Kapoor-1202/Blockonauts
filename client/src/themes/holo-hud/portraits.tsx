/**
 * holo-hud character portraits: holographic projections drawn as glowing wireframes in the
 * character's content colour. Humans live in portrait-human.tsx; ARIA is a wireframe head with a
 * scanning visor and Earth a wireframe globe with an orbiting relay. Shared colours come from the
 * `--t-portrait-*` tokens.
 */
import type { CharacterDef } from '@commander/engine';
import type { ReactElement } from 'react';
import type { PortraitProps } from '../types';
import { HoloHuman } from './portrait-human';

function HoloAi({ c }: { c: CharacterDef }): ReactElement {
  const line = {
    stroke: c.color,
    strokeWidth: 1.6,
    strokeLinejoin: 'round',
  } as const;
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <path d="M16 122Q20 96 40 92H80Q100 96 104 122Z" fill={c.color} fillOpacity=".14" {...line} />
      <rect x="52" y="78" width="16" height="16" {...line} />
      <rect x="24" y="22" width="72" height="60" rx="6" fill={c.color} fillOpacity=".1" {...line} />
      <rect x="31" y="29" width="58" height="46" rx="3" {...line} strokeOpacity=".5" />
      <path d="M31 52H89M60 29V75" {...line} strokeOpacity=".25" strokeWidth=".8" />
      <rect
        x="42"
        y="42"
        width="11"
        height="11"
        fill={c.color}
        className="origin-top animate-blink [transform-box:fill-box]"
      />
      <rect x="67" y="42" width="11" height="11" fill={c.color} />
      <path d="M46 62H74" {...line} strokeWidth="3" />
      <path d="M60 22V10" {...line} />
      <circle cx="60" cy="9" r="4" fill={c.color} />
      <circle cx="60" cy="9" r="8" {...line} strokeOpacity=".4" />
    </svg>
  );
}

function HoloEarth({ c }: { c: CharacterDef }): ReactElement {
  const line = { stroke: c.color, strokeWidth: 1.6 } as const;
  const thin = { ...line, strokeWidth: 1, strokeOpacity: 0.6 } as const;
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle cx="60" cy="66" r="44" fill={c.color} fillOpacity=".12" {...line} />
      <ellipse cx="60" cy="66" rx="18" ry="44" {...thin} />
      <ellipse cx="60" cy="66" rx="34" ry="44" {...thin} />
      <path d="M16 66H104M22 46H98M22 86H98M34 28H86M34 104H86" {...thin} />
      <ellipse cx="60" cy="66" rx="56" ry="14" transform="rotate(-18 60 66)" {...thin} />
      <circle cx="108" cy="52" r="4" fill={c.color} />
    </svg>
  );
}

/** Holographic portrait of a character (human bust, ARIA's wireframe head, or Earth). */
export function HoloPortrait({ character }: PortraitProps): ReactElement {
  if (character.kind === 'ai') return <HoloAi c={character} />;
  if (character.kind === 'earth') return <HoloEarth c={character} />;
  return <HoloHuman c={character} />;
}
