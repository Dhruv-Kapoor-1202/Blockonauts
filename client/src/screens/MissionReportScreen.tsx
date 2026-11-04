/**
 * Mission report: the stamp (TERMINATED / COMPLETE), title and text, stats, all badges (earned or
 * not), what you learned, chapters cleared, retries, key decisions, the shared leaderboard and the
 * Switch rock / Fly again buttons. Player-provided text (callsign) is rendered as plain text.
 */
import type { AchievementDef, GameView, MissionReport } from '@commander/engine';
import type { ReactElement, ReactNode } from 'react';
import { COPY } from '../app/copy';
import { Button, Label } from '../components/primitives';
import { ThemeMenu } from '../components/ThemeMenu';
import type { LeaderboardState } from '../game/useGameSession';
import { useTheme } from '../themes/ThemeProvider';

/** Props of {@link MissionReportScreen}. */
export interface MissionReportScreenProps {
  view: GameView;
  callsign: string;
  achievements: readonly AchievementDef[];
  leaderboard: LeaderboardState;
  onSwitchRock: () => void;
  onFlyAgain: () => void;
}

interface SectionProps {
  title: string;
  children: ReactNode;
}

function Section({ title, children }: SectionProps): ReactElement {
  const { theme } = useTheme();
  return (
    <div className={theme.classes.report.section}>
      <h3 className={theme.classes.report.sectionTitle}>{title}</h3>
      {children}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }): ReactElement {
  const { theme } = useTheme();
  const r = theme.classes.report;
  return (
    <div className={r.stat}>
      <b className={r.statValue}>{value}</b>
      <small className={r.statLabel}>{label}</small>
    </div>
  );
}

function Board({ state }: { state: LeaderboardState }): ReactElement {
  const { theme } = useTheme();
  const r = theme.classes.report;
  if (state.status === 'ready') {
    const { rows, highlightId, source } = state.result;
    return (
      <Section title={source === 'local' ? COPY.report.boardLocal : COPY.report.board}>
        {rows.length === 0 ? (
          <p className={r.text}>{COPY.report.boardEmpty}</p>
        ) : (
          <ol className={r.board}>
            {rows.map((row) => (
              <li key={row.id} className={r.boardRow} data-me={row.id === highlightId}>
                <span>
                  {row.rank}. [{row.worldId.toUpperCase()}] {row.callsign}
                </span>
                <span>{row.score.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>
    );
  }
  return (
    <Section title={COPY.report.board}>
      <p className={r.text}>
        {state.status === 'loading' ? COPY.report.boardLoading : COPY.report.boardEmpty}
      </p>
    </Section>
  );
}

function Details({ report }: { report: MissionReport }): ReactElement {
  const { theme } = useTheme();
  const r = theme.classes.report;
  return (
    <>
      {report.lesson && (
        <Section title={COPY.report.lesson}>
          <p className={r.text}>{report.lesson}</p>
        </Section>
      )}
      {report.learned.length > 0 && (
        <Section title={COPY.report.learned}>
          <ul className={r.list}>
            {report.learned.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </Section>
      )}
      {report.keyDecisions.length > 0 && (
        <Section title={COPY.report.decisions}>
          <ul className={r.list}>
            {report.keyDecisions.map((decision) => (
              <li key={decision.flag}>{decision.text}</li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}

/** End of the mission. */
export function MissionReportScreen({
  view,
  callsign,
  achievements,
  leaderboard,
  onSwitchRock,
  onFlyAgain,
}: MissionReportScreenProps): ReactElement | null {
  const { theme } = useTheme();
  const r = theme.classes.report;
  const { report } = view;
  if (!report) return null;
  const won = report.result === 'win';
  return (
    <div className="flex h-full overflow-y-auto px-3.5 py-5" data-testid="report-screen">
      <ThemeMenu
        className="fixed right-3 top-3 z-[60]"
        label={COPY.settings.label}
        title={COPY.settings.themes}
      />
      <article className={r.root}>
        <span className={r.stamp} data-tone={won ? 'win' : 'loss'}>
          {won ? COPY.report.complete : COPY.report.terminated}
        </span>
        <Label>
          {COPY.report.caption} {report.worldName} // {callsign}
        </Label>
        <h2 className={r.title}>{report.title}</h2>
        <p className={r.text}>{report.text}</p>
        <div className={r.stats}>
          <Stat value={String(report.day)} label={COPY.report.survived(report.unitsLabel)} />
          <Stat value={report.score.toLocaleString()} label={COPY.report.score} />
          <Stat value={String(report.factsLogged)} label={COPY.report.notes} />
        </div>
        <div className={r.stats}>
          <Stat
            value={`${report.chaptersCleared}/${report.chaptersTotal}`}
            label={COPY.report.chapters}
          />
          <Stat value={String(report.retries)} label={COPY.report.retries} />
        </div>
        <Section title={COPY.report.badges}>
          <div className={r.badges}>
            {achievements.map((achievement) => (
              <span
                key={achievement.id}
                className={r.badge}
                data-earned={report.achievements.includes(achievement.id)}
                title={achievement.description}
              >
                {achievement.name}
              </span>
            ))}
          </div>
        </Section>
        <Details report={report} />
        <Board state={leaderboard} />
        <div className={r.actions}>
          <Button variant="secondary" onClick={onSwitchRock}>
            {COPY.report.switchRock}
          </Button>
          <Button onClick={onFlyAgain}>{COPY.report.flyAgain}</Button>
        </div>
      </article>
    </div>
  );
}
