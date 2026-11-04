/**
 * Core identifier and value types shared by every engine module.
 * Keeping them in one tiny file lets schemas, systems and views agree on the same vocabulary.
 */

/** The seven colony systems the commander must keep above zero. */
export const RESOURCE_KEYS = ['P', 'F', 'W', 'R', 'M', 'C', 'H'] as const;

/** One of the seven resource keys (Power, Food, Water, Shielding, Morale, Comms, Health). */
export type ResourceKey = (typeof RESOURCE_KEYS)[number];

/** The resource that absorbs penalties when other systems run critically low. */
export const HEALTH_KEY: ResourceKey = 'H';

/** Identifier of a world (e.g. `moon`, `mars`). Worlds are data plus one Strategy class. */
export type WorldId = string;

/** Identifier of a difficulty (e.g. `cadet`). */
export type DifficultyId = string;

/** Which of the two options of a card the player picked. */
export type Side = 'left' | 'right';

/** The two sides in display order. */
export const SIDES: readonly Side[] = ['left', 'right'];

/** A full set of resource values, always 0..100 once clamped. */
export type ResourceValues = Record<ResourceKey, number>;

/** A (possibly partial) set of resource changes. */
export type ResourceDelta = Partial<Record<ResourceKey, number>>;

/** Visual tone used by stickers and pops. */
export type Tone = 'neutral' | 'good' | 'bad' | 'time';

/** Minimum and maximum value of any resource. */
export const RESOURCE_MIN = 0;
/** Maximum value of any resource. */
export const RESOURCE_MAX = 100;

/** Marker `goto` target that keeps drawing interlude cards until the chapter goal is reached. */
export const INTERLUDES_TARGET = '$interludes';
