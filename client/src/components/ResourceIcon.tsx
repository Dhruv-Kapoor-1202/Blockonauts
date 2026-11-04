/**
 * ResourceIcon: the seven resource glyphs (bolt, leaf, drop, shield, face, antenna, person) as
 * inline SVG using `currentColor`, ported from the prototype. Content names the icon in
 * `resources.json`; unknown names render nothing.
 */
import type { ReactElement } from 'react';

const STROKE = { stroke: 'currentColor', fill: 'none', strokeLinecap: 'round' } as const;

const ICONS: Record<string, ReactElement> = {
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor" />,
  leaf: <path d="M5 20c0-10 6-15 15-15 0 9-5 15-14 15M5 20l9-9" strokeWidth="2.8" {...STROKE} />,
  drop: (
    <path
      d="M12 2c4.5 5.5 6.5 9 6.5 12a6.5 6.5 0 0 1-13 0C5.5 11 7.5 7.5 12 2z"
      fill="currentColor"
    />
  ),
  shield: <path d="M12 2 4 5v6c0 5.5 3.5 9.5 8 11 4.5-1.5 8-5.5 8-11V5z" fill="currentColor" />,
  face: (
    <>
      <circle cx="12" cy="12" r="9" strokeWidth="2.8" {...STROKE} />
      <rect x="8" y="8.5" width="2.6" height="3.4" fill="currentColor" />
      <rect x="13.4" y="8.5" width="2.6" height="3.4" fill="currentColor" />
      <path d="M8 14.5q4 3.6 8 0" strokeWidth="2.6" {...STROKE} />
    </>
  ),
  antenna: (
    <>
      <path d="M12 11v10M8 21h8" strokeWidth="2.8" {...STROKE} strokeLinecap="butt" />
      <circle cx="12" cy="9" r="2.4" fill="currentColor" />
      <path
        d="M6.5 3.8a7.5 7.5 0 0 0 0 10.4M17.5 3.8a7.5 7.5 0 0 1 0 10.4"
        strokeWidth="2.6"
        {...STROKE}
      />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="7" r="4" fill="currentColor" />
      <path d="M4 22c0-5 3.5-8 8-8s8 3 8 8z" fill="currentColor" />
    </>
  ),
};

/** Props of {@link ResourceIcon}. */
export interface ResourceIconProps {
  /** Icon name from `resources.json`. */
  name: string;
}

/** Inline SVG icon for a resource. */
export function ResourceIcon({ name }: ResourceIconProps): ReactElement | null {
  const glyph = ICONS[name];
  if (!glyph) return null;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {glyph}
    </svg>
  );
}
