/**
 * ResourceList: the panel with the seven resource meters (a column of bars on desktop, a row of
 * vertical bars on mobile) and the preview dots for the option being hovered or dragged.
 */
import type { ChoicePreview, ResourceDef, ResourceKey, ResourceValues } from '@commander/engine';
import type { ReactElement } from 'react';
import { dotFor } from '../game/effect-preview';
import type { ResourceMotion } from '../game/presented-state';
import type { Timing } from '../game/timing';
import { useTheme } from '../themes/ThemeProvider';
import { cx } from './cx';
import { Panel } from './primitives';
import { ResourceMeter } from './ResourceMeter';

/** Props of {@link ResourceList}. */
export interface ResourceListProps {
  defs: readonly ResourceDef[];
  values: ResourceValues;
  motions: Partial<Record<ResourceKey, ResourceMotion>>;
  /** The previewed option, if any. */
  preview: ChoicePreview | null;
  /** Show up/down tones on preview dots (Cadet). */
  hints: boolean;
  lowBelow: number;
  criticalBelow: number;
  timing: Timing;
  /** Panel caption, e.g. "SYSTEMS". */
  title: string;
  /** Secondary caption, e.g. the base name. */
  subtitle: string;
  /** Grid placement classes. */
  className?: string;
}

/** The resources panel. */
export function ResourceList({
  defs,
  values,
  motions,
  preview,
  hints,
  lowBelow,
  criticalBelow,
  timing,
  title,
  subtitle,
  className,
}: ResourceListProps): ReactElement {
  const { theme } = useTheme();
  const { classes } = theme;
  return (
    <Panel as="section" className={cx(classes.resource.wrap, className)} aria-label={title}>
      <div className={classes.resource.header}>
        <span>{title}</span>
        <span>{subtitle}</span>
      </div>
      <div className={classes.resource.list}>
        {defs.map((def) => (
          <ResourceMeter
            key={def.key}
            def={def}
            value={values[def.key]}
            motion={motions[def.key]}
            dot={dotFor(def.key, preview, hints)}
            lowBelow={lowBelow}
            criticalBelow={criticalBelow}
            timing={timing}
          />
        ))}
      </div>
    </Panel>
  );
}
