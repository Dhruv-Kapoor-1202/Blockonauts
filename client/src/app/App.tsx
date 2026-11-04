/**
 * App: the composition of providers. Services (injected) -> theme -> content loading -> content
 * bundle -> screen state machine -> game session -> stage. The theme provider sits above the game
 * provider, so switching themes re-renders but never remounts the running game.
 */
import type { ContentBundle } from '@commander/engine';
import { useCallback, useEffect, useReducer, useState, type ReactElement } from 'react';
import type { ExitDestination } from '../game/playback-plan';
import { GameProvider } from '../game/GameContext';
import { ThemeProvider } from '../themes/ThemeProvider';
import type { ThemeDefinition } from '../themes/types';
import { useTheme } from '../themes/ThemeProvider';
import { BundleProvider } from './bundle-context';
import { COPY } from './copy';
import { INITIAL_SCREEN, screenReducer } from './screen-machine';
import { ServicesProvider, useServices, type AppServices } from './services';
import { Stage } from './Stage';

/** Props of {@link App}. */
export interface AppProps {
  /** Injected collaborators (content, saves, leaderboard, timing, seeds...). */
  services: AppServices;
  /** Themes to offer; defaults to the registry (tests inject their own). */
  themes?: readonly ThemeDefinition[];
}

type ContentState =
  { status: 'loading' } | { status: 'ready'; bundle: ContentBundle } | { status: 'failed' };

function Notice({ text }: { text: string }): ReactElement {
  const { theme } = useTheme();
  const Background = theme.Background;
  return (
    <>
      <Background world={null} phase={{ night: false, storm: false }} />
      <div className="relative z-10 grid h-dvh place-items-center">
        <p className={theme.classes.label} role="status">
          {text}
        </p>
      </div>
    </>
  );
}

function Session({ bundle }: { bundle: ContentBundle }): ReactElement {
  const [screen, dispatch] = useReducer(screenReducer, INITIAL_SCREEN);
  const onExit = useCallback((destination: ExitDestination) => {
    dispatch({ type: destination === 'chapterResult' ? 'chapterEnded' : 'missionEnded' });
  }, []);
  return (
    <BundleProvider bundle={bundle}>
      <GameProvider bundle={bundle} onExit={onExit}>
        <Stage screen={screen} dispatch={dispatch} />
      </GameProvider>
    </BundleProvider>
  );
}

function ContentGate(): ReactElement {
  const { content } = useServices();
  const [state, setState] = useState<ContentState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    content
      .load()
      .then(({ bundle }) => active && setState({ status: 'ready', bundle }))
      .catch(() => active && setState({ status: 'failed' }));
    return () => {
      active = false;
    };
  }, [content]);

  if (state.status === 'ready') return <Session bundle={state.bundle} />;
  return <Notice text={state.status === 'failed' ? COPY.loadFailed : COPY.loading} />;
}

/** The whole application. */
export function App({ services, themes }: AppProps): ReactElement {
  return (
    <ServicesProvider value={services}>
      <ThemeProvider themes={themes}>
        <ContentGate />
      </ThemeProvider>
    </ServicesProvider>
  );
}
