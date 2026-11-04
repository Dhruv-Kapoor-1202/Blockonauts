/**
 * ResourcePool: the seven colony resources, clamped to 0..100. It reports what changed and
 * leaves announcing it to the session (so the pool stays a plain, testable value holder).
 */
import {
  HEALTH_KEY,
  RESOURCE_KEYS,
  RESOURCE_MAX,
  RESOURCE_MIN,
  type ResourceDelta,
  type ResourceKey,
  type ResourceValues,
} from '../domain/ids.js';

/** One resource that actually moved. */
export interface ResourceChange {
  key: ResourceKey;
  from: number;
  to: number;
}

/** Clamps a value to the legal resource range. */
export function clampResource(value: number): number {
  return Math.max(RESOURCE_MIN, Math.min(RESOURCE_MAX, value));
}

/** Holds and mutates resource values. */
export class ResourcePool {
  private values: ResourceValues;

  /** @param initial starting values (copied). */
  constructor(initial: ResourceValues) {
    this.values = { ...initial };
  }

  /** Current value of one resource. */
  get(key: ResourceKey): number {
    return this.values[key];
  }

  /** A copy of all values. */
  snapshot(): ResourceValues {
    return { ...this.values };
  }

  /** Replaces all values. */
  restore(values: ResourceValues): void {
    this.values = { ...values };
  }

  /** Adds a delta with clamping. @returns only the resources whose value changed. */
  apply(delta: ResourceDelta): ResourceChange[] {
    const changes: ResourceChange[] = [];
    for (const key of RESOURCE_KEYS) {
      const amount = delta[key];
      if (!amount) continue;
      const from = this.values[key];
      const to = clampResource(from + amount);
      this.values[key] = to;
      if (to !== from) changes.push({ key, from, to });
    }
    return changes;
  }

  /** The resource with the lowest value (first in key order on ties). */
  lowest(): ResourceKey {
    return RESOURCE_KEYS.reduce((low, key) => (this.values[key] < this.values[low] ? key : low));
  }

  /** The first resource that has reached zero, if any. */
  depleted(): ResourceKey | undefined {
    return RESOURCE_KEYS.find((key) => this.values[key] <= RESOURCE_MIN);
  }

  /** Whether any resource is below the threshold. */
  anyBelow(threshold: number): boolean {
    return RESOURCE_KEYS.some((key) => this.values[key] < threshold);
  }

  /** Whether every resource is at least the given value. */
  allAtLeast(minimum: number): boolean {
    return RESOURCE_KEYS.every((key) => this.values[key] >= minimum);
  }

  /** Non-health resources below the threshold (each one hurts crew health every day). */
  criticalCount(threshold: number): number {
    return RESOURCE_KEYS.filter((key) => key !== HEALTH_KEY && this.values[key] < threshold).length;
  }
}
