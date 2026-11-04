/**
 * ResourceMeter: one colony system: icon, name, animated value, bar with ghost trail, preview dot
 * and floating pops. All looks come from the theme's `resource` recipes; state is exposed through
 * `data-*` attributes (low/critical, hit up/down, gain flash, dot size/kind/tone).
 */
import type { ResourceDef } from '@commander/engine';
import type { CSSProperties, ReactElement } from 'react';
import type { DotState } from '../game/effect-preview';
import type { ResourceMotion } from '../game/presented-state';
import type { Timing } from '../game/timing';
import { useTheme } from '../themes/ThemeProvider';
import { useBarLevels, useCountUp, useHitFeedback } from './meter-motion';
import { ResourceIcon } from './ResourceIcon';

/** Props of {@link ResourceMeter}. */
export interface ResourceMeterProps {
  def: ResourceDef;
  /** Current value, 0..100. */
  value: number;
  /** Latest change (drives ghost trail, pops and shake). */
  motion?: ResourceMotion;
  /** Preview dot. */
  dot: DotState;
  /** Below this the meter is "low". */
  lowBelow: number;
  /** Below this the meter is "critical". */
  criticalBelow: number;
  timing: Timing;
}

/** A single resource meter. */
export function ResourceMeter({
  def,
  value,
  motion,
  dot,
  lowBelow,
  criticalBelow,
  timing,
}: ResourceMeterProps): ReactElement {
  const { theme } = useTheme();
  const r = theme.classes.resource;
  const shown = useCountUp(value, timing);
  const bar = useBarLevels(value, timing);
  const { hit, pops } = useHitFeedback(motion, timing);
  const level = value < criticalBelow ? 'critical' : value < lowBelow ? 'low' : 'normal';
  const style = { '--v': bar.fill, '--g': bar.ghost, '--rc': def.color } as CSSProperties;

  return (
    <div
      className={r.root}
      style={style}
      title={def.name}
      data-resource={def.key}
      data-state={level}
      data-hit={hit}
    >
      <i
        className={r.dot}
        data-state={dot.state}
        data-kind={dot.kind}
        data-tone={dot.tone}
        aria-hidden="true"
      />
      <div className={r.icon}>
        <ResourceIcon name={def.icon} />
      </div>
      <div className={r.name}>{def.name}</div>
      <div className={r.value} data-testid={`value-${def.key}`}>
        {shown}
      </div>
      <div
        className={r.bar}
        role="meter"
        aria-label={def.name}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
      >
        <div className={r.ghost} data-gain={bar.gain} />
        <div className={r.fill} />
      </div>
      {pops.map((pop) => (
        <span key={pop.id} className={pop.up ? r.pop.up : r.pop.down} aria-hidden="true">
          {pop.text}
        </span>
      ))}
    </div>
  );
}
