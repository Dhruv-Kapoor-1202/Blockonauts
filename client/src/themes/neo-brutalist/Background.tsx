/**
 * neo-brutalist scene: dotted backdrop, twinkling stars, the pixel planet with its satellites,
 * night and storm veils and the film-grain overlay. Planet, satellite and veil looks come from the
 * `--t-*` tokens, which the per-world classes on <html> override (moon vs. mars).
 */
import type { ReactElement } from 'react';
import { StarField } from '../../components/StarField';
import type { BackgroundProps } from '../types';

const halftone = [
  'after:absolute after:inset-0 after:rounded-pill after:content-[""]',
  'after:[background-image:var(--t-halftone)] after:[background-size:var(--t-halftone-size)]',
  'after:[mask-image:var(--t-halftone-mask)]',
].join(' ');

const classes = {
  scene: [
    'fixed inset-0 z-0 overflow-hidden',
    'before:absolute before:inset-0 before:content-[""]',
    'before:[background-image:var(--t-scene-dots)] before:[background-size:var(--t-scene-dots-size)]',
  ].join(' '),
  star: 'absolute size-0.5 bg-ink animate-twinkle',
  planet: [
    'absolute -bottom-[62vmin] -right-[38vmin] size-[115vmin] rounded-pill border-bw border-edge opacity-[.55]',
    '[background:var(--t-planet-bg)] transition-[filter] duration-(--t-dur-world)',
    halftone,
  ].join(' '),
  satellite: [
    'absolute top-(--t-sat-top) left-(--t-sat-left) aspect-square w-(--t-sat-size) rounded-(--t-sat-radius)',
    'border-bw border-edge shadow-edge-lg [background:var(--t-sat-bg)] transition-all duration-(--t-dur-world)',
  ].join(' '),
  moonlet:
    'absolute left-[26%] top-[22%] h-3 w-3.5 rounded-pill border-bw-sm border-edge bg-(--t-sat2-bg) opacity-(--t-sat2-opacity) transition-opacity duration-(--t-dur-world)',
  veil: 'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-(--t-dur-veil) data-[active=true]:opacity-100',
  night: 'bg-veil-night',
  storm:
    'bg-veil-storm [background-image:var(--t-veil-storm-stripes)] [background-size:200%_200%] animate-storm',
  grain:
    'pointer-events-none fixed inset-0 z-50 opacity-[.07] mix-blend-overlay [background-image:var(--t-grain)]',
};

/** Scene background of the neo-brutalist theme. */
export function NeoBackground({ phase }: BackgroundProps): ReactElement {
  return (
    <>
      <div className={classes.scene} aria-hidden="true">
        <StarField starClassName={classes.star} />
        <div className={classes.planet} />
        <div className={classes.satellite} />
        <div className={classes.moonlet} />
        <div className={`${classes.veil} ${classes.night}`} data-active={phase.night} />
        <div className={`${classes.veil} ${classes.storm}`} data-active={phase.storm} />
      </div>
      <div className={classes.grain} aria-hidden="true" />
    </>
  );
}
