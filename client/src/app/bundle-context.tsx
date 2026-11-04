/**
 * BundleProvider / useBundle: shares the loaded `ContentBundle` (worlds, characters, difficulties,
 * thresholds...) with every screen so they read content instead of hard-coding it.
 */
import type { ContentBundle } from '@commander/engine';
import { createContext, useContext, type ReactElement, type ReactNode } from 'react';

const BundleContext = createContext<ContentBundle | null>(null);

/** Props of {@link BundleProvider}. */
export interface BundleProviderProps {
  bundle: ContentBundle;
  children: ReactNode;
}

/** Provides the content bundle. */
export function BundleProvider({ bundle, children }: BundleProviderProps): ReactElement {
  return <BundleContext.Provider value={bundle}>{children}</BundleContext.Provider>;
}

/** The content bundle. @throws Error outside a {@link BundleProvider}. */
export function useBundle(): ContentBundle {
  const bundle = useContext(BundleContext);
  if (!bundle) throw new Error('useBundle must be used inside <BundleProvider>');
  return bundle;
}
