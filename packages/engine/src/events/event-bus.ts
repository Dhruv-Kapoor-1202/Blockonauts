/**
 * Typed Observer: a tiny synchronous publish/subscribe bus. The engine emits events; React (or
 * tests) subscribe. The engine never calls UI code directly.
 */

/** Any event must carry a string discriminator called `type`. */
export interface TypedEvent {
  type: string;
}

/** Handler for one specific event type. */
export type Handler<E extends TypedEvent, T extends E['type']> = (
  event: Extract<E, { type: T }>,
) => void;

/** Synchronous event bus over a discriminated union of events. */
export class EventBus<E extends TypedEvent> {
  private readonly handlers = new Map<string, Set<(event: never) => void>>();
  private readonly anyHandlers = new Set<(event: E) => void>();

  /** Subscribes to one event type. @returns an unsubscribe function. */
  on<T extends E['type']>(type: T, handler: Handler<E, T>): () => void {
    const set = this.handlers.get(type) ?? new Set();
    set.add(handler as (event: never) => void);
    this.handlers.set(type, set);
    return () => set.delete(handler as (event: never) => void);
  }

  /** Subscribes to every event. @returns an unsubscribe function. */
  onAny(handler: (event: E) => void): () => void {
    this.anyHandlers.add(handler);
    return () => this.anyHandlers.delete(handler);
  }

  /** Publishes an event to type-specific handlers, then to catch-all handlers. */
  emit(event: E): void {
    this.handlers.get(event.type)?.forEach((handler) => handler(event as never));
    this.anyHandlers.forEach((handler) => handler(event));
  }

  /** Removes all subscriptions. */
  clear(): void {
    this.handlers.clear();
    this.anyHandlers.clear();
  }
}
