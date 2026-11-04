/**
 * Chapter intro and chapter result screens: the intro shows the chapter number, title, goal and
 * retry count before play; the result shows the ending (title, text, lesson) and one button whose
 * action follows `view.ending.next` (continue / retry / report).
 */
import type { GameView } from '@commander/engine';
import type { ReactElement } from 'react';
import { COPY } from '../app/copy';
import { Button, Label } from '../components/primitives';
import { ThemeMenu } from '../components/ThemeMenu';
import { useTheme } from '../themes/ThemeProvider';

/** Props of {@link ChapterIntroScreen}. */
export interface ChapterIntroScreenProps {
  view: GameView;
  onBegin: () => void;
}

/** Before a chapter starts. */
export function ChapterIntroScreen({ view, onBegin }: ChapterIntroScreenProps): ReactElement {
  const { theme } = useTheme();
  const c = theme.classes.chapter;
  const { chapter } = view;
  return (
    <div className={c.root} data-testid="chapter-intro-screen">
      <ThemeMenu
        className="fixed right-3 top-3 z-[60]"
        label={COPY.settings.label}
        title={COPY.settings.themes}
      />
      <section className={c.card}>
        <span className={c.kicker}>{COPY.chapter.kicker(chapter.index)}</span>
        <h2 className={c.title}>{chapter.title}</h2>
        <div>
          <Label>{COPY.chapter.goal}</Label>
          <p className={c.text}>{chapter.goal}</p>
        </div>
        <span className={c.meta}>{COPY.chapter.retries(chapter.retries, chapter.retryLimit)}</span>
        <div className={c.actions}>
          <Button onClick={onBegin}>{COPY.chapter.begin}</Button>
        </div>
      </section>
    </div>
  );
}

/** Props of {@link ChapterResultScreen}. */
export interface ChapterResultScreenProps {
  view: GameView;
  onNext: (next: 'continue' | 'retry' | 'report') => void;
}

/** After a chapter ends. */
export function ChapterResultScreen({
  view,
  onNext,
}: ChapterResultScreenProps): ReactElement | null {
  const { theme } = useTheme();
  const c = theme.classes.chapter;
  const { ending } = view;
  if (!ending) return null;
  const cleared = ending.outcome === 'advance';
  return (
    <div className={c.root} data-testid="chapter-result-screen">
      <ThemeMenu
        className="fixed right-3 top-3 z-[60]"
        label={COPY.settings.label}
        title={COPY.settings.themes}
      />
      <section className={c.card}>
        <span className={c.stamp} data-tone={cleared ? 'good' : 'bad'}>
          {cleared ? COPY.chapter.resultAdvance : COPY.chapter.resultRetry}
        </span>
        <span className={c.kicker}>{COPY.chapter.kicker(view.chapter.index)}</span>
        <h2 className={c.title}>{ending.title}</h2>
        <p className={c.text}>{ending.text}</p>
        {ending.lesson && (
          <div>
            <Label>{COPY.chapter.lesson}</Label>
            <p className={c.lesson}>{ending.lesson}</p>
          </div>
        )}
        {ending.retriesLeft !== null && ending.next === 'retry' && (
          <span className={c.meta}>
            {COPY.chapter.retries(view.chapter.retries, view.chapter.retryLimit)}
          </span>
        )}
        <div className={c.actions}>
          <Button onClick={() => onNext(ending.next)}>{COPY.chapter.next[ending.next]}</Button>
        </div>
      </section>
    </div>
  );
}
