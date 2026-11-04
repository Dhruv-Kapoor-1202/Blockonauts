/**
 * ThemeProvider and `useTheme()`. The provider owns the active theme id and applies the theme's
 * token class (and the current world's accent class) to <html>. Switching themes only swaps that
 * class and the recipes in context, so nothing below the provider remounts and game state is kept.
 * The choice is persisted in localStorage (`commander.theme`) and `?theme=<id>` overrides it.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { WorldId } from '@commander/engine';
import { THEMES } from './registry';
import type { ThemeDefinition } from './types';

/** localStorage key of the chosen theme. */
export const THEME_STORAGE_KEY = 'commander.theme';
/** Query parameter that overrides the stored theme. */
export const THEME_QUERY_PARAM = 'theme';

/** What `useTheme()` returns. */
export interface ThemeContextValue {
  /** The active theme. */
  theme: ThemeDefinition;
  /** All selectable themes. */
  themes: readonly ThemeDefinition[];
  /** Switches theme (and persists the choice). */
  setThemeId: (id: string) => void;
  /** Tells the provider which world's accent to apply (`null` for none, e.g. on the landing page). */
  setWorld: (world: WorldId | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Picks the initial theme: `?theme=` first, then the stored choice, then the first theme. */
export function resolveInitialTheme(
  themes: readonly ThemeDefinition[],
  search: string,
  storage: Pick<Storage, 'getItem'> | null,
): ThemeDefinition {
  const fromQuery = new URLSearchParams(search).get(THEME_QUERY_PARAM);
  const stored = readStored(storage);
  const wanted = [fromQuery, stored].find((id) => id && themes.some((t) => t.id === id));
  return themes.find((t) => t.id === wanted) ?? (themes[0] as ThemeDefinition);
}

function readStored(storage: Pick<Storage, 'getItem'> | null): string | null {
  try {
    return storage?.getItem(THEME_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

/** Props of {@link ThemeProvider}. */
export interface ThemeProviderProps {
  children: ReactNode;
  /** Themes to offer; defaults to the registry. Tests inject their own. */
  themes?: readonly ThemeDefinition[];
}

function useDocumentClasses(classNames: readonly string[]): void {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const active = classNames.filter(Boolean);
    root.classList.add(...active);
    return () => root.classList.remove(...active);
  }, [classNames]);
}

/** Provides the active theme and keeps the <html> classes in sync. */
export function ThemeProvider({ children, themes = THEMES }: ThemeProviderProps): ReactElement {
  const [theme, setTheme] = useState(() =>
    resolveInitialTheme(themes, window.location.search, window.localStorage),
  );
  const [world, setWorld] = useState<WorldId | null>(null);

  const setThemeId = useCallback(
    (id: string) => {
      const next = themes.find((t) => t.id === id);
      if (!next) return;
      setTheme(next);
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next.id);
      } catch {
        // Private mode: the choice just isn't remembered.
      }
    },
    [themes],
  );

  const htmlClasses = useMemo(
    () => [theme.tokensClass, world ? (theme.worldTokens[world] ?? '') : ''],
    [theme, world],
  );
  useDocumentClasses(htmlClasses);

  const value = useMemo(
    () => ({ theme, themes, setThemeId, setWorld }),
    [theme, themes, setThemeId],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** The theme context. @throws Error outside a {@link ThemeProvider}. */
export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside <ThemeProvider>');
  return value;
}

/** Applies a world's accent tokens to <html> while the calling component is mounted. */
export function useWorldAccent(world: WorldId | null): void {
  const { setWorld } = useTheme();
  useEffect(() => {
    setWorld(world);
  }, [world, setWorld]);
}
