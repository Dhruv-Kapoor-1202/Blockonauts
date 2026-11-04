/**
 * minimal scene: a calm gradient wash, a few faint specks, a soft planet in the corner with its
 * satellite, and night / storm expressed as gentle tints. No grain, no loops: nothing animates
 * except the fade between phases. Looks come from the `--t-*` tokens (per-world in worlds.css).
 */
import type { ReactElement } from 'react';
import { StarField } from '../../components/StarField';
import type { BackgroundProps } from '../types';

const STAR_COUNT = 36;

const classes = {
  scene: 'fixed inset-0 z-0 overflow-hidden [background-image:var(--t-scene-glow)] bg-no-repeat',
  star: 'absolute size-0.5 rounded-pill bg-(--t-star)',
  planet: [
    'absolute -bottom-[58vmin] -right-[34vmin] size-[100vmin] rounded-pill border-bw border-line',
    '[background:var(--t-planet-bg)] transition-opacity duration-(--t-dur-world)',
    'before:absolute before:-inset-[7vmin] before:rounded-pill before:border-bw before:border-line',
    'before:opacity-60 before:content-[""]',
  ].join(' '),
  satellite: [
    'absolute top-(--t-sat-top) left-(--t-sat-left) aspect-square w-(--t-sat-size) rounded-pill',
    'border-bw border-line shadow-hard-xs [background:var(--t-sat-bg)] transition-all duration-(--t-dur-world)',
  ].join(' '),
  moonlet:
    'absolute left-[24%] top-[26%] size-2.5 rounded-pill border-bw border-line [background:var(--t-sat-bg)] opacity-(--t-moonlet-opacity) transition-opacity duration-(--t-dur-world)',
  veil: 'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-(--t-dur-veil) data-[active=true]:opacity-100',
  night: 'bg-veil-night',
  storm: 'bg-veil-storm',
};

/** Scene background of the minimal theme. */
export function MinimalBackground({ phase }: BackgroundProps): ReactElement {
  return (
    <div className={classes.scene} aria-hidden="true">
      <StarField starClassName={classes.star} count={STAR_COUNT} />
      <div className={classes.planet} />
      <div className={classes.satellite} />
      <div className={classes.moonlet} />
      <div className={`${classes.veil} ${classes.night}`} data-active={phase.night} />
      <div className={`${classes.veil} ${classes.storm}`} data-active={phase.storm} />
    </div>
  );
}
