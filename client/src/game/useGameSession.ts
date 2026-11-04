/**
 * useGameSession: the engine <-> React adapter. It owns the `GameSession`, plays the events of
 * each choice back with the prototype's pacing (see `playback-plan.ts`), keeps the "presented"
 * state the UI renders, autosaves after every command (see `RunPersistence`), and on mission end
 * deletes the save and submits the run to the leaderboard. All delays go through `Timing`, so
 * `?fast` (and tests) skip them.
 */
import {
  GameSessionFactory,
  type ContentBundle,
  type GameEvent,
  type GameSession,
  type GameView,
  type SessionSnapshot,
  type SessionStatus,
  type Side,
} from '@commander/engine';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { AppServices } from '../app/services';
import type { ThemeMotion } from '../themes/types';
import type { GameController, LeaderboardState, RunSelection } from './controller-types';
import { planChoice, type ExitDestination, type PlaybackStep } from './playback-plan';
import { playSteps } from './playback-runner';
import {
  applyStep,
  presentedFromView,
  reconcileWithView,
  type PresentedState,
} from './presented-state';
import { RunPersistence } from './run-persistence';
import { StickerQueue } from './sticker-queue';

export type { GameController, LeaderboardState, RunSelection } from './controller-types';

/** Inputs of the hook. */
export interface GameSessionOptions {
  bundle: ContentBundle;
  services: AppServices;
  motion: ThemeMotion;
  /** Called when the game screen hands over to a result screen. */
  onExit: (destination: ExitDestination) => void;
}

interface ActiveRun {
  runId: string;
  selection: RunSelection;
  submitted: boolean;
}

/** Owns the engine session and exposes it to React. */
export function useGameSession(options: GameSessionOptions): GameController {
  const { bundle, services } = options;
  const latest = useRef(options);
  latest.current = options;

  const sessionRef = useRef<GameSession | null>(null);
  const runRef = useRef<ActiveRun | null>(null);
  const busyRef = useRef(false);
  const generationRef = useRef(0);
  const stickers = useMemo(() => new StickerQueue(services.timing), [services.timing]);
  const persistence = useMemo(
    () => new RunPersistence(services.progress, services.leaderboard),
    [services.progress, services.leaderboard],
  );
  const sticker = useSyncExternalStore(stickers.subscribe, stickers.getSnapshot);

  const [view, setView] = useState<GameView | null>(null);
  const [presented, setPresented] = useState<PresentedState | null>(null);
  const [selection, setSelection] = useState<RunSelection | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardState>({ status: 'idle' });

  useEffect(
    () => () => {
      generationRef.current += 1;
      stickers.clear();
    },
    [stickers],
  );

  const install = useCallback(
    (session: GameSession, run: ActiveRun) => {
      generationRef.current += 1;
      busyRef.current = false;
      stickers.clear();
      sessionRef.current = session;
      runRef.current = run;
      const initial = session.view();
      setSelection(run.selection);
      setView(initial);
      setPresented(presentedFromView(initial, bundle.config.notes.max));
      setLeaderboard({ status: 'idle' });
    },
    [bundle, stickers],
  );

  const autosave = useCallback(
    (session: GameSession) => {
      if (runRef.current) persistence.autosave(runRef.current.runId, session.snapshot());
    },
    [persistence],
  );

  const finishMission = useCallback(
    (session: GameSession, final: GameView) => {
      const run = runRef.current;
      if (!run || run.submitted || !final.report) return;
      run.submitted = true;
      setLeaderboard({ status: 'loading' });
      persistence
        .finish({ runId: run.runId, callsign: run.selection.callsign }, session, final.report)
        .then((result) => setLeaderboard({ status: 'ready', result }))
        .catch(() => setLeaderboard({ status: 'failed' }));
    },
    [persistence],
  );

  const startRun = useCallback(
    (next: RunSelection) => {
      const { seeds } = latest.current.services;
      const session = GameSessionFactory.create({
        bundle,
        worldId: next.worldId,
        difficultyId: next.difficultyId,
        seed: seeds.newSeed(),
        callsign: next.callsign,
      });
      install(session, { runId: seeds.newRunId(), selection: next, submitted: false });
    },
    [bundle, install],
  );

  const restartRun = useCallback(() => {
    const current = runRef.current?.selection;
    if (current) startRun(current);
  }, [startRun]);

  const resumeRun = useCallback(
    (snapshot: SessionSnapshot, runId: string): SessionStatus => {
      const session = GameSessionFactory.restore(bundle, snapshot);
      persistence.skipPurge(runId);
      install(session, {
        runId,
        selection: {
          worldId: snapshot.worldId,
          difficultyId: snapshot.difficultyId,
          callsign: snapshot.callsign,
        },
        submitted: false,
      });
      return session.view().status;
    },
    [bundle, install, persistence],
  );

  const play = useCallback(
    (steps: PlaybackStep[], generation: number): Promise<ExitDestination | null> =>
      playSteps(steps, {
        timing: latest.current.services.timing,
        stickers,
        stickerMs: latest.current.motion.stickerMs,
        isCancelled: () => generationRef.current !== generation,
        apply: (step) => setPresented((state) => (state ? applyStep(state, step) : state)),
      }),
    [stickers],
  );

  const choose = useCallback(
    async (side: Side) => {
      const session = sessionRef.current;
      if (!session || busyRef.current) return;
      const before = session.view();
      if (before.status !== 'playing' || !before.card) return;
      busyRef.current = true;
      const generation = generationRef.current;
      setPresented((state) => (state ? { ...state, busy: true, flyOut: side } : state));

      // Subscribe BEFORE choosing: the engine resolves the whole turn synchronously.
      const events: GameEvent[] = [];
      const unsubscribe = session.events.onAny((event) => events.push(event));
      try {
        session.choose(side);
      } catch (error) {
        busyRef.current = false;
        setPresented((state) => (state ? { ...state, busy: false, flyOut: null } : state));
        throw error;
      } finally {
        unsubscribe();
      }

      const final = session.view();
      setView(final);
      if (final.status === 'missionOver') finishMission(session, final);
      else autosave(session);

      const chosen = before.card[side];
      const steps = planChoice(events, {
        days: chosen.days,
        hasGamble: chosen.hasGamble,
        units: before.units,
        flyOutMs: latest.current.motion.flyOutMs,
      });
      const exit = await play(steps, generation);
      if (generationRef.current !== generation) return;
      if (exit) {
        latest.current.onExit(exit);
        return;
      }
      setPresented((state) => (state ? reconcileWithView(state, final) : state));
      busyRef.current = false;
    },
    [autosave, finishMission, play],
  );

  const proceed = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.proceed();
    busyRef.current = false;
    const next = session.view();
    setView(next);
    setPresented(presentedFromView(next, bundle.config.notes.max));
    autosave(session);
  }, [autosave, bundle]);

  const askAria = useCallback((): string | null => {
    const session = sessionRef.current;
    if (!session || busyRef.current || session.view().status !== 'playing') return null;
    return session.askAria();
  }, []);

  return useMemo(
    () => ({
      view,
      presented,
      sticker,
      leaderboard,
      selection,
      startRun,
      restartRun,
      resumeRun,
      choose,
      proceed,
      askAria,
    }),
    [
      view,
      presented,
      sticker,
      leaderboard,
      selection,
      startRun,
      restartRun,
      resumeRun,
      choose,
      proceed,
      askAria,
    ],
  );
}
