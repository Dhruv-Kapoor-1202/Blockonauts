/**
 * Landing screen: eyebrow, the giant COMMANDER title, the pitch, callsign entry (max 12 chars,
 * upper-case, Enter submits), a Continue button when a saved run exists, the credit line and the
 * scrolling ticker taken from the content's facts-and-tips.
 */
import type { SessionSnapshot } from '@commander/engine';
import { useState, type FormEvent, type ReactElement } from 'react';
import { callsignOrDefault, filterCallsignInput } from '../app/callsign';
import { useBundle } from '../app/bundle-context';
import { COPY } from '../app/copy';
import { useServices } from '../app/services';
import { Button, Label } from '../components/primitives';
import { ThemeMenu } from '../components/ThemeMenu';
import { CALLSIGN, STORAGE_KEYS } from '../game/constants';
import { useTheme } from '../themes/ThemeProvider';
import { useSavedRun } from './use-saved-run';

/** Props of {@link LandingScreen}. */
export interface LandingScreenProps {
  /** The player chose to start a new run with this callsign. */
  onStart: (callsign: string) => void;
  /** The player chose to continue a saved run. */
  onContinue: (snapshot: SessionSnapshot, runId: string) => void;
}

function readCallsign(storage: Pick<Storage, 'getItem'>): string {
  try {
    return filterCallsignInput(storage.getItem(STORAGE_KEYS.callsign) ?? '');
  } catch {
    return '';
  }
}

/** The title screen. */
export function LandingScreen({ onStart, onContinue }: LandingScreenProps): ReactElement {
  const { theme } = useTheme();
  const { storage } = useServices();
  const bundle = useBundle();
  const saved = useSavedRun();
  const [callsign, setCallsign] = useState(() => readCallsign(storage));
  const l = theme.classes.landing;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const chosen = callsignOrDefault(callsign);
    try {
      storage.setItem(STORAGE_KEYS.callsign, chosen);
    } catch {
      // Remembering the callsign is a nicety only.
    }
    onStart(chosen);
  };

  const resume = async () => {
    const snapshot = await saved.load();
    if (!snapshot || !saved.run) return;
    try {
      onContinue(snapshot, saved.run.runId);
    } catch {
      // The save belongs to content that no longer exists; stay on the title screen.
    }
  };

  const run = saved.run;
  const world = run ? bundle.data.worlds.find((w) => w.id === run.worldId) : undefined;

  return (
    <div className={l.root} data-testid="landing-screen">
      <ThemeMenu
        className="fixed right-3 top-3 z-[60]"
        label={COPY.settings.label}
        title={COPY.settings.themes}
      />
      <span className={l.eyebrow}>{COPY.landing.eyebrow}</span>
      <h1 className={l.title}>
        {COPY.landing.titleStart}
        <span className={l.titleAccent}>{COPY.landing.titleEnd}</span>
      </h1>
      <p className={l.subtitle}>
        {COPY.landing.intro}
        <b className={l.subtitleMark}>{COPY.landing.resources}</b>
        {COPY.landing.and}
        <b className={l.subtitleMark}>{COPY.landing.time}</b>
        {COPY.landing.outro}
      </p>
      <form className="flex flex-col items-start gap-3" onSubmit={submit}>
        <div className={l.form}>
          <input
            className={theme.classes.field}
            value={callsign}
            maxLength={CALLSIGN.maxLength}
            placeholder={COPY.landing.callsignPlaceholder}
            aria-label={COPY.landing.callsignLabel}
            autoComplete="off"
            onChange={(event) => setCallsign(filterCallsignInput(event.target.value))}
          />
          <Button type="submit">{COPY.landing.start}</Button>
          {run && (
            <Button variant="secondary" onClick={resume}>
              {COPY.landing.continueRun}
            </Button>
          )}
        </div>
        {run && (
          <Label>
            {[
              world?.name ?? run.worldId.toUpperCase(),
              run.chapterTitle ?? COPY.chapter.kicker(run.chapterIndex),
              `${world?.unitLabel ?? ''} ${run.day}`.trim(),
            ].join(' · ')}
          </Label>
        )}
      </form>
      <p className={l.credit}>{COPY.landing.credit}</p>
      <div className={l.ticker} aria-hidden="true">
        <span className={l.tickerTrack}>{bundle.data.factsAndTips.ticker}</span>
      </div>
    </div>
  );
}
