/**
 * Minimal logging abstraction (Dependency Inversion): services log through `Logger`, so tests
 * inject a silent or recording implementation and production uses the console.
 */

/** Sink for diagnostic messages. */
export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

/** Writes to the process console with a level prefix. */
export class ConsoleLogger implements Logger {
  info(message: string): void {
    console.log(`[info] ${message}`);
  }

  warn(message: string): void {
    console.warn(`[warn] ${message}`);
  }

  error(message: string): void {
    console.error(`[error] ${message}`);
  }
}

/** Discards everything (default for tests). */
export class SilentLogger implements Logger {
  info(): void {}

  warn(): void {}

  error(): void {}
}

/** Remembers messages so tests can assert on them. */
export class RecordingLogger implements Logger {
  readonly messages: { level: 'info' | 'warn' | 'error'; message: string }[] = [];

  info(message: string): void {
    this.messages.push({ level: 'info', message });
  }

  warn(message: string): void {
    this.messages.push({ level: 'warn', message });
  }

  error(message: string): void {
    this.messages.push({ level: 'error', message });
  }
}
