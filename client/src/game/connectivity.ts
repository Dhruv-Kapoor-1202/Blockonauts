/**
 * Connectivity: a tiny observable flag that says whether the API has proven unreachable. The
 * content source and the stores report to it; the UI shows the OFFLINE chip while it is set.
 */
import { useSyncExternalStore } from 'react';

/** Observable "API unreachable" flag (Observer pattern, `useSyncExternalStore` compatible). */
export class Connectivity {
  private offline = false;
  private readonly listeners = new Set<() => void>();

  /** Records that the API could not be reached. */
  markOffline(): void {
    this.set(true);
  }

  /** Records that the API answered. */
  markOnline(): void {
    this.set(false);
  }

  /** Subscribes to changes. @returns an unsubscribe function. */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Current value. */
  getSnapshot = (): boolean => this.offline;

  private set(value: boolean): void {
    if (this.offline === value) return;
    this.offline = value;
    this.listeners.forEach((listener) => listener());
  }
}

/** Reads a {@link Connectivity} as React state. */
export function useOffline(connectivity: Connectivity): boolean {
  return useSyncExternalStore(connectivity.subscribe, connectivity.getSnapshot);
}
