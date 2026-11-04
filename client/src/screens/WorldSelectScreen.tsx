/**
 * World selection screen: two world cards (spec list from content, per-world accent preview) and
 * the three difficulties with their descriptions. Picking a world re-themes the accent live.
 */
import type { ReactElement } from 'react';
import { useBundle } from '../app/bundle-context';
import { COPY } from '../app/copy';
import { Button, Heading, Label } from '../components/primitives';
import { ThemeMenu } from '../components/ThemeMenu';
import { useTheme } from '../themes/ThemeProvider';
import { cx } from '../components/cx';

/** Props of {@link WorldSelectScreen}. */
export interface WorldSelectScreenProps {
  worldId: string;
  difficultyId: string;
  onWorld: (worldId: string) => void;
  onDifficulty: (difficultyId: string) => void;
  onBack: () => void;
  onLaunch: () => void;
}

/** Step 1: pick a rock; step 2: pick a difficulty. */
export function WorldSelectScreen({
  worldId,
  difficultyId,
  onWorld,
  onDifficulty,
  onBack,
  onLaunch,
}: WorldSelectScreenProps): ReactElement {
  const { theme } = useTheme();
  const { worlds: worldFiles, difficulties, campaign } = useBundle().data;
  const s = theme.classes.select;
  // Show worlds in the order the campaign file lists them (file order is alphabetical).
  const order = Object.keys(campaign.sequences);
  const worlds = [...worldFiles].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  return (
    <div className={s.root} data-testid="select-screen">
      <ThemeMenu
        className="fixed right-3 top-3 z-[60]"
        label={COPY.settings.label}
        title={COPY.settings.themes}
      />
      <div>
        <Label>{COPY.select.step1}</Label>
        <Heading>{COPY.select.heading}</Heading>
      </div>
      <div className={s.worlds} role="radiogroup" aria-label={COPY.select.heading}>
        {worlds.map((world) => (
          <button
            key={world.id}
            type="button"
            role="radio"
            aria-checked={world.id === worldId}
            data-selected={world.id === worldId}
            data-world={world.id}
            className={cx(s.world, theme.worldTokens[world.id])}
            onClick={() => onWorld(world.id)}
          >
            <span className={s.selectedTag}>{COPY.select.selected}</span>
            <div className={s.worldDisc} />
            <div>
              <span className={s.worldLocation}>{world.location}</span>
              <h3 className={s.worldName}>{world.title}</h3>
            </div>
            <dl className={s.specList}>
              {world.spec.map((row) => (
                <div key={row.label} className="contents">
                  <dt className={s.specTerm}>{row.label}</dt>
                  <dd className={s.specValue}>{row.value}</dd>
                </div>
              ))}
            </dl>
          </button>
        ))}
      </div>
      <Label>{COPY.select.step2}</Label>
      <div className={s.difficulties} role="radiogroup" aria-label={COPY.select.step2}>
        {difficulties.map((difficulty) => (
          <button
            key={difficulty.id}
            type="button"
            role="radio"
            aria-checked={difficulty.id === difficultyId}
            data-selected={difficulty.id === difficultyId}
            data-difficulty={difficulty.id}
            className={s.difficulty}
            onClick={() => onDifficulty(difficulty.id)}
          >
            {difficulty.name}
            <small className={s.difficultyHint}>{difficulty.description}</small>
          </button>
        ))}
      </div>
      <div className={s.actions}>
        <Button variant="secondary" onClick={onBack}>
          {COPY.select.back}
        </Button>
        <Button onClick={onLaunch}>{COPY.select.launch}</Button>
      </div>
    </div>
  );
}
