/**
 * Stage: the part of the app that lives inside the content and game providers. It owns the world /
 * difficulty / callsign selection, maps screen-machine events to game-controller calls, renders
 * the current screen, the themed scene background, the sticker host and the offline chip, and
 * (in development only) installs the `window.__g` debug hook.
 */
import type { ContentBundle, Side } from '@commander/engine';
import { useCallback, useEffect, useRef, useState, type Dispatch, type ReactElement } from 'react';
import { OfflineChip, Sticker } from '../components/Notices';
import { useGame } from '../game/GameContext';
import { useOffline } from '../game/connectivity';
import { ChapterIntroScreen, ChapterResultScreen } from '../screens/ChapterScreens';
import { GameScreen } from '../screens/GameScreen';
import { LandingScreen } from '../screens/LandingScreen';
import { MissionReportScreen } from '../screens/MissionReportScreen';
import { WorldSelectScreen } from '../screens/WorldSelectScreen';
import { useTheme, useWorldAccent } from '../themes/ThemeProvider';
import { useBundle } from './bundle-context';
import { callsignOrDefault } from './callsign';
import { COPY } from './copy';
import type { Screen, ScreenEvent } from './screen-machine';
import { useServices } from './services';

const PREFERRED_DIFFICULTY = 'commander';

/** The world listed first in the campaign definition (the Moon), else the first world file. */
function defaultWorldId(bundle: ContentBundle): string {
  const [first] = Object.keys(bundle.data.campaign.sequences);
  return bundle.data.worlds.find((w) => w.id === first)?.id ?? bundle.data.worlds[0]?.id ?? '';
}

/** Props of {@link Stage}. */
export interface StageProps {
  screen: Screen;
  dispatch: Dispatch<ScreenEvent>;
}

/** The current screen with its chrome. */
export function Stage({ screen, dispatch }: StageProps): ReactElement {
  const bundle = useBundle();
  const game = useGame();
  const services = useServices();
  const { theme } = useTheme();
  const offline = useOffline(services.connectivity);
  const [pick, setPick] = useState(() => ({
    worldId: defaultWorldId(bundle),
    difficultyId:
      bundle.data.difficulties.find((d) => d.id === PREFERRED_DIFFICULTY)?.id ??
      bundle.data.difficulties[0]?.id ??
      '',
  }));
  const [callsign, setCallsign] = useState('');

  const inRun = screen.name !== 'landing' && screen.name !== 'select';
  const accent =
    screen.name === 'landing'
      ? null
      : inRun
        ? (game.selection?.worldId ?? pick.worldId)
        : pick.worldId;
  useWorldAccent(accent);

  const pickRef = useRef(pick);
  pickRef.current = pick;
  const startWith = useCallback(
    (chosen: typeof pick) => game.startRun({ ...chosen, callsign: callsignOrDefault(callsign) }),
    [callsign, game],
  );
  const launch = useCallback(() => {
    startWith(pick);
    dispatch({ type: 'launch' });
  }, [dispatch, pick, startWith]);

  const debug = useRef({ game, startWith });
  debug.current = { game, startWith };
  useEffect(() => {
    if (import.meta.env.DEV) {
      let dispose: (() => void) | undefined;
      let cancelled = false;
      // The hook mutates the selection synchronously, like the prototype's setMode/setDiff.
      const update = (change: Partial<typeof pick>) => {
        pickRef.current = { ...pickRef.current, ...change };
        setPick(pickRef.current);
      };
      void import('./debug-hook').then(({ installDebugHook }) => {
        if (cancelled) return;
        dispose = installDebugHook({
          getView: () => debug.current.game.view,
          choose: (side: Side) => void debug.current.game.choose(side),
          start: () => {
            debug.current.startWith(pickRef.current);
            // Whatever screen we are on, walk the machine into the game.
            for (const type of ['start', 'launch', 'begin', 'flyAgain'] as const)
              dispatch({ type });
          },
          setWorld: (worldId) => update({ worldId }),
          setDifficulty: (difficultyId) => update({ difficultyId }),
        });
      });
      return () => {
        cancelled = true;
        dispose?.();
      };
    }
    return undefined;
  }, [dispatch]);

  // The scene veils belong to the base-survival chapters; story chapters (launch, cruise...) are
  // not on the surface, even though the engine computes a lunar phase for their day counter.
  const simulating = screen.name === 'game' && (game.presented?.chapter.simulate ?? false);
  const phase = {
    night: simulating && (game.presented?.night ?? false),
    storm: simulating && (game.presented?.storm ?? false),
  };
  const Background = theme.Background;
  const { view } = game;

  return (
    <>
      <Background world={accent} phase={phase} />
      <div className="relative z-10 h-dvh">
        {screen.name === 'landing' && (
          <LandingScreen
            onStart={(chosen) => {
              setCallsign(chosen);
              dispatch({ type: 'start' });
            }}
            onContinue={(snapshot, runId) => {
              setCallsign(snapshot.callsign);
              setPick({ worldId: snapshot.worldId, difficultyId: snapshot.difficultyId });
              dispatch({ type: 'resume', status: game.resumeRun(snapshot, runId) });
            }}
          />
        )}
        {screen.name === 'select' && (
          <WorldSelectScreen
            worldId={pick.worldId}
            difficultyId={pick.difficultyId}
            onWorld={(worldId) => setPick((p) => ({ ...p, worldId }))}
            onDifficulty={(difficultyId) => setPick((p) => ({ ...p, difficultyId }))}
            onBack={() => dispatch({ type: 'back' })}
            onLaunch={launch}
          />
        )}
        {screen.name === 'chapterIntro' && view && (
          <ChapterIntroScreen view={view} onBegin={() => dispatch({ type: 'begin' })} />
        )}
        {screen.name === 'game' && <GameScreen />}
        {screen.name === 'chapterResult' && view && (
          <ChapterResultScreen
            view={view}
            onNext={(next) => {
              if (next === 'report') {
                dispatch({ type: 'report' });
                return;
              }
              game.proceed();
              dispatch({ type: 'next' });
            }}
          />
        )}
        {screen.name === 'missionReport' && view && (
          <MissionReportScreen
            view={view}
            callsign={game.selection?.callsign ?? callsign}
            achievements={bundle.data.achievements}
            leaderboard={game.leaderboard}
            onSwitchRock={() => dispatch({ type: 'switchRock' })}
            onFlyAgain={() => {
              game.restartRun();
              dispatch({ type: 'flyAgain' });
            }}
          />
        )}
      </div>
      {game.sticker && <Sticker key={game.sticker.id} sticker={game.sticker} />}
      {offline && <OfflineChip label={COPY.offline} />}
    </>
  );
}
