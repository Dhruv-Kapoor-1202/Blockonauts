/**
 * holo-hud scene: a deep-space wash with a drifting perspective grid, twinkling stars, a glowing
 * wireframe planet (rotating meridians) with its satellites, night / storm veils as scanline and
 * colour shifts, and a fixed scanline + vignette overlay on top. Everything is driven by `--t-*`
 * tokens (accent and planet tints per world in worlds.css); ambient loops stop under
 * `prefers-reduced-motion` (`motion-reduce:`), leaving a still wireframe.
 */
import type { CSSProperties, ReactElement } from 'react';
import { StarField } from '../../components/StarField';
import type { BackgroundProps } from '../types';

const MERIDIAN_ANGLES = [0, 30, 60, 90, 120, 150];

const line = 'absolute rounded-pill border-bw border-accent/35';

const classes = {
  scene: 'fixed inset-0 z-0 overflow-hidden [background:var(--t-scene-bg)]',
  star: 'absolute size-0.5 rounded-pill bg-ink shadow-[0_0_6px_var(--t-accent)] animate-twinkle',
  floor: [
    'absolute inset-x-[-40%] bottom-0 h-[46%] origin-bottom opacity-50 [transform:perspective(420px)_rotateX(62deg)]',
    '[background-image:linear-gradient(var(--t-grid-line)_1px,transparent_1px),linear-gradient(90deg,var(--t-grid-line)_1px,transparent_1px)]',
    '[background-size:var(--t-grid-size)] [mask-image:var(--t-floor-mask)]',
    'animate-[h-grid_var(--t-dur-grid)_linear_infinite] motion-reduce:animate-none',
  ].join(' '),
  planet: [
    'absolute -bottom-[60vmin] -right-[36vmin] size-[110vmin] rounded-pill border-bw border-accent/50',
    '[background:var(--t-planet-bg)] [perspective:1400px] shadow-edge-xl',
    'transition-[box-shadow] duration-(--t-dur-world)',
  ].join(' '),
  meridian: `${line} inset-0 [transform:rotateY(var(--a))] animate-[h-globe_var(--t-dur-globe)_linear_infinite] motion-reduce:animate-none`,
  equator: `${line} inset-x-0 inset-y-[43%]`,
  latitudeNorth: `${line} inset-x-[9%] top-[22%] bottom-[66%]`,
  latitudeSouth: `${line} inset-x-[9%] top-[66%] bottom-[22%]`,
  satellite: [
    'absolute top-(--t-sat-top) left-(--t-sat-left) aspect-square w-(--t-sat-size) rounded-pill',
    'border-bw border-accent-2/70 shadow-edge-sm [background:var(--t-sat-bg)] transition-all duration-(--t-dur-world)',
  ].join(' '),
  moonlet:
    'absolute left-[26%] top-[24%] size-2.5 rounded-pill border-bw border-accent-2/70 [background:var(--t-sat-bg)] opacity-(--t-moonlet-opacity) transition-opacity duration-(--t-dur-world)',
  veil: 'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-(--t-dur-veil) data-[active=true]:opacity-100',
  night: 'bg-veil-night [background-image:var(--t-veil-night-lines)]',
  storm:
    'bg-veil-storm [background-image:var(--t-veil-storm-stripes)] [background-size:200%_200%] animate-storm',
  overlay: 'pointer-events-none fixed inset-0 z-50 overflow-hidden',
  scanlines: 'absolute inset-0 [background-image:var(--t-scanlines)]',
  vignette: 'absolute inset-0 [background:var(--t-vignette)]',
  band: 'absolute inset-x-0 top-0 h-32 [background:var(--t-scan-band)] animate-[h-scan_var(--t-dur-scan)_linear_infinite] motion-reduce:hidden',
};

/** Scene background of the holo-hud theme. */
export function HoloBackground({ phase }: BackgroundProps): ReactElement {
  return (
    <>
      <div className={classes.scene} aria-hidden="true">
        <StarField starClassName={classes.star} />
        <div className={classes.floor} />
        <div className={classes.planet}>
          {MERIDIAN_ANGLES.map((angle) => (
            <i
              key={angle}
              className={classes.meridian}
              style={{ '--a': `${angle}deg` } as CSSProperties}
            />
          ))}
          <i className={classes.equator} />
          <i className={classes.latitudeNorth} />
          <i className={classes.latitudeSouth} />
        </div>
        <div className={classes.satellite} />
        <div className={classes.moonlet} />
        <div className={`${classes.veil} ${classes.night}`} data-active={phase.night} />
        <div className={`${classes.veil} ${classes.storm}`} data-active={phase.storm} />
      </div>
      <div className={classes.overlay} aria-hidden="true">
        <div className={classes.vignette} />
        <div className={classes.scanlines} />
        <div className={classes.band} />
      </div>
    </>
  );
}
