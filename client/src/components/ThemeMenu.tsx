/**
 * ThemeMenu: the gear button that lists every registered theme and switches between them at
 * runtime. Choosing a theme only swaps classes/recipes in the provider; nothing remounts.
 */
import { useEffect, useId, useRef, useState, type ReactElement } from 'react';
import { useTheme } from '../themes/ThemeProvider';

/** Props of {@link ThemeMenu}. */
export interface ThemeMenuProps {
  /** Placement classes of the wrapper. */
  className?: string;
  /** Accessible label of the gear button. */
  label: string;
  /** Heading of the list. */
  title: string;
}

function GearIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm8.2 4.3v-1.6l-2-.6a6.6 6.6 0 0 0-.7-1.6l1-1.8-1.1-1.1-1.8 1a6.6 6.6 0 0 0-1.6-.7l-.6-2h-1.6l-.6 2a6.6 6.6 0 0 0-1.6.7l-1.8-1-1.1 1.1 1 1.8a6.6 6.6 0 0 0-.7 1.6l-2 .6v1.6l2 .6c.2.6.4 1.1.7 1.6l-1 1.8 1.1 1.1 1.8-1c.5.3 1 .5 1.6.7l.6 2h1.6l.6-2c.6-.2 1.1-.4 1.6-.7l1.8 1 1.1-1.1-1-1.8c.3-.5.5-1 .7-1.6z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Gear menu with the theme list. */
export function ThemeMenu({ className, label, title }: ThemeMenuProps): ReactElement {
  const { theme, themes, setThemeId } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (event instanceof MouseEvent && wrapper.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div className={className}>
      <div ref={wrapper} className="relative">
        <button
          type="button"
          className={theme.classes.menu.trigger}
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => setOpen((value) => !value)}
        >
          <GearIcon />
        </button>
        {open && (
          <div id={menuId} role="menu" aria-label={title} className={theme.classes.menu.panel}>
            <span className={theme.classes.menu.title}>{title}</span>
            {themes.map((option) => (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={option.id === theme.id}
                data-active={option.id === theme.id}
                className={theme.classes.menu.item}
                onClick={() => {
                  setThemeId(option.id);
                  setOpen(false);
                }}
              >
                {option.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
