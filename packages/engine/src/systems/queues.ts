/**
 * Queues for time-delayed content: `ScheduledEffectQueue` holds `later` effects and
 * `FollowUpQueue` holds follow-up interlude cards. Both are keyed by absolute day and can be
 * rebased when a chapter resets the clock.
 */
import type { FollowUp, ScheduledEffect } from '../domain/snapshot.js';

/** Delayed resource effects (the prototype's `pending`). */
export class ScheduledEffectQueue {
  private items: ScheduledEffect[] = [];

  /** Adds an effect that lands on `entry.day`. */
  schedule(entry: ScheduledEffect): void {
    this.items.push(entry);
  }

  /** Removes and returns every effect due on or before `day`, in scheduling order. */
  takeDue(day: number): ScheduledEffect[] {
    const due = this.items.filter((item) => item.day <= day);
    this.items = this.items.filter((item) => item.day > day);
    return due;
  }

  /** Shifts all due days (used when the clock jumps between chapters). */
  rebase(shift: number): void {
    this.items = this.items.map((item) => ({ ...item, day: item.day + shift }));
  }

  /** Copy of the queue contents. */
  snapshot(): ScheduledEffect[] {
    return this.items.map((item) => ({ ...item, effects: { ...item.effects } }));
  }

  /** Replaces the queue contents. */
  restore(items: ScheduledEffect[]): void {
    this.items = items.map((item) => ({ ...item, effects: { ...item.effects } }));
  }
}

/** Follow-up interlude cards waiting for their day (the prototype's `queue`). */
export class FollowUpQueue {
  private items: FollowUp[] = [];

  /** Appends a follow-up. */
  push(entry: FollowUp): void {
    this.items.push(entry);
  }

  /** Puts a follow-up at the front so it is drawn first (used for injected night/storm cards). */
  unshift(entry: FollowUp): void {
    this.items.unshift(entry);
  }

  /** Removes and returns the first follow-up due on or before `day`. */
  takeFirstDue(day: number): FollowUp | undefined {
    const index = this.items.findIndex((item) => item.day <= day);
    return index < 0 ? undefined : this.items.splice(index, 1)[0];
  }

  /** Shifts all due days. */
  rebase(shift: number): void {
    this.items = this.items.map((item) => ({ ...item, day: item.day + shift }));
  }

  /** Copy of the queue contents. */
  snapshot(): FollowUp[] {
    return this.items.map((item) => ({ ...item }));
  }

  /** Replaces the queue contents. */
  restore(items: FollowUp[]): void {
    this.items = items.map((item) => ({ ...item }));
  }
}
