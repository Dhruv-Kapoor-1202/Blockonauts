/**
 * useSavedRun: finds the most recent unfinished saved run (if any) so the landing screen can offer
 * Continue, and loads its snapshot on demand. Works through the injected `ProgressStore`, so it is
 * the same code online and offline.
 */
import type { SessionSnapshot } from '@commander/engine';
import { useCallback, useEffect, useState } from 'react';
import type { RunSummary } from '../api/types';
import { useServices } from '../app/services';

/** What {@link useSavedRun} returns. */
export interface SavedRunHandle {
  /** The run to continue, or `null` (also while loading). */
  run: RunSummary | null;
  /** Loads the snapshot of the run (`null` if it vanished). */
  load: () => Promise<SessionSnapshot | null>;
}

/** Looks up the latest resumable run. */
export function useSavedRun(): SavedRunHandle {
  const { progress } = useServices();
  const [run, setRun] = useState<RunSummary | null>(null);

  useEffect(() => {
    let active = true;
    progress
      .list()
      .then((runs) => {
        if (active) setRun(runs.find((r) => r.status !== 'missionOver') ?? null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [progress]);

  const load = useCallback(
    async () => (run ? progress.get(run.runId).catch(() => null) : null),
    [progress, run],
  );
  return { run, load };
}
