/**
 * FieldNotes: the "FIELD NOTES" panel listing the facts learned so far, newest first, in a polite
 * live region so screen readers announce new notes. Theme recipes decide how many show on mobile
 * (the newest) versus desktop (a fading list).
 */
import type { ReactElement } from 'react';
import { useTheme } from '../themes/ThemeProvider';
import { cx } from './cx';

/** Props of {@link FieldNotes}. */
export interface FieldNotesProps {
  /** Notes, newest first. */
  notes: readonly string[];
  /** The note that just arrived (animated). */
  freshNote: string | null;
  /** Panel title. */
  title: string;
  /** Text shown before the first note. */
  emptyText: string;
  /** Grid placement classes. */
  className?: string;
}

/** Field notes panel. */
export function FieldNotes({
  notes,
  freshNote,
  title,
  emptyText,
  className,
}: FieldNotesProps): ReactElement {
  const { theme } = useTheme();
  const { classes } = theme;
  return (
    <section className={cx(classes.notes, className)} aria-label={title}>
      <span className={classes.notesHeader}>{title}</span>
      <ol className={classes.notesList} aria-live="polite">
        {notes.length === 0 ? (
          <li className={classes.notesItem}>{emptyText}</li>
        ) : (
          notes.map((note) => (
            <li key={note} className={classes.notesItem} data-new={note === freshNote}>
              {note}
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
