/**
 * TextTemplater: fills the `{D}`, `{Ds}`, `{P}` and `{nightIn}` placeholders used in card text.
 */

/** Values available to templates. */
export interface TemplateVars {
  unit: string;
  units: string;
  planet: string;
  /** Days until the next lunar night, or null when it is already night / not applicable. */
  nightIn: number | null;
}

/** Fallback shown when the next night is not a meaningful number. */
const NIGHT_FALLBACK = 'a few';

/** Stateless text templater. */
export class TextTemplater {
  /** Replaces every placeholder in `text`. */
  render(text: string, vars: TemplateVars): string {
    const nightIn =
      vars.nightIn !== null && vars.nightIn > 0 ? String(vars.nightIn) : NIGHT_FALLBACK;
    return text
      .replace(/\{Ds\}/g, vars.units)
      .replace(/\{D\}/g, vars.unit)
      .replace(/\{P\}/g, vars.planet)
      .replace(/\{nightIn\}/g, nightIn);
  }
}
