/**
 * Sticker and OfflineChip: the two floating notices. A sticker plays its entrance animation when
 * mounted (keyed per showing); the offline chip is a small tag that appears while the API is
 * unreachable. Both only apply theme recipes.
 */
import type { ReactElement } from 'react';
import type { ActiveSticker } from '../game/sticker-queue';
import { useTheme } from '../themes/ThemeProvider';

/** Props of {@link Sticker}. */
export interface StickerProps {
  sticker: ActiveSticker;
}

/** One sticker (the caller should key it by `sticker.id`). */
export function Sticker({ sticker }: StickerProps): ReactElement {
  const { theme } = useTheme();
  return (
    <div role="status" className={theme.classes.sticker[sticker.tone]}>
      {sticker.title}
      {sticker.subtitle && (
        <small className={theme.classes.stickerDetail}>{sticker.subtitle}</small>
      )}
    </div>
  );
}

/** Props of {@link OfflineChip}. */
export interface OfflineChipProps {
  label: string;
}

/** The "OFFLINE" tag. */
export function OfflineChip({ label }: OfflineChipProps): ReactElement {
  const { theme } = useTheme();
  return (
    <span role="status" className={theme.classes.offlineChip}>
      {label}
    </span>
  );
}
