/**
 * GameProvider / useGame: puts the `useGameSession` controller in React context so every screen
 * (intro, game, results, report) shares the same session, and the session survives theme changes.
 */
import type { ContentBundle } from '@commander/engine';
import { createContext, useContext, type ReactElement, type ReactNode } from 'react';
import { useServices } from '../app/services';
import { useTheme } from '../themes/ThemeProvider';
import type { ExitDestination } from './playback-plan';
import { useGameSession, type GameController } from './useGameSession';

const GameContext = createContext<GameController | null>(null);

/** Props of {@link GameProvider}. */
export interface GameProviderProps {
  bundle: ContentBundle;
  onExit: (destination: ExitDestination) => void;
  children: ReactNode;
}

/** Creates the game controller and shares it with its children. */
export function GameProvider({ bundle, onExit, children }: GameProviderProps): ReactElement {
  const services = useServices();
  const { theme } = useTheme();
  const controller = useGameSession({ bundle, services, motion: theme.motion, onExit });
  return <GameContext.Provider value={controller}>{children}</GameContext.Provider>;
}

/** The current game controller. @throws Error outside a {@link GameProvider}. */
export function useGame(): GameController {
  const controller = useContext(GameContext);
  if (!controller) throw new Error('useGame must be used inside <GameProvider>');
  return controller;
}
