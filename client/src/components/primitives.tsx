/**
 * Small presentational building blocks that only apply theme recipes: Panel, Button, Chip and
 * Heading/Label. No game logic and no theme-id checks.
 */
import type { ButtonHTMLAttributes, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { useTheme } from '../themes/ThemeProvider';
import { cx } from './cx';

/** Props of {@link Panel}. */
export interface PanelProps extends HTMLAttributes<HTMLElement> {
  /** Element to render (default `div`). */
  as?: 'div' | 'section' | 'article';
}

/** Boxed surface. */
export function Panel({ as: Tag = 'div', className, ...rest }: PanelProps): ReactElement {
  const { theme } = useTheme();
  return <Tag {...rest} className={cx(theme.classes.panel, className)} />;
}

/** Props of {@link Button}. */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual weight: the main action or an alternative. */
  variant?: 'primary' | 'secondary';
}

/** Themed button. */
export function Button({
  variant = 'primary',
  className,
  type = 'button',
  ...rest
}: ButtonProps): ReactElement {
  const { theme } = useTheme();
  return <button {...rest} type={type} className={cx(theme.classes.button[variant], className)} />;
}

/** Props of {@link Chip}. */
export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  /** Emphasised ("hot") style. */
  hot?: boolean;
}

/** Status chip. */
export function Chip({ hot = false, className, ...rest }: ChipProps): ReactElement {
  const { theme } = useTheme();
  return <span {...rest} data-hot={hot} className={cx(theme.classes.chip, className)} />;
}

/** Props of {@link Heading}. */
export interface HeadingProps {
  level?: 1 | 2 | 3;
  className?: string;
  children: ReactNode;
}

/** Themed section heading. */
export function Heading({ level = 2, className, children }: HeadingProps): ReactElement {
  const { theme } = useTheme();
  const Tag = `h${level}` as const;
  return <Tag className={cx(theme.classes.heading, className)}>{children}</Tag>;
}

/** Small caption label. */
export function Label({ className, ...rest }: HTMLAttributes<HTMLSpanElement>): ReactElement {
  const { theme } = useTheme();
  return <span {...rest} className={cx(theme.classes.label, className)} />;
}
