/**
 * Game screen: composes the time panel, resource meters, card stage, option buttons and field
 * notes in the prototype's responsive grid (mobile: time, resources, card, options, notes; desktop
 * >= 980px: resources | card + options | time + notes). It renders the PRESENTED state, handles
 * previews (drag, hover, focus) and forwards choices to the game controller.
 */
import type { Side } from '@commander/engine';
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { useBundle } from '../app/bundle-context';
import { COPY } from '../app/copy';
import { useServices } from '../app/services';
import { CardStage } from '../components/CardStage';
import { FieldNotes } from '../components/FieldNotes';
import { OptionButtons } from '../components/OptionButtons';
import { ResourceList } from '../components/ResourceList';
import { ThemeMenu } from '../components/ThemeMenu';
import { TimePanel } from '../components/TimePanel';
import { DRAG, DRAG_HINT_CARDS } from '../game/constants';
import { useGame } from '../game/GameContext';
import { dayPreview, durationBadge } from '../game/format';
import { useTheme } from '../themes/ThemeProvider';
import { useChoiceKeys } from './use-choice-keys';

const GRID = [
  'mx-auto grid h-full max-w-[560px] gap-3 px-3 pt-2.5 pb-[max(12px,env(safe-area-inset-bottom))]',
  'grid-cols-[minmax(0,1fr)] grid-rows-[auto_auto_minmax(0,1fr)_auto_auto]',
  '[grid-template-areas:"time"_"res"_"stage"_"opts"_"notes"]',
  'desk:max-w-[1260px] desk:grid-cols-[300px_minmax(0,1fr)_300px] desk:grid-rows-[auto_minmax(0,1fr)_auto]',
  'desk:gap-x-7 desk:gap-y-[22px] desk:p-7',
  'desk:[grid-template-areas:"res_stage_time"_"res_stage_notes"_"res_opts_notes"]',
].join(' ');

const AREA = {
  time: '[grid-area:time]',
  resources: '[grid-area:res]',
  stage: '[grid-area:stage]',
  options: '[grid-area:opts]',
  notes: '[grid-area:notes]',
} as const;

interface Preview {
  side: Side | null;
  strength: number;
}

const NO_PREVIEW: Preview = { side: null, strength: 0 };

/** The playable screen. */
export function GameScreen(): ReactElement | null {
  const bundle = useBundle();
  const { timing } = useServices();
  const { theme } = useTheme();
  const game = useGame();
  const { presented, selection } = game;
  const [preview, setPreview] = useState<Preview>(NO_PREVIEW);

  const showPreview = useCallback((side: Side | null, strength = 1) => {
    setPreview((current) =>
      current.side === side && current.strength === strength ? current : { side, strength },
    );
  }, []);

  const { flyOutMs } = theme.motion;
  const choose = useCallback(
    (side: Side) => {
      showPreview(side);
      void game.choose(side);
      void timing.wait(flyOutMs).then(() => showPreview(null));
    },
    [flyOutMs, game, showPreview, timing],
  );

  const busy = presented?.busy ?? true;
  useChoiceKeys(!busy, choose);

  const hints = selection ? bundle.difficulty(selection.difficultyId).hints : false;
  const thresholds = bundle.config.thresholds;
  const world = presented ? bundle.world(presented.worldId) : null;
  const previewed = preview.side && presented?.card ? presented.card[preview.side] : null;
  const stamps = useMemo(
    () => ({
      left: preview.side === 'left' ? Math.min(1, preview.strength * DRAG.stampBoost) : 0,
      right: preview.side === 'right' ? Math.min(1, preview.strength * DRAG.stampBoost) : 0,
    }),
    [preview],
  );

  if (!presented || !world) return null;
  const { card } = presented;
  const alert = Object.values(presented.resources).some((value) => value < thresholds.ariaAlert);

  return (
    <main className={GRID} data-testid="game-screen">
      <TimePanel
        className={AREA.time}
        unitLabel={presented.unitLabel}
        dayText={presented.dayText}
        dayTick={presented.dayTick}
        previewText={previewed ? dayPreview(previewed.days, presented.unit, presented.units) : null}
        chips={presented.chips}
        timeline={presented.timeline}
        chapter={presented.chapter}
        alert={alert}
        ask={game.askAria}
        busy={presented.busy}
        timing={timing}
        copy={{
          ariaLabel: COPY.game.ariaLabel,
          ariaButton: COPY.game.ariaButton,
          ariaBubbleTitle: COPY.game.ariaBubbleTitle,
          chapterKicker: (chapter) => COPY.game.chapterKicker(chapter.index),
        }}
        actions={<ThemeMenu label={COPY.settings.label} title={COPY.settings.themes} />}
      />
      <ResourceList
        className={AREA.resources}
        defs={bundle.data.resources}
        values={presented.resources}
        motions={presented.motions}
        preview={previewed}
        hints={hints}
        lowBelow={thresholds.low}
        criticalBelow={thresholds.critical}
        timing={timing}
        title={COPY.game.systems}
        subtitle={world.name}
      />
      <CardStage
        className={AREA.stage}
        card={card}
        speaker={card ? bundle.character(card.speakerId) : undefined}
        dealKey={presented.cardSeq}
        flyOut={presented.flyOut}
        enabled={!busy}
        showHint={(card?.fileNumber ?? Infinity) < DRAG_HINT_CARDS}
        stamps={stamps}
        copy={{ file: COPY.game.file, dragHint: COPY.game.dragHint }}
        onCommit={choose}
        onPreview={showPreview}
      />
      {card && (
        <OptionButtons
          className={AREA.options}
          left={card.left}
          right={card.right}
          highlighted={preview.side}
          disabled={busy}
          copy={{
            duration: (days) =>
              durationBadge(days, presented.unit, presented.units, COPY.game.noTime),
            ariaLabel: (side, label) =>
              `${side === 'left' ? COPY.game.leftSide : COPY.game.rightSide}: ${label}`,
          }}
          onChoose={choose}
          onPreview={(side) => showPreview(side)}
        />
      )}
      <FieldNotes
        className={AREA.notes}
        notes={presented.notes}
        freshNote={presented.freshNote}
        title={COPY.game.notes}
        emptyText={COPY.game.notesEmpty}
      />
    </main>
  );
}
